CREATE TABLE public.trial_guests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name text NOT NULL,
  last_name text NOT NULL DEFAULT '',
  email text NOT NULL,
  location text NOT NULL,
  session_date date NOT NULL,
  week text,
  song text,
  notes text,
  attended boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX trial_guests_email_unique ON public.trial_guests (lower(email));

GRANT SELECT, UPDATE, DELETE ON public.trial_guests TO authenticated;
GRANT ALL ON public.trial_guests TO service_role;

ALTER TABLE public.trial_guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view trial guests" ON public.trial_guests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update trial guests" ON public.trial_guests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete trial guests" ON public.trial_guests FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));