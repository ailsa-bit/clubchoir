import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_LOCATIONS = ["Montreal", "Hudson", "Saint-Hubert", "Pointe-Claire"];
const SESSION_LABEL = "winter-spring-2027";

const RegistrationSchema = z.object({
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  location: z.enum(["Montreal", "Hudson", "Saint-Hubert", "Pointe-Claire"]),
  notes: z.string().trim().max(2000).optional().default(""),
  language: z.enum(["en", "fr"]).optional().default("en"),
  attribution: z.unknown().optional(),
});


// Optional first-touch marketing attribution captured in the browser (see src/lib/attribution.ts).
// Never required — flows must work when it is absent.
const ATTR_KEYS = ["utm_source","utm_medium","utm_campaign","utm_content","utm_term","landing_page","referrer"] as const;
function pickAttribution(raw: any): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  const a = raw && typeof raw === "object" ? raw : {};
  for (const k of ATTR_KEYS) {
    const v = a[k];
    out[k] = typeof v === "string" && v.trim() ? v.trim().slice(0, 300) : null;
  }
  const ts = a.attribution_captured_at;
  out.attribution_captured_at = typeof ts === "string" && !isNaN(Date.parse(ts)) ? new Date(ts).toISOString() : null;
  return out;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const parsed = RegistrationSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const { first_name, last_name, location, notes, language: lang } = parsed.data;
    const email = parsed.data.email.toLowerCase();
    const attribution = pickAttribution(parsed.data.attribution);

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
      // Do NOT auto-activate on registration — activation happens only after payment
      // (via the CRM "Mark paid" action). Just update location if it changed.
      if (existing.location !== location) {
        await supabase.from("members").update({ location }).eq("id", existing.id);
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
          status: "PROSPECT",
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

    if (!memberId) {
      return new Response(JSON.stringify({ error: "Could not prepare your registration. Please try again." }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // 2) Check for duplicate registration
    const { data: dup } = await supabase
      .from("session_registrations")
      .select("id")
      .eq("member_id", memberId)
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
        ...attribution,
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
      // Admin notification
      try {
        await resend.emails.send({
          from: "Club Choir <noreply@clubchoir.ca>",
          to: ["ailsa@clubchoir.ca"],
          replyTo: email,
          subject: `🎶 Winter/Spring 2027 early registration — ${location} (${isReturning ? "returning" : "NEW"})`,
          html: `
            <div style="font-family: 'Nunito', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
              <h1 style="color: #333; font-size: 22px; margin-bottom: 16px;">Winter/Spring 2027 — Early Registration</h1>
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
                They have been told that the session begins in late February 2027 and that the detailed schedule and fee are still to be determined.
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
          ? `Merci pour votre inscription anticipée à la session hiver/printemps 2027 à <strong>${escapeHtml(location)}</strong> ! La nouvelle session commencera vers la fin de février 2027. L'horaire et les autres détails restent à déterminer.`
          : `Thanks for joining early registration for the Winter/Spring 2027 session in <strong>${escapeHtml(location)}</strong>! The new session will begin near the end of February 2027. The schedule and other details are still to be determined.`;
        const noteText = lang === "fr"
          ? `<strong>Vous serez parmi les premières personnes informées</strong> dès que l'horaire et les détails de la nouvelle session seront annoncés.`
          : `<strong>You'll be among the first to receive information</strong> as soon as the new session schedule and details are announced.`;
        const questionsText = lang === "fr"
          ? `Une question ? Envoyez-nous un courriel à <a href="mailto:ailsa@clubchoir.ca" style="color:#f97316;">ailsa@clubchoir.ca</a>.`
          : `Any questions? Send us an email at <a href="mailto:ailsa@clubchoir.ca" style="color:#f97316;">ailsa@clubchoir.ca</a>.`;
        const sign = lang === "fr" ? "À très bientôt !<br/>— Ailsa et l'équipe Club Choir" : "See you soon!<br/>— Ailsa & the Club Choir team";

        await resend.emails.send({
          from: "Club Choir <noreply@clubchoir.ca>",
          to: [email],
          subject: lang === "fr"
            ? `🎶 Inscription anticipée reçue — ${location} (Hiver/Printemps 2027)`
            : `🎶 Early registration received — ${location} (Winter/Spring 2027)`,
          html: `
            <div style="font-family: 'Nunito', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #333;">
              <div style="text-align: center; margin-bottom: 24px;">
                <img src="https://vbbfpzszmtwhydhpgtgj.supabase.co/storage/v1/object/public/email-assets/club-choir-logo.png?v=1" alt="Club Choir" width="120" style="display: inline-block;" />
              </div>
              <h1 style="font-size: 24px; margin-bottom: 16px;">${escapeHtml(greeting)} 🎤</h1>
              <p style="font-size: 16px; line-height: 1.6;">${bodyCopy}</p>
              <div style="background: #fef3c7; border-radius: 8px; padding: 16px 20px; margin: 24px 0;">
                <p style="margin: 0; font-size: 15px; line-height: 1.6;">${noteText}</p>
              </div>

              <p style="font-size: 16px; line-height: 1.6; margin-top: 24px;">${questionsText}</p>
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
