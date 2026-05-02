import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const first_name = String(body.first_name || "").trim().slice(0, 100);
    const last_name = String(body.last_name || "").trim().slice(0, 100);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 255);
    const message = String(body.message || "").trim().slice(0, 2000);

    if (!first_name || !last_name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Please fill in your first name, last name, and a valid email." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Insert into DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { error: insertError } = await supabase
      .from("hudson_session_signups")
      .insert({ first_name, last_name, email, notes: message || null });

    if (insertError) {
      console.error("Insert error:", insertError);
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(JSON.stringify({ error: "Email not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const resend = new Resend(resendKey);
    const fullName = `${first_name} ${last_name}`;

    // 1) Notify admin
    await resend.emails.send({
      from: "Club Choir <noreply@clubchoir.ca>",
      to: ["ailsa@clubchoir.ca"],
      replyTo: email,
      subject: message ? "🎶 New Hudson Session Signup (with question)" : "🎶 New Hudson Session Interest",
      html: `
        <div style="font-family: 'Nunito', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
          <h1 style="color: #333; font-size: 24px; margin-bottom: 16px;">New Hudson Session Signup</h1>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Someone just expressed interest in the Hudson summer session:
          </p>
          <div style="background: #f4f4f4; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Name:</strong> ${escapeHtml(fullName)}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> ${escapeHtml(email)}</p>
          </div>
          ${message ? `
          <div style="background: #fff5ec; border-left: 4px solid #f97316; border-radius: 8px; padding: 16px 20px; margin: 16px 0;">
            <p style="margin: 0 0 6px; font-size: 14px; font-weight: bold; color: #c2410c;">Their question:</p>
            <p style="margin: 0; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(message)}</p>
          </div>
          ` : ""}
          <p style="color: #333; font-size: 14px; line-height: 1.6;">
            They've been sent the e-transfer instructions. Once payment is received, mark them as registered.${message ? " Reply to this email to answer their question directly." : ""}
          </p>
        </div>
      `,
    });


    // 2) Confirmation email to the prospect with e-transfer instructions
    await resend.emails.send({
      from: "Club Choir <noreply@clubchoir.ca>",
      to: [email],
      subject: "🎶 Your spot at Hudson Club Choir — next steps",
      html: `
        <div style="font-family: 'Nunito', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #333;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="https://vbbfpzszmtwhydhpgtgj.supabase.co/storage/v1/object/public/email-assets/club-choir-logo.png?v=1" alt="Club Choir" width="120" style="display: inline-block;" />
          </div>
          <h1 style="font-size: 24px; margin-bottom: 16px;">Welcome aboard, ${escapeHtml(first_name)}! 🎤</h1>
          <p style="font-size: 16px; line-height: 1.6;">
            Thank you so much for your interest in joining the brand-new Hudson Club Choir session.
            We can't wait to sing with you!
          </p>

          <div style="background: #fff5ec; border-left: 4px solid #f97316; border-radius: 8px; padding: 16px 20px; margin: 24px 0;">
            <h2 style="margin: 0 0 8px; font-size: 18px; color: #c2410c;">Session details</h2>
            <p style="margin: 4px 0; font-size: 15px;"><strong>Where:</strong> Kingfisher Pub, 84 Cameron, Hudson, QC J0P 1H0</p>
            <p style="margin: 4px 0; font-size: 15px;"><strong>When:</strong> Mondays, 7:00–8:30 PM</p>
            <p style="margin: 4px 0; font-size: 15px;"><strong>Dates:</strong> May 18 – August 17, 2026 (14 weeks)</p>
            <p style="margin: 4px 0; font-size: 15px;"><strong>Cost:</strong> $280 for the full 14-week session</p>
          </div>

          <h2 style="font-size: 18px; margin-top: 28px; margin-bottom: 8px;">💸 How to pay (Interac e-Transfer)</h2>
          <div style="background: #f4f4f4; border-radius: 8px; padding: 16px 20px; margin: 8px 0 24px;">
            <p style="margin: 4px 0; font-size: 15px;"><strong>Send to:</strong> ailsa@clubchoir.ca</p>
            <p style="margin: 4px 0; font-size: 15px;"><strong>Amount:</strong> $280 CAD</p>
            <p style="margin: 4px 0; font-size: 15px;"><strong>Security question:</strong> choir name</p>
            <p style="margin: 4px 0; font-size: 15px;"><strong>Answer:</strong> clubchoir <em>(one word, all lowercase)</em></p>
          </div>

          <div style="background: #fef3c7; border-radius: 8px; padding: 16px 20px; margin: 16px 0;">
            <p style="margin: 0; font-size: 15px; line-height: 1.6;">
              ⚠️ <strong>Please note:</strong> your spot is not officially registered until your payment is received.
              Spaces are limited and will be filled on a first-come, first-served basis — so the sooner the better!
            </p>
          </div>

          <p style="font-size: 16px; line-height: 1.6;">
            Once your e-transfer arrives, we'll send you a confirmation email and you'll be all set
            for the first rehearsal on <strong>Monday, May 18</strong>.
          </p>

          <p style="font-size: 16px; line-height: 1.6;">
            Any questions? Just reply to this email or write to
            <a href="mailto:ailsa@clubchoir.ca" style="color: #f97316;">ailsa@clubchoir.ca</a>.
          </p>

          <p style="font-size: 16px; line-height: 1.6; margin-top: 24px;">
            Tra-la-la!<br/>
            — Ailsa & the Club Choir team
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
          <p style="color: #999; font-size: 12px; text-align: center;">
            You're receiving this because you signed up for the Hudson session at clubchoir.ca.
          </p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-hudson-signup:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
