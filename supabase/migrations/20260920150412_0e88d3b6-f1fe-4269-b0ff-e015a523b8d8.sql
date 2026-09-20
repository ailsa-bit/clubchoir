ALTER TABLE public.resource_page_views
  ADD COLUMN IF NOT EXISTS event_type text NOT NULL DEFAULT 'view',
  ADD COLUMN IF NOT EXISTS resource_type text,
  ADD COLUMN IF NOT EXISTS file_name text,
  ADD COLUMN IF NOT EXISTS device text;

CREATE INDEX IF NOT EXISTS resource_page_views_event_type_idx ON public.resource_page_views (event_type);