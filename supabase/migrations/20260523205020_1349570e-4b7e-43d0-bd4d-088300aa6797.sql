
-- 1) Storage: restrict song-resources downloads to active members or admins
DROP POLICY IF EXISTS "Authenticated users can download song resources" ON storage.objects;
CREATE POLICY "Active members can download song resources"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'song-resources'
    AND (public.is_active_member(auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role))
  );

-- 2) Realtime: restrict messages subscription to active members or admins
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Active members can receive realtime" ON realtime.messages;
CREATE POLICY "Active members can receive realtime"
  ON realtime.messages FOR SELECT
  TO authenticated
  USING (
    public.is_active_member(auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- 3) Hudson signups: replace permissive INSERT with validation
DROP POLICY IF EXISTS "Anyone can submit a Hudson signup" ON public.hudson_session_signups;
CREATE POLICY "Anyone can submit a Hudson signup"
  ON public.hudson_session_signups FOR INSERT
  WITH CHECK (
    length(trim(first_name)) BETWEEN 1 AND 100
    AND length(trim(last_name)) BETWEEN 1 AND 100
    AND length(trim(email)) BETWEEN 1 AND 255
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );

-- 4) Lock down trigger-only helper function (not used in RLS)
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
