-- Fix emergency contacts table schema
-- Run this in your Supabase SQL Editor

-- Step 1: Check current table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'emergency_contacts' 
AND table_schema = 'public';




-- Step 2: Ensure the table exists with correct structure
-- If the table doesn't exist or has issues, recreate it
DROP TABLE IF EXISTS public.emergency_contacts CASCADE;

CREATE TABLE public.emergency_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    relationship TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Add constraints for data validation
ALTER TABLE public.emergency_contacts 
ADD CONSTRAINT check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE public.emergency_contacts 
ADD CONSTRAINT check_whatsapp_format 
CHECK (whatsapp ~ '^\+[1-9][0-9]{1,14}$');

-- Step 4: Create indexes for better performance
CREATE INDEX idx_emergency_contacts_user_id ON public.emergency_contacts(user_id);
CREATE INDEX idx_emergency_contacts_email ON public.emergency_contacts(email);
CREATE INDEX idx_emergency_contacts_whatsapp ON public.emergency_contacts(whatsapp);

-- Step 5: Set up Row Level Security (RLS)
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Policy for users to manage their own contacts
CREATE POLICY "Users can manage their own emergency contacts" ON public.emergency_contacts
    FOR ALL USING (auth.uid() = user_id);

-- Step 6: Add comments
COMMENT ON TABLE public.emergency_contacts IS 'Emergency contacts for users';
COMMENT ON COLUMN public.emergency_contacts.email IS 'Email address for emergency notifications (required)';
COMMENT ON COLUMN public.emergency_contacts.whatsapp IS 'WhatsApp phone number with country code (required, format: +1234567890)';

-- Step 7: Grant necessary permissions
GRANT ALL ON public.emergency_contacts TO authenticated;
GRANT ALL ON public.emergency_contacts TO service_role;