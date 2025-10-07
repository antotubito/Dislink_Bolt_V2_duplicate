-- Fix RLS Policy for Email Invitations
-- This allows anonymous users to create email invitations when scanning QR codes

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Allow users to create invitations" ON email_invitations;

-- Create a new policy that allows both authenticated and anonymous users to create invitations
-- Anonymous users can create invitations when scanning QR codes
-- Authenticated users can create invitations for their own QR codes
CREATE POLICY "Allow invitation creation" ON email_invitations
    FOR INSERT TO anon, authenticated
    WITH CHECK (
        -- Anonymous users can create invitations (for QR code scanning)
        auth.role() = 'anon' 
        OR 
        -- Authenticated users can create invitations for their own QR codes
        (auth.role() = 'authenticated' AND auth.uid() = sender_user_id)
    );

-- Also allow anonymous users to update invitations (for status changes)
DROP POLICY IF EXISTS "Allow users to update their invitations" ON email_invitations;

CREATE POLICY "Allow invitation updates" ON email_invitations
    FOR UPDATE TO anon, authenticated
    USING (
        -- Anonymous users can update invitations they created
        auth.role() = 'anon'
        OR
        -- Authenticated users can update invitations they sent
        (auth.role() = 'authenticated' AND auth.uid() = sender_user_id)
    );

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
WHERE tablename = 'email_invitations'
ORDER BY policyname;
