import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Pencil, X, Check } from "lucide-react";

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

interface MemberEditFormProps {
  member: MemberRow;
  onSaved: () => void;
}

const STATUS_OPTIONS = ["ACTIVE", "INACTIVE", "PROSPECT", "TRIAL"];
const PAYMENT_OPTIONS = ["", "Paid", "Unpaid", "Partial", "Comp", "N/A"];

export function MemberEditForm({ member, onSaved }: MemberEditFormProps) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: member.first_name,
    last_name: member.last_name,
    email: member.email || "",
    location: member.location,
    status: member.status,
    joined: member.joined || "",
    payment_status: member.payment_status,
    notes: member.notes,
  });

  const startEdit = () => {
    setForm({
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email || "",
      location: member.location,
      status: member.status,
      joined: member.joined || "",
      payment_status: member.payment_status,
      notes: member.notes,
    });
    setEditing(true);
  };

  const cancel = () => setEditing(false);

  const save = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast({ title: "First and last name are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const isPaid = form.payment_status.toLowerCase() === "paid";
    const { error } = await supabase
      .from("members")
      .update({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim() || null,
        location: form.location.trim(),
        status: isPaid ? "ACTIVE" : form.status,
        joined: form.joined || null,
        payment_status: form.payment_status,
        notes: form.notes.trim(),
      })
      .eq("id", member.id);

    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Member updated" });
      setEditing(false);
      onSaved();
    }
    setSaving(false);
  };

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  if (!editing) {
    return (
      <Button variant="outline" size="sm" onClick={startEdit}>
        <Pencil className="w-4 h-4 mr-1" /> Edit Info
      </Button>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-bold text-lg text-foreground">Edit Member</h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={cancel} disabled={saving}>
            <X className="w-4 h-4 mr-1" /> Cancel
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name">First Name</Label>
          <Input id="first_name" value={form.first_name} onChange={(e) => update("first_name", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="last_name">Last Name</Label>
          <Input id="last_name" value={form.last_name} onChange={(e) => update("last_name", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input id="location" value={form.location} onChange={(e) => update("location", e.target.value)} />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => update("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Payment Status</Label>
          <Select value={form.payment_status || "none"} onValueChange={(v) => update("payment_status", v === "none" ? "" : v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {PAYMENT_OPTIONS.filter(Boolean).map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="joined">Joined Date</Label>
          <Input id="joined" type="date" value={form.joined} onChange={(e) => update("joined", e.target.value)} />
        </div>
      </div>

      <div className="mt-4">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} className="min-h-[60px]" />
      </div>
    </div>
  );
}
