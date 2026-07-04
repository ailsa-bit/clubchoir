
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_until DATE;

CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN RETURN NEW; END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Only admins can change profile status';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_active_member(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id
      AND status = 'active'
      AND (active_until IS NULL OR active_until >= CURRENT_DATE)
  )
$$;

CREATE OR REPLACE FUNCTION public.activate_member_for_paid_registration(
  _email TEXT,
  _active_until DATE DEFAULT DATE '2026-12-10'
) RETURNS TABLE(matched_user_id uuid, activated boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE target_user_id uuid;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can activate members';
  END IF;
  SELECT id INTO target_user_id FROM auth.users WHERE LOWER(email) = LOWER(_email) LIMIT 1;
  IF target_user_id IS NULL THEN
    RETURN QUERY SELECT NULL::uuid, false; RETURN;
  END IF;
  UPDATE public.profiles
     SET status = 'active', active_until = _active_until
   WHERE user_id = target_user_id;
  RETURN QUERY SELECT target_user_id, true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.activate_member_for_paid_registration(TEXT, DATE) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.expire_stale_members()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE n integer;
BEGIN
  UPDATE public.profiles SET status = 'inactive'
   WHERE status = 'active' AND active_until IS NOT NULL AND active_until < CURRENT_DATE;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;
GRANT EXECUTE ON FUNCTION public.expire_stale_members() TO service_role;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  paid_reg RECORD;
  new_status text;
  new_until DATE;
  display text; parsed_first text; parsed_last text;
BEGIN
  SELECT location INTO paid_reg FROM public.session_registrations
   WHERE LOWER(email) = LOWER(NEW.email) AND session_label = 'fall-2026' AND payment_status = 'paid'
   LIMIT 1;
  IF paid_reg IS NOT NULL THEN
    new_status := 'active'; new_until := DATE '2026-12-10';
  ELSE
    new_status := 'inactive'; new_until := NULL;
  END IF;
  INSERT INTO public.profiles (user_id, display_name, location, status, active_until)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE(paid_reg.location, NEW.raw_user_meta_data->>'location'),
    new_status, new_until
  );
  IF NOT EXISTS (SELECT 1 FROM public.members WHERE LOWER(email) = LOWER(NEW.email)) THEN
    display := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''), split_part(NEW.email, '@', 1));
    IF position(' ' IN display) > 0 THEN
      parsed_first := split_part(display, ' ', 1);
      parsed_last := TRIM(substring(display FROM position(' ' IN display) + 1));
    ELSE
      parsed_first := display; parsed_last := '';
    END IF;
    INSERT INTO public.members (first_name, last_name, email, location, status, joined)
    VALUES (parsed_first, parsed_last, NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'location', ''),
      CASE WHEN new_status = 'active' THEN 'ACTIVE' ELSE 'PROSPECT' END,
      CURRENT_DATE);
  END IF;
  RETURN NEW;
END;
$$;

-- Backfill (auth.uid() is NULL during migration, so trigger allows it)
UPDATE public.profiles p SET status = 'active', active_until = DATE '2026-12-10'
  FROM auth.users u WHERE p.user_id = u.id AND LOWER(u.email) = 'ailsa@clubchoir.ca';

UPDATE public.profiles p SET status = 'active', active_until = DATE '2026-12-10'
  FROM auth.users u
  JOIN public.session_registrations sr ON LOWER(sr.email) = LOWER(u.email)
 WHERE p.user_id = u.id AND sr.session_label = 'fall-2026' AND sr.payment_status = 'paid';
