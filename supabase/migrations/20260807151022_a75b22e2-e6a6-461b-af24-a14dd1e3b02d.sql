UPDATE public.members
SET archived_at = now(),
    status = 'INACTIVE',
    crm_tags = (SELECT ARRAY(SELECT DISTINCT unnest(crm_tags || ARRAY['no-email','future-session']))),
    notes = TRIM(BOTH ' ' FROM COALESCE(notes,'') || ' Not joining Fall 2026; interested in future sessions. Removed from email lists.')
WHERE LOWER(email) IN ('rosiecaplan18@gmail.com','donnakuz@hotmail.com');