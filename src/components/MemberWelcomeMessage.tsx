import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { PenLine, Save, X, CalendarDays, Music, Star } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Announcement = Database["public"]["Tables"]["weekly_announcements"]["Row"];

const DEFAULT_TITLE = { en: "Week 8 — A Note from Ailsa 🎶", fr: "Semaine 8 — Un mot d'Ailsa 🎶" };

const REVIEW_URL = "https://g.page/r/CU1hiLJTYmtXEAE/review";

const PLAYLIST_URL = "https://youtube.com/playlist?list=PLRCosHNTvops&si=2TDdHamGWowrP-_t";

const DEFAULT_MESSAGE = {
  en: `Hello choir family! 🌟

This week we're taking on a BIG one: "J'entends frapper" — and it's going to be SO much fun! This one needs lots of energy and lots of focus, so bring your full voice and your best rock-'n'-roll spirit. Let's knock the roof off! 🥁

Big news: I'm preparing the invitation for each of our shows! It will come in a format you can easily share with friends and family by text and email. I'll send the email with the attachments this Sunday, so make sure you check your inbox — I'll also add a copy to the portal so you can download it anytime.

Let's sing, let's shine, and let's bring the energy!

Tra-la-la,
Ailsa 🎤✨`,
  fr: `Bonjour ma chorale ! 🌟

Cette semaine, on attaque un GROS morceau : « J'entends frapper » — et ça va être tellement le fun ! Il nous faut beaucoup d'énergie et beaucoup de concentration, alors apportez votre voix au complet et votre meilleur esprit rock. Faisons vibrer la maison ! 🥁

Grande nouvelle : je prépare l'invitation pour chacun de nos spectacles ! Elle sera dans un format facile à partager avec vos amis et votre famille par texto et par courriel. Je vous enverrai le courriel avec les pièces jointes ce dimanche, alors pensez à vérifier votre boîte de réception — une copie sera aussi disponible sur le portail pour téléchargement en tout temps.

Chantons, brillons, et apportons l'énergie !

Tra-la-la,
Ailsa 🎤✨`,
};

const SONG_OF_WEEK = {
  en: {
    title: 'Song of the Week: "So Easy (To Fall in Love)" by Olivia Dean',
    body: `This week we fall in love, the easy way! Our last new song of the session is Olivia Dean's "So Easy (To Fall in Love)," and it is pure sunshine: a bossa-nova groove, cocktail piano, a trumpet, and Olivia calling herself "the perfect mix of Saturday night and the rest of your life." Listen to the recording this week, and listen for the back-and-forth, voices answering each other, which is exactly what we will be singing together.

And here is the best part: Olivia wrote it as a pep talk for first dates. She told Elle she wanted to say, "You'd be really easy to fall in love with. Anyone will be lucky to have you in their life," instead of worrying whether the other person likes you. Released September 26, 2025 as the fourth single from her second album "The Art of Loving," it is only 2 minutes 49 seconds long, and it went to No. 2 in the UK, No. 5 on the Billboard Hot 100, and No. 3 in Canada. A brand-new classic, sung best by a whole room at once.`,
  },
  fr: {
    title: "Chanson de la semaine : « So Easy (To Fall in Love) » d'Olivia Dean",
    body: `Cette semaine, on tombe amoureux, tout simplement! Notre dernière nouvelle chanson de la session est « So Easy (To Fall in Love) » d'Olivia Dean, et c'est un véritable rayon de soleil : un rythme de bossa-nova, un piano d'ambiance, une trompette, et Olivia qui se décrit comme « le mélange parfait du samedi soir et du reste de votre vie ». Écoutez l'enregistrement cette semaine et prêtez attention aux échanges, aux voix qui se répondent : c'est exactement ce que nous allons chanter ensemble.

Et le plus beau dans tout ça : Olivia l'a écrite comme un petit discours d'encouragement avant un premier rendez-vous. Elle a expliqué à Elle qu'elle voulait dire : « Ce serait vraiment facile de tomber amoureux de toi. N'importe qui aurait de la chance de t'avoir dans sa vie », plutôt que de se demander si l'autre personne nous aime. Sortie le 26 septembre 2025 comme quatrième extrait de son deuxième album, « The Art of Loving », elle ne dure que 2 minutes 49 secondes et a atteint le no 2 au Royaume-Uni, le no 5 du Billboard Hot 100 et le no 3 au Canada. Un tout nouveau classique, qui se chante le mieux dans une salle remplie, tous ensemble.`,
  },
};

const SECTION_TITLES = {
  ailsa: { en: "A Note from Ailsa 🎶", fr: "Un mot d'Ailsa 🎶" },
};

const formatDateInput = (d: string) => d.split("T")[0];

export function MemberWelcomeMessage({ belowSong }: { belowSong?: ReactNode } = {}) {
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
              <a href={PLAYLIST_URL} target="_blank" rel="noopener noreferrer">
                <Music className="mr-2 h-4 w-4" />
                {language === "fr" ? "Ailsa (enregistrements YouTube)" : "Ailsa (YouTube Recordings)"}
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

      {belowSong}

      <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <Star className="mx-auto mb-2 h-6 w-6 text-primary" />
        <h2 className="font-heading text-xl font-bold text-foreground">{language === "fr" ? "Vous aimez Club Choir ?" : "Enjoying Club Choir?"}</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{language === "fr" ? "Si vous avez un moment, vous pouvez laisser un avis Google en tout temps. Vos mots aident d'autres personnes à découvrir Club Choir. Merci !" : "If you have a moment, you’re welcome to leave a Google review anytime. Your words help more people discover Club Choir. Thank you!"}</p>
        <Button asChild className="mt-4"><a href={REVIEW_URL} target="_blank" rel="noopener noreferrer"><Star className="mr-2 h-4 w-4" />{language === "fr" ? "Laisser un avis Google" : "Leave a Google review"}</a></Button>
      </div>
    </div>
  );
}
