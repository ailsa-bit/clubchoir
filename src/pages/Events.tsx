import PageMeta from "@/components/PageMeta";
import { Calendar, MapPin, Share2, Clock, Music } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const locationCards = [
  {
    location: "Montreal",
    venue: "Kensington Presbyterian Church",
    address: "6225 Av. Godfrey, Montreal",
    day: { en: "Mondays", fr: "Lundis" },
    time: "7:00–8:30 PM",
    season: { en: "Winter 2026", fr: "Hiver 2026" },
    dates: { en: "February 2 – May 4, 2026", fr: "2 février – 4 mai 2026" },
    color: "border-pink/30 bg-pink-light",
    dot: "bg-pink",
  },
  {
    location: "Hudson",
    venue: "Kingfisher Pub",
    address: "84 Cameron, Hudson, J0P 1H0",
    day: { en: "Mondays", fr: "Lundis" },
    time: "7:00–8:30 PM",
    season: { en: "Summer 2026", fr: "Été 2026" },
    dates: { en: "May 18 – August 17, 2026", fr: "18 mai – 17 août 2026" },
    color: "border-orange/30 bg-orange-light",
    dot: "bg-orange",
  },
  {
    location: "Arundel",
    venue: "Centre Arundel Centre",
    address: "17 rue du Village, Arundel",
    day: { en: "Tuesdays", fr: "Mardis" },
    time: "6:30–8:00 PM",
    season: { en: "Winter 2026", fr: "Hiver 2026" },
    dates: { en: "February 17 – May 26, 2026", fr: "17 février – 26 mai 2026" },
    color: "border-aqua/30 bg-aqua-light",
    dot: "bg-aqua",
  },
  {
    location: "Saint-Hubert",
    venue: "St-Gabriel Catholic Church",
    address: "5070 Rue Gilbert, Saint-Hubert",
    day: { en: "Wednesdays", fr: "Mercredis" },
    time: "7:00–8:30 PM",
    season: { en: "Winter 2026", fr: "Hiver 2026" },
    dates: { en: "February 4 – May 13, 2026", fr: "4 février – 13 mai 2026" },
    color: "border-lime/20 bg-lime-light",
    dot: "bg-lime",
  },
  {
    location: "Pointe-Claire",
    venue: "Valois United Church",
    address: "70 Belmont Ave, Pointe-Claire",
    day: { en: "Thursdays", fr: "Jeudis" },
    time: "7:00–8:30 PM",
    season: { en: "Winter 2026", fr: "Hiver 2026" },
    dates: { en: "February 5 – May 7, 2026", fr: "5 février – 7 mai 2026" },
    color: "border-purple/30 bg-purple-light",
    dot: "bg-purple",
  },
];

const events = [
  {
    title: "NDG PorchFest",
    date: { en: "Saturday, May 16, 2026 · 12:00 PM", fr: "Samedi 16 mai 2026 · 12 h" },
    location: "Montreal (NDG)",
    color: "border-pink/30 bg-pink-light",
    dot: "bg-pink",
    description: { en: "All Club Choir members are invited to perform at NDG PorchFest! We'll be singing in front of Kensington Presbyterian Church, 6225 Av. Godfrey. Weather permitting.", fr: "Tous les membres de Club Choir sont invités à chanter au PorchFest NDG ! Nous chanterons devant l'église presbytérienne Kensington, 6225 Av. Godfrey. Si la météo le permet." },
  },
  {
    title: "Summer Pop-Up Choirs",
    date: { en: "Summer 2026", fr: "Été 2026" },
    location: { en: "In & Around Montreal", fr: "À Montréal et environs" },
    color: "border-aqua/30 bg-aqua-light",
    dot: "bg-aqua",
    description: { en: "Pop-up singalongs popping up all summer long! Stay tuned for locations and various themes — all are welcome.", fr: "Des chants impromptus tout au long de l'été ! Restez à l'écoute pour les lieux et thèmes variés — tous sont bienvenus." },
  },
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

        {/* Location Cards - Winter 2026 */}
        <h2 className="font-heading font-bold text-2xl text-foreground mb-6 text-center">
          {language === "fr" ? "Sessions hebdomadaires — Hiver 2026" : "Weekly Sessions — Winter 2026"}
        </h2>
        <div className="grid sm:grid-cols-2 gap-5 mb-14">
          {locationCards.map((loc) => (
            <div
              key={loc.location}
              className={`rounded-2xl border p-6 ${loc.color} transition-shadow hover:shadow-md`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2.5 h-2.5 rounded-full ${loc.dot}`} />
                <span className="font-heading font-bold text-lg text-foreground">{loc.location}</span>
              </div>
              <p className="text-sm font-semibold text-foreground/80 mb-1">{loc.venue}</p>
              <div className="space-y-1 text-sm text-muted-foreground mb-2">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {getText(loc.day, language)} · {loc.time}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {loc.address}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {getText(loc.dates, language)}
                </span>
              </div>
            </div>
          ))}
        </div>

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
