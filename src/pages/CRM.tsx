import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { invokeCampaign, SessionExpiredError } from "@/lib/campaignInvoke";
import { useAdmin } from "@/hooks/use-admin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Users, Mail, Loader2, UserCheck, Sparkles,
  TicketIcon, MapPin, Tag, ChevronRight, CheckCircle2,
  ArrowUpDown, DollarSign, Download,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

type ContactType = "member" | "prospect" | "registrant" | "popup" | "waitlist";

interface RegPayment {
  id: string;
  session_label: string;
  payment_status: string;
  created_at: string;
  location: string;
  is_returning_member: boolean;
}


interface UnifiedContact {
  key: string;
  member_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  location: string;
  primary_type: ContactType;
  types: ContactType[];
  status: string;
  tags: string[];
  sources: string[];
  last_activity: string;
  people: string[];
  detail_path?: string;
  unpaid_reg: RegPayment | null;
  paid_reg: RegPayment | null;
  // A shared email can carry more than one registration (couples).
  unpaid_reg_count: number;
  paid_reg_count: number;
}

const TYPE_LABEL: Record<ContactType, string> = {
  member: "Member",
  prospect: "Prospect",
  registrant: "Registrant",
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

const TYPE_PRIORITY: Record<ContactType, number> = {
  member: 5, registrant: 4, popup: 3, waitlist: 2, prospect: 1,
};

const PRESET_AMOUNTS = [120, 135, 150, 175, 200, 280];

type SortKey = "name" | "email" | "location" | "type" | "status" | "activity";
type SortDir = "asc" | "desc";

// Mutually exclusive buckets — a person is counted once, in their highest-commitment bucket.
const bucketOf = (c: UnifiedContact): string => {
  if (c.tags.includes("fall-2026") || c.paid_reg || c.unpaid_reg) return "registered";
  if (
    c.tags.includes("open-house-2026") ||
    c.tags.includes("try-a-session") ||
    c.types.includes("prospect")
  ) return "interested";
  return "other";
};


const CRM = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();

  const [contacts, setContacts] = useState<UnifiedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "payments">("all");

  // All-contacts filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [locationFilter, setLocationFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [tagFilter, setTagFilter] = useState<string>("ALL");
  const [bucketFilter, setBucketFilter] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Payments filters
  const [payLocation, setPayLocation] = useState<string>("ALL");
  const [paySearch, setPaySearch] = useState("");

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
        supabase.from("members")
          .select("id, first_name, last_name, email, location, status, crm_tags, source, follow_up_date, updated_at, last_session, archived_at")
          .is("archived_at", null),
        supabase.from("prospects").select("id, first_name, last_name, email, locations, status, notes, created_at, updated_at"),
        supabase.from("session_registrations").select("id, member_id, first_name, last_name, email, location, session_label, payment_status, is_returning_member, created_at").order("created_at", { ascending: false }),
        supabase.from("popup_ticket_reservations").select("id, first_name, last_name, email, event_slug, payment_received, ticket_count, created_at"),
        supabase.from("popup_waitlist").select("id, first_name, last_name, email, event_slug, created_at"),
      ]);

      const byEmail = new Map<string, UnifiedContact>();
      const orphans: UnifiedContact[] = [];

      const upsert = (email: string, patch: (c: UnifiedContact) => void, fallbackKey: string) => {
        const key = email.toLowerCase();
        if (!key) {
          const c: UnifiedContact = blank(fallbackKey);
          patch(c);
          orphans.push(c);
          return;
        }
        let c = byEmail.get(key);
        if (!c) {
          c = blank(`c:${key}`);
          c.email = key;
          byEmail.set(key, c);
        }
        patch(c);
      };

      (members || []).forEach((m: any) => {
        upsert(m.email || "", (c) => {
          c.member_id = m.id;
          c.first_name = m.first_name || c.first_name;
          c.last_name = m.last_name || c.last_name;
          c.location = m.location || c.location;
          c.status = m.status || c.status;
          c.types.push("member");
          addPerson(c, m.first_name, m.last_name);
          (m.crm_tags || []).forEach((t: string) => c.tags.push(t));
          if (m.source) c.sources.push(m.source);
          c.last_activity = laterOf(c.last_activity, m.updated_at || m.last_session);
          c.detail_path = `/manage-members/${m.id}`;
        }, `member:${m.id}`);
      });

      (prospects || []).forEach((p: any) => {
        upsert(p.email || "", (c) => {
          c.first_name = c.first_name || p.first_name || "";
          c.last_name = c.last_name || p.last_name || "";
          if (!c.location && (p.locations || []).length) c.location = (p.locations || []).join(", ");
          c.types.push("prospect");
          addPerson(c, p.first_name, p.last_name);
          c.sources.push("prospect");
          c.last_activity = laterOf(c.last_activity, p.updated_at || p.created_at);
          if (!c.detail_path) c.detail_path = "/manage-prospects";
        }, `prospect:${p.id}`);
      });

      (registrants || []).forEach((r: any) => {
        upsert(r.email || "", (c) => {
          c.first_name = c.first_name || r.first_name || "";
          c.last_name = c.last_name || r.last_name || "";
          if (!c.location) c.location = r.location || "";
          c.types.push("registrant");
          addPerson(c, r.first_name, r.last_name);
          if (r.session_label) c.tags.push(r.session_label);
          if (r.session_label) c.sources.push(r.session_label);
          c.last_activity = laterOf(c.last_activity, r.created_at);
          if (r.session_label === "fall-2026") {
            const reg: RegPayment = { id: r.id, session_label: r.session_label, payment_status: r.payment_status, created_at: r.created_at, location: r.location || "", is_returning_member: r.is_returning_member === true };
            if (r.payment_status === "paid") { c.paid_reg = c.paid_reg ?? reg; c.paid_reg_count++; }
            else { c.unpaid_reg = c.unpaid_reg ?? reg; c.unpaid_reg_count++; }
          }

        }, `reg:${r.id}`);
      });

      (popups || []).forEach((p: any) => {
        upsert(p.email || "", (c) => {
          c.first_name = c.first_name || p.first_name || "";
          c.last_name = c.last_name || p.last_name || "";
          c.types.push("popup");
          addPerson(c, p.first_name, p.last_name);
          if (p.event_slug) c.tags.push(p.event_slug);
          if (p.event_slug) c.sources.push(p.event_slug);
          c.last_activity = laterOf(c.last_activity, p.created_at);
        }, `popup:${p.id}`);
      });

      (waitlist || []).forEach((w: any) => {
        upsert(w.email || "", (c) => {
          c.first_name = c.first_name || w.first_name || "";
          c.last_name = c.last_name || w.last_name || "";
          c.types.push("waitlist");
          addPerson(c, w.first_name, w.last_name);
          if (w.event_slug) c.tags.push(`waitlist:${w.event_slug}`);
          c.sources.push("waitlist");
          c.last_activity = laterOf(c.last_activity, w.created_at);
        }, `wait:${w.id}`);
      });

      const all = [...byEmail.values(), ...orphans];
      all.forEach((c) => {
        c.types = uniq(c.types);
        c.tags = uniq(c.tags);
        c.sources = uniq(c.sources);
        c.primary_type = c.types.slice().sort((a, b) => TYPE_PRIORITY[b] - TYPE_PRIORITY[a])[0] || "prospect";
        if (!c.status) {
          if (c.primary_type === "registrant" && c.unpaid_reg) c.status = "unpaid";
          else if (c.paid_reg) c.status = "paid";
          else if (c.primary_type === "waitlist") c.status = "waiting";
          else if (c.primary_type === "popup") c.status = "reserved";
          else c.status = c.primary_type.toUpperCase();
        }
      });

      setContacts(all);
    } catch (e) {
      console.error("CRM fetch error:", e);
    }
    setLoading(false);
  };

  const locations = useMemo(
    () => [...new Set(contacts.map(c => c.location).filter(Boolean))].sort(),
    [contacts]
  );
  const allTags = useMemo(
    () => [...new Set(contacts.flatMap(c => c.tags))].sort(),
    [contacts]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = contacts.filter(c => {
      if (typeFilter !== "ALL" && !c.types.includes(typeFilter as ContactType)) return false;
      if (locationFilter !== "ALL" && !c.location.includes(locationFilter)) return false;
      if (statusFilter !== "ALL") {
        const sf = statusFilter.toUpperCase();
        // Type-like statuses match anyone carrying that role, not just the "primary" one.
        if (sf === "PROSPECT") {
          if (!c.types.includes("prospect")) return false;
        } else if (sf === "WAITING") {
          if (!c.types.includes("waitlist")) return false;
        } else if (c.status.toUpperCase() !== sf) return false;
      }
      if (tagFilter !== "ALL" && !c.tags.includes(tagFilter)) return false;
      if (bucketFilter !== "ALL") {
        const b = bucketOf(c);
        if (bucketFilter === "registered-paid") {
          if (b !== "registered" || !c.paid_reg) return false;
        } else if (bucketFilter === "registered-unpaid") {
          if (b !== "registered" || c.paid_reg) return false;
        } else if (b !== bucketFilter) return false;
      }
      if (!q) return true;
      return (
        c.first_name.toLowerCase().includes(q) ||
        c.last_name.toLowerCase().includes(q) ||
        c.people.some(p => p.toLowerCase().includes(q)) ||
        c.email.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q))
      );
    });
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      const getK = (c: UnifiedContact) => {
        switch (sortKey) {
          case "name": return `${c.first_name} ${c.last_name}`.toLowerCase();
          case "email": return c.email;
          case "location": return c.location.toLowerCase();
          case "type": return c.primary_type;
          case "status": return c.status.toLowerCase();
          case "activity": return c.last_activity || "";
        }
      };
      const va = getK(a), vb = getK(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
    return list;
  }, [contacts, search, typeFilter, locationFilter, statusFilter, tagFilter, bucketFilter, sortKey, sortDir]);

  const unpaidRegs = useMemo(() => {
    const list = contacts.filter(c => c.unpaid_reg);
    return list.filter(c => {
      if (payLocation !== "ALL" && !(c.unpaid_reg?.location || c.location).includes(payLocation)) return false;
      const q = paySearch.trim().toLowerCase();
      if (!q) return true;
      return (
        c.first_name.toLowerCase().includes(q) ||
        c.last_name.toLowerCase().includes(q) ||
        c.people.some(p => p.toLowerCase().includes(q)) ||
        c.email.toLowerCase().includes(q)
      );
    }).sort((a, b) => (a.unpaid_reg?.created_at || "").localeCompare(b.unpaid_reg?.created_at || ""));
  }, [contacts, payLocation, paySearch]);

  const stats = useMemo(() => {
    const b = (name: string) => contacts.filter(c => bucketOf(c) === name);
    const reg = b("registered");
    const sum = (list: typeof contacts, pick: (c: typeof contacts[number]) => number) =>
      list.reduce((n, c) => n + pick(c), 0);
    return {
      total: contacts.length,
      // Count registrations, not emails — couples can share one email.
      registered: sum(reg, c => c.paid_reg_count + c.unpaid_reg_count) || reg.length,
      regPaid: sum(reg, c => c.paid_reg_count),
      regUnpaid: sum(reg, c => c.unpaid_reg_count),
      interested: b("interested").length,

      unpaid: sum(contacts, c => c.unpaid_reg_count),
      fallPaid: sum(contacts, c => c.paid_reg_count),
    };
  }, [contacts]);


  const payStats = useMemo(() => {
    const byLoc = new Map<string, { unpaid: number; paid: number }>();
    contacts.forEach(c => {
      const loc = c.unpaid_reg?.location || c.paid_reg?.location;
      if (!loc) return;
      if (!byLoc.has(loc)) byLoc.set(loc, { unpaid: 0, paid: 0 });
      const s = byLoc.get(loc)!;
      s.unpaid += c.unpaid_reg_count;
      s.paid += c.paid_reg_count;
    });
    return [...byLoc.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [contacts]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("asc"); }
  };

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
    const emails = contacts.filter(c => selected.has(c.key) && c.email).map(c => c.email);
    if (!emails.length) return;
    navigate(`/send-email?to=${encodeURIComponent(emails.join(","))}`);
  };

  const markPaid = async (c: UnifiedContact, amount: number | null) => {
    const reg = c.unpaid_reg;
    if (!reg || !c.email) return;
    const { error: regErr } = await supabase
      .from("session_registrations")
      .update({ payment_status: "paid", amount_paid: amount })
      .eq("id", reg.id);
    if (regErr) {
      toast({ title: "Could not mark paid", description: regErr.message, variant: "destructive" });
      return;
    }
    const { error: memberErr } = await supabase
      .from("members")
      .update({ status: "ACTIVE" })
      .ilike("email", c.email);
    if (memberErr) {
      console.warn("Could not activate member row:", memberErr.message);
    }
    const { data: rpc, error: rpcErr } = await supabase.rpc(
      "activate_member_for_paid_registration",
      { _email: c.email, _active_until: "2026-12-10" }
    );
    const activated = !rpcErr && Array.isArray(rpc) && rpc[0]?.activated;
    if (rpcErr) {
      toast({ title: "Marked paid, activation failed", description: rpcErr.message, variant: "destructive" });
    } else {
      toast({
        title: "Marked paid",
        description: activated
          ? `${c.first_name} now has member access through Dec 10, 2026.`
          : `${c.first_name} is marked paid. Access unlocks when they sign up.`,
      });
    }
    // Send the "Welcome — Joined After First Night" email to all locations (including Montreal)
    try {
      const sendRequest = {
        segment: "welcome-late-paid",
        onlyEmails: [c.email],
        skipIfAlreadySent: true,
      };
      const verification = await invokeCampaign<any>({ ...sendRequest, preflightOnly: true });
      if (verification?.issues?.length) {
        const details = verification.issues
          .map((issue: { email: string; problems: string[] }) => `${issue.email}: ${issue.problems.join(", ")}`)
          .join("; ");
        toast({ title: "Payment email blocked", description: details, variant: "destructive" });
        fetchAll();
        return;
      }
      if (verification?.count !== 1 || !verification?.fingerprint) {
        toast({
          title: "No email sent",
          description: `${c.email} already received this email or is not on the verified paid list.`,
        });
        fetchAll();
        return;
      }
      const sendRes = await invokeCampaign<any>({
        ...sendRequest,
        preflightFingerprint: verification.fingerprint,
        preflightCount: verification.count,
      });
      if (sendRes?.success?.length) {
        toast({ title: "Welcome email sent", description: `Emailed ${c.email}` });
      } else if (sendRes?.failed?.length) {
        toast({ title: "Payment email failed", description: `Could not email ${c.email}`, variant: "destructive" });
      } else {
        toast({
          title: "No email sent",
          description: `${c.email} already received the welcome email (or isn't on the verified paid list yet).`,
        });
      }
    } catch (e: any) {
      if (e instanceof SessionExpiredError) {
        toast({
          title: "Please sign in again",
          description: "Your session expired, so no email was sent. Sign in and mark paid again.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Payment email failed", description: e?.message || "Unknown error", variant: "destructive" });
      }
    }
    fetchAll();
  };

  const markPaidPrompt = (c: UnifiedContact) => {
    const raw = window.prompt(
      `Amount received from ${c.first_name} ${c.last_name} (CAD)? Leave blank to skip.`,
      ""
    );
    if (raw === null) return;
    const trimmed = raw.trim();
    let amount: number | null = null;
    if (trimmed !== "") {
      const parsed = Number(trimmed.replace(/[^0-9.]/g, ""));
      if (!Number.isFinite(parsed) || parsed < 0) {
        toast({ title: "Invalid amount", variant: "destructive" });
        return;
      }
      amount = parsed;
    }
    markPaid(c, amount);
  };

  const exportCSV = () => {
    const headers = ["First Name", "Last Name", "Email", "Location", "Types", "Status", "Tags", "Sources", "Last Activity", "Unpaid Reg", "Paid Reg"];
    const rows = contacts.map(c => [
      c.first_name,
      c.last_name,
      c.email,
      c.location,
      c.types.join("; "),
      c.status,
      c.tags.join("; "),
      c.sources.join("; "),
      c.last_activity ? new Date(c.last_activity).toLocaleDateString() : "",
      c.unpaid_reg ? `${c.unpaid_reg.session_label} (${c.unpaid_reg.location})` : "",
      c.paid_reg ? `${c.paid_reg.session_label} (${c.paid_reg.location})` : "",
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `club-choir-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${contacts.length} contacts downloaded as CSV.` });
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
              One row per person. Members, prospects, registrants and pop-up attendees rolled up.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
            <Link to="/manage-members"><Button variant="outline" size="sm"><UserCheck className="w-4 h-4 mr-1" /> Members</Button></Link>
            <Link to="/manage-prospects"><Button variant="outline" size="sm"><Sparkles className="w-4 h-4 mr-1" /> Prospects</Button></Link>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All contacts ({stats.total})</TabsTrigger>
            <TabsTrigger value="payments">
              <DollarSign className="w-3.5 h-3.5 mr-1" />
              Payments ({stats.unpaid} unpaid)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {/* Stats */}
            {/* Stats — mutually exclusive buckets (each person counted once) */}
            {(() => {
              const pick = (b: string) => {
                setBucketFilter(b);
                setTypeFilter("ALL"); setStatusFilter("ALL"); setTagFilter("ALL");
              };
              return (
                <div className="space-y-3 mb-6">
                  <div className="grid grid-cols-3 gap-3">
                    <StatCard label="Fall 2026 registered" value={stats.registered} onClick={() => pick("registered")} active={bucketFilter === "registered"} />
                    <StatCard label="→ Paid" value={stats.regPaid} onClick={() => pick("registered-paid")} active={bucketFilter === "registered-paid"} />
                    <StatCard label="→ Not paid" value={stats.regUnpaid} onClick={() => pick("registered-unpaid")} active={bucketFilter === "registered-unpaid"} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard label="Interested Fall 2026" value={stats.interested} onClick={() => pick("interested")} active={bucketFilter === "interested"} />
                    <StatCard label="All contacts" value={stats.total} onClick={() => pick("ALL")} active={bucketFilter === "ALL"} />
                  </div>
                  {bucketFilter !== "ALL" && (() => {
                    const isReg = bucketFilter.startsWith("registered");
                    const inBucket = contacts.filter(c => {
                      const b = bucketOf(c);
                      if (bucketFilter === "registered-paid") return b === "registered" && !!c.paid_reg;
                      if (bucketFilter === "registered-unpaid") return b === "registered" && !c.paid_reg;
                      return b === bucketFilter;
                    });
                    const byLoc = new Map<string, number>();
                    inBucket.forEach(c => {

                      const loc =
                        (isReg && (c.paid_reg?.location || c.unpaid_reg?.location)) ||
                        c.location ||
                        "Unspecified";
                      const n = isReg
                        ? (bucketFilter === "registered-paid"
                            ? c.paid_reg_count
                            : bucketFilter === "registered-unpaid"
                            ? c.unpaid_reg_count
                            : c.paid_reg_count + c.unpaid_reg_count) || 1
                        : 1;
                      byLoc.set(loc, (byLoc.get(loc) || 0) + n);
                    });
                    const rows = [...byLoc.entries()].sort((a, b) => b[1] - a[1]);
                    const total = rows.reduce((n, r) => n + r[1], 0);
                    return (
                      <div className="rounded-xl border border-border bg-card p-4">
                        <p className="text-xs font-medium text-muted-foreground mb-3">
                          By location · {total} total
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {rows.map(([loc, n]) => (
                            <button
                              key={loc}
                              onClick={() => setLocationFilter(locationFilter === loc ? "ALL" : loc)}
                              className={`rounded-lg border p-3 text-left transition-colors ${
                                locationFilter === loc
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:bg-muted/50"
                              }`}
                            >
                              <div className="text-xl font-bold text-foreground">{n}</div>
                              <div className="text-xs text-muted-foreground">{loc}</div>
                            </button>
                          ))}
                          {rows.length === 0 && (
                            <p className="text-sm text-muted-foreground">No contacts in this bucket.</p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  <p className="text-xs text-muted-foreground">
                    Each person is counted once. "Interested Fall 2026" combines open house, try-a-session and prospects — as soon as someone registers they move into Fall 2026 registered.
                  </p>

                </div>

              );
            })()}


            {/* Filters */}
            <div className="rounded-xl border border-border bg-card p-4 mb-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search name, email, location, tag…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All types</SelectItem>
                    <SelectItem value="member">Members</SelectItem>
                    <SelectItem value="prospect">Prospects</SelectItem>
                    <SelectItem value="registrant">Registrants</SelectItem>
                    <SelectItem value="popup">Pop-up</SelectItem>
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
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="waiting">Waiting</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={tagFilter} onValueChange={setTagFilter}>
                  <SelectTrigger><SelectValue placeholder="Tag / session" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All tags</SelectItem>
                    {allTags.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bulk bar */}
            {selectedCount > 0 && (
              <div className="sticky top-16 z-30 mb-3 rounded-xl border border-primary bg-primary/5 p-3 flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{selectedCount} selected</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
                  <Button size="sm" onClick={emailSegment}>
                    <Mail className="w-4 h-4 mr-1" /> Email segment
                  </Button>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="rounded-xl border border-border overflow-hidden bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground">
                    <tr>
                      <th className="p-2 w-8">
                        <Checkbox
                          checked={filtered.length > 0 && filtered.every(c => selected.has(c.key))}
                          onCheckedChange={toggleAll}
                        />
                      </th>
                      <SortHeader label="Name" k="name" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                      <SortHeader label="Email" k="email" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="hidden md:table-cell" />
                      <SortHeader label="Location" k="location" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="hidden sm:table-cell" />
                      <SortHeader label="Type" k="type" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                      <SortHeader label="Status" k="status" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="hidden lg:table-cell" />
                      <SortHeader label="Last activity" k="activity" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="hidden xl:table-cell" />
                      <th className="p-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => (
                      <tr key={c.key} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="p-2">
                          <Checkbox checked={selected.has(c.key)} onCheckedChange={() => toggleOne(c.key)} disabled={!c.email} />
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-foreground">{c.people.length > 1 ? c.people.join(" + ") : `${c.first_name} ${c.last_name}`}</span>
                            {c.paid_reg && (
                              <Badge variant="outline" className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30 text-[10px] font-semibold">
                                ✅ Paid
                              </Badge>
                            )}
                          </div>
                          {c.people.length > 1 && (
                            <div className="text-[10px] text-muted-foreground">{c.people.length} people share this email</div>
                          )}
                          {c.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {c.tags.slice(0, 3).map(t => (
                                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                  <Tag className="w-2.5 h-2.5 inline mr-0.5" />{t}
                                </span>
                              ))}
                              {c.tags.length > 3 && <span className="text-[10px] text-muted-foreground">+{c.tags.length - 3}</span>}
                            </div>
                          )}
                        </td>
                        <td className="p-2 text-muted-foreground hidden md:table-cell truncate max-w-[220px]">{c.email || "—"}</td>
                        <td className="p-2 text-muted-foreground hidden sm:table-cell">
                          {c.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{c.location}</span>}
                        </td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-1">
                            {c.types.map(t => (
                              <Badge key={t} variant="outline" className={`text-[10px] ${TYPE_COLOR[t]}`}>{TYPE_LABEL[t]}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="p-2 hidden lg:table-cell">
                          <Badge variant="outline" className="text-[10px]">{c.status}</Badge>
                        </td>
                        <td className="p-2 text-muted-foreground text-xs hidden xl:table-cell whitespace-nowrap">
                          {c.last_activity ? new Date(c.last_activity).toLocaleDateString() : "—"}
                        </td>
                        <td className="p-2 text-right">
                          {c.detail_path && (
                            <Link to={c.detail_path} className="inline-flex text-muted-foreground hover:text-foreground">
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No contacts match.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border">
                {filtered.length} of {contacts.length} contacts
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payments">
            <div className="rounded-xl border border-border bg-card p-4 mb-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search name or email…" value={paySearch} onChange={e => setPaySearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={payLocation} onValueChange={setPayLocation}>
                  <SelectTrigger className="sm:w-56"><SelectValue placeholder="Location" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All locations</SelectItem>
                    {locations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Unpaid Fall 2026 registrants, oldest signup first. Marking paid activates their member access through Dec 10, 2026.
              </p>
            </div>

            {/* Location payment totals */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
              <button
                onClick={() => setPayLocation("ALL")}
                className={`rounded-xl border p-3 text-left transition-colors ${payLocation === "ALL" ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/50"}`}
              >
                <div className="text-xs font-medium text-muted-foreground">All locations</div>
                <div className="flex gap-3 mt-1">
                  <div>
                    <span className="text-xl font-bold text-foreground">{stats.unpaid}</span>
                    <span className="text-[10px] text-muted-foreground ml-1">unpaid</span>
                  </div>
                  <div>
                    <span className="text-xl font-bold text-foreground">{stats.fallPaid}</span>
                    <span className="text-[10px] text-muted-foreground ml-1">paid</span>
                  </div>
                </div>
              </button>
              {payStats.map(([loc, s]) => (
                <button
                  key={loc}
                  onClick={() => setPayLocation(payLocation === loc ? "ALL" : loc)}
                  className={`rounded-xl border p-3 text-left transition-colors ${payLocation === loc ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/50"}`}
                >
                  <div className="text-xs font-medium text-muted-foreground truncate">{loc}</div>
                  <div className="flex gap-3 mt-1">
                    <div>
                      <span className="text-xl font-bold text-foreground">{s.unpaid}</span>
                      <span className="text-[10px] text-muted-foreground ml-1">unpaid</span>
                    </div>
                    <div>
                      <span className="text-xl font-bold text-foreground">{s.paid}</span>
                      <span className="text-[10px] text-muted-foreground ml-1">paid</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-border overflow-hidden bg-card divide-y divide-border">
              {unpaidRegs.length === 0 && (
                <p className="p-8 text-center text-sm text-muted-foreground">🎉 No unpaid registrants.</p>
              )}
              {unpaidRegs.map(c => (
                <div key={c.key} className="p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground">{c.people.length > 1 ? c.people.join(" + ") : `${c.first_name} ${c.last_name}`}</div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                      <span className="truncate">{c.email}</span>
                      {(c.unpaid_reg?.location || c.location) && (
                        <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{c.unpaid_reg?.location || c.location}</span>
                      )}
                      <span>Signed up {new Date(c.unpaid_reg!.created_at).toLocaleDateString()}</span>
                      {c.unpaid_reg && !c.unpaid_reg.is_returning_member && (
                        <Badge variant="secondary" className="text-[10px]">First time</Badge>
                      )}

                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {PRESET_AMOUNTS.map(amt => (
                      <Button
                        key={amt}
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => markPaid(c, amt)}
                      >
                        ${amt}
                      </Button>
                    ))}
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => markPaidPrompt(c)}>
                      Other…
                    </Button>
                    <Button size="sm" className="h-8 text-xs" onClick={() => markPaid(c, null)}>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Paid (no amount)
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// ---- helpers ----

function blank(key: string): UnifiedContact {
  return {
    key,
    member_id: null,
    first_name: "",
    last_name: "",
    email: "",
    location: "",
    primary_type: "prospect",
    types: [],
    status: "",
    tags: [],
    sources: [],
    last_activity: "",
    people: [],
    detail_path: undefined,
    unpaid_reg: null,
    paid_reg: null,
    unpaid_reg_count: 0,
    paid_reg_count: 0,
  };
}
function uniq<T>(arr: T[]): T[] { return [...new Set(arr)]; }
// Several people can share one email (couples). Track every distinct name seen.
function addPerson(c: UnifiedContact, first?: string | null, last?: string | null) {
  // Collapse extra whitespace and normalize accents so "Claude  Aimée" and
  // "Claude Aimée" are treated as the same person.
  const norm = (s: string) => s.normalize("NFC").replace(/\s+/g, " ").trim();
  const name = norm(`${first || ""} ${last || ""}`);
  if (!name) return;
  const exists = c.people.some(p => norm(p).toLowerCase() === name.toLowerCase());
  if (!exists) c.people.push(name);
}
function laterOf(a: string, b: string | null | undefined): string {
  if (!b) return a;
  if (!a) return b;
  return a > b ? a : b;
}

const StatCard = ({ label, value, onClick, active }: { label: string; value: number; onClick: () => void; active: boolean }) => (
  <button
    onClick={onClick}
    className={`rounded-xl border p-3 text-left transition-colors ${active ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/50"}`}
  >
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="text-2xl font-bold text-foreground mt-1">{value}</div>
  </button>
);

const SortHeader = ({ label, k, sortKey, sortDir, onClick, className = "" }: { label: string; k: SortKey; sortKey: SortKey; sortDir: SortDir; onClick: (k: SortKey) => void; className?: string }) => (
  <th className={`p-2 text-left font-medium ${className}`}>
    <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => onClick(k)}>
      {label}
      <ArrowUpDown className={`w-3 h-3 ${sortKey === k ? "text-foreground" : "opacity-40"}`} />
      {sortKey === k && <span className="text-[10px]">{sortDir === "asc" ? "↑" : "↓"}</span>}
    </button>
  </th>
);

export default CRM;
