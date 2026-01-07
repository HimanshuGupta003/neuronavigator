-- NeuroNavigator Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User roles enum
CREATE TYPE user_role AS ENUM ('worker', 'admin');

-- Site/Mood status enum
CREATE TYPE site_status AS ENUM ('green', 'yellow', 'red');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'worker' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Invitations table for admin-led onboarding
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES profiles(id),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Shifts table (clock-in/out with GPS)
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  clock_in_at TIMESTAMPTZ NOT NULL,
  clock_in_lat DECIMAL(10, 8),
  clock_in_lng DECIMAL(11, 8),
  clock_out_at TIMESTAMPTZ,
  clock_out_lat DECIMAL(10, 8),
  clock_out_lng DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Entries/Notes table (voice logs)
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES shifts(id),
  status site_status NOT NULL,
  audio_url TEXT,
  raw_transcript TEXT,
  processed_text TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  gps_lat DECIMAL(10, 8),
  gps_lng DECIMAL(11, 8),
  client_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Reports table (generated PDFs)
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES entries(id) ON DELETE SET NULL,
  worker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pdf_url TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ===========================================
-- Row Level Security (RLS) Policies
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Invitations policies (admins only for CRUD, anyone can read for verification)
CREATE POLICY "Anyone can read invitations by token"
  ON invitations FOR SELECT
  USING (true);

CREATE POLICY "Admins can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update invitations"
  ON invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anyone can update invitations (for marking as used)"
  ON invitations FOR UPDATE
  USING (true);

-- Shifts policies
CREATE POLICY "Workers can manage their own shifts"
  ON shifts FOR ALL
  USING (auth.uid() = worker_id);

CREATE POLICY "Admins can view all shifts"
  ON shifts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Entries policies
CREATE POLICY "Workers can manage their own entries"
  ON entries FOR ALL
  USING (auth.uid() = worker_id);

CREATE POLICY "Admins can view all entries"
  ON entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Reports policies
CREATE POLICY "Workers can manage their own reports"
  ON reports FOR ALL
  USING (auth.uid() = worker_id);

CREATE POLICY "Admins can view all reports"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ===========================================
-- Indexes for performance
-- ===========================================
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_shifts_worker_id ON shifts(worker_id);
CREATE INDEX idx_shifts_clock_in ON shifts(clock_in_at);
CREATE INDEX idx_entries_worker_id ON entries(worker_id);
CREATE INDEX idx_entries_created_at ON entries(created_at);
CREATE INDEX idx_reports_worker_id ON reports(worker_id);

-- ===========================================
-- Functions and Triggers
-- ===========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- Initial Admin User Setup (IMPORTANT!)
-- ===========================================
-- After your first user signs up via Supabase Auth,
-- run this to make them an admin:
--
-- UPDATE profiles 
-- SET role = 'admin' 
-- WHERE email = 'your-admin-email@example.com';
