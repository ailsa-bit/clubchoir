import { Calendar, MapPin, Share2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const events = [
  {
    title: "NDG PorchFest",
    date: "May 17–18, 2026",
    location: "Montreal (NDG)",
    color: "border-pink/30 bg-pink-light",
    dot: "bg-pink",
    description: { en: "All Club Choir members are invited to take part in NDG PorchFest! Exact time and meeting details to be confirmed — stay tuned.", fr: "Tous les membres de Club Choir sont invités à participer au PorchFest NDG ! L'heure exacte et les détails de rendez-vous seront confirmés — restez à l'écoute." },
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

const Events = () => {
  const { t, language } = useLanguage();

  const handleShare = (title: string) => {
    if (navigator.share) {
      navigator.share({ title: `Club Choir: ${title}`, text: `Check out ${title} at Club Choir!` });
    }
  };

  return (
    <div className="py-16 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-2 text-center">
          {t("events.title")}
        </h1>
        <p className="text-center text-muted-foreground mb-10 max-w-lg mx-auto">
          {t("events.subtitle")}
        </p>

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
