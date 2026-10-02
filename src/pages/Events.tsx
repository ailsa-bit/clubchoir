import PageMeta from "@/components/PageMeta";
import { Calendar, MapPin, Share2, Clock, Music, Ticket, ArrowLeft, ArrowRight, CheckCircle2, BellRing, Heart, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import PhotoGallery from "@/components/PhotoGallery";
import { porchfestPhotos } from "@/assets/photos/porchfest";
import { victoriaVillagePhotos } from "@/assets/photos/victoriaVillage";


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
      <PageMeta
        title={t("meta.events.title")}
        description={t("meta.events.desc")}
        path="/events"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Club Choir upcoming events",
            itemListElement: events.map((e, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "Event",
                name: e.title.en,
                startDate: ["2026-12-07","2026-12-08","2026-12-09","2026-12-10"][i] ?? "2026-12-07",
                eventStatus: "https://schema.org/EventScheduled",
                eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
                location: { "@type": "Place", name: `${e.location}, QC, Canada` },
                description: e.description.en,
                organizer: { "@type": "Organization", name: "Club Choir", url: "https://clubchoir.ca" },
              },
            })),
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://clubchoir.ca/" },
              { "@type": "ListItem", position: 2, name: "Events", item: "https://clubchoir.ca/events" },
            ],
          },
        ]}
      />
      <div className="container mx-auto max-w-7xl">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t("hudson.backHome")}
        </Link>
        <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-2 text-center">
          {t("events.title")}
        </h1>
        <p className="text-center text-muted-foreground mb-10 max-w-lg mx-auto">
          {t("events.subtitle")}
        </p>

        {/* Seasonal Showcases — top of page */}
        <h2 className="font-heading font-bold text-2xl text-foreground mb-6 text-center">
          {t("events.communityEvents")}
        </h2>
        <div className="grid sm:grid-cols-2 gap-5 mb-12">
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
                ? "Inscrivez-vous à l'une de nos chorales d'automne à Montréal, Hudson, Saint-Hubert ou Pointe-Claire."
                : "Sign up for one of our fall choirs in Montreal, Hudson, Saint-Hubert, or Pointe-Claire."}
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





        {/* Open Houses — recap */}
        <Card className="mb-12 border-lime/30 bg-lime-light">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-lime mb-1">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">
                {language === "fr" ? "Un grand succès" : "A Huge Success"}
              </span>
            </div>
            <CardTitle className="text-xl font-heading">
              {language === "fr" ? "Portes ouvertes — Août 2026" : "Open Houses — August 2026"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground leading-relaxed">
              {language === "fr"
                ? "Nos portes ouvertes ont été un immense succès dans nos quatre lieux. Merci à toutes les personnes venues chanter avec nous — l'énergie dans les salles était incroyable."
                : "Our open houses were a huge success across all four locations. Thank you to everyone who came out to sing with us — the energy in every room was incredible."}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {language === "fr"
                ? "Nous avons hâte d'accueillir nos membres cet automne, les nouveaux comme les anciens. On se revoit en septembre !"
                : "We can't wait to welcome our members back this fall — new faces and familiar ones alike. See you in September!"}
            </p>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <h2 className="font-heading font-bold text-2xl text-foreground mb-6 text-center">
          {language === "fr" ? "Événements à venir" : "Upcoming Events"}
        </h2>

        {/* Past Events */}
        <h2 className="font-heading font-bold text-2xl text-foreground mb-6 text-center mt-10">
          {language === "fr" ? "Événements passés" : "Past Events"}
        </h2>

        {/* Sing for the Herd — thank you (past event) */}
        <Card className="mb-8 border-purple/30 bg-purple-light">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-purple mb-1">
              <Heart className="w-5 h-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">
                {language === "fr" ? "Merci !" : "Thank You!"}
              </span>
            </div>
            <CardTitle className="text-xl font-heading">
              {language === "fr"
                ? "Chanter pour le troupeau — merci à tous"
                : "Sing for the Herd — Thank You"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground leading-relaxed">
              {language === "fr"
                ? "Quelle journée ! La pluie s'est invitée, mais elle n'a rien enlevé au plaisir. Un immense merci à tous les bénévoles, aux chanteurs et à l'équipe d'A Horse Tale Rescue pour cet événement pluvieux mais joyeux."
                : "What a day! The rain showed up, but it didn't dampen the fun one bit. A huge thank you to all the volunteers, singers, and everyone at A Horse Tale Rescue for a rainy but wonderful event."}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {language === "fr"
                ? "Votre générosité et votre bonne humeur ont fait toute la différence pour les chevaux. Merci d'avoir chanté sous la pluie avec nous."
                : "Your generosity and good spirits made a real difference for the horses. Thank you for singing in the rain with us."}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-sm">
              <a
                href="https://www.ahtrescue.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-purple hover:underline font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                {t("events.herdLink")}
              </a>
            </div>
          </CardContent>
        </Card>


        <Card className="mb-6 border-orange/30 bg-orange-light">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-orange mb-1">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">
                {language === "fr" ? "Un grand succès" : "A Huge Success"}
              </span>
            </div>
            <CardTitle className="text-xl font-heading">
              {language === "fr" ? "Studio 77 Pop-Up" : "Studio 77 Pop-Up"}
            </CardTitle>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
              <Calendar className="w-4 h-4" />
              <span>{t("events.popupDate")}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground leading-relaxed">
              {language === "fr"
                ? "Notre premier pop-up Studio 77 a été un grand succès, et nous sommes profondément reconnaissants envers tous ceux qui sont venus, ont chanté avec nous et ont contribué à rendre l'événement si spécial."
                : "Our first Studio 77 pop-up was a huge success, and we are so grateful to everyone who came out, sang with us, and helped make the event feel so special."}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {language === "fr"
                ? "Merci à chaque participant, chaque supporter et à tous ceux qui ont partagé leur énergie avec nous. La joie dans la pièce était un rappel magnifique de pourquoi Club Choir existe : rassembler les gens à travers la musique, la communauté et l'expérience partagée."
                : "Thank you to every participant, every supporter, and everyone who shared their energy with us. The joy in the room was such a beautiful reminder of why Club Choir exists: to bring people together through music, community, and shared experience."}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {language === "fr"
                ? "Nous sommes incroyablement reconnaissants pour la communauté Club Choir que nous construisons, et ce premier pop-up n'était que le début."
                : "We are incredibly grateful for the Club Choir community we are building, and this first pop-up was only the beginning."}
            </p>

            <div className="pt-2">
              <div className="aspect-video rounded-xl overflow-hidden border border-orange/20 shadow-sm">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/TbP7V_PzS-Y"
                  title="Studio 77 Pop-Up Performance"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 text-center">
                {language === "fr" ? "Regardez la performance finale" : "Watch the final performance"}
              </p>
            </div>

            <div className="pt-2">
              <h4 className="font-heading font-bold text-lg text-foreground mb-2">
                {language === "fr" ? "Événements futurs" : "Future Events"}
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                {language === "fr"
                  ? "Restez à l'écoute pour plus de pop-ups Studio 77, d'ateliers et d'événements communautaires de chant. Les événements futurs comprendront des opportunités de chanter, de se connecter, de collaborer et de découvrir Club Choir dans de nouveaux espaces."
                  : "Stay tuned for more Studio 77 pop-ups, workshops, and community singing events. Future events will include opportunities to sing, connect, collaborate, and experience Club Choir in new spaces."}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {language === "fr"
                  ? "Pour être les premiers informés des dates à venir, des détails d'inscription et des événements spéciaux, rejoignez notre liste de diffusion ou suivez-nous sur les médias sociaux."
                  : "To be the first to hear about upcoming dates, registration details, and special events, join our mailing list or follow us on social media."}
              </p>
              <p className="text-muted-foreground leading-relaxed font-medium">
                {language === "fr"
                  ? "Nous avons hâte de chanter à nouveau avec vous."
                  : "We can't wait to sing with you again."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-sm">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-orange" />
                <span className="font-medium">Studio 77, Pointe-Claire</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NDG PorchFest — recap */}
        <Card className="mb-6 border-pink/30 bg-pink-light">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-pink mb-1">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">{t("events.completedBadge")}</span>
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
            <p className="text-muted-foreground leading-relaxed">
              {t("events.porchfestDesc3")}
            </p>
            <div className="pt-2">
              <PhotoGallery photos={porchfestPhotos} columns={3} />
            </div>
          </CardContent>
        </Card>

        {/* Victoria Village Street Festival */}
        <Card className="mb-6 border-pink/30 bg-pink-light">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-pink mb-1">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">{t("events.completedBadge")}</span>
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
            <p className="text-muted-foreground leading-relaxed font-medium">
              {t("events.victoriaDesc1")}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {t("events.victoriaDesc2")}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {t("events.victoriaDesc3")}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {t("events.victoriaDesc4")}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {t("events.victoriaDesc5")}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-sm">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-pink" />
                <span className="font-medium">{t("events.victoriaVenue")}</span>
              </div>
              <span className="text-muted-foreground">{t("events.accompanied")}</span>
            </div>
            <div className="pt-2">
              <PhotoGallery photos={victoriaVillagePhotos} columns={2} />
            </div>
          </CardContent>
        </Card>

        {/* Pointe-Claire Village Street Festival — recap */}
        <Card className="mb-6 border-aqua/30 bg-aqua-light">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-aqua mb-1">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">
                {language === "fr" ? "Un grand succès" : "A Huge Success"}
              </span>
            </div>
            <CardTitle className="text-xl font-heading">
              {t("events.pointeclaireTitle")}
            </CardTitle>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
              <Calendar className="w-4 h-4" />
              <span>{language === "fr" ? "Samedi 9 août 2025" : "Saturday, August 9, 2025"}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground leading-relaxed font-medium">
              {language === "fr"
                ? "Club Choir a animé le Festival de rue du Village de Pointe-Claire avec une performance live suivie d'un chant communautaire. Une belle journée de musique et de convivialité en plein air."
                : "Club Choir took over the Pointe-Claire Village Street Festival with a live performance followed by a community sing-along. A beautiful day of music and togetherness outdoors."}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {t("events.pointeclaireDesc2")}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-sm">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-aqua" />
                <span className="font-medium">{t("events.pointeclaireVenue")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Events;
