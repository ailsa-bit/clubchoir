import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { PenLine, Megaphone, Save, X, CalendarDays, Music } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Announcement = Database["public"]["Tables"]["weekly_announcements"]["Row"];

const DEFAULT_TITLE = { en: "A Note from Ailsa 🎶", fr: "Un mot d'Ailsa 🎶" };

const ANNOUNCEMENTS = {
  en: [
    "📍 Club Choir Montreal has moved from Kensington to Paroisse Notre-Dame-de-Grâce, 5333 avenue Notre-Dame-de-Grâce (corner Décarie). We're so happy to be moving to a larger venue — it gives us room to spread out. So excited!",
    "🎵 Reminder: as a Club Choir member you have access to ALL locations. If you can't make it to your home base choir one week, you're welcome to visit another location.",
    "💛 You can invite guests throughout Weeks 1–10! Since we're learning a new song each week, it's fun to share that with a friend.",
  ],
  fr: [
    "📍 Club Choir Montréal a déménagé de Kensington à la Paroisse Notre-Dame-de-Grâce, 5333 avenue Notre-Dame-de-Grâce (coin Décarie). Nous sommes ravies d'emménager dans un plus grand local — ça nous donne de l'espace pour nous déployer. Tellement excitant !",
    "🎵 Rappel : en tant que membre de Club Choir, vous avez accès à TOUTES les locations. Si vous ne pouvez pas venir à votre chorale de base une semaine, vous êtes bienvenue dans une autre location.",
    "💛 Vous pouvez inviter des ami·e·s pendant les semaines 1 à 10 ! Comme nous apprenons une nouvelle chanson chaque semaine, c'est amusant de partager ça avec un·e ami·e.",
  ],
};

const DEFAULT_MESSAGE = {
  en: `Hello wonderful singers! 🌟

We wrapped up Week 1 last night in Pointe-Claire, and what a week it has been — filled with singing, laughter, and a ton of good times. Thank you to everyone who has made this possible. It is so uplifting, and we are truly blessed to welcome so many new members, and it's heartwarming to see so many familiar faces. A huge thank-you to each of you for such a successful start! 🎉

Tra-la-la,
Ailsa 🎤✨`,
  fr: `Bonjour merveilleux chanteurs et chanteuses ! 🌟

Nous avons terminé la semaine 1 hier soir à Pointe-Claire, et quelle semaine ça a été — remplie de chant, de rires et de bons moments. Merci à toutes et à tous d'avoir rendu cela possible. C'est tellement inspirant, et nous avons la chance d'accueillir tant de nouveaux membres, et ça réchauffe le cœur de voir tant de visages familiers. Un immense merci à chacun·e pour un départ aussi réussi ! 🎉

Tra-la-la,
Ailsa 🎤✨`,
};

const SONG_OF_WEEK = {
  en: {
    title: "Song of the Week: “Dreams” — Fleetwood Mac",
    body: `This legendary song was written by Stevie Nicks in just 10 minutes, capturing the bittersweet ache of her real-life breakup with the band's guitarist.

To get into the vibe of this song, imagine a feeling of calm, cool confidence mixed with a little bit of heartbreak. It is about letting go of someone you love, wishing them well, but knowing they will eventually miss you.

For our choir, the goal isn't to sing loudly or with heavy sadness — instead, channel a smooth, hypnotic, and storytelling tone. Relax into the steady rhythm, sing from the heart, and let's capture that cool, timeless magic Stevie Nicks is famous for! 🌙`,
  },
  fr: {
    title: "Chanson de la semaine : « Dreams » — Fleetwood Mac",
    body: `Cette chanson légendaire a été écrite par Stevie Nicks en seulement 10 minutes, capturant la douce amertume de sa rupture réelle avec le guitariste du groupe.

Pour entrer dans l'ambiance de cette chanson, imaginez un sentiment de confiance calme et cool, mélangé à un peu de chagrin. Il s'agit de laisser partir quelqu'un qu'on aime, de lui souhaiter le meilleur, tout en sachant qu'il finira par vous manquer.

Pour notre chorale, le but n'est pas de chanter fort ni avec une tristesse lourde — adoptez plutôt un ton doux, hypnotique et narratif. Détendez-vous dans le rythme régulier, chantez avec le cœur, et capturons cette magie intemporelle et cool qui fait la renommée de Stevie Nicks ! 🌙`,
  },
};

const SECTION_TITLES = {
  announcements: { en: "Important Announcements & Reminders", fr: "Annonces importantes et rappels" },
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
      {/* 1. Announcements & Reminders */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-full bg-primary/10 p-2.5 shrink-0">
            <Megaphone className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-heading font-bold text-xl md:text-2xl text-foreground">
            {SECTION_TITLES.announcements[language]}
          </h2>
        </div>
        <ul className="space-y-3 text-base text-foreground/90 leading-relaxed">
          {ANNOUNCEMENTS[language].map((item, i) => (
            <li key={i} className="flex gap-2">
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 2. A Note from Ailsa */}
      <div className="relative rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
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
          <div className="text-base md:text-lg text-foreground/90 whitespace-pre-line leading-relaxed">
            {ailsaBody}
          </div>
        )}
      </div>

      {/* 3. Song of the Week */}
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
    </div>
  );
}
