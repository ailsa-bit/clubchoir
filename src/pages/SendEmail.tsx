import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Send, Users, Filter, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";

interface MemberWithEmail {
  firstName: string;
  lastName: string;
  email: string;
  location: string;
  status: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') inQuotes = !inQuotes;
    else if (char === "," && !inQuotes) { result.push(current); current = ""; }
    else current += char;
  }
  result.push(current);
  return result;
}

const SendEmail = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [members, setMembers] = useState<MemberWithEmail[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [recipientListOpen, setRecipientListOpen] = useState(false);

  useEffect(() => {
    fetch("/data/members.csv")
      .then((res) => res.text())
      .then((text) => {
        const lines = text.trim().split("\n");
        const parsed: MemberWithEmail[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          if (cols.length < 5) continue;
          const email = cols[2].trim();
          if (!email || !email.includes("@")) continue;
          parsed.push({
            firstName: cols[0].trim(),
            lastName: cols[1].trim(),
            email,
            location: cols[3].trim(),
            status: cols[4].trim(),
          });
        }
        setMembers(parsed);
        setLoadingMembers(false);
      });
  }, []);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchesStatus = statusFilter === "ALL" || m.status === statusFilter;
      const matchesLocation = locationFilter === "ALL" || m.location === locationFilter;
      return matchesStatus && matchesLocation;
    });
  }, [members, statusFilter, locationFilter]);

  // Auto-select all filtered members
  useEffect(() => {
    setSelectedEmails(new Set(filtered.map((m) => m.email)));
  }, [filtered]);

  const locations = useMemo(
    () => [...new Set(members.map((m) => m.location))].sort(),
    [members]
  );

  const toggleEmail = (email: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const toggleAll = () => {
    const allFilteredEmails = filtered.map((m) => m.email);
    const allSelected = allFilteredEmails.every((e) => selectedEmails.has(e));
    if (allSelected) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(allFilteredEmails));
    }
  };

  const uniqueSelected = [...new Set(selectedEmails)];

  const handleSend = async () => {
    if (!uniqueSelected.length) {
      toast({ title: "No recipients", description: "Select at least one member.", variant: "destructive" });
      return;
    }
    if (!subject.trim()) {
      toast({ title: "Missing subject", description: "Please enter a subject line.", variant: "destructive" });
      return;
    }
    if (!body.trim()) {
      toast({ title: "Missing message", description: "Please write a message.", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-member-email", {
        body: {
          recipients: uniqueSelected,
          subject: subject.trim(),
          body: body.trim().replace(/\n/g, "<br/>"),
        },
      });
      if (error) throw error;

      const successCount = data?.success?.length || 0;
      const failCount = data?.failed?.length || 0;

      toast({
        title: `Emails sent!`,
        description: `${successCount} delivered${failCount ? `, ${failCount} failed` : ""}`,
      });

      if (!failCount) {
        setSubject("");
        setBody("");
      }
    } catch (err: any) {
      toast({
        title: "Failed to send",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (adminLoading || loadingMembers) {
    return <div className="py-20 text-center text-muted-foreground">Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="py-20 text-center">
        <h1 className="font-heading font-bold text-2xl text-foreground mb-2">Admin Only</h1>
        <p className="text-muted-foreground mb-4">You need admin access to send emails.</p>
        <Button variant="outline" onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="py-10 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <Mail className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="font-heading font-bold text-3xl text-foreground mb-2">
            Send Email
          </h1>
          <p className="text-muted-foreground">
            Compose and send emails to your members
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          {/* Filters */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Recipients</label>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="PROSPECT">Prospect</SelectItem>
                  <SelectItem value="TRIAL">Trial</SelectItem>
                </SelectContent>
              </Select>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All locations</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Collapsible open={recipientListOpen} onOpenChange={setRecipientListOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {uniqueSelected.length} recipient{uniqueSelected.length !== 1 ? "s" : ""} selected
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${recipientListOpen ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border border-border rounded-xl mt-2 max-h-60 overflow-y-auto">
                  <div className="p-2 border-b border-border">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox
                        checked={filtered.length > 0 && filtered.every((m) => selectedEmails.has(m.email))}
                        onCheckedChange={toggleAll}
                      />
                      <span className="font-medium text-foreground">Select all</span>
                    </label>
                  </div>
                  {filtered.map((m) => (
                    <label
                      key={`${m.email}-${m.firstName}`}
                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 cursor-pointer text-sm"
                    >
                      <Checkbox
                        checked={selectedEmails.has(m.email)}
                        onCheckedChange={() => toggleEmail(m.email)}
                      />
                      <span className="text-foreground">{m.firstName} {m.lastName}</span>
                      <span className="text-muted-foreground text-xs ml-auto">{m.location}</span>
                    </label>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Subject</label>
            <Input
              placeholder="e.g. This Week at Club Choir"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Message</label>
            <Textarea
              placeholder="Write your message here…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground">
              {body.length}/5000 characters
            </p>
          </div>

          {/* Send */}
          <Button
            onClick={handleSend}
            disabled={sending || !uniqueSelected.length}
            className="w-full rounded-full bg-gradient-warm text-primary-foreground"
          >
            {sending ? "Sending…" : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send to {uniqueSelected.length} member{uniqueSelected.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SendEmail;
