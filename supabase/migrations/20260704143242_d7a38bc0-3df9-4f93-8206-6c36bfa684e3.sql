
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE INDEX IF NOT EXISTS members_archived_at_idx
  ON public.members (archived_at)
  WHERE archived_at IS NULL;

UPDATE public.members
   SET archived_at = now()
 WHERE location ILIKE 'arundel'
   AND archived_at IS NULL;
