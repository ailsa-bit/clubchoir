CREATE TABLE public.member_event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key text NOT NULL,
  user_id uuid NOT NULL,
  response text NOT NULL,
  location text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT member_event_rsvps_event_user_unique UNIQUE (event_key, user_id),
  CONSTRAINT member_event_rsvps_response_valid CHECK (response IN ('yes', 'no', 'maybe')),
  CONSTRAINT member_event_rsvps_event_key_length CHECK (char_length(event_key) BETWEEN 1 AND 100),
  CONSTRAINT member_event_rsvps_location_length CHECK (location IS NULL OR char_length(location) <= 100)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_event_rsvps TO authenticated;
GRANT ALL ON public.member_event_rsvps TO service_role;

ALTER TABLE public.member_event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own event RSVP"
ON public.member_event_rsvps FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Members can create own event RSVP"
ON public.member_event_rsvps FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND event_key = 'wheel-club-social-2026-11-01');

CREATE POLICY "Members can update own event RSVP"
ON public.member_event_rsvps FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can remove event RSVPs"
ON public.member_event_rsvps FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_member_event_rsvps_updated_at
BEFORE UPDATE ON public.member_event_rsvps
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();