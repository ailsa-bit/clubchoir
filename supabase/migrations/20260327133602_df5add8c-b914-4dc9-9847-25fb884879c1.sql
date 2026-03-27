
CREATE TABLE public.member_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  session_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (member_id, session_name)
);

ALTER TABLE public.member_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage member sessions"
  ON public.member_sessions
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
