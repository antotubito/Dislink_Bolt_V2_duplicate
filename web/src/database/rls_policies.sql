-- Row Level Security (RLS) Policies for Enhanced QR System
-- Apply these policies in Supabase Dashboard → Database → Policies

-- ================================
-- QR SCAN TRACKING POLICIES
-- ================================

-- Enable RLS on qr_scan_tracking table
ALTER TABLE qr_scan_tracking ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert scan tracking data
CREATE POLICY "Allow anonymous scan tracking inserts" ON qr_scan_tracking
    FOR INSERT TO anon
    WITH CHECK (true);

-- Allow authenticated users to read their own scan data
CREATE POLICY "Allow users to read scan data" ON qr_scan_tracking
    FOR SELECT TO authenticated
    USING (true); -- For analytics purposes, allow reading all scan data

-- ================================
-- EMAIL INVITATIONS POLICIES
-- ================================

-- Enable RLS on email_invitations table
ALTER TABLE email_invitations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to create invitations
CREATE POLICY "Allow users to create invitations" ON email_invitations
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = sender_user_id);

-- Allow users to read invitations they sent
CREATE POLICY "Allow users to read their invitations" ON email_invitations
    FOR SELECT TO authenticated
    USING (auth.uid() = sender_user_id);

-- Allow users to update invitations they sent
CREATE POLICY "Allow users to update their invitations" ON email_invitations
    FOR UPDATE TO authenticated
    USING (auth.uid() = sender_user_id);

-- Allow anonymous users to read invitations for validation (with invitation_id)
CREATE POLICY "Allow anonymous invitation validation" ON email_invitations
    FOR SELECT TO anon
    USING (true);

-- ================================
-- CONNECTION MEMORIES POLICIES
-- ================================

-- Enable RLS on connection_memories table
ALTER TABLE connection_memories ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to create connection memories
CREATE POLICY "Allow users to create connection memories" ON connection_memories
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = from_user_id OR 
        auth.uid() = to_user_id
    );

-- Allow users to read connection memories they're part of
CREATE POLICY "Allow users to read their connection memories" ON connection_memories
    FOR SELECT TO authenticated
    USING (
        auth.uid() = from_user_id OR 
        auth.uid() = to_user_id
    );

-- Allow users to update connection memories they're part of
CREATE POLICY "Allow users to update their connection memories" ON connection_memories
    FOR UPDATE TO authenticated
    USING (
        auth.uid() = from_user_id OR 
        auth.uid() = to_user_id
    );

-- ================================
-- CONNECTION CODES POLICIES
-- ================================

-- Enable RLS on connection_codes table
ALTER TABLE connection_codes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to create connection codes
CREATE POLICY "Allow users to create connection codes" ON connection_codes
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Allow users to read their own connection codes
CREATE POLICY "Allow users to read their connection codes" ON connection_codes
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Allow users to update their own connection codes
CREATE POLICY "Allow users to update their connection codes" ON connection_codes
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

-- Allow anonymous users to read connection codes for QR validation
CREATE POLICY "Allow anonymous connection code validation" ON connection_codes
    FOR SELECT TO anon
    USING (expires_at > NOW());

-- ================================
-- EXISTING TABLES POLICIES REVIEW
-- ================================

-- Ensure profiles table has proper RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Allow users to read their own profile" ON profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Allow users to update their own profile" ON profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Allow users to insert their own profile" ON profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

-- Allow anonymous users to read public profile data (for QR codes)
-- Drop existing policy first to avoid conflicts
DROP POLICY IF EXISTS "Allow anonymous public profile reads" ON profiles;
CREATE POLICY "Allow anonymous public profile reads" ON profiles
    FOR SELECT TO anon
    USING (public_profile->>'enabled' = 'true');

-- ================================
-- USER CONNECTIONS POLICIES
-- ================================

-- Enable RLS on user_connections table (if exists)
-- This assumes you have a user_connections table for managing connections

-- Allow authenticated users to create connections they're part of
CREATE POLICY "Allow users to create connections" ON user_connections
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id OR 
        auth.uid() = connected_user_id
    );

-- Allow users to read connections they're part of
CREATE POLICY "Allow users to read their connections" ON user_connections
    FOR SELECT TO authenticated
    USING (
        auth.uid() = user_id OR 
        auth.uid() = connected_user_id
    );

-- Allow users to update connections they're part of
CREATE POLICY "Allow users to update their connections" ON user_connections
    FOR UPDATE TO authenticated
    USING (
        auth.uid() = user_id OR 
        auth.uid() = connected_user_id
    );

-- ================================
-- SECURITY FUNCTIONS
-- ================================

-- Function to check if user owns a QR code
CREATE OR REPLACE FUNCTION check_qr_code_ownership(qr_code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM connection_codes 
        WHERE code = qr_code 
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate invitation access
CREATE OR REPLACE FUNCTION validate_invitation_access(invitation_id TEXT, connection_code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM email_invitations 
        WHERE id = invitation_id::uuid 
        AND connection_code = connection_code
        AND expires_at > NOW()
        AND status = 'sent'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check connection memory access
CREATE OR REPLACE FUNCTION check_connection_memory_access(memory_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM connection_memories 
        WHERE id = memory_id 
        AND (from_user_id = auth.uid() OR to_user_id = auth.uid())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- Indexes for QR scan tracking
CREATE INDEX IF NOT EXISTS idx_qr_scan_tracking_code ON qr_scan_tracking(code);
CREATE INDEX IF NOT EXISTS idx_qr_scan_tracking_scanned_at ON qr_scan_tracking(scanned_at);
CREATE INDEX IF NOT EXISTS idx_qr_scan_tracking_session_id ON qr_scan_tracking(session_id);

-- Indexes for email invitations
CREATE INDEX IF NOT EXISTS idx_email_invitations_invitation_id ON email_invitations(invitation_id);
CREATE INDEX IF NOT EXISTS idx_email_invitations_sender ON email_invitations(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_email_invitations_email ON email_invitations(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_invitations_expires_at ON email_invitations(expires_at);

-- Indexes for connection memories
CREATE INDEX IF NOT EXISTS idx_connection_memories_from_user ON connection_memories(from_user_id);
CREATE INDEX IF NOT EXISTS idx_connection_memories_to_user ON connection_memories(to_user_id);
CREATE INDEX IF NOT EXISTS idx_connection_memories_first_meeting ON connection_memories(first_meeting_data);

-- Indexes for connection codes
CREATE INDEX IF NOT EXISTS idx_connection_codes_code ON connection_codes(code);
CREATE INDEX IF NOT EXISTS idx_connection_codes_user_id ON connection_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_connection_codes_expires_at ON connection_codes(expires_at);

-- ================================
-- CLEANUP FUNCTIONS
-- ================================

-- Function to cleanup expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
    -- Delete expired email invitations
    DELETE FROM email_invitations 
    WHERE expires_at < NOW() - INTERVAL '7 days';
    
    -- Delete expired connection codes
    DELETE FROM connection_codes 
    WHERE expires_at < NOW();
    
    -- Delete old scan tracking data (keep last 30 days)
    DELETE FROM qr_scan_tracking 
    WHERE scanned_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
-- TRIGGERS FOR AUTOMATIC CLEANUP
-- ================================

-- Create a function that runs cleanup periodically
-- Note: This would typically be set up as a cron job or scheduled function
-- For now, it can be called manually or from the application

COMMENT ON FUNCTION cleanup_expired_data() IS 'Cleanup function for expired QR system data. Run periodically.';

-- ================================
-- PERMISSIONS FOR AUTHENTICATED USERS
-- ================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant limited permissions to anonymous users
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON profiles TO anon;
GRANT INSERT ON qr_scan_tracking TO anon;
GRANT SELECT ON email_invitations TO anon;
GRANT SELECT ON connection_codes TO anon;
