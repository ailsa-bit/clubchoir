import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
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
}
interface Prospect { email: string; locations: string[]; created_at: string; first_name: string; last_name: string | null; }
interface Rsvp { email: string; location: string; created_at: string; first_name: string | null; last_name: string | null; }
interface MemberRow { email: string | null; location: string; status: string; created_at: string; crm_tags: string[]; archived_at: string | null; }

const dayKey = (d: string | Date) => new Date(d).toISOString().slice(0, 10);
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
      supabase.from("session_registrations").select("email,location,payment_status,created_at,amount_paid,first_name,last_name,session_label").eq("session_label", "fall-2026"),
      supabase.from("session_registrations").select("email,location,payment_status,created_at,amount_paid,first_name,last_name,session_label").in("session_label", ["try-a-session", "open-house-2026"]),
      supabase.from("prospects").select("email,locations,created_at,first_name,last_name"),
      supabase.from("open_house_rsvps").select("email,location,created_at,first_name,last_name"),
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
    const included = (rows: Array<{ location?: string | null }>) => rows.filter((x) => !isExcludedLocation(x.location));
    const includedProspects = prospects.filter((x) => !x.locations.some(isExcludedLocation));

    // Exclude legacy locations from dashboard metrics while preserving their records in the database.
    const includedRegs = included(regs);
    const includedTryRegs = included(tryRegs);
    const includedRsvps = included(rsvps);

    // Dedupe registrations by email (keep paid over unpaid)
    const regByEmail = new Map<string, Reg>();
    includedRegs.forEach((x) => {
      const k = norm(x.email);
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
    const interested = new Set<string>([...rsvpEmails, ...prospectEmails, ...softRegEmails, ...memberTagged].filter((e) => e && !regByEmail.has(e)));

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
    const prevStart = daysAgo(range * 2), prevEnd = daysAgo(range);
    const inPrev = (d: string) => { const t = new Date(d); return t >= prevStart && t < prevEnd; };
    const prevCount =
      uniqueRegs.filter((x) => inPrev(x.created_at)).length +
      includedProspects.filter((x) => inPrev(x.created_at)).length +
      includedRsvps.filter((x) => inPrev(x.created_at)).length;
    const delta = prevCount === 0 ? null : Math.round(((newInRange - prevCount) / prevCount) * 100);

    // Per-location
    const byLoc = LOCATIONS.map((loc) => {
      const l = loc.toLowerCase();
      const regsL = uniqueRegs.filter((x) => (x.location || "").toLowerCase() === l);
      return {
        location: loc,
        Registered: regsL.length,
        Paid: regsL.filter((x) => x.payment_status === "paid").length,
        Interested: new Set([
          ...includedRsvps.filter((x) => (x.location || "").toLowerCase() === l).map((x) => norm(x.email)),
          ...includedTryRegs.filter((x) => (x.location || "").toLowerCase() === l).map((x) => norm(x.email)),
          ...includedProspects.filter((x) => (x.locations || []).some((v) => (v || "").toLowerCase() === l)).map((x) => norm(x.email)),
        ].filter((e) => interested.has(e))).size,
      };
    });

    // Follow-ups: unpaid registrations older than 5 days
    const cutoff = daysAgo(5);
    const staleUnpaid = unpaid
      .filter((x) => new Date(x.created_at) < cutoff)
      .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));

    // Activity feed
    const feed = [
      ...uniqueRegs.map((x) => ({ kind: "Registered", who: `${x.first_name} ${x.last_name}`, where: x.location, at: x.created_at, tone: "blue" })),
      ...includedRsvps.map((x) => ({ kind: "Open house RSVP", who: `${x.first_name || ""} ${x.last_name || ""}`.trim() || x.email, where: x.location, at: x.created_at, tone: "lime" })),
      ...includedProspects.map((x) => ({ kind: "Interest signup", who: `${x.first_name} ${x.last_name || ""}`.trim(), where: (x.locations || [])[0] || "—", at: x.created_at, tone: "amber" })),
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
      interestedCount: interested.size,
      payRate: uniqueRegs.length ? Math.round((paid.length / uniqueRegs.length) * 100) : 0,
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
          <StatCard icon={UserPlus} label="Fall 2026 registered" value={data.uniqueRegs.length} sub={`${data.payRate}% have paid`} tone="accent" to="/crm" />
          <StatCard icon={DollarSign} label="Paid" value={data.paid.length} sub={`$${data.revenue.toFixed(0)} collected`} tone="good" to="/crm" />
          <StatCard icon={AlertTriangle} label="Awaiting payment" value={data.unpaid.length} sub={`${data.staleUnpaid.length} over 5 days old`} tone="warn" to="/crm" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          <StatCard icon={TrendingUp} label={`New signups (${range}d)`} value={data.newInRange}
            sub={data.delta === null ? "click for details" : `${data.delta >= 0 ? "+" : ""}${data.delta}% vs previous ${range}d · click for details`}
            tone={data.delta !== null && data.delta < 0 ? "warn" : "good"}
            onClick={() => setShowNew((v) => !v)} active={showNew} />
          <StatCard icon={CalendarCheck} label="Interested Fall 2026" value={data.interestedCount} sub="open house · try a session · prospects" to="/crm" />
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
                            {x.extra && <Badge variant="outline" className="ml-1">{x.extra}</Badge>}
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

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Location breakdown */}
          <div className="bg-card border border-border rounded-xl p-4 md:p-6">
            <h2 className="font-heading font-bold text-lg mb-1">By location</h2>
            <p className="text-xs text-muted-foreground mb-4">Where to focus promotion and open house capacity.</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byLoc} margin={{ left: -20, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="location" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Registered" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Paid" fill="hsl(142 60% 40%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Interested" fill="hsl(38 92% 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-1 text-sm">
              {data.byLoc.map((l) => (
                <div key={l.location} className="flex items-center justify-between border-t border-border pt-1">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground"><MapPin className="w-3.5 h-3.5" />{l.location}</span>
                  <span className="font-semibold">{l.Registered} reg · {l.Paid} paid · {l.Interested} interested</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action list */}
          <div className="bg-card border border-border rounded-xl p-4 md:p-6">
            <h2 className="font-heading font-bold text-lg mb-1">Next best actions</h2>
            <p className="text-xs text-muted-foreground mb-4">Prioritized follow-ups based on current data.</p>
            <ul className="space-y-3 text-sm">
              {data.staleUnpaid.length > 0 && (
                <li className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <span>
                    <strong>{data.staleUnpaid.length}</strong> registrations unpaid for 5+ days — send a payment reminder.{" "}
                    <Link to="/campaigns" className="text-primary hover:underline">Run reminder campaign</Link>
                  </span>
                </li>
              )}
              {data.byLoc.filter((l) => l.Registered < 10).map((l) => (
                <li key={l.location} className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span><strong>{l.location}</strong> has only {l.Registered} registrations — consider extra promotion or a second open house date.</span>
                </li>
              ))}
              {data.delta !== null && data.delta < 0 && (
                <li className="flex items-start gap-3">
                  <TrendingUp className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <span>Signups are down {Math.abs(data.delta)}% vs the previous {range} days — a fresh campaign or social push may help.</span>
                </li>
              )}
              {data.staleUnpaid.length === 0 && data.interested.size === 0 && (
                <li className="text-muted-foreground">Nothing urgent — you're all caught up.</li>
              )}
            </ul>

            {data.staleUnpaid.length > 0 && (
              <div className="mt-5">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Oldest unpaid registrations</h3>
                <div className="space-y-1.5">
                  {data.staleUnpaid.slice(0, 6).map((x) => (
                    <div key={x.email} className="flex items-center justify-between text-sm border-t border-border pt-1.5">
                      <span className="truncate mr-2">{x.first_name} {x.last_name} <span className="text-muted-foreground">· {x.location}</span></span>
                      <Badge variant="outline" className="shrink-0">{Math.floor((Date.now() - +new Date(x.created_at)) / 86400000)}d</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

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
                  <div className="flex items-center gap-3 shrink-0">
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
