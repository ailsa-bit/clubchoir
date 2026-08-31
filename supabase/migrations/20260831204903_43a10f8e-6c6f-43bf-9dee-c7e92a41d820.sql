CREATE TABLE public.weekly_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  message_en TEXT NOT NULL,
  message_fr TEXT NOT NULL,
  active_from DATE NOT NULL DEFAULT current_date,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.weekly_announcements TO authenticated;
GRANT ALL ON public.weekly_announcements TO service_role;

ALTER TABLE public.weekly_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read active announcements"
  ON public.weekly_announcements
  FOR SELECT
  TO authenticated
  USING (active_from <= current_date);

CREATE POLICY "Admins can manage announcements"
  ON public.weekly_announcements
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_weekly_announcements_updated_at
  BEFORE UPDATE ON public.weekly_announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();