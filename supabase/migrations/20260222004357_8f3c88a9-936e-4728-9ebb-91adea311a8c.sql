
-- Create location_sessions table for storing schedule data
CREATE TABLE public.location_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week TEXT NOT NULL,
  location TEXT NOT NULL,
  session_date DATE NOT NULL,
  activity TEXT NOT NULL,
  artist TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.location_sessions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view sessions
CREATE POLICY "Authenticated users can view sessions"
ON public.location_sessions
FOR SELECT
TO authenticated
USING (true);

-- Admins can manage sessions
CREATE POLICY "Admins can manage sessions"
ON public.location_sessions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Index for efficient location + date queries
CREATE INDEX idx_location_sessions_location_date ON public.location_sessions (location, session_date);
