ALTER TABLE public.popup_ticket_reservations
  ADD COLUMN IF NOT EXISTS ticket_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS paid_email_sent_at timestamptz;