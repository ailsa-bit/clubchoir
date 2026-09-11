import { emailButton } from "../_shared/email-button.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { to } = await req.json();
    if (!to || typeof to !== "string") {
      return new Response(JSON.stringify({ error: "to required" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    const { data: userData } = await supabase.auth.getUser(token);
    const user = userData.user;
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    const { data: roleRow } = await supabase
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });

    const reservationsUrl = "https://clubchoir.ca/popup-reservations";
    const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

    await resend.emails.send({
      from: "Club Choir <noreply@clubchoir.ca>",
      to: [to],
      replyTo: "ailsa@clubchoir.ca",
      subject: "🎟️ Club Choir — Check-in dashboard link",
      html: `
        <div style="font-family:'Nunito',Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#333;">
          <h1 style="font-family:'Quicksand',sans-serif;font-size:22px;margin:0 0 12px;">Check-in dashboard 🎫</h1>
          <p style="font-size:16px;line-height:1.6;">
            Here's your link to the pop-up event check-in dashboard. Open it on the device you'll use at the door — you can mark people as paid, resend tickets, and see who's checked in.
          </p>
          <p style="text-align:center;margin:28px 0;">
            <a href="${reservationsUrl}" style="background:#f97316;color:#fff;padding:14px 26px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block;">Open Check-in Dashboard</a>
          </p>
          <p style="font-size:13px;color:#777;word-break:break-all;text-align:center;">
            Or paste this in your browser:<br/><a href="${reservationsUrl}" style="color:#f97316;">${reservationsUrl}</a>
          </p>
          <p style="font-size:14px;color:#666;margin-top:24px;">
            You'll need to sign in with your admin account. To check in a guest, scan the QR code on their ticket — that opens their individual check-in screen.
          </p>
          <p style="font-size:14px;color:#666;">— Club Choir</p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error("send-checkin-link error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
