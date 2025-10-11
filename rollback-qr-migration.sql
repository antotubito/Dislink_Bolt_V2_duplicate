-- =====================================================
-- ROLLBACK SCRIPT FOR QR CODE MIGRATION
-- =====================================================
-- This script reverts the QR code RLS policy changes
-- Run this if the QR code flow breaks after migration

-- 1. BACKUP CURRENT STATE (for reference)
-- Create a backup table of current policies
CREATE TABLE IF NOT EXISTS rls_policies_backup AS
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
WHERE tablename IN ('profiles', 'connection_codes');

-- 2. REMOVE NEW RLS POLICIES
-- Drop the new QR-specific policies
DROP POLICY IF EXISTS "Allow anonymous public profile reads" ON profiles;
DROP POLICY IF EXISTS "Allow anonymous connection code reads" ON connection_codes;

-- 3. RESTORE ORIGINAL RLS POLICIES
-- Restore the original profiles RLS policy (if it existed)
-- Note: This assumes the original policy was more restrictive
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Restore original connection_codes policy (if it existed)
CREATE POLICY "connection_codes_select_policy" ON connection_codes
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- 4. REMOVE INDEXES (if they were added)
DROP INDEX IF EXISTS idx_connection_codes_code;
DROP INDEX IF EXISTS idx_connection_codes_expires_at;

-- 5. VERIFY ROLLBACK
-- Check that policies have been reverted
SELECT 
    'ROLLBACK VERIFICATION' as status,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename IN ('profiles', 'connection_codes')
ORDER BY tablename, policyname;

-- 6. CLEANUP (optional - remove backup table after verification)
-- DROP TABLE IF EXISTS rls_policies_backup;
