import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { useProfile } from "@/hooks/use-profile";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2, Mail, Trash2, Upload } from "lucide-react";
import "./ShowcaseInvitations.css";

export const INVITE_SESSION = "showcase-2026-invitations";
const LOCATIONS = ["Montreal", "Hudson", "Saint-Hubert", "Pointe-Claire"];
const VERSIONS = [
  { key: "portrait-en", en: "Portrait — English", fr: "Portrait — anglais" },
  { key: "portrait-fr", en: "Portrait — French", fr: "Portrait — français" },
  { key: "landscape-en", en: "Landscape — English", fr: "Paysage — anglais" },
  { key: "landscape-fr", en: "Landscape — French", fr: "Paysage — français" },
];

const FLAKES = ["\u2744\uFE0E", "\u273B", "\u274B", "\u273B", "\u2744\uFE0E", "\u273C", "\u2744\uFE0E", "\u273B", "\u274B", "\u273B", "\u2744\uFE0E", "\u273C"];
const FLAKES_SIDE = ["\u273B", "\u2744\uFE0E", "\u274B", "\u2744\uFE0E", "\u273B", "\u2744\uFE0E", "\u274B", "\u2744\uFE0E"];

function FlakeBand({ sides, count }: { sides: string; count: number }) {
  const set = count === FLAKES.length ? FLAKES : FLAKES_SIDE;
  return (
    <div className={`cc-invite-band ${sides}`} aria-hidden="true">
      {set.map((f, i) => (
        <span key={i} className={`cc-invite-glyph ${i % 3 === 0 ? "cc-invite-glyph-lg" : ""}`}>{f}</span>
      ))}
    </div>
  );
}

interface Invite { id: string; location: string; part: string | null; file_name: string; storage_path: string; }

export function ShowcaseInvitations() {
  const { isAdmin, user } = useAdmin();
  const { location: myLocation } = useProfile();
  const { language } = useLanguage();
  const fr = language === "fr";
  const { toast } = useToast();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [adminLoc, setAdminLoc] = useState("Montreal");

  const load = async () => {
    const { data } = await supabase.from("song_resources")
      .select("id, location, part, file_name, storage_path")
      .eq("session_label", INVITE_SESSION).eq("resource_type", "invitation");
    setInvites((data as Invite[]) || []);
    setLoading(false);
  };
  useEffect(() => { if (user) load(); else setLoading(false); }, [user]);

  const shownLoc = isAdmin ? adminLoc : myLocation;
  const forLoc = invites.filter((i) => i.location === shownLoc);
  if (!isAdmin && !loading && forLoc.length === 0) return null;

  const download = async (inv: Invite) => {
    setBusy(inv.id);
    try {
      const { data, error } = await supabase.functions.invoke("get-signed-url", {
        body: { storage_path: inv.storage_path, file_name: inv.file_name },
      });
      if (error || !data?.signedUrl) throw error || new Error("no url");
      const blob = await (await fetch(data.signedUrl)).blob();
      const file = new File([blob], inv.file_name, { type: blob.type });
      const touch = matchMedia("(pointer: coarse)").matches;
      if (touch && (navigator as any).canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], title: inv.file_name }); return; }
        catch (e) { if ((e as DOMException).name === "AbortError") return; }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = inv.file_name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch {
      toast({ title: fr ? "Téléchargement impossible" : "Download failed", description: fr ? "Veuillez réessayer." : "Please try again.", variant: "destructive" });
    } finally { setBusy(null); }
  };

  const upload = async (version: string, file: File) => {
    if (!user) return;
    setBusy(version);
    const ext = file.name.split(".").pop();
    const path = `invitations/${adminLoc.toLowerCase()}/${version}-${Date.now()}.${ext}`;
    const old = forLoc.filter((i) => i.part === version);
    const { error: sErr } = await supabase.storage.from("song-resources").upload(path, file);
    if (sErr) { toast({ title: "Upload failed", description: sErr.message, variant: "destructive" }); setBusy(null); return; }
    const { error } = await supabase.from("song_resources").insert({
      song_name: "Showcase invitation", resource_type: "invitation", part: version,
      location: adminLoc, session_label: INVITE_SESSION, file_name: file.name, storage_path: path, uploaded_by: user.id,
    } as never);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else {
      for (const o of old) { await supabase.storage.from("song-resources").remove([o.storage_path]); await supabase.from("song_resources").delete().eq("id", o.id); }
      toast({ title: "Uploaded", description: `${adminLoc} — ${file.name}` });
    }
    setBusy(null); load();
  };

  const remove = async (inv: Invite) => {
    if (!confirm(`Delete ${inv.file_name}?`)) return;
    await supabase.storage.from("song-resources").remove([inv.storage_path]);
    await supabase.from("song_resources").delete().eq("id", inv.id);
    load();
  };

  return (
    <section id="showcase-invitations" className="cc-invite-frame mb-8 scroll-mt-24">
      <FlakeBand sides="cc-invite-band-row cc-invite-top" count={FLAKES.length} />
      <FlakeBand sides="cc-invite-band-row cc-invite-bottom" count={FLAKES.length} />
      <FlakeBand sides="cc-invite-band-col cc-invite-left" count={FLAKES_SIDE.length} />
      <FlakeBand sides="cc-invite-band-col cc-invite-right" count={FLAKES_SIDE.length} />

      <div className="cc-invite-inner">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="w-5 h-5 text-primary" />
          <h2 className="font-heading font-bold text-xl text-foreground">
            {fr ? "Invitations au spectacle" : "Showcase Invitations"}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {fr ? "Téléchargez votre invitation et partagez-la avec vos amis et votre famille par texto ou courriel."
              : "Download your invitation and share it with friends and family by text or email."}
        </p>

        {isAdmin && (
          <div className="flex flex-wrap gap-2 mb-4">
            {LOCATIONS.map((l) => (
              <button key={l} onClick={() => setAdminLoc(l)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${adminLoc === l ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                {l} ({invites.filter((i) => i.location === l).length}/4)
              </button>
            ))}
          </div>
        )}

        {loading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {VERSIONS.map((v) => {
              const inv = forLoc.find((i) => i.part === v.key);
              if (!inv && !isAdmin) return null;
              return (
                <div key={v.key} className="rounded-xl border border-border bg-card p-4 flex flex-col items-stretch gap-3 min-w-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{fr ? v.fr : v.en}</p>
                    {isAdmin && <p className="text-xs text-muted-foreground truncate">{inv ? inv.file_name : "Not uploaded yet"}</p>}
                  </div>
                  <div className="flex items-center gap-1 sm:shrink-0">
                    {inv && (
                      <button onClick={() => download(inv)} disabled={busy === inv.id}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
                        {busy === inv.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        {fr ? "Télécharger" : "Download"}
                      </button>
                    )}
                    {isAdmin && (
                      <>
                        <label className="p-2 rounded-xl bg-muted cursor-pointer" title={inv ? "Replace" : "Upload"}>
                          {busy === v.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(v.key, f); e.target.value = ""; }} />
                        </label>
                        {inv && <button onClick={() => remove(inv)} className="p-2 rounded-xl text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
