import { Link } from "react-router-dom";
import { Music, MapPin, Clock, Calendar } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const ThisWeek = () => {
  const { t } = useLanguage();

  const sessions = [
    { location: "Montreal", slug: "montreal", venue: "Kensington Presbyterian Church", day: t("day.monday"), time: "7:00–8:30 PM", address: "6225 Av. Godfrey", dot: "bg-pink", bg: "bg-pink-light border-pink/20" },
    { location: "Arundel", slug: "arundel", venue: "Centre Arundel Centre", day: t("day.tuesday"), time: "6:30–8:00 PM", address: "17 rue du Village, Arundel", dot: "bg-aqua", bg: "bg-aqua-light border-aqua/20" },
    { location: "Saint-Hubert", slug: "saint-hubert", venue: "St-Gabriel Catholic Church", day: t("day.wednesday"), time: "7:00–8:30 PM", address: "5070 Rue Gilbert, Saint-Hubert", dot: "bg-lime", bg: "bg-lime-light border-lime/20" },
    { location: "Pointe-Claire", slug: "pointe-claire", venue: "Valois United Church", day: t("day.thursday"), time: "7:00–8:30 PM", address: "70 Belmont Ave, Pointe-Claire", dot: "bg-purple", bg: "bg-purple-light border-purple/20" },
  ];

  return (
    <div className="py-16 px-4">
      <div className="container mx-auto max-w-3xl">
        <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-2 text-center">
          {t("thisWeek.title")}
        </h1>
        <p className="text-center text-muted-foreground mb-10">
          {t("thisWeek.subtitle")}
        </p>

        <div className="space-y-4">
          {sessions.map((s) => (
            <div key={s.location} className={`rounded-2xl border p-6 ${s.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-3 h-3 rounded-full ${s.dot}`} />
                <h3 className="font-heading font-bold text-lg text-foreground">{s.location}</h3>
              </div>
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
