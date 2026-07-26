DROP POLICY IF EXISTS "Anyone can insert a prospect" ON public.prospects;
CREATE POLICY "Anyone can insert a prospect"
ON public.prospects FOR INSERT TO anon, authenticated
WITH CHECK (
  length(TRIM(BOTH FROM first_name)) > 0
  AND length(TRIM(BOTH FROM first_name)) <= 100
  AND length(TRIM(BOTH FROM email)) > 0
  AND length(TRIM(BOTH FROM email)) <= 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND array_length(locations, 1) = 1
  AND length(TRIM(BOTH FROM locations[1])) > 0
);