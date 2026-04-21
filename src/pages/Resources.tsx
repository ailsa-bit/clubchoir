import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { Music, FileText, BookOpen, Download, Trash2, Upload, Loader2, Search, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface SongResource {
  id: string;
  song_name: string;
  resource_type: "audio" | "lyrics" | "sheet_music";
  file_name: string;
  storage_path: string;
  location: string;
  created_at: string;
}

const typeConfig: Record<string, { icon: React.ReactNode; bg: string; border: string; badge: string; text: string }> = {
  audio: {
    icon: <Music className="w-5 h-5" />,
    bg: "bg-[hsl(var(--pink-light))]",
    border: "border-[hsl(var(--pink)/.3)]",
    badge: "bg-[hsl(var(--pink))] text-[hsl(var(--pink-foreground))]",
    text: "text-[hsl(var(--pink))]",
  },
  lyrics: {
    icon: <FileText className="w-5 h-5" />,
    bg: "bg-[hsl(var(--aqua-light))]",
    border: "border-[hsl(var(--aqua)/.3)]",
    badge: "bg-[hsl(var(--aqua))] text-[hsl(var(--aqua-foreground))]",
    text: "text-[hsl(var(--aqua))]",
  },
  sheet_music: {
    icon: <BookOpen className="w-5 h-5" />,
    bg: "bg-[hsl(var(--purple-light))]",
    border: "border-[hsl(var(--purple)/.3)]",
    badge: "bg-[hsl(var(--purple))] text-[hsl(var(--purple-foreground))]",
    text: "text-[hsl(var(--purple))]",
  },
  slides: {
    icon: <FileText className="w-5 h-5" />,
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-300/30",
    badge: "bg-amber-500 text-white",
    text: "text-amber-600 dark:text-amber-400",
  },
};

const Resources = () => {
  const { isAdmin, loading: adminLoading, user } = useAdmin();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [resources, setResources] = useState<SongResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadSong, setUploadSong] = useState("");
  const [uploadType, setUploadType] = useState<string>("audio");
  const [showUpload, setShowUpload] = useState(false);
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [audioLoading, setAudioLoading] = useState<string | null>(null);

  const typeLabel: Record<string, string> = {
    audio: t("resources.recording"),
    lyrics: t("resources.lyrics"),
    sheet_music: t("resources.sheetMusic"),
    slides: "Slides",
  };

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase.from("song_resources").select("*").order("song_name", { ascending: true });
      if (error) {
        console.error("Fetch error:", error);
        toast({ title: t("resources.error") || "Error", description: error.message, variant: "destructive" });
      }
      setResources((data as SongResource[]) || []);
    } catch (err) {
      console.error("Unexpected fetch error:", err);
      toast({ title: "Error", description: "Failed to load resources.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchResources();
  }, [user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadSong.trim() || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const safeSongName = uploadSong.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-").toLowerCase();
    const path = `songs/${safeSongName}/${uploadType}-${Date.now()}.${ext}`;
    const { error: storageError } = await supabase.storage.from("song-resources").upload(path, file);
    if (storageError) { toast({ title: "Upload failed", description: storageError.message, variant: "destructive" }); setUploading(false); return; }
    const { error: dbError } = await supabase.from("song_resources").insert({ song_name: uploadSong.trim(), resource_type: uploadType, file_name: file.name, storage_path: path, location: "all", uploaded_by: user.id });
    if (dbError) { toast({ title: "Save failed", description: dbError.message, variant: "destructive" }); }
    else { toast({ title: "Uploaded!", description: `${file.name} added to ${uploadSong.trim()}` }); setUploadSong(""); fetchResources(); }
    setUploading(false);
    e.target.value = "";
  };

  const getSignedUrl = async (resource: SongResource): Promise<string | null> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) {
      toast({ title: "Download failed", description: "Please log in to download files.", variant: "destructive" });
      return null;
    }
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-signed-url`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ storage_path: resource.storage_path, file_name: resource.file_name }),
      }
    );
    const result = await res.json();
    if (!res.ok || !result.signedUrl) {
      toast({ title: "Download failed", description: result.error || "Could not generate download link.", variant: "destructive" });
      return null;
    }
    return result.signedUrl;
  };

  const handleDownload = async (resource: SongResource) => {
    try {
      const signedUrl = await getSignedUrl(resource);
      if (!signedUrl) return;

      // Use fetch + blob + anchor for reliable iOS download
      const response = await fetch(signedUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = resource.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch (err) {
      console.error("Unexpected download error:", err);
      toast({ title: "Download failed", description: "Could not download file.", variant: "destructive" });
    }
  };

  const handlePlay = async (resource: SongResource) => {
    // If already playing this track, pause it
    if (playingId === resource.id && audioRef) {
      audioRef.pause();
      setPlayingId(null);
      return;
    }

    // Stop any currently playing audio
    if (audioRef) {
      audioRef.pause();
      audioRef.src = "";
    }

    // Create audio element synchronously in user gesture context (iOS requirement)
    const audio = new Audio();
    audio.preload = "auto";
    // Unlock for iOS Safari
    await audio.play().catch(() => {});

    setAudioLoading(resource.id);

    try {
      const signedUrl = await getSignedUrl(resource);
      if (!signedUrl) { setAudioLoading(null); return; }

      audio.src = signedUrl;
      audio.onended = () => { setPlayingId(null); };
      await audio.play();
      setAudioRef(audio);
      setPlayingId(resource.id);
    } catch (err) {
      console.error("Playback error:", err);
      toast({ title: "Playback failed", description: "Could not play audio.", variant: "destructive" });
    } finally {
      setAudioLoading(null);
    }
  };

  const handleDelete = async (resource: SongResource) => {
    if (!confirm(`Delete ${resource.file_name}?`)) return;
    await supabase.storage.from("song-resources").remove([resource.storage_path]);
    await supabase.from("song_resources").delete().eq("id", resource.id);
    toast({ title: "Deleted", description: resource.file_name });
    fetchResources();
  };

  if (adminLoading) {
    return <div className="py-16 px-4 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>;
  }

  const normalize = (s: string) => s.toLowerCase().replace(/[-_'’.,!?]/g, " ").replace(/\s+/g, " ").trim();
  const tokenize = (s: string) => normalize(s).split(" ").filter(Boolean);
  const matches = (haystack: string, needle: string) => {
    const n = normalize(needle);
    const h = normalize(haystack);
    if (h.includes(n)) return true;
    // Token-based fallback: every search token must appear in haystack
    const tokens = tokenize(needle);
    return tokens.length > 0 && tokens.every(t => h.includes(t));
  };
  const filtered = searchQuery.trim()
    ? resources.filter(r => matches(r.song_name, searchQuery) || matches(r.file_name, searchQuery))
    : resources;

  // Group by resource type (color)
  const typeOrder: Array<"audio" | "lyrics" | "sheet_music" | "slides"> = ["audio", "lyrics", "sheet_music", "slides"];
  const grouped = typeOrder.reduce<Record<string, SongResource[]>>((acc, type) => {
    const items = filtered.filter(r => r.resource_type === type);
    if (items.length > 0) acc[type] = items;
    return acc;
  }, {});

  return (
    <div className="py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        {searchParams.get("search") && (
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Schedule
          </button>
        )}
        <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-2 text-center">{t("resources.title")}</h1>
        <p className="text-center text-muted-foreground mb-8 max-w-lg mx-auto">{t("resources.subtitle")}</p>

        <div className="relative max-w-md mx-auto mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t("resources.search")}
            className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        {isAdmin && (
          <div className="mb-8">
            <button onClick={() => setShowUpload(!showUpload)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors">
              <Upload className="w-4 h-4" /> {t("resources.upload")}
            </button>
            {showUpload && (
              <div className="mt-4 rounded-2xl border border-border bg-card p-5 space-y-3 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">{t("resources.songName")}</label>
                  <input type="text" value={uploadSong} onChange={(e) => setUploadSong(e.target.value)} placeholder="e.g. Bohemian Rhapsody"
                    className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm text-foreground" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">{t("resources.type")}</label>
                  <select value={uploadType} onChange={(e) => setUploadType(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm text-foreground">
                    <option value="audio">{t("resources.recording")}</option>
                    <option value="lyrics">{t("resources.lyrics")}</option>
                    <option value="sheet_music">{t("resources.sheetMusic")}</option>
                    <option value="slides">Slides</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">{t("resources.file")}</label>
                  <input type="file" onChange={handleUpload} disabled={uploading || !uploadSong.trim()} accept=".mp3,.wav,.m4a,.pdf,.txt,.doc,.docx,.pptx,.ppt,.key"
                    className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                  {uploading && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Uploading…</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground text-sm text-center">{t("resources.loading")}</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center">{t("resources.empty")}</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([type, items]) => {
              const config = typeConfig[type] || typeConfig.audio;
              return (
                <div key={type}>
                  <h2 className="font-heading font-semibold text-lg text-foreground mb-3 flex items-center gap-2">
                    <span className={config.text}>{config.icon}</span>
                    {typeLabel[type]}
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((r) => (
                      <div
                        key={r.id}
                        className={`rounded-2xl border ${config.border} ${config.bg} p-4 flex flex-col gap-3 transition-shadow hover:shadow-md`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Music className="w-4 h-4 text-foreground/60 shrink-0" />
                            <span className="font-medium text-sm text-foreground truncate">{r.song_name}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {r.resource_type === "audio" && (
                              <button
                                onClick={() => handlePlay(r)}
                                className={`p-2 rounded-xl ${config.text} hover:bg-background/60 transition-colors`}
                                title={playingId === r.id ? "Pause" : "Play"}
                                disabled={audioLoading === r.id}
                              >
                                {audioLoading === r.id ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : playingId === r.id ? (
                                  <Pause className="w-5 h-5" />
                                ) : (
                                  <Play className="w-5 h-5" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => handleDownload(r)}
                              className={`p-2 rounded-xl ${config.text} hover:bg-background/60 transition-colors`}
                              title="Download"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(r)}
                                className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-foreground/60 truncate" title={r.file_name}>
                          {r.file_name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Resources;
