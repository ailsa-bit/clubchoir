DELETE FROM public.session_registrations WHERE lower(email) IN ('eeandrew100@hotmail.com','robichaudfanny@gmail.com');

UPDATE public.members
SET status='INACTIVE',
    payment_status='Refunded',
    archived_at=now(),
    crm_tags=ARRAY['winter-2027']::text[],
    notes=trim(both ' ' from coalesce(notes,'') || ' Removed from Fall 2026 (Sept 2026); fees reimbursed. Keep for Winter 2027.'),
    updated_at=now()
WHERE lower(email) IN ('eeandrew100@hotmail.com','robichaudfanny@gmail.com');

UPDATE public.profiles
SET status='inactive', active_until=NULL
WHERE lower(display_name) IN ('eeandrew100@hotmail.com','robichaudfanny@gmail.com');