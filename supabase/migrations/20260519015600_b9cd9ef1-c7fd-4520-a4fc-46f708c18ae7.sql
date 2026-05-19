-- Helper: is the user an approved (active) member?
CREATE OR REPLACE FUNCTION public.is_active_member(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND status = 'active'
  )
$$;

-- chat_messages: require active member (or admin) for SELECT and INSERT
DROP POLICY IF EXISTS "Authenticated users can view messages" ON public.chat_messages;
CREATE POLICY "Active members can view messages"
ON public.chat_messages FOR SELECT
USING (public.is_active_member(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can insert own messages" ON public.chat_messages;
CREATE POLICY "Active members can insert own messages"
ON public.chat_messages FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (public.is_active_member(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
);

-- location_sessions: require active member (or admin) for SELECT
DROP POLICY IF EXISTS "Authenticated users can view sessions" ON public.location_sessions;
CREATE POLICY "Active members can view sessions"
ON public.location_sessions FOR SELECT
TO authenticated
USING (public.is_active_member(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- song_resources: require active member (or admin) for SELECT
DROP POLICY IF EXISTS "Authenticated users can view song resources" ON public.song_resources;
CREATE POLICY "Active members can view song resources"
ON public.song_resources FOR SELECT
USING (public.is_active_member(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- members: tighten directory read to active members (or admins)
DROP POLICY IF EXISTS "Authenticated users can view active members" ON public.members;
CREATE POLICY "Active members can view active members"
ON public.members FOR SELECT
USING (
  status = 'ACTIVE'
  AND (public.is_active_member(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
);