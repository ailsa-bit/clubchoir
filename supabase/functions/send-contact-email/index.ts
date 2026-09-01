import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ContactRequest {
  name: string;
  email: string;
  location: string;
  message: string;
  subject?: string;
}

// Per-location session info (kept in sync with src/data/choirLocations.ts)
const LOCATION_INFO: Record<
  string,
  { city: string; day: string; time: string; dates: string; venue: string }
> = {
  Montreal: {
    city: "Montreal",
    day: "Mondays",
    time: "7:00–8:30 PM",
    dates: "Sept 7 – Dec 7, 2026",
    venue: "Kensington Presbyterian Church, 6225 Av. Godfrey, Montréal",
  },
  Hudson: {
    city: "Hudson",
    day: "Tuesdays",
    time: "7:00–8:30 PM",
    dates: "Sept 8 – Dec 8, 2026",
    venue: "The Hudson Legion, 57 Beach Road, Hudson",
  },
  "Saint-Hubert": {
    city: "Saint-Hubert",
    day: "Wednesdays",
    time: "7:00–8:30 PM",
    dates: "Sept 9 – Dec 9, 2026",
    venue: "St-Gabriel Catholic Church, 5070 Rue Gilbert, Saint-Hubert",
  },
  "Pointe-Claire": {
    city: "Pointe-Claire",
    day: "Thursdays",
    time: "7:00–8:30 PM",
    dates: "Sept 10 – Dec 10, 2026",
    venue: "Valois United Church, 70 Av. Belmont, Pointe-Claire",
  },
};

function getLocationInfo(location: string) {
  // location is shaped like "Hudson – Monday"; match by city prefix
  for (const key of Object.keys(LOCATION_INFO)) {
    if (location.toLowerCase().startsWith(key.toLowerCase())) {
      return LOCATION_INFO[key];
    }
  }
  return null;
}

const escapeHtml = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const resend = new Resend(resendKey);
    const { name, email, location, message, subject }: ContactRequest = await req.json();

    if (!name || !email || !location || !message) {
      throw new Error("Missing required fields: name, email, location, message");
    }

    // 1. Notify admin
    const adminEmail = await resend.emails.send({
      from: "Club Choir <noreply@clubchoir.ca>",
      to: ["ailsa@clubchoir.ca"],
      subject: subject || "Try a Session",
      replyTo: email,
      html: `
        <h2>Try a Session Request</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Preferred Location:</strong> ${escapeHtml(location)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
      `,
    });

    // 2. Send confirmation to the registrant
    const info = getLocationInfo(location);
    const sessionBlock = info
      ? `
        <h3 style="font-family: 'Quicksand', Arial, sans-serif; color:#1a1a1a; margin: 24px 0 8px;">
          Club Choir ${escapeHtml(info.city)} — session details
        </h3>
        <ul style="font-family: 'Nunito', Arial, sans-serif; color:#333; line-height:1.6; padding-left: 18px;">
          <li><strong>When:</strong> ${escapeHtml(info.day)}, ${escapeHtml(info.time)}</li>
          <li><strong>Dates:</strong> ${escapeHtml(info.dates)}</li>
          <li><strong>Where:</strong> ${escapeHtml(info.venue)}</li>
        </ul>
      `
      : `
        <p style="font-family: 'Nunito', Arial, sans-serif; color:#333;">
          You picked: <strong>${escapeHtml(location)}</strong>. We'll be in touch with the details.
        </p>
      `;

    const FRENCH_DAYS: Record<string, string> = {
      Mondays: "le lundi",
      Tuesdays: "le mardi",
      Wednesdays: "le mercredi",
      Thursdays: "le jeudi",
    };
    const sessionBlockFr = info
      ? `
        <h3 style="font-family: 'Quicksand', Arial, sans-serif; color:#1a1a1a; margin: 24px 0 8px;">
          Club Choir ${escapeHtml(info.city)} — détails de la session
        </h3>
        <ul style="font-family: 'Nunito', Arial, sans-serif; color:#333; line-height:1.6; padding-left: 18px;">
          <li><strong>Quand :</strong> ${escapeHtml(FRENCH_DAYS[info.day] ?? info.day)}, ${escapeHtml(info.time)}</li>
          <li><strong>Dates :</strong> ${escapeHtml(info.dates)}</li>
          <li><strong>Où :</strong> ${escapeHtml(info.venue)}</li>
        </ul>
      `
      : `
        <p style="font-family: 'Nunito', Arial, sans-serif; color:#333;">
          Vous avez choisi : <strong>${escapeHtml(location)}</strong>. Nous vous enverrons les détails sous peu.
        </p>
      `;

    const firstName = name.trim().split(/\s+/)[0] || name;

    await resend.emails.send({
      from: "Club Choir <noreply@clubchoir.ca>",
      to: [email],
      replyTo: "ailsa@clubchoir.ca",
      subject: `You're on the list to try Club Choir ${info?.city ?? ""}`.trim(),
      html: `
        <div style="font-family: 'Nunito', Arial, sans-serif; color:#1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
          <h1 style="font-family: 'Quicksand', Arial, sans-serif; font-size: 22px; margin: 0 0 12px;">
            Hi ${escapeHtml(firstName)}, thanks for reaching out! 🎵
          </h1>
          <p style="line-height:1.6; color:#333;">
            We're thrilled you're interested in trying Club Choir. Here's everything you need to know for the location you selected:
          </p>
          ${sessionBlock}
          <p style="line-height:1.6; color:#333; margin-top: 20px;">
            <strong>🎤 You're invited to join us for opening night!</strong>
          </p>
          <p style="line-height:1.6; color:#333;">
            To reserve your spot on the guest list, please email Ailsa directly at
            <a href="mailto:ailsa@clubchoir.ca">ailsa@clubchoir.ca</a>. Once you're on the list, you'll receive a follow-up email with all the details about what to expect, what to bring, and where to go.
          </p>
          <p style="line-height:1.6; color:#333;">
            After the first night, if it feels like the right fit, we'd love to have you join us for the full session.
          </p>
          <p style="line-height:1.6; color:#333; margin-top: 24px;">
            Looking forward to meeting you and singing together!<br/>
            <strong>Ailsa & the Club Choir Team</strong>
          </p>
          <hr style="border:none; border-top: 1px solid #eee; margin: 28px 0;" />
          <p style="font-size: 13px; color:#555; line-height:1.5;">
            <strong>En français :</strong><br/>
            Bonjour ${escapeHtml(firstName)} ! Nous sommes ravies que vous souhaitiez essayer Club Choir. Vous êtes invité(e) à notre soirée d'ouverture. Veuillez confirmer votre présence en écrivant directement à Ailsa à <a href="mailto:ailsa@clubchoir.ca">ailsa@clubchoir.ca</a> afin d'être ajouté(e) à la liste d'invités. Au plaisir de chanter avec vous !
          </p>
          <p style="font-size: 12px; color:#888; margin-top: 16px;">
            Club Choir · <a href="https://clubchoir.ca" style="color:#888;">clubchoir.ca</a>
          </p>
        </div>
      `,
    });

    return new Response(JSON.stringify(adminEmail), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
