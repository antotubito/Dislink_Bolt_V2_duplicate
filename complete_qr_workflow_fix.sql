-- Complete QR Workflow RLS Fix
-- This script fixes all RLS policies to ensure the QR workflow works correctly

-- ================================
-- 1. FIX EMAIL INVITATIONS RLS
-- ================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow users to create invitations" ON email_invitations;
DROP POLICY IF EXISTS "Allow users to update their invitations" ON email_invitations;

-- Create new policies that allow both anonymous and authenticated users
CREATE POLICY "Allow invitation creation" ON email_invitations
    FOR INSERT TO anon, authenticated
    WITH CHECK (
        -- Anonymous users can create invitations (for QR code scanning)
        auth.role() = 'anon' 
        OR 
        -- Authenticated users can create invitations for their own QR codes
        (auth.role() = 'authenticated' AND auth.uid() = sender_user_id)
    );

CREATE POLICY "Allow invitation updates" ON email_invitations
    FOR UPDATE TO anon, authenticated
    USING (
        -- Anonymous users can update invitations they created
        auth.role() = 'anon'
        OR
        -- Authenticated users can update invitations they sent
        (auth.role() = 'authenticated' AND auth.uid() = sender_user_id)
    );

-- ================================
-- 2. FIX CONNECTION REQUESTS RLS
-- ================================

-- Enable RLS on connection_requests table
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow users to create connection requests" ON connection_requests;
DROP POLICY IF EXISTS "Allow users to read connection requests" ON connection_requests;
DROP POLICY IF EXISTS "Allow users to update connection requests" ON connection_requests;
DROP POLICY IF EXISTS "Allow anonymous connection request creation" ON connection_requests;

-- Allow authenticated users to create connection requests
CREATE POLICY "Allow users to create connection requests" ON connection_requests
    FOR INSERT TO authenticated
    WITH CHECK (
        -- Users can create requests where they are the requester
        auth.uid() = requester_id
        OR
        -- Users can create requests where they are the target
        auth.uid() = target_user_id
    );

-- Allow users to read connection requests they're involved in
CREATE POLICY "Allow users to read connection requests" ON connection_requests
    FOR SELECT TO authenticated
    USING (
        -- Users can read requests where they are the requester
        auth.uid() = requester_id
        OR
        -- Users can read requests where they are the target
        auth.uid() = target_user_id
    );

-- Allow users to update connection requests they're involved in
CREATE POLICY "Allow users to update connection requests" ON connection_requests
    FOR UPDATE TO authenticated
    USING (
        -- Users can update requests where they are the requester
        auth.uid() = requester_id
        OR
        -- Users can update requests where they are the target
        auth.uid() = target_user_id
    );

-- Allow anonymous users to create connection requests (for QR code invitations)
CREATE POLICY "Allow anonymous connection request creation" ON connection_requests
    FOR INSERT TO anon
    WITH CHECK (true);

-- ================================
-- 3. ENSURE PROPER PERMISSIONS
-- ================================

-- Grant necessary permissions to anonymous users
GRANT INSERT ON email_invitations TO anon;
GRANT UPDATE ON email_invitations TO anon;
GRANT INSERT ON connection_requests TO anon;
GRANT SELECT ON connection_requests TO anon;

-- ================================
-- 4. VERIFY POLICIES
-- ================================

-- Check email_invitations policies
SELECT 
    'email_invitations' as table_name,
    policyname,
    roles,
    cmd,
    with_check
FROM pg_policies 
WHERE tablename = 'email_invitations'
ORDER BY policyname;

-- Check connection_requests policies
SELECT 
    'connection_requests' as table_name,
    policyname,
    roles,
    cmd,
    with_check
FROM pg_policies 
WHERE tablename = 'connection_requests'
ORDER BY policyname;

-- ================================
-- 5. TEST QUERIES
-- ================================

-- Test anonymous access to email_invitations
SET ROLE anon;
SELECT 'Testing anonymous email_invitations access...' as test;

-- Test anonymous access to connection_requests
SELECT 'Testing anonymous connection_requests access...' as test;

-- Reset role
RESET ROLE;
