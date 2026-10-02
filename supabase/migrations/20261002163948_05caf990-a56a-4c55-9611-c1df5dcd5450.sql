ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz, ADD COLUMN IF NOT EXISTS email_consent_at timestamptz;

CREATE OR REPLACE FUNCTION public.accept_member_terms()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.profiles SET terms_accepted_at = COALESCE(terms_accepted_at, now()),
    email_consent_at = COALESCE(email_consent_at, now())
  WHERE user_id = auth.uid();
END; $$;
REVOKE ALL ON FUNCTION public.accept_member_terms() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.accept_member_terms() TO authenticated;