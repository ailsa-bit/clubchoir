
CREATE TABLE public.open_house_rsvps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  first_name text,
  last_name text,
  location text NOT NULL,
  source_campaign text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX open_house_rsvps_email_location_idx ON public.open_house_rsvps (lower(email), location);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.open_house_rsvps TO authenticated;
GRANT ALL ON public.open_house_rsvps TO service_role;
ALTER TABLE public.open_house_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage rsvps" ON public.open_house_rsvps FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.campaign_sends (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_key text NOT NULL,
  segment text NOT NULL,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX campaign_sends_unique ON public.campaign_sends (campaign_key, lower(recipient_email));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_sends TO authenticated;
GRANT ALL ON public.campaign_sends TO service_role;
ALTER TABLE public.campaign_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view campaign sends" ON public.campaign_sends FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
