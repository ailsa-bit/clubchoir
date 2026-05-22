import PageMeta from "@/components/PageMeta";
import ChoirFaq from "@/components/ChoirFaq";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Send, Users, Music, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { choirPhotos } from "@/assets/photos";

const nightClubPhoto = choirPhotos.find((p) => p.id === "pub-conducting");

const inquirySchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(150),
  contactName: z.string().trim().min(1, "Contact name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().min(1, "Phone is required").max(40),
  eventType: z.string().min(1, "Please select an event type"),
  preferredDates: z.string().trim().max(300).optional(),
  preferredTime: z.string().optional(),
  cityArea: z.string().trim().max(150).optional(),
  eventLocation: z.string().optional(),
  groupSize: z.string().min(1, "Please select a group size"),
  teamProfile: z.array(z.string()).optional(),
  goals: z.array(z.string()).max(3, "Pick up to 3 goals").optional(),
  experience: z.string().optional(),
  musicPref: z.string().optional(),
  sessionLength: z.string().optional(),
  specialConsiderations: z.string().trim().max(500).optional(),
  additionalInfo: z.string().trim().max(1000).optional(),
});

type Opt = { value: string; labelKey: string };

const EVENT_TYPES: Opt[] = [
  { value: "Team building", labelKey: "corporate.opt.eventType.teamBuilding" },
  { value: "Holiday party", labelKey: "corporate.opt.eventType.holidayParty" },
  { value: "Retreat", labelKey: "corporate.opt.eventType.retreat" },
  { value: "Conference activity", labelKey: "corporate.opt.eventType.conference" },
  { value: "Client appreciation event", labelKey: "corporate.opt.eventType.clientAppreciation" },
  { value: "Other", labelKey: "corporate.opt.eventType.other" },
];
const TIMES: Opt[] = [
  { value: "Morning", labelKey: "corporate.opt.time.morning" },
  { value: "Afternoon", labelKey: "corporate.opt.time.afternoon" },
  { value: "Evening", labelKey: "corporate.opt.time.evening" },
  { value: "Flexible", labelKey: "corporate.opt.time.flexible" },
  { value: "Not sure yet", labelKey: "corporate.opt.time.notSure" },
];
const EVENT_LOCATIONS: Opt[] = [
  { value: "At your office", labelKey: "corporate.opt.loc.office" },
  { value: "External venue", labelKey: "corporate.opt.loc.external" },
  { value: "Not decided yet", labelKey: "corporate.opt.loc.notDecided" },
];
const GROUP_SIZES: Opt[] = [
  { value: "10–20", labelKey: "corporate.opt.size.10_20" },
  { value: "20–40", labelKey: "corporate.opt.size.20_40" },
  { value: "40–60", labelKey: "corporate.opt.size.40_60" },
  { value: "60+", labelKey: "corporate.opt.size.60plus" },
  { value: "Not sure yet", labelKey: "corporate.opt.size.notSure" },
];
const TEAM_PROFILE: Opt[] = [
  { value: "Mostly desk-based professionals", labelKey: "corporate.opt.team.desk" },
  { value: "Creative team", labelKey: "corporate.opt.team.creative" },
  { value: "Leadership/management group", labelKey: "corporate.opt.team.leadership" },
  { value: "Mixed departments", labelKey: "corporate.opt.team.mixed" },
  { value: "High-energy/social", labelKey: "corporate.opt.team.energy" },
  { value: "More reserved/introverted", labelKey: "corporate.opt.team.reserved" },
  { value: "Diverse age range", labelKey: "corporate.opt.team.ages" },
  { value: "Other", labelKey: "corporate.opt.team.other" },
];
const GOALS: Opt[] = [
  { value: "Team bonding / connection", labelKey: "corporate.opt.goal.bonding" },
  { value: "Boost morale", labelKey: "corporate.opt.goal.morale" },
  { value: "Encourage collaboration", labelKey: "corporate.opt.goal.collab" },
  { value: "Try something fun and different", labelKey: "corporate.opt.goal.fun" },
  { value: "Celebrate a milestone", labelKey: "corporate.opt.goal.milestone" },
  { value: "Reduce stress", labelKey: "corporate.opt.goal.stress" },
  { value: "Build confidence", labelKey: "corporate.opt.goal.confidence" },
  { value: "Other", labelKey: "corporate.opt.goal.other" },
  { value: "Not sure yet", labelKey: "corporate.opt.goal.notSure" },
];
const EXPERIENCES: Opt[] = [
  { value: "Light and fun", labelKey: "corporate.opt.exp.light" },
  { value: "Energetic and interactive", labelKey: "corporate.opt.exp.energetic" },
  { value: "Relaxed and low-pressure", labelKey: "corporate.opt.exp.relaxed" },
  { value: "A balance of fun and learning", labelKey: "corporate.opt.exp.balance" },
  { value: "Not sure yet", labelKey: "corporate.opt.exp.notSure" },
];
const MUSIC: Opt[] = [
  { value: "Pop / Top 40", labelKey: "corporate.opt.music.pop" },
  { value: "Classics / throwbacks", labelKey: "corporate.opt.music.classics" },
  { value: "Rock", labelKey: "corporate.opt.music.rock" },
  { value: "Mixed styles", labelKey: "corporate.opt.music.mixed" },
  { value: "No preference", labelKey: "corporate.opt.music.noPref" },
];
const SESSION_LENGTHS: Opt[] = [
  { value: "60 minutes", labelKey: "corporate.opt.length.60" },
  { value: "90 minutes", labelKey: "corporate.opt.length.90" },
  { value: "2 hours", labelKey: "corporate.opt.length.120" },
  { value: "Custom", labelKey: "corporate.opt.length.custom" },
  { value: "Not sure yet", labelKey: "corporate.opt.length.notSure" },
];

type FormState = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  eventType: string;
  preferredDates: string;
  preferredTime: string;
  cityArea: string;
  eventLocation: string;
  groupSize: string;
  teamProfile: string[];
  goals: string[];
  experience: string;
  musicPref: string;
  sessionLength: string;
  specialConsiderations: string;
  additionalInfo: string;
};

const initial: FormState = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  eventType: "",
  preferredDates: "",
  preferredTime: "",
  cityArea: "",
  eventLocation: "",
  groupSize: "",
  teamProfile: [],
  goals: [],
  experience: "",
  musicPref: "",
  sessionLength: "",
  specialConsiderations: "",
  additionalInfo: "",
};

const Corporate = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field as string]) setErrors((e) => ({ ...e, [field as string]: "" }));
  };

  const toggleArr = (field: "teamProfile" | "goals", value: string) => {
    setForm((f) => {
      const exists = f[field].includes(value);
      const next = exists ? f[field].filter((v) => v !== value) : [...f[field], value];
      return { ...f, [field]: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = inquirySchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      toast({ title: t("corporate.toast.invalid.title"), description: t("corporate.toast.invalid.desc"), variant: "destructive" });
      return;
    }
    setErrors({});
    setSending(true);
    try {
      const lines = [
        `Company: ${form.companyName}`,
        `Contact: ${form.contactName}`,
        `Email: ${form.email}`,
        `Phone: ${form.phone}`,
        ``,
        `Event type: ${form.eventType}`,
        `Preferred dates: ${form.preferredDates || "—"}`,
        `Preferred time: ${form.preferredTime || "—"}`,
        `City / Area: ${form.cityArea || "—"}`,
        `Event location: ${form.eventLocation || "—"}`,
        ``,
        `Group size: ${form.groupSize}`,
        `Team profile: ${form.teamProfile.join(", ") || "—"}`,
        ``,
        `Goals: ${form.goals.join(", ") || "—"}`,
        `Experience: ${form.experience || "—"}`,
        `Music preference: ${form.musicPref || "—"}`,
        ``,
        `Session length: ${form.sessionLength || "—"}`,
        `Special considerations: ${form.specialConsiderations || "—"}`,
        ``,
        `Additional info: ${form.additionalInfo || "—"}`,
      ];
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: {
          name: form.contactName,
          email: form.email,
          location: form.cityArea || form.companyName,
          message: lines.join("\n"),
          subject: `Corporate Inquiry – ${form.companyName}`,
        },
      });
      if (error) throw error;

      // Send confirmation email to the inquirer (best-effort)
      try {
        await supabase.functions.invoke("send-corporate-confirmation", {
          body: {
            contactName: form.contactName,
            email: form.email,
            companyName: form.companyName,
            answers: {
              companyName: form.companyName,
              contactName: form.contactName,
              email: form.email,
              phone: form.phone,
              eventType: form.eventType,
              preferredDates: form.preferredDates,
              preferredTime: form.preferredTime,
              cityArea: form.cityArea,
              eventLocation: form.eventLocation,
              groupSize: form.groupSize,
              teamProfile: form.teamProfile,
              goals: form.goals,
              experience: form.experience,
              musicPref: form.musicPref,
              sessionLength: form.sessionLength,
              specialConsiderations: form.specialConsiderations,
              additionalInfo: form.additionalInfo,
            },
          },
        });
      } catch (confirmErr) {
        console.error("Confirmation email failed:", confirmErr);
      }

      toast({
        title: "Inquiry sent!",
        description: "Check your inbox for a confirmation. We'll reach out within 48 hours.",
      });
      setForm(initial);
    } catch (err: any) {
      toast({ title: "Failed to send", description: "Please try again or email us directly.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const valueProps = [
    { icon: Users, title: t("corporate.teamBuilding"), desc: t("corporate.teamBuildingDesc") },
    { icon: Music, title: t("corporate.noExperience"), desc: t("corporate.noExperienceDesc") },
    { icon: Sparkles, title: t("corporate.unforgettable"), desc: t("corporate.unforgettableDesc") },
  ];

  const inputCls =
    "w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";
  const labelCls = "block text-sm font-medium text-foreground mb-1.5";
  const sectionCls = "rounded-2xl border border-border bg-card p-6 md:p-8 mb-6";
  const sectionTitle = "font-heading font-bold text-xl text-foreground mb-5";

  const RadioGroup = ({
    field,
    options,
  }: {
    field: keyof FormState;
    options: Opt[];
  }) => (
    <div className="grid sm:grid-cols-2 gap-2">
      {options.map((opt) => {
        const checked = form[field] === opt.value;
        return (
          <label
            key={opt.value}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer transition-colors ${
              checked ? "border-primary bg-primary/10 text-foreground" : "border-input bg-background text-muted-foreground hover:border-primary/50"
            }`}
          >
            <input
              type="radio"
              name={field as string}
              value={opt.value}
              checked={checked}
              onChange={() => update(field, opt.value as never)}
              className="accent-primary"
            />
            <span>{t(opt.labelKey)}</span>
          </label>
        );
      })}
    </div>
  );

  const CheckGroup = ({
    field,
    options,
  }: {
    field: "teamProfile" | "goals";
    options: Opt[];
  }) => (
    <div className="grid sm:grid-cols-2 gap-2">
      {options.map((opt) => {
        const checked = form[field].includes(opt.value);
        return (
          <label
            key={opt.value}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer transition-colors ${
              checked ? "border-primary bg-primary/10 text-foreground" : "border-input bg-background text-muted-foreground hover:border-primary/50"
            }`}
          >
            <input type="checkbox" checked={checked} onChange={() => toggleArr(field, opt.value)} className="accent-primary" />
            <span>{t(opt.labelKey)}</span>
          </label>
        );
      })}
    </div>
  );

  return (
    <div className="py-12 px-4">
      <PageMeta
        title="Corporate Events – Club Choir"
        description="Book Club Choir for your corporate event, team building, or private function. Unique musical experiences for groups of all sizes."
        path="/corporate"
      />
      <div className="container mx-auto max-w-7xl">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        {/* Hero */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8 mb-8 overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> {t("corporate.title")}
          </div>
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-3 leading-tight">{t("corporate.title")}</h1>
          <p className="text-base md:text-lg text-foreground/80 leading-relaxed">{t("corporate.subtitle")}</p>
        </div>

        {/* About + photo */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 mb-8 overflow-hidden">
          {nightClubPhoto && (
            <img src={nightClubPhoto.wide} alt={nightClubPhoto.alt.en} className="w-full h-auto rounded-xl mb-5 object-cover" loading="lazy" />
          )}
          <h2 className="font-heading font-bold text-2xl text-foreground mb-3">Team-building through music</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            Bring your team together through the power of music. Club Choir offers a unique and engaging team-building experience where colleagues
            connect, collaborate, and create something meaningful together. No singing experience is required — just a willingness to participate and
            have fun.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-3">
            In a single session, your group will learn a song in harmony, building confidence, communication, and a sense of shared accomplishment.
            It's an energizing, low-pressure environment that encourages creativity, laughter, and connection.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Perfect for corporate events, retreats, or team celebrations, Club Choir transforms a group of individuals into a unified voice — because
            the best teams don't just work together, they listen, support, and grow together.
          </p>
        </div>

        {/* Value props */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {valueProps.map((item) => (
            <div key={item.title} className="rounded-2xl border border-border bg-card p-5">
              <item.icon className="w-5 h-5 text-primary mb-2" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <h2 className="font-heading font-bold text-2xl text-foreground mb-6 text-center">Corporate Team Building Inquiry</h2>

          {/* 1. Basic Information */}
          <div className={sectionCls}>
            <h3 className={sectionTitle}>1. Basic Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Company name</label>
                <input className={inputCls} value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
                {errors.companyName && <p className="text-xs text-destructive mt-1">{errors.companyName}</p>}
              </div>
              <div>
                <label className={labelCls}>Contact name</label>
                <input className={inputCls} value={form.contactName} onChange={(e) => update("contactName", e.target.value)} />
                {errors.contactName && <p className="text-xs text-destructive mt-1">{errors.contactName}</p>}
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" className={inputCls} value={form.email} onChange={(e) => update("email", e.target.value)} />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className={labelCls}>Phone number</label>
                <input type="tel" className={inputCls} value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* 2. Event Details */}
          <div className={sectionCls}>
            <h3 className={sectionTitle}>2. Event Details</h3>
            <div className="space-y-5">
              <div>
                <label className={labelCls}>What type of event are you planning?</label>
                <RadioGroup field="eventType" options={EVENT_TYPES} />
                {errors.eventType && <p className="text-xs text-destructive mt-1">{errors.eventType}</p>}
              </div>
              <div>
                <label className={labelCls}>Preferred date(s)</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Dec 15, or 'Not sure yet'"
                  value={form.preferredDates}
                  onChange={(e) => update("preferredDates", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Preferred time of day</label>
                <RadioGroup field="preferredTime" options={TIMES} />
              </div>
              <div>
                <label className={labelCls}>Where are you located? (City / Area)</label>
                <input className={inputCls} value={form.cityArea} onChange={(e) => update("cityArea", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Event location</label>
                <RadioGroup field="eventLocation" options={EVENT_LOCATIONS} />
              </div>
            </div>
          </div>

          {/* 3. Group Size & Profile */}
          <div className={sectionCls}>
            <h3 className={sectionTitle}>3. Group Size & Profile</h3>
            <div className="space-y-5">
              <div>
                <label className={labelCls}>How many participants?</label>
                <RadioGroup field="groupSize" options={GROUP_SIZES} />
                {errors.groupSize && <p className="text-xs text-destructive mt-1">{errors.groupSize}</p>}
              </div>
              <div>
                <label className={labelCls}>Describe your team (select all that apply)</label>
                <CheckGroup field="teamProfile" options={TEAM_PROFILE} />
              </div>
            </div>
          </div>

          {/* 4. Goals & Outcomes */}
          <div className={sectionCls}>
            <h3 className={sectionTitle}>4. Goals & Outcomes</h3>
            <label className={labelCls}>What are your main goals for this event? (select up to 3)</label>
            <CheckGroup field="goals" options={GOALS} />
            {errors.goals && <p className="text-xs text-destructive mt-1">{errors.goals}</p>}
          </div>

          {/* 5. Experience Preferences */}
          <div className={sectionCls}>
            <h3 className={sectionTitle}>5. Experience Preferences</h3>
            <div className="space-y-5">
              <div>
                <label className={labelCls}>What kind of experience are you looking for?</label>
                <RadioGroup field="experience" options={EXPERIENCES} />
              </div>
              <div>
                <label className={labelCls}>Music preferences (optional)</label>
                <RadioGroup field="musicPref" options={MUSIC} />
              </div>
            </div>
          </div>

          {/* 6. Logistics */}
          <div className={sectionCls}>
            <h3 className={sectionTitle}>6. Logistics</h3>
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Session length preference</label>
                <RadioGroup field="sessionLength" options={SESSION_LENGTHS} />
              </div>
              <div>
                <label className={labelCls}>Will there be any special considerations? (e.g. accessibility, space limitations)</label>
                <textarea
                  rows={3}
                  className={`${inputCls} resize-none`}
                  value={form.specialConsiderations}
                  onChange={(e) => update("specialConsiderations", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 7. Additional Information */}
          <div className={sectionCls}>
            <h3 className={sectionTitle}>7. Additional Information</h3>
            <label className={labelCls}>Is there anything else we should know about your team or event?</label>
            <textarea
              rows={4}
              className={`${inputCls} resize-none`}
              value={form.additionalInfo}
              onChange={(e) => update("additionalInfo", e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-warm text-primary-foreground font-semibold shadow hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-60 disabled:pointer-events-none"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? "Sending..." : "Send Inquiry"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Have questions?{" "}
          <a href="mailto:ailsa@clubchoir.ca" className="text-primary font-medium hover:underline">
            ailsa@clubchoir.ca
          </a>
        </p>
      </div>

      <div className="bg-muted/40 mt-12">
        <ChoirFaq
          title="Curious about how Club Choir actually works?"
          subtitle="These are the same questions new singers ask before joining a public session — and they apply to corporate groups too."
        />
      </div>
    </div>
  );
};

export default Corporate;
