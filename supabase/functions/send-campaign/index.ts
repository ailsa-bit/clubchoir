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

type Segment = "paid" | "registered" | "everyone" | "herd-reminder" | "herd-attendees" | "mtl-openhouse-tonight";
const HERD_CAMPAIGN_KEY = "sing-for-the-herd-reminder-v1";
const HERD_TODAY_CAMPAIGN_KEY = "sing-for-the-herd-day-of-v1";
const MTL_TONIGHT_CAMPAIGN_KEY = "montreal-openhouse-tonight-v1";

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
      <span style="color:#7c2d12;font-size:14px;">Know someone who'd love to sing? Forward this email or bring them along — friends, neighbours, or anyone curious is welcome at the open house. No experience needed. No audition. Just show up and sing.</span>
    </div>`;

  if (segment === "herd-reminder") return renderHerdEmail(r);
  if (segment === "herd-attendees") return renderHerdTodayEmail(r);
  if (segment === "mtl-openhouse-tonight") return renderMtlTonightEmail(r);

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
      <p>So happy you've signed up for the Fall 2026 season! Just a <strong>friendly nudge</strong>: your spot is confirmed once we receive your payment. Here are the quick Interac e-Transfer details:</p>
      <div style="background:#fff5ec;border-left:4px solid #f97316;border-radius:8px;padding:14px 18px;margin:12px 0;">
        <p style="margin:4px 0;font-size:15px;"><strong>Send to:</strong> ailsa@clubchoir.ca</p>
        <p style="margin:4px 0;font-size:15px;"><strong>Amount:</strong> $280.00 CAD</p>
        <p style="margin:4px 0;font-size:15px;"><strong>Security question:</strong> What is the name of the choir?</p>
        <p style="margin:4px 0;font-size:15px;"><strong>Answer:</strong> clubchoir <em>(one word, all lowercase)</em></p>
      </div>
      <p>If you haven't decided yet whether you're joining — that's okay! We hope to see you at one of our <strong>free open houses</strong> below. It's the perfect no-commitment way to meet the choir before the session begins.</p>`;
  } else {
    subject = "You're invited — Club Choir Fall 2026 open houses 🎤";
    opener = `
      <p>Hi ${first},</p>
      <p>We're gearing up for our <strong>Fall 2026 season</strong> and we'd love to see you back! Whether you sang with us before or you're just curious, we're hosting four <strong>free open houses</strong> in early August — no commitment, just come and sing.</p>
      <p>Fall registration is open now — <a href="${SITE_URL}/fall-registration" style="color:#f472b6;text-decoration:underline;">register here for the full 14-week session</a>.</p>
      <div style="text-align:center;margin:16px 0;">
        <a href="${SITE_URL}/fall-registration" style="display:inline-block;background:#f472b6;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:bold;">Register for Fall 2026</a>
      </div>
      <p>Need payment instructions? Simply register and the full instructions will be sent to you during the registration process.</p>`;
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

function renderHerdEmail(r: Recipient): { subject: string; html: string } {
  const first = esc(r.first_name || "there");
  const ticketUrl = `${SITE_URL}/tickets/sing-for-the-herd`;
  const schedule = (rows: string[]) => rows.map((t) => `<li style="margin:4px 0;">${t}</li>`).join("");
  const html = `
  <div style="font-family:Nunito,Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#111;background:#fff;">
    <div style="text-align:center;margin-bottom:20px;">
      <h1 style="margin:0;color:#f472b6;font-family:Quicksand,Arial,sans-serif;font-size:26px;">Club Choir</h1>
    </div>

    <p>Hello Club Choir family,</p>
    <p>Just a friendly reminder that our <strong>Sing for the Herd</strong> fundraiser is coming up on <strong>Sunday, August 2</strong>, at A Horse Tale Rescue in Vaudreuil-Dorion!</p>
    <p>Thank you so much to everyone who has already registered or purchased tickets. We are looking forward to spending a wonderful afternoon together, meeting the horses and singing in support of this very special organization.</p>

    <h2 style="font-family:Quicksand,Arial,sans-serif;font-size:18px;margin-top:22px;">Schedule</h2>
    <ul style="padding-left:20px;color:#333;font-size:15px;">${schedule([
      "<strong>2:45–3:45 PM:</strong> Meet the Herd",
      "<strong>3:45 PM:</strong> Head to the barn",
      "<strong>4:00–5:30 PM:</strong> Club Choir event",
    ])}</ul>

    <h2 style="font-family:Quicksand,Arial,sans-serif;font-size:18px;margin-top:22px;">Location</h2>
    <p style="margin:4px 0;color:#333;">A Horse Tale Rescue<br/>27 Chemin Murphy<br/>Vaudreuil-Dorion, QC J7V 4L2</p>

    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px 16px;margin:18px 0;color:#7c2d12;">
      Please remember to <strong>bring your own chair</strong> for the event in the barn.
    </div>

    <p>Tickets and registration are available here:</p>
    <div style="text-align:center;margin:16px 0;">
      <a href="${ticketUrl}" style="display:inline-block;background:#f472b6;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:bold;">Get your tickets</a>
    </div>
    <p style="text-align:center;font-size:13px;"><a href="${ticketUrl}" style="color:#f472b6;">${ticketUrl}</a></p>

    <p>To those who have already sent me a message to let me know that you are unable to attend, you will be missed!</p>
    <p>Please email me at <a href="mailto:ailsa@clubchoir.ca">ailsa@clubchoir.ca</a> with any questions.</p>
    <p>I look forward to singing with you and meeting the herd!</p>
    <p>Tra-la-la,<br/>Ailsa<br/>Club Choir</p>

    <hr style="border:none;border-top:1px solid #eee;margin:28px 0;"/>

    <p>Bonjour à toute la famille Club Choir,</p>
    <p>Voici un petit rappel amical concernant notre activité-bénéfice <strong>Chantez pour le troupeau</strong>, qui aura lieu le <strong>dimanche 2 août</strong> au refuge A Horse Tale Rescue, à Vaudreuil-Dorion!</p>
    <p>Un grand merci à toutes les personnes qui se sont déjà inscrites ou qui ont acheté leurs billets. Nous avons très hâte de passer un merveilleux après-midi ensemble, de rencontrer les chevaux et de chanter afin de soutenir cet organisme exceptionnel.</p>

    <h2 style="font-family:Quicksand,Arial,sans-serif;font-size:18px;margin-top:22px;">Horaire</h2>
    <ul style="padding-left:20px;color:#333;font-size:15px;">${schedule([
      "<strong>14 h 45 à 15 h 45 :</strong> Rencontre avec le troupeau",
      "<strong>15 h 45 :</strong> Direction la grange",
      "<strong>16 h à 17 h 30 :</strong> Activité Club Choir",
    ])}</ul>

    <h2 style="font-family:Quicksand,Arial,sans-serif;font-size:18px;margin-top:22px;">Lieu</h2>
    <p style="margin:4px 0;color:#333;">A Horse Tale Rescue<br/>27, chemin Murphy<br/>Vaudreuil-Dorion (Québec) J7V 4L2</p>

    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px 16px;margin:18px 0;color:#7c2d12;">
      N’oubliez pas d’apporter <strong>votre propre chaise</strong> pour l’activité dans la grange.
    </div>

    <p>Vous pouvez vous inscrire et acheter vos billets ici :</p>
    <div style="text-align:center;margin:16px 0;">
      <a href="${ticketUrl}" style="display:inline-block;background:#f472b6;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:bold;">Obtenir vos billets</a>
    </div>

    <p>À toutes les personnes qui m’ont déjà écrit pour me dire qu’elles ne pourront malheureusement pas être présentes, vous allez nous manquer!</p>
    <p>Pour toute question, écrivez-moi à <a href="mailto:ailsa@clubchoir.ca">ailsa@clubchoir.ca</a>.</p>
    <p>Au plaisir de chanter avec vous et de rencontrer le troupeau!</p>
    <p>Tra-la-la,<br/>Ailsa<br/>Club Choir</p>

    <hr style="border:none;border-top:1px solid #eee;margin:28px 0 12px;"/>
    <p style="color:#999;font-size:11px;text-align:center;">
      You're receiving this because you're part of the Club Choir community.<br/>
      <a href="mailto:ailsa@clubchoir.ca" style="color:#999;">Unsubscribe</a> · <a href="${SITE_URL}" style="color:#999;">clubchoir.ca</a>
    </p>
  </div>`;
  return {
    subject: "Reminder: Sing for the Herd — Sunday, August 2 🐴🎶",
    html,
  };
}

function renderHerdTodayEmail(r: Recipient): { subject: string; html: string } {
  const first = esc(r.first_name || "there");
  const box = `background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px 16px;margin:18px 0;color:#7c2d12;`;
  const html = `
  <div style="font-family:Nunito,Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#111;background:#fff;">
    <div style="text-align:center;margin-bottom:20px;">
      <h1 style="margin:0;color:#f472b6;font-family:Quicksand,Arial,sans-serif;font-size:26px;">Club Choir</h1>
    </div>

    <p>Hello ${first},</p>
    <p>Thank you for purchasing tickets or reserving your place for today\u2019s <strong>Sing for the Herd</strong> event at A Horse Tale Rescue.</p>
    <p>We wanted to confirm that the event is <strong>still on, rain or shine!</strong> The barn is spic and span, ready for Club Choir, and will keep us dry and comfortable while we sing together.</p>

    <h2 style="font-family:Quicksand,Arial,sans-serif;font-size:18px;margin-top:22px;">Today\u2019s schedule</h2>
    <ul style="padding-left:20px;color:#333;font-size:15px;">
      <li style="margin:4px 0;"><strong>2:45\u20133:45 PM:</strong> Meet the Herd</li>
      <li style="margin:4px 0;"><strong>3:45 PM:</strong> Head to the barn</li>
      <li style="margin:4px 0;"><strong>4:00\u20135:30 PM:</strong> Club Choir singalong</li>
    </ul>

    <h2 style="font-family:Quicksand,Arial,sans-serif;font-size:18px;margin-top:22px;">Location</h2>
    <p style="margin:4px 0;color:#333;">A Horse Tale Rescue<br/>27 Chemin Murphy<br/>Vaudreuil-Dorion, QC J7V 4L2</p>

    <div style="${box}">Please remember to <strong>bring your own chair</strong> for the barn.</div>

    <p>We are looking forward to seeing you for a joyful afternoon of music, community and horses!</p>
    <p>Tra-la-la,<br/>Ailsa<br/>Club Choir</p>

    <hr style="border:none;border-top:1px solid #eee;margin:28px 0;"/>

    <p>Bonjour \u00e0 toutes et \u00e0 tous,</p>
    <p>Merci d\u2019avoir achet\u00e9 vos billets ou r\u00e9serv\u00e9 votre place pour l\u2019\u00e9v\u00e9nement <strong>Sing for the Herd</strong> d\u2019aujourd\u2019hui \u00e0 A Horse Tale Rescue.</p>
    <p>Nous souhaitons vous confirmer que l\u2019\u00e9v\u00e9nement aura bien lieu, <strong>beau temps, mauvais temps!</strong> La grange est impeccable, pr\u00eate \u00e0 accueillir Club Choir, et elle nous gardera bien au sec et confortables pendant que nous chanterons ensemble.</p>

    <h2 style="font-family:Quicksand,Arial,sans-serif;font-size:18px;margin-top:22px;">Horaire de la journ\u00e9e</h2>
    <ul style="padding-left:20px;color:#333;font-size:15px;">
      <li style="margin:4px 0;"><strong>14 h 45 \u00e0 15 h 45 :</strong> Rencontre avec les chevaux</li>
      <li style="margin:4px 0;"><strong>15 h 45 :</strong> Direction la grange</li>
      <li style="margin:4px 0;"><strong>16 h \u00e0 17 h 30 :</strong> Activit\u00e9 musicale avec Club Choir</li>
    </ul>

    <h2 style="font-family:Quicksand,Arial,sans-serif;font-size:18px;margin-top:22px;">Adresse</h2>
    <p style="margin:4px 0;color:#333;">A Horse Tale Rescue<br/>27, chemin Murphy<br/>Vaudreuil-Dorion (Qu\u00e9bec) J7V 4L2</p>

    <div style="${box}">N\u2019oubliez pas d\u2019apporter <strong>votre propre chaise</strong> pour vous installer dans la grange.</div>

    <p>Nous avons tr\u00e8s h\u00e2te de vous retrouver pour un bel apr\u00e8s-midi de musique, de communaut\u00e9 et de rencontres avec les chevaux!</p>
    <p>Tra-la-la,<br/>Ailsa<br/>Club Choir</p>

    <hr style="border:none;border-top:1px solid #eee;margin:28px 0 12px;"/>
    <p style="color:#999;font-size:11px;text-align:center;">
      You\u2019re receiving this because you reserved or purchased a ticket for Sing for the Herd.<br/>
      <a href="mailto:ailsa@clubchoir.ca" style="color:#999;">Contact us</a> \u00b7 <a href="${SITE_URL}" style="color:#999;">clubchoir.ca</a>
    </p>
  </div>`;
  return { subject: "Today: Sing for the Herd is ON \u2014 rain or shine \ud83d\udc34\ud83c\udfb6", html };
}

async function loadHerdAttendees(supabase: any): Promise<Recipient[]> {
  const { data: rows } = await supabase
    .from("popup_ticket_reservations")
    .select("email, first_name, last_name")
    .eq("event_slug", "sing-for-the-herd");
  const map = new Map<string, Recipient>();
  for (const t of rows || []) {
    const email = String(t.email || "").trim().toLowerCase();
    if (!email.includes("@")) continue;
    if (!map.has(email)) map.set(email, { email, first_name: t.first_name || "", last_name: t.last_name || "" });
  }
  return Array.from(map.values());
}

async function loadHerdRecipients(supabase: any): Promise<Recipient[]> {
  const { data: paidTickets } = await supabase
    .from("popup_ticket_reservations")
    .select("email, payment_received")
    .eq("event_slug", "sing-for-the-herd")
    .eq("payment_received", true);
  const paidTicketSet = new Set<string>((paidTickets || []).map((t: any) => String(t.email).toLowerCase()));

  const { data: memberRows } = await supabase
    .from("members")
    .select("email, first_name, last_name, archived_at, crm_tags")
    .is("archived_at", null);

  const out: Recipient[] = [];
  const seen = new Set<string>();
  for (const m of memberRows || []) {
    if (!m.email || !m.email.includes("@")) continue;
    const key = m.email.toLowerCase();
    if (seen.has(key)) continue;
    if (paidTicketSet.has(key)) continue;
    if (Array.isArray(m.crm_tags) && m.crm_tags.includes("no-email")) continue;
    seen.add(key);
    out.push({ email: key, first_name: m.first_name || "", last_name: m.last_name || "" });
  }
  return out;
}

function renderMtlTonightEmail(r: Recipient): { subject: string; html: string } {
  const first = esc(r.first_name || "there");
  const box = `background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px 16px;margin:18px 0;color:#7c2d12;`;
  const html = `
  <div style="font-family:Nunito,Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#111;background:#fff;">
    <div style="text-align:center;margin-bottom:20px;">
      <h1 style="margin:0;color:#f472b6;font-family:Quicksand,Arial,sans-serif;font-size:26px;">Club Choir</h1>
    </div>

    <p>Hello ${first},</p>
    <p>Just a quick reminder \u2014 <strong>tonight is our Montreal Open House</strong> and we start at <strong>7:00 PM</strong>. It runs about an hour, and there\u2019s nothing you need to bring.</p>

    <div style="border:1px solid #eee;border-radius:12px;padding:14px 16px;margin:16px 0;">
      <div style="font-weight:800;font-size:16px;color:#111;">Tonight \u00b7 7:00 PM</div>
      <div style="color:#555;font-size:14px;margin-top:4px;">Kensington Presbyterian Church<br/>6225 Av. Godfrey, Montr\u00e9al</div>
    </div>

    <div style="${box}">
      <strong>Bring someone with you \ud83d\udc9b</strong><br/>
      This is the perfect opportunity to bring along someone who showed interest last session \u2014 a friend, a neighbour, anyone curious. Everyone is welcome.
    </div>

    <p>And if you\u2019re new to Club Choir, this is a great chance to meet members and ask any questions on your mind. No experience needed, no audition \u2014 just come and sing.</p>
    <p>I hope to see you there!</p>
    <p>Tra-la-la,<br/>Ailsa<br/>Club Choir</p>

    <hr style="border:none;border-top:1px solid #eee;margin:28px 0;"/>

    <p>Bonjour ${first},</p>
    <p>Petit rappel \u2014 <strong>notre porte ouverte de Montr\u00e9al a lieu ce soir</strong> et nous commen\u00e7ons \u00e0 <strong>19 h</strong>. L\u2019activit\u00e9 dure environ une heure et vous n\u2019avez rien \u00e0 apporter.</p>

    <div style="border:1px solid #eee;border-radius:12px;padding:14px 16px;margin:16px 0;">
      <div style="font-weight:800;font-size:16px;color:#111;">Ce soir \u00b7 19 h</div>
      <div style="color:#555;font-size:14px;margin-top:4px;">\u00c9glise Kensington Presbyterian<br/>6225, av. Godfrey, Montr\u00e9al</div>
    </div>

    <div style="${box}">
      <strong>Amenez quelqu\u2019un avec vous \ud83d\udc9b</strong><br/>
      C\u2019est le moment id\u00e9al pour amener une personne qui avait montr\u00e9 de l\u2019int\u00e9r\u00eat la session derni\u00e8re \u2014 un ami, un voisin, toute personne curieuse. Tout le monde est le bienvenu.
    </div>

    <p>Et si vous \u00eates nouveau ou nouvelle chez Club Choir, c\u2019est une belle occasion de rencontrer les membres et de poser toutes vos questions. Aucune exp\u00e9rience requise, aucune audition \u2014 venez simplement chanter.</p>
    <p>J\u2019esp\u00e8re vous y voir!</p>
    <p>Tra-la-la,<br/>Ailsa<br/>Club Choir</p>

    <hr style="border:none;border-top:1px solid #eee;margin:28px 0 12px;"/>
    <p style="color:#999;font-size:11px;text-align:center;">
      You\u2019re receiving this because you\u2019re part of the Club Choir Montreal community.<br/>
      <a href="mailto:ailsa@clubchoir.ca" style="color:#999;">Contact us</a> \u00b7 <a href="${SITE_URL}" style="color:#999;">clubchoir.ca</a>
    </p>
  </div>`;
  return { subject: "Tonight at 7 PM \u2014 Montreal Open House \ud83c\udfb6 / Ce soir \u00e0 19 h", html };
}

async function loadMontrealRecipients(supabase: any): Promise<Recipient[]> {
  const isMtl = (l: any) => String(l || "").trim().toLowerCase() === "montreal";

  const { data: suppressedRows } = await supabase.from("members").select("email, crm_tags");
  const suppressed = new Set<string>();
  for (const m of suppressedRows || []) {
    if (m.email && Array.isArray(m.crm_tags) && m.crm_tags.includes("no-email")) {
      suppressed.add(String(m.email).toLowerCase());
    }
  }

  const out = new Map<string, Recipient>();
  const add = (email: any, first: any, last: any) => {
    const e = String(email || "").trim().toLowerCase();
    if (!e.includes("@")) return;
    if (suppressed.has(e)) return;
    if (!out.has(e)) out.set(e, { email: e, first_name: first || "", last_name: last || "" });
  };

  const { data: members } = await supabase
    .from("members").select("email, first_name, last_name, location, crm_tags")
    .is("archived_at", null);
  for (const m of members || []) if (isMtl(m.location)) add(m.email, m.first_name, m.last_name);

  const { data: regs } = await supabase
    .from("session_registrations").select("email, first_name, last_name, location");
  for (const g of regs || []) if (isMtl(g.location)) add(g.email, g.first_name, g.last_name);

  const { data: rsvps } = await supabase
    .from("open_house_rsvps").select("email, first_name, last_name, location");
  for (const g of rsvps || []) if (isMtl(g.location)) add(g.email, g.first_name, g.last_name);

  const { data: prospects } = await supabase
    .from("prospects").select("email, first_name, last_name, locations");
  for (const p of prospects || []) {
    if ((p.locations || []).some(isMtl)) add(p.email, p.first_name, p.last_name);
  }

  return Array.from(out.values());
}

async function loadRecipients(supabase: any, segment: Segment): Promise<Recipient[]> {
  if (segment === "herd-reminder") return loadHerdRecipients(supabase);
  if (segment === "herd-attendees") return loadHerdAttendees(supabase);
  if (segment === "mtl-openhouse-tonight") return loadMontrealRecipients(supabase);
  // Paid: session_registrations for fall-2026 with payment_status='paid'
  const { data: paidRegs } = await supabase
    .from("session_registrations")
    .select("email, first_name, last_name, payment_status, session_label")
    .eq("session_label", "fall-2026")
    .eq("payment_status", "paid");

  // Build suppression set: members tagged 'no-email' should never receive campaigns
  const { data: suppressedRows } = await supabase
    .from("members")
    .select("email, crm_tags");
  const suppressed = new Set<string>();
  for (const m of suppressedRows || []) {
    if (m.email && Array.isArray(m.crm_tags) && m.crm_tags.includes("no-email")) {
      suppressed.add(m.email.toLowerCase());
    }
  }

  const paidSet = new Set<string>((paidRegs || []).map((r: any) => r.email.toLowerCase()));
  const paidRecipients: Recipient[] = (paidRegs || [])
    .filter((r: any) => r.email && !suppressed.has(r.email.toLowerCase()))
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
    if (suppressed.has(key)) continue;
    if (!regMap.has(key)) regMap.set(key, { email: key, first_name: r.first_name || "", last_name: r.last_name || "" });
  }
  const registeredRecipients = Array.from(regMap.values());
  const registeredSet = new Set(regMap.keys());

  if (segment === "paid") {
    const uniq = new Map<string, Recipient>();
    for (const r of paidRecipients) if (!uniq.has(r.email)) uniq.set(r.email, r);
    return Array.from(uniq.values());
  }
  if (segment === "registered") return registeredRecipients;

  // Everyone: members not in paid or registered, not archived, not suppressed, with email
  const { data: memberRows } = await supabase
    .from("members")
    .select("email, first_name, last_name, archived_at, crm_tags")
    .is("archived_at", null);

  const everyone: Recipient[] = [];
  const seen = new Set<string>();
  for (const m of memberRows || []) {
    if (!m.email || !m.email.includes("@")) continue;
    const key = m.email.toLowerCase();
    if (paidSet.has(key) || registeredSet.has(key)) continue;
    if (suppressed.has(key)) continue;
    if (Array.isArray(m.crm_tags) && m.crm_tags.includes("no-email")) continue;
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

    if (!["paid", "registered", "everyone", "herd-reminder", "herd-attendees", "mtl-openhouse-tonight"].includes(segment)) {
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
    const key = segment === "herd-reminder"
      ? HERD_CAMPAIGN_KEY
      : segment === "herd-attendees"
        ? HERD_TODAY_CAMPAIGN_KEY
        : segment === "mtl-openhouse-tonight"
          ? MTL_TONIGHT_CAMPAIGN_KEY
          : `${CAMPAIGN_KEY}:${segment}`;
    const { data: sentRows } = await supabase
      .from("campaign_sends").select("recipient_email")
      .eq("campaign_key", key);
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
            campaign_key: key,
            segment,
            recipient_email: r.email,
            subject,
            status: "sent",
          });
        } catch (err: any) {
          results.failed.push(r.email);
          await supabase.from("campaign_sends").insert({
            campaign_key: key,
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
