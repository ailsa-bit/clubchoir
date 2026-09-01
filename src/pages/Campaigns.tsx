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

type Segment = "first-night-guests" | "first-night-paid" | "first-night-unpaid";

const LOCATIONS = ["Montreal", "Hudson", "Saint-Hubert", "Pointe-Claire"] as const;
type LocationFilter = "all" | (typeof LOCATIONS)[number] | "unknown";

const EMPTY_COUNTS = {
  "first-night-guests": 0,
  "first-night-paid": 0,
  "first-night-unpaid": 0,
} as Record<Segment, number>;

// Segments that target a single location — no location chips needed
const SINGLE_LOCATION: Partial<Record<Segment, string>> = {};

const SEGMENTS: { key: Segment; title: string; description: string; color: string }[] = [
  {
    key: "first-night-paid",
    title: "First Night — Registered & Paid",
    description: "Big welcome email to confirmed members: first-night logistics per location (Hudson burger night 6:00 PM / 7:30 start + parking pass, Montreal elevator), member portal setup (clubchoir.ca/profile), what to bring, and Week 1 song. Bilingual EN/FR.",
    color: "bg-emerald-50 border-emerald-300",
  },
  {
    key: "first-night-guests",
    title: "First Night — Guest List",
    description: "Friendly info email for guests trying the first night: where/when per location, what to bring (water, glasses), binder policy, Week 1 song (Lovely Day) + teasers, and member access if they join. Bilingual EN/FR.",
    color: "bg-rose-50 border-rose-300",
  },
  {
    key: "first-night-unpaid",
    title: "First Night — Registered/Interested, Unpaid",
    description: "Last-chance nudge: choir starts next week, info emails are going out now — finalize registration (Interac details included) or reply to try the first night. Bilingual EN/FR.",
    color: "bg-amber-50 border-amber-300",
  },
];




const Campaigns = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [counts, setCounts] = useState<Record<Segment, number | null>>({ ...EMPTY_COUNTS } as unknown as Record<Segment, number | null>);
  const [byLocation, setByLocation] = useState<Record<Segment, Record<string, number>>>({
    "first-night-guests": {},
    "first-night-paid": {},
    "first-night-unpaid": {},
  });
  const [locFilter, setLocFilter] = useState<Record<Segment, LocationFilter>>({
    "first-night-guests": "all",
    "first-night-paid": "all",
    "first-night-unpaid": "all",
  });
  const [sentCounts, setSentCounts] = useState<Record<Segment, number>>({ ...EMPTY_COUNTS });
  const [newCounts, setNewCounts] = useState<Record<Segment, number | null>>({ ...EMPTY_COUNTS } as unknown as Record<Segment, number | null>);
  const [newByLocation, setNewByLocation] = useState<Record<Segment, Record<string, number>>>({
    "first-night-guests": {},
    "first-night-paid": {},
    "first-night-unpaid": {},
  });

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
      setCounts((c) => ({ ...c, [s.key]: data?.total ?? data?.count ?? 0 }));
      setByLocation((b) => ({ ...b, [s.key]: data?.byLocation ?? {} }));
      setNewCounts((c) => ({ ...c, [s.key]: data?.newTotal ?? 0 }));
      setNewByLocation((b) => ({ ...b, [s.key]: data?.newByLocation ?? {} }));

    }
    // Sent counts — count per segment (a single unfiltered select is capped at 1000 rows)
    const grouped: Record<string, number> = { ...EMPTY_COUNTS };
    await Promise.all(
      SEGMENTS.map(async (s) => {
        const { count } = await supabase
          .from("campaign_sends")
          .select("id", { count: "exact", head: true })
          .eq("status", "sent")
          .eq("segment", s.key);
        grouped[s.key] = count ?? 0;
      })
    );
    setSentCounts(grouped as Record<Segment, number>);
  };

  useEffect(() => {
    if (isAdmin) loadCounts();
  }, [isAdmin]);

  const audienceFor = (seg: Segment) => {
    const f = locFilter[seg];
    if (f === "all") return counts[seg];
    const b = byLocation[seg] || {};
    return b[f] ?? 0;
  };

  // How many would actually get an email (already-emailed people are skipped automatically)
  const newAudienceFor = (seg: Segment) => {
    const f = locFilter[seg];
    if (f === "all") return newCounts[seg];
    const b = newByLocation[seg] || {};
    return b[f] ?? 0;
  };



  const handlePreview = async (seg: Segment) => {
    setBusy(seg);
    try {
      const { data, error } = await supabase.functions.invoke("send-campaign", {
        body: { segment: seg, previewOnly: true, location: locFilter[seg] },
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
        body: { segment: seg, testEmail: userEmail, location: locFilter[seg] },
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
        body: { segment: seg, location: locFilter[seg] },
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
          <p className="text-muted-foreground">Three bilingual follow-ups after the open houses — send to everyone or one location at a time.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/deliverability")}>
            View email deliverability
          </Button>
        </div>

        <div className="space-y-4">
          {SEGMENTS.map((s) => {
            const total = counts[s.key];
            const sent = sentCounts[s.key];
            const audience = audienceFor(s.key);
            const newAudience = newAudienceFor(s.key);
            const filter = locFilter[s.key];
            const buckets = byLocation[s.key] || {};

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
                      {total === null ? "…" : `${total} on list`}
                    </div>
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      {newCounts[s.key] === null ? "…" : `${newCounts[s.key]} not yet emailed`}
                    </div>
                    {sent > 0 && (
                      <div className="flex items-center gap-1.5 text-green-700">
                        <CheckCircle2 className="w-4 h-4" />
                        {sent} sent
                      </div>
                    )}
                  </div>
                </div>


                <div className="flex flex-wrap gap-1.5 mt-4">
                  {(SINGLE_LOCATION[s.key] ? [] : (["all", ...LOCATIONS, "unknown"] as LocationFilter[])).map((loc) => {
                    const n = loc === "all" ? (total ?? 0) : (buckets[loc] ?? 0);
                    if (loc === "unknown" && n === 0) return null;
                    const active = filter === loc;
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setLocFilter((f) => ({ ...f, [s.key]: loc }))}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                          active
                            ? "bg-foreground text-background border-foreground"
                            : "bg-white/70 text-foreground border-border hover:bg-white"
                        }`}
                      >
                        {loc === "all" ? "All locations" : loc === "unknown" ? "No location" : loc} ({n})
                      </button>
                    );
                  })}
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
                    disabled={sending === s.key || !newAudience}
                    className="bg-primary text-primary-foreground"
                  >
                    {sending === s.key ? (
                      <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Sending…</>
                    ) : (
                      <><Send className="w-4 h-4 mr-1.5" /> Send to {newAudience ?? "…"} new {filter === "all" ? "(all locations)" : filter === "unknown" ? "(no location)" : `(${filter})`}</>
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
              Recipients who've already received this campaign are automatically skipped (safe to click Send again). Contacts tagged <strong>no-email</strong> are never included, and each person appears in only one segment.
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
            This will email up to <strong>{confirmSegment ? (audienceFor(confirmSegment) ?? 0) : 0}</strong> people in the "{SEGMENTS.find((s) => s.key === confirmSegment)?.title}" segment
            {confirmSegment && locFilter[confirmSegment] !== "all" ? <> — <strong>{locFilter[confirmSegment]}</strong> only</> : " — all locations"}. Anyone who already received this campaign will be skipped.
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
