ALTER TABLE public.member_event_rsvps
  ADD COLUMN display_name text NOT NULL DEFAULT '',
  ADD COLUMN email text NOT NULL DEFAULT '';

ALTER TABLE public.member_event_rsvps
  ADD CONSTRAINT member_event_rsvps_display_name_length CHECK (char_length(display_name) <= 160),
  ADD CONSTRAINT member_event_rsvps_email_length CHECK (char_length(email) BETWEEN 3 AND 255);