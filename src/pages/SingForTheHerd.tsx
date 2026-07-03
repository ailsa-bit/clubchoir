import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Calendar, Heart, Ticket, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import ahtLogo from "@/assets/aht-logo.png.asset.json";

const PRICE_ADULT = 20;
const PRICE_CHILD_6_10 = 10;
const PRICE_FAMILY = 50;

const Counter = ({
  value, onChange, max = 20, disabled = false,
}: { value: number; onChange: (n: number) => void; max?: number; disabled?: boolean }) => (
  <div className="inline-flex items-center gap-2">
    <button
      type="button"
      disabled={disabled || value <= 0}
      onClick={() => onChange(Math.max(0, value - 1))}
      className="w-9 h-9 rounded-full border-2 border-border bg-background font-bold text-lg text-foreground hover:border-purple/60 disabled:opacity-40 disabled:cursor-not-allowed"
      aria-label="Decrease"
    >−</button>
    <span className="w-8 text-center font-heading font-bold text-lg tabular-nums">{value}</span>
    <button
      type="button"
      disabled={disabled || value >= max}
      onClick={() => onChange(Math.min(max, value + 1))}
      className="w-9 h-9 rounded-full border-2 border-border bg-background font-bold text-lg text-foreground hover:border-purple/60 disabled:opacity-40 disabled:cursor-not-allowed"
      aria-label="Increase"
    >+</button>
  </div>
);

const SingForTheHerd = () => {
  const { language } = useLanguage();
  const isFr = language === "fr";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [adults, setAdults] = useState(0);
  const [children6to10, setChildren6to10] = useState(0);
  const [childrenUnder6, setChildrenUnder6] = useState(0);
  const [familyPasses, setFamilyPasses] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState<"form" | "review">("form");

  const total =
    adults * PRICE_ADULT +
    children6to10 * PRICE_CHILD_6_10 +
    familyPasses * PRICE_FAMILY;

  const anyTicket =
    adults + children6to10 + childrenUnder6 + familyPasses > 0;

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast({
        title: isFr ? "Veuillez remplir tous les champs" : "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    if (!anyTicket) {
      toast({
        title: isFr ? "Veuillez sélectionner au moins un billet" : "Please select at least one ticket",
        variant: "destructive",
      });
      return;
    }
    setStep("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("reserve-herd-ticket", {
        body: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          adults,
          children_6_10: children6to10,
          children_under_6: childrenUnder6,
          family_passes: familyPasses,
        },
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      toast({
        title: isFr ? "Une erreur s'est produite" : "Something went wrong",
        description: isFr
          ? "Veuillez réessayer ou nous écrire à ailsa@clubchoir.ca."
          : "Please try again or email us at ailsa@clubchoir.ca.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-12 px-4">
      <PageMeta
        title="Sing for the Herd — Club Choir Fundraiser Tickets"
        description="Buy tickets to Sing for the Herd, a Club Choir fundraiser for A Horse Tale Rescue on Sunday August 2, 2026 in Vaudreuil-Dorion. Family-friendly. All proceeds support the rescue."
        path="/tickets/sing-for-the-herd"
      />
      <div className="container mx-auto max-w-7xl">
        <Link to="/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {isFr ? "Retour aux événements" : "Back to events"}
        </Link>

        {/* Hero */}
        <div className="rounded-2xl border border-purple/30 bg-purple-light p-6 md:p-8 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple text-purple-foreground text-xs font-bold uppercase tracking-wider mb-3">
            <Heart className="w-3.5 h-3.5" /> {isFr ? "Collecte de fonds" : "Fundraiser"}
          </div>
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-2">
            {isFr ? "Chantons pour le troupeau" : "Sing for the Herd"}
          </h1>
          <p className="text-base md:text-lg text-foreground/80 leading-relaxed">
            {isFr
              ? "Une collecte de fonds Club Choir pour A Horse Tale Rescue, adaptée à toute la famille."
              : "A Club Choir fundraiser for A Horse Tale Rescue — a family-friendly afternoon of music and community."}
          </p>
        </div>

        {/* Description */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 mb-8 space-y-3 overflow-hidden">
          <img
            src={ahtLogo.url}
            alt={isFr ? "Logo de A Horse Tale Rescue" : "A Horse Tale Rescue logo"}
            className="w-full h-auto rounded-xl mb-5 object-cover"
            loading="eager"
          />
          <p className="text-muted-foreground leading-relaxed">
            {isFr
              ? "Joignez-vous à nous le dimanche 2 août pour un après-midi en famille au A Horse Tale Rescue à Vaudreuil-Dorion."
              : "Join us on Sunday, August 2 for a family-friendly afternoon at A Horse Tale Rescue in Vaudreuil-Dorion."}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {isFr
              ? "Les invités pourront rencontrer le troupeau avant de se rendre à la grange pour un événement Club Choir joyeux en soutien à A Horse Tale Rescue. Que vous veniez pour chanter, écouter, appuyer le refuge ou en apprendre plus sur notre nouvelle chorale de Hudson qui débute en septembre, vous êtes chaleureusement bienvenu."
              : <>
                  The afternoon begins with a chance to meet the herd, followed by a joyful Club Choir event in the barn, featuring live accompaniment by Gary White, in support of A Horse Tale Rescue. <strong>Bring your own lawn or camping chair</strong>, settle in, and enjoy an afternoon of singing in this unique barn setting. Whether you're coming to sing along, listen, support the rescue, or get a feel for Club Choir's new Hudson choir starting in September, we'd love to welcome you.
                </>}
          </p>
          <a
            href="https://www.ahtrescue.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-purple hover:underline font-medium text-sm pt-1"
          >
            <ExternalLink className="w-4 h-4" />
            {isFr ? "En savoir plus sur A Horse Tale Rescue" : "Learn more about A Horse Tale Rescue"}
          </a>
        </div>

        {/* Details grid */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <Calendar className="w-5 h-5 text-purple mb-2" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{isFr ? "Date" : "Date"}</p>
            <p className="text-sm font-medium text-foreground">{isFr ? "Dimanche 2 août" : "Sunday, August 2"}</p>
            <p className="text-xs text-muted-foreground">2026</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <MapPin className="w-5 h-5 text-purple mb-2" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{isFr ? "Lieu" : "Where"}</p>
            <p className="text-sm font-medium text-foreground">A Horse Tale Rescue</p>
            <p className="text-xs text-muted-foreground">27 Chemin Murphy, Vaudreuil-Dorion, QC J7V 4L2</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <Clock className="w-5 h-5 text-purple mb-2" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{isFr ? "Horaire" : "Schedule"}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isFr ? "14 h 45 – 15 h 45 : Rencontre du troupeau" : "2:45–3:45 PM: Meet the Herd"}<br/>
              {isFr ? "15 h 45 : Direction la grange" : "3:45 PM: Head to the barn"}<br/>
              {isFr ? "16 h – 17 h 30 : Club Choir" : "4:00–5:30 PM: Club Choir event"}
            </p>
          </div>
        </div>

        {/* Ticket form */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 mb-8" id="reserve">
          {submitted ? (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 text-green-600 mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="font-heading font-bold text-2xl text-foreground mb-2">
                {isFr ? "Réservation reçue !" : "Reservation received!"}
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-4">
                {isFr
                  ? "Vérifiez votre boîte courriel — nous vous avons envoyé les instructions de paiement par e-Transfert. Vos billets vous seront envoyés dès que nous aurons reçu votre paiement."
                  : "Check your inbox — we've sent you e-Transfer payment instructions. Your tickets will be emailed to you once we confirm payment."}
              </p>
              <p className="text-sm text-muted-foreground">
                {isFr ? "Des questions ? Écrivez-nous à " : "Questions? Email us at "}
                <a href="mailto:ailsa@clubchoir.ca" className="text-primary font-medium hover:underline">ailsa@clubchoir.ca</a>
              </p>
            </div>
          ) : step === "review" ? (
            <>
              <h2 className="font-heading font-bold text-2xl text-foreground mb-1">
                {isFr ? "Vérifiez votre réservation" : "Review your reservation"}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {isFr
                  ? "Vérifiez que votre courriel et vos billets sont exacts avant de confirmer. Nous vous enverrons les instructions de paiement à cette adresse."
                  : "Please double-check that your email and tickets are correct before confirming. We'll send payment instructions to this email address."}
              </p>

              <div className="rounded-xl border border-border bg-background/50 p-4 mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  {isFr ? "Nom" : "Name"}
                </p>
                <p className="text-foreground font-medium mb-3">{firstName} {lastName}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  {isFr ? "Courriel" : "Email"}
                </p>
                <p className="text-foreground font-medium break-all">{email}</p>
              </div>

              <div className="rounded-xl border border-border bg-background/50 p-4 mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  {isFr ? "Billets" : "Tickets"}
                </p>
                <ul className="space-y-1 text-sm text-foreground">
                  {adults > 0 && (
                    <li className="flex justify-between">
                      <span>{adults} × {isFr ? "Adulte" : "Adult"}</span>
                      <span className="tabular-nums">${adults * PRICE_ADULT}</span>
                    </li>
                  )}
                  {children6to10 > 0 && (
                    <li className="flex justify-between">
                      <span>{children6to10} × {isFr ? "Enfant 6–10" : "Child 6–10"}</span>
                      <span className="tabular-nums">${children6to10 * PRICE_CHILD_6_10}</span>
                    </li>
                  )}
                  {familyPasses > 0 && (
                    <li className="flex justify-between">
                      <span>{familyPasses} × {isFr ? "Passe famille" : "Family Pass"}</span>
                      <span className="tabular-nums">${familyPasses * PRICE_FAMILY}</span>
                    </li>
                  )}
                  {childrenUnder6 > 0 && (
                    <li className="flex justify-between">
                      <span>{childrenUnder6} × {isFr ? "Enfant 5 et moins" : "Child 5 and under"}</span>
                      <span className="tabular-nums text-muted-foreground">{isFr ? "Gratuit" : "Free"}</span>
                    </li>
                  )}
                </ul>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-purple-light px-4 py-3 mb-4">
                <span className="text-sm font-medium text-foreground">
                  {isFr ? "Total à payer" : "Total to pay"}
                </span>
                <span className="font-heading font-bold text-2xl text-foreground">${total} CAD</span>
              </div>

              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 mb-5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                  {isFr
                    ? "En confirmant, vous recevrez un courriel à l'adresse ci-dessus avec les instructions de paiement par e-Transfert."
                    : "By confirming, you'll receive an email at the address above with e-Transfer payment instructions."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-border bg-background text-foreground font-semibold hover:border-purple/60 transition-all disabled:opacity-60"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {isFr ? "Retour / modifier" : "Back / edit"}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-purple text-purple-foreground font-semibold shadow hover:shadow-lg hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {submitting
                    ? (isFr ? "Envoi en cours..." : "Submitting...")
                    : (isFr ? "Confirmer et réserver" : "Confirm & reserve")}
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="font-heading font-bold text-2xl text-foreground mb-1">
                {isFr ? "Réservez vos billets" : "Reserve your tickets"}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {isFr
                  ? "Tous les revenus des billets soutiennent A Horse Tale Rescue."
                  : "All ticket proceeds support A Horse Tale Rescue."}
              </p>

              <form onSubmit={handleReview} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="firstName">
                      {isFr ? "Prénom" : "First name"}
                    </label>
                    <input
                      id="firstName" type="text" required value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-purple/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="lastName">
                      {isFr ? "Nom" : "Last name"}
                    </label>
                    <input
                      id="lastName" type="text" required value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-purple/40"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="email">
                    {isFr ? "Adresse courriel" : "Email"}
                  </label>
                  <input
                    id="email" type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-purple/40"
                  />
                </div>

                <div className="rounded-xl border border-border bg-background/50 divide-y divide-border">
                  <div className="flex items-center justify-between p-4 gap-4">
                    <div>
                      <p className="font-semibold text-foreground">{isFr ? "Adulte" : "Adult"}</p>
                      <p className="text-sm text-muted-foreground">$20 CAD</p>
                    </div>
                    <Counter value={adults} onChange={setAdults} />
                  </div>
                  <div className="flex items-center justify-between p-4 gap-4">
                    <div>
                      <p className="font-semibold text-foreground">{isFr ? "Enfant (6–10 ans)" : "Child (ages 6–10)"}</p>
                      <p className="text-sm text-muted-foreground">$10 CAD</p>
                    </div>
                    <Counter value={children6to10} onChange={setChildren6to10} />
                  </div>
                  <div className="flex items-center justify-between p-4 gap-4">
                    <div>
                      <p className="font-semibold text-foreground">{isFr ? "Passe famille" : "Family Pass"}</p>
                      <p className="text-sm text-muted-foreground">
                        {isFr ? "50 $ · 2 adultes + jusqu'à 2 enfants (6–10 ans)" : "$50 · 2 adults + up to 2 children (ages 6–10)"}
                      </p>
                    </div>
                    <Counter value={familyPasses} onChange={setFamilyPasses} max={5} />
                  </div>
                  <div className="flex items-center justify-between p-4 gap-4">
                    <div>
                      <p className="font-semibold text-foreground">{isFr ? "Enfant (5 ans et moins)" : "Child (5 and under)"}</p>
                      <p className="text-sm text-muted-foreground">{isFr ? "Gratuit" : "Free"}</p>
                    </div>
                    <Counter value={childrenUnder6} onChange={setChildrenUnder6} />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-purple-light px-4 py-3">
                  <span className="text-sm font-medium text-foreground">
                    {isFr ? "Total à payer" : "Total to pay"}
                  </span>
                  <span className="font-heading font-bold text-2xl text-foreground">
                    ${total} CAD
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={!anyTicket}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-purple text-purple-foreground font-semibold shadow hover:shadow-lg hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Ticket className="w-5 h-5" />
                  {isFr ? "Continuer" : "Continue"}
                </button>

                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>
                    {isFr
                      ? "Vous aurez la chance de vérifier votre réservation avant de la confirmer. Après confirmation, nous vous enverrons les instructions e-Transfert. Vos billets suivront une fois le paiement reçu."
                      : "You'll get to review your reservation before confirming. After you confirm, we'll email you e-Transfer instructions. Your tickets follow once payment is received."}
                  </p>
                </div>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {isFr ? "D'autres questions ? Écrivez-nous à " : "More questions? Email us at "}
          <a href="mailto:ailsa@clubchoir.ca" className="text-primary font-medium hover:underline">ailsa@clubchoir.ca</a>
        </p>
      </div>
    </div>
  );
};

export default SingForTheHerd;
