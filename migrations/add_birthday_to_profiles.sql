-- Migration: Add birthday field to profiles table
-- Date: 2024-12-19
-- Description: Add birthday field to store user's birthday information

-- Add birthday column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS birthday TEXT;

-- Add comment to document the field
COMMENT ON COLUMN profiles.birthday IS 'User birthday in YYYY-MM-DD format';

-- Update public_profile default to include birthday field
-- This will be handled in the application code, but we can set a default here
UPDATE profiles 
SET public_profile = COALESCE(public_profile, '{}'::jsonb) || '{"allowedFields": {"birthday": false}}'::jsonb
WHERE public_profile IS NULL OR NOT (public_profile ? 'allowedFields');

-- Create index for birthday queries (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_profiles_birthday ON profiles(birthday) WHERE birthday IS NOT NULL;
