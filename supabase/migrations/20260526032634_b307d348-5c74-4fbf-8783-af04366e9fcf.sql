CREATE POLICY "Admins can update song-resources files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'song-resources' AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'song-resources' AND has_role(auth.uid(), 'admin'::app_role));