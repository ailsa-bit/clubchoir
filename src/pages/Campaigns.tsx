import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Send, Eye, Mail, Users, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { invokeCampaign, SessionExpiredError } from "@/lib/campaignInvoke";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

type Segment = "choir-tonight" | "resources-week3-paid" | "community-update" | "gary-white-shoutout";

const LOCATIONS = ["Montreal", "Hudson", "Saint-Hubert", "Pointe-Claire"] as const;
type LocationFilter = "all" | (typeof LOCATIONS)[number] | "unknown";

interface ManifestRecipient {
  email: string;
  first_name: string;
  last_name: string;
  location: string;
  subject: string;
}

interface RecipientIssue {
  email: string;
  problems: string[];
}

interface Preflight {
  count: number;
  manifest: ManifestRecipient[];
  issues: RecipientIssue[];
  fingerprint: string;
}

const EMPTY_COUNTS = {
  "choir-tonight": 0,
  "resources-week3-paid": 0,
  "community-update": 0,
  "gary-white-shoutout": 0,
} as Record<Segment, number>;

// Segments that target a single location — no location chips needed
const SINGLE_LOCATION: Partial<Record<Segment, string>> = {
  "gary-white-shoutout": "Saint-Hubert",
};

const CURRENT_CAMPAIGN_KEYS: Partial<Record<Segment, string>> = {
  "choir-tonight": "fall-2026-choir-tonight-week4-v1",
  "resources-week3-paid": "fall-2026-resources-week4-paid-v2",
  "community-update": "fall-2026-community-update-v1",
  "gary-white-shoutout": "fall-2026-saint-hubert-gary-white-shoutout-v1",
};

const SEGMENTS: { key: Segment; title: string; description: string; color: string }[] = [
  {
    key: "choir-tonight",
    title: "Week 4 Starts Tonight — Reminder",
    description: "Warm same-day reminder for paid members, sent by location. Features ‘When Doves Cry’ by Prince, venue and start time, what to bring, song resources, profile help, guest welcome and a stay-home-if-sick note. Bilingual EN/FR.",
    color: "bg-indigo-50 border-indigo-300",
  },
  {
    key: "resources-week3-paid",
    title: "Week 4 Resources Are Up — \"When Doves Cry\"",
    description: "Send by location to paid members. Announces Week 4 song \"When Doves Cry\" by Prince with four numbered links: 1) This Week at Choir (weekly message and song story), 2) the location's YouTube playlist of end-of-session videos, 3) the Fall 2026 song resources, and 4) the playlist of all songs we're learning this session, plus a Google review button. Bilingual EN/FR.",
    color: "bg-pink-50 border-pink-300",
  },
  {
    key: "community-update",
    title: "A Thank-You — Community Update",
    description: "Warm thank-you to all paid members for a great start, inviting them to share the try-a-session link with friends over the next seven weeks (no commitment, no audition) and to like the Club Choir Facebook page. Bilingual EN/FR.",
    color: "bg-amber-50 border-amber-300",
  },
  {
    key: "gary-white-shoutout",
    title: "Saint-Hubert — Gary White This Week",
    description: "A warm bilingual shout-out to Gary, with his poster and details for tonight at McKibbin's Dix30 and Friday at the Greenfield Park Legion. For paid Saint-Hubert members only; both performances are free.",
    color: "bg-green-50 border-green-300",
  },
];




const Campaigns = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [counts, setCounts] = useState<Record<Segment, number | null>>({ ...EMPTY_COUNTS } as unknown as Record<Segment, number | null>);
  const [byLocation, setByLocation] = useState<Record<Segment, Record<string, number>>>({
    "choir-tonight": {},
    "resources-week3-paid": {},
    "community-update": {},
    "gary-white-shoutout": {},
  });
  const [locFilter, setLocFilter] = useState<Record<Segment, LocationFilter>>({
    "choir-tonight": "all",
    "resources-week3-paid": "all",
    "community-update": "all",
    "gary-white-shoutout": "all",
  });
  const [sentCounts, setSentCounts] = useState<Record<Segment, number>>({ ...EMPTY_COUNTS });
  const [newCounts, setNewCounts] = useState<Record<Segment, number | null>>({ ...EMPTY_COUNTS } as unknown as Record<Segment, number | null>);
  const [newByLocation, setNewByLocation] = useState<Record<Segment, Record<string, number>>>({
    "choir-tonight": {},
    "resources-week3-paid": {},
    "community-update": {},
    "gary-white-shoutout": {},
  });

  const [previewSegment, setPreviewSegment] = useState<Segment | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewSubject, setPreviewSubject] = useState<string>("");
  const [confirmSegment, setConfirmSegment] = useState<Segment | null>(null);
  const [sending, setSending] = useState<Segment | null>(null);
  const [busy, setBusy] = useState<Segment | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [preflight, setPreflight] = useState<Preflight | null>(null);
  const [preflightLoading, setPreflightLoading] = useState(false);
  const [excludedEmails, setExcludedEmails] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || "");
    })();
  }, []);

  const handleExpired = (e: unknown) => {
    if (e instanceof SessionExpiredError) {
      toast({
        title: "Please sign in again",
        description: "Your session expired, so nothing was sent. Sign in and try again.",
        variant: "destructive",
      });
      navigate("/login");
      return true;
    }
    return false;
  };

  const loadCounts = async () => {
    // Load all segment counts in parallel — a serial loop left cards greyed out for a long time
    await Promise.all(
      SEGMENTS.map(async (s) => {
        const data = await invokeCampaign<any>({ segment: s.key, countOnly: true }).catch(() => null);
        setCounts((c) => ({ ...c, [s.key]: data?.total ?? data?.count ?? 0 }));
        setByLocation((b) => ({ ...b, [s.key]: data?.byLocation ?? {} }));
        setNewCounts((c) => ({ ...c, [s.key]: data?.newTotal ?? 0 }));
        setNewByLocation((b) => ({ ...b, [s.key]: data?.newByLocation ?? {} }));
      })
    );

    // Sent counts — count per segment (a single unfiltered select is capped at 1000 rows)
    const grouped: Record<string, number> = { ...EMPTY_COUNTS };
    await Promise.all(
      SEGMENTS.map(async (s) => {
        let query = supabase
          .from("campaign_sends")
          .select("id", { count: "exact", head: true })
          .eq("status", "sent")
          .eq("segment", s.key);
        const campaignKey = CURRENT_CAMPAIGN_KEYS[s.key];
        if (campaignKey) query = query.eq("campaign_key", campaignKey);
        const { count } = await query;
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
      const data = await invokeCampaign<any>({ segment: seg, previewOnly: true, location: locFilter[seg] });
      setPreviewSubject(data.subject);
      setPreviewHtml(data.html);
      setPreviewSegment(seg);
    } catch (e: any) {
      if (handleExpired(e)) return;
      toast({ title: "Preview failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const handleTest = async (seg: Segment) => {
    if (userEmail.toLowerCase() !== "ailsa@clubchoir.ca") {
      toast({ title: "Test blocked", description: "Test emails can only be sent to ailsa@clubchoir.ca.", variant: "destructive" });
      return;
    }
    setBusy(seg);
    try {
      await invokeCampaign({ segment: seg, testEmail: userEmail, location: locFilter[seg] });
      toast({ title: "Test sent!", description: `Check ${userEmail}` });
    } catch (e: any) {
      if (handleExpired(e)) return;
      toast({ title: "Test failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const handleSend = async (seg: Segment) => {
    if (!preflight || preflight.issues.length) return;
    setSending(seg);
    setConfirmSegment(null);
    try {
      const data = await invokeCampaign<any>({
        segment: seg,
        location: locFilter[seg],
        preflightFingerprint: preflight.fingerprint,
        preflightCount: preflight.count,
        excludeEmails: excludedEmails,
      });
      toast({
        title: "Campaign sent!",
        description: `${data.success?.length || 0} sent, ${data.failed?.length || 0} failed, ${data.skipped || 0} skipped.`,
      });
      loadCounts();
    } catch (e: any) {
      if (handleExpired(e)) return;
      toast({ title: "Send failed", description: e.message, variant: "destructive" });
    } finally {
      setSending(null);
      setPreflight(null);
      setExcludedEmails([]);
    }
  };

  const prepareSend = async (seg: Segment, excluded: string[] = []) => {
    setPreflightLoading(true);
    try {
      const data = await invokeCampaign<Preflight>({
        segment: seg, location: locFilter[seg], preflightOnly: true, excludeEmails: excluded,
      });
      setPreflight(data);
      setExcludedEmails(excluded);
      setConfirmSegment(seg);
    } catch (e: any) {
      if (handleExpired(e)) return;
      toast({ title: "Verification failed", description: e.message, variant: "destructive" });
    } finally {
      setPreflightLoading(false);
    }
  };

  // Remove one person from the reviewed list, then re-verify so the send
  // matches exactly what's shown.
  const removeRecipient = async (email: string) => {
    if (!confirmSegment || preflightLoading) return;
    await prepareSend(confirmSegment, [...excludedEmails, email.toLowerCase()]);
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
          <p className="text-muted-foreground">Bilingual email campaigns — send to everyone or one location at a time.</p>
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
                    onClick={() => prepareSend(s.key)}
                    disabled={sending === s.key || preflightLoading || !newAudience}
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
      <Dialog open={confirmSegment !== null} onOpenChange={(v) => { if (!v && !preflightLoading) { setConfirmSegment(null); setPreflight(null); setExcludedEmails([]); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Send this campaign?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This verified list contains <strong>{preflight?.count ?? 0}</strong> people in the "{SEGMENTS.find((s) => s.key === confirmSegment)?.title}" segment
            {confirmSegment && locFilter[confirmSegment] !== "all" ? <> — <strong>{locFilter[confirmSegment]}</strong> only</> : " — all locations"}. Everyone who already received this campaign (or another first-night email) is skipped automatically.
            {excludedEmails.length > 0 && (
              <> <strong className="text-foreground">{excludedEmails.length} removed by you.</strong></>
            )}
          </p>
          <p className="text-xs text-muted-foreground">Click the X beside anyone you don't want to email — they'll be left out of this send only.</p>

          {preflight?.issues.length ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <p className="font-semibold">Send blocked — fix these records first:</p>
              {preflight.issues.map((issue) => (
                <p key={issue.email}>{issue.email}: {issue.problems.join(", ")}</p>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-auto min-h-0 relative">
              {preflightLoading && (
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-10">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              )}
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr><th className="p-2 text-left">Name</th><th className="p-2 text-left">Email</th><th className="p-2 text-left">Location</th><th className="p-2 w-10"></th></tr>
                </thead>
                <tbody>
                  {preflight?.manifest.map((r) => (
                    <tr key={r.email} className="border-t border-border">
                      <td className="p-2">{r.first_name} {r.last_name}</td>
                      <td className="p-2">{r.email}</td>
                      <td className="p-2">{r.location}</td>
                      <td className="p-2">
                        <button
                          type="button"
                          aria-label={`Remove ${r.first_name} ${r.last_name}`}
                          title="Remove from this send"
                          disabled={preflightLoading}
                          onClick={() => removeRecipient(r.email)}
                          className="text-muted-foreground hover:text-destructive disabled:opacity-40"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setConfirmSegment(null); setPreflight(null); setExcludedEmails([]); }}>Cancel</Button>
            <Button disabled={!preflight || preflightLoading || preflight.count === 0 || preflight.issues.length > 0} onClick={() => confirmSegment && handleSend(confirmSegment)}>
              <Send className="w-4 h-4 mr-1.5" /> Send now to {preflight?.count ?? 0}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Campaigns;
