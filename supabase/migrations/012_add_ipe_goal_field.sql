-- Add IPE Goal field to clients table
-- This field stores the Individual Plan for Employment (IPE) goal from DOR

ALTER TABLE clients ADD COLUMN IF NOT EXISTS ipe_goal TEXT;

-- Comment for documentation
COMMENT ON COLUMN clients.ipe_goal IS 'Individual Plan for Employment (IPE) goal from Department of Rehabilitation';
