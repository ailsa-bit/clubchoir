import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://clubchoir.ca";
const CONTACT = "ailsa@clubchoir.ca";

type Segment = "fall-paid" | "fall-unpaid" | "fall-considering" | "hudson-open-house" | "fall-unpaid-reminder" | "fall-considering-reminder" | "hudson-open-house-reminder" | "hudson-open-house-thanks" | "binder-count-unpaid" | "binder-count-considering";

const CAMPAIGN_KEYS: Record<Segment, string> = {
  "fall-paid": "fall-2026-confirmed-v1",
  "fall-unpaid": "fall-2026-payment-outstanding-v1",
  "fall-considering": "fall-2026-still-considering-v1",
  "hudson-open-house": "hudson-open-house-aug18-v1",
  "fall-unpaid-reminder": "fall-2026-payment-outstanding-v2",
  "fall-considering-reminder": "fall-2026-still-considering-v2",
  "hudson-open-house-reminder": "hudson-open-house-aug18-reminder-v1",
  "hudson-open-house-thanks": "hudson-open-house-aug18-thanks-v1",
  "binder-count-unpaid": "fall-2026-binder-count-unpaid-v1",
  "binder-count-considering": "fall-2026-binder-count-considering-v1",
};

// Aug 18, 2026 Hudson Open House
const HUDSON_RSVP_URL = `${SITE_URL}/hudson-open-house`;
const HUDSON_CUTOFF = new Date("2026-08-08T00:00:00-04:00").getTime();
const AUG18_CAMPAIGN = "hudson_open_house_aug18";

function isAug18Rsvp(r: any): boolean {
  const campaign = `${r.utm_campaign || ""} ${r.source_campaign || ""}`.toLowerCase();
  if (campaign.includes(AUG18_CAMPAIGN)) return true;
  const afterCutoff = +new Date(r.created_at || 0) >= HUDSON_CUTOFF;
  const landing = String(r.landing_page || "").toLowerCase();
  if ((landing.includes("/hudson-open-house") || landing.includes("/fr/hudson-open-house")) && afterCutoff) return true;
  return normLocation(r.location) === "Hudson" && afterCutoff;
}

interface Recipient {
  email: string;
  first_name: string;
  last_name: string;
  location: string;
}

// ---------- location schedule ----------

interface LocInfo {
  city: string;
  dayEn: string; dayFr: string;
  time: string;
  datesEn: string; datesFr: string;
  startEn: string; startFr: string;
  venue: string; address: string;
}

const LOCATIONS: Record<string, LocInfo> = {
  "Montreal": {
    city: "Montreal", dayEn: "Mondays", dayFr: "Lundis", time: "7:00–8:30 PM",
    datesEn: "Sept 7 – Dec 7, 2026", datesFr: "7 sept. – 7 déc. 2026",
    startEn: "Monday, September 7", startFr: "lundi 7 septembre",
    venue: "Kensington Presbyterian Church", address: "6225 Av. Godfrey, Montréal",
  },
  "Hudson": {
    city: "Hudson", dayEn: "Tuesdays", dayFr: "Mardis", time: "7:00–8:30 PM",
    datesEn: "Sept 8 – Dec 8, 2026", datesFr: "8 sept. – 8 déc. 2026",
    startEn: "Tuesday, September 8", startFr: "mardi 8 septembre",
    venue: "The Hudson Legion", address: "57 Beach Road, Hudson",
  },
  "Saint-Hubert": {
    city: "Saint-Hubert", dayEn: "Wednesdays", dayFr: "Mercredis", time: "7:00–8:30 PM",
    datesEn: "Sept 9 – Dec 9, 2026", datesFr: "9 sept. – 9 déc. 2026",
    startEn: "Wednesday, September 9", startFr: "mercredi 9 septembre",
    venue: "St-Gabriel Catholic Church", address: "5070 Rue Gilbert, Saint-Hubert",
  },
  "Pointe-Claire": {
    city: "Pointe-Claire", dayEn: "Thursdays", dayFr: "Jeudis", time: "7:00–8:30 PM",
    datesEn: "Sept 10 – Dec 10, 2026", datesFr: "10 sept. – 10 déc. 2026",
    startEn: "Thursday, September 10", startFr: "jeudi 10 septembre",
    venue: "Valois United Church", address: "70 Av. Belmont, Pointe-Claire",
  },
};

const LOCATION_KEYS = Object.keys(LOCATIONS);

function normLocation(raw: any): string {
  const s = String(raw || "").trim().toLowerCase();
  if (!s) return "";
  if (s.startsWith("mont")) return "Montreal";
  if (s.startsWith("hud")) return "Hudson";
  if (s.includes("hubert")) return "Saint-Hubert";
  if (s.includes("pointe")) return "Pointe-Claire";
  return "";
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
    <p style="margin:3px 0;font-size:15px;color:#7c2d12;"><strong>Send to:</strong> ${CONTACT}</p>
    <p style="margin:3px 0;font-size:15px;color:#7c2d12;"><strong>Amount:</strong> $280.00 CAD (full 14-week session)</p>
    <p style="margin:3px 0;font-size:15px;color:#7c2d12;"><strong>Security question:</strong> What is the name of the choir?</p>
    <p style="margin:3px 0;font-size:15px;color:#7c2d12;"><strong>Answer:</strong> clubchoir <em>(one word, all lowercase)</em></p>
  </div>`;

const PAYMENT_BOX_FR = `
  <div style="background:#fff5ec;border-left:4px solid #f97316;border-radius:10px;padding:14px 18px;margin:18px 0;">
    <div style="font-weight:700;color:#9a3412;margin-bottom:6px;font-family:Quicksand,Arial,sans-serif;">Détails du virement Interac</div>
    <p style="margin:3px 0;font-size:15px;color:#7c2d12;"><strong>Envoyer à :</strong> ${CONTACT}</p>
    <p style="margin:3px 0;font-size:15px;color:#7c2d12;"><strong>Montant :</strong> 280,00 $ CAD (session complète de 14 semaines)</p>
    <p style="margin:3px 0;font-size:15px;color:#7c2d12;"><strong>Question de sécurité :</strong> What is the name of the choir? <em>(en anglais)</em></p>
    <p style="margin:3px 0;font-size:15px;color:#7c2d12;"><strong>Réponse :</strong> clubchoir <em>(un seul mot, en minuscules)</em></p>
  </div>`;

function detailsBox(r: Recipient, lang: "en" | "fr"): string {
  const loc = LOCATIONS[r.location];
  const name = esc([r.first_name, r.last_name].filter(Boolean).join(" ")) || "—";
  const row = (label: string, value: string) =>
    `<p style="margin:3px 0;font-size:15px;color:#0f3d2e;"><strong>${label}</strong> ${value}</p>`;
  const title = lang === "en" ? "Your details — please check them over" : "Vos informations — merci de les vérifier";
  const rows = lang === "en"
    ? [
        row("Name:", name),
        row("Email:", esc(r.email)),
        row("Location:", loc ? `${esc(loc.city)} — ${esc(loc.venue)}, ${esc(loc.address)}` : "not on file"),
        loc ? row("Rehearsals:", `${loc.dayEn}, ${loc.time}`) : "",
        loc ? row("Session:", `${loc.datesEn} (14 weeks)`) : "",
        loc ? row("First rehearsal:", loc.startEn) : "",
      ].join("")
    : [
        row("Nom :", name),
        row("Courriel :", esc(r.email)),
        row("Lieu :", loc ? `${esc(loc.city)} — ${esc(loc.venue)}, ${esc(loc.address)}` : "non inscrit à votre dossier"),
        loc ? row("Répétitions :", `${loc.dayFr}, ${loc.time}`) : "",
        loc ? row("Session :", `${loc.datesFr} (14 semaines)`) : "",
        loc ? row("Première répétition :", loc.startFr) : "",
      ].join("");
  const note = lang === "en"
    ? `If anything above is incorrect or incomplete, simply reply to this email or write to <a href="mailto:${CONTACT}" style="color:#f472b6;">${CONTACT}</a> and I'll update it right away.`
    : `Si une information ci-dessus est inexacte ou incomplète, répondez simplement à ce courriel ou écrivez-moi à <a href="mailto:${CONTACT}" style="color:#f472b6;">${CONTACT}</a> et je la corrigerai sans tarder.`;
  return `
  <div style="background:#ecfdf5;border-left:4px solid #10b981;border-radius:10px;padding:14px 18px;margin:18px 0;">
    <div style="font-weight:700;color:#065f46;margin-bottom:6px;font-family:Quicksand,Arial,sans-serif;">${title}</div>
    ${rows}
    <p style="margin:10px 0 0;font-size:14px;color:#065f46;line-height:1.6;">${note}</p>
  </div>`;
}

function firstRehearsalEn(r: Recipient): string {
  const loc = LOCATIONS[r.location];
  return loc ? `on <strong>${loc.startEn}</strong>` : `in <strong>early September</strong>`;
}
function firstRehearsalFr(r: Recipient): string {
  const loc = LOCATIONS[r.location];
  return loc ? `le <strong>${loc.startFr}</strong>` : `au <strong>début septembre</strong>`;
}

function wrap(inner: string, preheader: string): string {
  return `
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
  <div style="font-family:Nunito,Arial,sans-serif;max-width:620px;margin:0 auto;padding:28px 24px;color:#111;background:#ffffff;">
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="margin:0;color:#f472b6;font-family:Quicksand,Arial,sans-serif;font-size:26px;">Club Choir</h1>
    </div>
    ${inner}
    <hr style="border:none;border-top:1px solid #eee;margin:28px 0 12px;"/>
    <p style="color:#999;font-size:11px;text-align:center;line-height:1.6;">
      You're receiving this because you're part of the Club Choir community.<br/>
      Vous recevez ce courriel parce que vous faites partie de la communauté Club Choir.<br/>
      <a href="mailto:${CONTACT}" style="color:#999;">${CONTACT}</a> · <a href="${SITE_URL}" style="color:#999;">clubchoir.ca</a>
    </p>
  </div>`;
}

const SIGN = `<p style="${P}">Tra-la-la,<br/>Ailsa<br/><span style="color:#777;font-size:14px;">Club Choir</span></p>`;
const DIVIDER = `<hr style="border:none;border-top:1px solid #eee;margin:30px 0;"/>`;

const greetEn = (r: Recipient) => `<p style="${P}">Hi ${esc(r.first_name) || "there"},</p>`;
const greetFr = (r: Recipient) => `<p style="${P}">Bonjour${r.first_name ? " " + esc(r.first_name) : ""},</p>`;

// ---------- templates ----------

function renderPaid(r: Recipient) {
  const loc = LOCATIONS[r.location];
  const inner = `
    ${greetEn(r)}
    <p style="${P}">I hope you had a chance to stop by one of our open houses this week. It was wonderful to meet new members and reconnect with so many familiar faces. If you weren't able to join us, we'll have plenty of time to catch up this fall!</p>
    <p style="${P}">I'm happy to confirm that your <strong>registration and payment have been received</strong>. You're all set for the upcoming Club Choir season.</p>
    ${detailsBox(r, "en")}
    <p style="${P}">Your membership is active, so you can sign in at clubchoir.ca to see the schedule and the songs we'll be learning. If you haven't created your account yet, use <strong>this same email address</strong> when you sign up and everything will be linked automatically.</p>
    ${BTN(`${SITE_URL}/login`, "Sign in & view the schedule")}
    <p style="${P}">If you have any trouble creating your account, signing in, or accessing the schedule, please let me know. I'll be happy to walk you through it.</p>
    <p style="${P}">Our first rehearsal is ${firstRehearsalEn(r)}! I'm so pleased to welcome you—or welcome you back—to the Club Choir family. It's because of members like you that I get to do what I love, and Club Choir truly wouldn't exist without you.</p>
    <p style="${P}">I can't wait to sing with you this fall!</p>
    ${SIGN}
    ${DIVIDER}
    ${greetFr(r)}
    <p style="${P}">J'espère que vous avez eu l'occasion de passer à l'une de nos journées portes ouvertes cette semaine. Ce fut un réel plaisir de rencontrer de nouveaux membres et de revoir autant de visages familiers. Si vous n'avez pas pu vous joindre à nous, nous aurons tout le temps de nous retrouver cet automne!</p>
    <p style="${P}">Je suis heureuse de vous confirmer que <strong>votre inscription et votre paiement ont bien été reçus</strong>. Tout est prêt pour votre prochaine saison avec Club Choir.</p>
    ${detailsBox(r, "fr")}
    <p style="${P}">Votre adhésion est active : vous pouvez vous connecter à clubchoir.ca pour consulter l'horaire et les chansons que nous apprendrons. Si vous n'avez pas encore créé votre compte, utilisez <strong>cette même adresse courriel</strong> lors de l'inscription et tout sera relié automatiquement.</p>
    ${BTN(`${SITE_URL}/login`, "Se connecter et voir l'horaire")}
    <p style="${P}">Si vous éprouvez des difficultés à créer votre compte, à vous connecter ou à consulter l'horaire, n'hésitez pas à communiquer avec moi. Il me fera plaisir de vous guider.</p>
    <p style="${P}">Notre première répétition aura lieu ${firstRehearsalFr(r)}! Je suis ravie de vous accueillir—ou de vous retrouver—dans la grande famille de Club Choir. C'est grâce à des membres comme vous que j'ai la chance de faire ce que j'aime, et Club Choir n'existerait tout simplement pas sans vous.</p>
    <p style="${P}">J'ai très hâte de chanter avec vous cet automne!</p>
    ${SIGN}`;
  const where = loc ? ` — ${loc.city}, ${loc.dayEn}` : "";
  return {
    subject: `You're all set for the fall season${where ? ` (${loc!.city})` : ""} 🎶 / Tout est prêt pour l'automne`,
    html: wrap(inner, `Registration and payment confirmed${where}. Please check your details.`),
  };
}

function renderUnpaid(r: Recipient) {
  const loc = LOCATIONS[r.location];
  const inner = `
    ${greetEn(r)}
    <p style="${P}">I hope you had a chance to stop by one of our open houses this week. It was wonderful to meet new members and reconnect with so many familiar faces. If you weren't able to join us, I hope we'll have the opportunity to see each other this fall!</p>
    <p style="${P}">I'm happy to see that you've registered for the upcoming Club Choir season. There's just one step remaining: your payment.</p>
    ${detailsBox(r, "en")}
    ${PAYMENT_BOX_EN}
    <p style="${P}"><em>If you've already sent your payment, thank you — please disregard this reminder, and let me know if it hasn't been credited.</em></p>
    <p style="${P}">With our first rehearsal ${firstRehearsalEn(r)}, I encourage you to complete your payment soon. Once it arrives, I'll finalize your registration and activate your access to the choir schedule and everything you'll need for the season.</p>
    ${BTN(`${SITE_URL}/fall-registration`, "View registration & payment info")}
    <p style="${P}">If you have any questions about the payment or registration process, please let me know. I'm always happy to help.</p>
    <p style="${P}">I'm so pleased to welcome you—or welcome you back—to the Club Choir family. It's because of members like you that I get to do what I love, and Club Choir truly wouldn't exist without you.</p>
    <p style="${P}">I look forward to singing with you this fall!</p>
    ${SIGN}
    ${DIVIDER}
    ${greetFr(r)}
    <p style="${P}">J'espère que vous avez eu l'occasion de passer à l'une de nos journées portes ouvertes cette semaine. Ce fut un réel plaisir de rencontrer de nouveaux membres et de revoir autant de visages familiers. Si vous n'avez pas pu vous joindre à nous, j'espère que nous aurons l'occasion de nous retrouver cet automne!</p>
    <p style="${P}">Je suis heureuse de voir que vous vous êtes inscrit(e) à la prochaine saison de Club Choir. Il ne reste qu'une seule étape : votre paiement.</p>
    ${detailsBox(r, "fr")}
    ${PAYMENT_BOX_FR}
    <p style="${P}"><em>Si vous avez déjà envoyé votre paiement, merci beaucoup — ne tenez pas compte de ce rappel, et faites-moi signe s'il n'a pas été enregistré.</em></p>
    <p style="${P}">Puisque notre première répétition aura lieu ${firstRehearsalFr(r)}, je vous encourage à effectuer votre paiement prochainement. Dès sa réception, je finaliserai votre inscription et activerai votre accès à l'horaire de la chorale ainsi qu'à tout ce dont vous aurez besoin pour la saison.</p>
    ${BTN(`${SITE_URL}/fall-registration`, "Voir les détails d'inscription et de paiement")}
    <p style="${P}">Si vous avez des questions concernant le paiement ou le processus d'inscription, n'hésitez pas à communiquer avec moi. Il me fera plaisir de vous aider.</p>
    <p style="${P}">Je suis ravie de vous accueillir—ou de vous retrouver—dans la grande famille de Club Choir. C'est grâce à des membres comme vous que j'ai la chance de faire ce que j'aime, et Club Choir n'existerait tout simplement pas sans vous.</p>
    <p style="${P}">Au plaisir de chanter avec vous cet automne!</p>
    ${SIGN}`;
  return {
    subject: `One step left to confirm your fall spot${loc ? ` (${loc.city})` : ""} / Une dernière étape pour confirmer votre place`,
    html: wrap(inner, "Your registration is in — payment is the last step. Please check your details."),
  };
}

function renderConsidering(r: Recipient) {
  const loc = LOCATIONS[r.location];
  const scheduleEn = loc
    ? `<p style="${P}">Here's what your season would look like in <strong>${esc(loc.city)}</strong>: ${loc.dayEn} from ${loc.time} at ${esc(loc.venue)} (${esc(loc.address)}), ${loc.datesEn} — 14 weeks for <strong>$280</strong>, ending with a fun community showcase.</p>`
    : `<p style="${P}">Our fall session runs for 14 weeks from early September to early December, one evening a week from 7:00–8:30 PM, for <strong>$280</strong> — and we sing in Montreal, Hudson, Saint-Hubert and Pointe-Claire.</p>`;
  const scheduleFr = loc
    ? `<p style="${P}">Voici à quoi ressemblerait votre saison à <strong>${esc(loc.city)}</strong> : les ${loc.dayFr.toLowerCase()} de ${loc.time} à ${esc(loc.venue)} (${esc(loc.address)}), du ${loc.datesFr} — 14 semaines pour <strong>280 $</strong>, avec un spectacle communautaire en clôture.</p>`
    : `<p style="${P}">Notre session d'automne dure 14 semaines, du début septembre au début décembre, un soir par semaine de 19 h à 20 h 30, pour <strong>280 $</strong> — à Montréal, Hudson, Saint-Hubert et Pointe-Claire.</p>`;
  const inner = `
    ${greetEn(r)}
    <p style="${P}">I hope you had a chance to stop by one of our open houses this week. It was wonderful to meet new members and reconnect with so many familiar faces. If you weren't able to join us, I hope we'll have the opportunity to see each other this fall!</p>
    <p style="${P}">If you're still thinking about joining Club Choir, I encourage you to register. Our first rehearsal is ${firstRehearsalEn(r)}, and we would be delighted to welcome you to the Club Choir family.</p>
    ${scheduleEn}
    ${BTN(`${SITE_URL}/fall-registration`, "Register for the fall session")}
    <p style="${P}">You may still have questions before making your decision, and that's completely understandable. I'm available to answer anything you'd like to know about registration, fees, rehearsals, the choir, or what to expect during the season — just write to <a href="mailto:${CONTACT}" style="color:#f472b6;">${CONTACT}</a>. And if the location above isn't the right one for you, let me know and I'll point you to the group nearest you.</p>
    <p style="${P}">If you decide to join us, registering soon will give us time to make sure everything is in place for you before our first rehearsal.</p>
    <p style="${P}">Club Choir wouldn't exist without the wonderful people who share their voices and enthusiasm with us. I hope you'll be one of them this fall!</p>
    ${SIGN}
    ${DIVIDER}
    ${greetFr(r)}
    <p style="${P}">J'espère que vous avez eu l'occasion de passer à l'une de nos journées portes ouvertes cette semaine. Ce fut un réel plaisir de rencontrer de nouveaux membres et de revoir autant de visages familiers. Si vous n'avez pas pu vous joindre à nous, j'espère que nous aurons l'occasion de nous retrouver cet automne!</p>
    <p style="${P}">Si vous songez encore à vous joindre à Club Choir, je vous encourage à vous inscrire. Notre première répétition aura lieu ${firstRehearsalFr(r)}, et nous serions ravis de vous accueillir dans la grande famille de Club Choir.</p>
    ${scheduleFr}
    ${BTN(`${SITE_URL}/fall-registration`, "S'inscrire à la session d'automne")}
    <p style="${P}">Il est tout à fait normal d'avoir encore quelques questions avant de prendre votre décision. Je suis disponible pour répondre à toutes vos questions concernant l'inscription, les frais, les répétitions, la chorale ou le déroulement de la saison — écrivez-moi à <a href="mailto:${CONTACT}" style="color:#f472b6;">${CONTACT}</a>. Et si le lieu indiqué ci-dessus ne vous convient pas, dites-le-moi et je vous orienterai vers le groupe le plus près de chez vous.</p>
    <p style="${P}">Si vous décidez de vous joindre à nous, je vous invite à vous inscrire prochainement afin que nous ayons suffisamment de temps pour nous assurer que tout est en place avant notre première répétition.</p>
    <p style="${P}">Club Choir n'existerait pas sans toutes les merveilleuses personnes qui partagent avec nous leur voix et leur enthousiasme. J'espère que vous en ferez partie cet automne!</p>
    ${SIGN}`;
  return {
    subject: `Still thinking about joining us this fall?${loc ? ` (${loc.city})` : ""} / Vous songez à vous joindre à nous?`,
    html: wrap(inner, "14 weeks of singing starts in September — here are the details."),
  };
}

// ---------- reminder (v2) templates — shorter, urgent, fresh subject lines ----------

function renderUnpaidReminder(r: Recipient) {
  const loc = LOCATIONS[r.location];
  const locNameEn = loc ? esc(loc.city) : "";
  const locNameFr = loc ? esc(loc.city) : "";
  const inner = `
    ${greetEn(r)}
    <p style="${P}">Just a quick follow-up: your registration for the ${locNameEn ? `${locNameEn} ` : ""}fall season is in and your spot is reserved — the only thing left is your payment so I can finalize everything.</p>
    ${PAYMENT_BOX_EN}
    <p style="${P}">Our first rehearsal is ${firstRehearsalEn(r)}, so there's still time — but I'd love to have you fully confirmed before then.</p>
    <p style="${P}"><em>Already sent your payment? Thank you! Please disregard this note — if it hasn't shown up yet, just drop me a line and I'll track it down.</em></p>
    ${SIGN}
    ${DIVIDER}
    ${greetFr(r)}
    <p style="${P}">Petit suivi : votre inscription à la session d'automne${locNameFr ? ` de ${locNameFr}` : ""} est enregistrée et votre place est réservée — il ne reste que le paiement pour que je puisse tout finaliser.</p>
    ${PAYMENT_BOX_FR}
    <p style="${P}">Notre première répétition aura lieu ${firstRehearsalFr(r)} — il reste donc encore un peu de temps, mais j'aimerais beaucoup que tout soit confirmé d'ici là.</p>
    <p style="${P}"><em>Vous avez déjà envoyé votre paiement? Merci! Veuillez ne pas tenir compte de ce message — s'il n'est pas encore enregistré, écrivez-moi et je le retrouverai.</em></p>
    ${SIGN}`;
  return {
    subject: `Your fall spot is reserved — one step left${loc ? ` (${loc.city})` : ""} / Votre place est réservée — une dernière étape`,
    html: wrap(inner, "Just your payment left to confirm your spot — here are the Interac details."),
  };
}

function renderConsideringReminder(r: Recipient) {
  const loc = LOCATIONS[r.location];
  const scheduleEn = loc
    ? `<p style="${P}">Here's what your fall would look like in <strong>${esc(loc.city)}</strong>: ${loc.dayEn} from ${loc.time} at ${esc(loc.venue)} (${esc(loc.address)}), ${loc.datesEn} — 14 weeks for <strong>$280</strong>, ending with a showcase for friends and family.</p>`
    : `<p style="${P}">Our fall session runs 14 weeks from early September to early December, one evening a week (7:00–8:30 PM) for <strong>$280</strong> — in Montreal, Hudson, Saint-Hubert and Pointe-Claire.</p>`;
  const scheduleFr = loc
    ? `<p style="${P}">Voici à quoi ressemblerait votre automne à <strong>${esc(loc.city)}</strong> : les ${loc.dayFr.toLowerCase()} de ${loc.time} à ${esc(loc.venue)} (${esc(loc.address)}), du ${loc.datesFr} — 14 semaines pour <strong>280 $</strong>, avec un spectacle pour vos proches et vos ami(e)s en clôture.</p>`
    : `<p style="${P}">Notre session d'automne dure 14 semaines, du début septembre au début décembre, un soir par semaine (19 h–20 h 30) pour <strong>280 $</strong> — à Montréal, Hudson, Saint-Hubert et Pointe-Claire.</p>`;
  const inner = `
    ${greetEn(r)}
    <p style="${P}">September is quickly approaching; there's still time to join us this fall.</p>
    ${scheduleEn}
    ${BTN(`${SITE_URL}/fall-registration`, "Register here")}
    <p style="${P}">We would love to have you with us this fall — I hope you'll take the leap and come sing!</p>
    ${SIGN}
    ${DIVIDER}
    ${greetFr(r)}
    <p style="${P}">Le mois de septembre approche à grands pas; il est encore temps de vous joindre à nous cet automne.</p>
    ${scheduleFr}
    ${BTN(`${SITE_URL}/fall-registration`, "S'inscrire ici")}
    <p style="${P}">Nous serions ravis de vous compter parmi nous cet automne — j'espère que vous ferez le saut et viendrez chanter !</p>
    ${SIGN}`;
  return {
    subject: `There's still time to join us this fall${loc ? ` (${loc.city})` : ""} / Il est encore temps de vous joindre à nous`,
    html: wrap(inner, "September is almost here — register and save your spot for the fall session."),
  };
}

function renderHudsonOpenHouse(_r: Recipient) {
  const inner = `
    <p style="${P}">Hello everyone,</p>
    <p style="${P}">First of all, a heartfelt <strong>thank you</strong> to everyone who has already signed up for the new session. This is going to be such a fun fall in Hudson — I can hardly wait to get started.</p>
    <p style="${P}">Because so many of you asked, we've decided to hold a <strong>second open house</strong>:</p>
    <div style="background:#ecfdf5;border-left:4px solid #10b981;border-radius:10px;padding:14px 18px;margin:18px 0;">
      <p style="margin:3px 0;font-size:15px;color:#0f3d2e;"><strong>Tuesday, August 18, 2026</strong></p>
      <p style="margin:3px 0;font-size:15px;color:#0f3d2e;">7:30 PM</p>
      <p style="margin:3px 0;font-size:15px;color:#0f3d2e;">The Hudson Legion — 57 Beach Road, Hudson</p>
    </div>
    <p style="${P}">If you're still undecided, or you simply didn't have the chance to come to the first open house, please come and sing with us for an evening. No auditions, no music reading, no pressure — just a room full of people having a wonderful time.</p>
    ${BTN(HUDSON_RSVP_URL, "Save my spot for August 18")}
    <p style="${P}">We would truly love the opportunity to meet as many of you as possible before our first night together. Bring a friend if you'd like!</p>
    <p style="${P}">Any questions at all, just write to <a href="mailto:${CONTACT}" style="color:#f472b6;">${CONTACT}</a>.</p>
    ${SIGN}
    ${DIVIDER}
    <p style="${P}">Bonjour à tous et à toutes,</p>
    <p style="${P}">Tout d'abord, un immense <strong>merci</strong> à toutes les personnes qui se sont déjà inscrites à la nouvelle session. Cet automne à Hudson s'annonce vraiment amusant — j'ai bien hâte de commencer!</p>
    <p style="${P}">Comme plusieurs d'entre vous l'ont demandé, nous avons décidé d'organiser une <strong>deuxième journée portes ouvertes</strong> :</p>
    <div style="background:#ecfdf5;border-left:4px solid #10b981;border-radius:10px;padding:14px 18px;margin:18px 0;">
      <p style="margin:3px 0;font-size:15px;color:#0f3d2e;"><strong>Mardi 18 août 2026</strong></p>
      <p style="margin:3px 0;font-size:15px;color:#0f3d2e;">19 h 30</p>
      <p style="margin:3px 0;font-size:15px;color:#0f3d2e;">La Légion de Hudson — 57 Beach Road, Hudson</p>
    </div>
    <p style="${P}">Si vous hésitez encore, ou si vous n'avez pas eu la chance de venir à la première soirée, venez chanter avec nous le temps d'une soirée. Sans audition, sans lecture de musique et sans pression — simplement une salle remplie de gens qui s'amusent.</p>
    ${BTN(HUDSON_RSVP_URL, "Réserver ma place pour le 18 août")}
    <p style="${P}">Nous aimerions vraiment avoir l'occasion de rencontrer le plus grand nombre d'entre vous avant notre première soirée. N'hésitez pas à venir accompagné(e)!</p>
    <p style="${P}">Pour toute question, écrivez-moi à <a href="mailto:${CONTACT}" style="color:#f472b6;">${CONTACT}</a>.</p>
    ${SIGN}`;
  return {
    subject: "You're invited: second Hudson open house, Tuesday August 18 🎶 / Portes ouvertes à Hudson le 18 août",
    html: wrap(inner, "A second Hudson open house on Tuesday, August 18 at 7:30 PM — come sing with us."),
  };
}

function renderHudsonOpenHouseReminder(r: Recipient) {
  const inner = `
    ${greetEn(r)}
    <p style="${P}">Just a quick note to say how much I'm looking forward to seeing you at the Hudson open house <strong>tomorrow night</strong>! It's going to be a lovely evening.</p>
    <div style="background:#ecfdf5;border-left:4px solid #10b981;border-radius:10px;padding:14px 18px;margin:18px 0;">
      <p style="margin:3px 0;font-size:15px;color:#0f3d2e;"><strong>Tuesday, August 18, 2026</strong></p>
      <p style="margin:3px 0;font-size:15px;color:#0f3d2e;">7:30 PM</p>
      <p style="margin:3px 0;font-size:15px;color:#0f3d2e;">The Hudson Legion — 57 Beach Road, Hudson</p>
    </div>
    <p style="${P}">You don't need to bring anything — just yourself! We'll start with a brief rundown of what to expect during a Club Choir session, and then we'll learn a simplified song arrangement, Club Choir style. No auditions, no music reading, no pressure — just come ready to sing and have a good time.</p>
    <p style="${P}">Feel free to arrive a little early so you can get settled and have a chance to chat with everyone before we get started.</p>
    <p style="${P}">If you have any questions before tomorrow night, feel free to write to <a href="mailto:${CONTACT}" style="color:#f472b6;">${CONTACT}</a>. See you soon!</p>
    ${SIGN}
    ${DIVIDER}
    ${greetFr(r)}
    <p style="${P}">Petit mot pour vous dire à quel point j'ai hâte de vous voir à la soirée portes ouvertes de Hudson <strong>demain soir</strong>! Ce sera une belle soirée.</p>
    <div style="background:#ecfdf5;border-left:4px solid #10b981;border-radius:10px;padding:14px 18px;margin:18px 0;">
      <p style="margin:3px 0;font-size:15px;color:#0f3d2e;"><strong>Mardi 18 août 2026</strong></p>
      <p style="margin:3px 0;font-size:15px;color:#0f3d2e;">19 h 30</p>
      <p style="margin:3px 0;font-size:15px;color:#0f3d2e;">La Légion de Hudson — 57 Beach Road, Hudson</p>
    </div>
    <p style="${P}">Vous n'avez rien à apporter — juste vous-même! Nous commencerons par un bref aperçu de ce à quoi ressemble une soirée avec Club Choir, puis nous apprendrons un arrangement de chanson simplifié, façon Club Choir. Sans audition, sans lecture de musique et sans pression — venez prêts à chanter et à passer un bon moment.</p>
    <p style="${P}">N'hésitez pas à arriver un peu en avance pour vous installer et avoir l'occasion de jaser un peu avec tout le monde avant de commencer.</p>
    <p style="${P}">Si vous avez des questions avant demain soir, n'hésitez pas à m'écrire à <a href="mailto:${CONTACT}" style="color:#f472b6;">${CONTACT}</a>. À bientôt!</p>
    ${SIGN}`;
  return {
    subject: "See you tomorrow night at the Hudson open house 🎶 / Rendez-vous demain soir à Hudson",
    html: wrap(inner, "Tomorrow night at 7:30 PM — you don't need to bring anything, just yourself!"),
  };
}

function renderHudsonOpenHouseThanks(_r: Recipient) {
  const inner = `
    <p style="${P}">Hello everyone,</p>
    <p style="${P}">Thank you to everyone who attended our open house tonight! The energy was incredible, and the evening was a great success.</p>
    <p style="${P}">If you weren't able to attend but are interested in learning more about Club Choir, please feel free to email me with any questions at <a href="mailto:${CONTACT}" style="color:#f472b6;">${CONTACT}</a>.</p>
    <p style="${P}">For those who joined us tonight, you can reach me at the same email address with any questions. As promised during my presentation, here is the link for our upcoming session:</p>
    ${BTN(`${SITE_URL}/register`, "Register for the fall session")}
    <p style="${P}">The 14-week session begins <strong>September 8</strong>. Once you've completed the registration process, you'll have access to the members' section, where you can find the full schedule for the session. You'll also receive emails leading up to our first night confirming the start time and providing everything you need to get ready.</p>
    <p style="${P}">Thank you again for your enthusiasm. I look forward to singing with you!</p>
    ${SIGN}
    ${DIVIDER}
    <p style="${P}">Bonjour à tous et à toutes,</p>
    <p style="${P}">Merci à toutes les personnes qui sont venues à notre journée portes ouvertes ce soir! L'énergie était incroyable et la soirée fut un franc succès.</p>
    <p style="${P}">Si vous n'avez pas pu y assister mais que vous aimeriez en savoir plus sur Club Choir, n'hésitez pas à m'écrire pour toute question à <a href="mailto:${CONTACT}" style="color:#f472b6;">${CONTACT}</a>.</p>
    <p style="${P}">Pour celles et ceux qui étaient des nôtres ce soir, vous pouvez me joindre à la même adresse pour toute question. Comme promis pendant ma présentation, voici le lien pour notre prochaine session :</p>
    ${BTN(`${SITE_URL}/register`, "S'inscrire à la session d'automne")}
    <p style="${P}">La session de 14 semaines débute le <strong>8 septembre</strong>. Une fois votre inscription complétée, vous aurez accès à la section des membres, où se trouve l'horaire complet de la session. Vous recevrez aussi des courriels avant notre première soirée pour confirmer l'heure de début et vous donner tout ce qu'il faut pour bien vous préparer.</p>
    <p style="${P}">Merci encore pour votre enthousiasme. J'ai hâte de chanter avec vous!</p>
    ${SIGN}`;
  return {
    subject: "Thank you for a wonderful open house 🎶 / Merci pour cette belle soirée portes ouvertes",
    html: wrap(inner, "Thank you for coming! Here's the registration link for our 14-week fall session starting September 8."),
  };
}

function renderBinderUnpaid(r: Recipient) {
  const loc = LOCATIONS[r.location];
  const whereEn = loc ? `<strong>${esc(loc.city)}</strong>` : "your location";
  const whereFr = loc ? `<strong>${esc(loc.city)}</strong>` : "votre groupe";
  const inner = `
    ${greetEn(r)}
    <p style="${P}">Big news: I'm off to buy <strong>binders</strong> 🎉 — one for every single singer joining us this fall, packed with the lyrics and everything you'll need for our 14 weeks together.</p>
    <p style="${P}">Which brings me to a small but important favour. Your spot for ${whereEn} is <strong>reserved but not yet confirmed</strong>, because your payment hasn't come in yet. I count binders (and chairs, and music, and snacks-worthy energy) based on confirmed singers — so completing your registration this week makes sure there's a binder with your name on it.</p>
    ${detailsBox(r, "en")}
    ${PAYMENT_BOX_EN}
    <p style="${P}"><em>Already sent your payment? Thank you — ignore this one, and give me a shout if it hasn't been credited.</em></p>
    <p style="${P}">One more thing: I'll be sending out <strong>important emails over the next couple of weeks</strong> to get everyone ready for our first night — start times, what to bring, parking tips, the songs. Confirmed members get all of it, and I'd hate for you to miss out.</p>
    <p style="${P}">Our first rehearsal is ${firstRehearsalEn(r)}. Let's get you on the list!</p>
    ${BTN(`${SITE_URL}/fall-registration`, "Complete my registration")}
    ${SIGN}
    ${DIVIDER}
    ${greetFr(r)}
    <p style="${P}">Grande nouvelle : je pars acheter les <strong>cartables</strong> 🎉 — un pour chaque choriste qui se joint à nous cet automne, avec les paroles et tout ce qu'il faut pour nos 14 semaines ensemble.</p>
    <p style="${P}">D'où ce petit service à vous demander. Votre place à ${whereFr} est <strong>réservée, mais pas encore confirmée</strong>, car votre paiement n'est pas encore arrivé. Je commande les cartables (et les chaises, et les partitions) selon le nombre de choristes confirmés — compléter votre inscription cette semaine garantit qu'un cartable portera votre nom.</p>
    ${detailsBox(r, "fr")}
    ${PAYMENT_BOX_FR}
    <p style="${P}"><em>Vous avez déjà envoyé votre paiement? Merci — ne tenez pas compte de ce rappel, et écrivez-moi s'il n'a pas été enregistré.</em></p>
    <p style="${P}">Autre chose : j'enverrai <strong>des courriels importants au cours des prochaines semaines</strong> pour préparer notre première soirée — heure d'arrivée, quoi apporter, stationnement, les chansons. Les membres confirmés reçoivent tout, et je ne voudrais pas que vous manquiez quoi que ce soit.</p>
    <p style="${P}">Notre première répétition a lieu ${firstRehearsalFr(r)}. Réservons votre cartable!</p>
    ${BTN(`${SITE_URL}/fall-registration`, "Compléter mon inscription")}
    ${SIGN}`;
  return {
    subject: `I'm buying binders — is one of them yours? 🎶 / J'achète les cartables — y en a-t-il un pour vous?`,
    html: wrap(inner, "Confirming numbers for binders this week — complete your registration so you don't miss the prep emails."),
  };
}

function renderBinderConsidering(r: Recipient) {
  const loc = LOCATIONS[r.location];
  const scheduleEn = loc
    ? `<p style="${P}">In <strong>${esc(loc.city)}</strong> we sing ${loc.dayEn} from ${loc.time} at ${esc(loc.venue)} (${esc(loc.address)}), ${loc.datesEn} — 14 weeks for <strong>$280</strong>, ending with a showcase for friends and family.</p>`
    : `<p style="${P}">We sing in Montreal, Hudson, Saint-Hubert and Pointe-Claire — one evening a week, 7:00–8:30 PM, 14 weeks for <strong>$280</strong>, ending with a showcase for friends and family.</p>`;
  const scheduleFr = loc
    ? `<p style="${P}">À <strong>${esc(loc.city)}</strong>, on chante les ${loc.dayFr.toLowerCase()} de ${loc.time} à ${esc(loc.venue)} (${esc(loc.address)}), du ${loc.datesFr} — 14 semaines pour <strong>280 $</strong>, avec un spectacle pour la famille et les amis en clôture.</p>`
    : `<p style="${P}">On chante à Montréal, Hudson, Saint-Hubert et Pointe-Claire — un soir par semaine, de 19 h à 20 h 30, 14 semaines pour <strong>280 $</strong>, avec un spectacle pour la famille et les amis en clôture.</p>`;
  const inner = `
    ${greetEn(r)}
    <p style="${P}">Quick note from the binder aisle 🛒 — I'm buying <strong>one binder per singer</strong> for the fall season, and I'd love to have one waiting for you.</p>
    <p style="${P}">September is coming up fast, and over the next couple of weeks I'll be sending out the <strong>important pre-season emails</strong>: what to expect on the first night, when to arrive, what to bring, and the songs we'll be learning. Those go to registered singers — so if you've been thinking "yes, but later", now's the moment so you don't miss out.</p>
    ${scheduleEn}
    <p style="${P}">No audition. No music reading. Just a room full of people having a great time singing songs you already love, ${firstRehearsalEn(r).replace("on <strong>", "starting <strong>").replace("in <strong>", "starting <strong>")}.</p>
    ${BTN(`${SITE_URL}/register`, "Register for the fall session")}
    <p style="${P}">Questions before you decide — location, fees, anything at all? Write me at <a href="mailto:${CONTACT}" style="color:#f472b6;">${CONTACT}</a> and I'll answer personally.</p>
    <p style="${P}">Hope to be labelling a binder with your name this week!</p>
    ${SIGN}
    ${DIVIDER}
    ${greetFr(r)}
    <p style="${P}">Petit mot depuis l'allée des fournitures 🛒 — j'achète <strong>un cartable par choriste</strong> pour la session d'automne, et j'aimerais bien en réserver un pour vous.</p>
    <p style="${P}">Septembre approche à grands pas, et au cours des prochaines semaines j'enverrai les <strong>courriels importants de préparation</strong> : à quoi s'attendre lors de la première soirée, l'heure d'arrivée, quoi apporter et les chansons au programme. Ils sont envoyés aux personnes inscrites — donc si vous vous disiez « oui, mais plus tard », c'est le moment pour ne rien manquer.</p>
    ${scheduleFr}
    <p style="${P}">Aucune audition. Aucune lecture de musique. Simplement une salle remplie de gens qui s'amusent à chanter des chansons qu'ils adorent déjà, dès ${firstRehearsalFr(r)}.</p>
    ${BTN(`${SITE_URL}/register`, "S'inscrire à la session d'automne")}
    <p style="${P}">Des questions avant de vous décider — lieu, frais, autre chose? Écrivez-moi à <a href="mailto:${CONTACT}" style="color:#f472b6;">${CONTACT}</a> et je vous répondrai personnellement.</p>
    <p style="${P}">J'espère écrire votre nom sur un cartable cette semaine!</p>
    ${SIGN}`;
  return {
    subject: `There's a binder with your name on it 🎶 / Il y a un cartable à votre nom`,
    html: wrap(inner, "Buying binders this week and sending pre-season emails soon — register so you don't miss out."),
  };
}

function renderEmail(segment: Segment, r: Recipient): { subject: string; html: string } {

  if (segment === "fall-paid") return renderPaid(r);
  if (segment === "fall-unpaid") return renderUnpaid(r);
  if (segment === "fall-unpaid-reminder") return renderUnpaidReminder(r);
  if (segment === "fall-considering-reminder") return renderConsideringReminder(r);
  if (segment === "hudson-open-house") return renderHudsonOpenHouse(r);
  if (segment === "hudson-open-house-reminder") return renderHudsonOpenHouseReminder(r);
  if (segment === "hudson-open-house-thanks") return renderHudsonOpenHouseThanks(r);
  if (segment === "binder-count-unpaid") return renderBinderUnpaid(r);
  if (segment === "binder-count-considering") return renderBinderConsidering(r);
  return renderConsidering(r);
}

// ---------- recipients ----------

async function loadRecipients(supabase: any, segment: Segment): Promise<Recipient[]> {
  const { data: memberRows } = await supabase.from("members").select("email, first_name, last_name, location, crm_tags, archived_at");
  const suppressed = new Set<string>();
  // Guest-list people are invited to try the first night; they must never get payment emails/reminders
  const guestList = new Set<string>();
  for (const m of memberRows || []) {
    if (!m.email) continue;
    const e = String(m.email).toLowerCase();
    if (Array.isArray(m.crm_tags) && m.crm_tags.includes("no-email")) suppressed.add(e);
    if (Array.isArray(m.crm_tags) && (m.crm_tags.includes("guest-list") || m.crm_tags.includes("no-payment-emails"))) guestList.add(e);
  }


  const { data: allRegs } = await supabase
    .from("session_registrations")
    .select("email, first_name, last_name, location, payment_status, session_label");

  const paidMap = new Map<string, Recipient>();
  const unpaidMap = new Map<string, Recipient>();
  const fallEmails = new Set<string>();

  for (const r of allRegs || []) {
    if (r.session_label !== "fall-2026") continue;
    const e = String(r.email || "").trim().toLowerCase();
    if (!e.includes("@") || suppressed.has(e)) continue;
    fallEmails.add(e);
    const rec: Recipient = {
      email: e,
      first_name: r.first_name || "",
      last_name: r.last_name || "",
      location: normLocation(r.location),
    };
    if (r.payment_status === "paid") {
      if (!paidMap.has(e)) paidMap.set(e, rec);
    } else if (!unpaidMap.has(e)) {
      unpaidMap.set(e, rec);
    }
  }
  // A person who paid on any registration should never also be in the unpaid list
  for (const e of paidMap.keys()) unpaidMap.delete(e);
  // Guest list never receives payment reminders
  for (const e of guestList) unpaidMap.delete(e);

  if (segment === "fall-paid") return Array.from(paidMap.values());
  if (segment === "fall-unpaid" || segment === "fall-unpaid-reminder" || segment === "binder-count-unpaid") return Array.from(unpaidMap.values());

  if (segment === "hudson-open-house") {
    const { data: allRsvps } = await supabase
      .from("open_house_rsvps")
      .select("email, first_name, last_name, location, landing_page, source_campaign, utm_campaign, created_at");
    const already = new Set<string>();
    for (const g of allRsvps || []) {
      if (isAug18Rsvp(g)) already.add(String(g.email || "").trim().toLowerCase());
    }
    for (const r of allRegs || []) {
      if (r.session_label === "open-house-2026" && isAug18Rsvp(r)) {
        already.add(String(r.email || "").trim().toLowerCase());
      }
    }

    const hudson = new Map<string, Recipient>();
    const addH = (email: any, first: any, last: any, location: any) => {
      const e = String(email || "").trim().toLowerCase();
      if (!e.includes("@") || suppressed.has(e) || already.has(e)) return;
      if (normLocation(location) !== "Hudson") return;
      if (hudson.has(e)) return;
      hudson.set(e, { email: e, first_name: first || "", last_name: last || "", location: "Hudson" });
    };
    for (const r of allRegs || []) addH(r.email, r.first_name, r.last_name, r.location);
    for (const g of allRsvps || []) addH(g.email, g.first_name, g.last_name, g.location);
    const { data: hProspects } = await supabase.from("prospects").select("email, first_name, last_name, locations");
    for (const p of hProspects || []) addH(p.email, p.first_name, p.last_name, Array.isArray(p.locations) ? p.locations[0] : "");
    for (const m of memberRows || []) {
      if (m.archived_at) continue;
      addH(m.email, m.first_name, m.last_name, m.location);
    }
    return Array.from(hudson.values());
  }

  if (segment === "hudson-open-house-thanks") {
    // Everyone who RSVP'd for the Aug 18 Hudson open house, plus contacts tagged for it
    const { data: allRsvps } = await supabase
      .from("open_house_rsvps")
      .select("email, first_name, last_name, location, landing_page, source_campaign, utm_campaign, created_at");
    const { data: ohRegs } = await supabase
      .from("session_registrations")
      .select("email, first_name, last_name, location, landing_page, utm_campaign, created_at")
      .eq("session_label", "open-house-2026");
    const list = new Map<string, Recipient>();
    const addT = (email: any, first: any, last: any, location: any) => {
      const e = String(email || "").trim().toLowerCase();
      if (!e.includes("@") || suppressed.has(e) || list.has(e)) return;
      list.set(e, { email: e, first_name: first || "", last_name: last || "", location: normLocation(location) || "Hudson" });
    };
    for (const g of allRsvps || []) if (isAug18Rsvp(g)) addT(g.email, g.first_name, g.last_name, g.location);
    for (const r of ohRegs || []) if (isAug18Rsvp(r)) addT(r.email, r.first_name, r.last_name, r.location);
    for (const m of memberRows || []) {
      if (m.archived_at) continue;
      if (Array.isArray(m.crm_tags) && m.crm_tags.includes("hudson-open-house-aug18")) {
        addT(m.email, m.first_name, m.last_name, m.location);
      }
    }
    return Array.from(list.values());
  }

  if (segment === "hudson-open-house-reminder") {
    // Everyone who has RSVP'd for the Aug 18 Hudson open house
    const { data: allRsvps } = await supabase
      .from("open_house_rsvps")
      .select("email, first_name, last_name, location, landing_page, source_campaign, utm_campaign, created_at");
    const { data: ohRegs } = await supabase
      .from("session_registrations")
      .select("email, first_name, last_name, location, landing_page, utm_campaign, created_at")
      .eq("session_label", "open-house-2026");
    const going = new Map<string, Recipient>();
    const addGoing = (email: any, first: any, last: any) => {
      const e = String(email || "").trim().toLowerCase();
      if (!e.includes("@") || suppressed.has(e)) return;
      if (going.has(e)) return;
      going.set(e, { email: e, first_name: first || "", last_name: last || "", location: "Hudson" });
    };
    for (const g of allRsvps || []) {
      if (isAug18Rsvp(g)) addGoing(g.email, g.first_name, g.last_name);
    }
    for (const r of ohRegs || []) {
      if (isAug18Rsvp(r)) addGoing(r.email, r.first_name, r.last_name);
    }
    return Array.from(going.values());
  }


  // Everyone else: any contact with no fall-2026 registration at all
  const rest = new Map<string, Recipient>();
  const add = (email: any, first: any, last: any, location: any) => {
    const e = String(email || "").trim().toLowerCase();
    if (!e.includes("@")) return;
    if (suppressed.has(e) || fallEmails.has(e)) return;
    const loc = normLocation(location);
    const existing = rest.get(e);
    if (existing) {
      if (!existing.location && loc) existing.location = loc;
      if (!existing.first_name && first) existing.first_name = first;
      return;
    }
    rest.set(e, { email: e, first_name: first || "", last_name: last || "", location: loc });
  };

  // Open house / try-a-session registrations carry the most reliable location
  for (const r of allRegs || []) {
    if (r.session_label === "fall-2026") continue;
    add(r.email, r.first_name, r.last_name, r.location);
  }

  const { data: rsvps } = await supabase.from("open_house_rsvps").select("email, first_name, last_name, location");
  for (const g of rsvps || []) add(g.email, g.first_name, g.last_name, g.location);

  const { data: prospects } = await supabase.from("prospects").select("email, first_name, last_name, locations");
  for (const p of prospects || []) add(p.email, p.first_name, p.last_name, Array.isArray(p.locations) ? p.locations[0] : "");

  for (const m of memberRows || []) {
    if (m.archived_at) continue;
    if (Array.isArray(m.crm_tags) && m.crm_tags.includes("no-email")) continue;
    add(m.email, m.first_name, m.last_name, m.location);
  }

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
    const location: string = typeof body.location === "string" ? body.location : "all";

    if (!Object.keys(CAMPAIGN_KEYS).includes(segment)) throw new Error("Invalid segment");
    if (location !== "all" && location !== "unknown" && !LOCATION_KEYS.includes(location)) {
      throw new Error("Invalid location");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const all = await loadRecipients(supabase, segment);
    const recipients =
      location === "all" ? all
      : location === "unknown" ? all.filter((r) => !r.location)
      : all.filter((r) => r.location === location);

    if (countOnly) {
      const byLocation: Record<string, number> = { unknown: 0 };
      for (const k of LOCATION_KEYS) byLocation[k] = 0;
      for (const r of all) byLocation[r.location || "unknown"]++;
      return new Response(JSON.stringify({ count: recipients.length, total: all.length, byLocation }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (previewOnly) {
      const fallback: Recipient = {
        email: "sample@example.com", first_name: "Sample", last_name: "Singer",
        location: location !== "all" && location !== "unknown" ? location : "Montreal",
      };
      const sample = recipients[0] || fallback;
      const { subject, html } = renderEmail(segment, sample);
      return new Response(JSON.stringify({ subject, html, count: recipients.length }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY not configured");
    const resend = new Resend(resendKey);

    if (testEmail) {
      const fallback: Recipient = {
        email: testEmail, first_name: "Sample", last_name: "Singer",
        location: location !== "all" && location !== "unknown" ? location : "Montreal",
      };
      const sample = recipients[0] || fallback;
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
            reply_to: CONTACT,
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
