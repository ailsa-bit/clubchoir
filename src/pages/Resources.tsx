import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { Music, FileText, BookOpen, Download, Trash2, Upload, Loader2, Lock, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";

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
    try {
      const { data, error } = await supabase.storage.from("song-resources").download(resource.storage_path);
      if (error) {
        console.error("Download error:", error);
        toast({ title: "Download failed", description: error.message, variant: "destructive" });
        return;
      }
      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement("a");
        a.href = url;
        a.download = resource.file_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Unexpected download error:", err);
      toast({ title: "Download failed", description: "Could not download file.", variant: "destructive" });
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

  const filtered = searchQuery.trim()
    ? resources.filter(r => r.song_name.toLowerCase().includes(searchQuery.toLowerCase()) || r.file_name.toLowerCase().includes(searchQuery.toLowerCase()))
    : resources;

  return (
    <div className="py-12 px-4">
      <div className="container mx-auto max-w-5xl">
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
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center">{t("resources.empty")}</p>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("resources.song")}</TableHead>
                  <TableHead>{t("resources.type")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t("resources.fileName")}</TableHead>
                  <TableHead className="text-right">{t("resources.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4 text-primary shrink-0" />
                        <span className="truncate">{r.song_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        {typeIcon[r.resource_type]}
                        <span className="text-sm">{typeLabel[r.resource_type]}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-sm text-muted-foreground truncate block max-w-[200px]">{r.file_name}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleDownload(r)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button onClick={() => handleDelete(r)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Resources;
