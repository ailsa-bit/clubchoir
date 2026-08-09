import PageMeta from "@/components/PageMeta";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarDays, Clock, MapPin, CheckCircle2, Music2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAttribution } from "@/lib/attribution";
import { trackLead } from "@/lib/metaPixel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const COPY = {
  en: {
    metaTitle: "Hudson Open House — Club Choir | Tuesday, August 18",
    metaDesc:
      "Come sing with us for one evening. Free Club Choir open house at The Hudson Legion, Tuesday August 18, 2026 at 7:30pm. No auditions, no music reading.",
    kicker: "One evening. No commitment.",
    headline: "Hudson Open House",
    sub: "Come sing with us for one evening.",
    body:
      "Curious about Club Choir? Join us in Hudson for a relaxed open house where you can meet the group, see how rehearsals work, and sing with us for one evening. There are no auditions, no music reading requirements, and no pressure to commit on the spot. It is simply a warm, easy way to see if Club Choir feels like a good fit for your fall.",
    chips: [
      "No auditions",
      "No music reading",
      "All voice types welcome",
      "Friendly adult community choir",
    ],
    detailsTitle: "Event details",
    date: "Tuesday, August 18, 2026",
    time: "7:30pm",
    venue: "The Hudson Legion, 57 Beach Road, Hudson, QC",
    formTitle: "RSVP for the Hudson Open House",
    formHint: "Just so we know to look out for you.",
    name: "Your name",
    email: "Email",
    message: "Message (optional)",
    submit: "RSVP for the Hudson Open House",
    sending: "Sending…",
    confirmTitle: "You're on the list for the Hudson Open House.",
    confirmBody: "We'll send the details by email — keep an eye on your inbox.",
    confirmWhen: "Tuesday, August 18, 2026 · 7:30pm · The Hudson Legion",
    secondary: "Already ready to join?",
    secondaryLink: "Register for the fall session.",
    home: "Back to homepage",
    vName: "Please enter your name",
    vEmail: "Please enter a valid email",
    errTitle: "Something went wrong",
    errBody: "Please try again, or email ailsa@clubchoir.ca.",
  },
  fr: {
    metaTitle: "Portes ouvertes à Hudson — Club Choir | Mardi 18 août",
    metaDesc:
      "Venez chanter avec nous le temps d'une soirée. Portes ouvertes du Club Choir à la Légion de Hudson, mardi 18 août 2026, 19 h 30. Sans audition.",
    kicker: "Une soirée. Aucun engagement.",
    headline: "Portes ouvertes à Hudson",
    sub: "Venez chanter avec nous le temps d'une soirée.",
    body:
      "Curieux de découvrir le Club Choir ? Joignez-vous à nous à Hudson pour une soirée portes ouvertes toute simple : rencontrez le groupe, voyez comment se déroulent nos répétitions et chantez avec nous. Aucune audition, aucune lecture de musique nécessaire et aucune pression pour vous inscrire sur place. C'est simplement une belle façon de voir si le Club Choir vous convient cet automne.",
    chips: [
      "Sans audition",
      "Aucune lecture de musique",
      "Toutes les voix bienvenues",
      "Chorale communautaire pour adultes",
    ],
    detailsTitle: "Détails de la soirée",
    date: "Mardi 18 août 2026",
    time: "19 h 30",
    venue: "La Légion de Hudson, 57 Beach Road, Hudson (QC)",
    formTitle: "Réservez votre place aux portes ouvertes",
    formHint: "Pour qu'on sache vous attendre.",
    name: "Votre nom",
    email: "Courriel",
    message: "Message (facultatif)",
    submit: "Je réserve ma place",
    sending: "Envoi…",
    confirmTitle: "Votre place est réservée pour les portes ouvertes à Hudson.",
    confirmBody: "Nous vous enverrons tous les détails par courriel.",
    confirmWhen: "Mardi 18 août 2026 · 19 h 30 · La Légion de Hudson",
    secondary: "Prêt à vous joindre à nous ?",
    secondaryLink: "Inscrivez-vous à la session d'automne.",
    home: "Retour à l'accueil",
    vName: "Veuillez entrer votre nom",
    vEmail: "Veuillez entrer un courriel valide",
    errTitle: "Une erreur est survenue",
    errBody: "Veuillez réessayer ou écrire à ailsa@clubchoir.ca.",
  },
} as const;

type FormValues = {
  name: string;
  email: string;
  message: string;
};

const HudsonOpenHouse = ({ lang = "en" }: { lang?: "en" | "fr" }) => {
  const c = COPY[lang];
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const schema = z.object({
    name: z.string().trim().min(1, c.vName).max(100),
    email: z.string().trim().email(c.vEmail).max(255),
    message: z.string().trim().max(2000).optional().default(""),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", message: "" },
  });

  const onSubmit = async (data: FormValues) => {
    setSending(true);
    try {
      const parts = data.name.trim().split(/\s+/);
      const notes = [
        "Hudson Open House — Tuesday, August 18, 2026, 7:30pm (The Hudson Legion)",
        data.message.trim() ? `Message: ${data.message.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const { data: res, error } = await supabase.functions.invoke("record-open-house", {
        body: {
          first_name: parts[0] || data.name.trim(),
          last_name: parts.slice(1).join(" ") || "-",
          email: data.email,
          location: "Hudson",
          notes,
          attribution: getAttribution(),
        },
      });
      if (error) throw error;
      if ((res as any)?.error) throw new Error((res as any).error);

      setSent(true);
      trackLead("Hudson Open House RSVP", "Hudson");
    } catch (err: any) {
      toast({
        title: c.errTitle,
        description: err?.message || c.errBody,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const details = (
    <div className="grid gap-3 sm:grid-cols-3">
      {[
        { icon: CalendarDays, text: c.date },
        { icon: Clock, text: c.time },
        { icon: MapPin, text: c.venue },
      ].map(({ icon: Icon, text }, i) => (
        <div key={i} className="flex items-start gap-3 rounded-xl bg-background/70 border border-border p-4">
          <Icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <span className="text-sm font-medium text-foreground leading-snug">{text}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-secondary/30">
      <PageMeta
        title={c.metaTitle}
        description={c.metaDesc}
        path={lang === "fr" ? "/fr/hudson-open-house" : "/hudson-open-house"}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Event",
          name: "Club Choir Hudson Open House",
          startDate: "2026-08-18T19:30:00-04:00",
          eventStatus: "https://schema.org/EventScheduled",
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          location: {
            "@type": "Place",
            name: "The Hudson Legion",
            address: {
              "@type": "PostalAddress",
              streetAddress: "57 Beach Road",
              addressLocality: "Hudson",
              addressRegion: "QC",
              addressCountry: "CA",
            },
          },
          organizer: { "@type": "Organization", name: "Club Choir", url: "https://clubchoir.ca" },
        }}
      />

      <section className="px-4 pt-14 pb-10">
        <div className="container mx-auto max-w-6xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-light text-foreground px-4 py-1.5 text-xs font-semibold tracking-wide uppercase">
            <Music2 className="w-3.5 h-3.5" />
            {c.kicker}
          </span>
          <h1 className="font-heading font-bold text-4xl sm:text-5xl text-foreground mt-5">
            {c.headline}
          </h1>
          <p className="font-heading text-xl sm:text-2xl text-primary mt-3">{c.sub}</p>
          <p className="text-muted-foreground leading-relaxed mt-5 text-base sm:text-lg max-w-3xl mx-auto">
            {c.body}
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {c.chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-10">
        <div className="container mx-auto max-w-6xl rounded-2xl border border-border bg-card p-6">
          <h2 className="font-heading font-bold text-lg text-foreground mb-4">{c.detailsTitle}</h2>
          {details}
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="container mx-auto max-w-6xl rounded-2xl border border-border bg-card p-6 sm:p-8">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="font-heading font-bold text-2xl text-foreground mb-2">
                {c.confirmTitle}
              </h2>
              <p className="text-muted-foreground mb-4">{c.confirmBody}</p>
              <p className="text-sm font-medium text-foreground">{c.confirmWhen}</p>
              <div className="mt-6">
                <Button asChild variant="outline">
                  <Link to="/">{c.home}</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="font-heading font-bold text-2xl text-foreground">{c.formTitle}</h2>
              <p className="text-sm text-muted-foreground mt-1 mb-6">{c.formHint}</p>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{c.name}</FormLabel>
                        <FormControl>
                          <Input autoComplete="name" {...field} />
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
                        <FormLabel>{c.email}</FormLabel>
                        <FormControl>
                          <Input type="email" autoComplete="email" {...field} />
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
                        <FormLabel>{c.message}</FormLabel>
                        <FormControl>
                          <Textarea rows={4} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" size="lg" className="w-full" disabled={sending}>
                    {sending ? c.sending : c.submit}
                  </Button>
                </form>
              </Form>
            </>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            {c.secondary}{" "}
            <Link to="/register" className="underline underline-offset-4 hover:text-foreground">
              {c.secondaryLink}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
};

export default HudsonOpenHouse;
