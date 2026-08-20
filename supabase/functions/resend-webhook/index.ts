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

const timingSafeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

async function verifySvix(opts: {
  secret: string;
  id: string;
  timestamp: string;
  signatureHeader: string;
  body: string;
}): Promise<boolean> {
  const { secret, id, timestamp, signatureHeader, body } = opts;
  if (!id || !timestamp || !signatureHeader) return false;

  // Reject stale/future timestamps (5 minute tolerance)
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > 300) return false;

  const keyB64 = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  let keyBytes: Uint8Array;
  try {
    keyBytes = Uint8Array.from(atob(keyB64), (c) => c.charCodeAt(0));
  } catch {
    keyBytes = new TextEncoder().encode(keyB64);
  }

  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = `${id}.${timestamp}.${body}`;
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signed));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));

  // Header format: "v1,<sig> v1,<sig2>"
  for (const part of signatureHeader.split(" ")) {
    const [version, sig] = part.split(",");
    if (version !== "v1" || !sig) continue;
    if (timingSafeEqual(sig, expected)) return true;
  }
  return false;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  const expected = Deno.env.get("RESEND_WEBHOOK_TOKEN");
  if (!expected) return json({ ok: false, error: "Webhook token not configured" }, 500);

  const url = new URL(req.url);
  const provided = url.searchParams.get("token") || req.headers.get("x-webhook-token") || "";
  if (provided !== expected) return json({ ok: false, error: "Unauthorized" }, 401);

  const rawBody = await req.text();

  const signingSecret = Deno.env.get("RESEND_WEBHOOK_SIGNING_SECRET");
  if (signingSecret) {
    const svixId = req.headers.get("svix-id") || "";
    const svixTimestamp = req.headers.get("svix-timestamp") || "";
    const svixSignature = req.headers.get("svix-signature") || "";

    const valid = await verifySvix({
      secret: signingSecret,
      id: svixId,
      timestamp: svixTimestamp,
      signatureHeader: svixSignature,
      body: rawBody,
    });

    if (!valid) return json({ ok: false, error: "Invalid signature" }, 401);
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
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
