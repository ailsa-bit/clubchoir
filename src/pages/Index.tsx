import { useState } from "react";
import { Link } from "react-router-dom";
import { Users, Calendar, Sparkles, Star, ExternalLink, MessageCircle, Mail, ArrowRight, MapPin } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import PageMeta from "@/components/PageMeta";
import PhotoGallery from "@/components/PhotoGallery";
import { choirPhotos } from "@/assets/photos";
import clubChoirWordmark from "@/assets/club-choir-wordmark.webp";
import founderPhoto from "@/assets/founder-ailsa.webp";
import heroStage from "@/assets/photos/hero-choir.webp";
import whyComeBackPhoto from "@/assets/why-members-come-back.webp";
import whatWeSingPhoto from "@/assets/photos/what-we-sing.webp";

// Testimonials — most registration-relevant first (no audition, first choir, welcoming)
const testimonials = [
  { name: "Lydia Woronchak", stars: 5, text: "You don't have to be a great singer to be in Club Choir and you don't even have to audition. All you have to do is love to sing! You're guaranteed to have fun, meet new people and leave feeling joyful!" },
  { name: "Lori Cook", stars: 5, text: "Ailsa has made my first choir experience a very positive one. I have met some great people and have gained confidence in my singing abilities." },
  { name: "Claude Aimée Villeneuve", stars: 5, text: "I love the way Ailsa has an interesting way of teaching the songs so that anyone who just loves singing can enjoy themselves right away, no need to know how to read music or have previous choir experience. It's fun, the vibes are upbeat!" },
  { name: "Claudine Turnbull", stars: 5, text: "I'm so thankful to my friend for encouraging me to join Club Choir! Ailsa instantly makes you feel comfortable and brings amazing energy every week. It's truly become my weekly happiness boost!" },
  { name: "Ron Cole", stars: 5, text: "As a ski instructor, I know the effort and skill required to take charge of a group of beginners and lead them as one unit in a successful and joyous direction. Ailsa is gifted in this capacity. Singing is one of the few activities that light up so many parts of the brain at once... a great way to keep the mind sharp." },
  { name: "Sonia Klebanskyj", stars: 5, text: "ClubChoir is so much fun! Ailsa is a wonderful choir director for a novice choir singer or for people who want to rediscover the joy of singing. Join and you won't be disappointed!" },
  { name: "Martin Leclerc", stars: 5, text: "Great, contagious energy from Ailsa, leading the choir through fun singing! Very happy with the repertoire, the people, the arrangement and the simple enjoyment of it all." },
  { name: "Danielle Jasmin", stars: 5, text: "J'ai beaucoup apprécié Ailsa. Une maître choeur dynamique, qui connaît sa musique, ses chansons. Une très bonne approche pédagogique qui fait que tout le monde apprend en s'amusant !" },
  { name: "Kerry Johnson", stars: 5, text: "ClubChoir is awesome! It's a fantastic way to bring people together, celebrate community, and share the love of music in a welcoming space where everyone can sing, no experience required. Every session is filled with laughter and connection. A truly uplifting and fun experience!" },
];

const Index = () => {
  const { language, t } = useLanguage();
  const isFr = language === "fr";
  const [showAllTestimonials, setShowAllTestimonials] = useState(false);

  // FAQ reordered: registration mindset first (cost, audition, miss, music), then softer questions
  const faqItems = [
    { q: t("home.faq.q.cost"), a: t("home.faq.a.cost") },
    { q: t("home.faq.q.audition"), a: t("home.faq.a.audition") },
    { q: t("home.faq.q.miss"), a: t("home.faq.a.miss") },
    { q: t("home.faq.q.music"), a: t("home.faq.a.music") },
    { q: t("home.faq.q.shy"), a: t("home.faq.a.shy") },
    { q: t("home.faq.q.kind"), a: t("home.faq.a.kind") },
    { q: t("home.faq.q.bring"), a: t("home.faq.a.bring") },
    { q: t("home.faq.q.bad"), a: t("home.faq.a.bad") },
  ];

  const locations = [
    { location: "Montreal", slug: "montreal", venue: "Kensington Presbyterian Church\n6225 Av. Godfrey, Montréal", color: "bg-pink-light border-pink/20", day: t("day.monday"), time: "7:00–8:30 PM", dot: "bg-pink", dates: "Sept 7 – Dec 7, 2026", isNew: false, openHouse: { en: "Mon, Aug 3 · 7:00 PM", fr: "Lun. 3 août · 19 h" } },
    { location: "Hudson", slug: "hudson", venue: "The Hudson Legion\n57 Beach Road, Hudson", color: "bg-orange-light border-orange/20", day: t("day.tuesday"), time: "7:00–8:30 PM", dot: "bg-orange", dates: "Sept 8 – Dec 8, 2026", isNew: true, openHouse: { en: "Tue, Aug 4 · 7:00 PM", fr: "Mar. 4 août · 19 h" } },
    { location: "Saint-Hubert", slug: "saint-hubert", venue: "St-Gabriel Catholic Church\n5070 Rue Gilbert, Saint-Hubert", color: "bg-lime-light border-lime/20", day: t("day.wednesday"), time: "7:00–8:30 PM", dot: "bg-lime", dates: "Sept 9 – Dec 9, 2026", isNew: false, openHouse: { en: "Wed, Aug 5 · 7:00 PM", fr: "Mer. 5 août · 19 h" } },
    { location: "Pointe-Claire", slug: "pointe-claire", venue: "Valois United Church\n70 Av. Belmont, Pointe-Claire", color: "bg-purple-light border-purple/20", day: t("day.thursday"), time: "7:00–8:30 PM", dot: "bg-purple", dates: "Sept 10 – Dec 10, 2026", isNew: false, openHouse: { en: "Thu, Aug 6 · 7:00 PM", fr: "Jeu. 6 août · 19 h" } },
  ];


  const visibleTestimonials = showAllTestimonials ? testimonials : testimonials.slice(0, 4);

  return (
    <div>
      <PageMeta
        title="Choir Montreal | Club Choir – No-Audition Community Choir for Adults"
        description="Join Club Choir, a fun no-audition community choir for adults in Montreal, Hudson, Pointe-Claire and Saint-Hubert. Fall 2026 registration is open."
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map((it) => ({
            "@type": "Question",
            name: it.q,
            acceptedAnswer: { "@type": "Answer", text: it.a },
          })),
        }}
      />

      {/* HERO — bright split layout on cream */}
      <section className="relative overflow-hidden px-4 py-12 md:py-16 lg:py-24 bg-[hsl(var(--cream,42_50%_97%))] bg-card">
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* Content */}
            <div className="flex flex-col gap-8 order-2 lg:order-1 animate-fade-in">
              <img
                src={clubChoirWordmark}
                alt="Club Choir"
                width="600"
                height="240"
                className="w-full max-w-[220px] sm:max-w-[260px]"
                loading="eager"
                fetchPriority="high"
              />

              <div className="space-y-5">
                <h1 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground leading-tight">
                  {t("home.hero.h1")}
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                  {t("home.hero.subtitle")}
                </p>
              </div>

              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-pink text-pink-foreground font-bold shadow-lg shadow-pink/25 hover:shadow-xl hover:scale-[1.02] transition-all"
                  >
                    <Sparkles className="w-5 h-5" />
                    {t("home.hero.registerFall")}
                  </Link>
                  <a
                    href="#sessions"
                    className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full border-2 border-orange text-orange font-bold hover:bg-orange hover:text-orange-foreground transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    {t("home.hero.seeSessions")}
                  </a>
                </div>




                <div className="pt-5 border-t border-orange/20">
                  <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="px-2 py-0.5 bg-lime/20 text-lime rounded-md font-bold text-[10px] uppercase tracking-wider">
                      {isFr ? "Ouvert" : "Open Now"}
                    </span>
                    <span>{t("home.hero.reassurance")}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Visual */}
            <div className="relative order-1 lg:order-2 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              {/* Soft accent blobs */}
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-lime/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative">
                {/* Offset outlined frame accent */}
                <div className="absolute -top-4 -left-4 w-full h-full border-2 border-orange rounded-[2.5rem] -z-10" />
                <div className="rounded-[2.5rem] overflow-hidden shadow-2xl bg-muted">
                  <img
                    src={heroStage}
                    alt="Club Choir members singing outdoors at NDG Porchfest"
                    className="w-full aspect-[4/5] object-cover"
                    loading="eager"
                    fetchPriority="high"
                    width={1600}
                    height={2000}
                  />
                </div>

                {/* Floating chip badge */}
                <div className="absolute -bottom-5 right-6 sm:right-12 bg-purple text-purple-foreground px-5 py-3 rounded-2xl shadow-xl rotate-3">
                  <p className="font-heading font-bold text-sm sm:text-base whitespace-nowrap">
                    {isFr ? "Tous les niveaux bienvenus" : "All levels welcome"}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* SESSIONS — moved up. This is what registration visitors are looking for. */}
      <section id="sessions" className="py-16 px-4 bg-background scroll-mt-20">
        <div className="container mx-auto max-w-6xl">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-2 text-center">
            {t("home.sessions.title")}
          </h2>
          <p className="text-lg md:text-base text-primary font-semibold text-center mb-2">
            {t("home.sessions.fall2026")}
          </p>
          <p className="text-base text-muted-foreground text-center mb-8 max-w-2xl mx-auto leading-relaxed">
            {isFr
              ? "Quatre lieux au Québec — Montréal, Hudson, Pointe-Claire et Saint-Hubert. Répétitions hebdomadaires, sans audition, ouvertes à tous les adultes."
              : "Four locations across Quebec — Montreal, Hudson, Pointe-Claire, and Saint-Hubert. Weekly no-audition adult rehearsals, all skill levels welcome."}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {locations.map((item) => (
              <div
                key={item.location}
                className={`relative rounded-2xl border p-5 ${item.color} flex flex-col`}
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.dot}`} />
                  <span className="font-heading font-bold text-foreground">{item.location}</span>
                  {item.isNew && (
                    <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                      {isFr ? "Nouveau" : "New"}
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground/80 mb-1">
                  {item.day} · {item.time}
                </p>
                <p className="text-base font-bold text-foreground mb-2">{item.dates}</p>
                <p className="text-xs text-muted-foreground whitespace-pre-line mb-3 flex-1">{item.venue}</p>


                <div className="flex items-center justify-between gap-2 mt-auto">
                  <Link
                    to={`/choir/${item.slug}`}
                    className="text-xs font-semibold text-foreground/70 hover:text-foreground inline-flex items-center gap-1"
                  >
                    {t("home.sessions.learnMore")}
                  </Link>
                  <Link
                    to="/register"
                    className="text-xs font-bold px-3 py-1.5 rounded-full bg-foreground text-background hover:opacity-90 transition-opacity inline-flex items-center gap-1"
                  >
                    {t("home.sessions.register")}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOUNDER — light band (photo on left, cream background on right) */}
      <section className="py-14 px-4 bg-card">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="rounded-2xl overflow-hidden shadow-md">
              <img
                src={founderPhoto}
                alt="Ailsa, founder of Club Choir"
                className="w-full h-full object-cover aspect-[4/5] md:aspect-square"
                loading="lazy"
                decoding="async"
                width={800}
                height={800}
              />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-primary mb-3">{t("home.ourStory.eyebrow")}</p>
              <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
                {t("home.ourStory.title")}
              </h2>
              <p className="text-lg text-foreground/80 leading-relaxed mb-6">
                {t("home.ourStory.body")}
              </p>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-base shadow hover:shadow-lg hover:bg-primary/90 transition-all"
              >
                {t("home.ourStory.cta")}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* WHY MEMBERS COME BACK — light band with photo accent */}
      <section className="py-14 px-4 bg-background">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="md:order-2 rounded-2xl overflow-hidden shadow-md">
              <img
                src={whyComeBackPhoto}
                alt="Club Choir members celebrating together"
                className="w-full h-full object-cover aspect-[4/5] md:aspect-square"
                loading="lazy"
                decoding="async"
                width={800}
                height={800}
              />
            </div>
            <div className="md:order-1">
              <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-5">
                {t("home.whyComeBack.title")}
              </h2>
              <div className="space-y-3 mb-5">
                <p className="text-base text-foreground/80 leading-relaxed">{t("home.whyComeBack.p1")}</p>
                <p className="text-base text-foreground/80 leading-relaxed">{t("home.whyComeBack.p2")}</p>
                <p className="text-base text-foreground/80 leading-relaxed">{t("home.whyComeBack.p3")}</p>
              </div>
              <div className="space-y-2 mb-6 pl-4 border-l-2 border-primary/40">
                <blockquote className="text-base text-foreground/70 italic">&ldquo;{t("home.whyComeBack.quote1")}&rdquo;</blockquote>
                <blockquote className="text-base text-foreground/70 italic">&ldquo;{t("home.whyComeBack.quote2")}&rdquo;</blockquote>
                <blockquote className="text-base text-foreground/70 italic">&ldquo;{t("home.whyComeBack.quote3")}&rdquo;</blockquote>
              </div>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-base shadow hover:shadow-lg hover:bg-primary/90 transition-all"
              >
                {t("home.whyComeBack.cta")}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT WE SING — compact light band */}
      <section className="py-14 px-4 bg-card">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-5 gap-6 items-center">
            <div className="md:col-span-2 rounded-2xl overflow-hidden shadow-md">
              <img
                src={whatWeSingPhoto}
                alt="Club Choir performing"
                className="w-full h-full object-cover aspect-square"
                loading="lazy"
                decoding="async"
                width={800}
                height={800}
              />
            </div>
            <div className="md:col-span-3">
              <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-3">
                {t("home.whatWeSing.title")}
              </h2>
              <p className="text-base text-foreground/80 leading-relaxed mb-3">{t("home.whatWeSing.intro")}</p>
              <p className="font-heading font-bold text-sm text-foreground mb-1">
                {t("home.whatWeSing.recent")}
              </p>
              <p className="text-sm text-foreground/70 leading-relaxed mb-5">
                {isFr
                  ? "Valerie, Lemon Tree, Wicked Game, Hélène, Ho Hey, You're The One That I Want, I See Fire, Sweet Child O' Mine, Pretty Woman, Sweet Dreams / Seven Nation Army et Lose It."
                  : "Valerie, Lemon Tree, Wicked Game, Hélène, Ho Hey, You're The One That I Want, I See Fire, Sweet Child O' Mine, Pretty Woman, Sweet Dreams / Seven Nation Army and Lose It."}
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow hover:shadow-lg hover:bg-primary/90 transition-all"
              >
                {t("home.whatWeSing.cta")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS — 4 by default, expandable */}
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto max-w-7xl">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-2 text-center">
            {t("home.testimonials.title")}
          </h2>
          <p className="text-center text-base text-muted-foreground mb-6 leading-relaxed">{t("home.testimonials.subtitle")}</p>
          <div className="text-center mb-8">
            <a
              href="https://g.page/r/CU1hiLJTYmtXEAE/review"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:shadow-lg hover:bg-primary/90 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              {t("home.testimonials.review")}
            </a>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleTestimonials.map((tst) => (
              <div
                key={tst.name}
                className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: tst.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{tst.text}</p>
                <p className="mt-auto font-heading font-bold text-sm text-foreground">{tst.name}</p>
              </div>
            ))}
          </div>
          {testimonials.length > 4 && (
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => setShowAllTestimonials((v) => !v)}
                className="text-sm font-semibold text-primary hover:underline"
              >
                {showAllTestimonials ? t("home.testimonials.showLess") : t("home.testimonials.showMore")}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto max-w-3xl">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-2 text-center">
            {t("home.faq.title")}
          </h2>
          <p className="text-center text-base text-muted-foreground mb-10 leading-relaxed">{t("home.faq.subtitle")}</p>
          <Accordion type="single" collapsible className="space-y-3">
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="rounded-2xl border border-border bg-card px-5">
                <AccordionTrigger className="font-heading font-bold text-foreground text-left hover:no-underline py-4">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="text-center mt-10">
            <p className="text-base text-muted-foreground mb-4 leading-relaxed">{t("home.faq.still")}</p>
            <Link
              to="/try"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-base shadow-md hover:shadow-lg hover:bg-primary/90 transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              {t("home.faq.touch")}
            </Link>
          </div>
        </div>
      </section>

      {/* Photo gallery */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-2 text-center">
            {t("home.moments.title")}
          </h2>
          <p className="text-center text-base text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            {t("home.moments.subtitle")}
          </p>
          <PhotoGallery photos={choirPhotos} columns={3} />
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-8 text-center">
            {t("home.community.title")}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link
              to="/events"
              className="group rounded-2xl border border-border bg-card p-6 hover:shadow-md transition-all"
            >
              <Calendar className="w-8 h-8 text-aqua mb-3" />
              <h3 className="font-heading font-bold text-lg text-foreground mb-1">{t("home.community.events")}</h3>
              <p className="text-base text-muted-foreground leading-relaxed">{t("home.community.eventsDesc")}</p>
            </Link>
            <Link
              to="/corporate"
              className="group rounded-2xl border border-border bg-card p-6 hover:shadow-md transition-all"
            >
              <Users className="w-8 h-8 text-purple mb-3" />
              <h3 className="font-heading font-bold text-lg text-foreground mb-1">{t("home.community.corporate")}</h3>
              <p className="text-base text-muted-foreground leading-relaxed">{t("home.community.corporateDesc")}</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Stay in the loop */}
      <section className="py-14 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="rounded-2xl bg-card border border-border p-6 md:p-7 text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
              <Mail className="w-6 h-6" />
            </div>
            <h2 className="font-heading font-bold text-xl md:text-2xl text-foreground mb-2">
              {t("home.subscribe.title")}
            </h2>
            <p className="text-base text-muted-foreground mb-5 max-w-xl mx-auto leading-relaxed">
              {t("home.subscribe.desc")}
            </p>
            <Link
              to="/subscribe"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow hover:shadow-lg hover:bg-primary/90 hover:scale-[1.02] transition-all"
            >
              <Mail className="w-4 h-4" />
              {t("home.subscribe.cta")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
