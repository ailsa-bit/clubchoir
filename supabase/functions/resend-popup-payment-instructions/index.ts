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

const EVENTS: Record<string, { name: string; date: string; time: string; venue: string; address: string; accent: string }> = {
  "studio-77-may-31": {
    name: "Club Choir Pop-Up at Studio 77",
    date: "Sunday, May 31, 2026",
    time: "3:00 PM – 5:00 PM",
    venue: "Studio 77",
    address: "271 Chem. du Bord-du-Lac-Lakeshore, Pointe-Claire, QC H9S 4L1",
    accent: "#f97316",
  },
  "sing-for-the-herd": {
    name: "Sing for the Herd — A Club Choir Fundraiser for A Horse Tale Rescue",
    date: "Sunday, August 2, 2026",
    time: "4:00 PM – 5:30 PM (choir event); herd meet-and-greet 2:45–3:45 PM",
    venue: "A Horse Tale Rescue",
    address: "27 Chemin Murphy, Vaudreuil-Dorion, QC J7V 4L2",
    accent: "#7c3aed",
  },
};

const PRICE_ADULT = 20;
const PRICE_CHILD_6_10 = 10;
const PRICE_FAMILY = 50;
const PRICE_PER_TICKET = 15;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization") || "";
    const bearer = authHeader.replace(/^Bearer\s+/i, "");
    let authorized = bearer === serviceKey;
    if (!authorized && bearer) {
      const { data: userData } = await admin.auth.getUser(bearer);
      const user = userData.user;
      if (user) {
        const { data: role } = await admin
          .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
        authorized = !!role;
      }
    }
    if (!authorized) return json({ error: "Unauthorized" }, 401);

    const { reservation_id } = await req.json();
    if (!reservation_id || typeof reservation_id !== "string") return json({ error: "reservation_id required" }, 400);

    const { data: r, error } = await admin
      .from("popup_ticket_reservations").select("*").eq("id", reservation_id).maybeSingle();
    if (error || !r) return json({ error: "Reservation not found" }, 404);

    const event = EVENTS[r.event_slug];
    if (!event) return json({ error: "Unknown event" }, 400);

    // Rebuild the ticket breakdown / total from notes when available
    let total = r.ticket_count * PRICE_PER_TICKET;
    const lines: string[] = [];
    let parsed: any = null;
    if (r.notes && typeof r.notes === "string") {
      try { parsed = JSON.parse(r.notes); } catch { /* plain text notes */ }
    }
    if (parsed && typeof parsed === "object") {
      if (typeof parsed.total_cad === "number") total = parsed.total_cad;
      if (parsed.adults > 0) lines.push(`${parsed.adults} × Adult ($${PRICE_ADULT}) = $${parsed.adults * PRICE_ADULT}`);
      if (parsed.children_6_10 > 0) lines.push(`${parsed.children_6_10} × Child 6–10 ($${PRICE_CHILD_6_10}) = $${parsed.children_6_10 * PRICE_CHILD_6_10}`);
      if (parsed.family_passes > 0) lines.push(`${parsed.family_passes} × Family Pass ($${PRICE_FAMILY}) = $${parsed.family_passes * PRICE_FAMILY}`);
      if (parsed.children_under_6 > 0) lines.push(`${parsed.children_under_6} × Child 5 and under (Free)`);
    }
    if (lines.length === 0) {
      lines.push(`${r.ticket_count} × Ticket = $${total}`);
    }
    const breakdownHtml = lines
      .map((l) => `<p style="margin:4px 0;font-size:15px;">${escapeHtml(l)}</p>`).join("");

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return json({ error: "Email not configured" }, 500);
    const resend = new Resend(resendKey);

    const reminderHtml = r.event_slug === "sing-for-the-herd"
      ? `<p style="margin:8px 0 0;font-size:15px;line-height:1.6;">🪑 <strong>Reminder:</strong> Bring your own lawn or camping chair, settle in, and enjoy the afternoon of singing in this unique barn setting.</p>`
      : "";

    await resend.emails.send({
      from: "Club Choir <noreply@clubchoir.ca>",
      to: [r.email],
      replyTo: "ailsa@clubchoir.ca",
      subject: `💸 Payment instructions — ${event.name}`,
      html: `
        <div style="font-family:'Nunito',Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#333;">
          <h1 style="font-size:24px;margin-bottom:16px;">Hi ${escapeHtml(r.first_name)}! 🎶</h1>
          <p style="font-size:16px;line-height:1.6;">
            Thanks for reserving your spot at <strong>${escapeHtml(event.name)}</strong>. Here are your payment
            instructions again so you can confirm your place.
          </p>

          <div style="background:#f5f0ff;border-left:4px solid ${event.accent};border-radius:8px;padding:16px 20px;margin:24px 0;">
            <h2 style="margin:0 0 8px;font-size:18px;color:${event.accent};">Event details</h2>
            <p style="margin:4px 0;font-size:15px;"><strong>When:</strong> ${escapeHtml(event.date)}</p>
            <p style="margin:4px 0;font-size:15px;"><strong>Time:</strong> ${escapeHtml(event.time)}</p>
            <p style="margin:4px 0;font-size:15px;"><strong>Where:</strong> ${escapeHtml(event.venue)}, ${escapeHtml(event.address)}</p>
          </div>

          <h2 style="font-size:18px;margin-top:28px;margin-bottom:8px;">Your tickets</h2>
          <div style="background:#f4f4f4;border-radius:8px;padding:16px 20px;margin:8px 0 16px;">
            ${breakdownHtml}
            <p style="margin:8px 0 4px;font-size:15px;"><strong>Total to pay:</strong> $${total} CAD</p>
          </div>

          <h2 style="font-size:18px;margin-top:28px;margin-bottom:8px;">💸 How to pay (Interac e-Transfer)</h2>
          <div style="background:#f4f4f4;border-radius:8px;padding:16px 20px;margin:8px 0 24px;">
            <p style="margin:4px 0;font-size:15px;"><strong>Send to:</strong> ailsa@clubchoir.ca</p>
            <p style="margin:4px 0;font-size:15px;"><strong>Amount:</strong> $${total} CAD</p>
            <p style="margin:4px 0;font-size:15px;"><strong>Security question:</strong> What is the choir name?</p>
            <p style="margin:4px 0;font-size:15px;"><strong>Answer:</strong> clubchoir <em>(one word, all lowercase)</em></p>
          </div>

          <div style="background:#fef3c7;border-radius:8px;padding:16px 20px;margin:16px 0;">
            <p style="margin:0;font-size:15px;line-height:1.6;">
              ⚠️ <strong>Important:</strong> Your spot isn't officially secured until we confirm your e-Transfer.
              Once payment arrives we'll email you your ticket with a QR code.
            </p>
            ${reminderHtml}
          </div>

          <p style="font-size:16px;line-height:1.6;">
            If you have any questions, please send an email to
            <a href="mailto:ailsa@clubchoir.ca" style="color:${event.accent};">ailsa@clubchoir.ca</a> and I'd be happy to help.
          </p>

          <p style="font-size:16px;line-height:1.6;margin-top:24px;">
            Tra-la-la, see you soon!<br/>
            — Ailsa &amp; the Club Choir team
          </p>

          <hr style="border:none;border-top:1px solid #eee;margin:32px 0 16px;" />
          <p style="color:#999;font-size:12px;text-align:center;">
            You're receiving this because you reserved a spot at clubchoir.ca.
          </p>
        </div>
      `,
    });

    return json({ success: true, total });
  } catch (e: any) {
    console.error("resend-popup-payment-instructions error:", e);
    return json({ error: e.message }, 500);
  }
});
