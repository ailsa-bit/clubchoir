import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Send, Eye, Mail, Users, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

type Segment = "paid" | "registered" | "everyone" | "herd-reminder" | "herd-attendees" | "mtl-openhouse-tonight";

const SEGMENTS: { key: Segment; title: string; description: string; color: string }[] = [
  {
    key: "paid",
    title: "Paid & Confirmed",
    description: "Thank-you note + open house reminder + bring-a-friend nudge for members already registered & paid for Fall 2026.",
    color: "bg-green-50 border-green-200",
  },
  {
    key: "registered",
    title: "Registered, Not Yet Paid",
    description: "Gentle payment reminder for anyone signed up for a session, try-out, or open house who hasn't paid yet.",
    color: "bg-yellow-50 border-yellow-200",
  },
  {
    key: "everyone",
    title: "Everyone Else",
    description: "Warm invitation to open houses and Fall 2026 registration for the rest of the community.",
    color: "bg-blue-50 border-blue-200",
  },
  {
    key: "herd-reminder",
    title: "Sing for the Herd — Reminder (EN/FR)",
    description: "Event reminder for Sunday, August 2 at A Horse Tale Rescue. Sent to all CRM contacts except anyone who already paid for a Sing for the Herd ticket (and no-email / archived contacts).",
    color: "bg-amber-50 border-amber-200",
  },
  {
    key: "herd-attendees",
    title: "Sing for the Herd — Day-of Confirmation (EN/FR)",
    description: "Rain-or-shine confirmation with today's schedule, address and chair reminder. Sent only to people who reserved or purchased Sing for the Herd tickets.",
    color: "bg-emerald-50 border-emerald-200",
  },
  {
    key: "mtl-openhouse-tonight",
    title: "Montreal Open House — Tonight (EN/FR)",
    description: "Reminder that the Montreal open house starts tonight at 7 PM at Kensington Presbyterian, 6225 Godfrey. Sent to all Montreal contacts — members, fall/try-a-session registrants, open house RSVPs and prospects.",
    color: "bg-pink-50 border-pink-200",
  },
];

const Campaigns = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [counts, setCounts] = useState<Record<Segment, number | null>>({ paid: null, registered: null, everyone: null, "herd-reminder": null, "herd-attendees": null, "mtl-openhouse-tonight": null });
  const [sentCounts, setSentCounts] = useState<Record<Segment, number>>({ paid: 0, registered: 0, everyone: 0, "herd-reminder": 0, "herd-attendees": 0, "mtl-openhouse-tonight": 0 });
  const [previewSegment, setPreviewSegment] = useState<Segment | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewSubject, setPreviewSubject] = useState<string>("");
  const [confirmSegment, setConfirmSegment] = useState<Segment | null>(null);
  const [sending, setSending] = useState<Segment | null>(null);
  const [busy, setBusy] = useState<Segment | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || "");
    })();
  }, []);

  const loadCounts = async () => {
    for (const s of SEGMENTS) {
      const { data } = await supabase.functions.invoke("send-campaign", {
        body: { segment: s.key, countOnly: true },
      });
      setCounts((c) => ({ ...c, [s.key]: data?.count ?? 0 }));
    }
    // Sent counts
    const { data: sent } = await supabase
      .from("campaign_sends")
      .select("segment, status")
      .eq("status", "sent");
    const grouped: any = { paid: 0, registered: 0, everyone: 0, "herd-reminder": 0, "herd-attendees": 0, "mtl-openhouse-tonight": 0 };
    for (const row of sent || []) grouped[row.segment] = (grouped[row.segment] || 0) + 1;
    setSentCounts(grouped);
  };

  useEffect(() => {
    if (isAdmin) loadCounts();
  }, [isAdmin]);

  const handlePreview = async (seg: Segment) => {
    setBusy(seg);
    try {
      const { data, error } = await supabase.functions.invoke("send-campaign", {
        body: { segment: seg, previewOnly: true },
      });
      if (error) throw error;
      setPreviewSubject(data.subject);
      setPreviewHtml(data.html);
      setPreviewSegment(seg);
    } catch (e: any) {
      toast({ title: "Preview failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const handleTest = async (seg: Segment) => {
    if (!userEmail) return;
    setBusy(seg);
    try {
      const { data, error } = await supabase.functions.invoke("send-campaign", {
        body: { segment: seg, testEmail: userEmail },
      });
      if (error) throw error;
      toast({ title: "Test sent!", description: `Check ${userEmail}` });
    } catch (e: any) {
      toast({ title: "Test failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const handleSend = async (seg: Segment) => {
    setSending(seg);
    setConfirmSegment(null);
    try {
      const { data, error } = await supabase.functions.invoke("send-campaign", {
        body: { segment: seg },
      });
      if (error) throw error;
      toast({
        title: "Campaign sent!",
        description: `${data.success?.length || 0} sent, ${data.failed?.length || 0} failed, ${data.skipped || 0} already-sent skipped.`,
      });
      loadCounts();
    } catch (e: any) {
      toast({ title: "Send failed", description: e.message, variant: "destructive" });
    } finally {
      setSending(null);
    }
  };

  if (adminLoading) return <div className="py-20 text-center text-muted-foreground">Loading…</div>;
  if (!isAdmin) {
    return (
      <div className="py-20 text-center">
        <h1 className="font-heading font-bold text-2xl mb-2">Admin only</h1>
        <Button variant="outline" onClick={() => navigate("/")}>Go home</Button>
      </div>
    );
  }

  return (
    <div className="py-10 px-4">
      <Helmet><meta name="robots" content="noindex,nofollow" /></Helmet>
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <Mail className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="font-heading font-bold text-3xl mb-2">Fall 2026 Email Campaigns</h1>
          <p className="text-muted-foreground">Three targeted emails with one-click open house RSVPs.</p>
        </div>

        <div className="space-y-4">
          {SEGMENTS.map((s) => {
            const count = counts[s.key];
            const sent = sentCounts[s.key];
            const remaining = count === null ? null : Math.max(0, count - sent);
            return (
              <div key={s.key} className={`rounded-2xl border p-6 ${s.color}`}>
                <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                  <div>
                    <h2 className="font-heading font-bold text-xl text-foreground">{s.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xl">{s.description}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-foreground">
                      <Users className="w-4 h-4" />
                      {count === null ? "…" : `${count} recipients`}
                    </div>
                    {sent > 0 && (
                      <div className="flex items-center gap-1.5 text-green-700">
                        <CheckCircle2 className="w-4 h-4" />
                        {sent} sent
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => handlePreview(s.key)} disabled={busy === s.key}>
                    <Eye className="w-4 h-4 mr-1.5" /> Preview
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleTest(s.key)} disabled={busy === s.key || !userEmail}>
                    <Mail className="w-4 h-4 mr-1.5" /> Send test to me
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setConfirmSegment(s.key)}
                    disabled={sending === s.key || !remaining}
                    className="bg-primary text-primary-foreground"
                  >
                    {sending === s.key ? (
                      <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Sending…</>
                    ) : (
                      <><Send className="w-4 h-4 mr-1.5" /> Send to {remaining ?? "…"}</>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 p-4 rounded-xl bg-muted/40 border border-border text-sm text-muted-foreground">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              Recipients who've already received this campaign are automatically skipped (safe to click Send again). Each email includes one-click RSVP buttons that record in the CRM under Open House sign-ups.
            </div>
          </div>
        </div>
      </div>

      {/* Preview dialog */}
      <Dialog open={previewSegment !== null} onOpenChange={(v) => !v && setPreviewSegment(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Preview: {previewSubject}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto border rounded-lg bg-white">
            <iframe title="preview" srcDoc={previewHtml} className="w-full h-[70vh]" />
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm send */}
      <Dialog open={confirmSegment !== null} onOpenChange={(v) => !v && setConfirmSegment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send this campaign?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will email <strong>{confirmSegment ? Math.max(0, (counts[confirmSegment] ?? 0) - sentCounts[confirmSegment]) : 0}</strong> people in the "{SEGMENTS.find((s) => s.key === confirmSegment)?.title}" segment. Recipients already sent will be skipped.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmSegment(null)}>Cancel</Button>
            <Button onClick={() => confirmSegment && handleSend(confirmSegment)}>
              <Send className="w-4 h-4 mr-1.5" /> Send now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Campaigns;
