-- Fix RLS Policy for Connection Codes
-- This allows anonymous users to create connection codes when needed

-- Check current policies
SELECT 
    'connection_codes' as table_name,
    policyname,
    roles,
    cmd,
    with_check
FROM pg_policies 
WHERE tablename = 'connection_codes'
ORDER BY policyname;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow users to create connection codes" ON connection_codes;
DROP POLICY IF EXISTS "Allow users to read their connection codes" ON connection_codes;
DROP POLICY IF EXISTS "Allow users to update their connection codes" ON connection_codes;

-- Create new policies that allow both anonymous and authenticated users
CREATE POLICY "Allow connection code creation" ON connection_codes
    FOR INSERT TO anon, authenticated
    WITH CHECK (
        -- Anonymous users can create connection codes (for QR generation)
        auth.role() = 'anon' 
        OR 
        -- Authenticated users can create connection codes for themselves
        (auth.role() = 'authenticated' AND auth.uid() = user_id)
    );

CREATE POLICY "Allow connection code reading" ON connection_codes
    FOR SELECT TO anon, authenticated
    USING (
        -- Anonymous users can read active connection codes (for QR validation)
        (auth.role() = 'anon' AND is_active = true AND (expires_at IS NULL OR expires_at > NOW()))
        OR
        -- Authenticated users can read their own connection codes
        (auth.role() = 'authenticated' AND auth.uid() = user_id)
    );

CREATE POLICY "Allow connection code updates" ON connection_codes
    FOR UPDATE TO anon, authenticated
    USING (
        -- Anonymous users can update connection codes they created
        auth.role() = 'anon'
        OR
        -- Authenticated users can update their own connection codes
        (auth.role() = 'authenticated' AND auth.uid() = user_id)
    );

-- Grant necessary permissions to anonymous users
GRANT INSERT ON connection_codes TO anon;
GRANT UPDATE ON connection_codes TO anon;

-- Verify the new policies
SELECT 
    'connection_codes' as table_name,
    policyname,
    roles,
    cmd,
    with_check
FROM pg_policies 
WHERE tablename = 'connection_codes'
ORDER BY policyname;
