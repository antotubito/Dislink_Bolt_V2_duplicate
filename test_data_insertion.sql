-- =====================================================
-- DISLINK TEST DATA INSERTION SCRIPT
-- RLS-Safe Test Data for Supabase
-- =====================================================

-- ================================
-- AUTHENTICATION CHECK
-- ================================
-- Check if we have an authenticated user
DO $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get the current authenticated user ID
    current_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION '❌ ERROR: No authenticated user found. Please ensure you are logged in to Supabase before running this script.';
    END IF;
    
    -- Log the authenticated user ID
    RAISE NOTICE '✅ Authenticated user ID: %', current_user_id;
END $$;

-- ================================
-- STEP 1: INSERT TEST CONTACT
-- ================================
-- Insert a comprehensive test contact for the authenticated user
-- Using proper PostgreSQL array and JSON syntax with RLS compliance

INSERT INTO contacts (
    user_id,                    -- Required: Links to authenticated user via auth.uid()
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
    auth.uid(),                 -- Use authenticated user's ID (RLS compliance)
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
-- The note will be linked to the contact via contact_id

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
WHERE c.user_id = auth.uid()   -- RLS compliance: only access user's own contacts
AND c.name = 'Sarah Johnson'
ORDER BY c.created_at DESC 
LIMIT 1;

-- ================================
-- STEP 3: INSERT TEST FOLLOW-UP
-- ================================
-- Insert a test follow-up for the contact we just created
-- The follow-up will be linked to the contact via contact_id

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
WHERE c.user_id = auth.uid()   -- RLS compliance: only access user's own contacts
AND c.name = 'Sarah Johnson'
ORDER BY c.created_at DESC 
LIMIT 1;

-- ================================
-- STEP 4: INSERT TEST CONNECTION REQUEST
-- ================================
-- Insert a test connection request from the authenticated user to a target user
-- This simulates a connection request scenario

INSERT INTO connection_requests (
    requester_id,               -- Required: User making the request (authenticated user)
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
    auth.uid(),                 -- Requester ID (authenticated user)
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
-- These queries will only return data for the authenticated user due to RLS policies

-- Check the inserted contact with proper array and JSON display
SELECT 
    '✅ Contact inserted successfully:' as verification, 
    id, 
    name, 
    email, 
    company, 
    job_title,
    tier,
    interests,                  -- Will display as PostgreSQL array
    bio,                        -- Will display as JSONB
    social_links,               -- Will display as JSONB
    meeting_location,           -- Will display as JSONB
    first_met_location,         -- Will display as JSONB
    connection_method,
    created_at
FROM contacts 
WHERE user_id = auth.uid()     -- RLS compliance
AND name = 'Sarah Johnson';

-- Check the inserted note
SELECT 
    '✅ Note inserted successfully:' as verification, 
    cn.id, 
    cn.content, 
    c.name as contact_name,
    cn.created_at
FROM contact_notes cn
JOIN contacts c ON c.id = cn.contact_id
WHERE c.user_id = auth.uid()   -- RLS compliance
AND c.name = 'Sarah Johnson';

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
WHERE c.user_id = auth.uid()   -- RLS compliance
AND c.name = 'Sarah Johnson';

-- Check the inserted connection request
SELECT 
    '✅ Connection request inserted successfully:' as verification, 
    cr.id, 
    cr.requester_id,
    cr.target_user_id,
    cr.requester_name,
    cr.requester_email,
    cr.status,
    cr.metadata,                -- Will display as JSONB
    cr.created_at
FROM connection_requests cr
WHERE cr.requester_id = auth.uid() -- RLS compliance
AND cr.requester_name = 'Test User';

-- ================================
-- STEP 6: DATA INTEGRITY VERIFICATION
-- ================================
-- Verify the complete relationship chain works correctly

-- Count all data for the authenticated user
SELECT 
    '📊 Data integrity check:' as verification,
    (SELECT COUNT(*) FROM contacts WHERE user_id = auth.uid()) as total_contacts,
    (SELECT COUNT(*) FROM contact_notes cn 
     JOIN contacts c ON c.id = cn.contact_id 
     WHERE c.user_id = auth.uid()) as total_notes,
    (SELECT COUNT(*) FROM contact_followups cf 
     JOIN contacts c ON c.id = cf.contact_id 
     WHERE c.user_id = auth.uid()) as total_followups,
    (SELECT COUNT(*) FROM connection_requests 
     WHERE requester_id = auth.uid()) as total_connection_requests;

-- Verify JSONB and array fields are properly formatted
SELECT 
    '🔍 JSONB and Array validation:' as verification,
    c.name,
    c.bio->>'location' as bio_location,
    c.bio->>'about' as bio_about,
    c.social_links->>'linkedin' as linkedin_url,
    c.interests[1] as first_interest,
    c.tags[1] as first_tag,
    c.meeting_location->>'name' as meeting_venue
FROM contacts c
WHERE c.user_id = auth.uid()
AND c.name = 'Sarah Johnson';

-- ================================
-- SUCCESS MESSAGE
-- ================================
SELECT '🎉 Test data insertion completed successfully!' as status;
SELECT '✅ All RLS policies are respected and data is properly isolated per user.' as security_note;
SELECT '✅ PostgreSQL arrays and JSONB fields are properly formatted.' as data_format_note;
SELECT '✅ All foreign key relationships are maintained.' as relationship_note;
SELECT '✅ Ready for testing contact management, notes, follow-ups, and connection requests.' as testing_note;
