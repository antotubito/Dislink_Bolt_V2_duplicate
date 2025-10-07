-- =====================================================
-- QR CONNECTION & INVITATION SYSTEM - DATABASE SETUP
-- =====================================================
-- This script sets up the database schema for the QR connection
-- and invitation system, ensuring proper RLS policies and data integrity

-- =====================================================
-- 1. ENSURE REQUIRED TABLES EXIST
-- =====================================================

-- Connection Codes Table (for QR codes)
CREATE TABLE IF NOT EXISTS connection_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ NOT NULL,
  scan_count INTEGER DEFAULT 0,
  last_scanned_at TIMESTAMPTZ,
  last_scan_location JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- QR Scan Tracking Table (with user isolation)
CREATE TABLE IF NOT EXISTS qr_scan_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id TEXT UNIQUE NOT NULL,
  code TEXT NOT NULL,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  location JSONB,
  device_info JSONB,
  referrer TEXT,
  session_id TEXT,
  user_id UUID REFERENCES auth.users(id), -- Owner of the QR code
  scanner_user_id UUID REFERENCES auth.users(id), -- Optional: authenticated scanner
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email Invitations Table
CREATE TABLE IF NOT EXISTS email_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invitation_id TEXT UNIQUE NOT NULL,
  recipient_email TEXT NOT NULL,
  sender_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_code TEXT NOT NULL,
  scan_data JSONB NOT NULL,
  email_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'registered', 'expired')),
  registered_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  registration_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Connection Requests Table (enhanced)
CREATE TABLE IF NOT EXISTS connection_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, requester_id)
);

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Connection Codes Indexes
CREATE INDEX IF NOT EXISTS idx_connection_codes_user_id ON connection_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_connection_codes_code ON connection_codes(code);
CREATE INDEX IF NOT EXISTS idx_connection_codes_active ON connection_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_connection_codes_expires_at ON connection_codes(expires_at);

-- QR Scan Tracking Indexes
CREATE INDEX IF NOT EXISTS idx_qr_scan_tracking_code ON qr_scan_tracking(code);
CREATE INDEX IF NOT EXISTS idx_qr_scan_tracking_user_id ON qr_scan_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_scan_tracking_scanner_user_id ON qr_scan_tracking(scanner_user_id);
CREATE INDEX IF NOT EXISTS idx_qr_scan_tracking_scanned_at ON qr_scan_tracking(scanned_at);
CREATE INDEX IF NOT EXISTS idx_qr_scan_tracking_session ON qr_scan_tracking(session_id);

-- Email Invitations Indexes
CREATE INDEX IF NOT EXISTS idx_email_invitations_invitation_id ON email_invitations(invitation_id);
CREATE INDEX IF NOT EXISTS idx_email_invitations_connection_code ON email_invitations(connection_code);
CREATE INDEX IF NOT EXISTS idx_email_invitations_recipient_email ON email_invitations(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_invitations_sender_user_id ON email_invitations(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_email_invitations_status ON email_invitations(status);
CREATE INDEX IF NOT EXISTS idx_email_invitations_expires_at ON email_invitations(expires_at);

-- Connection Requests Indexes
CREATE INDEX IF NOT EXISTS idx_connection_requests_user_id ON connection_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_requester_id ON connection_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_status ON connection_requests(status);
CREATE INDEX IF NOT EXISTS idx_connection_requests_created_at ON connection_requests(created_at);

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE connection_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_scan_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. CREATE RLS POLICIES
-- =====================================================

-- Connection Codes Policies
DROP POLICY IF EXISTS "Users can view their own connection codes" ON connection_codes;
CREATE POLICY "Users can view their own connection codes" ON connection_codes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own connection codes" ON connection_codes;
CREATE POLICY "Users can insert their own connection codes" ON connection_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own connection codes" ON connection_codes;
CREATE POLICY "Users can update their own connection codes" ON connection_codes
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own connection codes" ON connection_codes;
CREATE POLICY "Users can delete their own connection codes" ON connection_codes
  FOR DELETE USING (auth.uid() = user_id);

-- Allow anonymous users to read active connection codes (for validation)
DROP POLICY IF EXISTS "Anonymous users can read active connection codes" ON connection_codes;
CREATE POLICY "Anonymous users can read active connection codes" ON connection_codes
  FOR SELECT TO anon USING (is_active = true AND expires_at > NOW());

-- QR Scan Tracking Policies
DROP POLICY IF EXISTS "Users can view their own scan data" ON qr_scan_tracking;
CREATE POLICY "Users can view their own scan data" ON qr_scan_tracking
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert scan data for their codes" ON qr_scan_tracking;
CREATE POLICY "Users can insert scan data for their codes" ON qr_scan_tracking
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM connection_codes 
      WHERE connection_codes.code = qr_scan_tracking.code 
      AND connection_codes.user_id = auth.uid()
    )
  );

-- Allow anonymous users to insert scan data (for QR scanning)
DROP POLICY IF EXISTS "Anonymous users can insert scan data" ON qr_scan_tracking;
CREATE POLICY "Anonymous users can insert scan data" ON qr_scan_tracking
  FOR INSERT TO anon WITH CHECK (true);

-- Email Invitations Policies
DROP POLICY IF EXISTS "Users can view invitations they sent" ON email_invitations;
CREATE POLICY "Users can view invitations they sent" ON email_invitations
  FOR SELECT USING (auth.uid() = sender_user_id);

DROP POLICY IF EXISTS "Users can insert invitations they send" ON email_invitations;
CREATE POLICY "Users can insert invitations they send" ON email_invitations
  FOR INSERT WITH CHECK (auth.uid() = sender_user_id);

DROP POLICY IF EXISTS "Users can update invitations they sent" ON email_invitations;
CREATE POLICY "Users can update invitations they sent" ON email_invitations
  FOR UPDATE USING (auth.uid() = sender_user_id);

-- Allow anonymous users to read invitations for validation
DROP POLICY IF EXISTS "Anonymous users can read invitations for validation" ON email_invitations;
CREATE POLICY "Anonymous users can read invitations for validation" ON email_invitations
  FOR SELECT TO anon USING (true);

-- Connection Requests Policies
DROP POLICY IF EXISTS "Users can view their connection requests" ON connection_requests;
CREATE POLICY "Users can view their connection requests" ON connection_requests
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users can insert connection requests" ON connection_requests;
CREATE POLICY "Users can insert connection requests" ON connection_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users can update their connection requests" ON connection_requests;
CREATE POLICY "Users can update their connection requests" ON connection_requests
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users can delete their connection requests" ON connection_requests;
CREATE POLICY "Users can delete their connection requests" ON connection_requests
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = requester_id);

-- =====================================================
-- 5. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to clean up expired connection codes
CREATE OR REPLACE FUNCTION cleanup_expired_connection_codes()
RETURNS void AS $$
BEGIN
  UPDATE connection_codes 
  SET is_active = false 
  WHERE expires_at < NOW() AND is_active = true;
  
  UPDATE email_invitations 
  SET status = 'expired' 
  WHERE expires_at < NOW() AND status = 'sent';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get QR scan statistics for a user
CREATE OR REPLACE FUNCTION get_user_qr_stats(user_uuid UUID)
RETURNS TABLE(
  total_scans BIGINT,
  recent_scans BIGINT,
  last_scan_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_scans,
    COUNT(CASE WHEN qst.scanned_at > NOW() - INTERVAL '7 days' THEN 1 END) as recent_scans,
    MAX(qst.scanned_at) as last_scan_date
  FROM qr_scan_tracking qst
  WHERE qst.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at columns
DROP TRIGGER IF EXISTS update_connection_codes_updated_at ON connection_codes;
CREATE TRIGGER update_connection_codes_updated_at
  BEFORE UPDATE ON connection_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_invitations_updated_at ON email_invitations;
CREATE TRIGGER update_email_invitations_updated_at
  BEFORE UPDATE ON email_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_connection_requests_updated_at ON connection_requests;
CREATE TRIGGER update_connection_requests_updated_at
  BEFORE UPDATE ON connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. CREATE VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for user's QR code statistics
CREATE OR REPLACE VIEW user_qr_statistics AS
SELECT 
  cc.user_id,
  cc.code,
  cc.is_active,
  cc.scan_count,
  cc.last_scanned_at,
  COUNT(qst.id) as total_scans,
  MAX(qst.scanned_at) as most_recent_scan
FROM connection_codes cc
LEFT JOIN qr_scan_tracking qst ON cc.code = qst.code
WHERE cc.user_id = auth.uid()
GROUP BY cc.user_id, cc.code, cc.is_active, cc.scan_count, cc.last_scanned_at;

-- View for pending invitations
CREATE OR REPLACE VIEW user_pending_invitations AS
SELECT 
  ei.invitation_id,
  ei.recipient_email,
  ei.connection_code,
  ei.status,
  ei.expires_at,
  ei.created_at,
  p.first_name as sender_first_name,
  p.last_name as sender_last_name
FROM email_invitations ei
JOIN profiles p ON ei.sender_user_id = p.id
WHERE ei.sender_user_id = auth.uid()
  AND ei.status = 'sent'
  AND ei.expires_at > NOW();

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON connection_codes TO authenticated;
GRANT SELECT, INSERT ON qr_scan_tracking TO authenticated;
GRANT SELECT, INSERT, UPDATE ON email_invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON connection_requests TO authenticated;

-- Grant permissions to anonymous users (for QR scanning)
GRANT SELECT ON connection_codes TO anon;
GRANT INSERT ON qr_scan_tracking TO anon;
GRANT SELECT ON email_invitations TO anon;

-- Grant permissions on views
GRANT SELECT ON user_qr_statistics TO authenticated;
GRANT SELECT ON user_pending_invitations TO authenticated;

-- =====================================================
-- 9. VERIFICATION QUERIES
-- =====================================================

-- Verify table structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('connection_codes', 'qr_scan_tracking', 'email_invitations', 'connection_requests')
ORDER BY table_name, ordinal_position;

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('connection_codes', 'qr_scan_tracking', 'email_invitations', 'connection_requests');

-- Verify indexes exist
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE tablename IN ('connection_codes', 'qr_scan_tracking', 'email_invitations', 'connection_requests')
ORDER BY tablename, indexname;

-- =====================================================
-- 10. SAMPLE DATA (FOR TESTING)
-- =====================================================

-- Note: This section is commented out for production
-- Uncomment for testing purposes only

/*
-- Insert sample connection code (replace with actual user ID)
INSERT INTO connection_codes (user_id, code, expires_at)
VALUES (
  '00000000-0000-0000-0000-000000000000', -- Replace with actual user ID
  'conn_test_1234567890_abcdef',
  NOW() + INTERVAL '30 days'
);

-- Insert sample QR scan tracking
INSERT INTO qr_scan_tracking (scan_id, code, user_id, location, device_info)
VALUES (
  'scan_test_1234567890_abcdef',
  'conn_test_1234567890_abcdef',
  '00000000-0000-0000-0000-000000000000', -- Replace with actual user ID
  '{"latitude": 37.7749, "longitude": -122.4194, "name": "San Francisco"}',
  '{"user_agent": "Mozilla/5.0...", "platform": "MacIntel"}'
);
*/

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ QR Connection & Invitation System database setup completed successfully!';
  RAISE NOTICE '📊 Tables created: connection_codes, qr_scan_tracking, email_invitations, connection_requests';
  RAISE NOTICE '🔒 RLS policies enabled and configured';
  RAISE NOTICE '📈 Indexes created for optimal performance';
  RAISE NOTICE '🔧 Helper functions and triggers installed';
  RAISE NOTICE '👁️ Views created for common queries';
  RAISE NOTICE '🎯 Ready for QR connection and invitation system!';
END $$;
