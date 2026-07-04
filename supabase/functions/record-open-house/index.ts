import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_LOCATIONS = ["Montreal", "Hudson", "Saint-Hubert", "Pointe-Claire"];
const SESSION_LABEL = "open-house-2026";

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
      });
      if (regErr) {
        console.error("open house reg insert err:", regErr);
        return new Response(JSON.stringify({ error: "Could not save signup." }), {
          status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
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
