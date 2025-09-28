-- =====================================================
-- FINAL DATABASE OPTIMIZATION
-- Complete the database setup after Debug Assistant fixes
-- =====================================================

-- =====================================================
-- ADDITIONAL PERFORMANCE INDEXES
-- =====================================================

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_complete ON profiles(onboarding_complete);
CREATE INDEX IF NOT EXISTS idx_profiles_registration_complete ON profiles(registration_complete);

-- Connection codes indexes
CREATE INDEX IF NOT EXISTS idx_connection_codes_code ON connection_codes(code);
CREATE INDEX IF NOT EXISTS idx_connection_codes_status ON connection_codes(status);
CREATE INDEX IF NOT EXISTS idx_connection_codes_is_active ON connection_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_connection_codes_expires_at ON connection_codes(expires_at);

-- Email invitations indexes
CREATE INDEX IF NOT EXISTS idx_email_invitations_recipient_email ON email_invitations(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_invitations_status ON email_invitations(status);
CREATE INDEX IF NOT EXISTS idx_email_invitations_expires_at ON email_invitations(expires_at);

-- Contacts indexes
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);

-- JSONB GIN indexes for better JSON query performance
CREATE INDEX IF NOT EXISTS idx_profiles_bio_gin ON profiles USING GIN (bio);
CREATE INDEX IF NOT EXISTS idx_profiles_social_links_gin ON profiles USING GIN (social_links);
CREATE INDEX IF NOT EXISTS idx_profiles_preferences_gin ON profiles USING GIN (preferences);
CREATE INDEX IF NOT EXISTS idx_contacts_bio_gin ON contacts USING GIN (bio);
CREATE INDEX IF NOT EXISTS idx_contacts_social_links_gin ON contacts USING GIN (social_links);
CREATE INDEX IF NOT EXISTS idx_connection_codes_location_gin ON connection_codes USING GIN (location);
CREATE INDEX IF NOT EXISTS idx_email_invitations_scan_data_gin ON email_invitations USING GIN (scan_data);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all key tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_scan_events ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can manage own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can view own connection codes" ON connection_codes;
DROP POLICY IF EXISTS "Users can manage own connection codes" ON connection_codes;
DROP POLICY IF EXISTS "Users can view own email invitations" ON email_invitations;
DROP POLICY IF EXISTS "Users can manage own email invitations" ON email_invitations;
DROP POLICY IF EXISTS "Users can view own security questions" ON security_questions;
DROP POLICY IF EXISTS "Users can manage own security questions" ON security_questions;
DROP POLICY IF EXISTS "Users can view own profile updates" ON profile_updates;
DROP POLICY IF EXISTS "Users can manage own profile updates" ON profile_updates;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view own qr scan events" ON qr_scan_events;
DROP POLICY IF EXISTS "Users can manage own qr scan events" ON qr_scan_events;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Contacts policies
CREATE POLICY "Users can view own contacts" ON contacts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own contacts" ON contacts
    FOR ALL USING (auth.uid() = user_id);

-- Connection codes policies
CREATE POLICY "Users can view own connection codes" ON connection_codes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own connection codes" ON connection_codes
    FOR ALL USING (auth.uid() = user_id);

-- Email invitations policies
CREATE POLICY "Users can view own email invitations" ON email_invitations
    FOR SELECT USING (auth.uid() = sender_user_id);

CREATE POLICY "Users can manage own email invitations" ON email_invitations
    FOR ALL USING (auth.uid() = sender_user_id);

-- Security questions policies
CREATE POLICY "Users can view own security questions" ON security_questions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own security questions" ON security_questions
    FOR ALL USING (auth.uid() = user_id);

-- Profile updates policies
CREATE POLICY "Users can view own profile updates" ON profile_updates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own profile updates" ON profile_updates
    FOR ALL USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notifications" ON notifications
    FOR ALL USING (auth.uid() = user_id);

-- QR scan events policies
CREATE POLICY "Users can view own qr scan events" ON qr_scan_events
    FOR SELECT USING (auth.uid() = scanner_id);

CREATE POLICY "Users can manage own qr scan events" ON qr_scan_events
    FOR ALL USING (auth.uid() = scanner_id);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify all indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Verify RLS is enabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'profiles', 'contacts', 'connection_codes', 'email_invitations',
    'security_questions', 'profile_updates', 'notifications', 'qr_scan_events'
)
ORDER BY tablename;

-- Verify RLS policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Final status
SELECT 'Database optimization completed successfully!' as status;
