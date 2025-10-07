-- SECURITY STATUS VERIFICATION
-- Simple script to verify current security status

-- Check current policies on qr_scan_tracking table
SELECT 'Current security policies:' as status;
SELECT 
    policyname,
    cmd as operation,
    CASE 
        WHEN qual LIKE '%auth.uid() = user_id%' THEN '✅ SECURE - User-specific access'
        WHEN qual = 'true' THEN '❌ VULNERABLE - Allows all users'
        ELSE '⚠️ UNKNOWN - Needs review'
    END as security_status
FROM pg_policies 
WHERE tablename = 'qr_scan_tracking'
ORDER BY policyname;

-- Final security assessment
SELECT 'Security Assessment:' as status;
SELECT CASE 
    WHEN EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'qr_scan_tracking' 
        AND policyname = 'Allow users to read their own scan data'
        AND qual LIKE '%auth.uid() = user_id%'
    ) 
    THEN '✅ SECURE: User-specific access policy is active - No data leakage risk'
    ELSE '❌ INSECURE: User-specific access policy not found - Data leakage risk'
END as final_security_status;
