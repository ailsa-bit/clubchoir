-- Create public storage bucket for homepage media (videos, posters, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('homepage-media', 'homepage-media', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access; no client-side write
CREATE POLICY "Homepage media is publicly readable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'homepage-media');