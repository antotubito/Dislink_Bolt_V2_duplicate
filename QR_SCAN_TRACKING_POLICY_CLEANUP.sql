-- QR SCAN TRACKING POLICY CLEANUP
-- Clean up duplicate policies and verify security

-- First, let's see what policies currently exist
SELECT 'Current policies on qr_scan_tracking table:' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'qr_scan_tracking'
ORDER BY policyname;

-- Check if the vulnerable policy exists
SELECT 'Checking for vulnerable policy...' as status;
SELECT CASE 
  WHEN EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'qr_scan_tracking' 
    AND policyname = 'Allow users to read scan data'
    AND qual = 'true'
  ) 
  THEN 'VULNERABLE POLICY FOUND - NEEDS REMOVAL'
  ELSE 'VULNERABLE POLICY NOT FOUND - SECURE'
END as security_status;

-- Remove the vulnerable policy if it exists (ignore error if it doesn't exist)
DROP POLICY IF EXISTS "Allow users to read scan data" ON qr_scan_tracking;

-- Ensure the secure policy exists (ignore error if it already exists)
DROP POLICY IF EXISTS "Allow users to read their own scan data" ON qr_scan_tracking;
CREATE POLICY "Allow users to read their own scan data" ON qr_scan_tracking
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Verify the final state
SELECT 'Final policy verification:' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'qr_scan_tracking'
ORDER BY policyname;

-- Security verification
SELECT 'Security verification complete:' as status;
SELECT CASE 
  WHEN EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'qr_scan_tracking' 
    AND policyname = 'Allow users to read their own scan data'
    AND qual LIKE '%auth.uid() = user_id%'
  ) 
  THEN '✅ SECURE: User-specific access policy is active'
  ELSE '❌ INSECURE: User-specific access policy not found'
END as final_security_status;
