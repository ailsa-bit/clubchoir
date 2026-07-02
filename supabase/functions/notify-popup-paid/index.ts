import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import QRCode from "npm:qrcode@1.5.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const PRICE_PER_TICKET = 15;

const EVENTS: Record<string, { name: string; date: string; time: string; venue: string; address: string }> = {
  "studio-77-may-31": {
    name: "Club Choir Pop-Up at Studio 77",
    date: "Sunday, May 31, 2026",
    time: "3:00 PM – 5:00 PM",
    venue: "Studio 77",
    address: "271 Chem. du Bord-du-Lac-Lakeshore, Pointe-Claire, QC H9S 4L1",
  },
  "sing-for-the-herd": {
    name: "Sing for the Herd",
    date: "Sunday, August 16, 2026",
    time: "2:00 PM – 4:00 PM",
    venue: "Parc Terra Cotta",
    address: "100 Terra Cotta Ave, Pointe-Claire, QC",
  },
};

const SITE_URL = "https://clubchoir.ca";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { reservation_id, resend: forceResend = false } = await req.json();
    if (!reservation_id || typeof reservation_id !== "string") {
      return new Response(JSON.stringify({ error: "reservation_id required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Auth: require admin
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    const { data: userData } = await supabase.auth.getUser(token);
    const user = userData.user;
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    const { data: roleRow } = await supabase
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });

    const { data: r, error: fetchErr } = await supabase
      .from("popup_ticket_reservations")
      .select("*")
      .eq("id", reservation_id)
      .maybeSingle();
    if (fetchErr || !r) {
      return new Response(JSON.stringify({ error: "Reservation not found" }), {
        status: 404, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (r.paid_email_sent_at && !forceResend) {
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const event = EVENTS[r.event_slug];
    if (!event) {
      return new Response(JSON.stringify({ error: "Unknown event" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Ensure ticket token
    let ticketToken = r.ticket_token as string | null;
    if (!ticketToken) {
      ticketToken = crypto.randomUUID();
      const { error: updErr } = await supabase
        .from("popup_ticket_reservations")
        .update({ ticket_token: ticketToken })
        .eq("id", r.id);
      if (updErr) console.error("token update err", updErr);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    // Use a backend redirect URL so the QR keeps working even if the frontend
    // hasn't been republished with the /checkin/:token route yet.
    const checkinUrl = `${supabaseUrl}/functions/v1/popup-ticket-redirect/${ticketToken}`;
    const qrDataUrl = await QRCode.toDataURL(checkinUrl, { width: 400, margin: 2 });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(JSON.stringify({ error: "Email not configured" }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const resend = new Resend(resendKey);
    const total = r.ticket_count * PRICE_PER_TICKET;
    const ticketLabel = r.ticket_count === 1 ? "1 ticket" : `${r.ticket_count} tickets`;

    await resend.emails.send({
      from: "Club Choir <noreply@clubchoir.ca>",
      to: [r.email],
      replyTo: "ailsa@clubchoir.ca",
      subject: `🎟️ Payment received — your ticket to ${event.name}`,
      html: `
        <div style="font-family: 'Nunito', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #333;">
          <h1 style="font-size: 24px; margin-bottom: 16px;">Thanks, ${escapeHtml(r.first_name)}! 🎶</h1>
          <p style="font-size: 16px; line-height: 1.6;">
            We've received your payment of <strong>$${total} CAD</strong> for ${ticketLabel} to
            <strong>${escapeHtml(event.name)}</strong>. Your spot is officially locked in!
          </p>

          <div style="background: #fff5ec; border-left: 4px solid #f97316; border-radius: 8px; padding: 16px 20px; margin: 24px 0;">
            <h2 style="margin: 0 0 8px; font-size: 18px; color: #c2410c;">Event details</h2>
            <p style="margin: 4px 0; font-size: 15px;"><strong>Where:</strong> ${escapeHtml(event.venue)}, ${escapeHtml(event.address)}</p>
            <p style="margin: 4px 0; font-size: 15px;"><strong>When:</strong> ${escapeHtml(event.date)}</p>
            <p style="margin: 4px 0; font-size: 15px;"><strong>Time:</strong> ${escapeHtml(event.time)}</p>
            <p style="margin: 4px 0; font-size: 15px;"><strong>Tickets:</strong> ${r.ticket_count}</p>
          </div>

          <h2 style="font-size: 18px; margin-top: 28px; margin-bottom: 8px;">🎫 Your ticket</h2>
          <p style="font-size: 15px; line-height: 1.6;">
            Show this QR code at the door — we'll scan it when you arrive.
          </p>
          <div style="text-align: center; margin: 24px 0; padding: 24px; background: #ffffff; border: 2px solid #f4f4f4; border-radius: 12px;">
            <img src="${qrDataUrl}" alt="Your ticket QR code" style="width: 280px; height: 280px; display: block; margin: 0 auto;" />
            <p style="font-size: 12px; color: #999; margin: 12px 0 0; word-break: break-all;">
              Or open: <a href="${checkinUrl}" style="color: #f97316;">${checkinUrl}</a>
            </p>
          </div>

          <p style="font-size: 16px; line-height: 1.6;">
            Save this email — bring it with you on your phone (a screenshot works too).
          </p>

          <p style="font-size: 16px; line-height: 1.6;">
            Any questions? Just reply to this email or write to
            <a href="mailto:ailsa@clubchoir.ca" style="color: #f97316;">ailsa@clubchoir.ca</a>.
          </p>

          <p style="font-size: 16px; line-height: 1.6; margin-top: 24px;">
            Tra-la-la, see you soon!<br/>
            — Ailsa & the Club Choir team
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
          <p style="color: #999; font-size: 12px; text-align: center;">
            You're receiving this because you reserved a spot at clubchoir.ca.
          </p>
        </div>
      `,
    });

    await supabase
      .from("popup_ticket_reservations")
      .update({ paid_email_sent_at: new Date().toISOString() })
      .eq("id", r.id);

    return new Response(JSON.stringify({ success: true, ticket_token: ticketToken }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error("notify-popup-paid error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
