-- Storage Bucket Setup for SafetyAI Audio Uploads
-- Run this in your Supabase SQL Editor

-- 1. Create the storage bucket (if it doesn't exist)
-- Note: You may need to create this manually in the Supabase Dashboard
-- Go to Storage > Create a new bucket > Name: "sos-audio" > Public bucket

-- 2. Enable RLS on the storage.objects table (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Create policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads to sos-audio" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'sos-audio' 
  AND auth.role() = 'authenticated'
);

-- 4. Create policy to allow public read access to audio files
CREATE POLICY "Allow public read access to sos-audio" ON storage.objects
FOR SELECT USING (
  bucket_id = 'sos-audio'
);

-- 5. Create policy to allow users to update their own files
CREATE POLICY "Allow users to update their own audio files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'sos-audio' 
  AND auth.role() = 'authenticated'
);

-- 6. Create policy to allow users to delete their own files
CREATE POLICY "Allow users to delete their own audio files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'sos-audio' 
  AND auth.role() = 'authenticated'
);

-- 7. Optional: Create a function to clean up old audio files
CREATE OR REPLACE FUNCTION cleanup_old_audio_files()
RETURNS void AS $$
BEGIN
  -- Delete audio files older than 7 days
  DELETE FROM storage.objects 
  WHERE bucket_id = 'sos-audio' 
    AND created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- 8. Optional: Create a cron job to run cleanup daily (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-audio-files', '0 2 * * *', 'SELECT cleanup_old_audio_files();'); 