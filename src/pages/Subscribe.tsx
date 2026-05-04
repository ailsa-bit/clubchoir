import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Sparkles, Calendar, Music, PartyPopper, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import PageMeta from "@/components/PageMeta";

const LOCATIONS = ["Montreal", "Arundel", "Saint-Hubert", "Pointe-Claire", "Hudson"];

const makeSchema = (tr: (k: string) => string) =>
  z.object({
    first_name: z.string().trim().min(1, tr("subscribe.firstNameRequired")).max(100),
    last_name: z.string().trim().max(100).optional(),
    email: z.string().trim().email(tr("subscribe.validEmail")).max(255),
    locations: z.array(z.string()).min(1, tr("subscribe.selectLocation")).max(10),
  });

const Subscribe = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const isFR = language === "fr";

  const t = {
    title: isFR ? "Restez informé avec Club Choir" : "Stay in the loop with Club Choir",
    subtitle: isFR
      ? "Inscrivez-vous à notre liste pour recevoir les nouvelles, les événements et les inscriptions anticipées — aucune obligation."
      : "Join our mailing list for news, events, and early registration — no commitment, no account required.",
    whatYouGet: isFR ? "Ce que vous recevrez" : "What you'll get",
    benefit1: isFR ? "Les dernières nouvelles sur les événements Club Choir" : "The latest information on Club Choir events",
    benefit2: isFR ? "Inscriptions anticipées et aperçu des chansons de la prochaine session" : "Early registration emails so you can preview the songs in the new session",
    benefit3: isFR ? "Invitations aux journées portes ouvertes et chorales pop-up estivales" : "Invitations to open houses and pop-up summer choir events",
    firstName: isFR ? "Prénom" : "First name",
    lastName: isFR ? "Nom (facultatif)" : "Last name (optional)",
    emailLabel: isFR ? "Adresse courriel" : "Email address",
    locationsLabel: isFR ? "Lieux qui vous intéressent" : "Locations you're interested in",
    locationsHelp: isFR ? "Sélectionnez tous ceux qui s'appliquent" : "Select all that apply",
    submit: isFR ? "M'inscrire à la liste" : "Add me to the list",
    submitting: isFR ? "Envoi en cours..." : "Submitting...",
    successTitle: isFR ? "Bienvenue à bord ! 🎉" : "You're on the list! 🎉",
    successDesc: isFR
      ? "Surveillez votre boîte de réception — un courriel de bienvenue est en route."
      : "Check your inbox — a welcome email is on its way.",
    backHome: isFR ? "Retour à l'accueil" : "Back to home",
    privacy: isFR
      ? "Nous n'utiliserons votre courriel que pour les nouvelles de Club Choir. Désinscription en tout temps."
      : "We'll only use your email for Club Choir updates. Unsubscribe anytime.",
  };

  const toggleLocation = (loc: string) => {
    setSelected((prev) => (prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse({
      first_name: firstName,
      last_name: lastName || undefined,
      email,
      locations: selected,
    });

    if (!result.success) {
      toast({
        title: isFR ? "Vérifiez le formulaire" : "Please check the form",
        description: result.error.issues[0]?.message || "Invalid input",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        first_name: result.data.first_name,
        last_name: result.data.last_name || null,
        email: result.data.email.toLowerCase(),
        locations: result.data.locations,
      };

      const { error } = await supabase.from("prospects").insert(payload);

      if (error) {
        // Duplicate email -> still treat as success (idempotent UX)
        if (error.code === "23505") {
          setDone(true);
          return;
        }
        throw error;
      }

      // Fire-and-forget notification + welcome email
      supabase.functions.invoke("notify-prospect-signup", { body: payload }).catch((err) =>
        console.error("notify-prospect-signup failed:", err),
      );

      setDone(true);
    } catch (err: any) {
      console.error("Subscribe error:", err);
      toast({
        title: isFR ? "Une erreur est survenue" : "Something went wrong",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <PageMeta
        title={isFR ? "S'inscrire à la liste – Club Choir" : "Join the mailing list – Club Choir"}
        description={t.subtitle}
        path="/subscribe"
      />

      <section className="bg-gradient-hero py-16 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-4">
            <Mail className="w-7 h-7" />
          </div>
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-3">{t.title}</h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto">{t.subtitle}</p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          {done ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="font-heading font-bold text-2xl text-foreground mb-2">{t.successTitle}</h2>
              <p className="text-muted-foreground mb-6">{t.successDesc}</p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                {t.backHome}
              </Link>
            </div>
          ) : (
            <>
              {/* Benefits */}
              <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm">
                <h2 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  {t.whatYouGet}
                </h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-sm text-foreground">
                    <Calendar className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span>{t.benefit1}</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-foreground">
                    <Music className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span>{t.benefit2}</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-foreground">
                    <PartyPopper className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span>{t.benefit3}</span>
                  </li>
                </ul>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-semibold text-foreground mb-1.5">
                      {t.firstName} <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="first_name"
                      type="text"
                      required
                      maxLength={100}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label htmlFor="last_name" className="block text-sm font-semibold text-foreground mb-1.5">
                      {t.lastName}
                    </label>
                    <input
                      id="last_name"
                      type="text"
                      maxLength={100}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-1.5">
                    {t.emailLabel} <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    maxLength={255}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    {t.locationsLabel} <span className="text-destructive">*</span>
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">{t.locationsHelp}</p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {LOCATIONS.map((loc) => {
                      const checked = selected.includes(loc);
                      return (
                        <label
                          key={loc}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                            checked
                              ? "border-primary bg-primary/5"
                              : "border-input bg-background hover:bg-muted"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleLocation(loc)}
                            className="w-4 h-4 accent-primary"
                          />
                          <span className="text-sm font-medium text-foreground">{loc}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold shadow hover:shadow-lg hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? t.submitting : t.submit}
                </button>

                <p className="text-xs text-muted-foreground text-center">{t.privacy}</p>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Subscribe;
