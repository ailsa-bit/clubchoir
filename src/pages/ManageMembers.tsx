import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Users,
  AlertTriangle,
  Mail,
  ShieldCheck,
  Loader2,
  CheckSquare,
  UserCheck,
} from "lucide-react";

interface MemberRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  location: string;
  status: string;
  joined: string | null;
  last_session: string | null;
  payment_status: string;
  notes: string;
}

const STATUSES = ["ACTIVE", "INACTIVE", "PROSPECT", "TRIAL"] as const;
const LOCATIONS = ["Montreal", "Arundel", "Saint-Hubert", "Pointe-Claire"] as const;

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  INACTIVE: "bg-muted text-muted-foreground border-border",
  PROSPECT: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  TRIAL: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
};

const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  location: "",
  status: "ACTIVE" as string,
  payment_status: "",
  notes: "",
};

interface PendingSignup {
  id: string;
  user_id: string;
  display_name: string | null;
  location: string | null;
  status: string;
  created_at: string;
}

interface SignedUpUser {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at: string | null;
  display_name: string | null;
  location: string | null;
  profile_status: string;
}

const ManageMembers = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingSignups, setPendingSignups] = useState<PendingSignup[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [signedUpUsers, setSignedUpUsers] = useState<SignedUpUser[]>([]);
  const [signupsLoading, setSignupsLoading] = useState(true);
  const [signupSearch, setSignupSearch] = useState("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Bulk action state
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<string>("INACTIVE");
  const [bulkSaving, setBulkSaving] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<MemberRow | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [confirmingUserId, setConfirmingUserId] = useState<string | null>(null);
  const [memberSessionMap, setMemberSessionMap] = useState<Record<string, string[]>>({});

  const fetchMembers = async () => {
    const { data } = await supabase
      .from("members")
      .select("*")
      .order("last_name", { ascending: true });
    setMembers((data as MemberRow[]) || []);
    setLoading(false);
  };

  const fetchMemberSessions = async () => {
    const { data } = await supabase
      .from("member_sessions")
      .select("member_id, session_name");
    const map: Record<string, string[]> = {};
    (data || []).forEach((row: { member_id: string; session_name: string }) => {
      if (!map[row.member_id]) map[row.member_id] = [];
      map[row.member_id].push(row.session_name);
    });
    setMemberSessionMap(map);
  };

  const fetchPending = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("status", "inactive")
      .order("created_at", { ascending: false });
    setPendingSignups((data as PendingSignup[]) || []);
    setPendingLoading(false);
  };

  const fetchSignups = async () => {
    setSignupsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("list-signups");
      if (!error && data) {
        setSignedUpUsers(data);
      }
    } catch {}
    setSignupsLoading(false);
  };

  const handleApprove = async (signup: PendingSignup) => {
    // Update profile status to active
    const { error } = await supabase
      .from("profiles")
      .update({ status: "active" })
      .eq("id", signup.id);
    if (error) {
      toast({ title: "Error approving", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Member approved!", description: `${signup.display_name || "User"} now has full access.` });
    fetchPending();
  };

  const handleConfirmEmail = async (userId: string, action: "confirm" | "resend") => {
    setConfirmingUserId(userId);
    try {
      const { error } = await supabase.functions.invoke("confirm-user-email", {
        body: { user_id: userId, action },
      });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: action === "confirm" ? "Email confirmed!" : "Confirmation email resent!" });
        fetchSignups();
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    }
    setConfirmingUserId(null);
  };

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/community");
      return;
    }
    if (isAdmin) {
      fetchMembers();
      fetchPending();
      fetchSignups();
      fetchMemberSessions();
    }
  }, [isAdmin, adminLoading]);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        !search ||
        `${m.first_name} ${m.last_name} ${m.email || ""}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchStatus = statusFilter === "ALL" || m.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [members, search, statusFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: members.length };
    members.forEach((m) => (c[m.status] = (c[m.status] || 0) + 1));
    return c;
  }, [members]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (m: MemberRow) => {
    setEditingId(m.id);
    setForm({
      first_name: m.first_name,
      last_name: m.last_name,
      email: m.email || "",
      location: m.location,
      status: m.status,
      payment_status: m.payment_status,
      notes: m.notes,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast({ title: "First and last name are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim() || null,
      location: form.location,
      status: form.status,
      payment_status: form.payment_status.trim(),
      notes: form.notes.trim(),
    };

    if (editingId) {
      const { error } = await supabase.from("members").update(payload).eq("id", editingId);
      if (error) {
        toast({ title: "Error updating member", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Member updated" });
      }
    } else {
      const { error } = await supabase.from("members").insert(payload);
      if (error) {
        toast({ title: "Error adding member", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Member added" });
      }
    }
    setSaving(false);
    setDialogOpen(false);
    fetchMembers();
  };

  const openDeleteConfirm = (m: MemberRow) => {
    setDeleteTarget(m);
    setDeleteConfirmText("");
  };

  const handleDeactivate = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("members").update({ status: "INACTIVE" }).eq("id", deleteTarget.id);
    if (error) {
      toast({ title: "Error deactivating member", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Member deactivated", description: `${deleteTarget.first_name} ${deleteTarget.last_name} set to INACTIVE.` });
    }
    setDeleting(false);
    setDeleteTarget(null);
    fetchMembers();
  };

  const handleHardDelete = async () => {
    if (!deleteTarget || deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    const { error } = await supabase.from("members").delete().eq("id", deleteTarget.id);
    if (error) {
      toast({ title: "Error deleting member", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Member permanently removed" });
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.id);
        return next;
      });
    }
    setDeleting(false);
    setDeleteTarget(null);
    fetchMembers();
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((m) => m.id)));
    }
  };

  const handleBulkStatus = async () => {
    if (selected.size === 0) return;
    setBulkSaving(true);
    const { error } = await supabase
      .from("members")
      .update({ status: bulkStatus })
      .in("id", Array.from(selected));
    if (error) {
      toast({ title: "Error updating members", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${selected.size} member(s) set to ${bulkStatus}` });
      setSelected(new Set());
    }
    setBulkSaving(false);
    setBulkDialogOpen(false);
    fetchMembers();
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
    <div className="py-10 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading font-bold text-2xl text-foreground flex items-center gap-2">
              <Users className="w-6 h-6" /> Manage Members
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{members.length} total members</p>
          </div>
          <Button onClick={openAdd} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add Member
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {STATUSES.map((s) => (
            <div key={s} className="rounded-2xl border border-border bg-card p-3 text-center">
              <p className="text-xl font-bold text-foreground">{counts[s] || 0}</p>
              <p className="text-xs text-muted-foreground capitalize">{s.toLowerCase()}</p>
            </div>
          ))}
        </div>

        {/* Pending Signups */}
        {pendingSignups.length > 0 && (
          <div className="mb-8 rounded-2xl border-2 border-amber-500/30 bg-amber-500/5 p-5">
            <h2 className="font-heading font-bold text-lg text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Pending Signups ({pendingSignups.length})
            </h2>
            <div className="space-y-3">
              {pendingSignups.map((signup) => (
                <div key={signup.id} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{signup.display_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{signup.location || "No location"} · Signed up {new Date(signup.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => handleApprove(signup)}>
                      <CheckSquare className="w-4 h-4 mr-1" /> Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signed Up Users */}
        <div className="mb-8 rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <h2 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              Signed Up Users ({signedUpUsers.length})
            </h2>
            {!signupsLoading && signedUpUsers.length > 0 && (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={signupSearch}
                  onChange={(e) => setSignupSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            )}
          </div>
          {signupsLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" />Loading...
            </div>
          ) : signedUpUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No signed up users yet.</p>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="p-3 text-left font-medium text-muted-foreground">Email</th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Name</th>
                      <th className="p-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Display Name</th>
                      <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Location</th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                      <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Signed Up</th>
                      <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Verified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signedUpUsers.filter((u) => {
                      if (!signupSearch) return true;
                      const q = signupSearch.toLowerCase();
                      const matchedMember = members.find((m) => m.email && m.email.toLowerCase() === u.email.toLowerCase());
                      const fullName = matchedMember ? `${matchedMember.first_name} ${matchedMember.last_name}` : "";
                      return u.email.toLowerCase().includes(q) || (u.display_name || "").toLowerCase().includes(q) || fullName.toLowerCase().includes(q) || (u.location || "").toLowerCase().includes(q);
                    }).map((u) => {
                      const matchedMember = members.find((m) => m.email && m.email.toLowerCase() === u.email.toLowerCase());
                      return (
                      <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-3 text-foreground">{u.email}</td>
                        <td className="p-3 text-foreground font-medium">{matchedMember ? `${matchedMember.first_name} ${matchedMember.last_name}` : "—"}</td>
                        <td className="p-3 text-muted-foreground hidden sm:table-cell">{u.display_name || "—"}</td>
                        <td className="p-3 text-muted-foreground hidden md:table-cell">{u.location || "—"}</td>
                        <td className="p-3">
                          <Badge variant="outline" className={`text-[10px] ${u.profile_status === "active" ? "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30" : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"}`}>
                            {u.profile_status}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground hidden lg:table-cell">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="p-3 hidden lg:table-cell">
                          {u.email_confirmed_at ? (
                            <Badge variant="outline" className="text-[10px] bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30">Yes</Badge>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[10px] px-2"
                                disabled={confirmingUserId === u.id}
                                onClick={() => handleConfirmEmail(u.id, "confirm")}
                              >
                                <ShieldCheck className="w-3 h-3 mr-1" />
                                {confirmingUserId === u.id ? "..." : "Confirm"}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-[10px] px-2"
                                disabled={confirmingUserId === u.id}
                                onClick={() => handleConfirmEmail(u.id, "resend")}
                              >
                                <Mail className="w-3 h-3 mr-1" />
                                Resend
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl border border-primary/30 bg-primary/5">
            <span className="text-sm font-medium text-foreground">{selected.size} selected</span>
            <Button size="sm" variant="outline" onClick={() => setBulkDialogOpen(true)}>
              Change Status
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </div>
        )}

        {/* Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="p-3 text-left">
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && selected.size === filtered.length}
                      onChange={toggleAll}
                      className="rounded border-border"
                    />
                  </th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Email</th>
                  <th className="p-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Location</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Sessions</th>
                  <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Joined</th>
                  <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Payment</th>
                  <th className="p-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selected.has(m.id)}
                        onChange={() => toggleSelect(m.id)}
                        className="rounded border-border"
                      />
                    </td>
                    <td className="p-3 font-medium text-foreground whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/manage-members/${m.id}`)}
                        className="hover:underline text-primary font-medium text-left"
                      >
                        {m.first_name} {m.last_name}
                      </button>
                    </td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell">{m.email || "—"}</td>
                    <td className="p-3 text-muted-foreground hidden sm:table-cell">{m.location || "—"}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] ${statusColors[m.status] || ""}`}>
                          {m.status}
                        </Badge>
                        {(memberSessionMap[m.id] || []).includes("Fall 2026") && (
                          <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                            F26 ✨
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground hidden lg:table-cell">
                      {(memberSessionMap[m.id] || []).filter(s => s !== "Fall 2026").length} / 3
                    </td>
                    <td className="p-3 text-muted-foreground hidden lg:table-cell">{m.joined || "—"}</td>
                    <td className="p-3 text-muted-foreground hidden lg:table-cell">{m.payment_status || "—"}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(m)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => openDeleteConfirm(m)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      No members found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Member" : "Add Member"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First Name *</Label>
                <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Location</Label>
                <Select value={form.location} onValueChange={(v) => setForm({ ...form, location: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Payment Status</Label>
              <Input value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value })} placeholder="e.g. Paid, Pending" />
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {editingId ? "Save Changes" : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk status dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Change Status for {selected.size} Member(s)
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>New Status</Label>
            <Select value={bulkStatus} onValueChange={setBulkStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkStatus} disabled={bulkSaving}>
              {bulkSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Apply to {selected.size} Member(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteConfirmText(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Remove Member
            </DialogTitle>
          </DialogHeader>
          {deleteTarget && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-foreground">
                You are about to remove <span className="font-semibold">{deleteTarget.first_name} {deleteTarget.last_name}</span>
                {deleteTarget.email ? <> ({deleteTarget.email})</> : null}.
              </p>

              <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-3">
                <p className="text-sm font-medium text-foreground">Recommended: Deactivate instead</p>
                <p className="text-xs text-muted-foreground">Sets member status to INACTIVE. Their data is preserved and can be reactivated later.</p>
                <Button onClick={handleDeactivate} disabled={deleting} variant="outline" className="w-full">
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Deactivate Member
                </Button>
              </div>

              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                <p className="text-sm font-medium text-destructive">Permanent Delete</p>
                <p className="text-xs text-muted-foreground">This cannot be undone. Type <span className="font-mono font-bold">DELETE</span> to confirm.</p>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder='Type "DELETE" to confirm'
                  className="font-mono"
                />
                <Button
                  onClick={handleHardDelete}
                  disabled={deleting || deleteConfirmText !== "DELETE"}
                  variant="destructive"
                  className="w-full"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Permanently Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageMembers;
