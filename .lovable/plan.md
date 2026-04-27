## Goal

Make the site feel less sterile by placing your real choir photos throughout — but first, clean each photo so they look intentional and brand-consistent rather than like a random phone camera roll.

## Phase 1 — Process the 9 photos (automated, no quality loss)

For each photo I'll run an automated pipeline that does:

1. **Strip video UI** from the 3 screenshots (HDR badge top-left, play button center, scrubber bar bottom)
2. **Smart crop** — re-frame each shot to its strongest area (faces, energy), removing dead floor space, cables, mic stands, and empty edges
3. **Color & exposure correction** — auto-balance shadows/highlights, neutralize the heavy purple cast on the pub shots, gently warm up the dim ones, lift faces out of shadow
4. **Light, consistent grade** — a subtle warm-film treatment (slightly lifted blacks, +3 warmth, +5 saturation) so all 9 photos feel like they belong to the same brand
5. **Generate 3 sizes per photo**:
   - Wide 16:9 for hero banners and full-width strips
   - Square 1:1 for grid tiles
   - Portrait 4:5 for mobile-friendly cards
6. **Compress to WebP** (~150–250 KB each) for fast loading

I'll preview the cleaned versions inline before placing them anywhere, so you can veto any photo I shouldn't use.

## Phase 2 — Categorize the photos by best use

Based on what each shot communicates:

| Photo | Best use |
|---|---|
| IMG_7785 (Saint-Hubert group portrait, you in front, smiles) | "About / who we are" hero, big and warm |
| IMG_9045 (Pointe-Claire group with Club Choir folders) | Sessions overview accent, or community section |
| IMG_1268, IMG_2839 (Kingfisher pub, stage lights, conducting) | Hudson session page hero — sells the *vibe* of that new location perfectly |
| IMG_7909 (Arundel chapel, stained glass, intimate) | Arundel session card or events page |
| IMG_8937 ("I can see clearly now" lyrics on screen, learning) | FAQ or "Try a Session" page — shows what a real session looks like |
| Capture_d_écran_232224 + 232239 (big Pointe-Claire choir formation) | Community page hero, or testimonials background accent |
| Capture_d_écran_232004 (stage performance with conductor) | Corporate/Events page — sells the "we perform" angle |

## Phase 3 — Place them across the site

Concrete additions, ordered by impact:

1. **Homepage — new "Real moments from real sessions" strip** between the FAQ and Testimonials sections. A 3-up tile grid of 6 best photos, no text overlays, just the images breathing. Click any tile → opens it larger in a lightbox. This is the single biggest "less sterile" win.

2. **Homepage — sessions cards get tiny photo accents** (each location card gets a small rounded thumbnail of that venue's actual room/people in the corner)

3. **Hudson Session page hero** — replace or accent the current header with the Kingfisher pub atmosphere shot. That photo *is* the pitch for Hudson — instantly communicates "this is unlike any other choir."

4. **Try a Session page** — add the IMG_8937 "lyrics on screen" photo to the "what to expect" area. Removes mystery, lowers the barrier.

5. **Community / Choir Community page** — hero strip with the big group portraits at the top.

6. **Corporate / Events page** — accent with the performance shots to show "yes, we actually perform at events."

7. **About-the-director area** (wherever you appear) — use IMG_7785 for warmth.

## Phase 4 — Make it feel curated, not cluttered

- Every photo placement uses a **soft rounded frame** (matches your existing card style, `rounded-2xl`)
- Subtle hover lift on tiles so they feel interactive
- Lazy-loaded so they never slow the page down
- Bilingual alt text (EN/FR) for accessibility and SEO
- A consistent thin warm-tinted border so the photos feel branded together

## What you'll see after approval

I'll process all 9 photos first and show you the cleaned versions side-by-side with the originals. **You approve which ones to actually use** before I place anything on the site. If even 5 of the 9 survive, that's enough to transform the feel of the homepage.

## Technical notes (for reference)

- Photos copied to `src/assets/photos/` and imported as ES modules (Vite optimizes them automatically)
- Image processing done with ImageMagick (sharp, crop, color correction, WebP encoding)
- New `<PhotoGallery>` component with lightbox using existing shadcn `Dialog`
- No new dependencies — uses what's already in the project
- Reuses existing `rounded-2xl border border-border` card styling for consistency

## What I need from you to start

Just a yes. No more uploads needed — I'll work with the 9 you've sent. If after the cleanup pass you have a few more favorites you want to add, you can drop them in any time and I'll run them through the same pipeline.
