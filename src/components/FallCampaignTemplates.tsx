import { useState } from "react";
import { Copy, Check, Clock, Users, CreditCard, Sparkles, MapPin, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type Audience = "registered-unpaid" | "interested" | "hudson-open-house" | "manual";

type Template = {
  id: string;
  title: string;
  audience: Audience;
  audienceNote: string;
  goal: string;
  timing: string;
  subjects: string[];
  body: string;
  mergeTags: string[];
  notes?: string;
  locationVariants?: boolean;
};

const LOCATION_INSERTS: { location: string; text: string }[] = [
  { location: "Montreal", text: "The Montreal group is growing quickly, and we're confirming spots now for the fall session." },
  { location: "Saint-Hubert", text: "The Saint-Hubert group is shaping up to be a really lovely, friendly fall group." },
  { location: "Pointe-Claire", text: "Pointe-Claire already has a strong group coming together, with lots of familiar and new faces." },
  { location: "Hudson", text: "Hudson is still new and growing, so this is a great time to come try it and help shape the group from the beginning." },
];

const COUNTS = [
  { location: "Montreal", members: 21, potential: 66, unpaid: 43, interested: 23 },
  { location: "Saint-Hubert", members: 20, potential: 25, unpaid: 10, interested: 15 },
  { location: "Pointe-Claire", members: 51, potential: 59, unpaid: 19, interested: 40 },
  { location: "Hudson", members: 9, potential: 36, unpaid: 3, interested: 33 },
];

const TEMPLATES: Template[] = [
  {
    id: "fall-2026-registered-unpaid",
    title: "Fall 2026 - Registered Unpaid Payment Reminder",
    audience: "registered-unpaid",
    audienceNote: "Registered for Fall 2026, payment still pending. Matches the \"Registered — Payment Outstanding\" segment above.",
    goal: "Payment completion",
    timing: "Thursday / Friday or this weekend",
    locationVariants: true,
    mergeTags: ["{{first_name}}", "{{payment_link}}"],
    subjects: [
      "Your Club Choir registration is almost complete",
      "Quick reminder to confirm your fall spot",
      "Club Choir fall session: payment reminder",
    ],
    body: `Hi {{first_name}},

Just a quick note because your Club Choir registration is in, but payment is still pending.

We're getting close to the start of the fall session, and payment is what confirms your spot in the group.

You can complete that here:
{{payment_link}}

No pressure if you're still deciding. I just wanted to make sure you had the link handy, especially as we're starting to organize the groups by location.

So looking forward to singing together this fall.

Ailsa
Club Choir

P.S. If you already paid, you can ignore this - it may just not have updated yet.`,
  },
  {
    id: "fall-2026-interested",
    title: "Fall 2026 - Interested Prospects Invitation",
    audience: "interested",
    audienceNote: "Marked interested/potential, not yet registered for Fall 2026. Matches the \"Still Considering Joining\" segment above.",
    goal: "Registration, RSVP, or a reply with questions",
    timing: "Saturday morning",
    locationVariants: true,
    mergeTags: ["{{first_name}}", "{{registration_link}}"],
    subjects: [
      "Still thinking about Club Choir this fall?",
      "Fall Club Choir starts soon",
      "Want to sing with us this fall?",
    ],
    body: `Hi {{first_name}},

Just checking in in case Club Choir is still on your mind for the fall.

The groups are starting to come together, and we're now a few weeks away from the first sessions. Club Choir is low-pressure, welcoming, and built around the fun of singing with other people - no auditions, no formal choir pressure, just a good reason to sing each week.

If you'd like to join us this fall, you can register here:
{{registration_link}}

And if you're not quite sure yet, that's completely okay too. You're welcome to reply with any questions.

Ailsa
Club Choir`,
  },
  {
    id: "hudson-open-house-aug-18",
    title: "Hudson Open House - August 18 Reminder",
    audience: "hudson-open-house",
    audienceNote: "Hudson interested prospects and Hudson open-house RSVPs who haven't registered/paid. The \"Hudson — Second Open House (Aug 18)\" segment above covers Hudson contacts and already excludes people who RSVP'd for Aug 18.",
    goal: "Open house RSVP",
    timing: "As soon as possible, before August 18",
    mergeTags: ["{{first_name}}", "{{hudson_open_house_link}}"],
    subjects: [
      "Want to try Club Choir in Hudson?",
      "Hudson Open House is coming up",
      "Come sing with us in Hudson",
    ],
    body: `Hi {{first_name}},

A quick reminder that we have a Hudson Club Choir Open House coming up on August 18.

It's a low-pressure way to see how Club Choir works, meet a few people, sing together, and decide whether the fall session feels like a good fit.

You don't need to prepare anything. Just come as you are.

You can RSVP here:
{{hudson_open_house_link}}

Hope to see you there,

Ailsa
Club Choir`,
    notes: "Audience guidance: Hudson only, excluding anyone already paid/registered for Fall 2026.",
  },
  {
    id: "fall-2026-sunday-followup",
    title: "Fall 2026 - Sunday Soft Follow-Up",
    audience: "manual",
    audienceNote: "People who opened or clicked but didn't pay/register.",
    goal: "Gentle nudge back to the link",
    timing: "Sunday",
    mergeTags: ["{{first_name}}", "{{link}}"],
    subjects: [
      "Want me to save your Club Choir link?",
      "Quick Club Choir follow-up",
    ],
    body: `Hi {{first_name}},

Just a tiny follow-up in case you meant to come back to this.

If you're planning to join Club Choir this fall, here's the link again:
{{link}}

And if you're still deciding, no worries at all. You're welcome to reply if there's anything you're wondering about.

Ailsa`,
    notes: "Manual-use template: open/click tracking is not available, so there is no automatic \"opened but didn't register\" audience. Send this by hand from Send Email to a list you choose (for example, the remaining unpaid registrants).",
  },
];

const AUDIENCE_STYLES: Record<Audience, { label: string; className: string; icon: typeof Users }> = {
  "registered-unpaid": { label: "Registered — unpaid", className: "bg-yellow-100 text-yellow-900 border-yellow-300", icon: CreditCard },
  interested: { label: "Interested — not registered", className: "bg-blue-100 text-blue-900 border-blue-300", icon: Sparkles },
  "hudson-open-house": { label: "Hudson open house", className: "bg-purple-100 text-purple-900 border-purple-300", icon: MapPin },
  manual: { label: "Manual list", className: "bg-muted text-foreground border-border", icon: Users },
};

const FallCampaignTemplates = () => {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(TEMPLATES[0].id);
  const [variant, setVariant] = useState<Record<string, string>>({});

  const copy = async (key: string, text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
      toast({ title: `${label} copied` });
    } catch {
      toast({ title: "Copy failed", description: "Select the text and copy manually.", variant: "destructive" });
    }
  };

  const bodyFor = (t: Template) => {
    const loc = variant[t.id];
    if (!loc || !t.locationVariants) return t.body;
    const insert = LOCATION_INSERTS.find((l) => l.location === loc)?.text;
    if (!insert) return t.body;
    const lines = t.body.split("\n\n");
    // Insert the location line after the opening paragraph
    lines.splice(2, 0, insert);
    return lines.join("\n\n");
  };

  const totals = COUNTS.reduce(
    (a, c) => ({ members: a.members + c.members, potential: a.potential + c.potential, unpaid: a.unpaid + c.unpaid, interested: a.interested + c.interested }),
    { members: 0, potential: 0, unpaid: 0, interested: 0 }
  );

  return (
    <section className="mt-12">
      <div className="mb-4">
        <h2 className="font-heading font-bold text-2xl text-foreground">Fall 2026 potential-member campaign set</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ready-to-use copy for the fall push. Preview, tweak a location variant, and copy the subject or body into a send.
        </p>
      </div>

      {/* Audience snapshot */}
      <div className="rounded-2xl border border-border bg-card p-5 mb-4">
        <h3 className="font-heading font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">Audience snapshot</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COUNTS.map((c) => (
            <div key={c.location} className="rounded-xl border border-border bg-background p-3">
              <div className="font-heading font-bold text-foreground">{c.location}</div>
              <div className="text-xs text-muted-foreground mt-1">{c.members} members · {c.potential} potential</div>
              <div className="text-xs mt-2 space-y-0.5">
                <div className="text-yellow-800">{c.unpaid} registered unpaid</div>
                <div className="text-blue-800">{c.interested} interested</div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-muted-foreground mt-3">
          Totals: {totals.members} members · {totals.potential} potential ({totals.unpaid} registered unpaid, {totals.interested} interested).
        </div>
        <div className="mt-3 flex gap-2 text-sm text-foreground bg-muted/50 rounded-xl p-3">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
          <p>
            <strong>Montreal</strong> has the biggest registered-unpaid payment gap (43 people), so the payment reminder matters most there.{" "}
            <strong>Hudson</strong> has the biggest interested / open-house nurture opportunity (33 interested against 9 members).
          </p>
        </div>
      </div>

      {/* Templates */}
      <div className="space-y-3">
        {TEMPLATES.map((t) => {
          const a = AUDIENCE_STYLES[t.audience];
          const Icon = a.icon;
          const isOpen = open === t.id;
          const body = bodyFor(t);
          return (
            <div key={t.id} className="rounded-2xl border border-border bg-card overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : t.id)}
                className="w-full text-left p-5 hover:bg-muted/40 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-heading font-bold text-lg text-foreground">{t.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{t.audienceNote}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${a.className}`}>
                    <Icon className="w-3.5 h-3.5" /> {a.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {t.timing}</span>
                  <span>Goal: {t.goal}</span>
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 border-t border-border pt-4 space-y-4">
                  {/* Subjects */}
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Subject options</div>
                    <div className="space-y-1.5">
                      {t.subjects.map((s, i) => (
                        <div key={s} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                          <span className="text-sm text-foreground flex-1">{s}</span>
                          <Button variant="ghost" size="sm" onClick={() => copy(`${t.id}-s${i}`, s, "Subject")}>
                            {copied === `${t.id}-s${i}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Location variants */}
                  {t.locationVariants && (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Location insert</div>
                      <div className="flex flex-wrap gap-1.5">
                        {["None", ...LOCATION_INSERTS.map((l) => l.location)].map((loc) => {
                          const value = loc === "None" ? "" : loc;
                          const active = (variant[t.id] || "") === value;
                          return (
                            <button
                              key={loc}
                              type="button"
                              onClick={() => setVariant((v) => ({ ...v, [t.id]: value }))}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                                active ? "bg-foreground text-background border-foreground" : "bg-background text-foreground border-border hover:bg-muted"
                              }`}
                            >
                              {loc}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Body */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Body</div>
                      <Button variant="outline" size="sm" onClick={() => copy(`${t.id}-body`, body, "Body")}>
                        {copied === `${t.id}-body` ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />} Copy body
                      </Button>
                    </div>
                    <pre className="whitespace-pre-wrap font-body text-sm text-foreground bg-background border border-border rounded-xl p-4 leading-relaxed">
{body}
                    </pre>
                  </div>

                  {/* Merge tags */}
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Merge tags</div>
                    <div className="flex flex-wrap gap-1.5">
                      {t.mergeTags.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => copy(`${t.id}-${m}`, m, m)}
                          className="px-2.5 py-1 rounded-md text-xs font-mono border border-border bg-muted/60 hover:bg-muted"
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {t.notes && (
                    <div className="flex gap-2 text-sm text-muted-foreground bg-muted/40 rounded-xl p-3">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p>{t.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-muted-foreground">
        These are drafts only — nothing is sent from this section. Use the segment cards above, or the Send Email page, when you're ready to send.
      </div>
    </section>
  );
};

export default FallCampaignTemplates;
