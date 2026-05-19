import PageMeta from "@/components/PageMeta";
import { Calendar, MapPin, Share2, Clock, Music, Ticket, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";


const events = [
  {
    title: { en: "Seasonal Showcase — Montreal", fr: "Spectacle saisonnier — Montréal" },
    date: { en: "Monday, December 7, 2026 · 7:00 PM", fr: "Lundi 7 décembre 2026 · 19 h" },
    location: "Montreal",
    color: "border-pink/30 bg-pink-light",
    dot: "bg-pink",
    description: { en: "Join us for our end-of-season showcase! Friends and family are welcome to come enjoy the songs we've been working on all season.", fr: "Joignez-vous à nous pour notre spectacle de fin de saison ! Amis et famille sont les bienvenus pour profiter des chansons que nous avons travaillées toute la saison." },
  },
  {
    title: { en: "Seasonal Showcase — Hudson", fr: "Spectacle saisonnier — Hudson" },
    date: { en: "Tuesday, December 8, 2026 · 7:00 PM", fr: "Mardi 8 décembre 2026 · 19 h" },
    location: "Hudson",
    color: "border-orange/30 bg-orange-light",
    dot: "bg-orange",
    description: { en: "Celebrate the season with our Hudson choir! Friends and family are welcome to enjoy an evening of song.", fr: "Célébrez la saison avec notre chorale d'Hudson ! Amis et famille sont les bienvenus pour une soirée en chanson." },
  },
  {
    title: { en: "Seasonal Showcase — Saint-Hubert", fr: "Spectacle saisonnier — Saint-Hubert" },
    date: { en: "Wednesday, December 9, 2026 · 7:00 PM", fr: "Mercredi 9 décembre 2026 · 19 h" },
    location: "Saint-Hubert",
    color: "border-lime/20 bg-lime-light",
    dot: "bg-lime",
    description: { en: "A special evening showcasing what we've been rehearsing all season. Bring your friends and family along!", fr: "Une soirée spéciale mettant en vedette ce que nous avons répété toute la saison. Amenez vos amis et votre famille !" },
  },
  {
    title: { en: "Seasonal Showcase — Pointe-Claire", fr: "Spectacle saisonnier — Pointe-Claire" },
    date: { en: "Thursday, December 10, 2026 · 7:00 PM", fr: "Jeudi 10 décembre 2026 · 19 h" },
    location: "Pointe-Claire",
    color: "border-purple/30 bg-purple-light",
    dot: "bg-purple",
    description: { en: "Our seasonal celebration of song — come cheer on your favourite choir members. Friends and family welcome!", fr: "Notre célébration saisonnière en chanson — venez encourager vos membres préférés. Amis et famille bienvenus !" },
  },
];

const getText = (val: string | { en: string; fr: string }, lang: "en" | "fr") =>
  typeof val === "string" ? val : val[lang];

const SESSION_PRICE_ID = "price_1T3jagCDjLBT3uD040OaBrMB";

const Events = () => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t("events.loginRegister"));
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: SESSION_PRICE_ID },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message || t("common.something.wrong"));
    } finally {
      setLoading(false);
    }
  };

  const handleShare = (title: string) => {
    if (navigator.share) {
      navigator.share({ title: `Club Choir: ${title}`, text: `Check out ${title} at Club Choir!` });
    }
  };

  return (
    <div className="py-16 px-4">
      <PageMeta title="Events & Schedule – Club Choir" description="View upcoming Club Choir events, performances, and weekly rehearsal schedules across Montreal, Arundel, Saint-Hubert and Pointe-Claire." path="/events" />
      <div className="container mx-auto max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t("hudson.backHome")}
        </Link>
        <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-2 text-center">
          {t("events.title")}
        </h1>
        <p className="text-center text-muted-foreground mb-10 max-w-lg mx-auto">
          {t("events.subtitle")}
        </p>

        {/* Featured Events */}
        <h2 className="font-heading font-bold text-2xl text-foreground mb-6 text-center">
          {t("events.upcoming")}
        </h2>

        {/* Fall 2026 Registration CTA */}
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-primary mb-1">
              <Music className="w-5 h-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">
                {language === "fr" ? "Inscriptions ouvertes" : "Registration open"}
              </span>
            </div>
            <CardTitle className="text-xl font-heading">
              {language === "fr" ? "Session d'automne 2026" : "Fall 2026 Session"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground leading-relaxed">
              {language === "fr"
                ? "Inscrivez-vous à l'une de nos chorales d'automne à Montréal, Hudson, Saint-Hubert, Pointe-Claire ou Arundel."
                : "Sign up for one of our fall choirs in Montreal, Hudson, Saint-Hubert, Pointe-Claire, or Arundel."}
            </p>
            <div className="pt-2">
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-semibold">
                <Link to="/register">
                  <Music className="w-4 h-4 mr-1.5" />
                  {language === "fr" ? "S'inscrire maintenant" : "Register now"}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>


        <Card className="mb-6 border-purple/30 bg-purple-light">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-purple mb-1">
              <Ticket className="w-5 h-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">{t("events.popupTickets")}</span>
            </div>
            <CardTitle className="text-xl font-heading">
              {t("events.popupTitle")}
            </CardTitle>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
              <Calendar className="w-4 h-4" />
              <span>{t("events.popupDate")}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground leading-relaxed">
              {t("events.popupDesc")}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-sm">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-purple" />
                <span className="font-medium">Studio 77, Pointe-Claire</span>
              </div>
              <span className="text-muted-foreground">{t("events.popupPrice")}</span>
            </div>
            <div className="pt-3">
              <Button asChild className="bg-purple text-purple-foreground hover:bg-purple/90 rounded-full font-semibold">
                <Link to="/popup/studio-77">
                  <Ticket className="w-4 h-4 mr-1.5" />
                  {t("events.reserveSpot")}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* NDG PorchFest */}
        <Card className="mb-6 border-pink/30 bg-pink-light">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-pink mb-1">
              <Music className="w-5 h-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">{t("events.communityPerf")}</span>
            </div>
            <CardTitle className="text-xl font-heading">
              {t("events.porchfestTitle")}
            </CardTitle>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
              <Calendar className="w-4 h-4" />
              <span>{t("events.porchfestDate")}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground leading-relaxed">
              {t("events.porchfestDesc1")}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {t("events.porchfestDesc2")}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-sm">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-pink" />
                <span className="font-medium">Kensington Presbyterian Church, 6225 Av. Godfrey, {t("events.porchfestVenue")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Victoria Village Street Festival */}
        <Card className="mb-8 border-pink/30 bg-pink-light">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-pink mb-1">
              <Music className="w-5 h-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">{t("events.communityPerf")}</span>
            </div>
            <CardTitle className="text-xl font-heading">
              {t("events.victoriaTitle")}
            </CardTitle>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
              <Calendar className="w-4 h-4" />
              <span>{t("events.victoriaDate")}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground leading-relaxed">
              {t("events.victoriaDesc1")}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {t("events.victoriaDesc2")}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-sm">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-pink" />
                <span className="font-medium">{t("events.victoriaVenue")}</span>
              </div>
              <span className="text-muted-foreground">{t("events.accompanied")}</span>
            </div>
          </CardContent>
        </Card>

        {/* Community Events */}
        <h2 className="font-heading font-bold text-2xl text-foreground mb-6 text-center">
          {t("events.communityEvents")}
        </h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {events.map((event, i) => {
            const title = getText(event.title, language);
            return (
              <div
                key={i}
                className={`rounded-2xl border p-6 ${event.color} transition-shadow hover:shadow-md`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${event.dot}`} />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {getText(event.location, language)}
                  </span>
                </div>
                <h3 className="font-heading font-bold text-lg text-foreground mb-1">{title}</h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {getText(event.date, language)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {getText(event.location, language)}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 mb-4">{getText(event.description, language)}</p>
                <button
                  onClick={() => handleShare(title)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  {t("events.share")}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Events;
