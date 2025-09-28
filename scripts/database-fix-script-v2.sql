-- ==============================================
-- DISLINK DATABASE SCHEMA FIXES - VERSION 2
-- ==============================================
-- This version handles the case where 'users' table doesn't exist
-- Run this script in Supabase SQL Editor

-- Step 1: Check what tables exist
SELECT 'Available tables:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'profiles', 'contacts')
ORDER BY table_name;

-- Step 2: Check current foreign key constraints
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

-- Step 3: Check profiles table count
SELECT 'Profiles table count:' as info, COUNT(*) as count FROM profiles;

-- Step 4: Check if contacts table exists and has data
SELECT 'Contacts table count:' as info, COUNT(*) as count FROM contacts;

-- Step 5: Fix foreign key relationship (if contacts table exists)
-- First check if contacts table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'contacts') THEN
        -- Drop existing foreign key constraint if it exists
        ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_user_id_fkey;
        
        -- Add correct foreign key constraint
        ALTER TABLE contacts 
        ADD CONSTRAINT contacts_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key constraint updated successfully';
    ELSE
        RAISE NOTICE 'Contacts table does not exist - skipping foreign key fix';
    END IF;
END $$;

-- Step 6: Add performance indexes (if tables exist)
-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_bio_gin ON profiles USING GIN (bio);
CREATE INDEX IF NOT EXISTS idx_profiles_social_links_gin ON profiles USING GIN (social_links);

-- Connection codes indexes (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'connection_codes') THEN
        CREATE INDEX IF NOT EXISTS idx_connection_codes_user_id ON connection_codes(user_id);
        RAISE NOTICE 'Connection codes indexes created';
    END IF;
END $$;

-- Contacts table indexes (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'contacts') THEN
        CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
        CREATE INDEX IF NOT EXISTS idx_contacts_bio_gin ON contacts USING GIN (bio);
        RAISE NOTICE 'Contacts indexes created';
    END IF;
END $$;

-- Email invitations indexes (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'email_invitations') THEN
        CREATE INDEX IF NOT EXISTS idx_email_invitations_recipient ON email_invitations(recipient_email);
        RAISE NOTICE 'Email invitations indexes created';
    END IF;
END $$;

-- Step 7: Verify the fix
SELECT 'Final foreign key constraints:' as info;
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

-- Step 8: Test the relationship (if both tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'contacts') 
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        
        RAISE NOTICE 'Testing relationship between profiles and contacts...';
        
        -- This will be executed as a separate query
        PERFORM 1; -- Placeholder
    ELSE
        RAISE NOTICE 'Cannot test relationship - one or both tables missing';
    END IF;
END $$;

-- Step 9: Show relationship test results
SELECT 'Relationship test results:' as info;
SELECT 
    p.id as profile_id,
    p.email,
    COUNT(c.id) as contact_count
FROM profiles p
LEFT JOIN contacts c ON p.id = c.user_id
GROUP BY p.id, p.email
LIMIT 5;

-- Step 10: Verify indexes were created
SELECT 'Created indexes:' as info;
SELECT indexname, tablename 
FROM pg_indexes 
WHERE table_schema = 'public'
  AND tablename IN ('profiles', 'contacts', 'connection_codes', 'email_invitations')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Step 11: Summary
SELECT 'Database fix summary:' as info;
SELECT 
    'Tables checked' as operation,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'profiles', 'contacts', 'connection_codes', 'email_invitations')

UNION ALL

SELECT 
    'Indexes created' as operation,
    COUNT(*) as count
FROM pg_indexes 
WHERE table_schema = 'public'
  AND tablename IN ('profiles', 'contacts', 'connection_codes', 'email_invitations')
  AND indexname LIKE 'idx_%'

UNION ALL

SELECT 
    'Foreign key constraints' as operation,
    COUNT(*) as count
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
  AND table_name = 'contacts';
