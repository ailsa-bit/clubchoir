CREATE OR REPLACE FUNCTION public.get_my_member_profile()
RETURNS TABLE(
  display_name text,
  email text,
  status text,
  active_until date,
  location text,
  member_since date
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uid uuid := auth.uid();
  uemail text;
  p RECORD;
  m RECORD;
BEGIN
  IF uid IS NULL THEN RETURN; END IF;
  SELECT lower(u.email) INTO uemail FROM auth.users u WHERE u.id = uid;
  SELECT * INTO p FROM public.profiles WHERE user_id = uid LIMIT 1;
  SELECT * INTO m FROM public.members WHERE lower(email) = uemail AND archived_at IS NULL
   ORDER BY joined NULLS LAST LIMIT 1;

  RETURN QUERY SELECT
    COALESCE(
      NULLIF(TRIM(COALESCE(m.first_name,'') || ' ' || COALESCE(m.last_name,'')), ''),
      p.display_name,
      uemail
    ),
    uemail,
    COALESCE(p.status, 'inactive'),
    p.active_until,
    COALESCE(NULLIF(m.location, ''), p.location),
    m.joined;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_my_member_name(_first_name text, _last_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uid uuid := auth.uid();
  uemail text;
  f text := NULLIF(TRIM(_first_name), '');
  l text := TRIM(COALESCE(_last_name, ''));
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF f IS NULL THEN RAISE EXCEPTION 'First name is required'; END IF;
  IF length(f) > 80 OR length(l) > 80 THEN RAISE EXCEPTION 'Name is too long'; END IF;

  SELECT lower(u.email) INTO uemail FROM auth.users u WHERE u.id = uid;

  UPDATE public.profiles
     SET display_name = TRIM(f || ' ' || l)
   WHERE user_id = uid;

  UPDATE public.members
     SET first_name = f, last_name = l
   WHERE lower(email) = uemail;
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_member_profile() FROM public, anon;
REVOKE ALL ON FUNCTION public.update_my_member_name(text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_my_member_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_my_member_name(text, text) TO authenticated;