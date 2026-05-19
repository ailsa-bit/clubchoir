
CREATE TABLE public.session_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  session_label text NOT NULL,
  location text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  notes text,
  is_returning_member boolean NOT NULL DEFAULT false,
  payment_status text NOT NULL DEFAULT 'unpaid',
  payment_link_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX session_registrations_unique_per_session
  ON public.session_registrations (member_id, session_label, location)
  WHERE member_id IS NOT NULL;

CREATE INDEX session_registrations_session_idx
  ON public.session_registrations (session_label, location);

CREATE INDEX session_registrations_email_idx
  ON public.session_registrations (lower(email));

ALTER TABLE public.session_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view session registrations"
  ON public.session_registrations FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update session registrations"
  ON public.session_registrations FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete session registrations"
  ON public.session_registrations FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_session_registrations_updated_at
  BEFORE UPDATE ON public.session_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
