CREATE TABLE public.resource_page_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  location text,
  page text NOT NULL,
  week integer,
  song text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX resource_page_views_created_at_idx ON public.resource_page_views (created_at DESC);
CREATE INDEX resource_page_views_location_idx ON public.resource_page_views (location);

GRANT INSERT ON public.resource_page_views TO authenticated;
GRANT SELECT ON public.resource_page_views TO authenticated;
GRANT ALL ON public.resource_page_views TO service_role;

ALTER TABLE public.resource_page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can record their own resource views"
ON public.resource_page_views FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view resource views"
ON public.resource_page_views FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));