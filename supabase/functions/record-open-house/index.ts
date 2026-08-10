import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_LOCATIONS = ["Montreal", "Hudson", "Saint-Hubert", "Pointe-Claire"];
const DEFAULT_SESSION_LABEL = "open-house-2026";
const ALLOWED_LABELS = new Set(["open-house-2026", "try-a-session"]);


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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const rawName = String(body.name || "").trim();
    const [first_name_raw, ...rest] = rawName.split(/\s+/);
    const first_name = (body.first_name ? String(body.first_name) : first_name_raw || "").trim().slice(0, 100);
    const last_name = (body.last_name ? String(body.last_name) : rest.join(" ")).trim().slice(0, 100);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 255);
    const location = String(body.location || "").trim();
    const notes = String(body.notes || body.message || "").trim().slice(0, 2000);
    const requestedLabel = String(body.session_label || "").trim();
    const SESSION_LABEL = ALLOWED_LABELS.has(requestedLabel) ? requestedLabel : DEFAULT_SESSION_LABEL;
    const attribution = pickAttribution(body.attribution);

    if (!first_name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Missing name or valid email." }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!VALID_LOCATIONS.includes(location)) {
      return new Response(JSON.stringify({ error: "Invalid location." }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find or create a lightweight member record (as PROSPECT — open house is free)
    let memberId: string | null = null;
    const { data: existing } = await supabase
      .from("members").select("id").ilike("email", email).limit(1);
    if (existing && existing[0]) {
      memberId = existing[0].id;
    } else {
      const { data: created, error: cErr } = await supabase
        .from("members")
        .insert({
          first_name, last_name, email, location,
          status: "PROSPECT",
          joined: new Date().toISOString().slice(0, 10),
        })
        .select("id").single();
      if (cErr) console.error("member create err:", cErr);
      memberId = created?.id ?? null;
    }

    // Skip duplicate
    const { data: dup } = await supabase
      .from("session_registrations")
      .select("id")
      .ilike("email", email)
      .eq("session_label", SESSION_LABEL)
      .eq("location", location)
      .maybeSingle();

    if (!dup) {
      const { error: regErr } = await supabase.from("session_registrations").insert({
        member_id: memberId,
        session_label: SESSION_LABEL,
        location,
        first_name,
        last_name,
        email,
        notes: notes || null,
        payment_status: "free",
        ...attribution,
      });
      if (regErr) {
        console.error("open house reg insert err:", regErr);
        return new Response(JSON.stringify({ error: "Could not save signup." }), {
          status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // Confirmation email for the Hudson Open House (Aug 18, 2026)
    const isHudsonAug18 =
      String(body.event || "") === "hudson-open-house-aug18" ||
      (location === "Hudson" && SESSION_LABEL === "open-house-2026");
    if (isHudsonAug18) {
      try {
        const resendKey = Deno.env.get("RESEND_API_KEY");
        if (resendKey) {
          const fr = String(body.lang || "en") === "fr";
          const subject = fr
            ? "🎶 C'est confirmé — Portes ouvertes Hudson, mardi 18 août"
            : "🎶 You're confirmed — Hudson Open House, Tuesday August 18";
          const html = `
        <div style="font-family: 'Nunito', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #333;">
          <div style="text-align:center;margin-bottom:24px;">
            <img src="https://vbbfpzszmtwhydhpgtgj.supabase.co/storage/v1/object/public/email-assets/club-choir-logo.png?v=1" alt="Club Choir" width="120" />
          </div>
          <h1 style="font-size:24px;margin-bottom:16px;">${fr ? `Merci ${escapeHtml(first_name)} ! 🎤` : `Thank you, ${escapeHtml(first_name)}! 🎤`}</h1>
          <p style="font-size:16px;line-height:1.6;">
            ${fr
              ? "Votre place est réservée pour notre soirée portes ouvertes à Hudson. Aucune audition, aucune lecture de musique — venez simplement chanter avec nous."
              : "You're on the list for our Hudson open house. No auditions, no music reading required — just come and sing with us."}
          </p>
          <div style="background:#fff5ec;border-left:4px solid #f97316;border-radius:8px;padding:16px 20px;margin:24px 0;">
            <p style="margin:4px 0;font-size:15px;"><strong>${fr ? "Date" : "Date"} :</strong> ${fr ? "Mardi 18 août 2026" : "Tuesday, August 18, 2026"}</p>
            <p style="margin:4px 0;font-size:15px;"><strong>${fr ? "Heure" : "Time"} :</strong> 7:30 PM</p>
            <p style="margin:4px 0;font-size:15px;"><strong>${fr ? "Lieu" : "Location"} :</strong> The Hudson Legion, 57 Beach Road, Hudson, QC J0P 1H0</p>
          </div>
          <p style="font-size:16px;line-height:1.6;">
            ${fr
              ? "Amenez un ami ou un voisin — tout le monde est bienvenu !"
              : "Feel free to bring a friend or neighbour — everyone is welcome!"}
          </p>
          <p style="font-size:16px;line-height:1.6;">
            ${fr ? "Des questions ? Écrivez à" : "Questions? Send an email to"}
            <a href="mailto:ailsa@clubchoir.ca" style="color:#f97316;">ailsa@clubchoir.ca</a>.
          </p>
          <p style="font-size:16px;line-height:1.6;margin-top:24px;">
            ${fr ? "À bientôt !" : "See you soon!"}<br/>— Ailsa &amp; ${fr ? "l'équipe Club Choir" : "the Club Choir team"}
          </p>
        </div>`;
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
            body: JSON.stringify({
              from: "Club Choir <noreply@clubchoir.ca>",
              to: [email],
              subject,
              html,
            }),
          });
        }
      } catch (mailErr) {
        console.error("open house confirmation email err:", mailErr);
      }
    }

    return new Response(JSON.stringify({ ok: true, duplicate: !!dup }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error("record-open-house error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
