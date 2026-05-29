import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Total ticket capacity per event_slug (sum of ticket_count)
const CAPACITY: Record<string, number> = {
  // 29 tickets already reserved + 10 new seats released = 39 total
  "studio-77-may-31": 39,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const event_slug = url.searchParams.get("event_slug") || "studio-77-may-31";
    const capacity = CAPACITY[event_slug] ?? 0;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("popup_ticket_reservations")
      .select("ticket_count")
      .eq("event_slug", event_slug);

    if (error) throw error;

    const sold = (data ?? []).reduce((acc, r: any) => acc + (r.ticket_count ?? 0), 0);
    const remaining = Math.max(0, capacity - sold);

    return new Response(JSON.stringify({ remaining, capacity, sold }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error("popup-remaining-seats error:", e);
    return new Response(JSON.stringify({ error: e.message, remaining: 0 }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
