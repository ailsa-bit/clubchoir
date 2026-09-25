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

const DEFAULT_TITLE = { en: "Week 4 — A Note from Ailsa 🎶", fr: "Semaine 4 — Un mot d'Ailsa 🎶" };

const REVIEW_URL = "https://g.page/r/CU1hiLJTYmtXEAE/review";

const DEFAULT_MESSAGE = {
  en: `Hello wonderful singers! 🌟

New resources for "When Doves Cry" are up on the song resources page — have a listen and take a look before we meet!

If you have a few minutes, I'd love it if you could leave Club Choir a review on Google. It truly helps people find us, and every kind word means the world — just tap the button below!

A little heads-up for Montreal and Pointe-Claire: Daniel won't be with us next week, but Gary will be accompanying us in Montreal, and Joe (one of our choir members) will be joining us in Pointe-Claire. I'm so grateful to them both!

This week's song is "When Doves Cry" — one of my favourites! I am very excited about this version, inspired by a Choir! Choir! Choir! version.

A couple of reminders: please write your name in your binder, so if it gets left behind I know who to return it to.

See you all next week. Enjoy the beautiful weather this weekend!

Tra-la-la,
Ailsa 🎤✨`,
  fr: `Bonjour merveilleux chanteurs et chanteuses ! 🌟

Les nouvelles ressources pour « When Doves Cry » sont disponibles sur la page des ressources musicales — écoutez et jetez un coup d'œil avant de nous retrouver !

Si vous avez quelques minutes, j'aimerais beaucoup que vous laissiez un avis sur Club Choir sur Google. Cela aide vraiment les gens à nous découvrir, et chaque mot gentil me touche beaucoup — appuyez sur le bouton ci-dessous !

Petite note pour Montréal et Pointe-Claire : Daniel ne sera pas avec nous la semaine prochaine, mais Gary nous accompagnera à Montréal, et Joe (un de nos membres) se joindra à nous à Pointe-Claire. Je leur suis très reconnaissante !

La chanson de cette semaine est « When Doves Cry » — l'une de mes préférées ! Je suis très excitée par cette version, inspirée d'une version de Choir! Choir! Choir!

Quelques petits rappels : veuillez écrire votre nom dans votre classeur, pour que je sache à qui le retourner s'il est oublié.

À la semaine prochaine. Profitez du beau temps ce week-end !

Tra-la-la,
Ailsa 🎤✨`,
};

const SONG_OF_WEEK = {
  en: {
    title: "Song of the Week: \u201CWhen Doves Cry\u201D — Prince",
    body: `In 1984, Prince released \u201CWhen Doves Cry\u201D as part of Purple Rain, the album and film that sent him into superstardom. Beneath its bold sound is a story of a relationship in trouble: two people who love each other but keep falling into the same painful patterns. Prince turns that tension into something theatrical, with sharp guitar, an irresistible beat and a vocal that moves from cool confidence to raw emotion. This week, we get to bring all that drama to Club Choir.`,
  },
  fr: {
    title: "Chanson de la semaine : « When Doves Cry » — Prince",
    body: `En 1984, Prince a lancé « When Doves Cry » dans le cadre de Purple Rain, l'album et le film qui l'ont propulsé au sommet. Sous ce son audacieux se cache l'histoire d'une relation en difficulté : deux personnes qui s'aiment mais qui retombent sans cesse dans les mêmes schémas douloureux. Prince transforme cette tension en quelque chose de théâtral, avec une guitare incisive, un rythme irrésistible et un chant qui passe de la confiance cool à l'émotion brute. Cette semaine, nous allons apporter tout ce drame à Club Choir.`,
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
          <>
            <div className="text-base md:text-lg text-foreground/90 whitespace-pre-line leading-relaxed">
              {ailsaBody}
            </div>
            <a
              href={REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              <Star className="w-4 h-4" />
              {language === "fr" ? "Laisser un avis sur Google" : "Leave a review on Google"}
            </a>
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
    </div>
  );
}
