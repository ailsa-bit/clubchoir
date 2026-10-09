import PageMeta from "@/components/PageMeta";
import { MemberWelcomeMessage } from "@/components/MemberWelcomeMessage";
import { ChoirSocialRsvp } from "@/components/ChoirSocialRsvp";
import { Link } from "react-router-dom";
import { Music, MapPin, Clock, Calendar, ArrowRight, Bell } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const ThisWeek = () => {
  const { t, language } = useLanguage();

  const sessions = [
    { location: "Montreal", slug: "montreal", venue: "Paroisse Notre-Dame-De-Grâce", day: t("day.monday"), time: "7:00–8:30 PM", address: "5333 avenue Notre-Dame-De-Grâce (corner Décarie)", dot: "bg-pink", bg: "bg-pink-light border-pink/20", dates: "Sept 7 – Dec 7, 2026" },
    { location: "Hudson", slug: "hudson", venue: "The Hudson Legion", day: t("day.tuesday"), time: "7:00–8:30 PM", address: "57 Beach Road, Hudson, J0P 1H0", dot: "bg-orange", bg: "bg-orange-light border-orange/20", dates: "Sept 8 – Dec 8, 2026" },
    
    { location: "Saint-Hubert", slug: "saint-hubert", venue: "St-Gabriel Catholic Church", day: t("day.wednesday"), time: "7:00–8:30 PM", address: "5070 Rue Gilbert, Saint-Hubert", dot: "bg-lime", bg: "bg-lime-light border-lime/20", dates: "Sept 9 – Dec 9, 2026" },
    { location: "Pointe-Claire", slug: "pointe-claire", venue: "Valois United Church", day: t("day.thursday"), time: "7:00–8:30 PM", address: "70 Belmont Ave, Pointe-Claire", dot: "bg-purple", bg: "bg-purple-light border-purple/20", dates: "Sept 10 – Dec 10, 2026" },
  ];

  return (
    <div className="py-16 px-4">
      <PageMeta title={t("meta.thisWeek.title")} description={t("meta.thisWeek.desc")} path="/this-week" />
      <div className="container mx-auto max-w-4xl lg:max-w-5xl px-4">
        {new Date() <= new Date("2026-11-02T04:59:59Z") && <ChoirSocialRsvp />}
        <section aria-labelledby="special-messages-title" className="mb-8 rounded-xl border border-orange/30 bg-orange-light p-5 md:p-7">
          <h2 id="special-messages-title" className="mb-4 flex items-center gap-2 font-heading text-xl font-bold text-foreground">
            <Bell className="h-5 w-5 shrink-0 text-foreground" />
            {language === "fr" ? "Messages spéciaux" : "Special messages"}
          </h2>
          <div className="space-y-4 text-foreground">
            <div>
              <h3 className="font-heading text-lg font-bold">Hudson</h3>
              <p className="mt-1 leading-relaxed">{language === "fr" ? "À partir de ce mardi 13 octobre, nous recommençons à 19 h ! Nous retrouvons notre horaire habituel : de 19 h à 20 h 30. Les soirées burgers sont terminées." : "Starting this Tuesday, October 13, we’ll be back to a 7:00 PM start! Our regular schedule is 7:00–8:30 PM. No more burger night."}</p>
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold">{language === "fr" ? "Montréal" : "Montreal"}</h3>
              <p className="mt-1 leading-relaxed">{language === "fr" ? "Nous nous retrouverons à notre heure habituelle, de 19 h à 20 h 30, ce lundi 12 octobre, même si c’est l’Action de grâce. J’ai hâte de chanter avec vous !" : "We’re meeting at our usual time, 7:00–8:30 PM, this Monday, October 12, even though it’s Thanksgiving. Looking forward to singing with you!"}</p>
            </div>
          </div>
        </section>
        <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-2 text-center">
          {t("thisWeek.title")}
        </h1>
        <p className="text-center text-muted-foreground mb-6">
          {t("thisWeek.subtitle")}
        </p>

        <div className="mb-8">
          <MemberWelcomeMessage />
          <div className="mt-6 flex justify-center">
            <Link
              to="/resources/fall-2026"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90"
            >
              {t("thisWeek.songResources")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          {sessions.map((s) => (
            <div key={s.location} className={`rounded-2xl border p-6 ${s.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-3 h-3 rounded-full ${s.dot}`} />
                <h3 className="font-heading font-bold text-lg text-foreground">{s.location}</h3>
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">{s.dates}</p>
              <p className="text-sm font-medium text-foreground/80 mb-1">{s.venue}</p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{s.day} · {s.time}</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{s.address}</span>
              </div>
              <Link
                to={`/schedule/${s.slug}`}
                className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-primary hover:underline"
              >
                <Calendar className="w-4 h-4" /> {t("thisWeek.schedule")}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6 text-center">
          <Music className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="font-heading font-bold text-foreground mb-1">{t("thisWeek.expect.title")}</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {t("thisWeek.expect.desc")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ThisWeek;
