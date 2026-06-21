ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS crm_tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS follow_up_date date;

CREATE INDEX IF NOT EXISTS idx_members_follow_up_date ON public.members(follow_up_date) WHERE follow_up_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_members_crm_tags ON public.members USING GIN (crm_tags);