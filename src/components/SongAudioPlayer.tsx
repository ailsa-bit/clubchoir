import { useEffect, useRef, useState } from "react";
import { Play, Pause, Loader2, RotateCcw, Download, Trash2 } from "lucide-react";

interface Props {
  label: string;
  loadUrl: () => Promise<string | null>;
  activeId: string | null;
  id: string;
  onActivate: (id: string | null) => void;
  onDownload?: () => void | Promise<void>;
  downloadLabel?: string;
  isAdmin?: boolean;
  onDelete?: () => void | Promise<void>;
  deleteLabel?: string;
}

function fmt(sec: number) {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const SongAudioPlayer = ({ label, loadUrl, activeId, id, onActivate, onDownload, downloadLabel = "Download", isAdmin = false, onDelete, deleteLabel = "Delete" }: Props) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);
  const isBusyRef = useRef(false);

  // Stop and rewind when another track becomes active
  useEffect(() => {
    const audio = audioRef.current;
    if (activeId !== id && audio && !audio.paused) {
      audio.pause();
      audio.currentTime = 0;
      setCurrent(0);
      setPlaying(false);
    }
  }, [activeId, id]);

  // Get the track link ready as soon as the section is opened, so the first
  // tap plays immediately (iPhones and iPads block delayed playback).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const url = await loadUrl();
      const audio = audioRef.current;
      if (cancelled || !url || !audio || audio.src) return;
      audio.src = url;
      audio.load();
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Make sure a removed player never keeps playing in the background
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    };
  }, []);


  const stop = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setCurrent(0);
  };

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio || isBusyRef.current) return;

    if (!audio.paused) {
      audio.pause();
      return;
    }

    isBusyRef.current = true;
    onActivate(id);
    setError(false);

    if (!audio.src) {
      setLoading(true);
      const url = await loadUrl();
      setLoading(false);
      if (!url) {
        setError(true);
        isBusyRef.current = false;
        return;
      }
      audio.src = url;
    }

    try {
      await audio.play();
    } catch {
      // The link may have expired — fetch a fresh one and try once more
      try {
        const fresh = await loadUrl();
        if (!fresh) throw new Error("no url");
        audio.src = fresh;
        await audio.play();
      } catch {
        setError(true);
      }
    } finally {
      isBusyRef.current = false;
    }
  };


  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    audio.currentTime = Number(e.target.value);
    setCurrent(Number(e.target.value));
  };

  return (
    <div className="rounded-xl border border-[hsl(var(--pink)/.3)] bg-[hsl(var(--pink-light))] p-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? `Pause ${label}` : `Play ${label}`}
          className="shrink-0 w-12 h-12 rounded-full bg-[hsl(var(--pink))] text-[hsl(var(--pink-foreground))] flex items-center justify-center active:scale-95 transition-transform"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : playing ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{label}</p>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={current}
              onChange={seek}
              aria-label="Seek"
              className="flex-1 h-2 accent-[hsl(var(--pink))] cursor-pointer"
            />
            <span className="text-xs tabular-nums text-muted-foreground shrink-0">
              {fmt(current)} / {fmt(duration)}
            </span>
          </div>
        </div>
        {onDownload && (
          <button
            type="button"
            onClick={() => onDownload()}
            aria-label={`${downloadLabel} ${label}`}
            title={downloadLabel}
            className="shrink-0 w-9 h-9 rounded-full border border-[hsl(var(--pink))]/40 text-[hsl(var(--pink))] flex items-center justify-center active:scale-95 transition-transform"
          >
            <Download className="w-4 h-4" />
          </button>
        )}
        {isAdmin && onDelete && (
          <button
            type="button"
            onClick={() => onDelete()}
            aria-label={`${deleteLabel} ${label}`}
            title={deleteLabel}
            className="shrink-0 w-9 h-9 rounded-full border border-destructive/40 text-destructive flex items-center justify-center active:scale-95 transition-transform"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        {(playing || current > 0) && (
          <button
            type="button"
            onClick={stop}
            aria-label={`Stop and reset ${label}`}
            className="shrink-0 w-9 h-9 rounded-full border border-[hsl(var(--pink))]/40 text-[hsl(var(--pink))] flex items-center justify-center active:scale-95 transition-transform"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
      {error && <p className="text-xs text-destructive mt-2">Could not play this track. Please try again.</p>}
      <audio
        ref={audioRef}
        preload="none"
        playsInline
        onPlay={() => { setPlaying(true); onActivate(id); }}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCurrent(0); }}
        onTimeUpdate={(e) => setCurrent((e.target as HTMLAudioElement).currentTime)}
        onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
        onError={() => { setPlaying(false); isBusyRef.current = false; }}
      />
    </div>
  );
};

export default SongAudioPlayer;
