import { useEffect, useState } from "react";
import { CalendarDays, Check, Clock, HelpCircle, MapPin, Music2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const EVENT_KEY = "wheel-club-social-2026-11-01";
type Answer = "yes" | "no" | "maybe";

const copy = {
  en: { title: "Let’s sing and celebrate together!", intro: "Join choir members from all four locations for a relaxed mid-session afternoon of karaoke. No rehearsal — just singing and celebrating together. Bar and food are available on site.", reminder: "Thank you to everyone who has taken the time to reply! If you haven’t yet, please let me know below. You can always change your mind later — just come back here to change your answer.", date: "Sunday, November 1, 2026", time: "2:00–5:00 PM", question: "Will you be there?", yes: "Yes, I’ll be there", no: "No, I can’t make it", maybe: "Interested, but not sure", saved: "Your RSVP is saved. You can change it anytime before the event.", error: "We couldn’t save your RSVP. Please try again." },
  fr: { title: "Chantons et célébrons ensemble !", intro: "Joignez-vous aux membres de nos quatre lieux pour un après-midi détendu de karaoké à mi-session. Pas de répétition — seulement du chant et une belle célébration ensemble. Bar et nourriture disponibles sur place.", reminder: "Merci à toutes les personnes qui ont pris le temps de répondre ! Si vous ne l’avez pas encore fait, faites-moi signe ci-dessous. Vous pouvez toujours changer d’idée plus tard — revenez simplement ici pour modifier votre réponse.", date: "Dimanche 1er novembre 2026", time: "14 h à 17 h", question: "Serez-vous des nôtres ?", yes: "Oui, je serai là", no: "Non, je ne peux pas venir", maybe: "Ça m’intéresse, mais je ne suis pas certaine ou certain", saved: "Votre réponse est enregistrée. Vous pouvez la modifier en tout temps avant l’événement.", error: "Nous n’avons pas pu enregistrer votre réponse. Veuillez réessayer." },
};

export function ChoirSocialRsvp() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const text = copy[language];
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("member_event_rsvps").select("response").eq("event_key", EVENT_KEY).maybeSingle().then(({ data }) => {
      if (data?.response === "yes" || data?.response === "no" || data?.response === "maybe") setAnswer(data.response);
    });
  }, []);

  const save = async (response: Answer) => {
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user?.email) { toast({ title: text.error, variant: "destructive" }); setSaving(false); return; }
    const { data: profile } = await supabase.rpc("get_my_member_profile").maybeSingle();
    const { error } = await supabase.from("member_event_rsvps").upsert({
      event_key: EVENT_KEY, user_id: user.id, response,
      display_name: (profile?.display_name || user.email.split("@")[0]).trim().slice(0, 160),
      email: user.email.trim().toLowerCase().slice(0, 255), location: profile?.location || null,
    }, { onConflict: "event_key,user_id" });
    if (error) toast({ title: text.error, variant: "destructive" }); else setAnswer(response);
    setSaving(false);
  };

  const choices: { value: Answer; label: string; icon: typeof Check }[] = [{ value: "yes", label: text.yes, icon: Check }, { value: "no", label: text.no, icon: X }, { value: "maybe", label: text.maybe, icon: HelpCircle }];
  return <section id="choir-social-rsvp" className="mb-8 scroll-mt-24 overflow-hidden rounded-xl border border-aqua/30 bg-aqua-light shadow-sm">
    <div className="bg-aqua px-5 py-4 text-foreground md:px-7"><p className="text-xs font-bold uppercase tracking-wider opacity-90">{language === "fr" ? "Rencontre de la chorale" : "Choir social"}</p><h2 className="mt-1 font-heading text-2xl font-bold md:text-3xl">{text.title}</h2></div>
    <div className="p-5 md:p-7"><p className="max-w-3xl leading-relaxed text-foreground">{text.intro}</p><div className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><p className="flex gap-2"><CalendarDays className="h-4 w-4 text-primary" /><strong>{text.date}</strong></p><p className="flex gap-2"><Clock className="h-4 w-4 text-primary" /><strong>{text.time}</strong></p><p className="flex gap-2 sm:col-span-2"><MapPin className="h-4 w-4 text-primary" /><span><strong>The Wheel Club</strong> · 3373 Cavendish, Montreal, QC H4B 2L7</span></p></div>
      <p className="mt-4 max-w-3xl font-semibold leading-relaxed text-foreground">{text.reminder}</p><div className="mt-6 border-t border-aqua/30 pt-5"><p className="mb-3 flex items-center gap-2 font-heading text-lg font-bold"><Music2 className="h-5 w-5 text-primary" />{text.question}</p><div className="grid gap-2 sm:grid-cols-3">{choices.map(({ value, label, icon: Icon }) => <Button key={value} variant={answer === value ? "default" : "outline"} className="h-auto min-h-11 whitespace-normal py-2.5" disabled={saving} onClick={() => save(value)}><Icon className="mr-2 h-4 w-4" />{label}</Button>)}</div>{answer && <p className="mt-3 text-sm text-muted-foreground">{text.saved}</p>}</div>
    </div>
  </section>;
}