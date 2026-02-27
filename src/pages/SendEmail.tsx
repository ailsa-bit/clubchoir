import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Send, Users, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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

interface MemberRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  location: string;
  status: string;
}

const SendEmail = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [recipientListOpen, setRecipientListOpen] = useState(false);
  const [manualEmail, setManualEmail] = useState("");

  useEffect(() => {
    const fetchMembers = async () => {
      setLoadingMembers(true);
      setFetchError(null);
      try {
        const { data, error } = await supabase
          .from("members")
          .select("id, first_name, last_name, email, location, status")
          .order("last_name");

        if (error) throw error;
        setMembers((data as MemberRow[]) || []);
      } catch (err: any) {
        setFetchError(err.message || "Failed to load members.");
        toast({ title: "Error loading members", description: err.message, variant: "destructive" });
      } finally {
        setLoadingMembers(false);
      }
    };
    fetchMembers();
  }, []);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (!m.email || !m.email.includes("@")) return false;
      const statusMatch = includeInactive
        ? true
        : (m.status || "").toUpperCase() === "ACTIVE";
      const locationMatch = locationFilter === "ALL" || m.location === locationFilter;
      return statusMatch && locationMatch;
    });
  }, [members, includeInactive, locationFilter]);

  useEffect(() => {
    setSelectedEmails(new Set(filtered.map((m) => m.email!)));
  }, [filtered]);

  const locations = useMemo(
    () => [...new Set(members.map((m) => m.location).filter(Boolean))].sort(),
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
    const allEmails = filtered.map((m) => m.email!);
    const allSelected = allEmails.every((e) => selectedEmails.has(e));
    setSelectedEmails(allSelected ? new Set() : new Set(allEmails));
  };

  const uniqueSelected = [...new Set(selectedEmails)];

  const addManualEmail = () => {
    const email = manualEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    setSelectedEmails((prev) => new Set([...prev, email]));
    setManualEmail("");
    toast({ title: "Added", description: email });
  };

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
        title: "Emails sent!",
        description: `${successCount} delivered${failCount ? `, ${failCount} failed` : ""}`,
      });

      if (!failCount) {
        setSubject("");
        setBody("");
      }
    } catch (err: any) {
      toast({ title: "Failed to send", description: err.message || "Please try again.", variant: "destructive" });
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

  if (fetchError) {
    return (
      <div className="py-20 text-center">
        <h1 className="font-heading font-bold text-2xl text-destructive mb-2">Failed to load members</h1>
        <p className="text-muted-foreground mb-4">{fetchError}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="py-10 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <Mail className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="font-heading font-bold text-3xl text-foreground mb-2">Send Email</h1>
          <p className="text-muted-foreground">Compose and send emails to your members</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          {/* Filters */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Recipients</label>

            <div className="flex items-center justify-between">
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="flex-1 mr-4">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All locations</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <label className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap cursor-pointer">
                <Switch checked={includeInactive} onCheckedChange={setIncludeInactive} />
                Include inactive
              </label>
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
                        checked={filtered.length > 0 && filtered.every((m) => selectedEmails.has(m.email!))}
                        onCheckedChange={toggleAll}
                      />
                      <span className="font-medium text-foreground">Select all</span>
                    </label>
                  </div>
                  {filtered.map((m) => (
                    <label
                      key={m.id}
                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 cursor-pointer text-sm"
                    >
                      <Checkbox
                        checked={selectedEmails.has(m.email!)}
                        onCheckedChange={() => toggleEmail(m.email!)}
                      />
                      <span className="text-foreground">{m.first_name} {m.last_name}</span>
                      <span className="text-muted-foreground text-xs ml-auto">{m.location}</span>
                    </label>
                  ))}
                  {filtered.length === 0 && (
                    <p className="p-3 text-sm text-muted-foreground text-center">No members match filters.</p>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="relative mt-2">
              <div className="flex items-center gap-2">
                <Input
                  type="email"
                  placeholder="Type to search members or add email…"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addManualEmail(); } }}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={addManualEmail}>Add</Button>
              </div>
              {manualEmail.trim().length >= 2 && (() => {
                const q = manualEmail.trim().toLowerCase();
                const suggestions = members.filter(
                  (m) => m.email && (
                    m.email.toLowerCase().includes(q) ||
                    `${m.first_name} ${m.last_name}`.toLowerCase().includes(q)
                  )
                ).slice(0, 8);
                if (!suggestions.length) return null;
                return (
                  <div className="absolute z-10 top-full left-0 right-12 mt-1 border border-border bg-popover rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {suggestions.map((m) => {
                      const alreadySelected = selectedEmails.has(m.email!);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          className={`w-full text-left px-3 py-2 hover:bg-muted/60 flex items-center justify-between text-sm ${alreadySelected ? "opacity-50" : ""}`}
                          onClick={() => {
                            if (alreadySelected) {
                              setSelectedEmails((prev) => { const next = new Set(prev); next.delete(m.email!); return next; });
                              toast({ title: "Removed", description: `${m.first_name} ${m.last_name}` });
                            } else {
                              setSelectedEmails((prev) => new Set([...prev, m.email!]));
                              toast({ title: "Added", description: `${m.first_name} ${m.last_name} (${m.email})` });
                            }
                            setManualEmail("");
                          }}
                        >
                          <span className="text-foreground">{m.first_name} {m.last_name} {alreadySelected ? "✓" : ""}</span>
                          <span className="text-muted-foreground text-xs">{m.email}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
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
            <p className="text-xs text-muted-foreground">{body.length}/5000 characters</p>
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
