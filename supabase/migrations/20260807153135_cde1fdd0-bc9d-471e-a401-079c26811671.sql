CREATE OR REPLACE FUNCTION public.get_public_choir_stats()
RETURNS TABLE(singers integer, locations integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*)::integer FROM public.members WHERE status IN ('ACTIVE','INACTIVE','TRIAL')),
    4::integer;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_choir_stats() TO anon, authenticated;