import PageMeta from "@/components/PageMeta";
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
  name: z.string().trim().min(1, "Name is required").max(100),
  company: z.string().trim().min(1, "Company is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  eventType: z.string().trim().min(1, "Please select an event type"),
  message: z.string().trim().max(1000).optional(),
});

const Corporate = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: "", company: "", email: "", eventType: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  const eventTypes = [
    t("corporate.eventTypes.teamBuilding"),
    t("corporate.eventTypes.holiday"),
    t("corporate.eventTypes.conference"),
    t("corporate.eventTypes.launch"),
    t("corporate.eventTypes.private"),
    t("corporate.eventTypes.other"),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = inquirySchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: {
          name: form.name,
          email: form.email,
          location: form.company,
          message: `Event Type: ${form.eventType}\n\n${form.message || "No additional message."}`,
          subject: `Corporate Inquiry from ${form.company}`,
        },
      });
      if (error) throw error;
      toast({ title: "Inquiry sent!", description: "We'll be in touch soon." });
      setForm({ name: "", company: "", email: "", eventType: "", message: "" });
    } catch (err: any) {
      toast({ title: "Failed to send", description: "Please try again or email us directly.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  const valueProps = [
    { icon: Users, title: t("corporate.teamBuilding"), desc: t("corporate.teamBuildingDesc") },
    { icon: Music, title: t("corporate.noExperience"), desc: t("corporate.noExperienceDesc") },
    { icon: Sparkles, title: t("corporate.unforgettable"), desc: t("corporate.unforgettableDesc") },
  ];

  const formFields = [
    { field: "name", label: t("corporate.yourName"), type: "text" },
    { field: "company", label: t("corporate.company"), type: "text" },
    { field: "email", label: t("corporate.email"), type: "email" },
  ];

  return (
    <div className="py-12 px-4">
      <PageMeta title="Corporate Events – Club Choir" description="Book Club Choir for your corporate event, team building, or private function. Unique musical experiences for groups of all sizes." path="/corporate" />
      <div className="container mx-auto max-w-7xl">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        {/* Hero */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8 mb-8 overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> {t("corporate.title")}
          </div>
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-3 leading-tight">
            {t("corporate.title")}
          </h1>
          <p className="text-base md:text-lg text-foreground/80 leading-relaxed">
            {t("corporate.subtitle")}
          </p>
        </div>

        {/* About + photo */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 mb-8 overflow-hidden">
          {nightClubPhoto && (
            <img
              src={nightClubPhoto.wide}
              alt={nightClubPhoto.alt.en}
              className="w-full h-auto rounded-xl mb-5 object-cover"
              loading="lazy"
            />
          )}
          <h2 className="font-heading font-bold text-2xl text-foreground mb-3">
            Team-building through music
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            Bring your team together through the power of music. Club Choir offers a unique and engaging team-building experience where colleagues connect, collaborate, and create something meaningful together. No singing experience is required — just a willingness to participate and have fun.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-3">
            In a single session, your group will learn a song in harmony, building confidence, communication, and a sense of shared accomplishment. It's an energizing, low-pressure environment that encourages creativity, laughter, and connection.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Perfect for corporate events, retreats, or team celebrations, Club Choir transforms a group of individuals into a unified voice — because the best teams don't just work together, they listen, support, and grow together.
          </p>
        </div>

        {/* Value props */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {valueProps.map((item) => (
            <div key={item.title} className="rounded-2xl border border-border bg-card p-5">
              <item.icon className="w-5 h-5 text-primary mb-2" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                {item.title}
              </p>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 mb-8">
          <h2 className="font-heading font-bold text-2xl text-foreground mb-6 text-center">
            {t("corporate.getInTouch")}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
            {formFields.map(({ field, label, type }) => (
              <div key={field}>
                <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
                <input
                  type={type}
                  value={form[field as keyof typeof form]}
                  onChange={(e) => update(field, e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={label}
                />
                {errors[field] && <p className="text-xs text-destructive mt-1">{errors[field]}</p>}
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t("corporate.eventType")}</label>
              <select
                value={form.eventType}
                onChange={(e) => update("eventType", e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{t("corporate.selectEvent")}</option>
                {eventTypes.map((tp) => (
                  <option key={tp} value={tp}>{tp}</option>
                ))}
              </select>
              {errors.eventType && <p className="text-xs text-destructive mt-1">{errors.eventType}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t("corporate.messageOpt")}</label>
              <textarea
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder={t("corporate.messagePlaceholder")}
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-warm text-primary-foreground font-semibold shadow hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-60 disabled:pointer-events-none"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? t("corporate.sending") : t("corporate.send")}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Have questions?{" "}
          <a href="mailto:ailsa@clubchoir.ca" className="text-primary font-medium hover:underline">
            ailsa@clubchoir.ca
          </a>
        </p>
      </div>
    </div>
  );
};

export default Corporate;
