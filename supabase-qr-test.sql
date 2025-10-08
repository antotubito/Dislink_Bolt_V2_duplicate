-- 🧪 SUPABASE QR CONNECTION FLOW DATABASE TEST
-- Run these queries in Supabase SQL Editor to validate database structure

-- =====================================================
-- 1. TEST CONNECTION_CODES TABLE STRUCTURE
-- =====================================================

-- Check if connection_codes table exists and has correct structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'connection_codes' 
ORDER BY ordinal_position;

-- Test inserting a connection code (replace with actual user_id)
-- INSERT INTO connection_codes (user_id, code, is_active, expires_at)
-- VALUES (
--     'your-user-id-here',
--     'test_conn_' || extract(epoch from now()),
--     true,
--     now() + interval '30 days'
-- );

-- =====================================================
-- 2. TEST EMAIL_INVITATIONS TABLE STRUCTURE
-- =====================================================

-- Check if email_invitations table exists and has correct structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'email_invitations' 
ORDER BY ordinal_position;

-- =====================================================
-- 3. TEST CONNECTION_REQUESTS TABLE STRUCTURE
-- =====================================================

-- Check if connection_requests table exists and has correct structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'connection_requests' 
ORDER BY ordinal_position;

-- =====================================================
-- 4. TEST QR_SCAN_TRACKING TABLE STRUCTURE
-- =====================================================

-- Check if qr_scan_tracking table exists and has correct structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'qr_scan_tracking' 
ORDER BY ordinal_position;

-- =====================================================
-- 5. TEST RLS POLICIES
-- =====================================================

-- Check RLS policies for connection_codes
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
WHERE tablename = 'connection_codes';

-- Check RLS policies for email_invitations
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
WHERE tablename = 'email_invitations';

-- Check RLS policies for connection_requests
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
WHERE tablename = 'connection_requests';

-- =====================================================
-- 6. TEST DATA INTEGRITY
-- =====================================================

-- Count records in each table
SELECT 
    'connection_codes' as table_name,
    count(*) as record_count
FROM connection_codes
UNION ALL
SELECT 
    'email_invitations' as table_name,
    count(*) as record_count
FROM email_invitations
UNION ALL
SELECT 
    'connection_requests' as table_name,
    count(*) as record_count
FROM connection_requests
UNION ALL
SELECT 
    'qr_scan_tracking' as table_name,
    count(*) as record_count
FROM qr_scan_tracking;

-- =====================================================
-- 7. TEST FOREIGN KEY RELATIONSHIPS
-- =====================================================

-- Check foreign key constraints
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('connection_codes', 'email_invitations', 'connection_requests', 'qr_scan_tracking');

-- =====================================================
-- 8. TEST INDEXES
-- =====================================================

-- Check indexes for performance
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('connection_codes', 'email_invitations', 'connection_requests', 'qr_scan_tracking')
ORDER BY tablename, indexname;

-- =====================================================
-- 9. SAMPLE DATA QUERIES (for testing)
-- =====================================================

-- Get sample connection codes
SELECT 
    cc.id,
    cc.user_id,
    cc.code,
    cc.is_active,
    cc.expires_at,
    cc.scan_count,
    p.first_name,
    p.last_name
FROM connection_codes cc
JOIN profiles p ON cc.user_id = p.id
ORDER BY cc.created_at DESC
LIMIT 5;

-- Get sample email invitations
SELECT 
    ei.id,
    ei.invitation_id,
    ei.recipient_email,
    ei.sender_user_id,
    ei.status,
    ei.expires_at,
    p.first_name as sender_name
FROM email_invitations ei
JOIN profiles p ON ei.sender_user_id = p.id
ORDER BY ei.created_at DESC
LIMIT 5;

-- Get sample connection requests
SELECT 
    cr.id,
    cr.user_id,
    cr.requester_id,
    cr.status,
    cr.created_at,
    p1.first_name as target_name,
    p2.first_name as requester_name
FROM connection_requests cr
JOIN profiles p1 ON cr.user_id = p1.id
JOIN profiles p2 ON cr.requester_id = p2.id
ORDER BY cr.created_at DESC
LIMIT 5;

-- =====================================================
-- 10. VALIDATION QUERIES
-- =====================================================

-- Check for orphaned records
SELECT 'connection_codes without valid user' as issue, count(*) as count
FROM connection_codes cc
LEFT JOIN profiles p ON cc.user_id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 'email_invitations without valid sender' as issue, count(*) as count
FROM email_invitations ei
LEFT JOIN profiles p ON ei.sender_user_id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 'connection_requests without valid users' as issue, count(*) as count
FROM connection_requests cr
LEFT JOIN profiles p1 ON cr.user_id = p1.id
LEFT JOIN profiles p2 ON cr.requester_id = p2.id
WHERE p1.id IS NULL OR p2.id IS NULL;

-- Check for expired records
SELECT 'expired connection_codes' as issue, count(*) as count
FROM connection_codes
WHERE expires_at < now() AND is_active = true

UNION ALL

SELECT 'expired email_invitations' as issue, count(*) as count
FROM email_invitations
WHERE expires_at < now() AND status = 'sent';
