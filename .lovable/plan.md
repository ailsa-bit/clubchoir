## Add choir video to homepage hero

A trimmed, web-optimized version of your choir video will appear as a **portrait "phone-shaped" panel beside the hero headline** on desktop, and **below the headline on mobile**. It will autoplay muted on loop, looking premium and intentional — not stretched or cropped.

### What you'll see

**Desktop (≥1024px):**
```text
┌──────────────────────────────────────────────────┐
│                                                  │
│   Sing together.                  ┌─────────┐    │
│   No audition required.           │ ▶ video │    │
│                                   │ portrait│    │
│   [Try a session]                 │ choir   │    │
│   [Bring a friend]                │ loop    │    │
│                                   │         │    │
│                                   └─────────┘    │
└──────────────────────────────────────────────────┘
```

**Mobile (<1024px):** Existing hero stays as-is at the top, video sits below the CTA buttons at full width — keeping the page fast and readable on phones.

### Video preparation (done by me, no action needed from you)

1. **Trim** the dark intro (~0.5 sec) and dark outro (~1 sec) → final loop ~10–11 sec, so it loops cleanly without flashing to black.
2. **Transcode** from HEVC/Dolby Vision (18 MB) to:
   - **MP4 H.264** (universal browser support) — ~3 MB
   - **WebM VP9** (smaller fallback for Chrome/Firefox) — ~2 MB
3. **Generate a poster image** from the bright middle frame (the one with the city-name overlays) — shows instantly while the video loads.
4. **Mute** the audio track (required for autoplay; the visuals + text overlays carry the story on their own).
5. **Host** the optimized files in Lovable Cloud storage (not bundled with the site, so deploys stay fast).

### Frontend changes

- **`src/pages/Index.tsx`** — Restructure the hero section into a 2-column grid on `lg:` and up (text left, video right). Keep current single-column layout below `lg`. Add the video below the CTAs on mobile.
- **New component `src/components/HeroVideo.tsx`** — Portrait video player:
  - Rounded corners, soft shadow, subtle border in your brand orange tone
  - `<video>` with `autoPlay muted loop playsInline preload="metadata"`
  - Poster image shown until video loads
  - Sources: WebM first, MP4 fallback
  - Aspect ratio locked to 9:16 so layout doesn't shift while loading
  - Respects `prefers-reduced-motion` — falls back to the static poster image for users who've disabled animations
- **`src/index.css`** — Small additions for the video container styling (already uses your existing tokens).

### Storage

A new public Lovable Cloud storage bucket `homepage-media` will hold:
- `choir-hero.mp4`
- `choir-hero.webm`
- `choir-hero-poster.jpg`

Public read access only (no auth needed to view), no write access from the client.

### Performance notes

- Total added page weight: ~3 MB (video) + ~80 KB (poster) — loads in the background after the page is interactive
- `preload="metadata"` means only the first ~50 KB downloads on page load; the rest streams as it plays
- Poster image guarantees the hero never looks empty, even on slow connections
- No layout shift (aspect ratio reserved)

### Out of scope for this plan

- Adding sound or a play button (it's a muted ambient loop)
- Changing the hero copy or CTAs
- Adding the video to other pages

### Technical details

- Video processing via `ffmpeg` (already in sandbox): trim with `-ss 0.5 -to 11.5`, transcode H.264 with `-c:v libx264 -crf 26 -preset slow -movflags +faststart -an`, WebM with `-c:v libvpx-vp9 -crf 32 -b:v 0 -an`, poster with `-ss 6 -frames:v 1 -q:v 4`
- Files uploaded to Supabase Storage bucket via SQL migration creating the bucket + public read RLS policy
- Component uses `<source type="video/webm">` then `<source type="video/mp4">` for browser preference ordering
- Aspect ratio held with Tailwind `aspect-[9/16]` on a `max-w-[280px] lg:max-w-[320px]` container
