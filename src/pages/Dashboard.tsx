import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import SourceReport from "@/components/SourceReport";


import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Loader2, Users, UserPlus, DollarSign, CalendarCheck, TrendingUp,
  AlertTriangle, MapPin, ArrowRight, RefreshCw,

} from "lucide-react";

const LOCATIONS = ["Montreal", "Saint-Hubert", "Pointe-Claire", "Hudson"];
const EXCLUDED_LOCATIONS = new Set(["arundel"]);
const isExcludedLocation = (location?: string | null) => EXCLUDED_LOCATIONS.has((location || "").trim().toLowerCase());

interface Reg {
  email: string; location: string; payment_status: string; created_at: string;
  amount_paid: number | null; first_name: string; last_name: string; session_label: string;
  updated_at?: string | null;
  utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null;
  utm_content?: string | null; utm_term?: string | null;
}
interface Prospect { email: string; locations: string[]; created_at: string; first_name: string; last_name: string | null; utm_source?: string | null; utm_medium?: string | null; }
interface Rsvp { email: string; location: string; created_at: string; first_name: string | null; last_name: string | null; utm_source?: string | null; utm_medium?: string | null; }
interface MemberRow { email: string | null; location: string; status: string; created_at: string; crm_tags: string[]; archived_at: string | null; }

// Local (Toronto/browser) calendar day, not UTC — avoids late-evening entries rolling to tomorrow
const dayKey = (d: string | Date) => {
  const t = new Date(d);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
};
const fmtDay = (k: string) => new Date(k + "T12:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric" });
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

const StatCard = ({
  icon: Icon, label, value, sub, tone = "default", to, onClick, active,
}: { icon: any; label: string; value: string | number; sub?: string; tone?: "default" | "good" | "warn" | "accent"; to?: string; onClick?: () => void; active?: boolean }) => {
  const toneCls =
    tone === "good" ? "text-green-600 dark:text-green-400"
    : tone === "warn" ? "text-amber-600 dark:text-amber-400"
    : tone === "accent" ? "text-primary"
    : "text-foreground";
  const inner = (
    <div className={`bg-card border rounded-xl p-4 h-full hover:shadow-md transition-shadow text-left ${active ? "border-primary ring-1 ring-primary" : "border-border"}`}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        <Icon className="w-4 h-4" /> {label}
      </div>
      <div className={`font-heading font-bold text-3xl ${toneCls}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
  if (onClick) return <button type="button" onClick={onClick} className="block h-full w-full">{inner}</button>;
  return to ? <Link to={to} className="block h-full">{inner}</Link> : inner;
};


const Dashboard = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [regs, setRegs] = useState<Reg[]>([]);
  const [tryRegs, setTryRegs] = useState<Reg[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [range, setRange] = useState<14 | 30>(14);
  const [showNew, setShowNew] = useState(false);


  useEffect(() => {
    if (!adminLoading && !isAdmin) { navigate("/"); return; }
    if (isAdmin) fetchAll();
  }, [isAdmin, adminLoading]);

  const fetchAll = async () => {
    setLoading(true);
    const [r, t, p, o, m] = await Promise.all([
      supabase.from("session_registrations").select("email,location,payment_status,created_at,amount_paid,first_name,last_name,session_label,updated_at,utm_source,utm_medium").eq("session_label", "fall-2026"),
      supabase.from("session_registrations").select("email,location,payment_status,created_at,amount_paid,first_name,last_name,session_label,updated_at,utm_source,utm_medium").in("session_label", ["try-a-session", "open-house-2026"]),
      supabase.from("prospects").select("email,locations,created_at,first_name,last_name,utm_source,utm_medium"),
      supabase.from("open_house_rsvps").select("email,location,created_at,first_name,last_name,utm_source,utm_medium"),
      supabase.from("members").select("email,location,status,created_at,crm_tags,archived_at"),
    ]);
    setRegs((r.data as any) || []);
    setTryRegs((t.data as any) || []);
    setProspects((p.data as any) || []);
    setRsvps((o.data as any) || []);
    setMembers((m.data as any) || []);
    setLoading(false);
  };


  const data = useMemo(() => {
    const norm = (e?: string | null) => (e || "").trim().toLowerCase();
    function included<T extends { location?: string | null }>(rows: T[]): T[] {
      return rows.filter((x) => !isExcludedLocation(x.location));
    }
    const includedProspects = prospects.filter((x) => !x.locations.some(isExcludedLocation));

    // Exclude legacy locations from dashboard metrics while preserving their records in the database.
    const includedRegs = included(regs);
    const includedTryRegs = included(tryRegs);
    const includedRsvps = included(rsvps);

    // Dedupe registrations per person (people can share a household email), keep paid over unpaid
    const personKey = (x: Reg) => `${norm(x.email)}|${(x.first_name || "").trim().toLowerCase()}|${(x.last_name || "").trim().toLowerCase()}`;
    const regByEmail = new Map<string, Reg>();
    includedRegs.forEach((x) => {
      const k = personKey(x);
      const prev = regByEmail.get(k);
      if (!prev || (prev.payment_status !== "paid" && x.payment_status === "paid")) regByEmail.set(k, x);
    });
    const uniqueRegs = [...regByEmail.values()];
    const paid = uniqueRegs.filter((x) => x.payment_status === "paid");
    const unpaid = uniqueRegs.filter((x) => x.payment_status !== "paid");
    // Fall back to the standard $280 session fee if an amount wasn't recorded.
    const revenue = includedRegs.reduce((s, x) => s + (x.payment_status === "paid" ? Number(x.amount_paid ?? 280) : 0), 0);

    const rsvpEmails = new Set(includedRsvps.map((x) => norm(x.email)));
    const prospectEmails = new Set(includedProspects.map((x) => norm(x.email)));
    // Open-house / try-a-session registrations count as "interested" too (matches CRM buckets)
    const softRegEmails = new Set(includedTryRegs.map((x) => norm(x.email)));
    const memberTagged = new Set(
      members.filter((x) => !x.archived_at && !isExcludedLocation(x.location) && (x.crm_tags || []).some((t) => t === "open-house-2026" || t === "try-a-session")).map((x) => norm(x.email)),
    );
    const registeredEmails = new Set(includedRegs.map((x) => norm(x.email)));
    const interested = new Set<string>([...rsvpEmails, ...prospectEmails, ...softRegEmails, ...memberTagged].filter((e) => e && !registeredEmails.has(e)));

    // Trend series
    const days: string[] = [];
    for (let i = range - 1; i >= 0; i--) days.push(dayKey(daysAgo(i)));
    const blank = () => Object.fromEntries(days.map((d) => [d, 0])) as Record<string, number>;
    const sReg = blank(), sPro = blank(), sRsvp = blank(), sPaid = blank();
    uniqueRegs.forEach((x) => { const k = dayKey(x.created_at); if (k in sReg) sReg[k]++; });
    includedRegs.forEach((x) => { if (x.payment_status === "paid") { const k = dayKey(x.created_at); if (k in sPaid) sPaid[k]++; } });
    includedProspects.forEach((x) => { const k = dayKey(x.created_at); if (k in sPro) sPro[k]++; });
    includedRsvps.forEach((x) => { const k = dayKey(x.created_at); if (k in sRsvp) sRsvp[k]++; });
    const trend = days.map((d) => ({
      day: fmtDay(d),
      Registrations: sReg[d], "Open house RSVPs": sRsvp[d], "Interest signups": sPro[d],
      total: sReg[d] + sRsvp[d] + sPro[d],
    }));
    const newInRange = trend.reduce((s, x) => s + x.total, 0);

    // Membership growth: cumulative registrations vs cumulative paid members over the season
    const allDates = [
      ...uniqueRegs.map((x) => new Date(x.created_at)),
      ...uniqueRegs.filter((x) => x.payment_status === "paid").map((x) => new Date(x.updated_at || x.created_at)),
    ].sort((a, b) => +a - +b);
    const growthStart = allDates[0] ? new Date(allDates[0].toDateString()) : new Date();
    const growthDays: string[] = [];
    for (let d = new Date(growthStart); d <= new Date(); d.setDate(d.getDate() + 1)) growthDays.push(dayKey(new Date(d)));
    const gReg: Record<string, number> = Object.fromEntries(growthDays.map((d) => [d, 0]));
    const gPaid: Record<string, number> = Object.fromEntries(growthDays.map((d) => [d, 0]));
    uniqueRegs.forEach((x) => {
      const k = dayKey(x.created_at);
      if (k in gReg) gReg[k]++;
      if (x.payment_status === "paid") {
        const pk = dayKey(x.updated_at || x.created_at);
        if (pk in gPaid) gPaid[pk]++;
      }
    });
    let cReg = 0, cPaid = 0;
    const growth = growthDays.map((d) => {
      cReg += gReg[d]; cPaid += gPaid[d];
      return { day: fmtDay(d), Registered: cReg, "Paid members": cPaid };
    });
    const growthStartLabel = fmtDay(dayKey(growthStart));
    const last7 = growth.length > 7 ? growth[growth.length - 1]["Paid members"] - growth[growth.length - 8]["Paid members"] : cPaid;

    const prevStart = daysAgo(range * 2), prevEnd = daysAgo(range);
    const inPrev = (d: string) => { const t = new Date(d); return t >= prevStart && t < prevEnd; };
    const prevCount =
      uniqueRegs.filter((x) => inPrev(x.created_at)).length +
      includedProspects.filter((x) => inPrev(x.created_at)).length +
      includedRsvps.filter((x) => inPrev(x.created_at)).length;
    const delta = prevCount === 0 ? null : Math.round(((newInRange - prevCount) / prevCount) * 100);

    // Per-location: paid registrations are current members; unpaid registrations and
    // non-registered interest are the potential-member pool.
    const byLoc = LOCATIONS.map((loc) => {
      const l = loc.toLowerCase();
      const regsL = uniqueRegs.filter((x) => (x.location || "").toLowerCase() === l);
      const paidL = regsL.filter((x) => x.payment_status === "paid");
      const unpaidL = regsL.filter((x) => x.payment_status !== "paid");
      const interestedL = new Set([
        ...includedRsvps.filter((x) => (x.location || "").toLowerCase() === l).map((x) => norm(x.email)),
        ...includedTryRegs.filter((x) => (x.location || "").toLowerCase() === l).map((x) => norm(x.email)),
        ...includedProspects.filter((x) => (x.locations || []).some((v) => (v || "").toLowerCase() === l)).map((x) => norm(x.email)),
      ].filter((e) => interested.has(e)));
      return {
        location: loc,
        Registered: regsL.length,
        Paid: paidL.length,
        Unpaid: unpaidL.length,
        Interested: interestedL.size,
        Members: paidL.length,
        Potential: unpaidL.length + interestedL.size,
      };
    });

    // Daily payments received (by location) — all payments, from the first one onward
    const paidRegs = includedRegs.filter((x) => x.payment_status === "paid" && Number(x.amount_paid ?? 280) > 0);
    const payDates = paidRegs.map((x) => new Date(x.updated_at || x.created_at)).sort((a, b) => +a - +b);
    const payStart = payDates[0] ? new Date(payDates[0].toDateString()) : new Date();
    const payDays: string[] = [];
    for (let d = new Date(payStart); d <= new Date(); d.setDate(d.getDate() + 1)) payDays.push(dayKey(new Date(d)));
    const payMap = new Map<string, any>(payDays.map((d) => [d, Object.fromEntries([["day", fmtDay(d)], ["total", 0], ["amount", 0], ...LOCATIONS.map((l) => [l, 0])])]));
    // Each paid member counts as its own payment, even when a household shares one email
    const seenTx = new Set<string>();
    paidRegs.forEach((x) => {
      const k = dayKey(x.updated_at || x.created_at);
      const row = payMap.get(k);
      if (!row) return;
      const loc = LOCATIONS.find((l) => l.toLowerCase() === (x.location || "").toLowerCase());
      const txKey = `${personKey(x)}|${k}`;
      if (!seenTx.has(txKey)) {
        seenTx.add(txKey);
        if (loc) row[loc]++;
        row.total++;
      }
      row.amount += Number(x.amount_paid ?? 280);
    });
    const payments = [...payMap.values()];
    const paymentsTotal = payments.reduce((s2, r) => s2 + r.total, 0);
    const paymentsAmount = payments.reduce((s2, r) => s2 + r.amount, 0);
    const paymentsStartLabel = fmtDay(dayKey(payStart));


    // Follow-ups: unpaid registrations older than 5 days
    const cutoff = daysAgo(5);
    const staleUnpaid = unpaid
      .filter((x) => new Date(x.created_at) < cutoff)
      .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));

    // Activity feed
    const feed = [
      ...uniqueRegs.map((x) => ({ kind: "Registered", who: `${x.first_name} ${x.last_name}`, where: x.location, at: x.created_at, tone: "blue", paid: x.payment_status === "paid" })),
      ...includedRsvps.map((x) => ({ kind: "Open house RSVP", who: `${x.first_name || ""} ${x.last_name || ""}`.trim() || x.email, where: x.location, at: x.created_at, tone: "lime", paid: false })),
      ...includedProspects.map((x) => ({ kind: "Interest signup", who: `${x.first_name} ${x.last_name || ""}`.trim(), where: (x.locations || [])[0] || "—", at: x.created_at, tone: "amber", paid: false })),
    ].sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 15);

    // New signups within the selected range (detail drill-down)
    const rangeStart = daysAgo(range - 1);
    rangeStart.setHours(0, 0, 0, 0);
    const inRange = (d: string) => new Date(d) >= rangeStart;
    const recent = [
      ...uniqueRegs.filter((x) => inRange(x.created_at)).map((x) => ({
        kind: "Registration", who: `${x.first_name} ${x.last_name}`.trim(), email: x.email,
        where: x.location || "—", at: x.created_at, extra: x.payment_status === "paid" ? "Paid" : "Unpaid",
      })),
      ...includedRsvps.filter((x) => inRange(x.created_at)).map((x) => ({
        kind: "Open house RSVP", who: `${x.first_name || ""} ${x.last_name || ""}`.trim() || x.email, email: x.email,
        where: x.location || "—", at: x.created_at, extra: "",
      })),
      ...includedProspects.filter((x) => inRange(x.created_at)).map((x) => ({
        kind: "Interest signup", who: `${x.first_name} ${x.last_name || ""}`.trim(), email: x.email,
        where: (x.locations || [])[0] || "—", at: x.created_at, extra: "",
      })),
    ].sort((a, b) => +new Date(b.at) - +new Date(a.at));

    const recentByLoc = [...LOCATIONS].map((loc) => {
      const l = loc.toLowerCase();
      const rows = recent.filter((x) => (x.where || "").toLowerCase() === l);
      return {
        location: loc,
        total: rows.length,
        registrations: rows.filter((x) => x.kind === "Registration").length,
        rsvps: rows.filter((x) => x.kind === "Open house RSVP").length,
        interest: rows.filter((x) => x.kind === "Interest signup").length,
      };
    }).filter((x) => x.total > 0);

    return {
      uniqueRegs, paid, unpaid, revenue, interested, trend, newInRange, delta,
      byLoc, staleUnpaid, feed, recent, recentByLoc,
      payments, paymentsTotal, paymentsAmount, paymentsStartLabel,
      interestedCount: interested.size,
      potentialCount: unpaid.length + interested.size,
      payRate: uniqueRegs.length ? Math.round((paid.length / uniqueRegs.length) * 100) : 0,
      growth, growthStartLabel, paidLast7: last7,
    };


  }, [regs, tryRegs, prospects, rsvps, members, range]);

  if (adminLoading || loading) {
    return <div className="py-24 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
  }
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>Admin Dashboard | Club Choir</title><meta name="robots" content="noindex" /></Helmet>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-heading font-bold text-3xl text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Signups, payments and momentum at a glance.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-border overflow-hidden">
              {([14, 30] as const).map((d) => (
                <button key={d} onClick={() => setRange(d)}
                  className={`px-3 py-1.5 text-sm font-semibold ${range === d ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>
                  {d}d
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={fetchAll}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
            <Button size="sm" asChild><Link to="/crm">Open CRM <ArrowRight className="w-4 h-4 ml-1" /></Link></Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          <StatCard icon={Users} label="Current members" value={data.paid.length} sub={`$${data.revenue.toFixed(0)} collected`} tone="good" to="/crm" />
          <StatCard icon={UserPlus} label="Registered" value={data.uniqueRegs.length} sub={`${data.unpaid.length} registered unpaid · ${data.payRate}% paid`} tone="accent" to="/crm" />
          <StatCard icon={AlertTriangle} label="Registered — unpaid" value={data.unpaid.length} sub="Potential members awaiting payment" tone="warn" to="/crm" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          <StatCard icon={TrendingUp} label={`New signups (${range}d)`} value={data.newInRange}
            sub={data.delta === null ? "click for details" : `${data.delta >= 0 ? "+" : ""}${data.delta}% vs previous ${range}d · click for details`}
            tone={data.delta !== null && data.delta < 0 ? "warn" : "good"}
            onClick={() => setShowNew((v) => !v)} active={showNew} />
          <StatCard icon={CalendarCheck} label="Potential members" value={data.potentialCount} sub={`${data.unpaid.length} registered unpaid + ${data.interestedCount} interested`} tone="accent" to="/crm" />
          <StatCard icon={Users} label="Contacts in CRM" value={new Set(members.filter((m) => !m.archived_at && !isExcludedLocation(m.location)).map((m) => (m.email || "").toLowerCase())).size} sub="active (non-archived)" to="/crm" />
        </div>

        {showNew && (
          <div className="bg-card border border-border rounded-xl p-4 md:p-6 mb-8">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="font-heading font-bold text-lg">New signups — last {range} days ({data.newInRange})</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>Hide</Button>
            </div>

            {data.recentByLoc.length === 0 ? (
              <p className="text-sm text-muted-foreground">No new signups in this period.</p>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                  {data.recentByLoc.map((l) => (
                    <div key={l.location} className="border border-border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold"><MapPin className="w-3.5 h-3.5" />{l.location}</span>
                        <span className="font-heading font-bold text-xl text-primary">{l.total}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {l.registrations} registration{l.registrations === 1 ? "" : "s"} · {l.rsvps} RSVP{l.rsvps === 1 ? "" : "s"} · {l.interest} interest
                      </div>
                    </div>
                  ))}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                        <th className="py-2 pr-3 font-semibold">Name</th>
                        <th className="py-2 pr-3 font-semibold">Email</th>
                        <th className="py-2 pr-3 font-semibold">Location</th>
                        <th className="py-2 pr-3 font-semibold">Type</th>
                        <th className="py-2 font-semibold text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.recent.map((x, i) => (
                        <tr key={i}>
                          <td className="py-2 pr-3 font-medium">{x.who || "—"}</td>
                          <td className="py-2 pr-3 text-muted-foreground truncate max-w-[220px]">{x.email}</td>
                          <td className="py-2 pr-3">{x.where}</td>
                          <td className="py-2 pr-3">
                            <Badge variant="outline">{x.kind}</Badge>
                            {x.extra === "Paid" && (
                              <Badge variant="outline" className="ml-1 bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30 text-[10px] font-semibold">✅ Paid</Badge>
                            )}
                            {x.extra === "Unpaid" && (
                              <Badge variant="outline" className="ml-1 bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-semibold">Unpaid</Badge>
                            )}
                          </td>
                          <td className="py-2 text-right text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(x.at).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}



        {/* Trend */}
        <div className="bg-card border border-border rounded-xl p-4 md:p-6 mb-6">
          <h2 className="font-heading font-bold text-lg mb-1">New signups — last {range} days</h2>
          <p className="text-xs text-muted-foreground mb-4">Registrations, open house RSVPs and interest-form signups per day.</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  {[["gReg", "hsl(var(--primary))"], ["gRsvp", "hsl(142 60% 40%)"], ["gPro", "hsl(38 92% 50%)"]].map(([id, col]) => (
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={col} stopOpacity={0.5} />
                      <stop offset="95%" stopColor={col} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="Registrations" stroke="hsl(var(--primary))" fill="url(#gReg)" strokeWidth={2} />
                <Area type="monotone" dataKey="Open house RSVPs" stroke="hsl(142 60% 40%)" fill="url(#gRsvp)" strokeWidth={2} />
                <Area type="monotone" dataKey="Interest signups" stroke="hsl(38 92% 50%)" fill="url(#gPro)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>


        {/* Daily payments by location */}
        <div className="bg-card border border-border rounded-xl p-4 md:p-6 mb-6">
          <h2 className="font-heading font-bold text-lg mb-1">Payments received per day — by location</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Since {data.paymentsStartLabel} · {data.paymentsTotal} payments · ${data.paymentsAmount.toLocaleString("en-CA")} collected (comped memberships excluded)
          </p>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.payments} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                 <Line type="monotone" dataKey="Montreal" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                 <Line type="monotone" dataKey="Saint-Hubert" stroke="hsl(142 60% 40%)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                 <Line type="monotone" dataKey="Pointe-Claire" stroke="hsl(38 92% 50%)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                 <Line type="monotone" dataKey="Hudson" stroke="hsl(280 55% 55%)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                 <Line type="monotone" dataKey="total" name="Total" stroke="hsl(var(--foreground))" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>


        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Location breakdown */}
          <div className="bg-card border border-border rounded-xl p-4 md:p-6">
            <h2 className="font-heading font-bold text-lg mb-1">Members and potential members by location</h2>
            <p className="text-xs text-muted-foreground mb-4">Members have paid. Potential members are registered unpaid or interested.</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byLoc} margin={{ left: -20, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="location" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Members" fill="hsl(142 60% 40%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Potential" fill="hsl(38 92% 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-1 text-sm">
              {data.byLoc.map((l) => (
                <div key={l.location} className="flex items-center justify-between border-t border-border pt-1">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground"><MapPin className="w-3.5 h-3.5" />{l.location}</span>
                  <span className="font-semibold">{l.Members} members · {l.Potential} potential ({l.Unpaid} unpaid + {l.Interested} interested)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Membership growth */}
          <div className="bg-card border border-border rounded-xl p-4 md:p-6">
            <h2 className="font-heading font-bold text-lg mb-1">Membership growth this season</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Running totals since {data.growthStartLabel} · {data.uniqueRegs.length} registered · {data.paid.length} paid members
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.growth} margin={{ left: -20, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="gRegCum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gPaidCum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142 60% 40%)" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="hsl(142 60% 40%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="Registered" stroke="hsl(var(--primary))" fill="url(#gRegCum)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Paid members" stroke="hsl(142 60% 40%)" fill="url(#gPaidCum)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-1 text-sm">
              <div className="flex items-center justify-between border-t border-border pt-1">
                <span className="text-muted-foreground">New paid members (last 7 days)</span>
                <span className="font-semibold">+{data.paidLast7}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Waiting on payment</span>
                <span className="font-semibold">{data.unpaid.length} registered unpaid</span>
              </div>
            </div>
          </div>

        </div>

        

        <SourceReport />

        {/* Activity feed */}
        <div className="bg-card border border-border rounded-xl p-4 md:p-6">
          <h2 className="font-heading font-bold text-lg mb-4">Recent activity</h2>
          {data.feed.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {data.feed.map((f, i) => (
                <div key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <span className="font-medium text-foreground">{f.who || "—"}</span>
                    <span className="text-muted-foreground"> · {f.where}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {f.paid && (
                      <Badge variant="outline" className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30 text-[10px] font-semibold">
                        ✅ Paid
                      </Badge>
                    )}
                    <Badge variant="outline">{f.kind}</Badge>
                    <span className="text-xs text-muted-foreground w-24 text-right">
                      {new Date(f.at).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
