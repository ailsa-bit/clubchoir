import PageMeta from "@/components/PageMeta";
import ChoirFaq from "@/components/ChoirFaq";
import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Calendar, MapPin, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAttribution } from "@/lib/attribution";
import { trackLead } from "@/lib/metaPixel";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

type Loc = {
  value: string;
  name: string;
  color: string;
  border: string;
  dot: string;
  ring: string;
  day: { en: string; fr: string };
  venue?: { en: string; fr: string };
};

const LOCATIONS: Loc[] = [
  {
    value: "Montreal – Monday",
    name: "Montreal",
    color: "bg-pink-light",
    border: "border-pink/30",
    dot: "bg-pink",
    ring: "ring-pink",
    day: { en: "Mondays · 7:00–8:30 PM", fr: "Lundis · 19 h – 20 h 30" },
    venue: { en: "Kensington Presbyterian Church", fr: "Kensington Presbyterian Church" },
  },
  {
    value: "Hudson – Monday",
    name: "Hudson",
    color: "bg-orange-light",
    border: "border-orange/30",
    dot: "bg-orange",
    ring: "ring-orange",
    day: { en: "Tuesdays · 7:00–8:30 PM", fr: "Mardis · 19 h – 20 h 30" },
    venue: { en: "The Hudson Legion, 57 Beach Road", fr: "The Hudson Legion, 57 Beach Road" },
  },
  {
    value: "Saint-Hubert – Wednesday",
    name: "Saint-Hubert",
    color: "bg-lime-light",
    border: "border-lime/30",
    dot: "bg-lime",
    ring: "ring-lime",
    day: { en: "Wednesdays · 7:00–8:30 PM", fr: "Mercredis · 19 h – 20 h 30" },
  },
  {
    value: "Pointe-Claire – Thursday",
    name: "Pointe-Claire",
    color: "bg-purple-light",
    border: "border-purple/30",
    dot: "bg-purple",
    ring: "ring-purple",
    day: { en: "Thursdays · 7:00–8:30 PM", fr: "Jeudis · 19 h – 20 h 30" },
  },
];

const makeContactSchema = (t: (k: string) => string) =>
  z.object({
    name: z.string().trim().min(1, t("try.validation.name")).max(100),
    email: z.string().trim().email(t("try.validation.email")).max(255),
    location: z.string().min(1, t("try.validation.location")),
    message: z
      .string()
      .trim()
      .min(1, t("try.validation.message"))
      .max(2000, t("try.validation.messageMax")),
  });

const contactSchema = z.object({
  name: z.string(),
  email: z.string(),
  location: z.string(),
  message: z.string(),
});

type ContactForm = z.infer<typeof contactSchema>;

const TryASession = () => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const isFr = language === "fr";
  const [searchParams] = useSearchParams();

  const prefilledLocation = useMemo(() => {
    const raw = (searchParams.get("location") || "").toLowerCase();
    if (!raw) return "";
    const match = LOCATIONS.find((l) => l.value.toLowerCase().startsWith(raw));
    return match?.value ?? "";
  }, [searchParams]);

  const form = useForm<ContactForm>({
    resolver: zodResolver(makeContactSchema(t)),
    defaultValues: { name: "", email: "", location: prefilledLocation, message: "" },
  });

  const onSubmit = async (data: ContactForm) => {
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: data,
      });
      if (error) throw error;

      // Record in CRM (best-effort)
      try {
        const cityName = (data.location.split("–")[0] || "").trim();
        const parts = data.name.trim().split(/\s+/);
        const firstName = parts[0] || data.name.trim();
        const lastName = parts.slice(1).join(" ") || "-";
        await supabase.functions.invoke("record-open-house", {
          body: {
            first_name: firstName,
            last_name: lastName,
            email: data.email,
            location: cityName,
            notes: data.message || "",
            attribution: getAttribution(),
            session_label: "try-a-session",
          },
        });
      } catch (recErr) {
        console.warn("record try-a-session failed:", recErr);
      }

      setSent(true);
      trackLead("Try a Session", (data.location.split("–")[0] || "").trim());
      toast({ title: t("try.toast.sent.title"), description: t("try.toast.sent.desc") });
    } catch (err: any) {
      toast({
        title: t("common.something.wrong"),
        description: err.message || t("common.try.again"),
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const back = isFr ? "Retour à l'accueil" : "Back to home";

  return (
    <div className="py-12 px-4">
      <PageMeta
        title="Try a Free Session – Club Choir"
        description="Try a free Club Choir session! No audition, no experience needed. Come sing with us at any of our 4 Quebec locations."
        path="/try"
      />
      <div className="container mx-auto max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {back}
        </Link>

        <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-2 text-center">
          {t("try.title")}
        </h1>
        <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
          {t("try.subtitle")}
        </p>

        {sent ? (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center">
            <h2 className="font-heading font-bold text-2xl text-foreground mb-2">
              {t("try.thanks.title")}
            </h2>
            <p className="text-base text-foreground/80 leading-relaxed">
              {t("try.thanks.desc")}
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Location picker */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-bold text-foreground mb-3">
                      {t("try.location")} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {LOCATIONS.map((loc) => {
                          const selected = field.value === loc.value;
                          return (
                            <button
                              key={loc.value}
                              type="button"
                              onClick={() => field.onChange(loc.value)}
                              className={`text-left rounded-2xl border-2 p-4 transition-all ${loc.color} ${
                                selected
                                  ? `${loc.border} ring-2 ${loc.ring} shadow-md`
                                  : "border-transparent hover:border-border"
                              }`}
                              aria-pressed={selected}
                            >
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className={`w-2.5 h-2.5 rounded-full ${loc.dot}`} />
                                <span className="font-heading font-bold text-foreground">
                                  {loc.name}
                                </span>
                              </div>
                              <p className="text-sm text-foreground/80 flex items-start gap-1.5">
                                <Calendar className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                <span>{loc.day[isFr ? "fr" : "en"]}</span>
                              </p>
                              {loc.venue && (
                                <p className="text-sm text-muted-foreground flex items-start gap-1.5 mt-1">
                                  <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                  <span>{loc.venue[isFr ? "fr" : "en"]}</span>
                                </p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-bold text-foreground mb-1.5">
                      {t("try.name")} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <input
                        {...field}
                        maxLength={100}
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-bold text-foreground mb-1.5">
                      {t("try.email")} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <input
                        {...field}
                        type="email"
                        maxLength={255}
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-bold text-foreground mb-1.5">
                      {t("try.message")}
                    </FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        rows={4}
                        maxLength={2000}
                        placeholder={t("try.messagePlaceholder")}
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={sending}
                className="w-full sm:w-auto px-8 py-6 rounded-full bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90"
              >
                {sending ? (
                  t("try.sending")
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" /> {t("try.send")}
                  </>
                )}
              </Button>
            </form>
          </Form>
        )}
      </div>

      <div className="bg-muted/40 mt-16 -mx-4 px-4 py-2">
        <ChoirFaq
          title={isFr ? "Avant de nous écrire" : "Before you reach out"}
          subtitle={
            isFr
              ? "Les questions les plus fréquentes des personnes qui pensent essayer une session."
              : "The questions we get most often from people thinking about trying a session."
          }
        />
      </div>
    </div>
  );
};

export default TryASession;
