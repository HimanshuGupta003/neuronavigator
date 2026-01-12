-- Migration: Add all DR384 client fields for PDF report
-- Based on official DR384 form template

-- Core fields we already added
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS dor_counselor_name TEXT,
ADD COLUMN IF NOT EXISTS dor_counselor_phone TEXT,
ADD COLUMN IF NOT EXISTS hourly_wage DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS vendor TEXT DEFAULT 'v-Enable Pathways';

-- Additional DR384 fields from official form
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS birthdate DATE,
ADD COLUMN IF NOT EXISTS dor_district TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS placement_type TEXT DEFAULT 'Individual', -- 'Individual' or 'Group'
ADD COLUMN IF NOT EXISTS work_schedule TEXT, -- e.g., "Mon-Fri 9am-5pm" or JSON
ADD COLUMN IF NOT EXISTS hours_authorized DECIMAL(10,2), -- Total authorized hours per month
ADD COLUMN IF NOT EXISTS se_service_provider TEXT; -- SE = Supported Employment

-- Comments for documentation
COMMENT ON COLUMN clients.dor_counselor_name IS 'DOR Department of Rehabilitation counselor name';
COMMENT ON COLUMN clients.dor_counselor_phone IS 'DOR counselor phone number';
COMMENT ON COLUMN clients.hourly_wage IS 'Client hourly wage for billing';
COMMENT ON COLUMN clients.vendor IS 'Vendor name for PDF reports';
COMMENT ON COLUMN clients.birthdate IS 'Client date of birth';
COMMENT ON COLUMN clients.dor_district IS 'DOR district office';
COMMENT ON COLUMN clients.job_title IS 'Client job title at worksite';
COMMENT ON COLUMN clients.placement_type IS 'Individual Placement (IP) or Group Placement (GP)';
COMMENT ON COLUMN clients.work_schedule IS 'Weekly work schedule';
COMMENT ON COLUMN clients.hours_authorized IS 'Total authorized coaching hours per month';
COMMENT ON COLUMN clients.se_service_provider IS 'Supported Employment service provider';
