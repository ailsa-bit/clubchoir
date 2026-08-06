import { Link } from "react-router-dom";
import { Calendar, MapPin, Mail, Sparkles, ArrowRight } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { choirLocations, locationSlugs } from "@/data/choirLocations";

const CONTACT_EMAIL = "ailsa@clubchoir.ca";

const FallRegistration = () => {
  const { language } = useLanguage();
  const isFr = language === "fr";

  const t = {
    heroTitle: isFr ? "À la recherche d'une chorale cet automne ?" : "Looking for a choir this fall?",
    heroSub: isFr
      ? "Club Choir accueille de nouveaux chanteurs à Montréal, Hudson, Saint-Hubert et Pointe-Claire."
      : "Club Choir is welcoming new singers in Montreal, Hudson, Saint-Hubert, and Pointe-Claire.",
    register: isFr ? "S'inscrire pour l'automne" : "Register for Fall",
    openHouse: isFr ? "Détails des portes ouvertes" : "Open House Details",
    chooseLocation: isFr ? "Choisissez votre emplacement" : "Choose your location",
    rehearsal: isFr ? "Répétitions" : "Rehearsals",
    openHouseLabel: isFr ? "Portes ouvertes" : "Open House",
    registerBtn: isFr ? "S'inscrire" : "Register",
    openHouseBtn: isFr ? "Portes ouvertes" : "Open House details",
    reassureTitle: isFr ? "Une chorale pour tout le monde" : "A choir for everyone",
    reassure: [
      isFr ? "Aucune audition requise" : "No audition required",
      isFr ? "Toutes les voix bienvenues" : "All voices welcome",
      isFr ? "Une expérience détendue et chaleureuse" : "A relaxed, welcoming choir experience",
      isFr ? "Le progrès avant la perfection" : "Progress over perfection",
    ],
    questionTitle: isFr ? "Une question avant de vous inscrire ?" : "Have a question before registering?",
    questionText: isFr
      ? "Si vous ne savez pas quel emplacement vous convient, ou si vous souhaitez en savoir plus sur les portes ouvertes, écrivez-nous."
      : "If you're not sure which location is right for you, or you want to ask about the open house, send us a note.",
    contactBtn: isFr ? "Contacter Club Choir" : "Contact Club Choir",
    finalTitle: isFr ? "Prêt(e) à chanter avec nous cet automne ?" : "Ready to sing with us this fall?",
    viewOpenHouse: isFr ? "Voir les portes ouvertes" : "View Open House Details",
  };

  return (
    <div className="min-h-screen bg-cream">
      <PageMeta
        title={isFr ? "Inscription automne 2026 – Club Choir" : "Fall 2026 Registration – Club Choir"}
        description={
          isFr
            ? "Rejoignez Club Choir cet automne à Montréal, Hudson, Saint-Hubert ou Pointe-Claire. Sans audition, tous niveaux bienvenus."
            : "Join Club Choir this fall in Montreal, Hudson, Saint-Hubert or Pointe-Claire. No audition, all levels welcome."
        }
        path="/fall-registration"
      />

      {/* Hero */}
      <section className="px-4 pt-12 pb-10 md:pt-20 md:pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-border rounded-full px-4 py-1.5 mb-6 text-sm font-body">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>{isFr ? "Automne 2026 · Inscriptions ouvertes" : "Fall 2026 · Registration open"}</span>
          </div>
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-foreground mb-5 leading-tight">
            {t.heroTitle}
          </h1>
          <p className="font-body text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t.heroSub}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="text-base">
              <Link to="/register">
                {t.register} <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base">
              <Link to="/open-house">{t.openHouse}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Locations */}
      <section className="px-4 py-12 md:py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-10">
            {t.chooseLocation}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {locationSlugs.map((slug) => {
              const loc = choirLocations[slug];
              return (
                <div
                  key={slug}
                  className={`${loc.theme.bg} border ${loc.theme.border} rounded-2xl p-6 flex flex-col`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`w-3 h-3 rounded-full ${loc.theme.dot}`} />
                    <h3 className="font-heading text-xl font-bold">{loc.city}</h3>
                    {loc.isNew && (
                      <span className="ml-auto text-[10px] font-bold bg-foreground text-cream px-2 py-0.5 rounded-full">
                        NEW
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 text-sm font-body flex-1">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                      <div>
                        <div className="font-semibold">{isFr ? loc.day.fr : loc.day.en}</div>
                        <div className="text-muted-foreground">{loc.time}</div>
                        <div className="text-muted-foreground text-xs mt-0.5">
                          {isFr ? loc.dates.fr : loc.dates.en}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                      <div className="text-muted-foreground">
                        <div>{loc.venueName}</div>
                        <div className="text-xs">{loc.venueAddress}</div>
                      </div>
                    </div>

                  </div>

                  <div className="mt-5 flex flex-col gap-2">
                    <Button asChild size="sm" className="w-full">
                      <Link to="/register">{t.registerBtn}</Link>
                    </Button>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Reassurance */}
      <section className="px-4 py-12 md:py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-8">{t.reassureTitle}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {t.reassure.map((line) => (
              <div
                key={line}
                className="bg-white border border-border rounded-xl px-4 py-3 font-body text-base flex items-center gap-2 justify-center"
              >
                <span className="w-2 h-2 rounded-full bg-primary" />
                {line}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="px-4 py-12 md:py-16 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-bold mb-3">{t.questionTitle}</h2>
          <p className="font-body text-muted-foreground mb-6">{t.questionText}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button asChild variant="outline" size="lg">
              <a href={`mailto:${CONTACT_EMAIL}`}>
                <Mail className="w-4 h-4 mr-2" />
                {t.contactBtn}
              </a>
            </Button>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-body text-sm text-muted-foreground hover:text-foreground underline"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-14 md:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-5xl font-bold mb-8">{t.finalTitle}</h2>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="text-base">
              <Link to="/register">
                {t.register} <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>

        </div>
      </section>
    </div>
  );
};

export default FallRegistration;
