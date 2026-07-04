import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Users, Mail, Loader2, UserCheck, Sparkles,
  TicketIcon, ListChecks, MapPin, Tag, ChevronRight, CheckCircle2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

type ContactType = "member" | "prospect" | "registrant" | "popup" | "waitlist";

interface UnifiedContact {
  key: string;
  source_id: string;
  member_id?: string | null;
  type: ContactType;
  first_name: string;
  last_name: string;
  email: string;
  location: string;
  status: string;
  tags: string[];
  source: string;
  follow_up_date: string | null;
  last_activity: string;
  detail_path?: string;
}

const TYPE_LABEL: Record<ContactType, string> = {
  member: "Member",
  prospect: "Prospect",
  registrant: "Fall 2026",
  popup: "Pop-up",
  waitlist: "Waitlist",
};

const TYPE_COLOR: Record<ContactType, string> = {
  member: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  prospect: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  registrant: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  popup: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
  waitlist: "bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30",
};

const CRM = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();

  const [contacts, setContacts] = useState<UnifiedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [locationFilter, setLocationFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
      return;
    }
    if (isAdmin) fetchAll();
  }, [isAdmin, adminLoading]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [
        { data: members },
        { data: prospects },
        { data: registrants },
        { data: popups },
        { data: waitlist },
      ] = await Promise.all([
        supabase.from("members").select("id, first_name, last_name, email, location, status, crm_tags, source, follow_up_date, updated_at, last_session"),
        supabase.from("prospects").select("id, first_name, last_name, email, locations, status, notes, created_at, updated_at"),
        supabase.from("session_registrations").select("id, member_id, first_name, last_name, email, location, session_label, payment_status, created_at"),
        supabase.from("popup_ticket_reservations").select("id, first_name, last_name, email, event_slug, payment_received, ticket_count, created_at"),
        supabase.from("popup_waitlist").select("id, first_name, last_name, email, event_slug, created_at"),
      ]);

      const unified: UnifiedContact[] = [];
      const memberByEmail = new Map<string, any>();

      (members || []).forEach((m: any) => {
        if (m.email) memberByEmail.set(m.email.toLowerCase(), m);
        unified.push({
          key: `member:${m.id}`,
          source_id: m.id,
          member_id: m.id,
          type: "member",
          first_name: m.first_name || "",
          last_name: m.last_name || "",
          email: (m.email || "").toLowerCase(),
          location: m.location || "",
          status: m.status || "",
          tags: m.crm_tags || [],
          source: m.source || "",
          follow_up_date: m.follow_up_date,
          last_activity: m.updated_at || m.last_session || "",
          detail_path: `/manage-members/${m.id}`,
        });
      });

      (prospects || []).forEach((p: any) => {
        const email = (p.email || "").toLowerCase();
        if (memberByEmail.has(email)) return; // dedupe with member
        unified.push({
          key: `prospect:${p.id}`,
          source_id: p.id,
          type: "prospect",
          first_name: p.first_name || "",
          last_name: p.last_name || "",
          email,
          location: (p.locations || []).join(", "),
          status: p.status || "prospect",
          tags: [],
          source: "prospect",
          follow_up_date: null,
          last_activity: p.updated_at || p.created_at || "",
          detail_path: `/manage-prospects`,
        });
      });

      (registrants || []).forEach((r: any) => {
        const email = (r.email || "").toLowerCase();
        if (memberByEmail.has(email)) {
          // Tag member with fall-2026 source if not already
          const idx = unified.findIndex(u => u.type === "member" && u.email === email);
          if (idx >= 0 && !unified[idx].source.includes("fall-2026")) {
            unified[idx].source = [unified[idx].source, "fall-2026"].filter(Boolean).join(", ");
          }
          return;
        }
        unified.push({
          key: `reg:${r.id}`,
          source_id: r.id,
          member_id: r.member_id,
          type: "registrant",
          first_name: r.first_name || "",
          last_name: r.last_name || "",
          email,
          location: r.location || "",
          status: r.payment_status || "registered",
          tags: [r.session_label].filter(Boolean),
          source: r.session_label || "registration",
          follow_up_date: null,
          last_activity: r.created_at || "",
        });
      });

      (popups || []).forEach((p: any) => {
        const email = (p.email || "").toLowerCase();
        if (memberByEmail.has(email) || unified.some(u => u.email === email)) {
          const idx = unified.findIndex(u => u.email === email);
          if (idx >= 0 && !unified[idx].source.includes(p.event_slug)) {
            unified[idx].source = [unified[idx].source, p.event_slug].filter(Boolean).join(", ");
          }
          return;
        }
        unified.push({
          key: `popup:${p.id}`,
          source_id: p.id,
          type: "popup",
          first_name: p.first_name || "",
          last_name: p.last_name || "",
          email,
          location: "",
          status: p.payment_received ? "paid" : "reserved",
          tags: [p.event_slug],
          source: p.event_slug || "popup",
          follow_up_date: null,
          last_activity: p.created_at || "",
        });
      });

      (waitlist || []).forEach((w: any) => {
        const email = (w.email || "").toLowerCase();
        if (unified.some(u => u.email === email)) return;
        unified.push({
          key: `wait:${w.id}`,
          source_id: w.id,
          type: "waitlist",
          first_name: w.first_name || "",
          last_name: w.last_name || "",
          email,
          location: "",
          status: "waiting",
          tags: [w.event_slug],
          source: w.event_slug || "waitlist",
          follow_up_date: null,
          last_activity: w.created_at || "",
        });
      });

      unified.sort((a, b) => a.first_name.localeCompare(b.first_name));
      setContacts(unified);
    } catch (e) {
      console.error("CRM fetch error:", e);
    }
    setLoading(false);
  };

  const locations = useMemo(
    () => [...new Set(contacts.map(c => c.location).filter(Boolean))].sort(),
    [contacts]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter(c => {
      if (typeFilter === "registrant") {
        if (!(c.tags.some(t => t.includes("fall-2026")) || c.source.includes("fall-2026"))) return false;
      } else if (typeFilter !== "ALL" && c.type !== typeFilter) return false;
      if (locationFilter !== "ALL" && !c.location.includes(locationFilter)) return false;
      if (statusFilter !== "ALL" && c.status.toUpperCase() !== statusFilter.toUpperCase()) return false;
      if (!q) return true;
      return (
        c.first_name.toLowerCase().includes(q) ||
        c.last_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.source.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q))
      );
    });
  }, [contacts, search, typeFilter, locationFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: contacts.length,
    members: contacts.filter(c => c.type === "member" && c.status.toUpperCase() === "ACTIVE").length,
    prospects: contacts.filter(c => c.type === "prospect").length,
    registrants: contacts.filter(c => c.tags.some(t => t.includes("fall-2026")) || c.source.includes("fall-2026")).length,
    popup: contacts.filter(c => c.type === "popup" || c.source.includes("studio")).length,
  }), [contacts]);

  const toggleOne = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const toggleAll = () => {
    if (filtered.every(c => selected.has(c.key))) {
      setSelected(prev => {
        const next = new Set(prev);
        filtered.forEach(c => next.delete(c.key));
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        filtered.forEach(c => { if (c.email) next.add(c.key); });
        return next;
      });
    }
  };

  const emailSegment = () => {
    const emails = contacts
      .filter(c => selected.has(c.key) && c.email)
      .map(c => c.email);
    if (!emails.length) return;
    navigate(`/send-email?to=${encodeURIComponent(emails.join(","))}`);
  };

  const markPaid = async (c: UnifiedContact) => {
    if (c.type !== "registrant" || !c.email) return;
    const raw = window.prompt(
      `Amount received from ${c.first_name} ${c.last_name} (CAD)?\nLeave blank to skip.`,
      ""
    );
    if (raw === null) return; // user cancelled
    const trimmed = raw.trim();
    let amount: number | null = null;
    if (trimmed !== "") {
      const parsed = Number(trimmed.replace(/[^0-9.]/g, ""));
      if (!Number.isFinite(parsed) || parsed < 0) {
        toast({ title: "Invalid amount", description: "Please enter a positive number.", variant: "destructive" });
        return;
      }
      amount = parsed;
    }
    const { error: regErr } = await supabase
      .from("session_registrations")
      .update({ payment_status: "paid", amount_paid: amount })
      .eq("id", c.source_id);
    if (regErr) {
      toast({ title: "Could not mark paid", description: regErr.message, variant: "destructive" });
      return;
    }
    const { data: rpc, error: rpcErr } = await supabase.rpc(
      "activate_member_for_paid_registration",
      { _email: c.email, _active_until: "2026-12-10" }
    );
    if (rpcErr) {
      toast({ title: "Marked paid, but activation failed", description: rpcErr.message, variant: "destructive" });
    } else {
      const activated = Array.isArray(rpc) && rpc[0]?.activated;
      toast({
        title: "Marked paid",
        description: activated
          ? `${c.first_name} now has member access through Dec 10, 2026.`
          : `${c.first_name} is marked paid. Access will unlock as soon as they sign up.`,
      });
    }
    fetchAll();
  };

  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const selectedCount = [...selected].filter(k => contacts.find(c => c.key === k)?.email).length;

  return (
    <div className="py-8 px-4">
      <Helmet><title>CRM · Club Choir Admin</title><meta name="robots" content="noindex,nofollow" /></Helmet>
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-heading font-bold text-3xl text-foreground flex items-center gap-2">
              <Users className="w-7 h-7" /> CRM
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              All contacts in one place — members, prospects, registrants, pop-up attendees.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/manage-members"><Button variant="outline" size="sm"><UserCheck className="w-4 h-4 mr-1" /> Members</Button></Link>
            <Link to="/manage-prospects"><Button variant="outline" size="sm"><Sparkles className="w-4 h-4 mr-1" /> Prospects</Button></Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <StatCard icon={<Users className="w-4 h-4" />} label="Total contacts" value={stats.total} />
          <StatCard icon={<UserCheck className="w-4 h-4" />} label="Active members" value={stats.members} />
          <StatCard icon={<Sparkles className="w-4 h-4" />} label="Prospects" value={stats.prospects} />
          <StatCard icon={<ListChecks className="w-4 h-4" />} label="Fall 2026" value={stats.registrants} />
          <StatCard icon={<TicketIcon className="w-4 h-4" />} label="Pop-up" value={stats.popup} />
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-border bg-card p-4 mb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, location, tag, or source…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All types</SelectItem>
                <SelectItem value="member">Members</SelectItem>
                <SelectItem value="prospect">Prospects</SelectItem>
                <SelectItem value="registrant">Fall 2026 registrants</SelectItem>
                <SelectItem value="popup">Pop-up attendees</SelectItem>
                <SelectItem value="waitlist">Waitlist</SelectItem>
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger><SelectValue placeholder="Location" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All locations</SelectItem>
                {locations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="PROSPECT">Prospect</SelectItem>
                <SelectItem value="TRIAL">Trial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="registered">Registered</SelectItem>
                <SelectItem value="waiting">Waiting</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk bar */}
        {selectedCount > 0 && (
          <div className="sticky top-16 z-30 mb-3 rounded-xl border border-primary bg-primary/5 p-3 flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-foreground">
              {selectedCount} selected
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
              <Button size="sm" onClick={emailSegment}>
                <Mail className="w-4 h-4 mr-1" /> Email this segment
              </Button>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <div className="bg-muted/50 border-b border-border px-3 py-2 flex items-center gap-3 text-xs font-medium text-muted-foreground">
            <Checkbox
              checked={filtered.length > 0 && filtered.every(c => selected.has(c.key))}
              onCheckedChange={toggleAll}
            />
            <span>{filtered.length} of {contacts.length} contacts</span>
          </div>
          {filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No contacts match.</p>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(c => (
                <div key={c.key} className="px-3 py-2.5 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                  <Checkbox
                    checked={selected.has(c.key)}
                    onCheckedChange={() => toggleOne(c.key)}
                    disabled={!c.email}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">
                        {c.first_name} {c.last_name}
                      </span>
                      <Badge variant="outline" className={`text-[10px] ${TYPE_COLOR[c.type]}`}>
                        {TYPE_LABEL[c.type]}
                      </Badge>
                      {c.status && c.type === "member" && (
                        <Badge variant="outline" className="text-[10px]">{c.status}</Badge>
                      )}
                      {c.tags.slice(0, 3).map(t => (
                        <Badge key={t} variant="secondary" className="text-[10px]">
                          <Tag className="w-2.5 h-2.5 mr-1" />{t}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      <span className="truncate">{c.email || "no email"}</span>
                      {c.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{c.location}</span>}
                      {c.source && <span>· {c.source}</span>}
                    </div>
                  </div>
                  {c.type === "registrant" && c.status !== "paid" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => markPaid(c)}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark paid
                    </Button>
                  )}
                  {c.type === "registrant" && c.status === "paid" && (
                    <Badge variant="outline" className="text-[10px] bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30">
                      Paid
                    </Badge>
                  )}
                  {c.detail_path && (
                    <Link to={c.detail_path}>
                      <Button size="sm" variant="ghost" className="h-8">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <div className="rounded-xl border border-border bg-card p-3">
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</div>
    <div className="text-2xl font-bold text-foreground mt-1">{value}</div>
  </div>
);

export default CRM;
