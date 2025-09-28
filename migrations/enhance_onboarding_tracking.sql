-- Enhanced onboarding tracking migration
-- This ensures proper onboarding completion tracking

-- Add onboarding completion timestamp if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster onboarding status queries
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_complete 
ON profiles(onboarding_complete) 
WHERE onboarding_complete = false;

-- Add index for onboarding completion timestamp
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed_at 
ON profiles(onboarding_completed_at) 
WHERE onboarding_completed_at IS NOT NULL;

-- Update existing users who might have completed onboarding but don't have the flag set
-- This is a safety measure for existing data
UPDATE profiles 
SET onboarding_complete = true, 
    onboarding_completed_at = updated_at
WHERE onboarding_complete IS NULL 
  AND (first_name IS NOT NULL AND first_name != '')
  AND (last_name IS NOT NULL AND last_name != '')
  AND (job_title IS NOT NULL AND job_title != '')
  AND (industry IS NOT NULL);

-- Add comment for documentation
COMMENT ON COLUMN profiles.onboarding_complete IS 'Tracks whether user has completed the onboarding process';
COMMENT ON COLUMN profiles.onboarding_completed_at IS 'Timestamp when user completed onboarding';
