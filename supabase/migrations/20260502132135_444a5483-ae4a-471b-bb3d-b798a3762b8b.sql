
CREATE TABLE public.popup_ticket_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_slug TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  ticket_count INTEGER NOT NULL CHECK (ticket_count BETWEEN 1 AND 4),
  payment_received BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.popup_ticket_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a reservation"
ON public.popup_ticket_reservations
FOR INSERT
WITH CHECK (
  length(trim(first_name)) > 0 AND length(trim(first_name)) <= 100
  AND length(trim(last_name)) > 0 AND length(trim(last_name)) <= 100
  AND length(trim(email)) > 0 AND length(trim(email)) <= 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND ticket_count BETWEEN 1 AND 4
  AND length(event_slug) > 0 AND length(event_slug) <= 100
);

CREATE POLICY "Admins can view reservations"
ON public.popup_ticket_reservations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update reservations"
ON public.popup_ticket_reservations
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete reservations"
ON public.popup_ticket_reservations
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_popup_ticket_reservations_updated_at
BEFORE UPDATE ON public.popup_ticket_reservations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
