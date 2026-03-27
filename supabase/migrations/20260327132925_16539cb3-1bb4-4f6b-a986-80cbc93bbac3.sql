
CREATE TABLE public.member_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

ALTER TABLE public.member_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage member notes"
  ON public.member_notes
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
