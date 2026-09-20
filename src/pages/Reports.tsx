import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Download, Printer, FileText, RefreshCw } from "lucide-react";

const LOCATIONS = ["Montreal", "Saint-Hubert", "Pointe-Claire", "Hudson"];
const SESSION = "fall-2026";

type Row = {
  name: string;
  email: string;
  location: string;
  status: string;
  created_at: string;
  tags: string[];
  night?: string;
  song?: string;
};

type ReportId =
  | "paid"
  | "guest-list"
  | "trial-guests"
  | "members";

const REPORTS: { id: ReportId; label: string; description: string }[] = [
  { id: "paid", label: "Attendance list — paid members", description: "Registered and paid for Fall 2026. Best for weekly attendance." },
  { id: "trial-guests", label: "Trial night guest list", description: "People booked in to try a free evening, with the date they chose." },
  { id: "guest-list", label: "Guest list (first-night trials)", description: "Contacts tagged guest-list." },
  { id: "members", label: "Full contact list", description: "Every non-archived contact in the CRM." },
];

const esc = (v: string) => `"${(v || "").replace(/"/g, '""')}"`;
const fullName = (f?: string | null, l?: string | null) => `${f || ""} ${l || ""}`.trim() || "—";
const fmt = (d: string) => new Date(d).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });

const Reports = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportId>("paid");
  const [location, setLocation] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [regs, setRegs] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [trials, setTrials] = useState<any[]>([]);

  useEffect(() => {
    if (!adminLoading && !isAdmin) navigate("/");
  }, [adminLoading, isAdmin, navigate]);

  const load = async () => {
    setLoading(true);
    const [r, m, tg] = await Promise.all([
      supabase.from("session_registrations").select("first_name,last_name,email,location,payment_status,session_label,created_at"),
      supabase.from("members").select("first_name,last_name,email,location,status,crm_tags,archived_at,created_at"),
      supabase.from("trial_guests").select("first_name,last_name,email,location,session_date,week,song,created_at").order("session_date"),
    ]);
    setRegs(r.data || []);
    setMembers(m.data || []);
    setTrials(tg.data || []);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const rows = useMemo<Row[]>(() => {
    const fall = regs.filter((r) => r.session_label === SESSION);
    const tagsFor = (email: string) =>
      members.find((m) => (m.email || "").toLowerCase() === email.toLowerCase())?.crm_tags || [];

    const fromReg = (list: any[]): Row[] =>
      list.map((r) => ({
        name: fullName(r.first_name, r.last_name),
        email: (r.email || "").trim(),
        location: r.location || "—",
        status: r.payment_status === "paid" ? "Paid" : r.payment_status === "free" ? "Free" : "Unpaid",
        created_at: r.created_at,
        tags: tagsFor(r.email || ""),
      }));

    let out: Row[] = [];
    if (report === "paid") out = fromReg(fall.filter((r) => r.payment_status === "paid" || r.payment_status === "free"));
    else if (report === "trial-guests")
      out = trials.map((g) => ({
        name: fullName(g.first_name, g.last_name),
        email: (g.email || "").trim(),
        location: g.location || "—",
        status: "Trial guest",
        created_at: g.created_at,
        tags: [],
        night: g.session_date ? `${fmt(g.session_date)}${g.week ? ` (${g.week})` : ""}` : "—",
        song: g.song || "—",
      }));
    else if (report === "guest-list")
      out = members
        .filter((m) => !m.archived_at && (m.crm_tags || []).includes("guest-list"))
        .map((m) => ({
          name: fullName(m.first_name, m.last_name),
          email: (m.email || "").trim(),
          location: m.location || "—",
          status: "Guest",
          created_at: m.created_at,
          tags: m.crm_tags || [],
        }));
    else {
      out = members
        .filter((m) => !m.archived_at)
        .map((m) => ({
          name: fullName(m.first_name, m.last_name),
          email: (m.email || "").trim(),
          location: m.location || "—",
          status: m.status || "—",
          created_at: m.created_at,
          tags: m.crm_tags || [],
        }));
    }

    if (location !== "all") out = out.filter((r) => (r.location || "").toLowerCase() === location.toLowerCase());
    const q = search.trim().toLowerCase();
    if (q) out = out.filter((r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));

    const seen = new Set<string>();
    out = out.filter((r) => {
      const k = `${r.name.toLowerCase()}|${r.email.toLowerCase()}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    if (report === "trial-guests") out.sort((a, b) => (a.night || "").localeCompare(b.night || "") || a.name.localeCompare(b.name));
    else out.sort((a, b) => a.name.localeCompare(b.name));
    return out;
  }, [report, location, search, regs, members, trials]);

  const current = REPORTS.find((r) => r.id === report)!;
  const fileBase = `${report}${location !== "all" ? `-${location.toLowerCase()}` : ""}-${new Date().toISOString().slice(0, 10)}`;

  const downloadCsv = () => {
    const csv = [
      report === "trial-guests" ? "Name,Email,Location,Evening,Song,Status,Added" : "Name,Email,Location,Status,Added",
      ...rows.map((r) =>
        (report === "trial-guests"
          ? [r.name, r.email, r.location, r.night || "", r.song || "", r.status, fmt(r.created_at)]
          : [r.name, r.email, r.location, r.status, fmt(r.created_at)]
        ).map(esc).join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileBase}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (adminLoading || !isAdmin) {
    return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Helmet>
        <title>Reports & Lists | Club Choir Admin</title>
        <meta name="description" content="Generate attendance lists, guest lists and contact reports for Club Choir sessions and open houses." />
      </Helmet>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-6 print:hidden">
        <div>
          <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-2">← Dashboard</Link>
          <h1 className="font-heading font-bold text-3xl flex items-center gap-2"><FileText className="w-7 h-7 text-primary" /> Reports & lists</h1>
          <p className="text-muted-foreground text-sm mt-1">Pick a list, filter it, then print a sign-in sheet or export to CSV.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6 print:hidden">
        {REPORTS.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setReport(r.id)}
            className={`text-left rounded-xl border p-4 transition-shadow hover:shadow-md ${report === r.id ? "border-primary ring-1 ring-primary bg-primary/5" : "border-border bg-card"}`}
          >
            <div className="font-heading font-semibold text-sm">{r.label}</div>
            <div className="text-xs text-muted-foreground mt-1">{r.description}</div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4 print:hidden">
        <div className="flex flex-wrap gap-2">
          {["all", ...LOCATIONS].map((loc) => (
            <Button key={loc} size="sm" variant={location === loc ? "default" : "outline"} onClick={() => setLocation(loc)}>
              {loc === "all" ? "All locations" : loc}
            </Button>
          ))}
        </div>
        <Input placeholder="Search name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full sm:w-64" />
        <div className="flex gap-2 ml-auto">
          <Button size="sm" variant="outline" onClick={() => window.print()} disabled={rows.length === 0}>
            <Printer className="w-4 h-4 mr-2" /> Print sign-in sheet
          </Button>
          <Button size="sm" onClick={downloadCsv} disabled={rows.length === 0}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 md:p-6 print:border-0 print:p-0">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <h2 className="font-heading font-bold text-lg">{current.label}</h2>
          {location !== "all" && <Badge variant="outline">{location}</Badge>}
          <Badge>{rows.length} {rows.length === 1 ? "person" : "people"}</Badge>
          <span className="text-xs text-muted-foreground ml-auto">{new Date().toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No one matches this report yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3 font-medium w-10">#</th>
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pr-4 font-medium">Location</th>
                  {report === "trial-guests" && <th className="py-2 pr-4 font-medium">Evening</th>}
                  {report === "trial-guests" && <th className="py-2 pr-4 font-medium">Song</th>}
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 font-medium w-28">Present</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r, i) => (
                  <tr key={`${r.email}-${i}`}>
                    <td className="py-2 pr-3 text-muted-foreground">{i + 1}</td>
                    <td className="py-2 pr-4 text-foreground font-medium">{r.name}</td>
                    <td className="py-2 pr-4 text-muted-foreground break-all">{r.email}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{r.location}</td>
                    {report === "trial-guests" && <td className="py-2 pr-4 text-foreground">{r.night}</td>}
                    {report === "trial-guests" && <td className="py-2 pr-4 text-muted-foreground">{r.song}</td>}
                    <td className="py-2 pr-4">
                      <Badge variant={r.status === "Paid" ? "default" : "outline"}>{r.status}</Badge>
                    </td>
                    <td className="py-2"><span className="inline-block w-16 border-b border-border h-4" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
