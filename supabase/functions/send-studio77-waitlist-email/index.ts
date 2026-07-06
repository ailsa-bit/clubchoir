import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const buildHtml = (firstName: string) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>A spot just opened up at Studio 77</title>
<style>
  body { margin:0; padding:0; background:#ffffff; font-family: 'Nunito', Arial, sans-serif; color:#2a2a2a; line-height:1.6; }
  .wrap { max-width: 600px; margin: 0 auto; padding: 32px 24px; }
  h1 { font-family: 'Quicksand', Arial, sans-serif; font-size: 26px; color:#1a1a1a; margin: 0 0 18px; }
  p { font-size: 16px; margin: 0 0 16px; }
  .cta { display:inline-block; background:#F26B3A; color:#ffffff !important; text-decoration:none; padding: 14px 28px; border-radius: 999px; font-weight: 700; font-family: 'Quicksand', Arial, sans-serif; }
  .highlight { background:#FFF1EA; border-left: 4px solid #F26B3A; padding: 14px 18px; border-radius: 8px; margin: 0 0 20px; }
  .footer { font-size: 13px; color:#777; margin-top: 28px; }
</style></head>
<body>
  <div class="wrap">
    <h1>Hi ${escapeHtml(firstName)},</h1>

    <p>Great news — we've just opened up <strong>10 more spots</strong> for our Pop-Up Choir at <strong>Studio 77</strong> on <strong>Sunday, May 31 at 3:00 PM</strong>.</p>

    <div class="highlight">
      <p style="margin:0;"><strong>Because you're on the waitlist, you get first access</strong> before we release these tickets to the general public tomorrow morning.</p>
    </div>

    <p>Tickets are <strong>$15 per person</strong> — grab yours before they're gone:</p>

    <p style="text-align:center; margin: 24px 0;">
      <a class="cta" href="https://clubchoir.ca/popup/studio-77">Reserve my spot</a>
    </p>

    <p>These 10 seats are all we can add, so don't wait too long. Any tickets left after tomorrow morning will go out to everyone else.</p>

    <p>Can't wait to sing with you!</p>

    <p>Tra-la-la,<br/>Ailsa</p>

    <p class="footer">Club Choir · <a href="mailto:ailsa@clubchoir.ca" style="color:#F26B3A;">ailsa@clubchoir.ca</a></p>
  </div>
</body></html>`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const { data: roleRow } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const preview = body?.preview === true;

    const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);
    const from = "Ailsa <ailsa@clubchoir.ca>";
    const subject = "Good news — a spot just opened up at Studio 77 🎶";

    if (preview) {
      const r = await resend.emails.send({
        from,
        to: ["ailsa@clubchoir.ca"],
        replyTo: "ailsa@clubchoir.ca",
        subject: `[PREVIEW] ${subject}`,
        html: buildHtml("Anne"),
      });
      return new Response(JSON.stringify({ preview: true, result: r }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: rows, error } = await supabase
      .from("popup_waitlist")
      .select("first_name, email")
      .eq("event_slug", "studio-77-may-31");

    if (error) throw error;

    // Dedupe by lowercased email, keep first first_name
    const map = new Map<string, string>();
    for (const r of rows ?? []) {
      const email = (r.email || "").trim().toLowerCase();
      if (!email || map.has(email)) continue;
      map.set(email, (r.first_name || "").trim() || "there");
    }

    const results: any[] = [];
    let sent = 0;
    let failed = 0;

    for (const [email, firstName] of map) {
      try {
        const r = await resend.emails.send({
          from,
          to: [email],
          replyTo: "ailsa@clubchoir.ca",
          subject,
          html: buildHtml(firstName),
        });
        if ((r as any)?.error) {
          failed++;
          results.push({ email, error: (r as any).error });
        } else {
          sent++;
          results.push({ email, ok: true });
        }
      } catch (e: any) {
        failed++;
        results.push({ email, error: e.message });
      }
      // small pause to be gentle on rate limits
      await new Promise((res) => setTimeout(res, 200));
    }

    return new Response(JSON.stringify({ total: map.size, sent, failed, results }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error("send-studio77-waitlist-email error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
