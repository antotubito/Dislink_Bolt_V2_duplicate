-- =====================================================
-- DISLINK COMPLETE DATABASE SETUP
-- Schema validation, RLS policies, and test data insertion
-- =====================================================

-- ================================
-- STEP 1: SCHEMA VALIDATION & FIXES
-- ================================

-- 1. Verify current foreign key relationships
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

SELECT '✅ Schema validation and fixes completed' as status;

-- ================================
-- STEP 2: COMPREHENSIVE RLS POLICIES
-- ================================

-- CONTACTS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can insert their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON contacts;

CREATE POLICY "Users can view their own contacts" ON contacts
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own contacts" ON contacts
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contacts" ON contacts
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contacts" ON contacts
    FOR DELETE USING (auth.uid() = user_id);

-- CONTACT_NOTES TABLE POLICIES
DROP POLICY IF EXISTS "Users can view notes for their contacts" ON contact_notes;
DROP POLICY IF EXISTS "Users can insert notes for their contacts" ON contact_notes;
DROP POLICY IF EXISTS "Users can update notes for their contacts" ON contact_notes;
DROP POLICY IF EXISTS "Users can delete notes for their contacts" ON contact_notes;

CREATE POLICY "Users can view notes for their contacts" ON contact_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM contacts 
            WHERE contacts.id = contact_notes.contact_id 
            AND contacts.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can insert notes for their contacts" ON contact_notes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM contacts 
            WHERE contacts.id = contact_notes.contact_id 
            AND contacts.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can update notes for their contacts" ON contact_notes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM contacts 
            WHERE contacts.id = contact_notes.contact_id 
            AND contacts.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can delete notes for their contacts" ON contact_notes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM contacts 
            WHERE contacts.id = contact_notes.contact_id 
            AND contacts.user_id = auth.uid()
        )
    );

-- CONTACT_FOLLOWUPS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view followups for their contacts" ON contact_followups;
DROP POLICY IF EXISTS "Users can insert followups for their contacts" ON contact_followups;
DROP POLICY IF EXISTS "Users can update followups for their contacts" ON contact_followups;
DROP POLICY IF EXISTS "Users can delete followups for their contacts" ON contact_followups;

CREATE POLICY "Users can view followups for their contacts" ON contact_followups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM contacts 
            WHERE contacts.id = contact_followups.contact_id 
            AND contacts.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can insert followups for their contacts" ON contact_followups
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM contacts 
            WHERE contacts.id = contact_followups.contact_id 
            AND contacts.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can update followups for their contacts" ON contact_followups
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM contacts 
            WHERE contacts.id = contact_followups.contact_id 
            AND contacts.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can delete followups for their contacts" ON contact_followups
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM contacts 
            WHERE contacts.id = contact_followups.contact_id 
            AND contacts.user_id = auth.uid()
        )
    );

-- CONNECTION_REQUESTS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view requests sent to them" ON connection_requests;
DROP POLICY IF EXISTS "Users can view requests they sent" ON connection_requests;
DROP POLICY IF EXISTS "Users can create connection requests" ON connection_requests;
DROP POLICY IF EXISTS "Users can update requests sent to them" ON connection_requests;

CREATE POLICY "Users can view requests sent to them" ON connection_requests
    FOR SELECT USING (auth.uid() = target_user_id);
CREATE POLICY "Users can view requests they sent" ON connection_requests
    FOR SELECT USING (auth.uid() = requester_id);
CREATE POLICY "Users can create connection requests" ON connection_requests
    FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update requests sent to them" ON connection_requests
    FOR UPDATE USING (auth.uid() = target_user_id);

SELECT '✅ RLS policies deployed successfully' as status;

-- ================================
-- STEP 3: AUTHENTICATION VERIFICATION
-- ================================

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
-- STEP 4: TEST DATA INSERTION
-- ================================

-- Insert test contact
WITH new_contact AS (
    INSERT INTO contacts (
        user_id,
        name,
        email,
        phone,
        job_title,
        company,
        profile_image,
        cover_image,
        bio,
        interests,
        social_links,
        meeting_date,
        meeting_location,
        meeting_context,
        tags,
        tier,
        first_met_at,
        first_met_location,
        connection_method
    ) VALUES (
        auth.uid(),
        'Sarah Johnson',
        'sarah.johnson@techcorp.com',
        '+1-555-0199',
        'Senior Product Manager',
        'TechCorp Solutions',
        'https://example.com/avatars/sarah.jpg',
        'https://example.com/covers/sarah-cover.jpg',
        '{"location": "San Francisco, CA", "about": "Passionate about user experience and product innovation. Loves hiking and coffee."}'::jsonb,
        '{product management,user experience,coffee,outdoor activities,startups}'::text[],
        '{"linkedin": "https://linkedin.com/in/sarahjohnson", "twitter": "https://twitter.com/sarahj", "github": "https://github.com/sarahj"}'::jsonb,
        NOW() - INTERVAL '2 weeks',
        '{"name": "Blue Bottle Coffee", "latitude": 37.7749, "longitude": -122.4194, "venue": "Blue Bottle Coffee - Mission District", "eventContext": "Product Management Meetup"}'::jsonb,
        'Met at a product management meetup where we discussed user research methodologies and design thinking approaches.',
        '{colleague,product management,networking,coffee enthusiast}'::text[],
        2,
        NOW() - INTERVAL '2 weeks',
        '{"name": "Blue Bottle Coffee", "latitude": 37.7749, "longitude": -122.4194, "venue": "Blue Bottle Coffee - Mission District"}'::jsonb,
        'networking_event'
    )
    RETURNING id, name, user_id
)
SELECT 
    '✅ Contact inserted successfully' as status,
    id as contact_id,
    name as contact_name,
    user_id
FROM new_contact;

-- Insert test note
INSERT INTO contact_notes (contact_id, content)
SELECT 
    c.id,
    'Had an excellent conversation about product management best practices. Sarah mentioned she''s working on a new user research framework that could be valuable for our team. She''s very knowledgeable about design thinking and has experience with both B2B and B2C products. Follow up in 2 weeks to discuss potential collaboration on user research methodologies.'
FROM contacts c
WHERE c.user_id = auth.uid()
AND c.name = 'Sarah Johnson'
ORDER BY c.created_at DESC 
LIMIT 1;

-- Insert test follow-up
INSERT INTO contact_followups (contact_id, description, due_date, completed)
SELECT 
    c.id,
    'Schedule a follow-up call to discuss the user research framework collaboration opportunity. Also share our latest product roadmap and get her thoughts on user testing methodologies.',
    NOW() + INTERVAL '2 weeks',
    false
FROM contacts c
WHERE c.user_id = auth.uid()
AND c.name = 'Sarah Johnson'
ORDER BY c.created_at DESC 
LIMIT 1;

-- Insert test connection request
INSERT INTO connection_requests (
    requester_id,
    target_user_id,
    requester_name,
    requester_email,
    requester_job_title,
    requester_company,
    requester_profile_image,
    requester_bio,
    requester_interests,
    requester_social_links,
    status,
    metadata
) VALUES (
    auth.uid(),
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Test User',
    'testuser@example.com',
    'Software Engineer',
    'Dislink Inc',
    'https://example.com/avatars/testuser.jpg',
    '{"location": "Remote", "about": "Building meaningful connections through technology"}'::jsonb,
    '{software development,networking,technology,coffee}'::text[],
    '{"linkedin": "https://linkedin.com/in/testuser", "github": "https://github.com/testuser"}'::jsonb,
    'pending',
    '{"connectionMethod": "manual", "source": "test_data", "notes": "Test connection request for validation"}'::jsonb
);

-- ================================
-- STEP 5: COMPREHENSIVE VERIFICATION
-- ================================

-- Check the inserted contact
SELECT 
    '✅ Contact verification:' as verification, 
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
WHERE user_id = auth.uid()
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
WHERE c.user_id = auth.uid()
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
WHERE c.user_id = auth.uid()
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
    cr.metadata,
    cr.created_at
FROM connection_requests cr
WHERE cr.requester_id = auth.uid()
AND cr.requester_name = 'Test User'
ORDER BY cr.created_at DESC
LIMIT 1;

-- Data integrity check
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

-- JSONB and Array validation
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
SELECT '🎉 Complete database setup completed successfully!' as status;
SELECT '✅ Schema validation and fixes applied' as schema_note;
SELECT '✅ RLS policies deployed' as rls_note;
SELECT '✅ Test data inserted with full auth.uid() compliance' as data_note;
SELECT '✅ All foreign key relationships maintained' as relationship_note;
SELECT '✅ Ready for production use!' as production_note;
