
-- Add status column to profiles (default inactive for new signups)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'inactive';

-- Update existing profiles to active (they're already established users)
UPDATE public.profiles SET status = 'active' WHERE status = 'inactive';

-- Replace handle_new_user to auto-link by email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  member_match RECORD;
  new_status text;
BEGIN
  -- Check if email matches an active member
  SELECT * INTO member_match 
  FROM public.members 
  WHERE LOWER(email) = LOWER(NEW.email) 
    AND status = 'ACTIVE'
  LIMIT 1;

  IF member_match IS NOT NULL THEN
    new_status := 'active';
  ELSE
    new_status := 'inactive';
  END IF;

  INSERT INTO public.profiles (user_id, display_name, location, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE(member_match.location, NEW.raw_user_meta_data->>'location'),
    new_status
  );
  RETURN NEW;
END;
$function$;

-- Allow admins to update profiles (to change status)
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
