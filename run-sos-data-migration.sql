-- Run this script in your Supabase SQL Editor to create the SOS data table
-- This will capture each SOS alert with audio file information

-- First, run the SOS data table schema
\i sos-data-table.sql

-- Verify the table was created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'sos_data' 
ORDER BY ordinal_position;

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'sos_data';

-- Test the table structure
SELECT 
  'SOS Data Table Created Successfully' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'sos_data') as table_exists,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'sos_data') as policies_count; 