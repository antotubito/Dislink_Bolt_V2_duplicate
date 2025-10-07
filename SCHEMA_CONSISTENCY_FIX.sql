-- =====================================================
-- SCHEMA CONSISTENCY FIX - MISSING COLUMNS
-- =====================================================
-- This script adds missing columns to ensure schema consistency
-- and prevent runtime errors

-- ================================
-- 1. FIX CONTACTS TABLE
-- ================================

-- Add missing columns to contacts table
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS first_met_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS first_met_location JSONB,
ADD COLUMN IF NOT EXISTS connection_method TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- ================================
-- 2. FIX QR SCAN TRACKING TABLE
-- ================================

-- Ensure all required columns exist
ALTER TABLE qr_scan_tracking 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS scanner_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS referrer TEXT;

-- ================================
-- 3. FIX CONNECTION CODES TABLE
-- ================================

-- Ensure all required columns exist
ALTER TABLE connection_codes 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS scan_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_scanned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_scan_location JSONB;

-- ================================
-- 4. FIX EMAIL INVITATIONS TABLE
-- ================================

-- Ensure all required columns exist
ALTER TABLE email_invitations 
ADD COLUMN IF NOT EXISTS sender_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS recipient_email TEXT,
ADD COLUMN IF NOT EXISTS connection_code TEXT,
ADD COLUMN IF NOT EXISTS scan_data JSONB,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent',
ADD COLUMN IF NOT EXISTS registered_user_id UUID REFERENCES auth.users(id);

-- ================================
-- 5. FIX CONNECTION REQUESTS TABLE
-- ================================

-- Ensure all required columns exist
ALTER TABLE connection_requests 
ADD COLUMN IF NOT EXISTS requester_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS target_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- ================================
-- 6. ADD MISSING INDEXES
-- ================================

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_first_met_at ON contacts(first_met_at);
CREATE INDEX IF NOT EXISTS idx_contacts_connection_method ON contacts(connection_method);
CREATE INDEX IF NOT EXISTS idx_connection_codes_user_id ON connection_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_connection_codes_code ON connection_codes(code);
CREATE INDEX IF NOT EXISTS idx_email_invitations_sender_user_id ON email_invitations(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_email_invitations_recipient_email ON email_invitations(recipient_email);
CREATE INDEX IF NOT EXISTS idx_connection_requests_requester_id ON connection_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_target_user_id ON connection_requests(target_user_id);

-- ================================
-- 7. VERIFY SCHEMA CONSISTENCY
-- ================================

-- Check that all required columns exist
SELECT 'Verifying contacts table schema...' as test_name;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'contacts' 
AND column_name IN ('first_met_at', 'first_met_location', 'connection_method', 'metadata')
ORDER BY column_name;

SELECT 'Verifying qr_scan_tracking table schema...' as test_name;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'qr_scan_tracking' 
AND column_name IN ('user_id', 'scanner_user_id', 'session_id', 'device_info', 'referrer')
ORDER BY column_name;

SELECT 'Verifying connection_codes table schema...' as test_name;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'connection_codes' 
AND column_name IN ('user_id', 'expires_at', 'is_active', 'scan_count', 'last_scanned_at', 'last_scan_location')
ORDER BY column_name;

SELECT 'Verifying email_invitations table schema...' as test_name;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'email_invitations' 
AND column_name IN ('sender_user_id', 'recipient_email', 'connection_code', 'scan_data', 'expires_at', 'status', 'registered_user_id')
ORDER BY column_name;

SELECT 'Verifying connection_requests table schema...' as test_name;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'connection_requests' 
AND column_name IN ('requester_id', 'target_user_id', 'status', 'metadata')
ORDER BY column_name;

-- ================================
-- 8. VERIFY FOREIGN KEY CONSTRAINTS
-- ================================

-- Check foreign key constraints
SELECT 'Verifying foreign key constraints...' as test_name;
SELECT 
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
AND tc.table_name IN ('contacts', 'qr_scan_tracking', 'connection_codes', 'email_invitations', 'connection_requests')
ORDER BY tc.table_name, kcu.column_name;

-- ================================
-- SCHEMA CONSISTENCY FIX COMPLETE
-- ================================
-- All missing columns have been added to ensure schema consistency.
-- The database is now ready for production deployment.
