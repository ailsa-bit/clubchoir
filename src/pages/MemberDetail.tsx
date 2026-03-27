import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Loader2,
  Plus,
  StickyNote,
  CalendarDays,
  MapPin,
  Mail,
  CreditCard,
  Music,
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

interface MemberNote {
  id: string;
  note: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  INACTIVE: "bg-muted text-muted-foreground border-border",
  PROSPECT: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  TRIAL: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
};

const MemberDetail = () => {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();

  const [member, setMember] = useState<MemberRow | null>(null);
  const [notes, setNotes] = useState<MemberNote[]>([]);
  const [sessionCount, setSessionCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/community");
    }
  }, [isAdmin, adminLoading]);

  useEffect(() => {
    if (!memberId || !isAdmin) return;
    fetchAll();
  }, [memberId, isAdmin]);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchMember(), fetchNotes(), fetchSessionCount()]);
    setLoading(false);
  };

  const fetchMember = async () => {
    const { data } = await supabase
      .from("members")
      .select("*")
      .eq("id", memberId!)
      .single();
    setMember(data as MemberRow | null);
  };

  const fetchNotes = async () => {
    const { data } = await supabase
      .from("member_notes")
      .select("id, note, created_at")
      .eq("member_id", memberId!)
      .order("created_at", { ascending: false });
    setNotes((data as MemberNote[]) || []);
  };

  const fetchSessionCount = async () => {
    const { data: memberData } = await supabase
      .from("members")
      .select("location, joined")
      .eq("id", memberId!)
      .single();
    if (!memberData) return;

    const { count } = await supabase
      .from("location_sessions")
      .select("*", { count: "exact", head: true })
      .eq("location", memberData.location)
      .lte("session_date", new Date().toISOString().split("T")[0])
      .not("activity", "in", '("No Practice","CANCELLED - WEATHER")');

    setSessionCount(count ?? 0);
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !memberId) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("member_notes").insert({
      member_id: memberId,
      note: newNote.trim(),
      created_by: user!.id,
    });
    if (error) {
      toast({ title: "Error saving note", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Note added" });
      setNewNote("");
      fetchNotes();
    }
    setSaving(false);
  };

  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="py-10 px-4 text-center">
        <p className="text-muted-foreground">Member not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/manage-members")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Members
        </Button>
      </div>
    );
  }

  return (
    <div className="py-10 px-4">
      <div className="container mx-auto max-w-3xl">
        <Button variant="ghost" size="sm" className="mb-6" onClick={() => navigate("/manage-members")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Members
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading font-bold text-2xl text-foreground">
              {member.first_name} {member.last_name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={`text-xs ${statusColors[member.status] || ""}`}>
                {member.status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="rounded-2xl border border-border bg-card p-4 flex flex-col items-center text-center">
            <MapPin className="w-4 h-4 text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">Location</p>
            <p className="text-sm font-semibold text-foreground">{member.location || "—"}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 flex flex-col items-center text-center">
            <CalendarDays className="w-4 h-4 text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">Joined</p>
            <p className="text-sm font-semibold text-foreground">{member.joined || "—"}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 flex flex-col items-center text-center">
            <Music className="w-4 h-4 text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">Sessions</p>
            <p className="text-sm font-semibold text-foreground">{sessionCount ?? "—"}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 flex flex-col items-center text-center">
            <CreditCard className="w-4 h-4 text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">Payment</p>
            <p className="text-sm font-semibold text-foreground">{member.payment_status || "—"}</p>
          </div>
        </div>

        {member.email && (
          <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
            <Mail className="w-4 h-4" />
            <span>{member.email}</span>
          </div>
        )}

        {member.notes && (
          <div className="mb-8 rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1 font-medium">Member Notes</p>
            <p className="text-sm text-foreground">{member.notes}</p>
          </div>
        )}

        <div className="mb-6">
          <h2 className="font-heading font-bold text-lg text-foreground flex items-center gap-2 mb-3">
            <StickyNote className="w-5 h-5" /> Notes Timeline
          </h2>
          <div className="flex gap-2">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note..."
              className="flex-1 min-h-[60px]"
            />
            <Button onClick={handleAddNote} disabled={saving || !newNote.trim()} className="self-end">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
              Add
            </Button>
          </div>
        </div>

        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No notes yet. Add your first note above.</p>
        ) : (
          <div className="relative pl-6 border-l-2 border-border space-y-6">
            {notes.map((n) => (
              <div key={n.id} className="relative">
                <div className="absolute -left-[25px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    {new Date(n.created_at).toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{n.note}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberDetail;
