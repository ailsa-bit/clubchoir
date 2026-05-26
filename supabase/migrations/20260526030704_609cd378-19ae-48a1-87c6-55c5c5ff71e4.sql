CREATE TABLE public.popup_waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_slug TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.popup_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist"
ON public.popup_waitlist
FOR INSERT
WITH CHECK (
  length(trim(first_name)) BETWEEN 1 AND 100
  AND length(trim(last_name)) BETWEEN 1 AND 100
  AND length(trim(email)) BETWEEN 1 AND 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND length(event_slug) BETWEEN 1 AND 100
);

CREATE POLICY "Admins can view waitlist"
ON public.popup_waitlist
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update waitlist"
ON public.popup_waitlist
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete waitlist"
ON public.popup_waitlist
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));