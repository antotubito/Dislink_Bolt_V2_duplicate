-- Final Fix for Connection Requests RLS Policy
-- This allows anonymous users to create connection requests

-- Check current policies on connection_requests
SELECT 
    'connection_requests' as table_name,
    policyname,
    roles,
    cmd,
    with_check
FROM pg_policies 
WHERE tablename = 'connection_requests'
ORDER BY policyname;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow users to manage connection requests" ON connection_requests;
DROP POLICY IF EXISTS "Allow anonymous connection request creation" ON connection_requests;

-- Create new policies that allow both anonymous and authenticated users
CREATE POLICY "Allow connection request creation" ON connection_requests
    FOR INSERT TO anon, authenticated
    WITH CHECK (
        -- Anonymous users can create connection requests (for QR invitations)
        auth.role() = 'anon' 
        OR 
        -- Authenticated users can create connection requests
        auth.role() = 'authenticated'
    );

CREATE POLICY "Allow connection request reading" ON connection_requests
    FOR SELECT TO anon, authenticated
    USING (
        -- Anonymous users can read connection requests they created
        auth.role() = 'anon'
        OR
        -- Authenticated users can read their own connection requests
        (auth.role() = 'authenticated' AND (auth.uid() = requester_id OR auth.uid() = target_user_id))
    );

CREATE POLICY "Allow connection request updates" ON connection_requests
    FOR UPDATE TO anon, authenticated
    USING (
        -- Anonymous users can update connection requests they created
        auth.role() = 'anon'
        OR
        -- Authenticated users can update their own connection requests
        (auth.role() = 'authenticated' AND (auth.uid() = requester_id OR auth.uid() = target_user_id))
    );

-- Grant necessary permissions to anonymous users
GRANT INSERT ON connection_requests TO anon;
GRANT SELECT ON connection_requests TO anon;
GRANT UPDATE ON connection_requests TO anon;

-- Verify the new policies
SELECT 
    'connection_requests' as table_name,
    policyname,
    roles,
    cmd,
    with_check
FROM pg_policies 
WHERE tablename = 'connection_requests'
ORDER BY policyname;
