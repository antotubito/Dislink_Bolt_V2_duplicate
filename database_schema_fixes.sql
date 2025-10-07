-- Database Schema Fixes
-- Fix foreign key relationships, consolidate duplicate tables, and clean up test tables

-- ============================================================================
-- 1. ANALYTICS TABLES (New tables for business analytics)
-- ============================================================================

-- Create analytics_events table for tracking user behavior
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'user_action', 'conversion', 'error', 'performance', 'business')),
    event_name TEXT NOT NULL,
    properties JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    page_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
    browser TEXT,
    os TEXT,
    country TEXT,
    city TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_journeys table for conversion funnel tracking
CREATE TABLE IF NOT EXISTS public.user_journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    journey_type TEXT NOT NULL CHECK (journey_type IN ('registration', 'onboarding', 'profile_creation', 'connection', 'engagement')),
    current_step INTEGER NOT NULL DEFAULT 1,
    total_steps INTEGER NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    abandoned_at TIMESTAMPTZ,
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for analytics tables
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON public.analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_journeys_session_id ON public.user_journeys(session_id);
CREATE INDEX IF NOT EXISTS idx_user_journeys_user_id ON public.user_journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journeys_journey_type ON public.user_journeys(journey_type);

-- ============================================================================
-- 2. FIX FOREIGN KEY RELATIONSHIPS
-- ============================================================================

-- Fix inconsistent foreign key references
-- Some tables reference auth.users.id while others reference public.profiles.id
-- We need to standardize this

-- Drop problematic foreign keys first
ALTER TABLE public.contact_followups DROP CONSTRAINT IF EXISTS contact_followups_user_id_fkey;
ALTER TABLE public.connection_requests DROP CONSTRAINT IF EXISTS connection_requests_target_user_id_fkey;
ALTER TABLE public.email_invitations DROP CONSTRAINT IF EXISTS email_invitations_registered_user_id_fkey;
ALTER TABLE public.qr_scan_tracking DROP CONSTRAINT IF EXISTS qr_scan_tracking_user_id_fkey;
ALTER TABLE public.qr_scan_tracking DROP CONSTRAINT IF EXISTS qr_scan_tracking_scanner_user_id_fkey;
ALTER TABLE public.needs DROP CONSTRAINT IF EXISTS needs_user_id_fkey;
ALTER TABLE public.need_replies DROP CONSTRAINT IF EXISTS need_replies_user_id_fkey;
ALTER TABLE public.need_replies DROP CONSTRAINT IF EXISTS need_replies_reply_to_user_id_fkey;

-- Recreate foreign keys with consistent references to profiles table
ALTER TABLE public.contact_followups 
ADD CONSTRAINT contact_followups_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.connection_requests 
ADD CONSTRAINT connection_requests_target_user_id_fkey 
FOREIGN KEY (target_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.email_invitations 
ADD CONSTRAINT email_invitations_registered_user_id_fkey 
FOREIGN KEY (registered_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.qr_scan_tracking 
ADD CONSTRAINT qr_scan_tracking_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.qr_scan_tracking 
ADD CONSTRAINT qr_scan_tracking_scanner_user_id_fkey 
FOREIGN KEY (scanner_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.needs 
ADD CONSTRAINT needs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.need_replies 
ADD CONSTRAINT need_replies_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.need_replies 
ADD CONSTRAINT need_replies_reply_to_user_id_fkey 
FOREIGN KEY (reply_to_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ============================================================================
-- 3. CONSOLIDATE DUPLICATE TABLES
-- ============================================================================

-- The following tables appear to be duplicates or have overlapping functionality:
-- - qr_codes and connection_codes (both handle QR code functionality)
-- - contacts and test_connections (both handle contact management)
-- - profiles and test_profiles (both handle user profiles)

-- First, let's migrate data from test tables to main tables if needed
-- (This is a safety measure - in production, you might want to review this)

-- Migrate test_profiles to profiles (only if profiles don't exist)
INSERT INTO public.profiles (
    id, email, first_name, last_name, company, job_title, industry,
    profile_image, cover_image, bio, interests, social_links, public_profile,
    created_at, updated_at
)
SELECT 
    user_id as id,
    tu.email,
    tu.first_name,
    tu.last_name,
    tu.company,
    tp.job_title,
    tp.industry,
    tp.profile_image,
    tp.cover_image,
    tp.bio,
    tp.interests,
    tp.social_links,
    tp.public_profile,
    tp.created_at,
    tp.updated_at
FROM public.test_profiles tp
JOIN public.test_users tu ON tp.user_id = tu.id
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = tp.user_id
);

-- Migrate test_connections to contacts (only if contacts don't exist)
INSERT INTO public.contacts (
    id, user_id, name, email, phone, company, job_title, profile_image,
    meeting_context, meeting_date, tags, created_at, updated_at
)
SELECT 
    tc.id,
    tc.user_id,
    tc.name,
    tc.email,
    tc.phone,
    tc.company,
    tc.job_title,
    tc.profile_image,
    tc.meeting_context,
    tc.meeting_date,
    tc.tags,
    tc.created_at,
    tc.updated_at
FROM public.test_connections tc
WHERE NOT EXISTS (
    SELECT 1 FROM public.contacts c WHERE c.id = tc.id
);

-- ============================================================================
-- 4. CLEAN UP TEST TABLES
-- ============================================================================

-- Drop test tables after data migration
DROP TABLE IF EXISTS public.test_profiles CASCADE;
DROP TABLE IF EXISTS public.test_connections CASCADE;
DROP TABLE IF EXISTS public.test_users CASCADE;

-- ============================================================================
-- 5. CONSOLIDATE QR CODE TABLES
-- ============================================================================

-- qr_codes and connection_codes serve similar purposes
-- Let's consolidate them by adding missing columns to connection_codes
-- and then dropping qr_codes

-- Add missing columns to connection_codes
ALTER TABLE public.connection_codes 
ADD COLUMN IF NOT EXISTS scan_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_scanned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_scan_location JSONB;

-- Migrate data from qr_codes to connection_codes if needed
INSERT INTO public.connection_codes (
    id, code, user_id, scanned_by, scanned_at, location, status, 
    created_at, expires_at, is_active, scan_count, last_scanned_at, last_scan_location
)
SELECT 
    id, code, user_id, scanned_by, scanned_at, location, status,
    created_at, expires_at, true, 0, scanned_at, location
FROM public.qr_codes
WHERE NOT EXISTS (
    SELECT 1 FROM public.connection_codes cc WHERE cc.id = qr_codes.id
);

-- Drop the duplicate qr_codes table
DROP TABLE IF EXISTS public.qr_codes CASCADE;

-- ============================================================================
-- 6. ADD MISSING INDEXES FOR PERFORMANCE
-- ============================================================================

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_complete ON public.profiles(onboarding_complete);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
CREATE INDEX IF NOT EXISTS idx_connection_codes_user_id ON public.connection_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_connection_codes_code ON public.connection_codes(code);
CREATE INDEX IF NOT EXISTS idx_connection_codes_status ON public.connection_codes(status);
CREATE INDEX IF NOT EXISTS idx_connection_requests_user_id ON public.connection_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_status ON public.connection_requests(status);
CREATE INDEX IF NOT EXISTS idx_qr_scan_tracking_scan_id ON public.qr_scan_tracking(scan_id);
CREATE INDEX IF NOT EXISTS idx_qr_scan_tracking_user_id ON public.qr_scan_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_email_invitations_recipient_email ON public.email_invitations(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_invitations_status ON public.email_invitations(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_follow_ups_user_id ON public.follow_ups(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_contact_id ON public.follow_ups(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_notes_user_id ON public.contact_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_notes_contact_id ON public.contact_notes(contact_id);

-- ============================================================================
-- 7. UPDATE RLS POLICIES
-- ============================================================================

-- Enable RLS on new analytics tables
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_journeys ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for analytics tables
CREATE POLICY "Users can view their own analytics events" ON public.analytics_events
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own analytics events" ON public.analytics_events
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own user journeys" ON public.user_journeys
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own user journeys" ON public.user_journeys
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own user journeys" ON public.user_journeys
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- ============================================================================
-- 8. CREATE HELPFUL VIEWS
-- ============================================================================

-- Create a view for user analytics summary
CREATE OR REPLACE VIEW public.user_analytics_summary AS
SELECT 
    p.id as user_id,
    p.email,
    p.first_name,
    p.last_name,
    p.created_at as user_created_at,
    p.onboarding_complete,
    p.onboarding_completed_at,
    COUNT(DISTINCT ae.session_id) as total_sessions,
    COUNT(ae.id) as total_events,
    COUNT(CASE WHEN ae.event_name = 'page_view' THEN 1 END) as page_views,
    COUNT(CASE WHEN ae.event_name = 'registration_completed' THEN 1 END) as registrations,
    COUNT(CASE WHEN ae.event_name = 'email_confirmed' THEN 1 END) as email_confirmations,
    COUNT(CASE WHEN ae.event_name = 'onboarding_completed' THEN 1 END) as onboarding_completions,
    COUNT(CASE WHEN ae.event_name = 'profile_created' THEN 1 END) as profile_creations,
    COUNT(CASE WHEN ae.event_name = 'connection_made' THEN 1 END) as connections_made,
    COUNT(CASE WHEN ae.event_name = 'qr_code_generated' THEN 1 END) as qr_codes_generated,
    COUNT(CASE WHEN ae.event_name = 'qr_code_scanned' THEN 1 END) as qr_codes_scanned,
    MAX(ae.timestamp) as last_activity
FROM public.profiles p
LEFT JOIN public.analytics_events ae ON p.id = ae.user_id
GROUP BY p.id, p.email, p.first_name, p.last_name, p.created_at, p.onboarding_complete, p.onboarding_completed_at;

-- Create a view for conversion funnel analysis
CREATE OR REPLACE VIEW public.conversion_funnel_analysis AS
WITH funnel_data AS (
    SELECT 
        DATE_TRUNC('day', timestamp) as date,
        COUNT(CASE WHEN event_name = 'registration_started' THEN 1 END) as registrations_started,
        COUNT(CASE WHEN event_name = 'registration_completed' THEN 1 END) as registrations_completed,
        COUNT(CASE WHEN event_name = 'email_confirmed' THEN 1 END) as email_confirmations,
        COUNT(CASE WHEN event_name = 'onboarding_started' THEN 1 END) as onboarding_started,
        COUNT(CASE WHEN event_name = 'onboarding_completed' THEN 1 END) as onboarding_completed,
        COUNT(CASE WHEN event_name = 'profile_created' THEN 1 END) as profiles_created,
        COUNT(CASE WHEN event_name = 'connection_made' THEN 1 END) as connections_made
    FROM public.analytics_events
    WHERE event_type = 'business'
    GROUP BY DATE_TRUNC('day', timestamp)
)
SELECT 
    date,
    registrations_started,
    registrations_completed,
    email_confirmations,
    onboarding_started,
    onboarding_completed,
    profiles_created,
    connections_made,
    CASE 
        WHEN registrations_started > 0 
        THEN (registrations_completed::float / registrations_started * 100)::numeric(5,2)
        ELSE 0 
    END as registration_conversion_rate,
    CASE 
        WHEN registrations_completed > 0 
        THEN (email_confirmations::float / registrations_completed * 100)::numeric(5,2)
        ELSE 0 
    END as email_confirmation_rate,
    CASE 
        WHEN email_confirmations > 0 
        THEN (onboarding_completed::float / email_confirmations * 100)::numeric(5,2)
        ELSE 0 
    END as onboarding_completion_rate,
    CASE 
        WHEN onboarding_completed > 0 
        THEN (profiles_created::float / onboarding_completed * 100)::numeric(5,2)
        ELSE 0 
    END as profile_creation_rate
FROM funnel_data
ORDER BY date DESC;

-- ============================================================================
-- 9. CREATE USEFUL FUNCTIONS
-- ============================================================================

-- Function to get user conversion metrics
CREATE OR REPLACE FUNCTION public.get_user_conversion_metrics(user_uuid UUID)
RETURNS TABLE (
    total_events BIGINT,
    page_views BIGINT,
    registrations BIGINT,
    email_confirmations BIGINT,
    onboarding_completions BIGINT,
    profile_creations BIGINT,
    connections_made BIGINT,
    qr_codes_generated BIGINT,
    qr_codes_scanned BIGINT,
    last_activity TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(ae.id) as total_events,
        COUNT(CASE WHEN ae.event_name = 'page_view' THEN 1 END) as page_views,
        COUNT(CASE WHEN ae.event_name = 'registration_completed' THEN 1 END) as registrations,
        COUNT(CASE WHEN ae.event_name = 'email_confirmed' THEN 1 END) as email_confirmations,
        COUNT(CASE WHEN ae.event_name = 'onboarding_completed' THEN 1 END) as onboarding_completions,
        COUNT(CASE WHEN ae.event_name = 'profile_created' THEN 1 END) as profile_creations,
        COUNT(CASE WHEN ae.event_name = 'connection_made' THEN 1 END) as connections_made,
        COUNT(CASE WHEN ae.event_name = 'qr_code_generated' THEN 1 END) as qr_codes_generated,
        COUNT(CASE WHEN ae.event_name = 'qr_code_scanned' THEN 1 END) as qr_codes_scanned,
        MAX(ae.timestamp) as last_activity
    FROM public.analytics_events ae
    WHERE ae.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old analytics data
CREATE OR REPLACE FUNCTION public.cleanup_old_analytics_data(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete old analytics events
    DELETE FROM public.analytics_events 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete old user journeys that are completed or abandoned
    DELETE FROM public.user_journeys 
    WHERE (completed_at IS NOT NULL OR abandoned_at IS NOT NULL)
    AND created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. FINAL CLEANUP AND OPTIMIZATION
-- ============================================================================

-- Update table statistics
ANALYZE public.analytics_events;
ANALYZE public.user_journeys;
ANALYZE public.profiles;
ANALYZE public.contacts;
ANALYZE public.connection_codes;
ANALYZE public.connection_requests;
ANALYZE public.qr_scan_tracking;
ANALYZE public.email_invitations;

-- Add comments to tables for documentation
COMMENT ON TABLE public.analytics_events IS 'Tracks user behavior and business events for analytics';
COMMENT ON TABLE public.user_journeys IS 'Tracks user conversion funnels and journey progression';
COMMENT ON TABLE public.profiles IS 'Main user profiles table - consolidated from test tables';
COMMENT ON TABLE public.contacts IS 'User contacts - consolidated from test tables';
COMMENT ON TABLE public.connection_codes IS 'QR codes for connections - consolidated from qr_codes table';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log the completion
INSERT INTO public.analytics_events (
    session_id, event_type, event_name, properties, timestamp
) VALUES (
    'migration_' || gen_random_uuid()::text,
    'business',
    'database_schema_migration_completed',
    '{"migration_version": "1.0", "tables_consolidated": ["test_profiles", "test_connections", "test_users", "qr_codes"], "foreign_keys_fixed": true, "analytics_tables_created": true}',
    NOW()
);
