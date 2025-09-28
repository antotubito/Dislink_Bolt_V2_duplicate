-- =====================================================
-- SUPABASE DATABASE FIXES
-- Execute these commands in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- FIX 1: Update Foreign Key Relationships
-- =====================================================

-- Drop existing foreign key constraint (if it exists)
ALTER TABLE contacts 
DROP CONSTRAINT IF EXISTS contacts_user_id_fkey;

-- Add correct foreign key constraint to reference profiles table
ALTER TABLE contacts 
ADD CONSTRAINT contacts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- =====================================================
-- FIX 2: Update All Foreign Key References to Users Table
-- =====================================================

-- First, update security_questions table to reference profiles instead of users
ALTER TABLE security_questions 
DROP CONSTRAINT IF EXISTS security_questions_user_id_fkey;

ALTER TABLE security_questions 
ADD CONSTRAINT security_questions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update profile_updates table to reference profiles instead of users
ALTER TABLE profile_updates 
DROP CONSTRAINT IF EXISTS profile_updates_user_id_fkey;

ALTER TABLE profile_updates 
ADD CONSTRAINT profile_updates_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- =====================================================
-- FIX 3: Remove Duplicate Users Table
-- =====================================================

-- Now we can safely drop the users table since all dependencies are updated
DROP TABLE IF EXISTS users;

-- =====================================================
-- FIX 4: Add Performance Indexes
-- =====================================================

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_connection_codes_code ON connection_codes(code);
CREATE INDEX IF NOT EXISTS idx_connection_codes_user_id ON connection_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_connection_codes_status ON connection_codes(status);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_email_invitations_recipient ON email_invitations(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_invitations_sender ON email_invitations(sender_user_id);

-- Add GIN indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_profiles_bio_gin ON profiles USING GIN (bio);
CREATE INDEX IF NOT EXISTS idx_profiles_social_links_gin ON profiles USING GIN (social_links);
CREATE INDEX IF NOT EXISTS idx_profiles_preferences_gin ON profiles USING GIN (preferences);
CREATE INDEX IF NOT EXISTS idx_contacts_bio_gin ON contacts USING GIN (bio);
CREATE INDEX IF NOT EXISTS idx_contacts_social_links_gin ON contacts USING GIN (social_links);

-- =====================================================
-- FIX 5: Enable Row Level Security (RLS)
-- =====================================================

-- Enable RLS on key tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_updates ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FIX 6: Create RLS Policies
-- =====================================================

-- Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Contacts: Users can only access their own contacts
CREATE POLICY "Users can view own contacts" ON contacts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own contacts" ON contacts
    FOR ALL USING (auth.uid() = user_id);

-- Connection Codes: Users can only access their own codes
CREATE POLICY "Users can view own connection codes" ON connection_codes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own connection codes" ON connection_codes
    FOR ALL USING (auth.uid() = user_id);

-- Email Invitations: Users can only access their own invitations
CREATE POLICY "Users can view own email invitations" ON email_invitations
    FOR SELECT USING (auth.uid() = sender_user_id);

CREATE POLICY "Users can manage own email invitations" ON email_invitations
    FOR ALL USING (auth.uid() = sender_user_id);

-- Security Questions: Users can only access their own security questions
CREATE POLICY "Users can view own security questions" ON security_questions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own security questions" ON security_questions
    FOR ALL USING (auth.uid() = user_id);

-- Profile Updates: Users can only access their own profile updates
CREATE POLICY "Users can view own profile updates" ON profile_updates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own profile updates" ON profile_updates
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify foreign key constraint was created
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
AND tc.table_name='contacts';

-- Verify users table was dropped
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'users';

-- Verify indexes were created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'contacts', 'connection_codes', 'email_invitations');
