-- Enhanced QR Code System Database Migration
-- This migration adds comprehensive tracking and connection memory features

-- 1. QR Scan Tracking Table
CREATE TABLE IF NOT EXISTS qr_scan_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id TEXT UNIQUE NOT NULL,
  code TEXT NOT NULL,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  location JSONB,
  device_info JSONB,
  referrer TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Email Invitations Table
CREATE TABLE IF NOT EXISTS email_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invitation_id TEXT UNIQUE NOT NULL,
  recipient_email TEXT NOT NULL,
  sender_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  connection_code TEXT NOT NULL,
  scan_data JSONB NOT NULL,
  email_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'registered', 'expired')),
  registered_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  registration_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Connection Memories Table
CREATE TABLE IF NOT EXISTS connection_memories (
  id TEXT PRIMARY KEY,
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Can be NULL for pending connections
  first_meeting_data JSONB NOT NULL,
  connection_status TEXT NOT NULL DEFAULT 'pending' CHECK (connection_status IN ('pending', 'connected', 'declined')),
  email_invitation_sent TIMESTAMPTZ,
  registration_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Enhanced Connection Codes Table (add new columns to existing table)
ALTER TABLE connection_codes 
ADD COLUMN IF NOT EXISTS scan_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_scanned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_scan_location JSONB;

-- 5. Enhanced Contacts Table (add first meeting context)
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS first_met_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS first_met_location JSONB,
ADD COLUMN IF NOT EXISTS connection_method TEXT DEFAULT 'manual';

-- 6. Enhanced Connection Requests Table (add metadata)
ALTER TABLE connection_requests 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- 7. Notifications Table (if not exists)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_qr_scan_tracking_code ON qr_scan_tracking(code);
CREATE INDEX IF NOT EXISTS idx_qr_scan_tracking_session ON qr_scan_tracking(session_id);
CREATE INDEX IF NOT EXISTS idx_qr_scan_tracking_scanned_at ON qr_scan_tracking(scanned_at);

CREATE INDEX IF NOT EXISTS idx_email_invitations_invitation_id ON email_invitations(invitation_id);
CREATE INDEX IF NOT EXISTS idx_email_invitations_connection_code ON email_invitations(connection_code);
CREATE INDEX IF NOT EXISTS idx_email_invitations_recipient_email ON email_invitations(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_invitations_sender_user_id ON email_invitations(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_email_invitations_status ON email_invitations(status);

CREATE INDEX IF NOT EXISTS idx_connection_memories_from_user_id ON connection_memories(from_user_id);
CREATE INDEX IF NOT EXISTS idx_connection_memories_to_user_id ON connection_memories(to_user_id);
CREATE INDEX IF NOT EXISTS idx_connection_memories_status ON connection_memories(connection_status);

CREATE INDEX IF NOT EXISTS idx_connection_codes_last_scanned_at ON connection_codes(last_scanned_at);
CREATE INDEX IF NOT EXISTS idx_contacts_first_met_at ON contacts(first_met_at);
CREATE INDEX IF NOT EXISTS idx_contacts_connection_method ON contacts(connection_method);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Row Level Security (RLS) Policies
ALTER TABLE qr_scan_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- QR Scan Tracking Policies
CREATE POLICY "Users can view their own QR scans" ON qr_scan_tracking
  FOR SELECT USING (true); -- Allow reading for analytics

CREATE POLICY "System can insert QR scan data" ON qr_scan_tracking
  FOR INSERT WITH CHECK (true); -- Allow system to track scans

-- Email Invitations Policies
CREATE POLICY "Users can view their sent invitations" ON email_invitations
  FOR SELECT USING (sender_user_id = auth.uid());

CREATE POLICY "Users can view invitations sent to them" ON email_invitations
  FOR SELECT USING (registered_user_id = auth.uid());

CREATE POLICY "System can manage invitations" ON email_invitations
  FOR ALL USING (true); -- Allow system to manage invitations

-- Connection Memories Policies
CREATE POLICY "Users can view their connection memories" ON connection_memories
  FOR SELECT USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "System can manage connection memories" ON connection_memories
  FOR ALL USING (true); -- Allow system to manage memories

-- Notifications Policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Functions for automated tasks
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
DROP TRIGGER IF EXISTS update_email_invitations_updated_at ON email_invitations;
CREATE TRIGGER update_email_invitations_updated_at
  BEFORE UPDATE ON email_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_connection_memories_updated_at ON connection_memories;
CREATE TRIGGER update_connection_memories_updated_at
  BEFORE UPDATE ON connection_memories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE email_invitations 
  SET status = 'expired' 
  WHERE expires_at < NOW() AND status = 'sent';
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE qr_scan_tracking IS 'Tracks every QR code scan with location and device information';
COMMENT ON TABLE email_invitations IS 'Manages email invitations sent from public profiles';
COMMENT ON TABLE connection_memories IS 'Stores first meeting context and connection history';

COMMENT ON COLUMN qr_scan_tracking.scan_id IS 'Unique identifier for each scan event';
COMMENT ON COLUMN qr_scan_tracking.location IS 'GPS coordinates and geocoded address information';
COMMENT ON COLUMN qr_scan_tracking.device_info IS 'User agent, platform, and device details';

COMMENT ON COLUMN email_invitations.scan_data IS 'Complete scan tracking data when invitation was sent';
COMMENT ON COLUMN email_invitations.connection_code IS 'Unique code to connect users during registration';

COMMENT ON COLUMN connection_memories.first_meeting_data IS 'Location, time, and context of first meeting';
COMMENT ON COLUMN connection_memories.connection_status IS 'Current status of the connection';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
