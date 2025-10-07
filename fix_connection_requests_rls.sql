-- Fix RLS Policy for Connection Requests
-- This ensures the connection_requests table has proper RLS policies

-- Enable RLS on connection_requests table
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow users to create connection requests" ON connection_requests;
DROP POLICY IF EXISTS "Allow users to read connection requests" ON connection_requests;
DROP POLICY IF EXISTS "Allow users to update connection requests" ON connection_requests;

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

-- Grant necessary permissions
GRANT INSERT ON connection_requests TO anon;
GRANT SELECT ON connection_requests TO anon;

-- Verify the policies are working
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'connection_requests'
ORDER BY policyname;
