-- =====================================================
-- QUICK FIX FOR DEPENDENCY ERROR
-- Run this first to fix the dependency issue
-- =====================================================

-- Update security_questions table to reference profiles instead of users
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

-- Now we can safely drop the users table
DROP TABLE IF EXISTS users;

-- Verify the fix worked
SELECT 'Users table dropped successfully' as status;
