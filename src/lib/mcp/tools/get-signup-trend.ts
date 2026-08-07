import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, isExcludedLocation } from "../supabase";

export default defineTool({
  name: "get_signup_trend",
  title: "Signup trend",
  description:
    "Daily new registrations and new contacts over the last N days (default 14) so trends can be analyzed.",
  inputSchema: {
    days: z.number().int().min(1).max(180).default(14).describe("Number of days to look back."),
    session_label: z.string().trim().min(1).default("fall-2026"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ days, session_label }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const [regs, members] = await Promise.all([
      supabase
        .from("session_registrations")
        .select("created_at, location, payment_status")
        .eq("session_label", session_label)
        .gte("created_at", since),
      supabase.from("members").select("created_at, location, status").gte("created_at", since),
    ]);

    if (regs.error || members.error) {
      const message = regs.error?.message ?? members.error?.message ?? "Query failed";
      return { content: [{ type: "text", text: `${message} (admin access required)` }], isError: true };
    }

    const byDay: Record<string, { registrations: number; new_contacts: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const key = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      byDay[key] = { registrations: 0, new_contacts: 0 };
    }
    for (const r of regs.data ?? []) {
      if (isExcludedLocation(r.location)) continue;
      const key = String(r.created_at).slice(0, 10);
      if (byDay[key]) byDay[key].registrations += 1;
    }
    for (const m of members.data ?? []) {
      if (isExcludedLocation(m.location)) continue;
      const key = String(m.created_at).slice(0, 10);
      if (byDay[key]) byDay[key].new_contacts += 1;
    }

    const result = {
      days,
      session_label,
      totals: {
        registrations: Object.values(byDay).reduce((a, d) => a + d.registrations, 0),
        new_contacts: Object.values(byDay).reduce((a, d) => a + d.new_contacts, 0),
      },
      by_day: byDay,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});
