-- Add invited_name column to invitations table
-- This allows admin to specify the coach's expected name during invitation

ALTER TABLE invitations ADD COLUMN IF NOT EXISTS invited_name TEXT;

-- Add a comment for clarity
COMMENT ON COLUMN invitations.invited_name IS 'Optional name for the invited coach, pre-fills profile on signup';
