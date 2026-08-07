import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://clubchoir.ca";

type Segment = "fall-paid" | "fall-unpaid" | "fall-considering";

const CAMPAIGN_KEYS: Record<Segment, string> = {
  "fall-paid": "fall-2026-confirmed-v1",
  "fall-unpaid": "fall-2026-payment-outstanding-v1",
  "fall-considering": "fall-2026-still-considering-v1",
};

interface Recipient {
  email: string;
  first_name: string;
  last_name: string;
}

function esc(s: string): string {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

// ---------- shared layout ----------

const P = `margin:0 0 14px;color:#111;font-size:15px;line-height:1.65;`;
const BTN = (href: string, label: string) => `
  <div style="text-align:center;margin:22px 0;">
    <a href="${href}" style="display:inline-block;background:#f472b6;color:#ffffff;padding:13px 28px;border-radius:999px;text-decoration:none;font-weight:700;font-family:Quicksand,Arial,sans-serif;font-size:15px;">${label}</a>
  </div>`;

const PAYMENT_BOX_EN = `
  <div style="background:#fff5ec;border-left:4px solid #f97316;border-radius:10px;padding:14px 18px;margin:18px 0;">
    <div style="font-weight:700;color:#9a3412;margin-bottom:6px;font-family:Quicksand,Arial,sans-serif;">Interac e-Transfer details</div>
    <p style="margin:3px 0;font-size:15px;color:#7c2d12;"><strong>Send to:</strong> ailsa@clubchoir.ca</p>
    <p style="margin:3px 0;font-size:15px;color:#7c2d12;"><strong>Amount:</strong> $280.00 CAD</p>
    <p style="margin:3px 0;font-size:15px;color:#7c2d12;"><strong>Security question:</strong> What is the name of the choir?</p>
    <p style="margin:3px 0;font-size:15px;color:#7c2d12;"><strong>Answer:</strong> clubchoir <em>(one word, all lowercase)</em></p>
  </div>`;

const PAYMENT_BOX_FR = `
  <div style="background:#fff5ec;border-left:4px solid #f97316;border-radius:10px;padding:14px 18px;margin:18px 0;">
    <div style="font-weight:700;color:#9a3412;margin-bottom:6px;font-family:Quicksand,Arial,sans-serif;">Détails du virement Interac</div>
    <p style="margin:3px 0;font-size:15px;color:#7c2d12;"><strong>Envoyer à :</strong> ailsa@clubchoir.ca</p>
    <p style="margin:3px 0;font-size:15px;color:#7c2d12;"><strong>Montant :</strong> 280,00 $ CAD</p>
    <p style="margin:3px 0;font-size:15px;color:#7c2d12;"><strong>Question de sécurité :</strong> What is the name of the choir?</p>
    <p style="margin:3px 0;font-size:15px;color:#7c2d12;"><strong>Réponse :</strong> clubchoir <em>(un seul mot, en minuscules)</em></p>
  </div>`;

function wrap(inner: string): string {
  return `
  <div style="font-family:Nunito,Arial,sans-serif;max-width:620px;margin:0 auto;padding:28px 24px;color:#111;background:#ffffff;">
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="margin:0;color:#f472b6;font-family:Quicksand,Arial,sans-serif;font-size:26px;">Club Choir</h1>
    </div>
    ${inner}
    <hr style="border:none;border-top:1px solid #eee;margin:28px 0 12px;"/>
    <p style="color:#999;font-size:11px;text-align:center;line-height:1.6;">
      You're receiving this because you're part of the Club Choir community.<br/>
      <a href="mailto:ailsa@clubchoir.ca" style="color:#999;">ailsa@clubchoir.ca</a> · <a href="${SITE_URL}" style="color:#999;">clubchoir.ca</a>
    </p>
  </div>`;
}

const SIGN_EN = `<p style="${P}">Tra-la-la,<br/>Ailsa<br/><span style="color:#777;font-size:14px;">Club Choir</span></p>`;
const SIGN_FR = SIGN_EN;
const DIVIDER = `<hr style="border:none;border-top:1px solid #eee;margin:30px 0;"/>`;

// ---------- templates ----------

function renderPaid(r: Recipient) {
  const first = esc(r.first_name || "there");
  const firstFr = esc(r.first_name || "");
  const inner = `
    <p style="${P}">Hi ${first},</p>
    <p style="${P}">I hope you had a chance to stop by one of our open houses this week. It was wonderful to meet new members and reconnect with so many familiar faces. If you weren't able to join us, we'll have plenty of time to catch up this fall!</p>
    <p style="${P}">I'm happy to confirm that your <strong>registration and payment have been received</strong>. You're all set for the upcoming Club Choir season, and you already have access to the choir schedule.</p>
    ${BTN(`${SITE_URL}/login`, "Sign in & view the schedule")}
    <p style="${P}">If you have any trouble activating your account, signing in, or accessing the schedule, please let me know. I'll be happy to guide you through the process.</p>
    <p style="${P}">Our first rehearsal is officially only <strong>one month away</strong>! I'm so pleased to welcome you—or welcome you back—to the Club Choir family. It's because of members like you that I get to do what I love, and Club Choir truly wouldn't exist without you.</p>
    <p style="${P}">I can't wait to sing with you this fall!</p>
    ${SIGN_EN}
    ${DIVIDER}
    <p style="${P}">Bonjour ${firstFr || "à vous"},</p>
    <p style="${P}">J'espère que vous avez eu l'occasion de passer à l'une de nos journées portes ouvertes cette semaine. Ce fut un réel plaisir de rencontrer de nouveaux membres et de revoir autant de visages familiers. Si vous n'avez pas pu vous joindre à nous, nous aurons tout le temps de nous retrouver cet automne!</p>
    <p style="${P}">Je suis heureuse de vous confirmer que <strong>votre inscription et votre paiement ont bien été reçus</strong>. Tout est prêt pour votre prochaine saison avec Club Choir, et vous avez déjà accès à l'horaire de la chorale.</p>
    ${BTN(`${SITE_URL}/login`, "Se connecter et voir l'horaire")}
    <p style="${P}">Si vous éprouvez des difficultés à activer votre compte, à vous connecter ou à consulter l'horaire, n'hésitez pas à communiquer avec moi. Il me fera plaisir de vous guider.</p>
    <p style="${P}">Notre première répétition aura lieu dans seulement <strong>un mois</strong>! Je suis ravie de vous accueillir—ou de vous retrouver—dans la grande famille de Club Choir. C'est grâce à des membres comme vous que j'ai la chance de faire ce que j'aime, et Club Choir n'existerait tout simplement pas sans vous.</p>
    <p style="${P}">J'ai très hâte de chanter avec vous cet automne!</p>
    ${SIGN_FR}`;
  return {
    subject: "You're all set for the fall season 🎶 / Tout est prêt pour l'automne",
    html: wrap(inner),
  };
}

function renderUnpaid(r: Recipient) {
  const first = esc(r.first_name || "there");
  const firstFr = esc(r.first_name || "");
  const inner = `
    <p style="${P}">Hi ${first},</p>
    <p style="${P}">I hope you had a chance to stop by one of our open houses this week. It was wonderful to meet new members and reconnect with so many familiar faces. If you weren't able to join us, I hope we'll have the opportunity to see each other this fall!</p>
    <p style="${P}">I'm happy to see that you've registered for the upcoming Club Choir season. There's just one step remaining: please send in your payment so I can ensure everything is ready for you.</p>
    ${PAYMENT_BOX_EN}
    <p style="${P}">With our first rehearsal only <strong>one month away</strong>, I encourage you to complete your payment soon. Once it has been received, I'll be able to finalize your registration and make sure you have access to the choir schedule and everything you'll need for the season.</p>
    ${BTN(`${SITE_URL}/fall-registration`, "Registration details")}
    <p style="${P}">If you have any questions about the payment or registration process, please let me know. I'm always happy to help.</p>
    <p style="${P}">I'm so pleased to welcome you—or welcome you back—to the Club Choir family. It's because of members like you that I get to do what I love, and Club Choir truly wouldn't exist without you.</p>
    <p style="${P}">I look forward to singing with you this fall!</p>
    ${SIGN_EN}
    ${DIVIDER}
    <p style="${P}">Bonjour ${firstFr || "à vous"},</p>
    <p style="${P}">J'espère que vous avez eu l'occasion de passer à l'une de nos journées portes ouvertes cette semaine. Ce fut un réel plaisir de rencontrer de nouveaux membres et de revoir autant de visages familiers. Si vous n'avez pas pu vous joindre à nous, j'espère que nous aurons l'occasion de nous retrouver cet automne!</p>
    <p style="${P}">Je suis heureuse de voir que vous vous êtes inscrit(e) à la prochaine saison de Club Choir. Il ne reste qu'une seule étape : veuillez faire parvenir votre paiement afin que je puisse m'assurer que tout est prêt pour vous.</p>
    ${PAYMENT_BOX_FR}
    <p style="${P}">Puisque notre première répétition aura lieu dans seulement <strong>un mois</strong>, je vous encourage à effectuer votre paiement prochainement. Dès sa réception, je pourrai finaliser votre inscription et m'assurer que vous avez accès à l'horaire de la chorale ainsi qu'à tout ce dont vous aurez besoin pour la saison.</p>
    ${BTN(`${SITE_URL}/fall-registration`, "Détails de l'inscription")}
    <p style="${P}">Si vous avez des questions concernant le paiement ou le processus d'inscription, n'hésitez pas à communiquer avec moi. Il me fera plaisir de vous aider.</p>
    <p style="${P}">Je suis ravie de vous accueillir—ou de vous retrouver—dans la grande famille de Club Choir. C'est grâce à des membres comme vous que j'ai la chance de faire ce que j'aime, et Club Choir n'existerait tout simplement pas sans vous.</p>
    <p style="${P}">Au plaisir de chanter avec vous cet automne!</p>
    ${SIGN_FR}`;
  return {
    subject: "One step left to confirm your fall spot / Une dernière étape pour confirmer votre place",
    html: wrap(inner),
  };
}

function renderConsidering(r: Recipient) {
  const first = esc(r.first_name || "there");
  const firstFr = esc(r.first_name || "");
  const inner = `
    <p style="${P}">Hi ${first},</p>
    <p style="${P}">I hope you had a chance to stop by one of our open houses this week. It was wonderful to meet new members and reconnect with so many familiar faces. If you weren't able to join us, I hope we'll have the opportunity to see each other this fall!</p>
    <p style="${P}">If you're still thinking about joining Club Choir, I encourage you to register. Our first rehearsal is officially only <strong>one month away</strong>, and we would be delighted to welcome you to the Club Choir family.</p>
    ${BTN(`${SITE_URL}/fall-registration`, "Register for the fall session")}
    <p style="${P}">You may still have questions before making your decision, and that's completely understandable. I'm available to answer anything you'd like to know about registration, fees, rehearsals, the choir, or what to expect during the season — just write to <a href="mailto:ailsa@clubchoir.ca" style="color:#f472b6;">ailsa@clubchoir.ca</a>.</p>
    <p style="${P}">If you decide to join us, registering soon will give us time to make sure everything is in place for you before our first rehearsal.</p>
    <p style="${P}">Club Choir wouldn't exist without the wonderful people who share their voices and enthusiasm with us. I hope you'll be one of them this fall!</p>
    ${SIGN_EN}
    ${DIVIDER}
    <p style="${P}">Bonjour ${firstFr || "à vous"},</p>
    <p style="${P}">J'espère que vous avez eu l'occasion de passer à l'une de nos journées portes ouvertes cette semaine. Ce fut un réel plaisir de rencontrer de nouveaux membres et de revoir autant de visages familiers. Si vous n'avez pas pu vous joindre à nous, j'espère que nous aurons l'occasion de nous retrouver cet automne!</p>
    <p style="${P}">Si vous songez encore à vous joindre à Club Choir, je vous encourage à vous inscrire. Notre première répétition aura lieu dans seulement <strong>un mois</strong>, et nous serions ravis de vous accueillir dans la grande famille de Club Choir.</p>
    ${BTN(`${SITE_URL}/fall-registration`, "S'inscrire à la session d'automne")}
    <p style="${P}">Il est tout à fait normal d'avoir encore quelques questions avant de prendre votre décision. Je suis disponible pour répondre à toutes vos questions concernant l'inscription, les frais, les répétitions, la chorale ou le déroulement de la saison — écrivez-moi à <a href="mailto:ailsa@clubchoir.ca" style="color:#f472b6;">ailsa@clubchoir.ca</a>.</p>
    <p style="${P}">Si vous décidez de vous joindre à nous, je vous invite à vous inscrire prochainement afin que nous ayons suffisamment de temps pour nous assurer que tout est en place avant notre première répétition.</p>
    <p style="${P}">Club Choir n'existerait pas sans toutes les merveilleuses personnes qui partagent avec nous leur voix et leur enthousiasme. J'espère que vous en ferez partie cet automne!</p>
    ${SIGN_FR}`;
  return {
    subject: "Still thinking about joining us this fall? / Vous songez à vous joindre à nous?",
    html: wrap(inner),
  };
}

function renderEmail(segment: Segment, r: Recipient): { subject: string; html: string } {
  if (segment === "fall-paid") return renderPaid(r);
  if (segment === "fall-unpaid") return renderUnpaid(r);
  return renderConsidering(r);
}

// ---------- recipients ----------

async function loadRecipients(supabase: any, segment: Segment): Promise<Recipient[]> {
  const { data: suppressedRows } = await supabase.from("members").select("email, crm_tags");
  const suppressed = new Set<string>();
  for (const m of suppressedRows || []) {
    if (m.email && Array.isArray(m.crm_tags) && m.crm_tags.includes("no-email")) {
      suppressed.add(String(m.email).toLowerCase());
    }
  }

  const { data: paidRegs } = await supabase
    .from("session_registrations")
    .select("email, first_name, last_name")
    .eq("session_label", "fall-2026")
    .eq("payment_status", "paid");

  const paidMap = new Map<string, Recipient>();
  for (const r of paidRegs || []) {
    const e = String(r.email || "").trim().toLowerCase();
    if (!e.includes("@") || suppressed.has(e)) continue;
    if (!paidMap.has(e)) paidMap.set(e, { email: e, first_name: r.first_name || "", last_name: r.last_name || "" });
  }

  if (segment === "fall-paid") return Array.from(paidMap.values());

  const { data: regRows } = await supabase
    .from("session_registrations")
    .select("email, first_name, last_name")
    .in("session_label", ["fall-2026", "open-house-2026", "try-a-session"])
    .neq("payment_status", "paid");

  const unpaidMap = new Map<string, Recipient>();
  for (const r of regRows || []) {
    const e = String(r.email || "").trim().toLowerCase();
    if (!e.includes("@") || suppressed.has(e) || paidMap.has(e)) continue;
    if (!unpaidMap.has(e)) unpaidMap.set(e, { email: e, first_name: r.first_name || "", last_name: r.last_name || "" });
  }

  if (segment === "fall-unpaid") return Array.from(unpaidMap.values());

  // Everyone else: any contact with no fall registration at all
  const rest = new Map<string, Recipient>();
  const add = (email: any, first: any, last: any) => {
    const e = String(email || "").trim().toLowerCase();
    if (!e.includes("@")) return;
    if (suppressed.has(e) || paidMap.has(e) || unpaidMap.has(e) || rest.has(e)) return;
    rest.set(e, { email: e, first_name: first || "", last_name: last || "" });
  };

  const { data: members } = await supabase
    .from("members").select("email, first_name, last_name, crm_tags")
    .is("archived_at", null);
  for (const m of members || []) {
    if (Array.isArray(m.crm_tags) && m.crm_tags.includes("no-email")) continue;
    add(m.email, m.first_name, m.last_name);
  }

  const { data: rsvps } = await supabase.from("open_house_rsvps").select("email, first_name, last_name");
  for (const g of rsvps || []) add(g.email, g.first_name, g.last_name);

  const { data: prospects } = await supabase.from("prospects").select("email, first_name, last_name");
  for (const p of prospects || []) add(p.email, p.first_name, p.last_name);

  return Array.from(rest.values());
}

// ---------- handler ----------

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

    if (!Object.keys(CAMPAIGN_KEYS).includes(segment)) throw new Error("Invalid segment");

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
      const { subject, html } = renderEmail(segment, sample);
      return new Response(JSON.stringify({ subject, html, count: recipients.length }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY not configured");
    const resend = new Resend(resendKey);

    if (testEmail) {
      const sample = recipients[0] || { email: testEmail, first_name: "Sample", last_name: "" };
      const { subject, html } = renderEmail(segment, { ...sample, email: testEmail });
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

    const key = CAMPAIGN_KEYS[segment];
    const { data: sentRows } = await supabase
      .from("campaign_sends").select("recipient_email")
      .eq("campaign_key", key);
    const alreadySent = new Set<string>((sentRows || []).map((r: any) => String(r.recipient_email).toLowerCase()));
    const toSend = recipients.filter((r) => !alreadySent.has(r.email));

    const results: { success: string[]; failed: string[]; skipped: number } = {
      success: [], failed: [], skipped: recipients.length - toSend.length,
    };
    const batchSize = 5;
    for (let i = 0; i < toSend.length; i += batchSize) {
      const batch = toSend.slice(i, i + batchSize);
      await Promise.all(batch.map(async (r) => {
        try {
          const { subject, html } = renderEmail(segment, r);
          await resend.emails.send({
            from: "Club Choir <noreply@clubchoir.ca>",
            to: [r.email],
            subject,
            html,
          });
          results.success.push(r.email);
          await supabase.from("campaign_sends").insert({
            campaign_key: key, segment, recipient_email: r.email, subject, status: "sent",
          });
        } catch (err: any) {
          results.failed.push(r.email);
          await supabase.from("campaign_sends").insert({
            campaign_key: key, segment, recipient_email: r.email,
            subject: "(failed)", status: "failed",
            error: String(err?.message || err).slice(0, 500),
          });
        }
      }));
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
