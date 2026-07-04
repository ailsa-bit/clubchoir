
# Homepage cleanup — consolidated implementation plan

Combines the layout/registration-focused restructure and the image/brightness/performance work into one build.

## Part A — Structure & content

### A1. Slim the hero
- Keep: wordmark, H1, one-line subtitle, CTAs.
- Remove from hero: `home.hero.desc` and `home.hero.eventsSummary` (duplicates the Sessions block).
- CTAs (in this order):
  1. **Register for Fall 2026** (primary, filled)
  2. **See session dates & locations** (anchor-scroll to Sessions section)
  3. **Open Houses — August** (link to open-house page)
- Add a small reassurance line under CTAs: *"Fall 2026 registration is open · Spots fill first-come, first-served · Confirmation by e-transfer in July"* (bilingual).
- Collapse the 3 stacked gradient overlay divs to 1 lighter one (`foreground/60`).

### A2. Reorder the page

```text
1. Hero (slim, brighter)
2. Sessions & locations           ← moved up from position 5
3. Open Houses strip (4 cities)   ← new
4. Founder story (light band)     ← treatment change
5. Why members come back (light band) ← treatment change
6. What we sing (compact card, songs list)
7. Testimonials (3–4 + expand)
8. FAQ (registration-first order)
9. Photo gallery / footer CTA
```

### A3. Sessions block improvements
- Card content order: **City → Day + Time → Session dates (bold) → Venue**.
- Add a small **Register** pill on each card linking to `/register` (pre-selecting the location isn't in scope for this pass).
- Show a "New location" badge on Hudson using the existing `isNew` flag.

### A4. New Open Houses strip
- Horizontal band, 4 mini-cards (one per city).
- Each card: city, date, venue, "Reserve a spot" link.
- Cities without a scheduled open house show "TBA" rather than being hidden.

### A5. Compact the story sections
- Reduce each from `py-20 lg:py-28` to `py-14`.
- Founder + Why Come Back: **switch from dark full-bleed to light background** — photo on one side, cream/off-white background on the text side, dark text.
- What We Sing: compact card inside/adjacent to Sessions with a lighter overlay (background wash, not dark).

### A6. Testimonials
- Show 3–4 by default (prioritise ones mentioning "no audition," "first choir," "welcoming").
- "Read more" toggle reveals the rest.

### A7. FAQ reorder
- Registration-first order: cost, audition, miss a week, music/reading, then shy, kind, bring, bad.

## Part B — Images & performance

### B1. One-time compression pass (chosen approach — simpler than vite-imagetools)
For every homepage image and the two 3 MB JPGs:
- Resize to sensible max widths: hero/full-bleed **1920 px**, portraits **1200 px**, tiles **800 px**.
- Re-encode to WebP (quality ~80). Keep a JPG fallback only where we need a `<picture>` element.
- Bake the current inline `filter: brightness(1.15) saturate(1.05)` into the exported image so the browser doesn't recompute it every scroll.

Targets:
- `hero-choir.jpg` 1.1 MB → ~200 KB WebP
- `briana-seiji.jpg` 3.0 MB → ~250 KB WebP
- `gary-white.jpg` 3.0 MB → ~250 KB WebP
- `what-we-sing.jpg` 572 KB → ~150 KB WebP
- `founder-ailsa.jpg` 308 KB → ~120 KB WebP

### B2. Move large photos to the Lovable CDN
Upload the hero photo, founder photo, why-come-back photo, what-we-sing photo, and the gallery photos to the Lovable Assets CDN (`.asset.json` pointers). Keep the wordmark and small icons bundled.

### B3. Preload the LCP image only
- Add `<link rel="preload" as="image" href="…hero.webp" fetchpriority="high" />` to `index.html`.
- Every other homepage image: `loading="lazy" decoding="async"`.
- Audit that every `<img>` has explicit `width` and `height` to prevent CLS.

### B4. Overlay rework (visual brightness)
- Hero: single overlay at `foreground/60` (down from `/85`).
- Founder + Why Come Back: **light bands** — no dark overlay, photo as bounded accent, cream background for the text column.
- What We Sing: light background wash instead of dark gradient.
- Result: one dark hero → three light bands = page reads bright.

## Technical notes (for reference)

- Image compression: `sharp` CLI in the sandbox for one-off resize/encode; results committed as new files with `.webp` extensions and old JPGs deleted.
- CDN uploads: `lovable-assets create --file <path>` then reference `asset.url` from the generated `.asset.json` pointer.
- Bilingual copy: any new strings (reassurance line, open house strip, register pill, badges) added to `src/contexts/LanguageContext.tsx` in both EN and FR.
- No backend or schema changes.
- No new dependencies.

## Files that will change

- `src/pages/Index.tsx` (major restructure)
- `src/contexts/LanguageContext.tsx` (new strings)
- `index.html` (preload hint)
- `src/assets/*.jpg` / `*.webp` (compressed + some replaced by `.asset.json`)
- Possibly `src/pages/SingForTheHerd.tsx` (uses the two 3 MB JPGs — update image refs after compression)

## Out of scope for this pass

- Auto-selecting location from a `?location=` query param on `/register`
- Rewriting the photo gallery component itself
- Adding a `vite-imagetools` pipeline (revisit later if content changes often)
- Any changes to sub-pages beyond swapping compressed image references

Ready to implement on approval.
