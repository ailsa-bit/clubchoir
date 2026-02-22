import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { Music, FileText, BookOpen, Download, Trash2, Upload, Loader2, Lock, Search } from "lucide-react";
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

const typeIcon: Record<string, React.ReactNode> = {
  audio: <Music className="w-4 h-4" />,
  lyrics: <FileText className="w-4 h-4" />,
  sheet_music: <BookOpen className="w-4 h-4" />,
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
  const [searchQuery, setSearchQuery] = useState("");

  const typeLabel: Record<string, string> = {
    audio: t("resources.recording"),
    lyrics: t("resources.lyrics"),
    sheet_music: t("resources.sheetMusic"),
  };

  const fetchResources = async () => {
    const { data } = await supabase.from("song_resources").select("*").order("song_name", { ascending: true });
    setResources((data as SongResource[]) || []);
    setLoading(false);
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
    const path = `songs/${uploadSong.trim().replace(/\s+/g, "-").toLowerCase()}/${uploadType}-${Date.now()}.${ext}`;
    const { error: storageError } = await supabase.storage.from("song-resources").upload(path, file);
    if (storageError) { toast({ title: "Upload failed", description: storageError.message, variant: "destructive" }); setUploading(false); return; }
    const { error: dbError } = await supabase.from("song_resources").insert({ song_name: uploadSong.trim(), resource_type: uploadType, file_name: file.name, storage_path: path, location: "all", uploaded_by: user.id });
    if (dbError) { toast({ title: "Save failed", description: dbError.message, variant: "destructive" }); }
    else { toast({ title: "Uploaded!", description: `${file.name} added to ${uploadSong.trim()}` }); setUploadSong(""); fetchResources(); }
    setUploading(false);
    e.target.value = "";
  };

  const handleDownload = async (resource: SongResource) => {
    const { data } = await supabase.storage.from("song-resources").createSignedUrl(resource.storage_path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
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

  if (!user) {
    return (
      <div className="py-16 px-4 text-center">
        <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="font-heading font-bold text-2xl text-foreground mb-2">{t("resources.membersOnly")}</h1>
        <p className="text-muted-foreground mb-6">{t("resources.signIn")}</p>
        <Link to="/profile" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
          {t("common.signIn")}
        </Link>
      </div>
    );
  }

  const filtered = searchQuery.trim()
    ? resources.filter(r => r.song_name.toLowerCase().includes(searchQuery.toLowerCase()) || r.file_name.toLowerCase().includes(searchQuery.toLowerCase()))
    : resources;

  const grouped: Record<string, SongResource[]> = {};
  filtered.forEach((r) => { if (!grouped[r.song_name]) grouped[r.song_name] = []; grouped[r.song_name].push(r); });

  return (
    <div className="py-12 px-4">
      <div className="container mx-auto max-w-4xl">
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
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">{t("resources.file")}</label>
                  <input type="file" onChange={handleUpload} disabled={uploading || !uploadSong.trim()} accept=".mp3,.wav,.m4a,.pdf,.txt,.doc,.docx"
                    className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                  {uploading && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Uploading…</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground text-sm text-center">{t("resources.loading")}</p>
        ) : Object.keys(grouped).length === 0 ? (
          <p className="text-muted-foreground text-sm text-center">{t("resources.empty")}</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([songName, songResources]) => (
              <div key={songName} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Music className="w-4 h-4 text-primary" />
                  <h3 className="font-heading font-bold text-foreground">{songName}</h3>
                </div>
                <div className="space-y-2">
                  {songResources.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 bg-background/60 rounded-xl px-4 py-2.5">
                      <span className="text-muted-foreground">{typeIcon[r.resource_type]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{r.file_name}</p>
                        <p className="text-xs text-muted-foreground">{typeLabel[r.resource_type]}</p>
                      </div>
                      <button onClick={() => handleDownload(r)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Download">
                        <Download className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <button onClick={() => handleDelete(r)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Resources;
