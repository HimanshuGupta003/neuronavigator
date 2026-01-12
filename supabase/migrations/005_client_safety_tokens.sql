-- Migration: Add client safety tokens table for public SOS links
-- Created: 2026-01-12

-- Client Safety Tokens table
-- Stores non-expiring tokens for client-side SOS access
CREATE TABLE IF NOT EXISTS client_safety_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    created_by UUID NOT NULL REFERENCES profiles(id),
    revoked_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_client_safety_tokens_token ON client_safety_tokens(token);
CREATE INDEX IF NOT EXISTS idx_client_safety_tokens_client_id ON client_safety_tokens(client_id);

-- Enable RLS
ALTER TABLE client_safety_tokens ENABLE ROW LEVEL SECURITY;

-- Coaches can manage tokens for their clients
CREATE POLICY "Coaches can view their client tokens"
    ON client_safety_tokens FOR SELECT
    USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = client_safety_tokens.client_id 
            AND clients.coach_id = auth.uid()
        )
    );

CREATE POLICY "Coaches can create tokens for their clients"
    ON client_safety_tokens FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = client_safety_tokens.client_id 
            AND clients.coach_id = auth.uid()
        )
    );

CREATE POLICY "Coaches can update their client tokens"
    ON client_safety_tokens FOR UPDATE
    USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = client_safety_tokens.client_id 
            AND clients.coach_id = auth.uid()
        )
    );
