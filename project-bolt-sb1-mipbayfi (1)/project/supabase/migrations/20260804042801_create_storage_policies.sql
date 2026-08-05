/*
# Storage policies for reports bucket

1. Purpose
   Allow authenticated users to upload road-damage images to the public `reports`
   bucket, and allow anyone (anon + authenticated) to read them (public bucket).
   Users manage objects under their own folder prefix `reports/<uid>/`.

2. Security
   - SELECT (read) public: anon + authenticated.
   - INSERT/UPDATE/DELETE: authenticated, restricted to the caller's own prefix
     `reports/<auth.uid>()/` so users can only write/delete their own uploads.
*/

DROP POLICY IF EXISTS "reports_bucket_read" ON storage.objects;
CREATE POLICY "reports_bucket_read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'reports');

DROP POLICY IF EXISTS "reports_bucket_insert" ON storage.objects;
CREATE POLICY "reports_bucket_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'reports' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "reports_bucket_update" ON storage.objects;
CREATE POLICY "reports_bucket_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'reports' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'reports' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "reports_bucket_delete" ON storage.objects;
CREATE POLICY "reports_bucket_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'reports' AND (storage.foldername(name))[1] = auth.uid()::text);
