-- Add missing fields for PDF report header and form enhancements
-- Job Site = Specific work location (may differ from Employer)
-- DOR Counselor Email = For contact
-- Emergency Contact Relationship = Parent, Sibling, Friend, etc.

ALTER TABLE clients ADD COLUMN IF NOT EXISTS job_site TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS dor_counselor_email TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT;

-- Add comments
COMMENT ON COLUMN clients.job_site IS 'Specific work location (may differ from employer)';
COMMENT ON COLUMN clients.dor_counselor_email IS 'DOR Counselor email address';
COMMENT ON COLUMN clients.emergency_contact_relationship IS 'Relationship to client (Parent, Sibling, Friend, etc.)';
