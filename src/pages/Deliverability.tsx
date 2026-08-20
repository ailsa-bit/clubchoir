import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Activity, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface EventRow {
  id: string;
  created_at: string;
  event_type: string;
  recipient_email: string | null;
  subject: string | null;
  clicked_url: string | null;
}

const TRACKED = [
  "email.delivered",
  "email.delivery_delayed",
  "email.bounced",
  "email.suppressed",
  "email.opened",
  "email.clicked",
  "email.complained",
  "email.failed",
] as const;

const shortLabel = (t: string) => t.replace(/^email\./, "").replace(/_/g, " ");

const badgeClass = (t: string) => {
  const k = shortLabel(t);
  if (k === "delivered" || k === "opened") return "bg-emerald-100 text-emerald-800";
  if (k === "clicked") return "bg-sky-100 text-sky-800";
  if (k === "delivery delayed") return "bg-amber-100 text-amber-800";
  if (k === "bounced" || k === "failed" || k === "complained" || k === "suppressed")
    return "bg-rose-100 text-rose-800";
  return "bg-muted text-muted-foreground";
};

const Deliverability = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [rows, setRows] = useState<EventRow[]>([]);
  const [weekRows, setWeekRows] = useState<{ event_type: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [recent, week] = await Promise.all([
      supabase
        .from("resend_email_events")
        .select("id, created_at, event_type, recipient_email, subject, clicked_url")
        .order("created_at", { ascending: false })
        .limit(300),
      supabase
        .from("resend_email_events")
        .select("event_type")
        .gte("created_at", sevenDaysAgo)
        .limit(10000),
    ]);
    setRows((recent.data as EventRow[]) || []);
    setWeekRows((week.data as { event_type: string }[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const summary = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of weekRows) counts[r.event_type] = (counts[r.event_type] || 0) + 1;
    return TRACKED.map((t) => ({ type: t, count: counts[t] || 0 }));
  }, [weekRows]);

  const types = useMemo(
    () => [...new Set([...TRACKED, ...rows.map((r) => r.event_type)])].sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (typeFilter !== "all" && r.event_type !== typeFilter) return false;
      if (!q) return true;
      return (
        (r.recipient_email || "").toLowerCase().includes(q) ||
        (r.subject || "").toLowerCase().includes(q)
      );
    });
  }, [rows, typeFilter, search]);

  if (adminLoading) {
    return <div className="py-20 text-center text-muted-foreground">Loading…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="py-20 text-center">
        <h1 className="font-heading font-bold text-2xl mb-2">Admin only</h1>
        <Button variant="outline" onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="py-10 px-4">
      <Helmet><meta name="robots" content="noindex,nofollow" /></Helmet>
      <div className="container mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="font-heading font-bold text-3xl mb-1 flex items-center gap-2">
              <Activity className="w-7 h-7 text-primary" /> Email Deliverability
            </h1>
            <p className="text-muted-foreground text-sm">Delivery events reported by our email provider.</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {summary.map((s) => (
            <div key={s.type} className="rounded-xl border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground capitalize">{shortLabel(s.type)}</p>
              <p className="font-heading font-bold text-2xl">{s.count}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mb-6">Counts cover the last 7 days.</p>

        <div className="flex gap-3 mb-4 flex-wrap">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Event type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All event types</SelectItem>
              {types.map((t) => (
                <SelectItem key={t} value={t} className="capitalize">{shortLabel(t)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Search recipient or subject…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px]"
          />
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium">Recipient</th>
                  <th className="px-3 py-2 font-medium">Event</th>
                  <th className="px-3 py-2 font-medium">Subject</th>
                  <th className="px-3 py-2 font-medium whitespace-nowrap">When</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-2">{r.recipient_email || "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${badgeClass(r.event_type)}`}>
                        {shortLabel(r.event_type)}
                      </span>
                    </td>
                    <td className="px-3 py-2 max-w-[260px] truncate" title={r.subject || ""}>
                      {r.subject || "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                    {loading ? "Loading…" : "No events yet."}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Deliverability;
