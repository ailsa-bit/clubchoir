import PageMeta from "@/components/PageMeta";
import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Calendar, MapPin, Send, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
    value: "Montreal – Monday August 3, 7PM",
    name: "Montreal",
    color: "bg-pink-light",
    border: "border-pink/30",
    dot: "bg-pink",
    ring: "ring-pink",
    day: { en: "Monday, August 3 · 7:00 PM", fr: "Lundi 3 août · 19 h" },
    venue: { en: "Kensington Presbyterian Church", fr: "Kensington Presbyterian Church" },
  },
  {
    value: "Hudson – Tuesday August 4, 7PM",
    name: "Hudson",
    color: "bg-orange-light",
    border: "border-orange/30",
    dot: "bg-orange",
    ring: "ring-orange",
    day: { en: "Tuesday, August 4 · 7:00 PM", fr: "Mardi 4 août · 19 h" },
    venue: { en: "Kingfisher Pub", fr: "Kingfisher Pub" },
  },
  {
    value: "Saint-Hubert – Wednesday August 5, 7PM",
    name: "Saint-Hubert",
    color: "bg-lime-light",
    border: "border-lime/30",
    dot: "bg-lime",
    ring: "ring-lime",
    day: { en: "Wednesday, August 5 · 7:00 PM", fr: "Mercredi 5 août · 19 h" },
    venue: { en: "St-Gabriel Catholic Church, 5070 Rue Gilbert", fr: "Église catholique St-Gabriel, 5070 rue Gilbert" },
  },
  {
    value: "Pointe-Claire – Thursday August 6, 7PM",
    name: "Pointe-Claire",
    color: "bg-purple-light",
    border: "border-purple/30",
    dot: "bg-purple",
    ring: "ring-purple",
    day: { en: "Thursday, August 6 · 7:00 PM", fr: "Jeudi 6 août · 19 h" },
    venue: { en: "Valois United Church, 70 Av. Belmont", fr: "Église unie Valois, 70 av. Belmont" },
  },
];

const makeSchema = (t: (k: string) => string) =>
  z.object({
    name: z.string().trim().min(1, t("try.validation.name")).max(100),
    email: z.string().trim().email(t("try.validation.email")).max(255),
    location: z.string().min(1, t("try.validation.location")),
    message: z.string().trim().max(2000, t("try.validation.messageMax")).optional().default(""),
  });

type FormValues = {
  name: string;
  email: string;
  location: string;
  message: string;
};

const OpenHouseRegister = () => {
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

  const form = useForm<FormValues>({
    resolver: zodResolver(makeSchema(t)),
    defaultValues: { name: "", email: "", location: prefilledLocation, message: "" },
  });

  const onSubmit = async (data: FormValues) => {
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: {
          ...data,
          location: `[Open House] ${data.location}`,
          message:
            (data.message?.trim() ? data.message.trim() + "\n\n" : "") +
            `(Open House registration — ${data.location})`,
        },
      });
      if (error) throw error;

      // Record in CRM (best-effort; don't block success on this)
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
          },
        });
      } catch (recErr) {
        console.warn("record-open-house failed:", recErr);
      }

      setSent(true);
      toast({
        title: isFr ? "Inscription reçue !" : "You're on the list!",
        description: isFr
          ? "Nous vous enverrons une confirmation et les détails par courriel."
          : "We'll email you a confirmation and the details.",
      });
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
  const title = isFr
    ? "Inscription aux portes ouvertes — Août"
    : "Register for Open House — August";
  const subtitle = isFr
    ? "Une soirée gratuite pour découvrir Club Choir près de chez vous. Choisissez la date qui vous convient."
    : "A free evening to discover Club Choir near you. Pick the date that works for you.";

  return (
    <div className="py-12 px-4">
      <PageMeta
        title="Register for the Open House – Club Choir"
        description="Sign up for a free Club Choir Open House evening in August — Montreal, Hudson, Saint-Hubert, or Pointe-Claire."
        path="/open-house"
      />
      <div className="container mx-auto max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {back}
        </Link>

        <div className="flex items-center justify-center gap-2 mb-3 text-primary">
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-wider">
            {isFr ? "Portes ouvertes · Août 2026" : "Open House · August 2026"}
          </span>
        </div>
        <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-2 text-center">
          {title}
        </h1>
        <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
          {subtitle}
        </p>

        {sent ? (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center">
            <h2 className="font-heading font-bold text-2xl text-foreground mb-2">
              {isFr ? "Merci !" : "Thank you!"}
            </h2>
            <p className="text-base text-foreground/80 leading-relaxed">
              {isFr
                ? "Votre inscription est reçue. Nous vous enverrons une confirmation et les détails de la soirée par courriel."
                : "Your spot is saved. We'll email you a confirmation and the details for the evening."}
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
                      {isFr ? "Choisissez votre soirée" : "Choose your evening"}{" "}
                      <span className="text-destructive">*</span>
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
                      {isFr ? "Message (facultatif)" : "Message (optional)"}
                    </FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        rows={3}
                        maxLength={2000}
                        placeholder={
                          isFr
                            ? "Avez-vous des questions ou amenez-vous quelqu'un ?"
                            : "Any questions, or are you bringing someone along?"
                        }
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
                  isFr ? "Envoi..." : "Sending..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />{" "}
                    {isFr ? "Réserver ma place" : "Save my spot"}
                  </>
                )}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
};

export default OpenHouseRegister;
