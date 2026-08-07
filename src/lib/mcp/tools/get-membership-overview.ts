import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, isExcludedLocation } from "../supabase";

export default defineTool({
  name: "get_membership_overview",
  title: "Membership overview",
  description:
    "Admin dashboard snapshot: registrations, paid vs unpaid, revenue and per-location breakdown for a session (defaults to fall-2026).",
  inputSchema: {
    session_label: z.string().trim().min(1).default("fall-2026").describe("Session label, e.g. fall-2026."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ session_label }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("session_registrations")
      .select("location, payment_status, amount_paid, email, created_at")
      .eq("session_label", session_label);

    if (error) {
      return {
        content: [{ type: "text", text: `${error.message} (admin access required)` }],
        isError: true,
      };
    }

    const rows = (data ?? []).filter((r) => !isExcludedLocation(r.location));
    const byLocation: Record<string, { registered: number; paid: number; unpaid: number; revenue: number }> = {};
    let revenue = 0;
    let paid = 0;

    for (const r of rows) {
      const loc = (r.location ?? "unknown").trim() || "unknown";
      byLocation[loc] ??= { registered: 0, paid: 0, unpaid: 0, revenue: 0 };
      byLocation[loc].registered += 1;
      const amount = Number(r.amount_paid ?? 0) || 0;
      if (r.payment_status === "paid") {
        paid += 1;
        byLocation[loc].paid += 1;
        byLocation[loc].revenue += amount;
        revenue += amount;
      } else {
        byLocation[loc].unpaid += 1;
      }
    }

    const summary = {
      session_label,
      total_registered: rows.length,
      paid,
      unpaid: rows.length - paid,
      revenue,
      by_location: byLocation,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  },
});
