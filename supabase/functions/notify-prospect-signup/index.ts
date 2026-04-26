import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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
    const locations: string[] = Array.isArray(body.locations)
      ? body.locations.map((l: unknown) => String(l).slice(0, 100)).slice(0, 10)
      : [];

    if (!first_name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(JSON.stringify({ error: "Email not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const resend = new Resend(resendKey);
    const fullName = `${first_name}${last_name ? " " + last_name : ""}`;
    const locationsText = locations.length ? locations.join(", ") : "Not specified";

    // 1) Notify admin
    await resend.emails.send({
      from: "Club Choir <noreply@clubchoir.ca>",
      to: ["ailsa@clubchoir.ca"],
      subject: "✨ New Club Choir Subscriber",
      html: `
        <div style="font-family: 'Nunito', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
          <h1 style="color: #333; font-size: 24px; margin-bottom: 16px;">New Email Subscriber</h1>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Someone just joined the Club Choir mailing list:
          </p>
          <div style="background: #f4f4f4; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Name:</strong> ${escapeHtml(fullName)}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p style="margin: 4px 0;"><strong>Locations of interest:</strong> ${escapeHtml(locationsText)}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
          <p style="color: #999; font-size: 12px; text-align: center;">Club Choir Admin Notification</p>
        </div>
      `,
    });

    // 2) Welcome email to the subscriber
    await resend.emails.send({
      from: "Club Choir <noreply@clubchoir.ca>",
      to: [email],
      subject: "🎶 Welcome to the Club Choir mailing list!",
      html: `
        <div style="font-family: 'Nunito', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
          <h1 style="color: #333; font-size: 24px; margin-bottom: 16px;">Welcome to Club Choir, ${escapeHtml(first_name)}! 🎤</h1>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Thanks for joining our mailing list. We're so glad you're curious about Club Choir!
          </p>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Here's what you can expect from us:
          </p>
          <ul style="color: #333; font-size: 16px; line-height: 1.8; padding-left: 20px;">
            <li>📅 The latest information on Club Choir events</li>
            <li>🎵 Early registration emails so you can preview the songs in our next session</li>
            <li>🎉 Invitations to open houses and pop-up summer choir events</li>
            <li>🍂 First dibs on signing up for the Fall session</li>
          </ul>
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin-top: 24px;">
            <strong>Locations you're interested in:</strong> ${escapeHtml(locationsText)}
          </p>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            In the meantime, feel free to follow us on
            <a href="https://www.facebook.com/clubchoir" style="color: #e85d75;">Facebook</a>
            or visit <a href="https://clubchoir.ca" style="color: #e85d75;">clubchoir.ca</a> to learn more.
          </p>
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin-top: 24px;">
            Tra-la-la!<br/>
            — Ailsa & the Club Choir team
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
          <p style="color: #999; font-size: 12px; text-align: center;">
            You're receiving this because you signed up at clubchoir.ca.<br/>
            To unsubscribe, just reply to this email and let us know.
          </p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-prospect-signup:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
