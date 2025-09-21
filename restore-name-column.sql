-- Restore the name column to emergency_contacts table
-- Run this in your Supabase SQL Editor

-- Add the name column back
ALTER TABLE public.emergency_contacts 
ADD COLUMN name TEXT NOT NULL DEFAULT 'Unknown';

-- Remove the default after adding the column
ALTER TABLE public.emergency_contacts 
ALTER COLUMN name DROP DEFAULT;

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'emergency_contacts' 
AND table_schema = 'public'
ORDER BY ordinal_position;