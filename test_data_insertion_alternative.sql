-- =====================================================
-- DISLINK TEST DATA INSERTION SCRIPT (ALTERNATIVE)
-- For testing without authentication or with specific user ID
-- =====================================================

-- ================================
-- OPTION 1: USE SPECIFIC USER ID
-- ================================
-- If you want to test with a specific user ID, replace the UUID below
-- with an actual user ID from your auth.users table

-- First, let's check what users exist in your system
SELECT 'Available users in auth.users:' as info;
SELECT id, email, created_at FROM auth.users LIMIT 5;

-- ================================
-- OPTION 2: CREATE TEST USER FIRST
-- ================================
-- Uncomment the following lines if you want to create a test user first
-- (This requires admin privileges)

/*
-- Create a test user (requires admin access)
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
) VALUES (
    gen_random_uuid(),
    'testuser@dislink.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Test User"}',
    false,
    'authenticated'
);
*/

-- ================================
-- OPTION 3: USE EXISTING USER ID
-- ================================
-- Replace this UUID with an actual user ID from your auth.users table
-- You can get this by running: SELECT id FROM auth.users LIMIT 1;

DO $$
DECLARE
    test_user_id UUID;
    current_user_id UUID;
BEGIN
    -- Try to get the current authenticated user first
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        test_user_id := current_user_id;
        RAISE NOTICE '✅ Using authenticated user ID: %', test_user_id;
    ELSE
        -- If no authenticated user, try to get the first user from auth.users
        SELECT id INTO test_user_id FROM auth.users LIMIT 1;
        
        IF test_user_id IS NULL THEN
            RAISE EXCEPTION '❌ ERROR: No users found in auth.users table. Please create a user first or ensure you are authenticated.';
        END IF;
        
        RAISE NOTICE '⚠️  No authenticated user found. Using first user from auth.users: %', test_user_id;
        RAISE NOTICE '⚠️  WARNING: This will create test data for user: %', test_user_id;
    END IF;
    
    -- Store the user ID in a temporary variable for use in the script
    PERFORM set_config('app.current_user_id', test_user_id::text, true);
END $$;

-- ================================
-- STEP 1: INSERT TEST CONTACT
-- ================================
-- Insert a comprehensive test contact using the determined user ID

INSERT INTO contacts (
    user_id,                    -- Required: Links to user
    name,                       -- Required: Contact name
    email,                      -- Optional: Contact email
    phone,                      -- Optional: Contact phone
    job_title,                  -- Optional: Job title
    company,                    -- Optional: Company name
    profile_image,              -- Optional: Profile image URL
    cover_image,                -- Optional: Cover image URL
    bio,                        -- Optional: Bio as JSONB
    interests,                  -- Optional: Interests as text[] array
    social_links,               -- Optional: Social links as JSONB
    meeting_date,               -- Optional: Meeting date
    meeting_location,           -- Optional: Meeting location as JSONB
    meeting_context,            -- Optional: Meeting context
    tags,                       -- Optional: Tags as text[] array
    tier,                       -- Optional: Tier (1=inner, 2=middle, 3=outer)
    first_met_at,               -- Optional: First meeting timestamp
    first_met_location,         -- Optional: First meeting location as JSONB
    connection_method,          -- Optional: How they connected
    created_at,                 -- Required: Creation timestamp
    updated_at                  -- Required: Update timestamp
) VALUES (
    COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), -- Use authenticated user or first available user
    'Sarah Johnson',            -- Contact name
    'sarah.johnson@techcorp.com', -- Email
    '+1-555-0199',              -- Phone
    'Senior Product Manager',   -- Job title
    'TechCorp Solutions',       -- Company
    'https://example.com/avatars/sarah.jpg', -- Profile image
    'https://example.com/covers/sarah-cover.jpg', -- Cover image
    '{"location": "San Francisco, CA", "about": "Passionate about user experience and product innovation. Loves hiking and coffee."}'::jsonb, -- Bio as JSONB
    '{product management,user experience,coffee,outdoor activities,startups}'::text[], -- Interests as PostgreSQL text[] array
    '{"linkedin": "https://linkedin.com/in/sarahjohnson", "twitter": "https://twitter.com/sarahj", "github": "https://github.com/sarahj"}'::jsonb, -- Social links as JSONB
    NOW() - INTERVAL '2 weeks', -- Meeting date (2 weeks ago)
    '{"name": "Blue Bottle Coffee", "latitude": 37.7749, "longitude": -122.4194, "venue": "Blue Bottle Coffee - Mission District", "eventContext": "Product Management Meetup"}'::jsonb, -- Meeting location as JSONB
    'Met at a product management meetup where we discussed user research methodologies and design thinking approaches.', -- Meeting context
    '{colleague,product management,networking,coffee enthusiast}'::text[], -- Tags as PostgreSQL text[] array
    2,                          -- Tier (middle circle)
    NOW() - INTERVAL '2 weeks', -- First met at (same as meeting date)
    '{"name": "Blue Bottle Coffee", "latitude": 37.7749, "longitude": -122.4194, "venue": "Blue Bottle Coffee - Mission District"}'::jsonb, -- First meeting location as JSONB
    'networking_event',         -- Connection method
    NOW(),                      -- Created at
    NOW()                       -- Updated at
);

-- ================================
-- STEP 2: INSERT TEST NOTE
-- ================================
-- Insert a test note for the contact we just created

INSERT INTO contact_notes (
    contact_id,                 -- Required: Links to the contact
    content,                    -- Required: Note content
    created_at                  -- Required: Creation timestamp
) 
SELECT 
    c.id,                       -- Use the contact ID from the previous insert
    'Had an excellent conversation about product management best practices. Sarah mentioned she''s working on a new user research framework that could be valuable for our team. She''s very knowledgeable about design thinking and has experience with both B2B and B2C products. Follow up in 2 weeks to discuss potential collaboration on user research methodologies.', -- Note content
    NOW()                       -- Created at
FROM contacts c
WHERE c.user_id = COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))
AND c.name = 'Sarah Johnson'
ORDER BY c.created_at DESC 
LIMIT 1;

-- ================================
-- STEP 3: INSERT TEST FOLLOW-UP
-- ================================
-- Insert a test follow-up for the contact we just created

INSERT INTO contact_followups (
    contact_id,                 -- Required: Links to the contact
    description,                -- Required: Follow-up description
    due_date,                   -- Required: Due date
    completed,                  -- Required: Completion status
    created_at                  -- Required: Creation timestamp
) 
SELECT 
    c.id,                       -- Use the contact ID from the contact insert
    'Schedule a follow-up call to discuss the user research framework collaboration opportunity. Also share our latest product roadmap and get her thoughts on user testing methodologies.', -- Follow-up description
    NOW() + INTERVAL '2 weeks', -- Due date (2 weeks from now)
    false,                      -- Not completed yet
    NOW()                       -- Created at
FROM contacts c
WHERE c.user_id = COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1))
AND c.name = 'Sarah Johnson'
ORDER BY c.created_at DESC 
LIMIT 1;

-- ================================
-- STEP 4: INSERT TEST CONNECTION REQUEST
-- ================================
-- Insert a test connection request

INSERT INTO connection_requests (
    requester_id,               -- Required: User making the request
    target_user_id,             -- Required: User receiving the request (test target)
    requester_name,             -- Optional: Requester's name
    requester_email,            -- Optional: Requester's email
    requester_job_title,        -- Optional: Requester's job title
    requester_company,          -- Optional: Requester's company
    requester_profile_image,    -- Optional: Requester's profile image
    requester_bio,              -- Optional: Requester's bio as JSONB
    requester_interests,        -- Optional: Requester's interests as text[] array
    requester_social_links,     -- Optional: Requester's social links as JSONB
    status,                     -- Required: Request status
    metadata,                   -- Optional: Additional metadata as JSONB
    created_at,                 -- Required: Creation timestamp
    updated_at                  -- Required: Update timestamp
) VALUES (
    COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), -- Requester ID
    '00000000-0000-0000-0000-000000000001'::uuid, -- Target user ID (test UUID)
    'Test User',                -- Requester name
    'testuser@example.com',     -- Requester email
    'Software Engineer',        -- Requester job title
    'Dislink Inc',              -- Requester company
    'https://example.com/avatars/testuser.jpg', -- Requester profile image
    '{"location": "Remote", "about": "Building meaningful connections through technology"}'::jsonb, -- Requester bio as JSONB
    '{software development,networking,technology,coffee}'::text[], -- Requester interests as text[] array
    '{"linkedin": "https://linkedin.com/in/testuser", "github": "https://github.com/testuser"}'::jsonb, -- Requester social links as JSONB
    'pending',                  -- Status (pending approval)
    '{"connectionMethod": "manual", "source": "test_data", "notes": "Test connection request for validation"}'::jsonb, -- Metadata as JSONB
    NOW(),                      -- Created at
    NOW()                       -- Updated at
);

-- ================================
-- STEP 5: VERIFICATION QUERIES
-- ================================
-- Verify that all test data was inserted correctly

-- Check the inserted contact
SELECT 
    '✅ Contact inserted successfully:' as verification, 
    id, 
    name, 
    email, 
    company, 
    job_title,
    tier,
    interests,
    bio,
    social_links,
    meeting_location,
    first_met_location,
    connection_method,
    created_at
FROM contacts 
WHERE name = 'Sarah Johnson'
ORDER BY created_at DESC
LIMIT 1;

-- Check the inserted note
SELECT 
    '✅ Note inserted successfully:' as verification, 
    cn.id, 
    cn.content, 
    c.name as contact_name,
    cn.created_at
FROM contact_notes cn
JOIN contacts c ON c.id = cn.contact_id
WHERE c.name = 'Sarah Johnson'
ORDER BY cn.created_at DESC
LIMIT 1;

-- Check the inserted follow-up
SELECT 
    '✅ Follow-up inserted successfully:' as verification, 
    cf.id, 
    cf.description, 
    cf.due_date, 
    cf.completed, 
    c.name as contact_name,
    cf.created_at
FROM contact_followups cf
JOIN contacts c ON c.id = cf.contact_id
WHERE c.name = 'Sarah Johnson'
ORDER BY cf.created_at DESC
LIMIT 1;

-- Check the inserted connection request
SELECT 
    '✅ Connection request inserted successfully:' as verification, 
    cr.id, 
    cr.requester_id,
    cr.target_user_id,
    cr.requester_name,
    cr.requester_email,
    cr.status,
    cr.metadata,
    cr.created_at
FROM connection_requests cr
WHERE cr.requester_name = 'Test User'
ORDER BY cr.created_at DESC
LIMIT 1;

-- ================================
-- SUCCESS MESSAGE
-- ================================
SELECT '🎉 Test data insertion completed successfully!' as status;
SELECT '✅ All data has been inserted with proper formatting.' as data_format_note;
SELECT '✅ All foreign key relationships are maintained.' as relationship_note;
SELECT '✅ Ready for testing contact management, notes, follow-ups, and connection requests.' as testing_note;
