
-- Drop restrictive policies on chat_messages
DROP POLICY IF EXISTS "Authenticated users can view messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can delete any message" ON public.chat_messages;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Authenticated users can view messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert own messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
  ON public.chat_messages FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any message"
  ON public.chat_messages FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Drop restrictive policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Fix user_roles too
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));
