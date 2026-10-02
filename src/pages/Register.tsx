import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, AlertCircle, Calendar } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import ChoirFaq from "@/components/ChoirFaq";
import { supabase } from "@/integrations/supabase/client";
import { getAttribution } from "@/lib/attribution";
import { trackViewContent, trackCompleteRegistration } from "@/lib/metaPixel";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

type Loc = {
  name: string;
  color: string;
  border: string;
  dot: string;
  ring: string;
};

const LOCATIONS: Loc[] = [
  {
    name: "Montreal",
    color: "bg-pink-light",
    border: "border-pink/30",
    dot: "bg-pink",
    ring: "ring-pink",
  },
  {
    name: "Hudson",
    color: "bg-orange-light",
    border: "border-orange/30",
    dot: "bg-orange",
    ring: "ring-orange",
  },
  {
    name: "Saint-Hubert",
    color: "bg-lime-light",
    border: "border-lime/30",
    dot: "bg-lime",
    ring: "ring-lime",
  },
  {
    name: "Pointe-Claire",
    color: "bg-purple-light",
    border: "border-purple/30",
    dot: "bg-purple",
    ring: "ring-purple",
  },
];

const Register = () => {
  const { language, t: tr } = useLanguage();
  const isFr = language === "fr";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [emailConsent, setEmailConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<null | { kind: "success" | "already"; returning: boolean }>(null);
  const viewContentFired = useRef(false);

  useEffect(() => {
    if (viewContentFired.current) return;
    viewContentFired.current = true;
    trackViewContent("Winter/Spring 2027 Early Registration Page");
  }, []);

  const t = {
    title: isFr ? "Inscription anticipée — Hiver/Printemps 2027" : "Early Registration — Winter/Spring 2027",
    subtitle: isFr
      ? "Nous n'acceptons plus de nouveaux membres pour la session automne/hiver 2026."
      : "We are no longer accepting new members for the Fall/Winter 2026 session.",
    introTitle: isFr ? "Un endroit accueillant pour chanter" : "A welcoming place to sing",
    intro: isFr
      ? "Club Choir est une chorale communautaire chaleureuse et sans audition pour les adultes qui aiment chanter. Notre prochaine session commencera vers la fin de février 2027; l'horaire reste à déterminer. Inscrivez-vous maintenant pour être parmi les premières personnes à recevoir tous les détails dès qu'ils seront annoncés."
      : "Club Choir is a warm, no-audition community choir for adults who love to sing. Our next session will begin near the end of February 2027, with the schedule still to be determined. Register now to be among the first to receive full details as soon as they are announced.",
    reassurances: isFr ? ["Aucune audition", "Pas besoin de lire la musique", "Venez comme vous êtes"] : ["No audition", "No music reading required", "Come as you are"],
    feeNote: isFr
      ? "Début prévu : fin février 2027 · Horaire et tarif à déterminer"
      : "Expected start: late February 2027 · Schedule and fee to be determined",
    first: isFr ? "Prénom" : "First name",
    last: isFr ? "Nom" : "Last name",
    email: "Courriel",
    chooseLocation: isFr ? "Choisissez votre lieu préféré" : "Choose your preferred location",
    optionalMessage: isFr ? "Message (facultatif)" : "Message (optional)",
    submit: isFr ? "Faire une inscription anticipée" : "Join early registration",
    submitting: isFr ? "Envoi..." : "Submitting...",
    back: isFr ? "Retour à l'accueil" : "Back to home",
    fillFields: isFr ? "Veuillez remplir tous les champs requis." : "Please fill in all required fields.",
    invalidEmail: isFr ? "Courriel invalide." : "Invalid email.",
    pickLocation: isFr ? "Veuillez choisir une chorale." : "Please choose a location.",
    errorTitle: isFr ? "Oups" : "Oops",
    errorDesc: isFr ? "Quelque chose s'est mal passé. Veuillez réessayer." : "Something went wrong. Please try again.",
    successTitleNew: isFr ? "Vous êtes sur la liste !" : "You're on the early list!",
    successTitleReturning: isFr ? "Nous avons hâte de vous retrouver !" : "We look forward to singing with you again!",
    successDesc: isFr
      ? "Votre inscription anticipée pour l'hiver/printemps 2027 est reçue. Vous serez parmi les premières personnes informées dès que l'horaire et les détails de la nouvelle session seront annoncés."
      : "Your early registration for Winter/Spring 2027 is received. You'll be among the first to hear as soon as the new session schedule and details are announced.",
    alreadyTitle: isFr ? "Vous êtes déjà inscrit·e" : "You're already registered",
    alreadyDesc: isFr
      ? "Nous avons déjà une inscription anticipée pour ce lieu à votre nom. Si vous pensez qu'il s'agit d'une erreur, écrivez-nous."
      : "We already have an early registration for this location under your name. If you think this is a mistake, please get in touch.",
    contact: isFr ? "Écrire à Ailsa" : "Email Ailsa",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fn = firstName.trim();
    const ln = lastName.trim();
    const em = email.trim();
    if (!fn || !ln || !em) {
      toast({ title: t.fillFields, variant: "destructive" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      toast({ title: t.invalidEmail, variant: "destructive" });
      return;
    }
    if (!location) {
      toast({ title: t.pickLocation, variant: "destructive" });
      return;
    }
    if (!acceptTerms || !emailConsent) {
      toast({
        title: isFr
          ? "Veuillez cocher les deux cases pour vous inscrire."
          : "Please check both boxes to register.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("register-session", {
        body: {
          first_name: fn,
          last_name: ln,
          email: em,
          location,
          notes: notes.trim(),
          language,
          attribution: getAttribution(),
          accept_terms: acceptTerms,
          email_consent: emailConsent,
        },
      });
      if (error) throw error;
      if (data?.already_registered) {
        setResult({ kind: "already", returning: !!data.returning_member });
      } else {
        setResult({ kind: "success", returning: !!data?.returning_member });
        trackCompleteRegistration(location, data?.payment_status || "pending");
      }
    } catch (err: any) {
      console.error(err);
      toast({ title: t.errorTitle, description: t.errorDesc, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    const isSuccess = result.kind === "success";
    return (
      <div className="py-16 px-4">
        <PageMeta title={tr("meta.registerDone.title")} description={tr("meta.registerDone.desc")} path="/register" />
        <div className="container mx-auto max-w-6xl">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> {t.back}
          </Link>
          <div className={`rounded-2xl border p-8 ${isSuccess ? "border-primary/30 bg-primary/5" : "border-orange/30 bg-orange-light"}`}>
            <div className="flex items-center gap-3 mb-4">
              {isSuccess ? (
                <CheckCircle2 className="w-8 h-8 text-primary" />
              ) : (
                <AlertCircle className="w-8 h-8 text-orange" />
              )}
              <h1 className="font-heading font-bold text-2xl text-foreground">
                {isSuccess
                  ? (result.returning ? t.successTitleReturning : t.successTitleNew)
                  : t.alreadyTitle}
              </h1>
            </div>
            <p className="text-base text-foreground/80 leading-relaxed mb-6">
              {isSuccess ? t.successDesc : t.alreadyDesc}
            </p>
            {!isSuccess && (
              <a href="mailto:ailsa@clubchoir.ca" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-opacity">
                {t.contact}
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4">
      <PageMeta
        title={tr("meta.register.title")}
        description={tr("meta.register.desc")}
        path="/register"
      />
      <div className="container mx-auto max-w-6xl">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t.back}
        </Link>

        <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-2 text-center">
          {t.title}
        </h1>
        <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
          {t.subtitle}
        </p>

        <section className="rounded-2xl border border-border bg-card px-5 py-6 sm:px-7 mb-8" aria-labelledby="registration-intro-title">
          <h2 id="registration-intro-title" className="font-heading font-bold text-xl text-foreground mb-2">
            {t.introTitle}
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            {t.intro}
          </p>
          <ul className="mt-5 flex flex-wrap gap-2" aria-label={isFr ? "Rassurances" : "Reassurances"}>
            {t.reassurances.map((reassurance) => (
              <li key={reassurance} className="rounded-full bg-muted px-3 py-1.5 text-sm font-semibold text-foreground">
                {reassurance}
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm font-semibold text-foreground">
            {t.feeNote}
          </p>
        </section>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location picker */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-3">
              {t.chooseLocation} <span className="text-destructive">*</span>
            </label>
            <div className="grid sm:grid-cols-2 gap-3">
              {LOCATIONS.map((loc) => {
                const selected = location === loc.name;
                return (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => setLocation(loc.name)}
                    className={`text-left rounded-2xl border-2 p-4 transition-all ${loc.color} ${
                      selected ? `${loc.border} ring-2 ${loc.ring} shadow-md` : "border-transparent hover:border-border"
                    }`}
                    aria-pressed={selected}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${loc.dot}`} />
                      <span className="font-heading font-bold text-foreground">{loc.name}</span>
                    </div>
                    <p className="text-sm text-foreground/80 flex items-start gap-1.5">
                      <Calendar className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>{isFr ? "Fin février 2027 · Horaire à déterminer" : "Late February 2027 · Schedule to be determined"}</span>
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first" className="block text-sm font-bold text-foreground mb-1.5">
                {t.first} <span className="text-destructive">*</span>
              </label>
              <input
                id="first"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                maxLength={100}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="last" className="block text-sm font-bold text-foreground mb-1.5">
                {t.last} <span className="text-destructive">*</span>
              </label>
              <input
                id="last"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                maxLength={100}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-bold text-foreground mb-1.5">
              {t.email} <span className="text-destructive">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-bold text-foreground mb-1.5">
              {t.optionalMessage}
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={2000}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
            <label className="flex items-start gap-3 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 h-5 w-5 shrink-0 accent-primary"
              />
              <span>
                {isFr ? "J'ai lu et j'accepte les " : "I have read and agree to the "}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">
                  {isFr ? "conditions d'utilisation et la politique de remboursement" : "Terms & Conditions and Refund Policy"}
                </a>
                {isFr
                  ? " (remboursement complet avant la semaine 3; aucun remboursement à partir de la semaine 3)."
                  : " (full refund before Week 3; no refunds from Week 3 on)."}
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={emailConsent}
                onChange={(e) => setEmailConsent(e.target.checked)}
                className="mt-1 h-5 w-5 shrink-0 accent-primary"
              />
              <span>
                {isFr
                  ? "J'autorise Club Choir à m'envoyer des courriels, uniquement à des fins liées à Club Choir (horaires, ressources, rappels et nouvelles de la chorale). Mon adresse ne sera jamais partagée ni vendue."
                  : "I give Club Choir permission to email me, for Club Choir purposes only (schedules, song resources, reminders and choir news). My email will never be shared or sold."}
              </span>
            </label>
          </div>


          <Button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-6 rounded-full bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90"
          >
            {submitting ? t.submitting : t.submit}
          </Button>
        </form>
      </div>

      <div className="bg-muted/40 mt-16 -mx-4 px-4 py-2">
        <ChoirFaq
          title={isFr ? "Questions fréquentes" : "Common questions before registering"}
          subtitle={isFr ? "Tout ce que les nouveaux choristes demandent." : "Everything new singers ask before joining a session."}
          includeJsonLd
        />
      </div>
    </div>
  );
};

export default Register;
