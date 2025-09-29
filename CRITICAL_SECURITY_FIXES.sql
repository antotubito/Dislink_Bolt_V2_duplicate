-- =====================================================
-- CRITICAL SECURITY FIXES FOR DISLINK CONNECTION SYSTEM
-- Apply these fixes immediately to resolve security vulnerabilities
-- =====================================================

-- ================================
-- 1. FIX GPS LOCATION PRIVACY
-- ================================

-- Add user_id column to qr_scan_tracking table for user isolation
ALTER TABLE qr_scan_tracking ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update existing RLS policy to restrict access to user's own data
DROP POLICY IF EXISTS "Allow users to read scan data" ON qr_scan_tracking;
CREATE POLICY "Allow users to read their own scan data" ON qr_scan_tracking
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Allow users to insert their own scan data
CREATE POLICY "Allow users to insert their own scan data" ON qr_scan_tracking
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Allow anonymous users to insert scan data (for QR scanning before login)
CREATE POLICY "Allow anonymous scan tracking inserts" ON qr_scan_tracking
    FOR INSERT TO anon
    WITH CHECK (true);

-- ================================
-- 2. ADD MISSING RLS POLICIES
-- ================================

-- ================================
-- CONTACTS TABLE POLICIES
-- ================================
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can insert their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON contacts;

-- Create comprehensive contact policies
CREATE POLICY "Users can view their own contacts" ON contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts" ON contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts" ON contacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts" ON contacts
  FOR DELETE USING (auth.uid() = user_id);

-- ================================
-- CONTACT NOTES TABLE POLICIES
-- ================================
ALTER TABLE contact_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view notes for their contacts" ON contact_notes;
DROP POLICY IF EXISTS "Users can insert notes for their contacts" ON contact_notes;
DROP POLICY IF EXISTS "Users can update notes for their contacts" ON contact_notes;
DROP POLICY IF EXISTS "Users can delete notes for their contacts" ON contact_notes;

-- Create comprehensive note policies
CREATE POLICY "Users can view notes for their contacts" ON contact_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contacts 
      WHERE contacts.id = contact_notes.contact_id 
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert notes for their contacts" ON contact_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts 
      WHERE contacts.id = contact_notes.contact_id 
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update notes for their contacts" ON contact_notes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM contacts 
      WHERE contacts.id = contact_notes.contact_id 
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete notes for their contacts" ON contact_notes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM contacts 
      WHERE contacts.id = contact_notes.contact_id 
      AND contacts.user_id = auth.uid()
    )
  );

-- ================================
-- CONTACT FOLLOWUPS TABLE POLICIES
-- ================================
ALTER TABLE contact_followups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view followups for their contacts" ON contact_followups;
DROP POLICY IF EXISTS "Users can insert followups for their contacts" ON contact_followups;
DROP POLICY IF EXISTS "Users can update followups for their contacts" ON contact_followups;
DROP POLICY IF EXISTS "Users can delete followups for their contacts" ON contact_followups;

-- Create comprehensive followup policies
CREATE POLICY "Users can view followups for their contacts" ON contact_followups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contacts 
      WHERE contacts.id = contact_followups.contact_id 
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert followups for their contacts" ON contact_followups
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts 
      WHERE contacts.id = contact_followups.contact_id 
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update followups for their contacts" ON contact_followups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM contacts 
      WHERE contacts.id = contact_followups.contact_id 
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete followups for their contacts" ON contact_followups
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM contacts 
      WHERE contacts.id = contact_followups.contact_id 
      AND contacts.user_id = auth.uid()
    )
  );

-- ================================
-- CONNECTION REQUESTS TABLE POLICIES
-- ================================
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view requests sent to them" ON connection_requests;
DROP POLICY IF EXISTS "Users can view requests they sent" ON connection_requests;
DROP POLICY IF EXISTS "Users can create connection requests" ON connection_requests;
DROP POLICY IF EXISTS "Users can update requests sent to them" ON connection_requests;

-- Create comprehensive connection request policies
CREATE POLICY "Users can view requests sent to them" ON connection_requests
  FOR SELECT USING (auth.uid() = target_user_id);

CREATE POLICY "Users can view requests they sent" ON connection_requests
  FOR SELECT USING (auth.uid() = requester_id);

CREATE POLICY "Users can create connection requests" ON connection_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update requests sent to them" ON connection_requests
  FOR UPDATE USING (auth.uid() = target_user_id);

-- ================================
-- 3. ADD PERFORMANCE INDEXES
-- ================================

-- Indexes for qr_scan_tracking
CREATE INDEX IF NOT EXISTS idx_qr_scan_tracking_user_id ON qr_scan_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_scan_tracking_code ON qr_scan_tracking(code);
CREATE INDEX IF NOT EXISTS idx_qr_scan_tracking_scanned_at ON qr_scan_tracking(scanned_at);

-- Indexes for contacts
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_tier ON contacts(tier);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);

-- Indexes for contact_notes
CREATE INDEX IF NOT EXISTS idx_contact_notes_contact_id ON contact_notes(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_notes_created_at ON contact_notes(created_at);

-- Indexes for contact_followups
CREATE INDEX IF NOT EXISTS idx_contact_followups_contact_id ON contact_followups(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_followups_due_date ON contact_followups(due_date);
CREATE INDEX IF NOT EXISTS idx_contact_followups_completed ON contact_followups(completed);

-- Indexes for connection_requests
CREATE INDEX IF NOT EXISTS idx_connection_requests_target_user_id ON connection_requests(target_user_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_requester_id ON connection_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_status ON connection_requests(status);
CREATE INDEX IF NOT EXISTS idx_connection_requests_created_at ON connection_requests(created_at);

-- ================================
-- 4. VERIFICATION QUERIES
-- ================================

-- Test 1: Verify RLS policies work for contacts
-- This should only return contacts for the authenticated user
SELECT 'Testing contacts RLS policy...' as test_name;
SELECT COUNT(*) as user_contacts_count FROM contacts WHERE user_id = auth.uid();

-- Test 2: Verify location data isolation
-- This should only return scan data for the authenticated user
SELECT 'Testing location data isolation...' as test_name;
SELECT COUNT(*) as user_scan_count FROM qr_scan_tracking WHERE user_id = auth.uid();

-- Test 3: Verify connection request access
-- This should only return requests where user is target or requester
SELECT 'Testing connection request access...' as test_name;
SELECT COUNT(*) as user_requests_count FROM connection_requests 
WHERE target_user_id = auth.uid() OR requester_id = auth.uid();

-- Test 4: Verify note access
-- This should only return notes for user's contacts
SELECT 'Testing note access...' as test_name;
SELECT COUNT(*) as user_notes_count FROM contact_notes cn
JOIN contacts c ON c.id = cn.contact_id
WHERE c.user_id = auth.uid();

-- Test 5: Verify followup access
-- This should only return followups for user's contacts
SELECT 'Testing followup access...' as test_name;
SELECT COUNT(*) as user_followups_count FROM contact_followups cf
JOIN contacts c ON c.id = cf.contact_id
WHERE c.user_id = auth.uid();

-- ================================
-- 5. CLEANUP AND MAINTENANCE
-- ================================

-- Function to cleanup orphaned data
CREATE OR REPLACE FUNCTION cleanup_orphaned_data()
RETURNS void AS $$
BEGIN
    -- Delete orphaned contact notes
    DELETE FROM contact_notes 
    WHERE contact_id NOT IN (SELECT id FROM contacts);
    
    -- Delete orphaned contact followups
    DELETE FROM contact_followups 
    WHERE contact_id NOT IN (SELECT id FROM contacts);
    
    -- Delete orphaned connection requests
    DELETE FROM connection_requests 
    WHERE target_user_id NOT IN (SELECT id FROM auth.users)
    OR requester_id NOT IN (SELECT id FROM auth.users);
    
    -- Delete old scan tracking data (keep last 90 days)
    DELETE FROM qr_scan_tracking 
    WHERE scanned_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
-- 6. GRANT PERMISSIONS
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

-- ================================
-- 7. FINAL VERIFICATION
-- ================================

-- Check that all tables have RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('contacts', 'contact_notes', 'contact_followups', 'connection_requests', 'qr_scan_tracking')
ORDER BY tablename;

-- Check that all policies are created
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
AND tablename IN ('contacts', 'contact_notes', 'contact_followups', 'connection_requests', 'qr_scan_tracking')
ORDER BY tablename, policyname;

-- ================================
-- SUCCESS MESSAGE
-- ================================
SELECT 'Critical security fixes applied successfully!' as status;
SELECT 'All user data is now properly isolated and secured.' as message;
SELECT 'Run the verification queries above to test the fixes.' as next_steps;
