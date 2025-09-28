-- ==============================================
-- DISLINK DATABASE SCHEMA FIXES - EXECUTION SCRIPT
-- ==============================================
-- Run this script in Supabase SQL Editor
-- This will fix the critical database schema issues

-- Step 1: Verify current state
SELECT 'Current foreign key constraints:' as info;
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
  AND tc.table_name = 'contacts';

-- Step 2: Check table counts
SELECT 'Users table count:' as info, COUNT(*) as count FROM users;
SELECT 'Profiles table count:' as info, COUNT(*) as count FROM profiles;

-- Step 3: Fix foreign key relationship
-- Drop existing foreign key constraint
ALTER TABLE contacts 
DROP CONSTRAINT IF EXISTS contacts_user_id_fkey;

-- Add correct foreign key constraint
ALTER TABLE contacts 
ADD CONSTRAINT contacts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Step 4: Remove duplicate users table (if empty)
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM users) = 0 THEN
        DROP TABLE IF EXISTS users CASCADE;
        RAISE NOTICE 'Users table dropped successfully (was empty)';
    ELSE
        RAISE NOTICE 'Users table not dropped - contains data';
    END IF;
END $$;

-- Step 5: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_connection_codes_user_id ON connection_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_email_invitations_recipient ON email_invitations(recipient_email);

-- Step 6: Add GIN indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_profiles_bio_gin ON profiles USING GIN (bio);
CREATE INDEX IF NOT EXISTS idx_profiles_social_links_gin ON profiles USING GIN (social_links);
CREATE INDEX IF NOT EXISTS idx_contacts_bio_gin ON contacts USING GIN (bio);

-- Step 7: Verify the fix
SELECT 'Fixed foreign key constraints:' as info;
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
  AND tc.table_name = 'contacts';

-- Step 8: Test the relationship
SELECT 'Testing relationship:' as info;
SELECT 
    p.id as profile_id,
    p.email,
    COUNT(c.id) as contact_count
FROM profiles p
LEFT JOIN contacts c ON p.id = c.user_id
GROUP BY p.id, p.email
LIMIT 5;

-- Step 9: Verify indexes were created
SELECT 'Created indexes:' as info;
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('profiles', 'contacts', 'connection_codes', 'email_invitations')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
