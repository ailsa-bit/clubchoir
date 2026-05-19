import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_LOCATIONS = ["Montreal", "Hudson", "Saint-Hubert", "Pointe-Claire", "Arundel"];
const SESSION_LABEL = "fall-2026";

const SESSION_DETAILS: Record<string, { en: string; fr: string }> = {
  "Montreal": { en: "Mondays, Sept 7 – Dec 7, 2026 · Kensington Presbyterian Church", fr: "Lundis, 7 sept. – 7 déc. 2026 · Kensington Presbyterian Church" },
  "Hudson": { en: "Tuesdays, Sept 8 – Dec 8, 2026 · Kingfisher Pub", fr: "Mardis, 8 sept. – 8 déc. 2026 · Kingfisher Pub" },
  "Saint-Hubert": { en: "Wednesdays, Sept 9 – Dec 9, 2026", fr: "Mercredis, 9 sept. – 9 déc. 2026" },
  "Pointe-Claire": { en: "Thursdays, Sept 10 – Dec 10, 2026", fr: "Jeudis, 10 sept. – 10 déc. 2026" },
  "Arundel": { en: "Dates to be confirmed", fr: "Dates à confirmer" },
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const first_name = String(body.first_name || "").trim().slice(0, 100);
    const last_name = String(body.last_name || "").trim().slice(0, 100);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 255);
    const location = String(body.location || "").trim();
    const notes = String(body.notes || "").trim().slice(0, 2000);
    const lang = body.language === "fr" ? "fr" : "en";

    if (!first_name || !last_name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Please provide first name, last name, and a valid email." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!VALID_LOCATIONS.includes(location)) {
      return new Response(JSON.stringify({ error: "Please select a valid location." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1) Look up existing member by email
    const { data: existingMembers, error: lookupError } = await supabase
      .from("members")
      .select("id, status, location, first_name, last_name")
      .ilike("email", email)
      .limit(1);

    if (lookupError) {
      console.error("Member lookup error:", lookupError);
    }

    const existing = existingMembers && existingMembers[0];
    let memberId: string | null = null;
    let isReturning = false;

    if (existing) {
      memberId = existing.id;
      isReturning = true;
      // Reactivate if needed; update location if changed
      const updates: Record<string, unknown> = {};
      if (existing.status !== "ACTIVE") updates.status = "ACTIVE";
      if (existing.location !== location) updates.location = location;
      if (Object.keys(updates).length > 0) {
        await supabase.from("members").update(updates).eq("id", existing.id);
      }
    } else {
      // Create new member with PENDING status
      const { data: newMember, error: createError } = await supabase
        .from("members")
        .insert({
          first_name,
          last_name,
          email,
          location,
          status: "PENDING",
          joined: new Date().toISOString().slice(0, 10),
        })
        .select("id")
        .single();
      if (createError) {
        console.error("Member create error:", createError);
        return new Response(JSON.stringify({ error: "Could not create your record. Please try again." }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      memberId = newMember.id;
    }

    // 2) Check for duplicate registration
    const { data: dup } = await supabase
      .from("session_registrations")
      .select("id")
      .eq("member_id", memberId!)
      .eq("session_label", SESSION_LABEL)
      .eq("location", location)
      .maybeSingle();

    if (dup) {
      return new Response(JSON.stringify({ already_registered: true, returning_member: isReturning }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // 3) Insert registration
    const { error: regError } = await supabase
      .from("session_registrations")
      .insert({
        member_id: memberId,
        session_label: SESSION_LABEL,
        location,
        first_name,
        last_name,
        email,
        notes: notes || null,
        is_returning_member: isReturning,
      });

    if (regError) {
      console.error("Registration insert error:", regError);
      return new Response(JSON.stringify({ error: "Could not save your registration. Please try again." }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // 4) Send emails (best-effort)
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      const resend = new Resend(resendKey);
      const fullName = `${first_name} ${last_name}`;
      const sessionInfo = SESSION_DETAILS[location] || { en: "", fr: "" };

      // Admin notification
      try {
        await resend.emails.send({
          from: "Club Choir <noreply@clubchoir.ca>",
          to: ["ailsa@clubchoir.ca"],
          replyTo: email,
          subject: `🎶 New Fall 2026 registration — ${location} (${isReturning ? "returning" : "NEW"})`,
          html: `
            <div style="font-family: 'Nunito', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
              <h1 style="color: #333; font-size: 22px; margin-bottom: 16px;">Fall 2026 — New Registration</h1>
              <div style="background: #f4f4f4; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="margin: 4px 0;"><strong>Name:</strong> ${escapeHtml(fullName)}</p>
                <p style="margin: 4px 0;"><strong>Email:</strong> ${escapeHtml(email)}</p>
                <p style="margin: 4px 0;"><strong>Location:</strong> ${escapeHtml(location)}</p>
                <p style="margin: 4px 0;"><strong>Status:</strong> ${isReturning ? "Returning member — linked to existing record" : "NEW person — created as PENDING member"}</p>
              </div>
              ${notes ? `
              <div style="background: #fff5ec; border-left: 4px solid #f97316; border-radius: 8px; padding: 16px 20px; margin: 16px 0;">
                <p style="margin: 0 0 6px; font-size: 14px; font-weight: bold; color: #c2410c;">Their message:</p>
                <p style="margin: 0; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(notes)}</p>
              </div>` : ""}
              <p style="color: #333; font-size: 14px; line-height: 1.6;">
                Next step: send them the Stripe payment link to confirm their spot.
              </p>
            </div>
          `,
        });
      } catch (e) {
        console.error("Admin email failed:", e);
      }

      // Registrant confirmation
      try {
        const greeting = lang === "fr"
          ? (isReturning ? `Bon retour, ${first_name} !` : `Bienvenue à Club Choir, ${first_name} !`)
          : (isReturning ? `Welcome back, ${first_name}!` : `Welcome to Club Choir, ${first_name}!`);

        const bodyCopy = lang === "fr"
          ? `Merci de vous être inscrit à la session d'automne 2026 à <strong>${escapeHtml(location)}</strong>. Nous vous enverrons sous peu un lien de paiement Stripe pour confirmer votre place. Les places sont limitées et attribuées selon le principe du premier arrivé, premier servi.`
          : `Thanks for registering for the Fall 2026 session in <strong>${escapeHtml(location)}</strong>. We'll email you a Stripe payment link shortly to confirm your spot. Spots are limited and filled on a first-come, first-served basis.`;

        const sessionLabel = lang === "fr" ? "Détails de la session" : "Session details";
        const sign = lang === "fr" ? "À très bientôt !<br/>— Ailsa et l'équipe Club Choir" : "See you soon!<br/>— Ailsa & the Club Choir team";

        await resend.emails.send({
          from: "Club Choir <noreply@clubchoir.ca>",
          to: [email],
          subject: lang === "fr"
            ? `🎶 Inscription reçue — ${location} (Automne 2026)`
            : `🎶 Registration received — ${location} (Fall 2026)`,
          html: `
            <div style="font-family: 'Nunito', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #333;">
              <div style="text-align: center; margin-bottom: 24px;">
                <img src="https://vbbfpzszmtwhydhpgtgj.supabase.co/storage/v1/object/public/email-assets/club-choir-logo.png?v=1" alt="Club Choir" width="120" style="display: inline-block;" />
              </div>
              <h1 style="font-size: 24px; margin-bottom: 16px;">${escapeHtml(greeting)} 🎤</h1>
              <p style="font-size: 16px; line-height: 1.6;">${bodyCopy}</p>
              <div style="background: #fff5ec; border-left: 4px solid #f97316; border-radius: 8px; padding: 16px 20px; margin: 24px 0;">
                <h2 style="margin: 0 0 8px; font-size: 18px; color: #c2410c;">${sessionLabel}</h2>
                <p style="margin: 4px 0; font-size: 15px;">${escapeHtml(sessionInfo[lang])}</p>
              </div>
              <p style="font-size: 16px; line-height: 1.6; margin-top: 24px;">${sign}</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
              <p style="color: #999; font-size: 12px; text-align: center;">clubchoir.ca</p>
            </div>
          `,
        });
      } catch (e) {
        console.error("Registrant email failed:", e);
      }
    }

    return new Response(JSON.stringify({ success: true, returning_member: isReturning }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in register-session:", error);
    return new Response(JSON.stringify({ error: error.message || "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
