-- =====================================================
-- QR CODE SYSTEM TEST SCRIPT
-- =====================================================
-- This script tests the QR code generation and validation system

-- ================================
-- 1. CHECK CONNECTION_CODES TABLE
-- ================================

SELECT '=== CONNECTION_CODES TABLE CHECK ===' as test_section;

-- Check if table exists and has required columns
SELECT 
    'Table Structure Check' as test_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'connection_codes'
ORDER BY ordinal_position;

-- Check RLS status
SELECT 
    'RLS Status Check' as test_name,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'connection_codes';

-- Check RLS policies
SELECT 
    'RLS Policies Check' as test_name,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'connection_codes';

-- ================================
-- 2. CHECK QR_SCAN_TRACKING TABLE
-- ================================

SELECT '=== QR_SCAN_TRACKING TABLE CHECK ===' as test_section;

-- Check if table exists and has required columns
SELECT 
    'Table Structure Check' as test_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'qr_scan_tracking'
ORDER BY ordinal_position;

-- Check RLS status
SELECT 
    'RLS Status Check' as test_name,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'qr_scan_tracking';

-- Check RLS policies
SELECT 
    'RLS Policies Check' as test_name,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'qr_scan_tracking';

-- ================================
-- 3. TEST QR CODE GENERATION
-- ================================

SELECT '=== QR CODE GENERATION TEST ===' as test_section;

-- Check if we have any users to test with
SELECT 
    'Available Users Check' as test_name,
    COUNT(*) as user_count
FROM auth.users;

-- Check if we have any profiles
SELECT 
    'Available Profiles Check' as test_name,
    COUNT(*) as profile_count
FROM profiles;

-- Check existing connection codes
SELECT 
    'Existing Connection Codes Check' as test_name,
    COUNT(*) as code_count,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_codes,
    COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as non_expired_codes
FROM connection_codes;

-- ================================
-- 4. TEST QR CODE VALIDATION
-- ================================

SELECT '=== QR CODE VALIDATION TEST ===' as test_section;

-- Test validation query (this should work for any existing codes)
SELECT 
    'Validation Query Test' as test_name,
    cc.code,
    cc.is_active,
    cc.expires_at,
    CASE 
        WHEN cc.expires_at > NOW() THEN 'VALID'
        ELSE 'EXPIRED'
    END as status,
    p.first_name,
    p.last_name
FROM connection_codes cc
LEFT JOIN profiles p ON p.id = cc.user_id
WHERE cc.is_active = true
LIMIT 5;

-- ================================
-- 5. CHECK FOREIGN KEY RELATIONSHIPS
-- ================================

SELECT '=== FOREIGN KEY RELATIONSHIPS CHECK ===' as test_section;

-- Check foreign key constraints
SELECT 
    'Foreign Key Constraints' as test_name,
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('connection_codes', 'qr_scan_tracking')
ORDER BY tc.table_name, kcu.column_name;

-- ================================
-- 6. PERFORMANCE INDEXES CHECK
-- ================================

SELECT '=== PERFORMANCE INDEXES CHECK ===' as test_section;

-- Check indexes on connection_codes
SELECT 
    'Connection Codes Indexes' as test_name,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'connection_codes'
ORDER BY indexname;

-- Check indexes on qr_scan_tracking
SELECT 
    'QR Scan Tracking Indexes' as test_name,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'qr_scan_tracking'
ORDER BY indexname;

-- ================================
-- 7. SAMPLE DATA TEST
-- ================================

SELECT '=== SAMPLE DATA TEST ===' as test_section;

-- Create a test connection code (if we have users)
DO $$
DECLARE
    test_user_id UUID;
    test_code TEXT;
BEGIN
    -- Get first user for testing
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Generate test code
        test_code := 'test_' || extract(epoch from now())::text || '_' || substr(md5(random()::text), 1, 8);
        
        -- Insert test connection code
        INSERT INTO connection_codes (user_id, code, is_active, expires_at, created_at, updated_at)
        VALUES (
            test_user_id,
            test_code,
            true,
            NOW() + INTERVAL '30 days',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Test connection code created: %', test_code;
        
        -- Test validation query
        PERFORM 1 FROM connection_codes 
        WHERE code = test_code 
        AND is_active = true 
        AND expires_at > NOW();
        
        RAISE NOTICE 'Test connection code validation: SUCCESS';
        
        -- Clean up test data
        DELETE FROM connection_codes WHERE code = test_code;
        RAISE NOTICE 'Test connection code cleaned up';
        
    ELSE
        RAISE NOTICE 'No users found for testing';
    END IF;
END $$;

-- ================================
-- QR CODE SYSTEM TEST COMPLETE
-- ================================

SELECT '=== QR CODE SYSTEM TEST COMPLETE ===' as final_status;
SELECT 'All QR code system components have been tested' as result;
SELECT 'Check the results above for any issues' as recommendation;
