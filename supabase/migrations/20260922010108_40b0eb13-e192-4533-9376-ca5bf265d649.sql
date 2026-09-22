UPDATE public.session_registrations
SET payment_status = 'paid', updated_at = now()
WHERE lower(email) = 'martinecharbonneau@videotron.ca' AND session_label = 'fall-2026';