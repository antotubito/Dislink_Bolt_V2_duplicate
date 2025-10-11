-- Create test data for QR code verification
-- Run this in Supabase SQL editor

-- 1. Create a test user profile with public profile enabled
INSERT INTO profiles (
  id,
  user_id,
  first_name,
  last_name,
  job_title,
  company,
  profile_image,
  bio,
  interests,
  social_links,
  public_profile,
  created_at,
  updated_at
) VALUES (
  'test-qr-user-001',
  'test-qr-user-001',
  'John',
  'Doe',
  'Software Engineer',
  'Test Company',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  '{"text": "Test bio for QR verification", "visibility": "public"}',
  '["Technology", "Programming", "AI"]',
  '{"linkedin": "https://linkedin.com/in/johndoe", "twitter": "https://twitter.com/johndoe"}',
  '{"enabled": true, "fields": {"name": true, "job_title": true, "company": true, "bio": true, "interests": true, "social_links": true}}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  public_profile = '{"enabled": true, "fields": {"name": true, "job_title": true, "company": true, "bio": true, "interests": true, "social_links": true}}',
  updated_at = NOW();

-- 2. Create a valid connection code for the test user
INSERT INTO connection_codes (
  id,
  user_id,
  code,
  is_active,
  expires_at,
  created_at,
  updated_at
) VALUES (
  'test-valid-qr-001',
  'test-qr-user-001',
  'test-valid-qr-001',
  true,
  NOW() + INTERVAL '1 day', -- Valid for 1 day
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  is_active = true,
  expires_at = NOW() + INTERVAL '1 day',
  updated_at = NOW();

-- 3. Create an expired connection code
INSERT INTO connection_codes (
  id,
  user_id,
  code,
  is_active,
  expires_at,
  created_at,
  updated_at
) VALUES (
  'test-expired-qr-001',
  'test-qr-user-001',
  'test-expired-qr-001',
  true,
  NOW() - INTERVAL '1 hour', -- Expired 1 hour ago
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  is_active = true,
  expires_at = NOW() - INTERVAL '1 hour',
  updated_at = NOW();

-- 4. Create a test user with private profile
INSERT INTO profiles (
  id,
  user_id,
  first_name,
  last_name,
  job_title,
  company,
  profile_image,
  bio,
  interests,
  social_links,
  public_profile,
  created_at,
  updated_at
) VALUES (
  'test-private-user-001',
  'test-private-user-001',
  'Jane',
  'Smith',
  'Product Manager',
  'Private Company',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
  '{"text": "Private bio", "visibility": "private"}',
  '["Product", "Management", "Strategy"]',
  '{"linkedin": "https://linkedin.com/in/janesmith"}',
  '{"enabled": false, "fields": {}}', -- Public profile disabled
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  public_profile = '{"enabled": false, "fields": {}}',
  updated_at = NOW();

-- 5. Create connection code for private profile user
INSERT INTO connection_codes (
  id,
  user_id,
  code,
  is_active,
  expires_at,
  created_at,
  updated_at
) VALUES (
  'test-private-qr-001',
  'test-private-user-001',
  'test-private-qr-001',
  true,
  NOW() + INTERVAL '1 day',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  is_active = true,
  expires_at = NOW() + INTERVAL '1 day',
  updated_at = NOW();

-- 6. Verify the test data
SELECT 
  'Valid QR Test Data' as test_type,
  p.first_name,
  p.last_name,
  p.public_profile->>'enabled' as public_enabled,
  cc.code,
  cc.expires_at,
  cc.is_active
FROM profiles p
JOIN connection_codes cc ON p.id = cc.user_id
WHERE p.id IN ('test-qr-user-001', 'test-private-user-001')
ORDER BY p.id;

-- 7. Show test URLs for manual verification
SELECT 
  'Test URLs for Manual Verification' as info,
  'https://dislinkboltv2duplicate.netlify.app/profile/test-valid-qr-001' as valid_qr_url,
  'https://dislinkboltv2duplicate.netlify.app/profile/test-expired-qr-001' as expired_qr_url,
  'https://dislinkboltv2duplicate.netlify.app/profile/test-private-qr-001' as private_qr_url;
