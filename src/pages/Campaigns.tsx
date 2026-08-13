import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Send, Eye, Mail, Users, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import FallCampaignTemplates from "@/components/FallCampaignTemplates";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

type Segment = "fall-paid" | "fall-unpaid" | "fall-considering" | "hudson-open-house";

const LOCATIONS = ["Montreal", "Hudson", "Saint-Hubert", "Pointe-Claire"] as const;
type LocationFilter = "all" | (typeof LOCATIONS)[number] | "unknown";

const EMPTY_COUNTS = {
  "fall-paid": 0, "fall-unpaid": 0, "fall-considering": 0, "hudson-open-house": 0,
} as Record<Segment, number>;

// Segments that target a single location — no location chips needed
const SINGLE_LOCATION: Partial<Record<Segment, string>> = { "hudson-open-house": "Hudson" };

const SEGMENTS: { key: Segment; title: string; description: string; color: string }[] = [
  {
    key: "fall-paid",
    title: "Registered & Paid",
    description: "Confirms registration + payment, shows their location, rehearsal night, venue and first-rehearsal date, and asks them to reply with any corrections. Bilingual EN/FR.",
    color: "bg-green-50 border-green-200",
  },
  {
    key: "fall-unpaid",
    title: "Registered — Payment Outstanding",
    description: "For Fall 2026 registrants who haven't paid: their details to confirm, Interac e-Transfer box ($280) and a note in case they've already paid. Bilingual EN/FR.",
    color: "bg-yellow-50 border-yellow-200",
  },
  {
    key: "fall-considering",
    title: "Still Considering Joining",
    description: "Everyone with no Fall 2026 registration — prospects, open house RSVPs, try-a-session and past members. Includes their location's schedule, the $280 fee and a Register button. Bilingual EN/FR.",
    color: "bg-blue-50 border-blue-200",
  },
  {
    key: "hudson-open-house",
    title: "Hudson — Second Open House (Aug 18)",
    description: "All Hudson contacts (registered, interested and past members), excluding anyone who already RSVP'd for August 18. Warm general invitation to the second open house with the RSVP link. Bilingual EN/FR.",
    color: "bg-purple-50 border-purple-200",
  },
];



const Campaigns = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [counts, setCounts] = useState<Record<Segment, number | null>>({ ...EMPTY_COUNTS } as unknown as Record<Segment, number | null>);
  const [byLocation, setByLocation] = useState<Record<Segment, Record<string, number>>>({
    "fall-paid": {}, "fall-unpaid": {}, "fall-considering": {}, "hudson-open-house": {},
  });
  const [locFilter, setLocFilter] = useState<Record<Segment, LocationFilter>>({
    "fall-paid": "all", "fall-unpaid": "all", "fall-considering": "all", "hudson-open-house": "all",
  });
  const [sentCounts, setSentCounts] = useState<Record<Segment, number>>({ ...EMPTY_COUNTS });
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

        </div>

        <div className="space-y-4">
          {SEGMENTS.map((s) => {
            const total = counts[s.key];
            const sent = sentCounts[s.key];
            const audience = audienceFor(s.key);
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
                      {total === null ? "…" : `${total} total`}
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
                    disabled={sending === s.key || !audience}
                    className="bg-primary text-primary-foreground"
                  >
                    {sending === s.key ? (
                      <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Sending…</>
                    ) : (
                      <><Send className="w-4 h-4 mr-1.5" /> Send to {audience ?? "…"} {filter === "all" ? "(all)" : filter === "unknown" ? "(no location)" : `(${filter})`}</>
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

        <FallCampaignTemplates />

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
