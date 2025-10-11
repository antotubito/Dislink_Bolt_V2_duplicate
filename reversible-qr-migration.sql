-- =====================================================
-- REVERSIBLE QR CODE MIGRATION
-- =====================================================
-- This script applies QR code RLS policies with rollback capability
-- Run this in Supabase SQL editor

-- 1. BACKUP CURRENT STATE
-- Create backup of existing policies
CREATE TABLE IF NOT EXISTS rls_policies_backup_$(date +%Y%m%d_%H%M%S) AS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check,
    NOW() as backup_timestamp
FROM pg_policies 
WHERE tablename IN ('profiles', 'connection_codes', 'qr_scans');

-- 2. APPLY QR CODE RLS POLICIES
-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "Allow anonymous public profile reads" ON profiles;

-- Create new QR-friendly policy for profiles
CREATE POLICY "Allow anonymous public profile reads" ON profiles
    FOR SELECT
    TO anon
    USING ( (public_profile ->> 'enabled') = 'true' );

-- Allow authenticated users to read their own profile
CREATE POLICY "Allow authenticated users to read own profile" ON profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- 3. APPLY CONNECTION CODES RLS POLICIES
-- Enable RLS on connection_codes table
ALTER TABLE connection_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "connection_codes_select_policy" ON connection_codes;
DROP POLICY IF EXISTS "Allow anonymous connection code reads" ON connection_codes;

-- Create new QR-friendly policy for connection_codes
CREATE POLICY "Allow anonymous connection code reads" ON connection_codes
    FOR SELECT
    TO anon
    USING (is_active = true AND expires_at > NOW());

-- Allow authenticated users to read their own connection codes
CREATE POLICY "Allow authenticated users to read own connection codes" ON connection_codes
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- 4. ADD PERFORMANCE INDEXES
-- Add indexes for fast QR code lookups
CREATE INDEX IF NOT EXISTS idx_connection_codes_code ON connection_codes (code);
CREATE INDEX IF NOT EXISTS idx_connection_codes_expires_at ON connection_codes (expires_at);
CREATE INDEX IF NOT EXISTS idx_connection_codes_active ON connection_codes (is_active);

-- 5. VERIFY MIGRATION
-- Check that policies are correctly applied
SELECT 
    'MIGRATION VERIFICATION' as status,
    tablename,
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies 
WHERE tablename IN ('profiles', 'connection_codes')
ORDER BY tablename, policyname;

-- Check RLS status
SELECT 
    'RLS STATUS' as status,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('profiles', 'connection_codes')
ORDER BY tablename;

-- Check indexes
SELECT 
    'INDEXES' as status,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('profiles', 'connection_codes')
ORDER BY tablename, indexname;

-- 6. TEST QUERIES
-- Test anonymous access to public profiles
SELECT 
    'TEST: Anonymous public profile access' as test_name,
    COUNT(*) as accessible_profiles
FROM profiles 
WHERE (public_profile ->> 'enabled') = 'true';

-- Test anonymous access to active connection codes
SELECT 
    'TEST: Anonymous connection code access' as test_name,
    COUNT(*) as accessible_codes
FROM connection_codes 
WHERE is_active = true AND expires_at > NOW();

-- 7. ROLLBACK INSTRUCTIONS
-- If issues occur, run the rollback script:
-- \i rollback-qr-migration.sql
