-- Add new columns to clients table for enhanced intake form
-- Run this in Supabase SQL Editor

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS client_goals TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS program_start_date DATE;

-- Add comments for documentation
COMMENT ON COLUMN clients.client_goals IS 'Client''s goals used by AI for report generation';
COMMENT ON COLUMN clients.emergency_contact_name IS 'Emergency contact name for safety features';
COMMENT ON COLUMN clients.emergency_contact_phone IS 'Emergency contact phone number';
COMMENT ON COLUMN clients.program_start_date IS 'Date when client started the program';
