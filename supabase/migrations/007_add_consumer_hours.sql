-- Migration: Add consumer hours to entries table
-- Required for DR384 PDF report section

ALTER TABLE entries 
ADD COLUMN IF NOT EXISTS consumer_hours DECIMAL(5,2);

-- Add comment for documentation
COMMENT ON COLUMN entries.consumer_hours IS 'Hours the consumer/client worked that day (not coaching hours)';
