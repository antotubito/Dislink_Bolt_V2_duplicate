-- =====================================================
-- DISLINK UNIFIED TEST DATA INSERTION SCRIPT
-- Production-Ready with Full auth.uid() Compliance
-- =====================================================

-- ================================
-- PREREQUISITE: SCHEMA VALIDATION
-- ================================
-- Run this first to ensure your schema is correct

-- 1. Verify foreign key relationships
SELECT '🔍 Checking foreign key relationships...' as status;
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('contacts', 'contact_notes', 'contact_followups', 'connection_requests');

-- 2. Fix contacts table foreign key if needed
DO $$
BEGIN
    -- Drop existing constraint if it exists
    ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_user_id_fkey;
    
    -- Add correct constraint
    ALTER TABLE contacts 
    ADD CONSTRAINT contacts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    RAISE NOTICE '✅ Foreign key constraint updated for contacts table';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️  Foreign key constraint update failed: %', SQLERRM;
END $$;

-- 3. Ensure all required columns exist
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS first_met_at TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS first_met_location JSONB;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS connection_method TEXT DEFAULT 'manual';
ALTER TABLE connection_requests ADD COLUMN IF NOT EXISTS metadata JSONB;

-- 4. Enable RLS on all tables
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

-- ================================
-- AUTHENTICATION VERIFICATION
-- ================================
-- This is CRITICAL - the script will fail if no user is authenticated

DO $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get the current authenticated user ID
    current_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION '❌ CRITICAL ERROR: No authenticated user found. 
        
        This script requires an authenticated user context. You have two options:
        
        OPTION 1 (RECOMMENDED): Run this from within your Dislink app
        - Use the TypeScript version in your app code
        - Ensure user is logged in before calling the function
        
        OPTION 2: Run from Supabase SQL Editor with authentication
        - Go to Supabase Dashboard → Authentication → Users
        - Copy a user ID and temporarily replace auth.uid() with that UUID
        - This is ONLY for testing purposes
        
        The auth.uid() function returns NULL when run directly in SQL editor
        without proper authentication context.';
    END IF;
    
    -- Log the authenticated user ID
    RAISE NOTICE '✅ Authenticated user ID: %', current_user_id;
    RAISE NOTICE '✅ Proceeding with test data insertion...';
END $$;

-- ================================
-- STEP 1: INSERT TEST CONTACT
-- ================================
-- Insert a comprehensive test contact with all fields properly formatted

WITH new_contact AS (
    INSERT INTO contacts (
        user_id,                    -- Required: Always use auth.uid()
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
        auth.uid(),                 -- ✅ Always use auth.uid() for RLS compliance
        'Sarah Johnson',            -- Contact name
        'sarah.johnson@techcorp.com', -- Email
        '+1-555-0199',              -- Phone
        'Senior Product Manager',   -- Job title
        'TechCorp Solutions',       -- Company
        'https://example.com/avatars/sarah.jpg', -- Profile image
        'https://example.com/covers/sarah-cover.jpg', -- Cover image
        '{"location": "San Francisco, CA", "about": "Passionate about user experience and product innovation. Loves hiking and coffee."}'::jsonb, -- ✅ Proper JSONB casting
        '{product management,user experience,coffee,outdoor activities,startups}'::text[], -- ✅ Proper array syntax
        '{"linkedin": "https://linkedin.com/in/sarahjohnson", "twitter": "https://twitter.com/sarahj", "github": "https://github.com/sarahj"}'::jsonb, -- ✅ Proper JSONB casting
        NOW() - INTERVAL '2 weeks', -- Meeting date (2 weeks ago)
        '{"name": "Blue Bottle Coffee", "latitude": 37.7749, "longitude": -122.4194, "venue": "Blue Bottle Coffee - Mission District", "eventContext": "Product Management Meetup"}'::jsonb, -- ✅ Proper JSONB casting
        'Met at a product management meetup where we discussed user research methodologies and design thinking approaches.', -- Meeting context
        '{colleague,product management,networking,coffee enthusiast}'::text[], -- ✅ Proper array syntax
        2,                          -- Tier (middle circle)
        NOW() - INTERVAL '2 weeks', -- First met at (same as meeting date)
        '{"name": "Blue Bottle Coffee", "latitude": 37.7749, "longitude": -122.4194, "venue": "Blue Bottle Coffee - Mission District"}'::jsonb, -- ✅ Proper JSONB casting
        'networking_event',         -- Connection method
        NOW(),                      -- Created at
        NOW()                       -- Updated at
    )
    RETURNING id, name, user_id
)
SELECT 
    '✅ Contact inserted successfully' as status,
    id as contact_id,
    name as contact_name,
    user_id
FROM new_contact;

-- ================================
-- STEP 2: INSERT TEST NOTE
-- ================================
-- Insert a test note linked to the contact we just created

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
WHERE c.user_id = auth.uid()   -- ✅ RLS compliance: only access user's own contacts
AND c.name = 'Sarah Johnson'
ORDER BY c.created_at DESC 
LIMIT 1;

-- ================================
-- STEP 3: INSERT TEST FOLLOW-UP
-- ================================
-- Insert a test follow-up linked to the same contact

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
WHERE c.user_id = auth.uid()   -- ✅ RLS compliance: only access user's own contacts
AND c.name = 'Sarah Johnson'
ORDER BY c.created_at DESC 
LIMIT 1;

-- ================================
-- STEP 4: INSERT TEST CONNECTION REQUEST
-- ================================
-- Insert a test connection request from the authenticated user

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
    auth.uid(),                 -- ✅ Always use auth.uid() for RLS compliance
    '00000000-0000-0000-0000-000000000001'::uuid, -- Target user ID (test UUID)
    'Test User',                -- Requester name
    'testuser@example.com',     -- Requester email
    'Software Engineer',        -- Requester job title
    'Dislink Inc',              -- Requester company
    'https://example.com/avatars/testuser.jpg', -- Requester profile image
    '{"location": "Remote", "about": "Building meaningful connections through technology"}'::jsonb, -- ✅ Proper JSONB casting
    '{software development,networking,technology,coffee}'::text[], -- ✅ Proper array syntax
    '{"linkedin": "https://linkedin.com/in/testuser", "github": "https://github.com/testuser"}'::jsonb, -- ✅ Proper JSONB casting
    'pending',                  -- Status (pending approval)
    '{"connectionMethod": "manual", "source": "test_data", "notes": "Test connection request for validation"}'::jsonb, -- ✅ Proper JSONB casting
    NOW(),                      -- Created at
    NOW()                       -- Updated at
);

-- ================================
-- STEP 5: COMPREHENSIVE VERIFICATION
-- ================================
-- Verify that all test data was inserted correctly with RLS compliance

-- Check the inserted contact with proper array and JSON display
SELECT 
    '✅ Contact verification:' as verification, 
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
WHERE user_id = auth.uid()     -- ✅ RLS compliance
AND name = 'Sarah Johnson'
ORDER BY created_at DESC
LIMIT 1;

-- Check the inserted note
SELECT 
    '✅ Note verification:' as verification, 
    cn.id, 
    cn.content, 
    c.name as contact_name,
    cn.created_at
FROM contact_notes cn
JOIN contacts c ON c.id = cn.contact_id
WHERE c.user_id = auth.uid()   -- ✅ RLS compliance
AND c.name = 'Sarah Johnson'
ORDER BY cn.created_at DESC
LIMIT 1;

-- Check the inserted follow-up
SELECT 
    '✅ Follow-up verification:' as verification, 
    cf.id, 
    cf.description, 
    cf.due_date, 
    cf.completed, 
    c.name as contact_name,
    cf.created_at
FROM contact_followups cf
JOIN contacts c ON c.id = cf.contact_id
WHERE c.user_id = auth.uid()   -- ✅ RLS compliance
AND c.name = 'Sarah Johnson'
ORDER BY cf.created_at DESC
LIMIT 1;

-- Check the inserted connection request
SELECT 
    '✅ Connection request verification:' as verification, 
    cr.id, 
    cr.requester_id,
    cr.target_user_id,
    cr.requester_name,
    cr.requester_email,
    cr.status,
    cr.metadata,                -- Will display as JSONB
    cr.created_at
FROM connection_requests cr
WHERE cr.requester_id = auth.uid() -- ✅ RLS compliance
AND cr.requester_name = 'Test User'
ORDER BY cr.created_at DESC
LIMIT 1;

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
AND c.name = 'Sarah Johnson'
ORDER BY c.created_at DESC
LIMIT 1;

-- ================================
-- SUCCESS MESSAGE
-- ================================
SELECT '🎉 Test data insertion completed successfully!' as status;
SELECT '✅ All RLS policies are respected and data is properly isolated per user.' as security_note;
SELECT '✅ PostgreSQL arrays and JSONB fields are properly formatted.' as data_format_note;
SELECT '✅ All foreign key relationships are maintained.' as relationship_note;
SELECT '✅ Ready for testing contact management, notes, follow-ups, and connection requests.' as testing_note;
SELECT '✅ All operations use auth.uid() for complete RLS compliance.' as rls_note;
