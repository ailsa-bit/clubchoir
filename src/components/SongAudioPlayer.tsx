import { useEffect, useRef, useState } from "react";
import { Play, Pause, Loader2 } from "lucide-react";

interface Props {
  label: string;
  loadUrl: () => Promise<string | null>;
  activeId: string | null;
  id: string;
  onActivate: (id: string | null) => void;
}

function fmt(sec: number) {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const SongAudioPlayer = ({ label, loadUrl, activeId, id, onActivate }: Props) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);

  // Pause when another track becomes active
  useEffect(() => {
    if (activeId !== id && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, [activeId, id]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      return;
    }

    onActivate(id);

    if (!audio.src) {
      setLoading(true);
      setError(false);
      // Kick playback inside the user gesture so iOS unlocks the element
      audio.play().catch(() => {});
      const url = await loadUrl();
      setLoading(false);
      if (!url) {
        setError(true);
        return;
      }
      audio.src = url;
    }

    try {
      await audio.play();
    } catch {
      setError(true);
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
        onError={() => { setPlaying(false); }}
      />
    </div>
  );
};

export default SongAudioPlayer;
