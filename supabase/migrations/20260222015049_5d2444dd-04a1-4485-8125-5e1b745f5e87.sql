
-- Create storage bucket for song resources
INSERT INTO storage.buckets (id, name, public)
VALUES ('song-resources', 'song-resources', false)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can download song resources
CREATE POLICY "Authenticated users can download song resources"
ON storage.objects FOR SELECT
USING (bucket_id = 'song-resources' AND auth.uid() IS NOT NULL);

-- Admins can upload song resources
CREATE POLICY "Admins can upload song resources"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'song-resources' AND public.has_role(auth.uid(), 'admin'));

-- Admins can delete song resources
CREATE POLICY "Admins can delete song resources"
ON storage.objects FOR DELETE
USING (bucket_id = 'song-resources' AND public.has_role(auth.uid(), 'admin'));

-- Create song_resources table
CREATE TABLE public.song_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  song_name TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('audio', 'lyrics', 'sheet_music')),
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  location TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by UUID NOT NULL
);

ALTER TABLE public.song_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view song resources"
ON public.song_resources FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage song resources"
ON public.song_resources FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_song_resources_location ON public.song_resources (location);
CREATE INDEX idx_song_resources_song ON public.song_resources (song_name);
