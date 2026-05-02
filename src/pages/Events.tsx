import PageMeta from "@/components/PageMeta";
import { Calendar, MapPin, Share2, Clock, Music, Ticket } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const hudsonSummer = {
  location: "Hudson",
  venue: "Kingfisher Pub",
  address: "84 Cameron, Hudson, J0P 1H0",
  day: { en: "Mondays", fr: "Lundis" },
  time: "7:00–8:30 PM",
  season: { en: "Summer 2026", fr: "Été 2026" },
  dates: { en: "May 18 – August 17, 2026", fr: "18 mai – 17 août 2026" },
};

const events = [
  {
    title: { en: "Seasonal Showcase — Montreal", fr: "Spectacle saisonnier — Montréal" },
    date: { en: "Monday, May 4, 2026 · 7:00 PM", fr: "Lundi 4 mai 2026 · 19 h" },
    location: "Montreal",
    color: "border-pink/30 bg-pink-light",
    dot: "bg-pink",
    description: { en: "Join us for our end-of-season showcase! Friends and family are welcome to come enjoy the songs we've been working on all season.", fr: "Joignez-vous à nous pour notre spectacle de fin de saison ! Amis et famille sont les bienvenus pour profiter des chansons que nous avons travaillées toute la saison." },
  },
  {
    title: { en: "Seasonal Showcase — Pointe-Claire", fr: "Spectacle saisonnier — Pointe-Claire" },
    date: { en: "Thursday, May 7, 2026 · 7:00 PM", fr: "Jeudi 7 mai 2026 · 19 h" },
    location: "Pointe-Claire",
    color: "border-purple/30 bg-purple-light",
    dot: "bg-purple",
    description: { en: "Our seasonal celebration of song — come cheer on your favourite choir members. Friends and family welcome!", fr: "Notre célébration saisonnière en chanson — venez encourager vos membres préférés. Amis et famille bienvenus !" },
  },
  {
    title: { en: "Seasonal Showcase — Saint-Hubert", fr: "Spectacle saisonnier — Saint-Hubert" },
    date: { en: "Wednesday, May 13, 2026 · 7:00 PM", fr: "Mercredi 13 mai 2026 · 19 h" },
    location: "Saint-Hubert",
    color: "border-lime/20 bg-lime-light",
    dot: "bg-lime",
    description: { en: "A special evening showcasing what we've been rehearsing all season. Bring your friends and family along!", fr: "Une soirée spéciale mettant en vedette ce que nous avons répété toute la saison. Amenez vos amis et votre famille !" },
  },
  {
    title: { en: "Seasonal Showcase — Arundel", fr: "Spectacle saisonnier — Arundel" },
    date: { en: "Tuesday, May 26, 2026 · 6:30 PM", fr: "Mardi 26 mai 2026 · 18 h 30" },
    location: "Arundel",
    color: "border-aqua/30 bg-aqua-light",
    dot: "bg-aqua",
    description: { en: "Our Arundel crew wraps up the season with a showcase for friends and family. Everyone is welcome!", fr: "Notre équipe d'Arundel clôture la saison avec un spectacle pour amis et famille. Tout le monde est bienvenu !" },
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
        toast.error(language === "fr" ? "Veuillez vous connecter pour vous inscrire." : "Please log in to register.");
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
      toast.error(err.message || "Something went wrong");
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
        <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-2 text-center">
          {t("events.title")}
        </h1>
        <p className="text-center text-muted-foreground mb-10 max-w-lg mx-auto">
          {t("events.subtitle")}
        </p>

        {/* Featured Events */}
        <h2 className="font-heading font-bold text-2xl text-foreground mb-6 text-center">
          {language === "fr" ? "Événements à venir" : "Upcoming Events"}
        </h2>

        {/* Hudson Summer Choir — bookable */}
        <Card className="mb-6 border-orange/30 bg-gradient-to-br from-orange-light to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-orange mb-1">
              <Music className="w-5 h-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">
                {language === "fr" ? "Chorale d'été · Inscriptions ouvertes" : "Summer Choir · Registration open"}
              </span>
            </div>
            <CardTitle className="text-xl font-heading">
              {language === "fr" ? "Chorale d'été à Hudson" : "Hudson Summer Choir"}
            </CardTitle>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
              <Calendar className="w-4 h-4" />
              <span>
                {getText(hudsonSummer.dates, language)} · {getText(hudsonSummer.day, language)} · {hudsonSummer.time}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground leading-relaxed">
              {language === "fr"
                ? "Joignez-vous à nous tous les lundis de l'été au Kingfisher Pub à Hudson pour chanter en groupe dans une ambiance détendue et accueillante. Aucune expérience requise."
                : "Join us every Monday this summer at the Kingfisher Pub in Hudson for group singing in a relaxed, welcoming atmosphere. No experience needed."}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-sm">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-orange" />
                <span className="font-medium">{hudsonSummer.venue}, {hudsonSummer.address}</span>
              </div>
            </div>
            <div className="pt-3">
              <Button asChild className="bg-orange text-orange-foreground hover:bg-orange/90 rounded-full font-semibold">
                <Link to="/hudson-session">
                  <Music className="w-4 h-4 mr-1.5" />
                  {language === "fr" ? "Réserver votre place" : "Reserve your spot"}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Studio 77 Pop-Up — bookable */}
        <Card className="mb-6 border-orange/30 bg-gradient-to-br from-orange-light to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-orange mb-1">
              <Ticket className="w-5 h-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">{language === "fr" ? "Chorale Pop-Up · Billets en vente" : "Pop-Up Choir · Tickets on sale"}</span>
            </div>
            <CardTitle className="text-xl font-heading">
              {language === "fr" ? "Club Choir Pop-Up au Studio 77" : "Club Choir Pop-Up at Studio 77"}
            </CardTitle>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
              <Calendar className="w-4 h-4" />
              <span>{language === "fr" ? "Dimanche 31 mai · 15 h – 17 h" : "Sunday, May 31 · 3:00 PM – 5:00 PM"}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground leading-relaxed">
              {language === "fr"
                ? "Une expérience de chorale pop-up de 2 heures pour quiconque aime chanter — aucune expérience requise. Nous apprendrons une chanson ensemble et chanterons en harmonie d'ici la fin, accompagnés par le musicien Gary White."
                : "A 2-hour pop-up choir experience for anyone who loves to sing — no experience needed. We'll learn a song together and be singing in harmony by the end, accompanied by musician Gary White."}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-sm">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-orange" />
                <span className="font-medium">Studio 77, Pointe-Claire</span>
              </div>
              <span className="text-muted-foreground">{language === "fr" ? "15 $ par personne · Places limitées" : "$15 per person · Spots limited"}</span>
            </div>
            <div className="pt-3">
              <Button asChild className="bg-orange text-orange-foreground hover:bg-orange/90 rounded-full font-semibold">
                <Link to="/popup/studio-77">
                  <Ticket className="w-4 h-4 mr-1.5" />
                  {language === "fr" ? "Réserver votre place" : "Reserve your spot"}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* NDG PorchFest */}
        <Card className="mb-6 border-pink/30 bg-gradient-to-br from-pink-light to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-pink mb-1">
              <Music className="w-5 h-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">{language === "fr" ? "Performance communautaire" : "Community Performance"}</span>
            </div>
            <CardTitle className="text-xl font-heading">
              {language === "fr" ? "Club Choir au Porchfest NDG" : "Club Choir at NDG Porchfest"}
            </CardTitle>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
              <Calendar className="w-4 h-4" />
              <span>{language === "fr" ? "16 mai à 12 h" : "May 16 at 12 PM"}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground leading-relaxed">
              {language === "fr" 
                ? "Les membres de Club Choir de tous les lieux se réuniront pour une performance communautaire spéciale dans le cadre du Porchfest NDG. Cet événement gratuit, géré par des bénévoles, transforme NDG en un circuit de musique live autoguidé, avec des performances sur les porches du quartier."
                : "Club Choir members from all locations will come together for a special community performance as part of Porchfest NDG. This free, volunteer-run event transforms NDG into a self-guided walking tour of live music, with performances happening on porches throughout the neighbourhood."}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {language === "fr" 
                ? "Joignez-vous à nous alors que nos chanteurs se réunissent pour partager quelques chansons et célébrer la musique, la communauté et les liens dans l'une des traditions locales les plus vibrantes de Montréal."
                : "Join us as our singers gather to share a few songs and celebrate music, community, and connection in one of Montreal's most vibrant local traditions."}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-sm">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-pink" />
                <span className="font-medium">Kensington Presbyterian Church, 6225 Av. Godfrey, {language === "fr" ? "Montréal (NDG)" : "Montreal (NDG)"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Victoria Village Street Festival */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-primary mb-1">
              <Music className="w-5 h-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">{language === "fr" ? "Chorale Pop-Up d'été" : "Summer Pop-Up Choir"}</span>
            </div>
            <CardTitle className="text-xl font-heading">
              {language === "fr" ? "Festival de rue de Victoria Village" : "Victoria Village Street Festival"}
            </CardTitle>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
              <Calendar className="w-4 h-4" />
              <span>{language === "fr" ? "13 juin à 13h" : "June 13 at 1 PM"}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground leading-relaxed">
              {language === "fr" 
                ? "Joignez-vous à Club Choir pour une expérience de chant extérieure interactive et amusante au cœur du festival. Nous commencerons par une courte performance, puis inviterons tout le monde à participer à un chant spontané pour tous les niveaux, à la manière Club Choir. Aucune expérience requise, venez simplement prêt à chanter et à profiter du moment."
                : "Join Club Choir for a fun, interactive outdoor singing experience in the heart of the festival. We'll start with a short performance, then invite everyone to take part in a live, all-levels sing-along—Club Choir style. No experience needed, just come ready to sing and enjoy the moment."}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {language === "fr" 
                ? "C'est un événement décontracté et accueillant conçu pour tous ceux qui aiment la musique et veulent faire partie de quelque chose de joyeux et social."
                : "This is a relaxed, welcoming event designed for anyone who loves music and wants to be part of something uplifting and social."}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-sm">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="font-medium">{language === "fr" ? "Place Prince-Albert" : "Prince-Albert Square"}</span>
              </div>
              <span className="text-muted-foreground">{language === "fr" ? "Accompagné par Gary White" : "Accompanied by Gary White"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Community Events */}
        <h2 className="font-heading font-bold text-2xl text-foreground mb-6 text-center">
          {language === "fr" ? "Événements communautaires" : "Community Events"}
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
