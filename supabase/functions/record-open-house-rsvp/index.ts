import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SIGNING_SECRET = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VALID_LOCATIONS = ["Montreal", "Hudson", "Saint-Hubert", "Pointe-Claire"];

function b64urlDecode(s: string): string {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return atob(s);
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

async function verifyToken(token: string): Promise<{ email: string; first_name: string; last_name: string; campaign: string } | null> {
  try {
    const [payloadB64, sig] = token.split(".");
    if (!payloadB64 || !sig) return null;
    const expected = await hmac(payloadB64);
    if (expected !== sig) return null;
    const payload = JSON.parse(b64urlDecode(payloadB64));
    if (!payload.email) return null;
    return payload;
  } catch { return null; }
}


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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const token = String(body.token || "");
    const location = String(body.location || "");
    const method = String(body.method || "post"); // "get" = validate only
    const attribution = pickAttribution(body.attribution);

    const payload = await verifyToken(token);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Invalid or expired link." }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!VALID_LOCATIONS.includes(location)) {
      return new Response(JSON.stringify({ error: "Invalid location." }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (method === "get") {
      return new Response(JSON.stringify({ ok: true, email: payload.email, first_name: payload.first_name, last_name: payload.last_name }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Upsert RSVP
    const { error: rsvpErr } = await supabase.from("open_house_rsvps").upsert({
      email: payload.email.toLowerCase(),
      first_name: payload.first_name || null,
      last_name: payload.last_name || null,
      location,
      source_campaign: payload.campaign || null,
      ...attribution,
    }, { onConflict: "email,location" as any, ignoreDuplicates: false });

    if (rsvpErr) {
      // Fall back to insert-if-not-exists via manual check
      const { data: existing } = await supabase
        .from("open_house_rsvps").select("id")
        .ilike("email", payload.email).eq("location", location).maybeSingle();
      if (!existing) {
        await supabase.from("open_house_rsvps").insert({
          email: payload.email.toLowerCase(),
          first_name: payload.first_name || null,
          last_name: payload.last_name || null,
          location,
          source_campaign: payload.campaign || null,
          ...attribution,
        });
      }
    }

    // Also record a session_registrations row (open-house-2026) so this shows up in the CRM Open House filter
    const { data: dup } = await supabase
      .from("session_registrations").select("id")
      .ilike("email", payload.email)
      .eq("session_label", "open-house-2026")
      .eq("location", location).maybeSingle();

    if (!dup) {
      await supabase.from("session_registrations").insert({
        session_label: "open-house-2026",
        location,
        first_name: payload.first_name || "",
        last_name: payload.last_name || "",
        email: payload.email.toLowerCase(),
        payment_status: "free",
        ...attribution,
      });
    }

    return new Response(JSON.stringify({ ok: true, email: payload.email, location }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error("record-open-house-rsvp err:", e);
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
