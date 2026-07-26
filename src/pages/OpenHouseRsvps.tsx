import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, CalendarCheck, MapPin, Download, ArrowLeft, Home } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Rsvp {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  location: string;
  source_campaign: string | null;
  created_at: string;
}

const OpenHouseRsvps = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();

  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<"name" | "email" | "location" | "date">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
      return;
    }
    if (isAdmin) fetchAll();
  }, [isAdmin, adminLoading]);

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("open_house_rsvps")
      .select("id, email, first_name, last_name, location, source_campaign, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Could not load RSVPs", description: error.message, variant: "destructive" });
    } else {
      setRsvps((data as Rsvp[]) || []);
    }
    setLoading(false);
  };

  const locations = useMemo(
    () => [...new Set(rsvps.map(r => r.location).filter(Boolean))].sort(),
    [rsvps]
  );

  const byLocation = useMemo(() => {
    const map = new Map<string, number>();
    rsvps.forEach(r => {
      map.set(r.location, (map.get(r.location) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [rsvps]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rsvps.filter(r => {
      if (locationFilter !== "ALL" && r.location !== locationFilter) return false;
      if (!q) return true;
      return (
        (r.first_name || "").toLowerCase().includes(q) ||
        (r.last_name || "").toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q)
      );
    });
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      let va: string, vb: string;
      switch (sortKey) {
        case "name":
          va = `${a.first_name || ""} ${a.last_name || ""}`.toLowerCase();
          vb = `${b.first_name || ""} ${b.last_name || ""}`.toLowerCase();
          break;
        case "email":
          va = a.email.toLowerCase();
          vb = b.email.toLowerCase();
          break;
        case "location":
          va = a.location.toLowerCase();
          vb = b.location.toLowerCase();
          break;
        case "date":
        default:
          va = a.created_at;
          vb = b.created_at;
      }
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
    return list;
  }, [rsvps, search, locationFilter, sortKey, sortDir]);

  const exportCSV = () => {
    const headers = ["First Name", "Last Name", "Email", "Location", "Source", "Date"];
    const rows = rsvps.map(r => [
      r.first_name || "",
      r.last_name || "",
      r.email,
      r.location,
      r.source_campaign || "",
      new Date(r.created_at).toLocaleString(),
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `open-house-rsvps-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${rsvps.length} RSVPs downloaded as CSV.` });
  };

  const toggleSort = (k: typeof sortKey) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir(k === "date" ? "desc" : "asc"); }
  };

  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isAdmin) return null;

  return (
    <div className="py-8 px-4">
      <Helmet><title>Open House RSVPs · Club Choir Admin</title><meta name="robots" content="noindex,nofollow" /></Helmet>
      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-heading font-bold text-3xl text-foreground flex items-center gap-2">
              <CalendarCheck className="w-7 h-7" /> Open House RSVPs
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {rsvps.length} total RSVPs across {locations.length} locations.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-1" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard"><ArrowLeft className="w-4 h-4 mr-1" /> Dashboard</Link>
            </Button>
          </div>
        </div>

        {/* Location totals */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <button
            onClick={() => setLocationFilter("ALL")}
            className={`rounded-xl border p-3 text-left transition-colors ${locationFilter === "ALL" ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/50"}`}
          >
            <div className="text-xs text-muted-foreground">All locations</div>
            <div className="text-2xl font-bold text-foreground mt-1">{rsvps.length}</div>
          </button>
          {byLocation.map(([loc, count]) => (
            <button
              key={loc}
              onClick={() => setLocationFilter(locationFilter === loc ? "ALL" : loc)}
              className={`rounded-xl border p-3 text-left transition-colors ${locationFilter === loc ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/50"}`}
            >
              <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {loc}</div>
              <div className="text-2xl font-bold text-foreground mt-1">{count}</div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-border bg-card p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search name, email, or location…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="sm:w-56">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All locations</SelectItem>
                {locations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortKey} onValueChange={(v) => toggleSort(v as typeof sortKey)}>
              <SelectTrigger className="sm:w-44">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort by date</SelectItem>
                <SelectItem value="name">Sort by name</SelectItem>
                <SelectItem value="email">Sort by email</SelectItem>
                <SelectItem value="location">Sort by location</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground">
                <tr>
                  <th className="p-3 text-left font-medium">Name</th>
                  <th className="p-3 text-left font-medium">Email</th>
                  <th className="p-3 text-left font-medium">Location</th>
                  <th className="p-3 text-left font-medium">Source</th>
                  <th className="p-3 text-left font-medium">RSVP date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-medium text-foreground">
                      {r.first_name || r.last_name ? `${r.first_name || ""} ${r.last_name || ""}`.trim() : "—"}
                    </td>
                    <td className="p-3 text-muted-foreground truncate max-w-[260px]">{r.email}</td>
                    <td className="p-3 text-muted-foreground">
                      <Badge variant="outline" className="text-[10px] inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {r.location}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">{r.source_campaign || "—"}</td>
                    <td className="p-3 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No RSVPs match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border">
            {filtered.length} of {rsvps.length} RSVPs
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <Button variant="outline" size="sm" asChild>
            <Link to="/open-house"><Home className="w-4 h-4 mr-1" /> Open house registration page</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OpenHouseRsvps;
