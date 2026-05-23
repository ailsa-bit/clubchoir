import { Link } from "react-router-dom";
import { Users, Calendar, Sparkles, Star, ExternalLink, MessageCircle, Mail, ArrowRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import PageMeta from "@/components/PageMeta";
import PhotoGallery from "@/components/PhotoGallery";
import { choirPhotos } from "@/assets/photos";
import clubChoirWordmark from "@/assets/club-choir-wordmark.webp";
import founderPhoto from "@/assets/founder-ailsa.webp";
import heroStage from "@/assets/photos/hero-choir.jpg";
import whyComeBackPhoto from "@/assets/why-members-come-back.webp";
import whatWeSingPhoto from "@/assets/photos/what-we-sing.jpg";

const testimonials = [
  { name: "Ron Cole", stars: 5, text: "As a ski instructor, I know the effort and skill required to take charge of a group of beginners and lead them as one unit in a successful and joyous direction. Ailsa is gifted in this capacity. Singing is one of the few activities that light up so many parts of the brain at once... a great way to keep the mind sharp." },
  { name: "Sonia Klebanskyj", stars: 5, text: "ClubChoir is so much fun! Ailsa is a wonderful choir director for a novice choir singer or for people who want to rediscover the joy of singing. Join and you won't be disappointed!" },
  { name: "Claude Aimée Villeneuve", stars: 5, text: "I love the way Ailsa has an interesting way of teaching the songs so that anyone who just loves singing can enjoy themselves right away, no need to know how to read music or have previous choir experience. It's fun, the vibes are upbeat!" },
  { name: "Claudine Turnbull", stars: 5, text: "I'm so thankful to my friend for encouraging me to join Club Choir! Ailsa instantly makes you feel comfortable and brings amazing energy every week. It's truly become my weekly happiness boost!" },
  { name: "Martin Leclerc", stars: 5, text: "Great, contagious energy from Ailsa, leading the choir through fun singing! Very happy with the repertoire, the people, the arrangement and the simple enjoyment of it all." },
  { name: "Lori Cook", stars: 5, text: "Ailsa has made my first choir experience a very positive one. I have met some great people and have gained confidence in my singing abilities." },
  { name: "Lydia Woronchak", stars: 5, text: "You don't have to be a great singer to be in Club Choir and you don't even have to audition. All you have to do is love to sing! You're guaranteed to have fun, meet new people and leave feeling joyful!" },
  { name: "Danielle Jasmin", stars: 5, text: "J'ai beaucoup apprécié Ailsa. Une maître choeur dynamique, qui connaît sa musique, ses chansons. Une très bonne approche pédagogique qui fait que tout le monde apprend en s'amusant !" },
  { name: "Kerry Johnson", stars: 5, text: "ClubChoir is awesome! It's a fantastic way to bring people together, celebrate community, and share the love of music in a welcoming space where everyone can sing, no experience required. Every session is filled with laughter and connection. A truly uplifting and fun experience!" },
];

const Index = () => {
  const { language, t } = useLanguage();
  const isFr = language === "fr";

  const faqItems = [
    { q: t("home.faq.q.cost"), a: t("home.faq.a.cost") },
    { q: t("home.faq.q.music"), a: t("home.faq.a.music") },
    { q: t("home.faq.q.shy"), a: t("home.faq.a.shy") },
    { q: t("home.faq.q.miss"), a: t("home.faq.a.miss") },
    { q: t("home.faq.q.audition"), a: t("home.faq.a.audition") },
    { q: t("home.faq.q.kind"), a: t("home.faq.a.kind") },
    { q: t("home.faq.q.bring"), a: t("home.faq.a.bring") },
    { q: t("home.faq.q.bad"), a: t("home.faq.a.bad") },
  ];

  const locations = [
    { location: "Montreal", slug: "montreal", venue: "Kensington Presbyterian Church\n6225 Av. Godfrey, Montréal, QC H4B 1K3", color: "bg-pink-light border-pink/20", day: t("day.monday"), time: "7:00–8:30 PM", dot: "bg-pink", dates: "Sept 7 – Dec 7, 2026", isNew: false },
    { location: "Hudson", slug: "hudson", venue: "Kingfisher Pub\n84 Rue Cameron, Hudson, QC J0P 1H0", color: "bg-orange-light border-orange/20", day: t("day.tuesday"), time: "7:00–8:30 PM", dot: "bg-orange", dates: "Sept 8 – Dec 8, 2026", isNew: true },
    { location: "Arundel", slug: "arundel", venue: "Centre Arundel Centre\n17 Rue du Village, Arundel, QC J0T 1A0", color: "bg-aqua-light border-aqua/20", day: t("day.tuesday"), time: "6:30–8:00 PM", dot: "bg-aqua", dates: t("home.sessions.tbc"), isNew: false },
    { location: "Saint-Hubert", slug: "saint-hubert", venue: "St-Gabriel Catholic Church\n5070 Rue Gilbert, Saint-Hubert, QC J3Y 2K7", color: "bg-lime-light border-lime/20", day: t("day.wednesday"), time: "7:00–8:30 PM", dot: "bg-lime", dates: "Sept 9 – Dec 9, 2026", isNew: false },
    { location: "Pointe-Claire", slug: "pointe-claire", venue: "Valois United Church\n70 Av. Belmont, Pointe-Claire, QC H9R 4H2", color: "bg-purple-light border-purple/20", day: t("day.thursday"), time: "7:00–8:30 PM", dot: "bg-purple", dates: "Sept 10 – Dec 10, 2026", isNew: false },
  ];

  return (
    <div>
      <PageMeta
        title="Choir Montreal | Club Choir – No-Audition Community Choir for Adults"
        description="Join Club Choir, a fun no-audition community choir for adults in Montreal, Hudson, Pointe-Claire, Saint-Hubert and Arundel. Fall 2026 registration is open."
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
      <section className="relative overflow-hidden px-4 py-20 lg:py-28">
        {/* Full-bleed background photo */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroStage}
            alt="Club Choir members singing outdoors from colorful Club Choir binders at NDG Porchfest"
            className="w-full h-full object-cover"
            style={{ filter: "brightness(1.15) saturate(1.05)" }}
            loading="eager"
            fetchPriority="high"
          />
          {/* Readability overlay — darker on the left where text sits, lighter on the right to keep the photo bright */}
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/65 via-foreground/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-foreground/25" />
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="max-w-2xl text-center lg:text-left">
            <img
              src={clubChoirWordmark}
              alt="Club Choir"
              width="600"
              height="240"
              className="w-full max-w-[240px] sm:max-w-[300px] mx-auto lg:mx-0 mb-5 animate-fade-in drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
              loading="eager"
              fetchPriority="high"
            />
            <h1 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-background mb-5 leading-tight animate-fade-in drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]">
              {t("home.hero.h1")}
            </h1>
            <p className="text-lg sm:text-xl text-background/95 mb-8 animate-fade-in leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]" style={{ animationDelay: "0.1s" }}>
              {t("home.hero.subtitle")}
            </p>
            <p className="text-base sm:text-lg text-background/90 mb-8 animate-fade-in whitespace-pre-line leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]" style={{ animationDelay: "0.15s" }}>
              {t("home.hero.desc")}
            </p>

            <p className="text-lg sm:text-xl text-background/95 mb-5 leading-relaxed animate-fade-in drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]" style={{ animationDelay: "0.2s" }}>
              {t("home.hero.eventsSummary")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start animate-fade-in" style={{ animationDelay: "0.22s" }}>
              <Link
                to="/register"
                className="relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold text-lg shadow-md hover:shadow-lg hover:bg-primary/90 hover:scale-[1.02] transition-all"
              >
                <Sparkles className="w-6 h-6" />
                {t("home.hero.registerFall")}
              </Link>
              <Link
                to="/events"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-background/95 text-foreground font-semibold text-lg shadow hover:shadow-lg hover:bg-background hover:scale-[1.02] transition-all"
              >
                <Calendar className="w-6 h-6" />
                {t("home.hero.upcomingEvents")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Founder teaser */}
      <section className="relative overflow-hidden px-4 py-20 lg:py-28 border-y border-border/60">
        {/* Full-bleed background photo */}
        <div className="absolute inset-0 z-0">
          <img
            src={founderPhoto}
            alt="Ailsa, founder of Club Choir"
            className="w-full h-full object-cover object-[center_25%]"
            style={{ filter: "brightness(1.15) saturate(1.05)" }}
            loading="lazy"
          />
          {/* Readability overlay: darker on the right where text sits */}
          <div className="absolute inset-0 bg-gradient-to-l from-foreground/85 via-foreground/65 to-foreground/25" />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/10 via-transparent to-foreground/30" />
        </div>

        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="max-w-xl ml-auto text-center md:text-right">
            <p className="text-base font-bold uppercase tracking-wider text-background/90 mb-3">{t("home.ourStory.eyebrow")}</p>
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-background mb-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
              {t("home.ourStory.title")}
            </h2>
            <p className="text-xl text-background/95 leading-relaxed mb-6 drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]">
              {t("home.ourStory.body")}
            </p>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-base shadow hover:shadow-lg hover:bg-primary/90 transition-all"
            >
              {t("home.ourStory.cta")}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Members Come Back */}
      <section className="relative overflow-hidden px-4 py-20 lg:py-28 border-y border-border/60">
        {/* Full-bleed background photo */}
        <div className="absolute inset-0 z-0">
          <img
            src={whyComeBackPhoto}
            alt="Club Choir members celebrating together"
            className="w-full h-full object-cover"
            style={{ filter: "brightness(1.15) saturate(1.05)" }}
            loading="lazy"
          />
          {/* Readability overlay: darker on the left where text sits, lighter on the right to keep the photo bright */}
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/75 via-foreground/45 to-foreground/15" />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/10 via-transparent to-foreground/25" />
        </div>

        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="max-w-xl mr-auto text-center md:text-left">
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-background mb-6 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
              {t("home.whyComeBack.title")}
            </h2>
            <div className="space-y-4 mb-8">
              <p className="text-lg text-background/95 leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]">
                {t("home.whyComeBack.p1")}
              </p>
              <p className="text-lg text-background/95 leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]">
                {t("home.whyComeBack.p2")}
              </p>
              <p className="text-lg text-background/95 leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]">
                {t("home.whyComeBack.p3")}
              </p>
            </div>
            <div className="space-y-3 mb-8">
              <blockquote className="text-lg text-background/95 italic leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]">
                &ldquo;{t("home.whyComeBack.quote1")}&rdquo;
              </blockquote>
              <blockquote className="text-lg text-background/95 italic leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]">
                &ldquo;{t("home.whyComeBack.quote2")}&rdquo;
              </blockquote>
              <blockquote className="text-lg text-background/95 italic leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]">
                &ldquo;{t("home.whyComeBack.quote3")}&rdquo;
              </blockquote>
            </div>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-base shadow hover:shadow-lg hover:bg-primary/90 transition-all"
            >
              {t("home.whyComeBack.cta")}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* What Do We Sing */}
      <section className="relative overflow-hidden px-4 py-20 lg:py-28 border-y border-border/60">
        {/* Full-bleed background photo */}
        <div className="absolute inset-0 z-0">
          <img
            src={whatWeSingPhoto}
            alt="Club Choir performing at NDG Porchfest"
            className="w-full h-full object-cover"
            style={{ filter: "brightness(1.15) saturate(1.05)" }}
            loading="lazy"
          />
          {/* Readability overlay: darker on the right where text sits */}
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/15 via-foreground/60 to-foreground/85" />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/5 via-transparent to-foreground/20" />

        </div>

        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="max-w-xl ml-auto text-right">
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-background mb-6 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
              {t("home.whatWeSing.title")}
            </h2>
            <div className="space-y-4 mb-8">
              <p className="text-lg text-background/95 leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]">
                {t("home.whatWeSing.intro")}
              </p>
              <p className="text-lg text-background/95 leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]">
                {t("home.whatWeSing.closing")}
              </p>
            </div>
            <div className="mb-8">
              <p className="font-heading font-bold text-base text-background mb-3 drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]">
                {t("home.whatWeSing.recent")}
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2">
                {[
                  "Valerie",
                  "Lemon Tree",
                  "Wicked Game",
                  "Hélène",
                  "Ho Hey",
                  "You're The One That I Want",
                  "I See Fire",
                  "Sweet Child O' Mine",
                  "Pretty Woman",
                  "Sweet Dreams / Seven Nation Army",
                  "Lose It",
                ].map((song) => (
                  <li
                    key={song}
                    className="flex items-center gap-3 text-base text-background/95 drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-background/80 shrink-0" />
                    <span>{song}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-base shadow hover:shadow-lg hover:bg-primary/90 transition-all"
            >
              {t("home.whatWeSing.cta")}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Sessions Overview */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-2 text-center">
            {t("home.sessions.title")}
          </h2>
          <p className="text-base text-muted-foreground text-center mb-2">
            {t("home.sessions.fall2026")}
          </p>
          <p className="text-sm text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
            {isFr
              ? "Cinq lieux à travers le Québec — Montréal, Hudson, Pointe-Claire, Saint-Hubert et Arundel — pour des répétitions de chorale hebdomadaires, sans audition, ouvertes à tous les adultes."
              : "Five locations across Quebec — Montreal, Hudson, Pointe-Claire, Saint-Hubert, and Arundel — for weekly no-audition adult choir rehearsals open to all skill levels."}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {locations.map((item) => (
              <Link
                key={item.location}
                to={`/choir/${item.slug}`}
                className={`relative rounded-2xl border p-5 ${item.color} transition-shadow hover:shadow-md block`}
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
                <p className="text-sm font-semibold text-foreground mb-1">{item.dates}</p>
                <p className="text-base text-muted-foreground mb-1">
                  {item.day} · {item.time}
                </p>
                <p className="text-sm text-muted-foreground whitespace-pre-line mb-2">{item.venue}</p>
                <p className="text-xs font-semibold text-primary inline-flex items-center gap-1">
                  {t("home.sessions.learnMore")} <ArrowRight className="w-3 h-3" />
                </p>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow hover:shadow-lg hover:bg-primary/90 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              {t("home.hero.registerFall")}
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto max-w-3xl">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-2 text-center">
            {t("home.faq.title")}
          </h2>
          <p className="text-center text-muted-foreground mb-10">{t("home.faq.subtitle")}</p>
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
            <p className="text-muted-foreground mb-4">{t("home.faq.still")}</p>
            <Link
              to="/try"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-warm text-primary-foreground font-semibold text-sm shadow hover:shadow-lg hover:scale-105 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              {t("home.faq.touch")}
            </Link>
          </div>
        </div>
      </section>

      {/* Real moments — choir photo gallery */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-2 text-center">
            {t("home.moments.title")}
          </h2>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
            {t("home.moments.subtitle")}
          </p>
          <PhotoGallery photos={choirPhotos} columns={3} />
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-2 text-center">
            {t("home.testimonials.title")}
          </h2>
          <p className="text-center text-muted-foreground mb-6">{t("home.testimonials.subtitle")}</p>
          <div className="text-center mb-10">
            <a
              href="https://g.page/r/CU1hiLJTYmtXEAE/review"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-warm text-primary-foreground font-semibold text-sm shadow hover:shadow-lg hover:scale-105 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              {t("home.testimonials.review")}
            </a>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.map((tst) => (
              <div
                key={tst.name}
                className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: tst.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-base text-muted-foreground leading-relaxed line-clamp-4">{tst.text}</p>
                <p className="mt-auto font-heading font-bold text-base text-foreground">{tst.name}</p>
              </div>
            ))}
          </div>
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
              <p className="text-base text-muted-foreground">{t("home.community.eventsDesc")}</p>
            </Link>
            <Link
              to="/corporate"
              className="group rounded-2xl border border-border bg-card p-6 hover:shadow-md transition-all"
            >
              <Users className="w-8 h-8 text-purple mb-3" />
              <h3 className="font-heading font-bold text-lg text-foreground mb-1">{t("home.community.corporate")}</h3>
              <p className="text-base text-muted-foreground">{t("home.community.corporateDesc")}</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Stay in the loop — bottom band */}
      <section className="py-14 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="rounded-2xl bg-card border border-border p-6 md:p-7 text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
              <Mail className="w-6 h-6" />
            </div>
            <h2 className="font-heading font-bold text-xl md:text-2xl text-foreground mb-2">
              {t("home.subscribe.title")}
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mb-5 max-w-xl mx-auto">
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
