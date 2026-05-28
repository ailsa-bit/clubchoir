import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function buildHtml(greetingName: string) {
  const name = escapeHtml(greetingName);
  return `
<div style="font-family: 'Nunito', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #333; background: #ffffff;">
  <div style="text-align: center; margin-bottom: 28px;">
    <h1 style="font-family: 'Quicksand', Arial, sans-serif; color: #f97316; font-size: 28px; margin: 0; letter-spacing: 0.5px;">Club Choir</h1>
  </div>

  <h2 style="font-family: 'Quicksand', Arial, sans-serif; color: #333; font-size: 22px; margin: 0 0 20px;">
    Get Ready for an 80s Afternoon at Studio 77 🎤
  </h2>

  <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Hi ${name},</p>

  <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
    I'm so excited to see you at Studio 77!
  </p>

  <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
    The theme for the afternoon is the <strong>80s</strong>, so get ready for a feel-good mix of big energy, nostalgia, and classic songs we can sing at the top of our lungs.
  </p>

  <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
    Grab a drink or a bite before we begin. Studio 77 has a fantastic variety of sandwiches, hot and cold drinks, coffee, muffins, and baked goods. My personal favourite is the carrot cake cupcakes… mmmmm.
  </p>

  <div style="background: #fff5ec; border-left: 4px solid #f97316; border-radius: 8px; padding: 16px 20px; margin: 24px 0;">
    <p style="margin: 0 0 8px; font-size: 16px; line-height: 1.6;">
      <strong>Doors open at 2:30 PM</strong> so you can find your seat.
    </p>
    <p style="margin: 0; font-size: 16px; line-height: 1.6;">
      We'll be <strong>starting at 3:00 PM sharp</strong>, so please arrive a little early and get settled.
    </p>
  </div>

  <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
    Come ready to sing, laugh, let loose, and be part of that wonderful Club Choir magic where strangers become a choir in one afternoon.
  </p>

  <p style="font-size: 16px; line-height: 1.6; margin: 0 0 8px;">Can't wait to sing with you!</p>

  <p style="font-size: 16px; line-height: 1.6; margin: 0 0 4px;">Tra-la-la,</p>
  <p style="font-size: 16px; line-height: 1.6; margin: 0;"><strong>Ailsa</strong></p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
  <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
    Club Choir · <a href="https://clubchoir.ca" style="color: #f97316; text-decoration: none;">clubchoir.ca</a>
  </p>
</div>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) throw new Error("Admin access required");

    const body = await req.json().catch(() => ({}));
    const mode = body.mode === "send" ? "send" : "preview";
    const previewTo = body.preview_to || "ailsa@clubchoir.ca";

    const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);
    const subject = "Get Ready for an 80s Afternoon at Studio 77";
    const from = "Ailsa <ailsa@clubchoir.ca>";

    if (mode === "preview") {
      // Send single preview using first sample name "Anne"
      const html = buildHtml("Anne");
      const r = await resend.emails.send({
        from,
        to: [previewTo],
        replyTo: "ailsa@clubchoir.ca",
        subject: `[PREVIEW] ${subject}`,
        html,
      });
      return new Response(JSON.stringify({ ok: true, mode, result: r }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // SEND mode: fetch reservations, dedupe by email, combine names
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: rows, error } = await admin
      .from("popup_ticket_reservations")
      .select("first_name, email")
      .eq("event_slug", "studio-77-may-31");
    if (error) throw error;

    const extras: { first_name: string; email: string }[] = Array.isArray(body.extras) ? body.extras : [];
    const allRows = [...(rows || []), ...extras];

    const byEmail = new Map<string, string[]>();
    for (const r of allRows) {
      const email = String(r.email).trim().toLowerCase();
      if (!email) continue;
      const arr = byEmail.get(email) || [];
      arr.push(String(r.first_name).trim());
      byEmail.set(email, arr);
    }

    const results: { email: string; ok: boolean; error?: string }[] = [];
    const entries = Array.from(byEmail.entries());
    const batchSize = 5;
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      await Promise.all(batch.map(async ([email, names]) => {
        const uniqueNames = Array.from(new Set(names));
        const greeting = uniqueNames.length === 1
          ? uniqueNames[0]
          : uniqueNames.slice(0, -1).join(", ") + " & " + uniqueNames[uniqueNames.length - 1];
        try {
          await resend.emails.send({
            from,
            to: [email],
            replyTo: "ailsa@clubchoir.ca",
            subject,
            html: buildHtml(greeting),
          });
          results.push({ email, ok: true });
        } catch (e: any) {
          results.push({ email, ok: false, error: e?.message || String(e) });
        }
      }));
    }

    return new Response(JSON.stringify({ ok: true, mode, count: results.length, results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("send-studio77-email error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
