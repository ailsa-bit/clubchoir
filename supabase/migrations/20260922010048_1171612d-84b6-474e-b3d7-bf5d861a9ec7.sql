INSERT INTO public.session_registrations (member_id, session_label, location, first_name, last_name, email, notes, is_returning_member, payment_status, amount_paid)
SELECT id, 'fall-2026', 'Montreal', first_name, last_name, email, 'Marked paid manually by Ailsa', false, 'Paid', 280
FROM public.members
WHERE id = 'd507a64d-4410-48b9-9eff-634cff324509';

UPDATE public.members
SET status = 'ACTIVE', payment_status = 'Paid', updated_at = now()
WHERE id = 'd507a64d-4410-48b9-9eff-634cff324509';