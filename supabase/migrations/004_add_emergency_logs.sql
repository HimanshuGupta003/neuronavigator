-- Emergency Logs Table - For tracking SOS alerts
-- Run this in Supabase SQL Editor
-- Created: 2026-01-11

-- Create the emergency_logs table
CREATE TABLE IF NOT EXISTS emergency_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    coach_name TEXT,
    coach_email TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    message_sent BOOLEAN DEFAULT false,
    twilio_message_id TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE emergency_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all emergency logs
CREATE POLICY "Admins can view all emergency logs"
ON emergency_logs FOR SELECT TO authenticated
USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

-- Policy: Coaches can view their own emergency logs
CREATE POLICY "Coaches can view own emergency logs"
ON emergency_logs FOR SELECT TO authenticated
USING (coach_id = auth.uid());

-- Policy: Authenticated users can insert
CREATE POLICY "Authenticated users can create emergency logs"
ON emergency_logs FOR INSERT TO authenticated
WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX idx_emergency_logs_coach_id ON emergency_logs(coach_id);
CREATE INDEX idx_emergency_logs_created_at ON emergency_logs(created_at DESC);
