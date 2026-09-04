
CREATE OR REPLACE FUNCTION public.activate_on_paid_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE target_user_id uuid;
BEGIN
  IF NEW.payment_status = 'paid' AND (TG_OP = 'INSERT' OR OLD.payment_status IS DISTINCT FROM 'paid') THEN
    SELECT id INTO target_user_id FROM auth.users WHERE LOWER(email) = LOWER(NEW.email) LIMIT 1;
    IF target_user_id IS NOT NULL THEN
      UPDATE public.profiles
         SET status = 'active',
             active_until = GREATEST(COALESCE(active_until, DATE '2026-12-10'), DATE '2026-12-10')
       WHERE user_id = target_user_id;
    END IF;
    UPDATE public.members
       SET status = 'ACTIVE', payment_status = 'paid'
     WHERE LOWER(email) = LOWER(NEW.email) AND archived_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS activate_member_on_paid ON public.session_registrations;
CREATE TRIGGER activate_member_on_paid
AFTER INSERT OR UPDATE OF payment_status ON public.session_registrations
FOR EACH ROW EXECUTE FUNCTION public.activate_on_paid_registration();

-- Backfill: any paid registrant who already has an account but is not active
UPDATE public.profiles p
   SET status = 'active',
       active_until = GREATEST(COALESCE(p.active_until, DATE '2026-12-10'), DATE '2026-12-10')
  FROM auth.users u
 WHERE p.user_id = u.id
   AND EXISTS (
     SELECT 1 FROM public.session_registrations r
      WHERE LOWER(r.email) = LOWER(u.email)
        AND r.session_label = 'fall-2026'
        AND r.payment_status = 'paid'
   )
   AND p.status IS DISTINCT FROM 'active';
