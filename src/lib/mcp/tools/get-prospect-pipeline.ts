import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, isExcludedLocation } from "../supabase";

export default defineTool({
  name: "get_prospect_pipeline",
  title: "Prospect pipeline",
  description:
    "Counts of interested-but-not-registered contacts (prospects, open-house RSVPs, try-a-session tags) broken down by location, plus opt-out counts.",
  inputSchema: {
    session_label: z.string().trim().min(1).default("fall-2026"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ session_label }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);

    const [regs, members, prospects] = await Promise.all([
      supabase.from("session_registrations").select("email").eq("session_label", session_label),
      supabase.from("members").select("email, location, status, crm_tags, archived_at"),
      supabase.from("prospects").select("email, locations, status"),
    ]);

    if (regs.error || members.error || prospects.error) {
      const message =
        regs.error?.message ?? members.error?.message ?? prospects.error?.message ?? "Query failed";
      return { content: [{ type: "text", text: `${message} (admin access required)` }], isError: true };
    }

    const registered = new Set((regs.data ?? []).map((r) => (r.email ?? "").toLowerCase()).filter(Boolean));
    const interested = new Map<string, string>();
    let optedOut = 0;
    let archived = 0;

    for (const m of members.data ?? []) {
      const email = (m.email ?? "").toLowerCase();
      const tags: string[] = (m.crm_tags as string[]) ?? [];
      if (tags.includes("no-email") || tags.includes("unsubscribed")) optedOut += 1;
      if (m.archived_at) {
        archived += 1;
        continue;
      }
      if (!email || registered.has(email)) continue;
      const isInterested =
        tags.includes("open-house-2026") || tags.includes("try-a-session") || m.status === "PROSPECT";
      if (isInterested && !isExcludedLocation(m.location)) {
        interested.set(email, (m.location ?? "unknown").trim() || "unknown");
      }
    }

    for (const p of prospects.data ?? []) {
      const email = (p.email ?? "").toLowerCase();
      const loc = ((p.locations as string[]) ?? [])[0] ?? "unknown";
      if (!email || registered.has(email) || isExcludedLocation(loc)) continue;
      if (!interested.has(email)) interested.set(email, loc);
    }

    const byLocation: Record<string, number> = {};
    for (const loc of interested.values()) byLocation[loc] = (byLocation[loc] ?? 0) + 1;

    const result = {
      session_label,
      interested_not_registered: interested.size,
      by_location: byLocation,
      opted_out_contacts: optedOut,
      archived_contacts: archived,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});
