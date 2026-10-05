ALTER TABLE public.member_event_rsvps ALTER COLUMN user_id DROP NOT NULL;
CREATE POLICY "Admins can add RSVPs" ON public.member_event_rsvps FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE OR REPLACE FUNCTION public.fill_rsvp_user_id() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.user_id IS NULL AND NEW.email IS NOT NULL THEN
    SELECT id INTO NEW.user_id FROM auth.users WHERE lower(email) = lower(NEW.email) LIMIT 1;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER fill_rsvp_user_id BEFORE INSERT ON public.member_event_rsvps FOR EACH ROW EXECUTE FUNCTION public.fill_rsvp_user_id();
CREATE OR REPLACE FUNCTION public.admin_terms_report()
RETURNS TABLE(display_name text, email text, location text, terms_accepted_at timestamptz, email_consent_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'Admins only'; END IF;
  RETURN QUERY SELECT p.display_name, u.email::text, p.location, p.terms_accepted_at, p.email_consent_at
  FROM public.profiles p JOIN auth.users u ON u.id = p.user_id
  WHERE p.terms_accepted_at IS NOT NULL OR p.email_consent_at IS NOT NULL;
END; $$;