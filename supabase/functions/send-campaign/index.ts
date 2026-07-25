import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SIGNING_SECRET = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = "https://clubchoir.ca";
const CAMPAIGN_KEY = "fall-2026-openhouse-v1";

type Segment = "paid" | "registered" | "everyone";

interface Recipient {
  email: string;
  first_name: string;
  last_name: string;
}

const LOCATIONS = [
  { name: "Montreal",      date: "Monday, August 3, 2026",    dateFr: "Lundi 3 août 2026",    time: "7:00 PM", venue: "Kensington Presbyterian Church, 6225 Av. Godfrey, Montréal", session: "Mondays 7:00–8:30 PM · Sept 7 – Dec 7, 2026", sessionFr: "Lundis 19h00–20h30 · 7 sept. – 7 déc. 2026" },
  { name: "Hudson",        date: "Tuesday, August 4, 2026",   dateFr: "Mardi 4 août 2026",    time: "7:00 PM", venue: "The Hudson Legion, 57 Beach Road, Hudson",                       session: "Tuesdays 7:00–8:30 PM · Sept 8 – Dec 8, 2026",  sessionFr: "Mardis 19h00–20h30 · 8 sept. – 8 déc. 2026" },
  { name: "Saint-Hubert",  date: "Wednesday, August 5, 2026", dateFr: "Mercredi 5 août 2026", time: "7:00 PM", venue: "St-Gabriel Catholic Church, 5070 Rue Gilbert, Saint-Hubert",   session: "Wednesdays 7:00–8:30 PM · Sept 9 – Dec 9, 2026", sessionFr: "Mercredis 19h00–20h30 · 9 sept. – 9 déc. 2026" },
  { name: "Pointe-Claire", date: "Thursday, August 6, 2026",  dateFr: "Jeudi 6 août 2026",    time: "7:00 PM", venue: "Valois United Church, 70 Av. Belmont, Pointe-Claire",          session: "Thursdays 7:00–8:30 PM · Sept 10 – Dec 10, 2026", sessionFr: "Jeudis 19h00–20h30 · 10 sept. – 10 déc. 2026" },
];

function b64urlEncode(s: string): string {
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SIGNING_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function makeToken(r: Recipient, campaign: string): Promise<string> {
  const payload = b64urlEncode(JSON.stringify({
    email: r.email.toLowerCase(),
    first_name: r.first_name,
    last_name: r.last_name,
    campaign,
    ts: Date.now(),
  }));
  const sig = await hmac(payload);
  return `${payload}.${sig}`;
}

function esc(s: string): string {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

async function renderEmail(segment: Segment, r: Recipient): Promise<{ subject: string; html: string }> {
  const first = esc(r.first_name || "there");
  const token = await makeToken(r, CAMPAIGN_KEY);

  const rsvpButtons = LOCATIONS.map((l) => {
    const url = `${SITE_URL}/rsvp?token=${token}&location=${encodeURIComponent(l.name)}`;
    return `
      <tr><td style="padding:6px 0;">
        <a href="${url}" style="display:block;background:#f472b6;color:#fff;text-decoration:none;font-weight:700;padding:12px 16px;border-radius:12px;text-align:center;font-family:Nunito,Arial,sans-serif;">
          I'll be there — ${esc(l.name)} · ${esc(l.date)}
        </a>
      </td></tr>`;
  }).join("");

  const locationCards = LOCATIONS.map((l) => `
    <div style="border:1px solid #eee;border-radius:12px;padding:14px 16px;margin:10px 0;">
      <div style="font-weight:800;font-size:16px;color:#111;">${esc(l.name)}</div>
      <div style="color:#555;font-size:14px;margin-top:2px;"><strong>Open House:</strong> ${esc(l.date)} at ${esc(l.time)}</div>
      <div style="color:#555;font-size:14px;">${esc(l.venue)}</div>
      <div style="color:#777;font-size:13px;margin-top:6px;"><strong>Fall session:</strong> ${esc(l.session)}</div>
    </div>`).join("");

  const bringAFriend = `
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px 16px;margin:18px 0;">
      <strong style="color:#9a3412;">Bring a friend 💛</strong><br/>
      <span style="color:#7c2d12;font-size:14px;">Know someone who'd love to sing? Forward this email or bring them along — friends, neighbours, or anyone curious is warmly welcome at the open house. No experience needed. No audition. Just show up and sing.</span>
    </div>`;

  let opener = "";
  let subject = "";
  if (segment === "paid") {
    subject = "You're all set for Fall 2026 — open house reminder 🎶";
    opener = `
      <p>Hi ${first},</p>
      <p><strong>Thank you</strong> for registering and paying for the Fall 2026 session — you're officially on the list, and we can't wait to sing with you! 🎉</p>
      <p>Before rehearsals begin, we have four <strong>free open houses</strong> in early August — pop by any location for a taste of what's ahead, meet new choir friends, and sing a song or two together.</p>`;
  } else if (segment === "registered") {
    subject = "A gentle reminder — send your payment to lock in your Fall 2026 spot";
    opener = `
      <p>Hi ${first},</p>
      <p>So happy you've signed up for the Fall 2026 season! Just a <strong>friendly nudge</strong>: your spot is confirmed once payment is received. You can send it by e-transfer to <a href="mailto:ailsa@clubchoir.ca">ailsa@clubchoir.ca</a>.</p>
      <p>Whether you've paid yet or not — please come to the <strong>free open house</strong> in your city on the dates below. It's the perfect way to meet the choir before the session begins.</p>`;
  } else {
    subject = "You're invited — Club Choir Fall 2026 open houses 🎤";
    opener = `
      <p>Hi ${first},</p>
      <p>We're gearing up for our <strong>Fall 2026 season</strong> and we'd love to see you back! Whether you sang with us before or you're just curious, we're hosting four <strong>free open houses</strong> in early August — no commitment, just come and sing.</p>
      <p>Fall registration is open now — full location details below.</p>`;
  }

  const memberLine = segment === "paid" ? `
    <p style="color:#555;font-size:14px;">Ready to start prepping? Log in to the <a href="${SITE_URL}/login">members' area</a> to see this session's songs and rehearsal tracks.</p>` : "";

  const html = `
  <div style="font-family:Nunito,Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#111;background:#fff;">
    <div style="text-align:center;margin-bottom:20px;">
      <h1 style="margin:0;color:#f472b6;font-family:Quicksand,Arial,sans-serif;font-size:26px;">Club Choir</h1>
    </div>

    ${opener}

    <h2 style="font-family:Quicksand,Arial,sans-serif;color:#111;font-size:20px;margin-top:24px;">✨ Open Houses (Free)</h2>
    ${locationCards}

    <h2 style="font-family:Quicksand,Arial,sans-serif;color:#111;font-size:20px;margin-top:24px;">Let us know you're coming 👇</h2>
    <p style="color:#555;font-size:14px;">Tap the button for the location you'll attend — it takes one click and helps us plan the space.</p>
    <table role="presentation" style="width:100%;border-collapse:collapse;">${rsvpButtons}</table>

    ${bringAFriend}

    ${memberLine}

    <p style="color:#555;font-size:14px;">Questions? Just reply or write to <a href="mailto:ailsa@clubchoir.ca">ailsa@clubchoir.ca</a>.</p>
    <p style="color:#555;font-size:14px;">With love,<br/>Ailsa &amp; the Club Choir team</p>

    <hr style="border:none;border-top:1px solid #eee;margin:28px 0 12px;"/>
    <p style="color:#999;font-size:11px;text-align:center;">
      You're receiving this because you're part of the Club Choir community.<br/>
      <a href="mailto:ailsa@clubchoir.ca" style="color:#999;">Unsubscribe</a> · <a href="${SITE_URL}" style="color:#999;">clubchoir.ca</a>
    </p>
  </div>`;

  return { subject, html };
}

async function loadRecipients(supabase: any, segment: Segment): Promise<Recipient[]> {
  // Paid: session_registrations for fall-2026 with payment_status='paid'
  const { data: paidRegs } = await supabase
    .from("session_registrations")
    .select("email, first_name, last_name, payment_status, session_label")
    .eq("session_label", "fall-2026")
    .eq("payment_status", "paid");

  const paidSet = new Set<string>((paidRegs || []).map((r: any) => r.email.toLowerCase()));
  const paidRecipients: Recipient[] = (paidRegs || [])
    .filter((r: any) => r.email)
    .map((r: any) => ({ email: r.email.toLowerCase(), first_name: r.first_name || "", last_name: r.last_name || "" }));

  // Registered (any label, not paid) minus paid
  const { data: regRows } = await supabase
    .from("session_registrations")
    .select("email, first_name, last_name, payment_status, session_label")
    .in("session_label", ["fall-2026", "open-house-2026", "try-a-session"])
    .neq("payment_status", "paid");

  const regMap = new Map<string, Recipient>();
  for (const r of regRows || []) {
    if (!r.email) continue;
    const key = r.email.toLowerCase();
    if (paidSet.has(key)) continue;
    if (!regMap.has(key)) regMap.set(key, { email: key, first_name: r.first_name || "", last_name: r.last_name || "" });
  }
  const registeredRecipients = Array.from(regMap.values());
  const registeredSet = new Set(regMap.keys());

  if (segment === "paid") {
    // Dedupe
    const uniq = new Map<string, Recipient>();
    for (const r of paidRecipients) if (!uniq.has(r.email)) uniq.set(r.email, r);
    return Array.from(uniq.values());
  }
  if (segment === "registered") return registeredRecipients;

  // Everyone: members not in paid or registered, not archived, with email
  const { data: memberRows } = await supabase
    .from("members")
    .select("email, first_name, last_name, archived_at")
    .is("archived_at", null);

  const everyone: Recipient[] = [];
  const seen = new Set<string>();
  for (const m of memberRows || []) {
    if (!m.email || !m.email.includes("@")) continue;
    const key = m.email.toLowerCase();
    if (paidSet.has(key) || registeredSet.has(key)) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    everyone.push({ email: key, first_name: m.first_name || "", last_name: m.last_name || "" });
  }
  return everyone;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();
    if (authErr || !user) throw new Error("Not authenticated");

    const { data: role } = await supabaseUser
      .from("user_roles").select("role")
      .eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!role) throw new Error("Admin access required");

    const body = await req.json();
    const segment: Segment = body.segment;
    const testEmail: string | undefined = body.testEmail;
    const previewOnly: boolean = !!body.previewOnly;
    const countOnly: boolean = !!body.countOnly;

    if (!["paid", "registered", "everyone"].includes(segment)) {
      throw new Error("Invalid segment");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const recipients = await loadRecipients(supabase, segment);

    if (countOnly) {
      return new Response(JSON.stringify({ count: recipients.length }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (previewOnly) {
      const sample = recipients[0] || { email: "sample@example.com", first_name: "Sample", last_name: "" };
      const { subject, html } = await renderEmail(segment, sample);
      return new Response(JSON.stringify({ subject, html, count: recipients.length }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY not configured");
    const resend = new Resend(resendKey);

    // Test send
    if (testEmail) {
      const sample = recipients[0] || { email: testEmail, first_name: "Sample", last_name: "" };
      const { subject, html } = await renderEmail(segment, { ...sample, email: testEmail });
      await resend.emails.send({
        from: "Club Choir <noreply@clubchoir.ca>",
        to: [testEmail],
        subject: `[TEST] ${subject}`,
        html,
      });
      return new Response(JSON.stringify({ ok: true, sentTo: testEmail }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Real send — check campaign_sends to skip already-sent
    const { data: sentRows } = await supabase
      .from("campaign_sends").select("recipient_email")
      .eq("campaign_key", `${CAMPAIGN_KEY}:${segment}`);
    const alreadySent = new Set<string>((sentRows || []).map((r: any) => r.recipient_email.toLowerCase()));
    const toSend = recipients.filter((r) => !alreadySent.has(r.email));

    const results: { success: string[]; failed: string[]; skipped: number } = {
      success: [], failed: [], skipped: recipients.length - toSend.length,
    };
    const batchSize = 5;
    for (let i = 0; i < toSend.length; i += batchSize) {
      const batch = toSend.slice(i, i + batchSize);
      await Promise.all(batch.map(async (r) => {
        try {
          const { subject, html } = await renderEmail(segment, r);
          await resend.emails.send({
            from: "Club Choir <noreply@clubchoir.ca>",
            to: [r.email],
            subject,
            html,
          });
          results.success.push(r.email);
          await supabase.from("campaign_sends").insert({
            campaign_key: `${CAMPAIGN_KEY}:${segment}`,
            segment,
            recipient_email: r.email,
            subject,
            status: "sent",
          });
        } catch (err: any) {
          results.failed.push(r.email);
          await supabase.from("campaign_sends").insert({
            campaign_key: `${CAMPAIGN_KEY}:${segment}`,
            segment,
            recipient_email: r.email,
            subject: "(failed)",
            status: "failed",
            error: String(err?.message || err).slice(0, 500),
          });
        }
      }));
      // small pacing gap
      await new Promise((res) => setTimeout(res, 350));
    }

    return new Response(JSON.stringify(results), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error("send-campaign err:", e);
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
