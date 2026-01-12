-- Migration: Add new client fields for PDF report
-- DOR Counselor info, Hourly Wage, and Vendor

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS dor_counselor_name TEXT,
ADD COLUMN IF NOT EXISTS dor_counselor_phone TEXT,
ADD COLUMN IF NOT EXISTS hourly_wage DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS vendor TEXT DEFAULT 'v-Enable Pathways';

-- Add comment for documentation
COMMENT ON COLUMN clients.dor_counselor_name IS 'DOR Department of Rehabilitation counselor name';
COMMENT ON COLUMN clients.dor_counselor_phone IS 'DOR counselor phone number';
COMMENT ON COLUMN clients.hourly_wage IS 'Client hourly wage for billing';
COMMENT ON COLUMN clients.vendor IS 'Vendor name for PDF reports';
