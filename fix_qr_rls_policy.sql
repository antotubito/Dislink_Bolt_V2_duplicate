-- =====================================================
-- QR PROFILE ACCESS FIX - RLS POLICY UPDATE
-- =====================================================
-- This script fixes the RLS policy for anonymous access to public profiles
-- Date: 2024-12-19
-- Issue: Anonymous users cannot access public profiles via QR codes

-- ================================
-- 1. FIX PROFILES TABLE RLS POLICY
-- ================================

-- Drop the existing broken policy
DROP POLICY IF EXISTS "Allow anonymous public profile reads" ON profiles;

-- Create the corrected policy that checks public_profile->>'enabled' = 'true'
CREATE POLICY "Allow anonymous public profile reads" ON profiles
    FOR SELECT TO anon
    USING (public_profile->>'enabled' = 'true');

-- ================================
-- 2. VERIFY CONNECTION_CODES RLS POLICY
-- ================================

-- Ensure connection_codes has proper anonymous access policy
DROP POLICY IF EXISTS "Allow anonymous read of active connection codes" ON connection_codes;
CREATE POLICY "Allow anonymous read of active connection codes" ON connection_codes
    FOR SELECT TO anon
    USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- ================================
-- 3. TEST THE FIX
-- ================================

-- Test anonymous access to profiles with public_profile enabled
-- This should return profiles where public_profile.enabled = true
SET ROLE anon;
SELECT 
    id,
    first_name,
    last_name,
    public_profile->>'enabled' as public_enabled
FROM profiles 
WHERE public_profile->>'enabled' = 'true'
LIMIT 5;

-- Test anonymous access to active connection codes
SELECT 
    id,
    code,
    is_active,
    expires_at
FROM connection_codes 
WHERE is_active = true 
AND (expires_at IS NULL OR expires_at > NOW())
LIMIT 5;

-- Reset role
RESET ROLE;

-- ================================
-- 4. VERIFICATION QUERIES
-- ================================

-- Check if RLS is enabled on both tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('profiles', 'connection_codes')
AND schemaname = 'public';

-- List all policies on profiles table
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles'
AND schemaname = 'public';

-- List all policies on connection_codes table
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'connection_codes'
AND schemaname = 'public';
