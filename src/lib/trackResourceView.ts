import { supabase } from "@/integrations/supabase/client";

/**
 * Records that a signed-in member opened a resources page.
 * Fails silently — tracking must never interrupt the member experience.
 */
export async function trackResourceView(opts: {
  page: string;
  week?: number | null;
  song?: string | null;
}) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("location")
      .eq("user_id", user.id)
      .maybeSingle();

    await supabase.from("resource_page_views").insert({
      user_id: user.id,
      location: profile?.location ?? null,
      page: opts.page,
      week: opts.week ?? null,
      song: opts.song ?? null,
    } as never);
  } catch (err) {
    console.warn("Resource view tracking skipped", err);
  }
}
