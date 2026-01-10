-- Migration: Update terminology from 'worker' to 'coach' and add client relationships
-- Run this in Supabase SQL Editor AFTER the initial schema.sql

-- Step 1: Update enum type (requires recreation)
ALTER TYPE user_role RENAME TO user_role_old;
CREATE TYPE user_role AS ENUM ('coach', 'admin');

-- Update profiles table to use new enum
ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::text::user_role;
DROP TYPE user_role_old;

-- Step 2: Rename columns in shifts table
ALTER TABLE shifts RENAME COLUMN worker_id TO coach_id;

-- Step 3: Rename columns in entries table and add client_id
ALTER TABLE entries RENAME COLUMN worker_id TO coach_id;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE entries DROP COLUMN IF EXISTS client_name;

-- Step 4: Rename columns in reports table and add client_id
ALTER TABLE reports RENAME COLUMN worker_id TO coach_id;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- Step 5: Update indexes
DROP INDEX IF EXISTS idx_shifts_worker_id;
CREATE INDEX idx_shifts_coach_id ON shifts(coach_id);

DROP INDEX IF EXISTS idx_entries_worker_id;
CREATE INDEX idx_entries_coach_id ON entries(coach_id);
CREATE INDEX idx_entries_client_id ON entries(client_id);

DROP INDEX IF EXISTS idx_reports_worker_id;
CREATE INDEX idx_reports_coach_id ON reports(coach_id);
CREATE INDEX idx_reports_client_id ON reports(client_id);

-- Step 6: Update RLS policies
-- Drop old policies
DROP POLICY IF EXISTS "Workers can manage their own shifts" ON shifts;
DROP POLICY IF EXISTS "Workers can manage their own entries" ON entries;
DROP POLICY IF EXISTS "Workers can manage their own reports" ON reports;

-- Create new policies
CREATE POLICY "Coaches can manage their own shifts"
  ON shifts FOR ALL
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can manage their own entries"
  ON entries FOR ALL
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can manage their own reports"
  ON reports FOR ALL
  USING (auth.uid() = coach_id);

-- Note: Admin policies remain unchanged as they already work with any role
