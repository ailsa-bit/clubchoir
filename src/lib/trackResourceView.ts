import { supabase } from "@/integrations/supabase/client";

export type ResourceEvent = "view" | "open" | "download" | "play";

/** Rough device bucket, from the browser's own reported size/agent. */
function detectDevice(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return "tablet";
  if (/Mobi|iPhone|iPod|Android|Windows Phone/i.test(ua)) return "phone";
  return "computer";
}

/**
 * Records member activity on the resources pages.
 * Fails silently — tracking must never interrupt the member experience.
 */
export async function trackResourceView(opts: {
  page: string;
  week?: number | null;
  song?: string | null;
  event?: ResourceEvent;
  resourceType?: string | null;
  fileName?: string | null;
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
      event_type: opts.event ?? "view",
      resource_type: opts.resourceType ?? null,
      file_name: opts.fileName ?? null,
      device: detectDevice(),
    } as never);
  } catch (err) {
    console.warn("Resource view tracking skipped", err);
  }
}
