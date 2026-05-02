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

const PRICE_PER_TICKET = 15;

// Event metadata keyed by event_slug
const EVENTS: Record<string, {
  name: string;
  date: string;
  time: string;
  venue: string;
  address: string;
}> = {
  "studio-77-may-31": {
    name: "Club Choir Pop-Up at Studio 77",
    date: "Sunday, May 31, 2026",
    time: "3:00 PM – 5:00 PM",
    venue: "Studio 77",
    address: "271 Chem. du Bord-du-Lac-Lakeshore, Pointe-Claire, QC H9S 4L1",
  },
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const event_slug = String(body.event_slug || "").trim().slice(0, 100);
    const first_name = String(body.first_name || "").trim().slice(0, 100);
    const last_name = String(body.last_name || "").trim().slice(0, 100);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 255);
    const ticket_count = Number(body.ticket_count);

    if (
      !first_name || !last_name || !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !Number.isInteger(ticket_count) || ticket_count < 1 || ticket_count > 4 ||
      !event_slug || !EVENTS[event_slug]
    ) {
      return new Response(JSON.stringify({ error: "Please fill in all fields with valid information." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const event = EVENTS[event_slug];
    const totalAmount = PRICE_PER_TICKET * ticket_count;

    // Insert into DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { error: insertError } = await supabase
      .from("popup_ticket_reservations")
      .insert({ event_slug, first_name, last_name, email, ticket_count });

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
    const ticketLabel = ticket_count === 1 ? "1 ticket" : `${ticket_count} tickets`;

    // 1) Notify admin
    await resend.emails.send({
      from: "Club Choir <noreply@clubchoir.ca>",
      to: ["ailsa@clubchoir.ca"],
      replyTo: email,
      subject: `🎟️ New Pop-Up Reservation — ${event.name} (${ticketLabel})`,
      html: `
        <div style="font-family: 'Nunito', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
          <h1 style="color: #333; font-size: 24px; margin-bottom: 16px;">New Pop-Up Reservation</h1>
          <div style="background: #f4f4f4; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Event:</strong> ${escapeHtml(event.name)}</p>
            <p style="margin: 4px 0;"><strong>Date:</strong> ${escapeHtml(event.date)} · ${escapeHtml(event.time)}</p>
            <p style="margin: 4px 0;"><strong>Name:</strong> ${escapeHtml(fullName)}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p style="margin: 4px 0;"><strong>Tickets:</strong> ${ticket_count}</p>
            <p style="margin: 4px 0;"><strong>Total due:</strong> $${totalAmount} CAD</p>
          </div>
          <p style="color: #333; font-size: 14px; line-height: 1.6;">
            They've been sent the e-transfer instructions. Once payment is received, mark them as paid in the database.
          </p>
        </div>
      `,
    });

    // 2) Confirmation email to the attendee with payment instructions
    await resend.emails.send({
      from: "Club Choir <noreply@clubchoir.ca>",
      to: [email],
      subject: `🎶 Your spot at ${event.name} — payment instructions`,
      html: `
        <div style="font-family: 'Nunito', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #333;">
          <h1 style="font-size: 24px; margin-bottom: 16px;">Thanks, ${escapeHtml(first_name)}! 🎤</h1>
          <p style="font-size: 16px; line-height: 1.6;">
            We've received your reservation for <strong>${escapeHtml(event.name)}</strong>. We can't wait to sing with you!
          </p>

          <div style="background: #fff5ec; border-left: 4px solid #f97316; border-radius: 8px; padding: 16px 20px; margin: 24px 0;">
            <h2 style="margin: 0 0 8px; font-size: 18px; color: #c2410c;">Event details</h2>
            <p style="margin: 4px 0; font-size: 15px;"><strong>Where:</strong> ${escapeHtml(event.venue)}, ${escapeHtml(event.address)}</p>
            <p style="margin: 4px 0; font-size: 15px;"><strong>When:</strong> ${escapeHtml(event.date)}</p>
            <p style="margin: 4px 0; font-size: 15px;"><strong>Time:</strong> ${escapeHtml(event.time)}</p>
            <p style="margin: 4px 0; font-size: 15px;"><strong>Tickets reserved:</strong> ${ticket_count} ($${PRICE_PER_TICKET} each)</p>
            <p style="margin: 4px 0; font-size: 15px;"><strong>Total to pay:</strong> $${totalAmount} CAD</p>
          </div>

          <h2 style="font-size: 18px; margin-top: 28px; margin-bottom: 8px;">💸 How to pay (Interac e-Transfer)</h2>
          <div style="background: #f4f4f4; border-radius: 8px; padding: 16px 20px; margin: 8px 0 24px;">
            <p style="margin: 4px 0; font-size: 15px;"><strong>Send to:</strong> ailsa@clubchoir.ca</p>
            <p style="margin: 4px 0; font-size: 15px;"><strong>Amount:</strong> $${totalAmount} CAD</p>
            <p style="margin: 4px 0; font-size: 15px;"><strong>Security question:</strong> choir name</p>
            <p style="margin: 4px 0; font-size: 15px;"><strong>Answer:</strong> clubchoir <em>(one word, all lowercase)</em></p>
          </div>

          <div style="background: #fef3c7; border-radius: 8px; padding: 16px 20px; margin: 16px 0;">
            <p style="margin: 0; font-size: 15px; line-height: 1.6;">
              ⚠️ <strong>Important:</strong> Your spot is not officially secured until we confirm your payment.
              Spots are limited and filled on a first-come, first-served basis — the sooner the better!
            </p>
          </div>

          <p style="font-size: 16px; line-height: 1.6;">
            Once your e-transfer arrives, we'll send you a confirmation that your spot is locked in.
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
            You're receiving this because you reserved a spot at clubchoir.ca.
          </p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-popup-reservation:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
