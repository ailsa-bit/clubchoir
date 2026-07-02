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

const EVENT_SLUG = "sing-for-the-herd";
const EVENT_NAME = "Sing for the Herd — A Club Choir Fundraiser for A Horse Tale Rescue";
const EVENT_DATE = "Sunday, August 2, 2026";
const EVENT_VENUE = "A Horse Tale Rescue";
const EVENT_ADDRESS = "27 Chemin Murphy, Vaudreuil-Dorion, QC J7V 4L2";

const PRICE_ADULT = 20;
const PRICE_CHILD_6_10 = 10;
const PRICE_FAMILY = 50;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const first_name = String(body.first_name || "").trim().slice(0, 100);
    const last_name = String(body.last_name || "").trim().slice(0, 100);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 255);
    const adults = Math.max(0, Math.min(20, Number(body.adults) || 0));
    const children_6_10 = Math.max(0, Math.min(20, Number(body.children_6_10) || 0));
    const children_under_6 = Math.max(0, Math.min(20, Number(body.children_under_6) || 0));
    const family_passes = Math.max(0, Math.min(10, Number(body.family_passes) || 0));

    if (
      !first_name || !last_name || !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return new Response(JSON.stringify({ error: "Please fill in all fields with valid information." }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const paidTickets = adults + children_6_10 + family_passes;
    if (paidTickets < 1 && children_under_6 < 1) {
      return new Response(JSON.stringify({ error: "Please select at least one ticket." }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const total = adults * PRICE_ADULT + children_6_10 * PRICE_CHILD_6_10 + family_passes * PRICE_FAMILY;
    // Total headcount (family pass covers up to 2 adults + 2 kids 6-10)
    const headcount =
      adults + children_6_10 + children_under_6 + family_passes * 4;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const notes = JSON.stringify({
      adults,
      children_6_10,
      children_under_6,
      family_passes,
      total_cad: total,
    });

    const { error: insertError } = await supabase
      .from("popup_ticket_reservations")
      .insert({
        event_slug: EVENT_SLUG,
        first_name,
        last_name,
        email,
        ticket_count: Math.max(1, headcount),
        notes,
      });

    if (insertError) console.error("Insert error:", insertError);

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(JSON.stringify({ error: "Email not configured" }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const resend = new Resend(resendKey);

    const breakdownLines: string[] = [];
    if (adults > 0) breakdownLines.push(`${adults} × Adult ($${PRICE_ADULT}) = $${adults * PRICE_ADULT}`);
    if (children_6_10 > 0) breakdownLines.push(`${children_6_10} × Child 6–10 ($${PRICE_CHILD_6_10}) = $${children_6_10 * PRICE_CHILD_6_10}`);
    if (family_passes > 0) breakdownLines.push(`${family_passes} × Family Pass ($${PRICE_FAMILY}) = $${family_passes * PRICE_FAMILY}`);
    if (children_under_6 > 0) breakdownLines.push(`${children_under_6} × Child 5 and under (Free)`);
    const breakdownHtml = breakdownLines.map(l => `<p style="margin:4px 0;font-size:15px;">${escapeHtml(l)}</p>`).join("");

    // Admin notification
    await resend.emails.send({
      from: "Club Choir <noreply@clubchoir.ca>",
      to: ["ailsa@clubchoir.ca"],
      replyTo: email,
      subject: `🐴 New Sing for the Herd Reservation — ${first_name} ${last_name} ($${total})`,
      html: `
        <div style="font-family:'Nunito',Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;">
          <h1 style="color:#333;font-size:24px;margin-bottom:16px;">New Sing for the Herd Reservation</h1>
          <div style="background:#f4f4f4;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="margin:4px 0;"><strong>Name:</strong> ${escapeHtml(first_name)} ${escapeHtml(last_name)}</p>
            <p style="margin:4px 0;"><strong>Email:</strong> ${escapeHtml(email)}</p>
            ${breakdownHtml}
            <p style="margin:8px 0 4px;"><strong>Total due:</strong> $${total} CAD</p>
          </div>
          <p style="color:#333;font-size:14px;line-height:1.6;">They've been sent e-Transfer instructions. Mark them as paid in the admin dashboard once payment arrives.</p>
        </div>
      `,
    });

    // Guest confirmation with payment instructions
    await resend.emails.send({
      from: "Club Choir <noreply@clubchoir.ca>",
      to: [email],
      subject: `🐴 Your Sing for the Herd reservation — payment instructions`,
      html: `
        <div style="font-family:'Nunito',Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#333;">
          <h1 style="font-size:24px;margin-bottom:16px;">Thanks, ${escapeHtml(first_name)}! 🐴🎶</h1>
          <p style="font-size:16px;line-height:1.6;">
            We've received your reservation for <strong>${escapeHtml(EVENT_NAME)}</strong>. All ticket proceeds support A Horse Tale Rescue — thank you!
          </p>

          <div style="background:#f5f0ff;border-left:4px solid #7c3aed;border-radius:8px;padding:16px 20px;margin:24px 0;">
            <h2 style="margin:0 0 8px;font-size:18px;color:#6d28d9;">Event details</h2>
            <p style="margin:4px 0;font-size:15px;"><strong>When:</strong> ${EVENT_DATE}</p>
            <p style="margin:4px 0;font-size:15px;"><strong>Where:</strong> ${EVENT_VENUE}, ${EVENT_ADDRESS}</p>
            <p style="margin:4px 0;font-size:15px;"><strong>Schedule:</strong></p>
            <p style="margin:2px 0 2px 12px;font-size:14px;">2:45–3:45 PM: Meet the Herd</p>
            <p style="margin:2px 0 2px 12px;font-size:14px;">3:45 PM: Head to the barn</p>
            <p style="margin:2px 0 2px 12px;font-size:14px;">4:00–5:30 PM: Club Choir event</p>
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
            <p style="margin:4px 0;font-size:15px;"><strong>Security question:</strong> choir name</p>
            <p style="margin:4px 0;font-size:15px;"><strong>Answer:</strong> clubchoir <em>(one word, all lowercase)</em></p>
          </div>

          <div style="background:#fef3c7;border-radius:8px;padding:16px 20px;margin:16px 0;">
            <p style="margin:0;font-size:15px;line-height:1.6;">
              ⚠️ <strong>Important:</strong> Your spot is not officially secured until we confirm your e-Transfer. Once payment arrives we'll send your ticket by email.
            </p>
          </div>

          <p style="font-size:16px;line-height:1.6;">
            Any questions? Reply to this email or write to
            <a href="mailto:ailsa@clubchoir.ca" style="color:#7c3aed;">ailsa@clubchoir.ca</a>.
          </p>

          <p style="font-size:16px;line-height:1.6;margin-top:24px;">
            See you at the barn!<br/>
            — Ailsa & the Club Choir team
          </p>

          <hr style="border:none;border-top:1px solid #eee;margin:32px 0 16px;" />
          <p style="color:#999;font-size:12px;text-align:center;">
            You're receiving this because you reserved a spot at clubchoir.ca.
          </p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ success: true, total }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("reserve-herd-ticket error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
