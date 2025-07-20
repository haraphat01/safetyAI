-- Add WhatsApp support to emergency contacts
-- Run this in your Supabase SQL Editor

-- 1. Add whatsapp column to emergency_contacts table
ALTER TABLE public.emergency_contacts 
ADD COLUMN whatsapp TEXT;

-- 2. Add a comment to document the new field
COMMENT ON COLUMN public.emergency_contacts.whatsapp IS 'WhatsApp phone number for emergency notifications (optional)';

-- 3. Create an index for better performance when querying WhatsApp contacts
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_whatsapp 
ON public.emergency_contacts(whatsapp) 
WHERE whatsapp IS NOT NULL;

-- 4. Update RLS policies if needed (they should already cover the new column)
-- The existing RLS policies should automatically apply to the new whatsapp column

-- 5. Optional: Add a check constraint to ensure WhatsApp number format (basic validation)
-- ALTER TABLE public.emergency_contacts 
-- ADD CONSTRAINT check_whatsapp_format 
-- CHECK (whatsapp IS NULL OR whatsapp ~ '^\+?[1-9]\d{1,14}$');