DROP POLICY IF EXISTS "Anyone can insert a prospect" ON public.prospects;

CREATE POLICY "Anyone can insert a prospect"
ON public.prospects FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(first_name)) > 0
  AND length(trim(first_name)) <= 100
  AND length(trim(email)) > 0
  AND length(trim(email)) <= 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND array_length(locations, 1) IS NOT NULL
  AND array_length(locations, 1) <= 10
);