# Fall 2026 Song Resources page

A week-by-week library at `/resources/fall-2026` where members find everything for Weeks 1–10: recordings they can play right in the page, lyric sheets, lyric slides, and sheet music by part (Blue, Pink, Floaters, All Parts). You upload; members view, play and download. Same files for every location.

## What members see

- A row of week buttons (Week 1 … Week 10) at the top. Tapping one opens that week.
- Inside a week, one card per song. Each song card shows:
  - A play button with a simple audio player (play/pause, scrub bar, time) that works in the page — no download needed. Works on iPhone, Android, iPad, Mac and PC.
  - Buttons for Lyrics, Slides, and Sheet music grouped by part: Blue, Pink, Floaters, All Parts.
  - Each document opens in a new tab to view, plus a download option.
- A search box to find a song by name across all weeks.
- Weeks with nothing uploaded yet show a friendly "coming soon" note instead of an empty box.
- Everything is bilingual (EN/FR) and mobile-first: large tap targets, one column on phones.
- Clear "Back" buttons everywhere: from an open song back to its week, and from a week back to the main resources page. They sit at the top-left, stay visible while scrolling on phones, and work on every device (they don't rely on the browser's back gesture). The phone's own back button/swipe also lands where you'd expect.

## What you see (admin only)

- An "Add files" panel at the top of each week.
- Pick the week, type or pick the song name, choose what the file is (Recording / Lyrics / Slides / Sheet music — Blue / Pink / Floaters / All Parts), then select one or more files.
- Multi-file upload with a progress bar per file, so you can drop a whole week in one go.
- Rename or delete any uploaded file from the same page.
- Reorder songs within a week (simple up/down), so the running order matches rehearsal.

## Technical notes

- Storage: existing private `song-resources` bucket. Existing policies already allow admin upload and active-member read — no policy change needed. Raise the project storage file-size limit if audio files exceed the current cap.
- Database: extend `public.song_resources` with `week` (1–10), `part` (nullable: blue/pink/floaters/all), `sort_order`, and `session_label` (default `fall-2026`); widen the `resource_type` values to include `slides`. Existing 60 rows keep working (treated as archived/unassigned). Migration keeps current RLS and adds GRANTs where needed.
- Playback: signed URLs via the existing `get-signed-url` edge function, requested on demand (10-min expiry) and cached in component state. Audio uses a native `<audio>` element with `preload="none"` and `playsInline` so iOS Safari streams rather than downloads; only one track plays at a time.
- Uploads: direct browser upload to Supabase Storage via `supabase.storage.upload`, path `fall-2026/week-{n}/{song}/{type}-{filename}`, with a per-file row inserted into `song_resources`. Accepts `audio/*`, `application/pdf`, images and common slide formats; iOS/Android file pickers supported through a plain `<input type="file" multiple>`.
- Page: rewrite `src/pages/FallSongs.tsx` (currently a placeholder) and add small components for the week tabs, song card, audio player and admin uploader. Route and `ActiveMemberGate` stay as they are.
- Translations added to `LanguageContext` for all new labels.

## Testing plan (we do this together)

1. Upload one recording + one PDF to Week 1 and confirm they appear.
2. Play the track on desktop, then on your phone.
3. Open the PDF on iPhone and on PC.
4. Sign in as a regular member and confirm view/play works but no upload controls appear.
5. Delete a test file and confirm it disappears from both the list and storage.
