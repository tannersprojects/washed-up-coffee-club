-- Create the memories storage bucket (public so landing page can display images without auth)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'memories',
  'memories',
  true,  -- Public so the landing page CameraRoll can display images
  '5242880',  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for storage.objects
-- Allow anyone to SELECT (read) - needed for public bucket / landing page
CREATE POLICY "Public read access for memories"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'memories');

-- Allow only admins to INSERT (upload)
CREATE POLICY "Admins can upload memories"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'memories'
    AND EXISTS (
      SELECT 1 FROM profile
      WHERE profile.id = auth.uid()
      AND profile.role = 'admin'
    )
  );

-- Allow only admins to UPDATE (e.g. overwrite)
CREATE POLICY "Admins can update memories"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'memories'
    AND EXISTS (
      SELECT 1 FROM profile
      WHERE profile.id = auth.uid()
      AND profile.role = 'admin'
    )
  );

-- Allow only admins to DELETE
CREATE POLICY "Admins can delete memories"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'memories'
    AND EXISTS (
      SELECT 1 FROM profile
      WHERE profile.id = auth.uid()
      AND profile.role = 'admin'
    )
  );