import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-token, svix-id, svix-timestamp, svix-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

const firstString = (...vals: unknown[]): string | null => {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
    if (Array.isArray(v)) {
      const s = v.find((x) => typeof x === "string" && x.trim());
      if (s) return (s as string).trim();
    }
  }
  return null;
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  const expected = Deno.env.get("RESEND_WEBHOOK_TOKEN");
  if (!expected) return json({ ok: false, error: "Webhook token not configured" }, 500);

  const url = new URL(req.url);
  const provided = url.searchParams.get("token") || req.headers.get("x-webhook-token") || "";
  if (provided !== expected) return json({ ok: false, error: "Unauthorized" }, 401);

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON payload" }, 400);
  }
  if (!payload || typeof payload !== "object") {
    return json({ ok: false, error: "Payload must be a JSON object" }, 400);
  }

  const data = (payload.data && typeof payload.data === "object") ? payload.data : {};

  const eventType = firstString(payload.type, payload.event, payload.event_type, data.type) || "unknown";
  const emailId = firstString(data.email_id, data.id, payload.email_id, payload.id);
  const messageId =
    firstString(data.message_id, payload.message_id, data.headers?.["message-id"]) ||
    (Array.isArray(data.headers)
      ? firstString(data.headers.find((h: any) => String(h?.name).toLowerCase() === "message-id")?.value)
      : null);
  const recipient = firstString(data.to, payload.to, data.email, data.recipient);
  const subject = firstString(data.subject, payload.subject);
  const fromEmail = firstString(data.from, payload.from);
  const clickedUrl = firstString(data.click?.link, data.click?.url, data.link, data.url);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { error } = await supabase.from("resend_email_events").insert({
    event_type: eventType,
    email_id: emailId,
    message_id: messageId,
    recipient_email: recipient ? recipient.toLowerCase() : null,
    subject,
    from_email: fromEmail,
    clicked_url: clickedUrl,
    raw_payload: payload,
  });

  if (error) {
    console.error("Failed to insert resend event:", error.message);
    return json({ ok: false, error: "Failed to store event" }, 500);
  }

  return json({ ok: true });
});
