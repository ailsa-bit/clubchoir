import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Plus, Trash2, Loader2, Sparkles, ArrowLeft, Mail } from "lucide-react";
import { Helmet } from "react-helmet-async";

const LOCATIONS = ["Montreal", "Hudson", "Saint-Hubert", "Pointe-Claire", "Arundel"] as const;

interface ProspectRow {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  locations: string[];
  notes: string;
  status: string;
  created_at: string;
}

const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  locations: [] as string[],
  notes: "",
  send_email: true,
};

const ManageProspects = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [prospects, setProspects] = useState<ProspectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ProspectRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProspects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("prospects")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error loading prospects", description: error.message, variant: "destructive" });
    }
    setProspects((data as ProspectRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/community");
      return;
    }
    if (isAdmin) fetchProspects();
  }, [isAdmin, adminLoading]);

  const filtered = useMemo(() => {
    if (!search) return prospects;
    const q = search.toLowerCase();
    return prospects.filter(
      (p) =>
        `${p.first_name} ${p.last_name || ""} ${p.email}`.toLowerCase().includes(q) ||
        (p.locations || []).join(" ").toLowerCase().includes(q),
    );
  }, [prospects, search]);

  const openAdd = () => {
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const toggleLocation = (loc: string) => {
    setForm((f) => ({
      ...f,
      locations: f.locations.includes(loc)
        ? f.locations.filter((l) => l !== loc)
        : [...f.locations, loc],
    }));
  };

  const handleSave = async () => {
    const first = form.first_name.trim();
    const email = form.email.trim().toLowerCase();
    if (!first) {
      toast({ title: "First name is required", variant: "destructive" });
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "A valid email is required", variant: "destructive" });
      return;
    }
    if (form.locations.length === 0) {
      toast({ title: "Pick at least one location", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = {
      first_name: first,
      last_name: form.last_name.trim() || null,
      email,
      locations: form.locations,
      notes: form.notes.trim(),
    };

    const { error } = await supabase.from("prospects").insert(payload);

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "Already on the list",
          description: "This email is already a prospect.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Error adding prospect", description: error.message, variant: "destructive" });
      }
      setSaving(false);
      return;
    }

    if (form.send_email) {
      supabase.functions
        .invoke("notify-prospect-signup", { body: payload })
        .catch((err) => console.error("notify-prospect-signup failed:", err));
    }

    toast({
      title: "Prospect added",
      description: form.send_email
        ? "Welcome email is being sent."
        : "No email was sent.",
    });
    setDialogOpen(false);
    setSaving(false);
    fetchProspects();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("prospects").delete().eq("id", deleteTarget.id);
    if (error) {
      toast({ title: "Error deleting", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Prospect removed" });
      setProspects((p) => p.filter((x) => x.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
    setDeleting(false);
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
      <Helmet><meta name="robots" content="noindex,nofollow" /></Helmet>
      <div className="container mx-auto max-w-5xl">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/manage-members")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Manage Members
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading font-bold text-2xl text-foreground flex items-center gap-2">
              <Sparkles className="w-6 h-6" /> Prospects
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {prospects.length} people interested in upcoming sessions
            </p>
          </div>
          <Button onClick={openAdd} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add Prospect
          </Button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="p-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Email</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Locations</th>
                  <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Notes</th>
                  <th className="p-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Added</th>
                  <th className="p-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium text-foreground whitespace-nowrap">
                      {p.first_name} {p.last_name || ""}
                    </td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell">
                      <a href={`mailto:${p.email}`} className="hover:underline inline-flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {p.email}
                      </a>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {(p.locations || []).map((l) => (
                          <Badge key={l} variant="outline" className="text-[10px]">
                            {l}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground hidden lg:table-cell max-w-xs truncate">
                      {p.notes || "—"}
                    </td>
                    <td className="p-3 text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(p)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No prospects yet. Use "Add Prospect" to add someone interested in an upcoming session.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Prospect</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First Name *</Label>
                <Input
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Interested in (pick at least one) *</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {LOCATIONS.map((loc) => {
                  const active = form.locations.includes(loc);
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => toggleLocation(loc)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>Notes (internal)</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="How they heard about us, what they asked, etc."
                rows={3}
              />
            </div>
            <label className="flex items-start gap-2 p-3 rounded-lg border border-border bg-muted/30 cursor-pointer">
              <input
                type="checkbox"
                checked={form.send_email}
                onChange={(e) => setForm({ ...form, send_email: e.target.checked })}
                className="mt-0.5 rounded border-border"
              />
              <div className="text-sm">
                <div className="font-medium text-foreground">Send the welcome email</div>
                <div className="text-muted-foreground text-xs">
                  Same email a self-signup gets. Uncheck if you'll reach out personally.
                </div>
              </div>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
              Add Prospect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this prospect?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.first_name} {deleteTarget?.last_name} ({deleteTarget?.email}) will be deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageProspects;
