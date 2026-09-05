import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useRef, useState } from "react";

const POSTER_URL =
  "https://vbbfpzszmtwhydhpgtgj.supabase.co/storage/v1/object/public/homepage-media/choir-hero-poster.jpg";
const WEBM_URL =
  "https://vbbfpzszmtwhydhpgtgj.supabase.co/storage/v1/object/public/homepage-media/choir-hero.webm";
const MP4_URL =
  "https://vbbfpzszmtwhydhpgtgj.supabase.co/storage/v1/object/public/homepage-media/choir-hero.mp4";

const HeroVideo = () => {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[260px] sm:max-w-[300px] lg:max-w-[320px] aspect-[9/16] rounded-[2rem] overflow-hidden shadow-xl ring-1 ring-orange/20 bg-muted">
      {reducedMotion ? (
        <img
          src={POSTER_URL}
          alt={t("alt.heroVideo")}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={POSTER_URL}
          aria-label={t("alt.heroVideo")}
        >
          <source src={WEBM_URL} type="video/webm" />
          <source src={MP4_URL} type="video/mp4" />
        </video>
      )}
    </div>
  );
};

export default HeroVideo;
