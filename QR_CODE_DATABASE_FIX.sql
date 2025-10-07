-- =====================================================
-- QR CODE DATABASE FIX
-- =====================================================
-- This script ensures the QR code system has proper database structure

-- ================================
-- 1. ENSURE CONNECTION_CODES TABLE EXISTS
-- ================================

-- Create connection_codes table if it doesn't exist
CREATE TABLE IF NOT EXISTS connection_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ NOT NULL,
    scan_count INTEGER DEFAULT 0,
    last_scanned_at TIMESTAMPTZ,
    last_scan_location JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================
-- 2. ENSURE QR_SCAN_TRACKING TABLE EXISTS
-- ================================

-- Create qr_scan_tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS qr_scan_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scan_id TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL,
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    location JSONB,
    device_info JSONB,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    scanner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================
-- 3. ADD MISSING COLUMNS
-- ================================

-- Add missing columns to connection_codes
ALTER TABLE connection_codes 
ADD COLUMN IF NOT EXISTS scan_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_scanned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_scan_location JSONB;

-- Add missing columns to qr_scan_tracking
ALTER TABLE qr_scan_tracking 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS scanner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS session_id TEXT;

-- ================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ================================

-- Enable RLS on connection_codes
ALTER TABLE connection_codes ENABLE ROW LEVEL SECURITY;

-- Enable RLS on qr_scan_tracking
ALTER TABLE qr_scan_tracking ENABLE ROW LEVEL SECURITY;

-- ================================
-- 5. CREATE RLS POLICIES
-- ================================

-- Connection codes policies
DROP POLICY IF EXISTS "Allow users to manage their own connection codes" ON connection_codes;
CREATE POLICY "Allow users to manage their own connection codes" ON connection_codes
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow anonymous read of active connection codes" ON connection_codes;
CREATE POLICY "Allow anonymous read of active connection codes" ON connection_codes
    FOR SELECT TO anon
    USING (is_active = true AND expires_at > NOW());

-- QR scan tracking policies
DROP POLICY IF EXISTS "Allow users to read their own scan data" ON qr_scan_tracking;
CREATE POLICY "Allow users to read their own scan data" ON qr_scan_tracking
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to insert their own scan data" ON qr_scan_tracking;
CREATE POLICY "Allow users to insert their own scan data" ON qr_scan_tracking
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow anonymous scan tracking inserts" ON qr_scan_tracking;
CREATE POLICY "Allow anonymous scan tracking inserts" ON qr_scan_tracking
    FOR INSERT TO anon
    WITH CHECK (true);

-- ================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ================================

-- Connection codes indexes
CREATE INDEX IF NOT EXISTS idx_connection_codes_user_id ON connection_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_connection_codes_code ON connection_codes(code);
CREATE INDEX IF NOT EXISTS idx_connection_codes_active ON connection_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_connection_codes_expires ON connection_codes(expires_at);

-- QR scan tracking indexes
CREATE INDEX IF NOT EXISTS idx_qr_scan_tracking_code ON qr_scan_tracking(code);
CREATE INDEX IF NOT EXISTS idx_qr_scan_tracking_user_id ON qr_scan_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_scan_tracking_scanner_user_id ON qr_scan_tracking(scanner_user_id);
CREATE INDEX IF NOT EXISTS idx_qr_scan_tracking_scan_id ON qr_scan_tracking(scan_id);

-- ================================
-- 7. CREATE UPDATED_AT TRIGGER
-- ================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for connection_codes
DROP TRIGGER IF EXISTS update_connection_codes_updated_at ON connection_codes;
CREATE TRIGGER update_connection_codes_updated_at
    BEFORE UPDATE ON connection_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- 8. VERIFY SETUP
-- ================================

-- Check table structure
SELECT 'Connection Codes Table Structure' as check_name;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'connection_codes'
ORDER BY ordinal_position;

SELECT 'QR Scan Tracking Table Structure' as check_name;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'qr_scan_tracking'
ORDER BY ordinal_position;

-- Check RLS status
SELECT 'RLS Status Check' as check_name;
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('connection_codes', 'qr_scan_tracking')
ORDER BY tablename;

-- Check policies
SELECT 'RLS Policies Check' as check_name;
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('connection_codes', 'qr_scan_tracking')
ORDER BY tablename, policyname;

-- Check indexes
SELECT 'Indexes Check' as check_name;
SELECT tablename, indexname, indexdef
FROM pg_indexes 
WHERE tablename IN ('connection_codes', 'qr_scan_tracking')
ORDER BY tablename, indexname;

-- ================================
-- QR CODE DATABASE FIX COMPLETE
-- ================================

SELECT '=== QR CODE DATABASE FIX COMPLETE ===' as status;
SELECT 'QR code system database structure is now properly configured' as result;
