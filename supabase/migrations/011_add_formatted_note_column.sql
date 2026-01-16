-- Add formatted_note column to entries table
-- This column stores the AI-formatted note WITH markdown markers (**headers**)

ALTER TABLE entries ADD COLUMN IF NOT EXISTS formatted_note TEXT;

-- Add formatted_summary column for the short summary
ALTER TABLE entries ADD COLUMN IF NOT EXISTS formatted_summary TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_entries_formatted_note ON entries(id) WHERE formatted_note IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN entries.formatted_note IS 'AI-formatted note with markdown headers (**Tasks & Productivity:** etc.)';
COMMENT ON COLUMN entries.formatted_summary IS 'Short 1-2 sentence AI-generated summary';
