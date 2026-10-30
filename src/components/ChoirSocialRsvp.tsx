import { CalendarDays, Clock, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const copy = {
  en: { title: "Let’s sing and celebrate together!", intro: "All four locations are invited for a relaxed afternoon of karaoke and good company. Bar and food are available on site.", seeYou: "See you there!", date: "Sunday, November 1, 2026", time: "2:00–5:00 PM" },
  fr: { title: "Chantons et célébrons ensemble !", intro: "Les membres de nos quatre lieux sont invités à un bel après-midi de karaoké en bonne compagnie. Bar et nourriture disponibles sur place.", seeYou: "Au plaisir de vous y voir !", date: "Dimanche 1er novembre 2026", time: "14 h à 17 h" },
};

export function ChoirSocialRsvp() {
  const { language } = useLanguage();
  const text = copy[language];
  return <section id="choir-social-rsvp" className="mb-8 scroll-mt-24 overflow-hidden rounded-xl border border-purple/30 bg-purple-light shadow-sm">
    <div className="bg-purple px-5 py-4 text-foreground md:px-7"><p className="text-xs font-bold uppercase tracking-wider opacity-90">{language === "fr" ? "Rencontre de la chorale" : "Choir social"}</p><h2 className="mt-1 font-heading text-2xl font-bold md:text-3xl">{text.title}</h2></div>
    <div className="p-5 md:p-7"><p className="max-w-3xl leading-relaxed text-foreground">{text.intro}</p><div className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><p className="flex gap-2"><CalendarDays className="h-4 w-4 text-primary" /><strong>{text.date}</strong></p><p className="flex gap-2"><Clock className="h-4 w-4 text-primary" /><strong>{text.time}</strong></p><p className="flex gap-2 sm:col-span-2"><MapPin className="h-4 w-4 text-primary" /><span><strong>The Wheel Club</strong> · 3373 Cavendish, Montreal, QC H4B 2L7</span></p></div>
      <p className="mt-5 flex items-center gap-2 font-heading text-lg font-bold text-foreground">{text.seeYou}</p>
    </div>
  </section>;
}
