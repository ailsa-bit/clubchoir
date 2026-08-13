import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Attribution ("where did they come from?") report.
 *
 * Link conventions used to feed this report:
 *
 * Meta / Facebook Ads → Ad level → "URL parameters":
 *   utm_source={{site_source_name}}&utm_medium=paid_social&utm_campaign=fall_2026_registration&utm_content={{ad.name}}&utm_term={{adset.name}}
 *
 * Email links:
 *   /register?utm_source=email&utm_medium=owned_email&utm_campaign=fall_2026_registration&utm_content=still_considering_v1
 *   /register?utm_source=email&utm_medium=owned_email&utm_campaign=fall_2026_registration&utm_content=payment_outstanding_v1
 *   /events?utm_source=email&utm_medium=owned_email&utm_campaign=hudson_open_house_aug18&utm_content=invite_v1&utm_term=hudson
 */

const SESSION_LABEL = "fall-2026";
const EXCLUDED = new Set(["arundel"]);

type Reg = {
  location: string | null;
  payment_status: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  landing_page: string | null;
  referrer: string | null;
};

type Rsvp = {
  location: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  landing_page: string | null;
  source_campaign: string | null;
  referrer: string | null;
};

const sourceOf = (r: { utm_source: string | null; referrer: string | null }) => {
  if (r.utm_source) return r.utm_source;
  if (r.referrer) {
    try { return `referral: ${new URL(r.referrer).hostname.replace(/^www\./, "")}`; } catch { return "referral"; }
  }
  return "direct / unknown";
};

// Ad set / campaign names can arrive with "+" decoded as a space (unencoded "+" in the URL),
// so normalize whitespace and plus signs before grouping to avoid duplicate-looking rows.
const norm = (v: string | null | undefined) => {
  const s = (v || "").replace(/\+/g, " ").replace(/\s+/g, " ").trim();
  return s || "—";
};
const normKey = (v: string) => norm(v).toLowerCase();

const Row = ({ cells, head = false }: { cells: (string | number)[]; head?: boolean }) => (
  <div className={`grid grid-cols-[1.2fr_0.9fr_1.1fr_1.1fr_0.9fr_repeat(3,minmax(0,0.5fr))] gap-2 px-3 py-2 text-sm min-w-[860px] ${head ? "font-semibold text-muted-foreground text-xs uppercase tracking-wide" : "border-t border-border"}`}>
    {cells.map((c, i) => (
      <span key={i} className={i === 0 ? "truncate" : i > 4 ? "text-right tabular-nums" : "truncate text-muted-foreground"}>{c}</span>
    ))}
  </div>
);

const OhRow = ({ cells, head = false }: { cells: (string | number)[]; head?: boolean }) => (
  <div className={`grid grid-cols-[1.1fr_0.9fr_1.2fr_1.1fr_0.9fr_1.1fr_minmax(0,0.5fr)] gap-2 px-3 py-2 text-sm min-w-[900px] ${head ? "font-semibold text-muted-foreground text-xs uppercase tracking-wide" : "border-t border-border"}`}>
    {cells.map((c, i) => (
      <span key={i} className={i === 0 ? "truncate" : i === cells.length - 1 ? "text-right tabular-nums" : "truncate text-muted-foreground"}>{c}</span>
    ))}
  </div>
);

const SourceReport = () => {
  const [loading, setLoading] = useState(true);
  const [regs, setRegs] = useState<Reg[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);

  useEffect(() => {
    (async () => {
      const [r1, r2, r3] = await Promise.all([
        supabase
          .from("session_registrations")
          .select("location, payment_status, utm_source, utm_medium, utm_campaign, utm_content, utm_term, landing_page, referrer")
          .eq("session_label", SESSION_LABEL),
        supabase
          .from("open_house_rsvps")
          .select("location, utm_source, utm_medium, utm_campaign, utm_content, utm_term, landing_page, source_campaign, referrer"),
        // Open-house signups submitted through /hudson-open-house land in session_registrations
        // under the "open-house-2026" label — never mixed into the fall-2026 numbers above.
        supabase
          .from("session_registrations")
          .select("location, utm_source, utm_medium, utm_campaign, utm_content, utm_term, landing_page, referrer")
          .eq("session_label", "open-house-2026"),
      ]);
      setRegs(((r1.data as Reg[]) || []).filter((r) => !EXCLUDED.has((r.location || "").trim().toLowerCase())));
      const ohForm = ((r3.data as any[]) || []).map((r) => ({ ...r, source_campaign: null })) as Rsvp[];
      setRsvps([...(((r2.data as Rsvp[]) || [])), ...ohForm]);
      setLoading(false);
    })();
  }, []);

  const regRows = useMemo(() => {
    type Agg = { source: string; medium: string; campaign: string; content: string; term: string; total: number; paid: number; unpaid: number };
    const map = new Map<string, Agg>();
    for (const r of regs) {
      const source = norm(sourceOf(r));
      const medium = norm(r.utm_medium);
      const campaign = norm(r.utm_campaign);
      const content = norm(r.utm_content);
      const term = norm(r.utm_term);
      const key = [source, medium, campaign, content, term].map(normKey).join("|");
      const cur = map.get(key) || { source, medium, campaign, content, term, total: 0, paid: 0, unpaid: 0 };
      cur.total += 1;
      const ps = (r.payment_status || "").toLowerCase();
      if (ps === "paid" || ps === "free") cur.paid += 1; else cur.unpaid += 1;
      map.set(key, cur);
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [regs]);

  const regByLandingPage = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of regs) {
      const lp = (r.landing_page || "—").split("?")[0];
      map.set(lp, (map.get(lp) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [regs]);

  const regByLocation = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const r of regs) {
      const loc = r.location || "—";
      const source = sourceOf(r);
      if (!map.has(loc)) map.set(loc, new Map());
      const inner = map.get(loc)!;
      inner.set(source, (inner.get(source) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [regs]);

  const rsvpRows = useMemo(() => {
    type Agg = { source: string; medium: string; campaign: string; content: string; term: string; landing: string; total: number };
    const map = new Map<string, Agg>();
    for (const r of rsvps) {
      const source = sourceOf(r);
      const medium = r.utm_medium || "—";
      const campaign = r.utm_campaign || r.source_campaign || "—";
      const content = r.utm_content || "—";
      const term = r.utm_term || "—";
      const landing = (r.landing_page || "—").split("?")[0];
      const key = `${source}|${medium}|${campaign}|${content}|${term}|${landing}`;
      const cur = map.get(key) || { source, medium, campaign, content, term, landing, total: 0 };
      cur.total += 1;
      map.set(key, cur);
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [rsvps]);

  return (
    <div className="bg-card border border-border rounded-xl p-4 md:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Megaphone className="w-5 h-5 text-primary" />
        <h2 className="font-heading font-bold text-lg">Where signups come from</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Attribution is captured from link tags. Ads: <code className="text-[11px]">utm_source=&#123;&#123;site_source_name&#125;&#125;&amp;utm_medium=paid_social&amp;utm_campaign=fall_2026_registration&amp;utm_content=&#123;&#123;ad.name&#125;&#125;&amp;utm_term=&#123;&#123;adset.name&#125;&#125;</code>.
        Email: <code className="text-[11px]">/register?utm_source=email&amp;utm_medium=owned_email&amp;utm_campaign=fall_2026_registration&amp;utm_content=still_considering_v1</code>. Rows before tagging show as “direct / unknown”.
      </p>

      {loading ? (
        <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-sm mb-2">Fall 2026 registrations by source</h3>
            <div className="border border-border rounded-lg overflow-x-auto">
              <Row head cells={["Source", "Medium", "Campaign", "Content (ad)", "Term (ad set)", "Total", "Paid", "Unpaid"]} />
              {regRows.length === 0 ? (
                <div className="px-3 py-3 text-sm text-muted-foreground border-t border-border">No registrations yet.</div>
              ) : regRows.map((r, i) => (
                <Row key={i} cells={[r.source, r.medium, r.campaign, r.content, r.term, r.total, r.paid, r.unpaid]} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">Fall 2026 registrations by landing page</h3>
            <div className="border border-border rounded-lg">
              {regByLandingPage.length === 0 ? (
                <div className="px-3 py-3 text-sm text-muted-foreground">No registrations yet.</div>
              ) : regByLandingPage.map(([lp, n], i) => (
                <div key={lp} className={`flex items-center justify-between gap-3 px-3 py-2 text-sm ${i ? "border-t border-border" : ""}`}>
                  <span className="truncate">{lp}</span>
                  <Badge variant="outline" className="shrink-0">{n}</Badge>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">Fall 2026 registrations by location &amp; source</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {regByLocation.map(([loc, inner]) => (
                <div key={loc} className="border border-border rounded-lg p-3">
                  <div className="font-medium text-sm mb-2">{loc}</div>
                  <div className="space-y-1">
                    {[...inner.entries()].sort((a, b) => b[1] - a[1]).map(([src, n]) => (
                      <div key={src} className="flex items-center justify-between text-sm">
                        <span className="truncate mr-2 text-muted-foreground">{src}</span>
                        <Badge variant="outline" className="shrink-0">{n}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {regByLocation.length === 0 && <p className="text-sm text-muted-foreground">No registrations yet.</p>}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">Open house RSVPs by source (separate from fall registrations)</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline">Total RSVPs: {rsvps.length}</Badge>
              <Badge variant="outline">
                Hudson open-house campaign:{" "}
                {rsvps.filter((r) =>
                  (r.utm_campaign || r.source_campaign || "").toLowerCase().includes("hudson") ||
                  (r.landing_page || "").toLowerCase().includes("hudson-open-house"),
                ).length}
              </Badge>
            </div>
            <div className="border border-border rounded-lg overflow-x-auto">
              <OhRow head cells={["Source", "Medium", "Campaign", "Content (ad)", "Term (ad set)", "Landing page", "RSVPs"]} />
              {rsvpRows.length === 0 ? (
                <div className="px-3 py-3 text-sm text-muted-foreground border-t border-border">No RSVPs yet.</div>
              ) : rsvpRows.map((r, i) => (
                <OhRow key={i} cells={[r.source, r.medium, r.campaign, r.content, r.term, r.landing, r.total]} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SourceReport;
