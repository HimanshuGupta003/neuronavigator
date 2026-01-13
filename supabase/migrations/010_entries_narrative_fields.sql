-- Migration 010: Add narrative fields and system data to entries
-- For PDF report narrative sections and better dashboard display

-- Add client_id FK (replace client_name string with proper FK)
ALTER TABLE entries ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);

-- Add narrative fields for PDF report sections (Srini's 4 headers)
ALTER TABLE entries ADD COLUMN IF NOT EXISTS tasks TEXT;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS barriers TEXT;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS interventions TEXT;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS progress TEXT;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS formatted_summary TEXT;

-- Add system/audit fields
ALTER TABLE entries ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS entry_status TEXT DEFAULT 'submitted';
ALTER TABLE entries ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'voice';
ALTER TABLE entries ADD COLUMN IF NOT EXISTS location_string TEXT;

-- Add mood column (was in types but missing from schema)
ALTER TABLE entries ADD COLUMN IF NOT EXISTS mood TEXT DEFAULT 'neutral';

-- Add comments for clarity
COMMENT ON COLUMN entries.client_id IS 'FK to clients table - the consumer this entry is about';
COMMENT ON COLUMN entries.tasks IS 'AI extracted: Tasks & Productivity section for PDF';
COMMENT ON COLUMN entries.barriers IS 'AI extracted: Barriers & Behaviors section for PDF';
COMMENT ON COLUMN entries.interventions IS 'AI extracted: Interventions section for PDF';
COMMENT ON COLUMN entries.progress IS 'AI extracted: Progress on Goals section for PDF';
COMMENT ON COLUMN entries.formatted_summary IS 'Clean formatted summary for dashboard display';
COMMENT ON COLUMN entries.duration_seconds IS 'Audio recording duration in seconds';
COMMENT ON COLUMN entries.entry_status IS 'Entry status: draft, submitted, saved';
COMMENT ON COLUMN entries.source IS 'How entry was created: voice, manual, upload';
COMMENT ON COLUMN entries.location_string IS 'Human-readable location from reverse geocode';
