import PageMeta from "@/components/PageMeta";
import ChoirFaq from "@/components/ChoirFaq";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Music, Send, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackLead } from "@/lib/metaPixel";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { TRIAL_LOCATIONS, formatNight, timeForNight } from "@/data/trialNights";

const todayIso = () => new Date().toISOString().slice(0, 10);

const TryASession = () => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();
  const isFr = language === "fr";
  const [searchParams] = useSearchParams();

  const preset = (searchParams.get("location") || "").toLowerCase();
  const [locationName, setLocationName] = useState<string>(
    TRIAL_LOCATIONS.find((l) => l.name.toLowerCase() === preset)?.name ?? "",
  );
  const [dateIso, setDateIso] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const loc = TRIAL_LOCATIONS.find((l) => l.name === locationName);
  const upcoming = (loc?.nights ?? []).filter((n) => n.date >= todayIso());
  const chosen = upcoming.find((n) => n.date === dateIso);

  const t = {
    title: isFr ? "Essayez une soirée — gratuitement" : "Try a session — free",
    subtitle: isFr
      ? "Venez chanter avec nous une soirée et voyez si Club Choir vous convient."
      : "Come sing with us for one evening and see if Club Choir is the right fit for you.",
    intro: isFr
      ? "Venez découvrir comment ça se passe ! Chaque semaine, nous apprenons une nouvelle chanson — et nous vous fournissons tout ce qu'il faut pour l'apprendre : paroles, enregistrements et tout le reste. Pas de souci, on vous guide pas à pas. Choisissez le lieu qui vous convient et venez chanter avec nous !"
      : "Come see what it's all about! Every week we learn a brand-new song together — and we provide everything you need to learn it: lyrics, recordings, the works. No experience needed, we'll take you through it step by step. Just pick the location that works for you and come sing!",
    noPressure: isFr
      ? "Aucune pression pour vous engager. Venez l'esprit ouvert — nous formons un groupe très chaleureux et nous avons hâte de vous rencontrer."
      : "There is no pressure to commit. Come with an open mind — we are a very friendly group and we look forward to meeting you.",
    step1: isFr ? "1. Choisissez un lieu" : "1. Choose a location",
    step2: isFr ? "2. Choisissez votre soirée" : "2. Choose your evening",
    step3: isFr ? "3. Vos coordonnées" : "3. Your details",
    pickLocationFirst: isFr ? "Choisissez d'abord un lieu." : "Choose a location first.",
    first: isFr ? "Prénom" : "First name",
    last: isFr ? "Nom" : "Last name",
    email: "Courriel",
    message: isFr ? "Message (facultatif)" : "Message (optional)",
    submit: isFr ? "Ajoutez-moi à la liste d'invités" : "Add me to the guest list",
    sending: isFr ? "Envoi..." : "Sending...",
    back: isFr ? "Retour à l'accueil" : "Back to home",
    thanksTitle: isFr ? "Vous êtes sur la liste d'invités ! 🎶" : "You're on the guest list! 🎶",
  };

  const valid = loc && chosen && firstName.trim() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      toast({
        title: isFr ? "Information manquante" : "Missing information",
        description: isFr
          ? "Choisissez un lieu, une soirée, et entrez votre prénom et votre courriel."
          : "Please choose a location and an evening, and enter your first name and email.",
        variant: "destructive",
      });
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("book-trial-night", {
        body: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          location: loc!.name,
          session_date: chosen!.date,
          week: chosen!.week,
          song: `${chosen!.song} — ${chosen!.artist}`,
          notes: notes.trim(),
          language,
        },
      });
      if (error) throw error;
      setSent(true);
      trackLead("Try a Session", loc!.name);
    } catch (err: any) {
      toast({
        title: isFr ? "Un problème est survenu" : "Something went wrong",
        description: err?.message || (isFr ? "Veuillez réessayer." : "Please try again."),
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="py-12 px-4">
      <PageMeta title={t.title} description={t.subtitle} path="/try" />
      <div className="container mx-auto max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {t.back}
        </Link>

        <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-2 text-center">{t.title}</h1>
        <p className="text-center text-muted-foreground mb-4 max-w-xl mx-auto">{t.subtitle}</p>

        {sent ? (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center">
            <h2 className="font-heading font-bold text-2xl text-foreground mb-3">{t.thanksTitle}</h2>
            <p className="text-base text-foreground/80 leading-relaxed">
              {isFr
                ? `Nous vous attendons à ${loc?.name} le ${formatNight(chosen!.date, true)}, ${timeForNight(loc!, chosen!.week)} — nous apprendrons « ${chosen!.song} » de ${chosen!.artist}. Un courriel de confirmation avec tous les détails (lieu, date, chanson) vient de vous être envoyé.`
                : `We'll see you in ${loc?.name} on ${formatNight(chosen!.date, false)}, ${timeForNight(loc!, chosen!.week)} — we'll be learning "${chosen!.song}" by ${chosen!.artist}. A confirmation email with all the details (location, date and song) is on its way.`}
            </p>
            <p className="text-sm text-foreground/70 mt-4">{t.noPressure}</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-border bg-muted/30 p-5 mb-8 space-y-3">
              <p className="text-sm text-foreground/80 leading-relaxed">{t.intro}</p>
              <p className="text-sm text-foreground/80 leading-relaxed font-semibold">{t.noPressure}</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-8">
              {/* Step 1 — location */}
              <div>
                <h2 className="font-heading font-bold text-lg text-foreground mb-3">{t.step1}</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {TRIAL_LOCATIONS.map((l) => {
                    const selected = l.name === locationName;
                    return (
                      <button
                        key={l.name}
                        type="button"
                        onClick={() => {
                          setLocationName(l.name);
                          setDateIso("");
                        }}
                        aria-pressed={selected}
                        className={`text-left rounded-2xl border-2 p-4 transition-all ${l.color} ${
                          selected ? `${l.border} ring-2 ${l.ring} shadow-md` : "border-transparent hover:border-border"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${l.dot}`} />
                          <span className="font-heading font-bold text-foreground">{l.name}</span>
                        </div>
                        <p className="text-sm text-foreground/80 flex items-start gap-1.5">
                          <Calendar className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          <span>{l.day[isFr ? "fr" : "en"]} · {l.time}</span>
                        </p>
                        <p className="text-sm text-muted-foreground flex items-start gap-1.5 mt-1">
                          <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          <span>{l.venue}</span>
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2 — evening */}
              <div>
                <h2 className="font-heading font-bold text-lg text-foreground mb-3">{t.step2}</h2>
                {!loc ? (
                  <p className="text-sm text-muted-foreground">{t.pickLocationFirst}</p>
                ) : upcoming.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {isFr ? "Aucune soirée d'essai restante à cet endroit." : "No trial evenings left at this location."}
                  </p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {upcoming.map((n) => {
                      const selected = n.date === dateIso;
                      return (
                        <button
                          key={n.date}
                          type="button"
                          onClick={() => setDateIso(n.date)}
                          aria-pressed={selected}
                          className={`text-left rounded-xl border-2 p-4 transition-all bg-card ${
                            selected ? "border-primary ring-2 ring-primary/40 shadow-md" : "border-border hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-muted-foreground">
                              {isFr ? `Semaine ${n.week}` : `Week ${n.week}`}
                            </span>
                            {selected && <Check className="w-4 h-4 text-primary" />}
                          </div>
                          <div className="font-heading font-bold text-foreground mt-1">{formatNight(n.date, isFr)}</div>
                          <div className="text-xs text-muted-foreground">{timeForNight(loc, n.week)}</div>
                          <p className="text-sm text-foreground/80 flex items-start gap-1.5 mt-2">
                            <Music className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <span>
                              <strong>{n.song}</strong> — {n.artist}
                            </span>
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Step 3 — details */}
              <div className="space-y-4">
                <h2 className="font-heading font-bold text-lg text-foreground">{t.step3}</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="block text-sm font-bold text-foreground mb-1.5">
                      {t.first} <span className="text-destructive">*</span>
                    </span>
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      maxLength={100}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </label>
                  <label className="block">
                    <span className="block text-sm font-bold text-foreground mb-1.5">{t.last}</span>
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      maxLength={100}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="block text-sm font-bold text-foreground mb-1.5">
                    {t.email} <span className="text-destructive">*</span>
                  </span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    maxLength={255}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-bold text-foreground mb-1.5">{t.message}</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </label>
              </div>

              <Button
                type="submit"
                disabled={sending}
                className="w-full sm:w-auto px-8 py-6 rounded-full bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90"
              >
                {sending ? t.sending : (<><Send className="w-4 h-4 mr-2" /> {t.submit}</>)}
              </Button>
            </form>
          </>
        )}
      </div>

      <div className="bg-muted/40 mt-16 -mx-4 px-4 py-2">
        <ChoirFaq
          title={isFr ? "Avant de venir" : "Before you come"}
          subtitle={
            isFr
              ? "Les questions les plus fréquentes des personnes qui pensent essayer une soirée."
              : "The questions we get most often from people thinking about trying an evening."
          }
        />
      </div>
    </div>
  );
};

export default TryASession;
