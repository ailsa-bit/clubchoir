import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { PenLine, Save, X, CalendarDays, Music, Star } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Announcement = Database["public"]["Tables"]["weekly_announcements"]["Row"];

const DEFAULT_TITLE = { en: "Week 6 — A Note from Ailsa 🎶", fr: "Semaine 6 — Un mot d'Ailsa 🎶" };

const REVIEW_URL = "https://g.page/r/CU1hiLJTYmtXEAE/review";

const WARMUP_URL = "https://youtube.com/playlist?list=PLMuitaLUSyZs&si=xESO2NJJw30HF3kF";

const DEFAULT_MESSAGE = {
  en: `Hello wonderful singers! �SCI

A very warm welcome back to Daniel! We're so happy to have you back at the piano.

This week, I've included a playlist of very helpful, easy warm-ups for every level. There's also one that's a little more advanced, for anyone who would like to give it a try!

I use these every day, several times a day, and I'm so happy to share them with you. Take a little time for your voice, enjoy the warm-ups, and see how they feel.

I can't wait to sing with you again!

Tra-la-la,
Ailsa 🎤✨`,
  fr: `Bonjour merveilleux chanteurs et chanteuses ! 🌟

Un très chaleureux bonjour de retour à Daniel ! Nous sommes si heureux de te retrouver au piano.

Cette semaine, je vous propose une liste de lecture d'échauffements vocaux très utiles et faciles, pour tous les niveaux. Il y en a aussi un un peu plus avancé, pour les personnes qui ont envie de l'essayer !

Je les fais tous les jours, plusieurs fois par jour, et je suis très heureuse de les partager avec vous. Prenez un petit moment pour votre voix, profitez de ces échauffements et voyez comment vous vous sentez.

J'ai très hâte de chanter de nouveau avec vous !

Tra-la-la,
Ailsa 🎤✨`,
};

const SONG_OF_WEEK = {
  en: {
    title: "Song of the Week: “Toxic” — Britney Spears",
    body: `Fun fact: “Toxic” was written by Cathy Dennis, Christian Karlsson, Pontus Winnberg, and Henrik Jonback and performed by Britney Spears in 2004, but it almost wasn't hers at all — it was written with Janet Jackson in mind, and Kylie Minogue passed on it too! That wild string hook is sampled from a 1981 Bollywood song, and the track went on to win Britney her very first Grammy.

We're singing a hybrid of Melanie Martinez's dreamy ukulele version and Jennel Garcia's take — stripped down, full of heart, and with our own Club Choir twist. Same iconic melody, brand new flavor. Can't wait to dive in with you!`,
  },
  fr: {
    title: "Chanson de la semaine : « Toxic » — Britney Spears",
    body: `Petit fait amusant : « Toxic » a été écrite par Cathy Dennis, Christian Karlsson, Pontus Winnberg et Henrik Jonback, et interprétée par Britney Spears en 2004 — mais elle a failli ne jamais lui appartenir : elle a été écrite avec Janet Jackson en tête, et Kylie Minogue l'a aussi refusée ! Ce fameux enchaînement de cordes est samplé d'une chanson Bollywood de 1981, et la chanson a valu à Britney son tout premier Grammy.

Nous chanterons un mélange de la version onirique au ukulélé de Melanie Martinez et de la reprise de Jennel Garcia — épurée, pleine de cœur, avec notre propre touche Club Choir. Même mélodie culte, toute nouvelle saveur. J'ai hâte de m'y plonger avec vous !`,
  },
};

const SECTION_TITLES = {
  ailsa: { en: "A Note from Ailsa 🎶", fr: "Un mot d'Ailsa 🎶" },
};

const formatDateInput = (d: string) => d.split("T")[0];

export function MemberWelcomeMessage() {
  const { language } = useLanguage();
  const { isAdmin } = useAdmin();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: "",
    message_en: DEFAULT_MESSAGE.en,
    message_fr: DEFAULT_MESSAGE.fr,
    active_from: new Date().toISOString().split("T")[0],
  });

  const fetchLatest = async () => {
    const { data, error } = await supabase
      .from("weekly_announcements")
      .select("*")
      .lte("active_from", new Date().toISOString())
      .order("active_from", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!error) {
      setAnnouncement(data);
      if (data) {
        setForm({
          title: data.title || "",
          message_en: data.message_en,
          message_fr: data.message_fr,
          active_from: formatDateInput(data.active_from),
        });
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLatest();
  }, []);

  const handleSave = async () => {
    if (!form.message_en.trim() || !form.message_fr.trim()) return;
    setLoading(true);
    if (announcement) {
      await supabase
        .from("weekly_announcements")
        .update({
          title: form.title.trim() || null,
          message_en: form.message_en.trim(),
          message_fr: form.message_fr.trim(),
          active_from: form.active_from,
        })
        .eq("id", announcement.id);
    } else {
      await supabase.from("weekly_announcements").insert({
        title: form.title.trim() || null,
        message_en: form.message_en.trim(),
        message_fr: form.message_fr.trim(),
        active_from: form.active_from,
      });
    }
    setEditing(false);
    await fetchLatest();
  };

  const ailsaTitle = announcement?.title || DEFAULT_TITLE[language];
  const ailsaBody = announcement?.[`message_${language}`] || DEFAULT_MESSAGE[language];
  const song = SONG_OF_WEEK[language];

  if (loading && !editing) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 animate-pulse">
        <div className="h-5 w-1/3 bg-muted rounded mb-4" />
        <div className="h-4 w-full bg-muted rounded mb-2" />
        <div className="h-4 w-5/6 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* A Note from Ailsa */}
      <div className="relative rounded-2xl border border-lime/30 bg-lime-light p-6 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <div className="rounded-full bg-primary/10 p-2.5 shrink-0">
            <PenLine className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-heading font-bold text-xl md:text-2xl text-foreground">{ailsaTitle}</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <CalendarDays className="w-4 h-4" />
              {announcement
                ? `${language === "fr" ? "Publié le" : "Posted"} ${new Date(announcement.active_from).toLocaleDateString(language === "fr" ? "fr-CA" : "en-CA", { year: "numeric", month: "long", day: "numeric" })}`
                : language === "fr" ? "Message par défaut" : "Default welcome message"}
            </p>
          </div>
          {isAdmin && !editing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <PenLine className="w-4 h-4 mr-1.5" />
              {language === "fr" ? "Modifier" : "Edit"}
            </Button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                {language === "fr" ? "Titre (optionnel)" : "Title (optional)"}
              </label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={DEFAULT_TITLE.en}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">English message</label>
              <Textarea
                rows={6}
                value={form.message_en}
                onChange={(e) => setForm({ ...form, message_en: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Message français</label>
              <Textarea
                rows={6}
                value={form.message_fr}
                onChange={(e) => setForm({ ...form, message_fr: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                {language === "fr" ? "Actif à partir du" : "Active from"}
              </label>
              <Input
                type="date"
                value={form.active_from}
                onChange={(e) => setForm({ ...form, active_from: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleSave} disabled={!form.message_en.trim() || !form.message_fr.trim()}>
                <Save className="w-4 h-4 mr-1.5" />
                {language === "fr" ? "Enregistrer" : "Save"}
              </Button>
              <Button variant="outline" onClick={() => { setEditing(false); fetchLatest(); }}>
                <X className="w-4 h-4 mr-1.5" />
                {language === "fr" ? "Annuler" : "Cancel"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-base md:text-lg text-foreground/90 whitespace-pre-line leading-relaxed">
              {ailsaBody}
            </div>
            <Button asChild className="mt-5">
              <a href={WARMUP_URL} target="_blank" rel="noopener noreferrer">
                <Music className="mr-2 h-4 w-4" />
                {language === "fr" ? "Échauffements vocaux avec Ailsa" : "Warm up with Ailsa"}
              </a>
            </Button>

          </>
        )}
      </div>

      {/* Song of the Week */}
      <div className="rounded-2xl border border-pink/20 bg-pink-light p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-full bg-pink/10 p-2.5 shrink-0">
            <Music className="w-5 h-5 text-pink" />
          </div>
          <h2 className="font-heading font-bold text-xl md:text-2xl text-foreground">{song.title}</h2>
        </div>
        <div className="text-base text-foreground/90 whitespace-pre-line leading-relaxed">
          {song.body}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <Star className="mx-auto mb-2 h-6 w-6 text-primary" />
        <h2 className="font-heading text-xl font-bold text-foreground">{language === "fr" ? "Vous aimez Club Choir ?" : "Enjoying Club Choir?"}</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{language === "fr" ? "Si vous avez un moment, vous pouvez laisser un avis Google en tout temps. Vos mots aident d'autres personnes à découvrir Club Choir. Merci !" : "If you have a moment, you’re welcome to leave a Google review anytime. Your words help more people discover Club Choir. Thank you!"}</p>
        <Button asChild className="mt-4"><a href={REVIEW_URL} target="_blank" rel="noopener noreferrer"><Star className="mr-2 h-4 w-4" />{language === "fr" ? "Laisser un avis Google" : "Leave a Google review"}</a></Button>
      </div>
    </div>
  );
}
