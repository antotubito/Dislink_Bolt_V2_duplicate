-- ========================================
-- QR → Public Profile Flow Database Fixes
-- ========================================
-- This migration fixes the QR code to public profile flow
-- by updating RLS policies, adding indexes, and ensuring proper data access

-- ========================================
-- 1. FIX RLS POLICIES FOR ANONYMOUS ACCESS
-- ========================================

-- Drop existing anonymous profile read policy to avoid conflicts
DROP POLICY IF EXISTS "Allow anonymous public profile reads" ON profiles;

-- Create improved RLS policy for anonymous users to read public profiles
-- This policy allows anonymous users to read profiles only when:
-- 1. public_profile is enabled
-- 2. The profile is active (not disabled)
CREATE POLICY "Allow anonymous public profile reads" ON profiles
    FOR SELECT TO anon
    USING (
        public_profile->>'enabled' = 'true' 
        AND (status IS NULL OR status = 'active')
    );

-- ========================================
-- 2. ADD MISSING INDEXES FOR PERFORMANCE
-- ========================================

-- Index for connection_codes table - code lookup (most important)
CREATE INDEX IF NOT EXISTS idx_connection_codes_code_lookup 
ON connection_codes(code) 
WHERE is_active = true AND expires_at > NOW();

-- Index for connection_codes table - user_id lookup
CREATE INDEX IF NOT EXISTS idx_connection_codes_user_id 
ON connection_codes(user_id) 
WHERE is_active = true;

-- Index for connection_codes table - expires_at for cleanup
CREATE INDEX IF NOT EXISTS idx_connection_codes_expires_at 
ON connection_codes(expires_at) 
WHERE is_active = true;

-- Index for profiles table - public profile lookup
CREATE INDEX IF NOT EXISTS idx_profiles_public_enabled 
ON profiles(id) 
WHERE public_profile->>'enabled' = 'true' 
AND (status IS NULL OR status = 'active');

-- ========================================
-- 3. CREATE HELPER FUNCTIONS FOR QR VALIDATION
-- ========================================

-- Function to validate connection code and return profile data in one query
CREATE OR REPLACE FUNCTION validate_connection_code_with_profile(connection_code TEXT)
RETURNS TABLE (
    user_id UUID,
    profile_id UUID,
    first_name TEXT,
    last_name TEXT,
    job_title TEXT,
    company TEXT,
    profile_image TEXT,
    bio JSONB,
    interests TEXT[],
    social_links JSONB,
    public_profile JSONB,
    code_expires_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cc.user_id,
        p.id as profile_id,
        p.first_name,
        p.last_name,
        p.job_title,
        p.company,
        p.profile_image,
        p.bio,
        p.interests,
        p.social_links,
        p.public_profile,
        cc.expires_at as code_expires_at
    FROM connection_codes cc
    INNER JOIN profiles p ON cc.user_id = p.id
    WHERE cc.code = connection_code
        AND cc.is_active = true
        AND cc.expires_at > NOW()
        AND p.public_profile->>'enabled' = 'true'
        AND (p.status IS NULL OR p.status = 'active');
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION validate_connection_code_with_profile(TEXT) TO anon;

-- ========================================
-- 4. CREATE FUNCTION TO TRACK QR SCANS
-- ========================================

-- Function to track QR code scans with proper error handling
CREATE OR REPLACE FUNCTION track_qr_scan(
    scan_code TEXT,
    scan_location JSONB DEFAULT NULL,
    device_info JSONB DEFAULT NULL,
    session_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    scan_tracking_id UUID;
    connection_code_exists BOOLEAN;
BEGIN
    -- Check if connection code exists and is active
    SELECT EXISTS(
        SELECT 1 FROM connection_codes 
        WHERE code = scan_code 
        AND is_active = true 
        AND expires_at > NOW()
    ) INTO connection_code_exists;
    
    -- Only track if connection code is valid
    IF connection_code_exists THEN
        INSERT INTO qr_scan_tracking (
            scan_id,
            code,
            location,
            device_info,
            session_id,
            scanned_at
        ) VALUES (
            gen_random_uuid()::TEXT,
            scan_code,
            scan_location,
            device_info,
            session_id,
            NOW()
        ) RETURNING id INTO scan_tracking_id;
        
        -- Update scan count on connection_codes
        UPDATE connection_codes 
        SET 
            scan_count = scan_count + 1,
            last_scanned_at = NOW(),
            last_scan_location = scan_location
        WHERE code = scan_code;
        
        RETURN scan_tracking_id;
    ELSE
        -- Return NULL if code is invalid
        RETURN NULL;
    END IF;
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION track_qr_scan(TEXT, JSONB, JSONB, TEXT) TO anon;

-- ========================================
-- 5. CREATE CLEANUP FUNCTION FOR EXPIRED CODES
-- ========================================

-- Function to clean up expired connection codes
CREATE OR REPLACE FUNCTION cleanup_expired_connection_codes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Mark expired codes as inactive
    UPDATE connection_codes 
    SET is_active = false, status = 'expired'
    WHERE expires_at <= NOW() AND is_active = true;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete very old expired codes (older than 30 days)
    DELETE FROM connection_codes 
    WHERE expires_at < NOW() - INTERVAL '30 days' 
    AND status = 'expired';
    
    RETURN deleted_count;
END;
$$;

-- ========================================
-- 6. CREATE TRIGGER FOR AUTOMATIC CLEANUP
-- ========================================

-- Function to automatically mark codes as expired
CREATE OR REPLACE FUNCTION check_connection_code_expiry()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if the code is expired when accessed
    IF NEW.expires_at <= NOW() THEN
        NEW.is_active = false;
        NEW.status = 'expired';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to automatically handle expiry
DROP TRIGGER IF EXISTS trigger_check_connection_code_expiry ON connection_codes;
CREATE TRIGGER trigger_check_connection_code_expiry
    BEFORE UPDATE ON connection_codes
    FOR EACH ROW
    EXECUTE FUNCTION check_connection_code_expiry();

-- ========================================
-- 7. VERIFY EXISTING DATA INTEGRITY
-- ========================================

-- Update any existing connection codes that might be expired
UPDATE connection_codes 
SET is_active = false, status = 'expired'
WHERE expires_at <= NOW() AND is_active = true;

-- Ensure all profiles have proper public_profile structure
UPDATE profiles 
SET public_profile = jsonb_set(
    COALESCE(public_profile, '{}'::jsonb),
    '{enabled}',
    'true'::jsonb
)
WHERE public_profile IS NULL OR public_profile->>'enabled' IS NULL;

-- ========================================
-- 8. GRANT NECESSARY PERMISSIONS
-- ========================================

-- Ensure anonymous users can read connection_codes for validation
GRANT SELECT ON connection_codes TO anon;

-- Ensure anonymous users can read profiles for public profile display
GRANT SELECT ON profiles TO anon;

-- Ensure anonymous users can insert into qr_scan_tracking
GRANT INSERT ON qr_scan_tracking TO anon;

-- ========================================
-- 9. CREATE VIEW FOR PUBLIC PROFILE DATA
-- ========================================

-- Create a view that only exposes public profile data
CREATE OR REPLACE VIEW public_profiles_view AS
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.job_title,
    p.company,
    p.profile_image,
    p.bio,
    p.interests,
    p.social_links,
    p.public_profile,
    p.created_at
FROM profiles p
WHERE p.public_profile->>'enabled' = 'true'
    AND (p.status IS NULL OR p.status = 'active');

-- Grant access to anonymous users
GRANT SELECT ON public_profiles_view TO anon;

-- ========================================
-- 10. COMMENTS AND DOCUMENTATION
-- ========================================

COMMENT ON FUNCTION validate_connection_code_with_profile(TEXT) IS 
'Validates a connection code and returns associated public profile data in a single query. Used by QR code scanning flow.';

COMMENT ON FUNCTION track_qr_scan(TEXT, JSONB, JSONB, TEXT) IS 
'Tracks QR code scans with location and device information. Returns scan tracking ID or NULL if code is invalid.';

COMMENT ON FUNCTION cleanup_expired_connection_codes() IS 
'Cleans up expired connection codes. Should be run periodically via cron job.';

COMMENT ON VIEW public_profiles_view IS 
'View that exposes only public profile data for anonymous users. Used by QR code public profile display.';

-- ========================================
-- MIGRATION COMPLETE
-- ========================================

-- Log successful migration
INSERT INTO analytics_events (event_type, event_name, properties, session_id)
VALUES (
    'business',
    'migration_completed',
    '{"migration": "fix_qr_public_profile_flow", "version": "1.0.0"}'::jsonb,
    'migration-' || gen_random_uuid()::TEXT
);
