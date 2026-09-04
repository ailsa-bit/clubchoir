ALTER TABLE public.song_resources
  ADD COLUMN IF NOT EXISTS week integer,
  ADD COLUMN IF NOT EXISTS part text,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS session_label text NOT NULL DEFAULT 'fall-2026';

UPDATE public.song_resources SET session_label = 'archive' WHERE week IS NULL AND session_label = 'fall-2026';

ALTER TABLE public.song_resources
  ADD CONSTRAINT song_resources_week_range CHECK (week IS NULL OR (week >= 1 AND week <= 10)),
  ADD CONSTRAINT song_resources_part_valid CHECK (part IS NULL OR part IN ('blue','pink','floaters','all'));

CREATE INDEX IF NOT EXISTS song_resources_session_week_idx ON public.song_resources (session_label, week, sort_order);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.song_resources TO authenticated;
GRANT ALL ON public.song_resources TO service_role;