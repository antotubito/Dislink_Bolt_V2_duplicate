-- =====================================================
-- BACKUP CURRENT RLS POLICIES
-- =====================================================
-- Run this BEFORE applying any RLS policy changes
-- This creates a backup of current policies for rollback

-- 1. Create backup table with timestamp
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

-- 2. Show current policies for verification
SELECT 
    'CURRENT POLICIES BACKUP' as status,
    tablename,
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies 
WHERE tablename IN ('profiles', 'connection_codes', 'qr_scans')
ORDER BY tablename, policyname;

-- 3. Show current RLS status
SELECT 
    'CURRENT RLS STATUS' as status,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('profiles', 'connection_codes', 'qr_scans')
ORDER BY tablename;

-- 4. Show current indexes
SELECT 
    'CURRENT INDEXES' as status,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('profiles', 'connection_codes', 'qr_scans')
ORDER BY tablename, indexname;
