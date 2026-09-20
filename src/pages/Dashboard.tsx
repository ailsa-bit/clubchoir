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
import {
  Loader2, Music, Eye, Users, MapPin, ArrowRight, RefreshCw, BarChart3,
} from "lucide-react";

const LOCATIONS = ["Montreal", "Saint-Hubert", "Pointe-Claire", "Hudson"];
const LOC_COLORS: Record<string, string> = {
  Montreal: "hsl(var(--primary))",
  "Saint-Hubert": "hsl(142 60% 40%)",
  "Pointe-Claire": "hsl(38 92% 50%)",
  Hudson: "hsl(280 55% 55%)",
};

interface ViewRow {
  id: string;
  user_id: string | null;
  location: string | null;
  page: string;
  week: number | null;
  song: string | null;
  created_at: string;
  event_type: string | null;
  resource_type: string | null;
  file_name: string | null;
  device: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  audio: "Recordings",
  lyrics: "Lyrics",
  slides: "Lyric slides",
  sheet_music: "Sheet music",
};
const DEVICE_LABELS: Record<string, string> = {
  phone: "Phone",
  tablet: "Tablet",
  computer: "Computer",
  unknown: "Unknown",
};

const dayKey = (d: string | Date) => {
  const t = new Date(d);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
};
const fmtDay = (k: string) => new Date(k + "T12:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric" });
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

const prettyLocation = (loc?: string | null) => {
  if (!loc) return "Unknown";
  const match = LOCATIONS.find((l) => l.toLowerCase() === loc.trim().toLowerCase());
  return match || loc;
};

const StatCard = ({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) => (
  <div className="bg-card border border-border rounded-xl p-4 h-full">
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
      <Icon className="w-4 h-4" /> {label}
    </div>
    <div className="font-heading font-bold text-3xl text-foreground">{value}</div>
    {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
  </div>
);

const Dashboard = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [views, setViews] = useState<ViewRow[]>([]);
  const [range, setRange] = useState<7 | 14 | 30>(14);
  const [locFilter, setLocFilter] = useState<string>("all");

  useEffect(() => {
    if (!adminLoading && !isAdmin) { navigate("/"); return; }
    if (isAdmin) fetchAll();
  }, [isAdmin, adminLoading]);

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("resource_page_views")
      .select("id,user_id,location,page,week,song,created_at,event_type,resource_type,file_name,device")
      .order("created_at", { ascending: false })
      .limit(5000);
    setViews(((data as unknown) as ViewRow[]) || []);
    setLoading(false);
  };

  const data = useMemo(() => {
    const start = daysAgo(range - 1);
    start.setHours(0, 0, 0, 0);

    const inRange = views.filter((v) => new Date(v.created_at) >= start);
    const rows = locFilter === "all"
      ? inRange
      : inRange.filter((v) => prettyLocation(v.location) === locFilter);

    const isPageView = (v: ViewRow) => !v.event_type || v.event_type === "view";
    const pageRows = rows.filter(isPageView);
    const fileRows = rows.filter((v) => !isPageView(v));

    // What kind of material members actually open or download
    const byType = ["audio", "lyrics", "slides", "sheet_music"].map((t) => {
      const r = fileRows.filter((v) => v.resource_type === t);
      return {
        type: TYPE_LABELS[t],
        Opened: r.filter((v) => v.event_type === "open").length,
        Downloaded: r.filter((v) => v.event_type === "download").length,
        Played: r.filter((v) => v.event_type === "play").length,
        people: new Set(r.map((v) => v.user_id).filter(Boolean)).size,
        total: r.length,
      };
    });

    // Individual files, ranked
    const fileCounts = new Map<string, { label: string; type: string; uses: number; people: Set<string> }>();
    fileRows.forEach((v) => {
      const k = `${v.file_name || "File"}|${v.resource_type || ""}`;
      const cur = fileCounts.get(k) || {
        label: v.file_name || "File",
        type: TYPE_LABELS[v.resource_type || ""] || "Other",
        uses: 0,
        people: new Set<string>(),
      };
      cur.uses++;
      if (v.user_id) cur.people.add(v.user_id);
      fileCounts.set(k, cur);
    });
    const topFiles = [...fileCounts.values()]
      .map((x) => ({ label: x.label, type: x.type, uses: x.uses, people: x.people.size }))
      .sort((a, b) => b.uses - a.uses)
      .slice(0, 12);

    const audioPlays = fileRows.filter((v) => v.event_type === "play").length;
    const downloads = fileRows.filter((v) => v.event_type === "download").length;

    // Phone vs computer
    const byDevice = ["phone", "tablet", "computer", "unknown"].map((d) => {
      const r = rows.filter((v) => (v.device || "unknown") === d);
      return { device: DEVICE_LABELS[d], Uses: r.length, people: new Set(r.map((v) => v.user_id).filter(Boolean)).size };
    }).filter((d) => d.Uses > 0);

    // Daily opens, split by location
    const days: string[] = [];
    for (let i = range - 1; i >= 0; i--) days.push(dayKey(daysAgo(i)));
    const byDay = new Map<string, any>(
      days.map((d) => [d, Object.fromEntries([["day", fmtDay(d)], ["Total", 0], ...LOCATIONS.map((l) => [l, 0])])]),
    );
    pageRows.forEach((v) => {
      const row = byDay.get(dayKey(v.created_at));
      if (!row) return;
      row.Total++;
      const loc = prettyLocation(v.location);
      if (loc in row) row[loc]++;
    });
    const daily = [...byDay.values()];

    // Most-opened resources
    const resourceKey = (v: ViewRow) => {
      if (v.page === "archive") return "Past sessions archive";
      if (v.week) return `Week ${v.week} — ${v.song || "Song"}`;
      return "Resources home (all weeks)";
    };
    const counts = new Map<string, { label: string; opens: number; people: Set<string> }>();
    pageRows.forEach((v) => {
      const k = resourceKey(v);
      const cur = counts.get(k) || { label: k, opens: 0, people: new Set<string>() };
      cur.opens++;
      if (v.user_id) cur.people.add(v.user_id);
      counts.set(k, cur);
    });
    const top = [...counts.values()]
      .map((x) => ({ label: x.label, opens: x.opens, people: x.people.size }))
      .sort((a, b) => b.opens - a.opens);

    // By location
    const byLoc = LOCATIONS.map((loc) => {
      const r = inRange.filter((v) => prettyLocation(v.location) === loc);
      return { location: loc, Opens: r.length, Members: new Set(r.map((v) => v.user_id).filter(Boolean)).size };
    });
    const unknown = inRange.filter((v) => prettyLocation(v.location) === "Unknown").length;

    const uniquePeople = new Set(rows.map((v) => v.user_id).filter(Boolean)).size;
    const eventWord: Record<string, string> = { open: "Opened", download: "Downloaded", play: "Played", view: "Visited" };
    const recent = rows.slice(0, 20).map((v) => ({
      label: v.file_name || resourceKey(v),
      action: eventWord[v.event_type || "view"] || "Visited",
      location: prettyLocation(v.location),
      device: DEVICE_LABELS[v.device || "unknown"],
      at: v.created_at,
    }));

    return { rows, pageRows, fileRows, daily, top, byLoc, unknown, uniquePeople, recent, byType, topFiles, byDevice, audioPlays, downloads };
  }, [views, range, locFilter]);

  if (adminLoading || loading) {
    return <div className="py-24 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
  }
  if (!isAdmin) return null;

  const maxOpens = data.top[0]?.opens || 1;

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>Admin Dashboard | Club Choir</title><meta name="robots" content="noindex" /></Helmet>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-heading font-bold text-3xl text-foreground">Resource activity</h1>
            <p className="text-sm text-muted-foreground">What members are opening on the song resources pages, by location and by date.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-border overflow-hidden">
              {([7, 14, 30] as const).map((d) => (
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

        {/* Location filter */}
        <div className="flex flex-wrap gap-2 mb-5">
          {["all", ...LOCATIONS].map((loc) => (
            <button key={loc} onClick={() => setLocFilter(loc)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${locFilter === loc ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}>
              {loc === "all" ? "All locations" : loc}
            </button>
          ))}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          <StatCard icon={Eye} label={`Resource opens (${range}d)`} value={data.rows.length} sub={locFilter === "all" ? "all locations" : locFilter} />
          <StatCard icon={Users} label="Members using resources" value={data.uniquePeople} sub={`in the last ${range} days`} />
          <StatCard icon={Music} label="Most opened" value={data.top[0]?.opens ?? 0} sub={data.top[0]?.label || "No activity yet"} />
        </div>

        {data.rows.length === 0 && (
          <div className="bg-card border border-border rounded-xl p-6 mb-6 text-sm text-muted-foreground">
            No resource activity recorded yet. Tracking started today — as members open the song resources pages, their visits will appear here.
          </div>
        )}

        {/* Opens per day */}
        <div className="bg-card border border-border rounded-xl p-4 md:p-6 mb-6">
          <h2 className="font-heading font-bold text-lg mb-1">Resource page opens per day</h2>
          <p className="text-xs text-muted-foreground mb-4">Each line is a location; last {range} days.</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.daily} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="Total" stroke="hsl(var(--primary))" fill="url(#gTotal)" strokeWidth={2} />
                {LOCATIONS.map((l) => (
                  <Area key={l} type="monotone" dataKey={l} stroke={LOC_COLORS[l]} fill="transparent" strokeWidth={2} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Most opened resources */}
          <div className="bg-card border border-border rounded-xl p-4 md:p-6">
            <h2 className="font-heading font-bold text-lg mb-1">Most-opened resources</h2>
            <p className="text-xs text-muted-foreground mb-4">Ranked by opens in the last {range} days{locFilter === "all" ? "" : ` · ${locFilter}`}.</p>
            {data.top.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing opened yet in this period.</p>
            ) : (
              <div className="space-y-3">
                {data.top.map((r) => (
                  <div key={r.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-foreground truncate pr-2">{r.label}</span>
                      <span className="text-muted-foreground shrink-0">{r.opens} opens · {r.people} member{r.people === 1 ? "" : "s"}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, (r.opens / maxOpens) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* By location */}
          <div className="bg-card border border-border rounded-xl p-4 md:p-6">
            <h2 className="font-heading font-bold text-lg mb-1">Resource use by location</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Last {range} days{data.unknown ? ` · ${data.unknown} opens with no location on file` : ""}.
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byLoc} margin={{ left: -20, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="location" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Opens" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Members" fill="hsl(142 60% 40%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-1 text-sm">
              {data.byLoc.map((l) => (
                <div key={l.location} className="flex items-center justify-between border-t border-border pt-1">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground"><MapPin className="w-3.5 h-3.5" />{l.location}</span>
                  <span className="font-semibold">{l.Opens} opens · {l.Members} member{l.Members === 1 ? "" : "s"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-card border border-border rounded-xl p-4 md:p-6">
          <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Latest resource opens</h2>
          {data.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {data.recent.map((f, i) => (
                <div key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="font-medium text-foreground truncate">{f.label}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline">{f.location}</Badge>
                    <span className="text-xs text-muted-foreground w-28 text-right">
                      {new Date(f.at).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
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
