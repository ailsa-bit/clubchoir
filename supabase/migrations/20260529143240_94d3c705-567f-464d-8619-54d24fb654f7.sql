
-- 1) session_registrations: scope admin policies to authenticated role explicitly.
-- Inserts are performed only by the register-session edge function using the service role
-- (which bypasses RLS), so no public INSERT policy is required.
DROP POLICY IF EXISTS "Admins can view session registrations" ON public.session_registrations;
DROP POLICY IF EXISTS "Admins can update session registrations" ON public.session_registrations;
DROP POLICY IF EXISTS "Admins can delete session registrations" ON public.session_registrations;

CREATE POLICY "Admins can view session registrations"
ON public.session_registrations
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update session registrations"
ON public.session_registrations
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete session registrations"
ON public.session_registrations
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Explicitly deny any direct INSERT/UPDATE/DELETE from anon and authenticated roles.
-- Service role bypasses RLS so the edge function continues to work.
CREATE POLICY "Block public inserts to session_registrations"
ON public.session_registrations
AS RESTRICTIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (false);


-- 2) profiles: prevent non-admins from changing protected fields (status) via trigger.
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins (and service role via security definer bypass) can change anything.
  IF has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Non-admins cannot change status.
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Only admins can change profile status';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_profile_field_protection ON public.profiles;
CREATE TRIGGER enforce_profile_field_protection
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_privileged_fields();

-- Tighten the user self-update policy: drop the racy subquery and rely on the trigger.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Scope admin policies on profiles to authenticated for clarity.
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
