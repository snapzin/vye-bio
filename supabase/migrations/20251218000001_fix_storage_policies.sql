-- Fix storage policies to work without Supabase Auth
-- Since buckets are public, we allow public access for all operations
-- Access control is handled at the application level via JWT

-- Drop old policies that depend on auth.uid()
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own background" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own background" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own background" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own music" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own music" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own music" ON storage.objects;

-- Create new policies that allow public access (buckets are already public)
-- For avatars bucket
CREATE POLICY "Allow avatar uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Allow avatar updates" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars');

CREATE POLICY "Allow avatar deletes" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars');

-- For backgrounds bucket
CREATE POLICY "Allow background uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'backgrounds');

CREATE POLICY "Allow background updates" ON storage.objects
  FOR UPDATE USING (bucket_id = 'backgrounds');

CREATE POLICY "Allow background deletes" ON storage.objects
  FOR DELETE USING (bucket_id = 'backgrounds');

-- For music bucket (if it exists)
CREATE POLICY "Allow music uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'music');

CREATE POLICY "Allow music updates" ON storage.objects
  FOR UPDATE USING (bucket_id = 'music');

CREATE POLICY "Allow music deletes" ON storage.objects
  FOR DELETE USING (bucket_id = 'music');

