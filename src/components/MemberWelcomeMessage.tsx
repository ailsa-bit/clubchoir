import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { PenLine, Megaphone, Save, X, CalendarDays } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Announcement = Database["public"]["Tables"]["weekly_announcements"]["Row"];

const DEFAULT_TITLE = { en: "A Note from Ailsa 🎶", fr: "Un mot d'Ailsa 🎶" };

const DEFAULT_MESSAGE = {
  en: `Hello wonderful singers! 🌟

Welcome to our Fall 2026 session! Whether you're stepping into Club Choir for the very first time or coming back to sing with us again, I am absolutely thrilled you're here. 🎉 This summer has been full of music and memories, so be sure to check out our Events page to catch up on all the fun!

Remember — your home base choir is your musical home, but as a member you can visit any of our four locations anytime it suits your schedule. 🎵

I also encourage you to bring a friend to a rehearsal this session — someone who might love to join our choir family, or someone who could use a little musical sunshine in their week. ☀️💛

New song resources will be posted every Friday in Fall 2026 Song Resources, so check back weekly to find recordings, lyrics, and slides.

You can reach me anytime at ailsa@clubchoir.ca — I'm always happy to hear from you!

Tra-la-la,
Ailsa 🎤✨`,
  fr: `Bonjour merveilleux chanteurs et chanteuses ! 🌟

Bienvenue à notre session d'automne 2026 ! Que ce soit votre première fois à Club Choir ou que vous reveniez chanter avec nous, je suis absolument ravie que vous soyez là. 🎉 Cet été a été rempli de musique et de souvenirs, alors consultez notre page Événements pour ne rien manquer !

N'oubliez pas — votre chorale de base est votre foyer musical, mais en tant que membre vous pouvez visiter n'importe laquelle de nos quatre locations quand cela vous convient. 🎵

Je vous encourage aussi à amener un ami à une répétition cette session — quelqu'un qui aimerait se joindre à notre famille chorale, ou quelqu'un qui aurait besoin d'un peu de soleil musical dans sa semaine. ☀️💛

Les nouvelles ressources musicales seront publiées chaque vendredi dans Ressources chansons Automne 2026, alors revenez chaque semaine pour trouver les enregistrements, paroles et diapositives.

Vous pouvez me joindre en tout temps à ailsa@clubchoir.ca — ça me fait toujours plaisir de vous entendre !

Tra-la-la,
Ailsa 🎤✨`,
};

const formatDateInput = (d: string) => d.split("T")[0];

export function MemberWelcomeMessage() {
  const { language } = useLanguage();
  const { isAdmin, loading: adminLoading } = useAdmin();
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

  const title = announcement?.title || DEFAULT_TITLE[language];
  const body = announcement?.[`message_${language}`] || DEFAULT_MESSAGE[language];

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
    <div className="relative rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="rounded-full bg-primary/10 p-2.5 shrink-0">
          <Megaphone className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="font-heading font-bold text-xl text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <CalendarDays className="w-3 h-3" />
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
        <div className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
          {body}
        </div>
      )}
    </div>
  );
}
