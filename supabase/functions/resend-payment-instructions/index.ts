import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SESSION_DETAILS: Record<string, { en: string; fr: string }> = {
  "Montreal": { en: "Mondays, Sept 7 – Dec 7, 2026 · Kensington Presbyterian Church", fr: "Lundis, 7 sept. – 7 déc. 2026 · Kensington Presbyterian Church" },
  "Hudson": { en: "Tuesdays, Sept 8 – Dec 8, 2026 · Kingfisher Pub", fr: "Mardis, 8 sept. – 8 déc. 2026 · Kingfisher Pub" },
  "Saint-Hubert": { en: "Wednesdays, Sept 9 – Dec 9, 2026", fr: "Mercredis, 9 sept. – 9 déc. 2026" },
  "Pointe-Claire": { en: "Thursdays, Sept 10 – Dec 10, 2026", fr: "Jeudis, 10 sept. – 10 déc. 2026" },
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    // Admin check: accept either an admin user JWT or the service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") || "";
    const bearer = authHeader.replace(/^Bearer\s+/i, "");
    const admin = createClient(supabaseUrl, serviceKey);
    let authorized = bearer === serviceKey;
    if (!authorized && authHeader) {
      const caller = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
      const { data: { user } } = await caller.auth.getUser();
      if (user) {
        const { data: role } = await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
        authorized = !!role;
      }
    }
    if (!authorized) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });


    const { email, language } = await req.json();
    const targetEmail = String(email || "").trim().toLowerCase();
    if (!targetEmail) return new Response(JSON.stringify({ error: "Missing email" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: reg } = await admin.from("session_registrations")
      .select("first_name, last_name, location, is_returning_member")
      .ilike("email", targetEmail)
      .eq("session_label", "fall-2026")
      .maybeSingle();
    if (!reg) return new Response(JSON.stringify({ error: "No Fall 2026 registration found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const lang = language === "fr" ? "fr" : "en";
    const { first_name, location, is_returning_member: isReturning } = reg;
    const sessionInfo = SESSION_DETAILS[location] || { en: location, fr: location };

    const greeting = lang === "fr"
      ? (isReturning ? `Bon retour, ${first_name} !` : `Bienvenue à Club Choir, ${first_name} !`)
      : (isReturning ? `Welcome back, ${first_name}!` : `Welcome to Club Choir, ${first_name}!`);
    const bodyCopy = lang === "fr"
      ? `Merci de vous être inscrit à la session d'automne 2026 à <strong>${escapeHtml(location)}</strong> ! Voici comment réserver votre place :`
      : `Thanks for registering for the Fall 2026 session in <strong>${escapeHtml(location)}</strong> — here's how to lock in your spot:`;
    const sessionLabel = lang === "fr" ? "Détails de la session" : "Session details";
    const payHeading = lang === "fr" ? "💸 Confirmez votre place (virement Interac)" : "💸 Confirm your spot (Interac e-Transfer)";
    const sendToLabel = lang === "fr" ? "Envoyer à" : "Send to";
    const amountLabel = lang === "fr" ? "Montant" : "Amount";
    const questionLabel = lang === "fr" ? "Question de sécurité" : "Security question";
    const answerLabel = lang === "fr" ? "Réponse" : "Answer";
    const questionText = lang === "fr" ? "Quel est le nom de la chorale ?" : "What is the choir name?";
    const answerText = lang === "fr" ? "clubchoir <em>(en un mot, tout en minuscules)</em>" : "clubchoir <em>(one word, all lowercase)</em>";
    const noteText = lang === "fr"
      ? `⚠️ <strong>À noter :</strong> votre place n'est pas officiellement confirmée tant que nous n'avons pas reçu votre virement. Dès que le paiement arrive, nous vous enverrons un courriel de confirmation.`
      : `⚠️ <strong>Heads up:</strong> your spot isn't officially confirmed until we've received your e-Transfer. As soon as your payment lands, we'll send you a confirmation email.`;
    const questionsText = lang === "fr"
      ? `Une question ? Envoyez-nous un courriel à <a href="mailto:ailsa@clubchoir.ca" style="color:#f97316;">ailsa@clubchoir.ca</a>.`
      : `Any questions? Send us an email at <a href="mailto:ailsa@clubchoir.ca" style="color:#f97316;">ailsa@clubchoir.ca</a>.`;
    const sign = lang === "fr" ? "À très bientôt !<br/>— Ailsa et l'équipe Club Choir" : "See you soon!<br/>— Ailsa & the Club Choir team";

    const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);
    await resend.emails.send({
      from: "Club Choir <noreply@clubchoir.ca>",
      to: [targetEmail],
      subject: lang === "fr"
        ? `🎶 Instructions de paiement — ${location} (Automne 2026)`
        : `🎶 Payment instructions — ${location} (Fall 2026)`,
      html: `
        <div style="font-family: 'Nunito', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #333;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="https://vbbfpzszmtwhydhpgtgj.supabase.co/storage/v1/object/public/email-assets/club-choir-logo.png?v=1" alt="Club Choir" width="120" />
          </div>
          <h1 style="font-size: 24px; margin-bottom: 16px;">${escapeHtml(greeting)} 🎤</h1>
          <p style="font-size: 16px; line-height: 1.6;">${bodyCopy}</p>
          <div style="background: #fff5ec; border-left: 4px solid #f97316; border-radius: 8px; padding: 16px 20px; margin: 24px 0;">
            <h2 style="margin: 0 0 8px; font-size: 18px; color: #c2410c;">${sessionLabel}</h2>
            <p style="margin: 4px 0; font-size: 15px;">${escapeHtml(sessionInfo[lang])}</p>
          </div>
          <h2 style="font-size: 18px; margin-top: 28px; margin-bottom: 8px;">${payHeading}</h2>
          <div style="background: #f4f4f4; border-radius: 8px; padding: 16px 20px; margin: 8px 0 16px;">
            <p style="margin: 4px 0; font-size: 15px;"><strong>${sendToLabel}:</strong> ailsa@clubchoir.ca</p>
            <p style="margin: 4px 0; font-size: 15px;"><strong>${amountLabel}:</strong> $280.00 CAD</p>
            <p style="margin: 4px 0; font-size: 15px;"><strong>${questionLabel}:</strong> ${questionText}</p>
            <p style="margin: 4px 0; font-size: 15px;"><strong>${answerLabel}:</strong> ${answerText}</p>
          </div>
          <div style="background: #fef3c7; border-radius: 8px; padding: 16px 20px; margin: 16px 0;">
            <p style="margin: 0; font-size: 15px; line-height: 1.6;">${noteText}</p>
          </div>
          <p style="font-size: 16px; line-height: 1.6; margin-top: 24px;">${questionsText}</p>
          <p style="font-size: 16px; line-height: 1.6; margin-top: 24px;">${sign}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
          <p style="color: #999; font-size: 12px; text-align: center;">clubchoir.ca</p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
