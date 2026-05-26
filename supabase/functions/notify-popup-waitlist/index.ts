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
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const event_slug = String(body.event_slug || "").trim().slice(0, 100);
    const first_name = String(body.first_name || "").trim().slice(0, 100);
    const last_name = String(body.last_name || "").trim().slice(0, 100);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 255);

    if (
      !first_name || !last_name || !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !event_slug
    ) {
      return new Response(JSON.stringify({ error: "Please fill in all fields with valid information." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error: insertError } = await supabase
      .from("popup_waitlist")
      .insert({ event_slug, first_name, last_name, email });

    if (insertError) console.error("Insert error:", insertError);

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(JSON.stringify({ error: "Email not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const resend = new Resend(resendKey);
    const fullName = `${first_name} ${last_name}`;

    // Notify admin
    await resend.emails.send({
      from: "Club Choir <noreply@clubchoir.ca>",
      to: ["ailsa@clubchoir.ca"],
      replyTo: email,
      subject: `📝 New Pop-Up Waitlist Signup — ${escapeHtml(fullName)}`,
      html: `
        <div style="font-family: 'Nunito', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
          <h1 style="color: #333; font-size: 22px; margin-bottom: 16px;">New waitlist signup</h1>
          <div style="background: #f4f4f4; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Event:</strong> ${escapeHtml(event_slug)}</p>
            <p style="margin: 4px 0;"><strong>Name:</strong> ${escapeHtml(fullName)}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> ${escapeHtml(email)}</p>
          </div>
        </div>
      `,
    });

    // Confirmation to the person
    await resend.emails.send({
      from: "Club Choir <noreply@clubchoir.ca>",
      to: [email],
      subject: `🎶 You're on the list — we'll let you know about the next Club Choir Pop-Up!`,
      html: `
        <div style="font-family: 'Nunito', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #333;">
          <h1 style="font-size: 24px; margin-bottom: 16px;">Thanks, ${escapeHtml(first_name)}! 🎤</h1>
          <p style="font-size: 16px; line-height: 1.6;">
            Our current Pop-Up event is <strong>sold out</strong> — thank you for the amazing response!
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            You're now on the waitlist for our next Pop-Up Choir event. You'll be among the
            <strong>first to know</strong> as soon as we announce a new date — before tickets go on sale to everyone else.
          </p>
          <div style="background: #fff5ec; border-left: 4px solid #f97316; border-radius: 8px; padding: 16px 20px; margin: 24px 0;">
            <p style="margin: 0; font-size: 15px; line-height: 1.6;">
              Keep an eye on your inbox — we'll be in touch soon with details about the next session.
            </p>
          </div>
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
            You're receiving this because you joined the Pop-Up waitlist at clubchoir.ca.
          </p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-popup-waitlist:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
