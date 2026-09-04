import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Music, FileText, BookOpen, Presentation, Download, Trash2, Upload,
  Loader2, Search, ArrowLeft, ChevronRight, ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import SongAudioPlayer from "@/components/SongAudioPlayer";

const SESSION = "fall-2026";
const WEEKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const WEEK_TITLES: Record<number, string> = {
  1: "Lovely Day",
  2: "Dreams",
  3: "Flowers",
  4: "Time of The Season",
  5: "When Doves Cry",
  6: "Toxic",
  7: "Bloom",
  8: "J'entends Frapper",
  9: "Losing My Religion",
  10: "So Easy (To Fall In Love)",
};

type ResourceType = "audio" | "lyrics" | "slides" | "sheet_music";

interface Row {
  id: string;
  song_name: string;
  resource_type: ResourceType;
  file_name: string;
  storage_path: string;
  week: number | null;
  part: string | null;
  sort_order: number;
  created_at: string;
}

const copy = {
  en: {
    title: "Fall 2026 Song Resources",
    intro: "Recordings, lyrics, slides and sheet music for every week of the session.",
    pickWeek: "Choose a week",
    week: "Week",
    backToWeeks: "Back to all weeks",
    backToWeek: "Back to Week",
    search: "Search a song…",
    empty: "Nothing uploaded for this week yet — check back soon.",
    noResults: "No songs match your search.",
    recordings: "Recordings",
    lyrics: "Lyrics",
    slides: "Lyric slides",
    sheet: "Sheet music",
    open: "Open",
    download: "Download",
    items: "items",
    songs: "songs",
    addFiles: "Add files",
    hideAdd: "Hide upload panel",
    songName: "Song name",
    fileKind: "What is this file?",
    chooseFiles: "Choose files",
    uploading: "Uploading…",
    deleteConfirm: "Delete {name}?",
    delete: "Delete",
    signInFirst: "Please sign in again to open this file.",
    loadFail: "Could not load the resources.",
  },
  fr: {
    title: "Ressources – session d'automne 2026",
    intro: "Enregistrements, paroles, diapositives et partitions pour chaque semaine de la session.",
    pickWeek: "Choisissez une semaine",
    week: "Semaine",
    backToWeeks: "Retour à toutes les semaines",
    backToWeek: "Retour à la semaine",
    search: "Rechercher une chanson…",
    empty: "Rien n'a encore été téléversé pour cette semaine — revenez bientôt.",
    noResults: "Aucune chanson ne correspond à votre recherche.",
    recordings: "Enregistrements",
    lyrics: "Paroles",
    slides: "Diapositives",
    sheet: "Partitions",
    open: "Ouvrir",
    download: "Télécharger",
    items: "fichiers",
    songs: "chansons",
    addFiles: "Ajouter des fichiers",
    hideAdd: "Masquer le téléversement",
    songName: "Nom de la chanson",
    fileKind: "Type de fichier",
    chooseFiles: "Choisir des fichiers",
    uploading: "Téléversement…",
    deleteConfirm: "Supprimer {name} ?",
    delete: "Supprimer",
    signInFirst: "Veuillez vous reconnecter pour ouvrir ce fichier.",
    loadFail: "Impossible de charger les ressources.",
  },
};

const FallSongs = () => {
  const { language } = useLanguage();
  const c = copy[language === "fr" ? "fr" : "en"];
  const { isAdmin, loading: adminLoading, user } = useAdmin();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeAudio, setActiveAudio] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadSong, setUploadSong] = useState("");
  const [uploadKind, setUploadKind] = useState<string>("audio");
  const [uploading, setUploading] = useState<string | null>(null);

  const weekParam = params.get("week");
  const selectedWeek = weekParam && WEEKS.includes(Number(weekParam)) ? Number(weekParam) : null;

  const fetchRows = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("song_resources")
      .select("id, song_name, resource_type, file_name, storage_path, week, part, sort_order, created_at")
      .eq("session_label", SESSION)
      .order("week", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("song_name", { ascending: true });
    if (error) {
      toast({ title: c.loadFail, description: error.message, variant: "destructive" });
    }
    setRows(((data as unknown) as Row[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchRows(); }, []);

  // Pre-fill the song name with this week's song for admin uploads
  useEffect(() => {
    if (selectedWeek) setUploadSong(WEEK_TITLES[selectedWeek] || "");
  }, [selectedWeek]);

  const getSignedUrl = async (row: Row, forDownload: boolean): Promise<string | null> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) {
      toast({ title: c.signInFirst, variant: "destructive" });
      return null;
    }
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-signed-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ storage_path: row.storage_path, file_name: forDownload ? row.file_name : undefined }),
    });
    const result = await res.json();
    if (!res.ok || !result.signedUrl) {
      toast({ title: c.loadFail, description: result.error, variant: "destructive" });
      return null;
    }
    return result.signedUrl;
  };

  const openFile = async (row: Row) => {
    const tab = window.open("", "_blank");
    const url = await getSignedUrl(row, false);
    if (!url) { tab?.close(); return; }
    if (tab) tab.location.href = url; else window.location.href = url;
  };

  const downloadFile = async (row: Row) => {
    const url = await getSignedUrl(row, true);
    if (!url) return;
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = row.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch {
      window.open(url, "_blank");
    }
  };

  const handleDelete = async (row: Row) => {
    if (!confirm(c.deleteConfirm.replace("{name}", row.file_name))) return;
    await supabase.storage.from("song-resources").remove([row.storage_path]);
    const { error } = await supabase.from("song_resources").delete().eq("id", row.id);
    if (error) { toast({ title: error.message, variant: "destructive" }); return; }
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    toast({ title: `${c.delete}: ${row.file_name}` });
  };




  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !uploadSong.trim() || !user || !selectedWeek) return;
    const type: ResourceType = uploadKind as ResourceType;
    const safeSong = uploadSong.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-").toLowerCase();

    for (const file of files) {
      setUploading(file.name);
      // Keep the original file name so members see and download exactly what was uploaded
      const safeFileName = file.name
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]+/g, "-");
      const path = `${SESSION}/week-${selectedWeek}/${safeSong}/${Date.now()}-${safeFileName}`;
      const { error: storageError } = await supabase.storage.from("song-resources").upload(path, file);
      if (storageError) { toast({ title: storageError.message, variant: "destructive" }); continue; }
      const { error: dbError } = await supabase.from("song_resources").insert({
        song_name: uploadSong.trim(), resource_type: type, part, week: selectedWeek,
        session_label: SESSION, file_name: file.name, storage_path: path,
        location: "all", uploaded_by: user.id,
      } as never);
      if (dbError) toast({ title: dbError.message, variant: "destructive" });
    }
    setUploading(null);
    e.target.value = "";
    fetchRows();
  };

  const weekRows = useMemo(
    () => rows.filter((r) => r.week === selectedWeek),
    [rows, selectedWeek]
  );

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const seen = new Map<string, number>();
    for (const r of rows) {
      if (r.song_name.toLowerCase().includes(q) && r.week) seen.set(`${r.week}|${r.song_name}`, r.week);
    }
    return Array.from(seen.keys()).map((k) => {
      const [w, name] = k.split("|");
      return { week: Number(w), name };
    });
  }, [rows, search]);

  const goWeek = (w: number) => setParams({ week: String(w) });
  const goWeeks = () => setParams({});

  const BackBar = ({ onClick, label }: { onClick: () => void; label: string }) => (
    <div className="sticky top-0 z-20 -mx-4 px-4 py-2 bg-background/95 backdrop-blur border-b border-border mb-5">
      <button
        onClick={onClick}
        className="inline-flex items-center gap-2 min-h-[44px] px-3 -ml-3 rounded-lg text-sm font-semibold text-primary hover:bg-muted active:scale-95 transition"
      >
        <ArrowLeft className="w-4 h-4" /> {label}
      </button>
    </div>
  );

  const typeMeta: Record<ResourceType, { icon: JSX.Element; label: string; bg: string; text: string }> = {
    audio: { icon: <Music className="w-4 h-4" />, label: c.recordings, bg: "bg-[hsl(var(--pink-light))]", text: "text-[hsl(var(--pink))]" },
    lyrics: { icon: <FileText className="w-4 h-4" />, label: c.lyrics, bg: "bg-[hsl(var(--aqua-light))]", text: "text-[hsl(var(--aqua))]" },
    slides: { icon: <Presentation className="w-4 h-4" />, label: c.slides, bg: "bg-[hsl(var(--lime-light))]", text: "text-[hsl(var(--lime-foreground))]" },
    sheet_music: { icon: <BookOpen className="w-4 h-4" />, label: c.sheet, bg: "bg-[hsl(var(--purple-light))]", text: "text-[hsl(var(--purple))]" },
  };

  const FileRow = ({ row, label }: { row: Row; label: string }) => (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-2.5">
      <span className="min-w-0 flex-1 text-sm truncate">{label}</span>
      <button onClick={() => openFile(row)} className="min-h-[40px] px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5 active:scale-95 transition">
        <ExternalLink className="w-3.5 h-3.5" /> {c.open}
      </button>
      <button onClick={() => downloadFile(row)} aria-label={c.download} className="min-h-[40px] w-10 rounded-lg border border-border inline-flex items-center justify-center active:scale-95 transition">
        <Download className="w-4 h-4" />
      </button>
      {isAdmin && (
        <button onClick={() => handleDelete(row)} aria-label="Delete" className="min-h-[40px] px-3 rounded-lg border border-destructive/40 text-destructive text-xs font-semibold inline-flex items-center gap-1.5 active:scale-95 transition">
          <Trash2 className="w-4 h-4" /> {c.delete}
        </button>
      )}

    </div>
  );

  const SongDetail = ({ name, items }: { name: string; items: Row[] }) => {
    const audio = items.filter((r) => r.resource_type === "audio");
    const lyrics = items.filter((r) => r.resource_type === "lyrics");
    const slides = items.filter((r) => r.resource_type === "slides");
    const sheets = items.filter((r) => r.resource_type === "sheet_music");
    const partOrder: Part[] = ["blue", "pink", "floaters", "all"];

    return (
      <div className="space-y-6">
        {audio.length > 0 && (
          <section className="space-y-2">
            <h3 className={`text-sm font-semibold uppercase tracking-wide ${typeMeta.audio.text}`}>{c.recordings}</h3>
            {audio.map((r) => (
              <SongAudioPlayer
                key={r.id}
                id={r.id}
                label={r.file_name}
                activeId={activeAudio}
                onActivate={setActiveAudio}
                loadUrl={() => getSignedUrl(r, false)}
              />
            ))}
            {isAdmin && (
              <div className="flex flex-wrap gap-2">
                {audio.map((r) => (
                  <button
                    key={`d-${r.id}`}
                    onClick={() => handleDelete(r)}
                    className="min-h-[40px] px-3 rounded-lg border border-destructive/40 text-destructive text-xs font-semibold inline-flex items-center gap-1.5 active:scale-95 transition max-w-full"
                  >
                    <Trash2 className="w-4 h-4 shrink-0" />
                    <span className="truncate">{c.delete}: {r.file_name}</span>
                  </button>
                ))}
              </div>
            )}

          </section>
        )}

        {[{ list: lyrics, key: "lyrics" as const }, { list: slides, key: "slides" as const }].map(({ list, key }) =>
          list.length > 0 ? (
            <section key={key} className="space-y-2">
              <h3 className={`text-sm font-semibold uppercase tracking-wide ${typeMeta[key].text}`}>{typeMeta[key].label}</h3>
              {list.map((r) => <FileRow key={r.id} row={r} label={r.file_name} />)}
            </section>
          ) : null
        )}

        {sheets.length > 0 && (
          <section className="space-y-2">
            <h3 className={`text-sm font-semibold uppercase tracking-wide ${typeMeta.sheet_music.text}`}>{c.sheet}</h3>
            {partOrder.map((p) => {
              const list = sheets.filter((r) => r.part === p);
              if (!list.length) return null;
              return (
                <div key={p} className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">{c.parts[p]}</p>
                  {list.map((r) => <FileRow key={r.id} row={r} label={r.file_name} />)}
                </div>
              );
            })}
            {sheets.filter((r) => !r.part).map((r) => <FileRow key={r.id} row={r} label={r.file_name} />)}
          </section>
        )}
      </div>
    );
  };

  const UploadPanel = () => (
    <div className="rounded-xl border border-border bg-card p-4 mb-6 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-muted-foreground">{c.songName}</span>
          <input
            value={uploadSong}
            onChange={(e) => setUploadSong(e.target.value)}
            list="song-suggestions"
            className="mt-1 w-full min-h-[44px] rounded-lg border border-input bg-background px-3"
          />
          <datalist id="song-suggestions">
            {Array.from(new Set(rows.map((r) => r.song_name))).map((n) => <option key={n} value={n} />)}
          </datalist>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-muted-foreground">{c.fileKind}</span>
          <select
            value={uploadKind}
            onChange={(e) => setUploadKind(e.target.value)}
            className="mt-1 w-full min-h-[44px] rounded-lg border border-input bg-background px-3"
          >
            <option value="audio">{c.recordings}</option>
            <option value="lyrics">{c.lyrics}</option>
            <option value="slides">{c.slides}</option>
            <option value="sheet:blue">{c.sheet} — {c.parts.blue}</option>
            <option value="sheet:pink">{c.sheet} — {c.parts.pink}</option>
            <option value="sheet:floaters">{c.sheet} — {c.parts.floaters}</option>
            <option value="sheet:all">{c.sheet} — {c.parts.all}</option>
          </select>
        </label>
      </div>
      {uploading ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> {c.uploading} {uploading}
        </p>
      ) : (
        <label className={`inline-flex items-center gap-2 min-h-[44px] px-4 rounded-lg text-sm font-semibold cursor-pointer ${uploadSong.trim() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground pointer-events-none"}`}>
          <Upload className="w-4 h-4" /> {c.chooseFiles}
          <input type="file" multiple className="hidden" onChange={handleUpload} />
        </label>
      )}
    </div>
  );

  if (loading || adminLoading) {
    return <div className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>;
  }

  return (
    <div className="py-8 px-4">
      <Helmet><meta name="robots" content="noindex,nofollow" /></Helmet>
      <div className="container mx-auto max-w-3xl">
        {/* Week view: one song per week, files shown right away */}
        {selectedWeek ? (
          <>
            <BackBar onClick={goWeeks} label={c.backToWeeks} />
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.week} {selectedWeek}</p>
            <h1 className="text-3xl font-heading font-bold mb-1">{WEEK_TITLES[selectedWeek]}</h1>
            <p className="text-muted-foreground mb-6">{weekRows.length} {c.items}</p>
            {isAdmin && (
              <>
                <button onClick={() => setShowUpload((s) => !s)} className="mb-3 inline-flex items-center gap-2 min-h-[44px] px-4 rounded-lg bg-secondary text-secondary-foreground text-sm font-semibold">
                  <Upload className="w-4 h-4" /> {showUpload ? c.hideAdd : c.addFiles}
                </button>
                {showUpload && <UploadPanel />}
              </>
            )}
            {weekRows.length === 0 ? (
              <p className="text-muted-foreground py-10 text-center">{c.empty}</p>
            ) : (
              <SongDetail name={WEEK_TITLES[selectedWeek]} items={weekRows} />
            )}
            <div className="mt-8">
              <button onClick={goWeeks} className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-lg border border-border text-sm font-semibold">
                <ArrowLeft className="w-4 h-4" /> {c.backToWeeks}
              </button>
            </div>
          </>
        ) : (

          <>
            <h1 className="text-3xl font-heading font-bold mb-2">{c.title}</h1>
            <p className="text-muted-foreground mb-6">{c.intro}</p>

            <div className="relative mb-6">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={c.search}
                className="w-full min-h-[48px] rounded-xl border border-input bg-background pl-10 pr-3"
              />
            </div>

            {search.trim() ? (
              searchResults.length === 0 ? (
                <p className="text-muted-foreground py-6 text-center">{c.noResults}</p>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((r) => (
                    <button
                      key={`${r.week}-${r.name}`}
                      onClick={() => goWeek(r.week)}
                      className="w-full text-left rounded-xl border border-border bg-card p-4 flex items-center gap-3"
                    >
                      <Music className="w-5 h-5 text-primary shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold truncate">{r.name}</span>
                        <span className="block text-xs text-muted-foreground">{c.week} {r.week}</span>
                      </span>
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              )
            ) : (
              <>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">{c.pickWeek}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {WEEKS.map((w) => {
                    const count = rows.filter((r) => r.week === w).length;
                    return (
                      <button
                        key={w}
                        onClick={() => goWeek(w)}
                        className="rounded-xl border border-border bg-card p-4 text-left min-h-[88px] hover:border-primary/50 active:scale-[.98] transition"
                      >
                        <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.week} {w}</span>
                        <span className="block text-lg font-heading font-bold leading-tight mt-0.5">{WEEK_TITLES[w]}</span>
                        <span className="block text-xs text-muted-foreground mt-1">
                          {count > 0 ? `${count} ${c.items}` : "—"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <div className="mt-10">
              <Link to="/this-week" className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-lg border border-border text-sm font-semibold">
                <ArrowLeft className="w-4 h-4" /> {language === "fr" ? "Retour à Ma chorale" : "Back to My Choir"}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FallSongs;
