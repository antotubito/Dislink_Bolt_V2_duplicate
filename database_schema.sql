-- ===============================================
-- DISLINK QR CODE & CONNECTIONS DATABASE SCHEMA
-- ===============================================
-- Run this in your Supabase SQL Editor

-- 1. CONNECTION CODES TABLE
-- Stores unique QR codes for each user
CREATE TABLE IF NOT EXISTS connection_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'base64'),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  scanned_at TIMESTAMPTZ,
  location JSONB,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast code lookups
CREATE INDEX IF NOT EXISTS idx_connection_codes_code ON connection_codes(code);
CREATE INDEX IF NOT EXISTS idx_connection_codes_user_id ON connection_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_connection_codes_status ON connection_codes(status);

-- 2. CONNECTION REQUESTS TABLE
-- Stores pending connection requests from QR scans
CREATE TABLE IF NOT EXISTS connection_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Target user
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Who scanned
  code_id UUID REFERENCES connection_codes(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  location JSONB,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent duplicate requests
CREATE UNIQUE INDEX IF NOT EXISTS idx_connection_requests_unique 
ON connection_requests(user_id, requester_id) 
WHERE status = 'pending';

-- 3. WAITLIST TABLE  
-- Store waitlist emails in Supabase instead of Google Sheets
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'website', -- 'website', 'qr', 'referral'
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  ip_address INET,
  user_agent TEXT,
  location JSONB,
  subscribed BOOLEAN DEFAULT true,
  confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at);

-- 4. QR SCAN ANALYTICS TABLE
-- Track QR code scan events for analytics
CREATE TABLE IF NOT EXISTS qr_scan_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code_id UUID REFERENCES connection_codes(id) ON DELETE SET NULL,
  scanner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scan_location JSONB,
  scan_method TEXT DEFAULT 'camera', -- 'camera', 'upload', 'manual'
  device_info JSONB,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. NOTIFICATIONS TABLE
-- Real-time notifications for connections
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'connection_request', 'connection_accepted', 'profile_update'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Additional data like user IDs, etc.
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- ===============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===============================================

-- Enable RLS on all tables
ALTER TABLE connection_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_scan_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Connection Codes Policies
CREATE POLICY "Users can view their own connection codes" ON connection_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own connection codes" ON connection_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connection codes" ON connection_codes
  FOR UPDATE USING (auth.uid() = user_id);

-- Connection Requests Policies  
CREATE POLICY "Users can view requests involving them" ON connection_requests
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = requester_id);

CREATE POLICY "Users can create connection requests" ON connection_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update requests to them" ON connection_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- Waitlist Policies - Allow public signups but restrict viewing
DROP POLICY IF EXISTS "Only authenticated users can view waitlist" ON waitlist;

-- Allow anyone to submit emails to the waitlist (public signups)
CREATE POLICY "Allow public waitlist signups" ON waitlist
  FOR INSERT WITH CHECK (true);

-- Allow public access to check for duplicate emails (needed for duplicate detection)
CREATE POLICY "Allow public email duplicate checks" ON waitlist
  FOR SELECT USING (true);

-- Keep admin access for viewing full waitlist data
CREATE POLICY "Authenticated users can view full waitlist" ON waitlist
  FOR ALL USING (auth.role() = 'authenticated');

-- QR Scan Events Policies
CREATE POLICY "Users can view their scan events" ON qr_scan_events
  FOR SELECT USING (auth.uid() = scanner_id);

CREATE POLICY "Users can create scan events" ON qr_scan_events
  FOR INSERT WITH CHECK (auth.uid() = scanner_id);

-- Notifications Policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ===============================================
-- TRIGGERS FOR UPDATED_AT
-- ===============================================

-- Update updated_at column automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_connection_codes_updated_at BEFORE UPDATE ON connection_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connection_requests_updated_at BEFORE UPDATE ON connection_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- HELPFUL FUNCTIONS
-- ===============================================

-- Function to generate unique QR codes
CREATE OR REPLACE FUNCTION generate_qr_code(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
BEGIN
  -- Generate a unique, URL-safe code
  new_code := encode(gen_random_bytes(12), 'base64');
  new_code := replace(new_code, '/', '_');
  new_code := replace(new_code, '+', '-');
  new_code := rtrim(new_code, '=');
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired codes
CREATE OR REPLACE FUNCTION cleanup_expired_codes()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM connection_codes 
  WHERE status = 'active' AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ===============================================

-- Insert some test waitlist entries
-- INSERT INTO waitlist (email, source) VALUES 
--   ('test1@example.com', 'website'),
--   ('test2@example.com', 'qr');

COMMIT; 