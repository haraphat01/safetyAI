-- Remove phone field and update emergency contacts table
-- Run this in your Supabase SQL Editor

-- IMPORTANT: This migration will delete existing contacts that don't have both email and whatsapp
-- Make sure to backup your data or migrate existing contacts first if needed

-- 1. First, let's see what we're working with
-- SELECT id, name, phone, email, whatsapp FROM public.emergency_contacts;

-- 2. Delete contacts that don't have both email and whatsapp (since we're making them required)
-- You may want to manually update these contacts first instead of deleting them
DELETE FROM public.emergency_contacts 
WHERE email IS NULL OR email = '' OR whatsapp IS NULL OR whatsapp = '';

-- 3. Make email and whatsapp columns required
ALTER TABLE public.emergency_contacts 
ALTER COLUMN email SET NOT NULL;

ALTER TABLE public.emergency_contacts 
ALTER COLUMN whatsapp SET NOT NULL;

-- 4. Add constraints to ensure proper formatting
ALTER TABLE public.emergency_contacts 
ADD CONSTRAINT check_email_format 
CHECK (email ~ '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$');

ALTER TABLE public.emergency_contacts 
ADD CONSTRAINT check_whatsapp_format 
CHECK (whatsapp ~ '^\\+[1-9]\\d{1,14}$');

-- 5. Remove the phone column
ALTER TABLE public.emergency_contacts 
DROP COLUMN IF EXISTS phone;

-- 6. Update comments to reflect the changes
COMMENT ON COLUMN public.emergency_contacts.email IS 'Email address for emergency notifications (required)';
COMMENT ON COLUMN public.emergency_contacts.whatsapp IS 'WhatsApp phone number with country code for emergency notifications (required, format: +1234567890)';

-- 7. Update the index for WhatsApp contacts (remove the WHERE clause since it's now required)
DROP INDEX IF EXISTS idx_emergency_contacts_whatsapp;
CREATE INDEX idx_emergency_contacts_whatsapp 
ON public.emergency_contacts(whatsapp);

-- 8. Create an index for email as well for better performance
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_email 
ON public.emergency_contacts(email);