CREATE TABLE public.resend_email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL,
  email_id text,
  message_id text,
  recipient_email text,
  subject text,
  from_email text,
  clicked_url text,
  raw_payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.resend_email_events TO authenticated;
GRANT ALL ON public.resend_email_events TO service_role;

ALTER TABLE public.resend_email_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email events"
  ON public.resend_email_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_resend_events_recipient ON public.resend_email_events (recipient_email);
CREATE INDEX idx_resend_events_type ON public.resend_email_events (event_type);
CREATE INDEX idx_resend_events_email_id ON public.resend_email_events (email_id);
CREATE INDEX idx_resend_events_message_id ON public.resend_email_events (message_id);
CREATE INDEX idx_resend_events_created_at ON public.resend_email_events (created_at DESC);