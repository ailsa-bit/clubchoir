import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, Clock, MapPin, Sparkles } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import PhotoGallery from "@/components/PhotoGallery";
import ChoirFaq from "@/components/ChoirFaq";
import { choirPhotos } from "@/assets/photos";
import { choirLocations, type LocationSlug } from "@/data/choirLocations";
import { useLanguage } from "@/contexts/LanguageContext";

const ChoirLocation = () => {
  const { city } = useParams<{ city: string }>();
  const { language, t } = useLanguage();
  const isFr = language === "fr";

  const slug = city as LocationSlug;
  const data = slug ? choirLocations[slug] : undefined;
  if (!data) return <Navigate to="/" replace />;

  const photos = choirPhotos.filter((p) => data.photoIds.includes(p.id));

  const faqItems = [
    { q: t("home.faq.q.cost"), a: t("home.faq.a.cost") },
    { q: t("home.faq.q.music"), a: t("home.faq.a.music") },
    { q: t("home.faq.q.shy"), a: t("home.faq.a.shy") },
    { q: t("home.faq.q.audition"), a: t("home.faq.a.audition") },
    { q: t("home.faq.q.kind"), a: t("home.faq.a.kind") },
    { q: t("home.faq.q.bring"), a: t("home.faq.a.bring") },
  ];

  const jsonLd: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "MusicGroup",
      name: `Club Choir ${data.city}`,
      url: `https://clubchoir.ca/choir/${data.slug}`,
      genre: ["Choral", "Pop", "Community"],
      parentOrganization: {
        "@type": "Organization",
        name: "Club Choir",
        url: "https://clubchoir.ca",
      },
      location: {
        "@type": "Place",
        name: data.venueName,
        address: {
          "@type": "PostalAddress",
          streetAddress: data.venueAddress,
          addressLocality: data.venueCity,
          addressRegion: data.region,
          postalCode: data.postalCode,
          addressCountry: data.country,
        },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://clubchoir.ca/" },
        {
          "@type": "ListItem",
          position: 2,
          name: `${data.city} Choir`,
          item: `https://clubchoir.ca/choir/${data.slug}`,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((it) => ({
        "@type": "Question",
        name: it.q,
        acceptedAnswer: { "@type": "Answer", text: it.a },
      })),
    },
  ];

  const aboutParas = data.about[isFr ? "fr" : "en"];

  return (
    <div className="pb-16">
      <PageMeta
        title={data.pageTitle}
        description={data.metaDescription}
        path={`/choir/${data.slug}`}
        jsonLd={jsonLd}
      />

      <div className="container mx-auto max-w-5xl px-4 pt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {isFr ? "Retour à l'accueil" : "Back to home"}
        </Link>
      </div>

      {/* Hero */}
      <section className="container mx-auto max-w-5xl px-4 pt-6">
        <div className={`rounded-3xl border ${data.theme.border} ${data.theme.bg} p-6 md:p-10 overflow-hidden`}>
          <div className="flex items-center gap-2 mb-3">
            <span className={`w-2.5 h-2.5 rounded-full ${data.theme.dot}`} />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground/70">
              Club Choir · {data.city}
            </span>
          </div>
          <h1 className="font-heading font-bold text-3xl md:text-5xl text-foreground mb-3 leading-tight">
            {data.heroHeadline[isFr ? "fr" : "en"]}
          </h1>
          <p className="text-lg text-foreground/80 max-w-2xl mb-6">
            {data.heroBlurb[isFr ? "fr" : "en"]}
          </p>

          <div className="grid sm:grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl bg-background/70 border border-border p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> {isFr ? "Quand" : "When"}
              </p>
              <p className="text-sm font-semibold text-foreground">
                {data.day[isFr ? "fr" : "en"]}
              </p>
              <p className="text-sm text-muted-foreground">{data.dates[isFr ? "fr" : "en"]}</p>
            </div>
            <div className="rounded-xl bg-background/70 border border-border p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> {isFr ? "Heure" : "Time"}
              </p>
              <p className="text-sm font-semibold text-foreground">{data.time}</p>
            </div>
            <div className="rounded-xl bg-background/70 border border-border p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> {isFr ? "Lieu" : "Venue"}
              </p>
              <a
                href={data.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-foreground hover:underline"
              >
                {data.venueName}
              </a>
              <p className="text-sm text-muted-foreground">
                {data.venueAddress}, {data.venueCity}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow hover:shadow-lg hover:bg-primary/90 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              {isFr ? "S'inscrire pour l'automne 2026" : "Register for Fall 2026"}
            </Link>
            <Link
              to="/try"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-background border border-border text-foreground font-semibold text-sm hover:bg-muted transition-all"
            >
              {isFr ? "Essayer une session gratuite" : "Try a free session"}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="container mx-auto max-w-3xl px-4 py-12">
        <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-5">
          {isFr ? `À propos de Club Choir ${data.city}` : `About Club Choir ${data.city}`}
        </h2>
        <div className="space-y-4">
          {aboutParas.map((p, i) => (
            <p key={i} className="text-base text-muted-foreground leading-relaxed">
              {p}
            </p>
          ))}
        </div>
      </section>

      {/* Photos */}
      {photos.length > 0 && (
        <section className="container mx-auto max-w-6xl px-4 py-6">
          <h2 className="font-heading font-bold text-2xl text-foreground mb-5 text-center">
            {isFr ? "Moments en vrai" : "Real moments"}
          </h2>
          <PhotoGallery photos={photos} columns={3} />
        </section>
      )}

      {/* FAQ (FAQ JSON-LD already included in PageMeta above) */}
      <div className="bg-muted/40">
        <ChoirFaq
          title={isFr ? "Questions fréquentes" : "Frequently asked questions"}
          subtitle={isFr ? "Tout ce que les nouveaux choristes demandent." : "Everything new singers ask."}
        />
      </div>

      {/* Other locations */}
      <section className="container mx-auto max-w-5xl px-4 py-12">
        <h2 className="font-heading font-bold text-2xl text-foreground mb-5 text-center">
          {isFr ? "Autres lieux Club Choir" : "Other Club Choir locations"}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.values(choirLocations)
            .filter((l) => l.slug !== data.slug)
            .map((l) => (
              <Link
                key={l.slug}
                to={`/choir/${l.slug}`}
                className={`rounded-2xl border ${l.theme.border} ${l.theme.bg} p-4 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${l.theme.dot}`} />
                  <span className="font-heading font-bold text-foreground">{l.city}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {l.day[isFr ? "fr" : "en"]} · {l.time}
                </p>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
};

export default ChoirLocation;
