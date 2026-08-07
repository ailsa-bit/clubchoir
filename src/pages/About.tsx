import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Calendar, Users, Heart } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import founderPhoto from "@/assets/founder-ailsa.webp";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const About = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState<{ singers: number; locations: number }>({ singers: 296, locations: 4 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("get_public_choir_stats");
      const row = Array.isArray(data) ? data[0] : data;
      if (!cancelled && !error && row) {
        setStats({ singers: Number(row.singers) || 0, locations: Number(row.locations) || 4 });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="py-12 px-4">
      <PageMeta
        title="Our Story – Club Choir | Founder Ailsa"
        description="Meet Ailsa, founder of Club Choir. From 21 voices in Montreal to a regional family of 390 singers — sing together, laugh together, learn together."
        path="/about"
      />

      <div className="container mx-auto max-w-7xl">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {t("common.backHome")}
        </Link>

        {/* Hero */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8 mb-8 overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider mb-3">
            <Heart className="w-3.5 h-3.5" /> {t("about.eyebrow")}
          </div>
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-3 leading-tight">
            {t("about.title")}
          </h1>
          <p className="text-base md:text-lg text-foreground/80 leading-relaxed mb-3">
            {t("about.heroLead")}
          </p>
          <p className="font-heading text-lg text-foreground italic">
            {t("about.founderRole")}
          </p>
        </div>

        {/* Founder + Story */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 mb-8 overflow-hidden">
          <img
            src={founderPhoto}
            alt="Ailsa, founder of Club Choir, recording in a studio"
            className="w-full h-auto rounded-xl mb-5 object-cover"
            loading="eager"
          />
          <h2 className="font-heading font-bold text-2xl text-foreground mb-3">{t("about.meetAilsa")}</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">{t("about.bio1")}</p>
          <p className="text-muted-foreground leading-relaxed mb-3">{t("about.bio2")}</p>
          <p className="text-muted-foreground leading-relaxed mb-5">{t("about.bio3")}</p>

          <blockquote className="border-l-4 border-primary pl-5 py-2 my-5">
            <p className="font-heading text-xl md:text-2xl text-foreground italic leading-snug">
              {t("about.quote")}
            </p>
          </blockquote>

          <p className="text-muted-foreground leading-relaxed">
            {t("about.philosophy")}{" "}
            <span className="font-bold text-primary">
              {t("about.philosophyHighlight")}
            </span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-border bg-card p-5">
            <Calendar className="w-5 h-5 text-primary mb-2" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {t("about.stat.founded")}
            </p>
            <p className="font-heading font-bold text-3xl text-foreground">2024</p>
            <p className="text-xs text-muted-foreground">{t("about.stat.foundedSub")}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <Users className="w-5 h-5 text-primary mb-2" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {t("about.stat.members")}
            </p>
            <p className="font-heading font-bold text-3xl text-foreground">{stats.singers}+</p>
            <p className="text-xs text-muted-foreground">{t("about.stat.membersSub")}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <Sparkles className="w-5 h-5 text-primary mb-2" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {t("about.stat.locations")}
            </p>
            <p className="font-heading font-bold text-3xl text-foreground">5</p>
            <p className="text-xs text-muted-foreground">{t("about.stat.locationsSub")}</p>
          </div>
        </div>

        {/* CTA banner */}
        <div className="rounded-2xl bg-gradient-warm text-primary-foreground p-6 mb-8 text-center shadow-md">
          <Heart className="w-8 h-8 mx-auto mb-2 opacity-90" />
          <h3 className="font-heading font-bold text-xl mb-1">{t("about.cta.heading")}</h3>
          <p className="text-sm md:text-base opacity-95 max-w-md mx-auto">
            {t("about.cta.lead")}
          </p>
        </div>

        {/* CTA buttons */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 mb-8 text-center">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/subscribe"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold shadow hover:shadow-lg hover:scale-[1.02] transition-all"
            >
              <Sparkles className="w-5 h-5" />
              {t("about.cta.mailing")}
            </Link>
            <Link
              to="/events"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-secondary text-secondary-foreground font-semibold shadow hover:shadow-lg hover:scale-[1.02] transition-all"
            >
              <Calendar className="w-5 h-5" />
              {t("about.cta.events")}
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {t("common.questions")}{" "}
          <a href="mailto:ailsa@clubchoir.ca" className="text-primary font-medium hover:underline">
            ailsa@clubchoir.ca
          </a>
        </p>
      </div>
    </div>
  );
};

export default About;
