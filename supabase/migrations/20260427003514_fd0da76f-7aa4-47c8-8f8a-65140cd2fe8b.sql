CREATE TABLE public.hudson_session_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  payment_received BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hudson_session_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a Hudson signup"
ON public.hudson_session_signups
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view Hudson signups"
ON public.hudson_session_signups
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update Hudson signups"
ON public.hudson_session_signups
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete Hudson signups"
ON public.hudson_session_signups
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_hudson_session_signups_updated_at
BEFORE UPDATE ON public.hudson_session_signups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();