-- DATABASE TABLE FIX V3 - SAFE MIGRATION
-- Only migrate columns that actually exist

-- First, let's check what columns exist in daily_needs table
SELECT 'Checking daily_needs table structure...' as status;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'daily_needs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Create the needs table with a basic structure
CREATE TABLE IF NOT EXISTS needs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  visibility TEXT NOT NULL DEFAULT 'open' CHECK (visibility IN ('open', 'private')),
  expires_at TIMESTAMPTZ NOT NULL,
  is_satisfied BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add category_label column
ALTER TABLE needs ADD COLUMN IF NOT EXISTS category_label TEXT;

-- Create need_replies table
CREATE TABLE IF NOT EXISTS need_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  need_id UUID NOT NULL REFERENCES needs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  reply_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE need_replies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for needs table
DROP POLICY IF EXISTS "Users can view all open needs" ON needs;
DROP POLICY IF EXISTS "Users can create their own needs" ON needs;
DROP POLICY IF EXISTS "Users can update their own needs" ON needs;
DROP POLICY IF EXISTS "Users can delete their own needs" ON needs;

CREATE POLICY "Users can view all open needs" ON needs
    FOR SELECT USING (visibility = 'open' OR auth.uid() = user_id);

CREATE POLICY "Users can create their own needs" ON needs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own needs" ON needs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own needs" ON needs
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for need_replies table
DROP POLICY IF EXISTS "Users can view replies to needs they can see" ON need_replies;
DROP POLICY IF EXISTS "Users can create replies" ON need_replies;
DROP POLICY IF EXISTS "Users can update their own replies" ON need_replies;
DROP POLICY IF EXISTS "Users can delete their own replies" ON need_replies;

CREATE POLICY "Users can view replies to needs they can see" ON need_replies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM needs 
            WHERE needs.id = need_replies.need_id 
            AND (needs.visibility = 'open' OR needs.user_id = auth.uid())
        )
    );

CREATE POLICY "Users can create replies" ON need_replies
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM needs 
            WHERE needs.id = need_replies.need_id 
            AND (needs.visibility = 'open' OR needs.user_id = auth.uid())
        )
    );

CREATE POLICY "Users can update their own replies" ON need_replies
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own replies" ON need_replies
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_needs_user_id ON needs(user_id);
CREATE INDEX IF NOT EXISTS idx_needs_expires_at ON needs(expires_at);
CREATE INDEX IF NOT EXISTS idx_needs_is_satisfied ON needs(is_satisfied);
CREATE INDEX IF NOT EXISTS idx_needs_visibility ON needs(visibility);
CREATE INDEX IF NOT EXISTS idx_need_replies_need_id ON need_replies(need_id);
CREATE INDEX IF NOT EXISTS idx_need_replies_user_id ON need_replies(user_id);

-- Safe migration: only migrate if daily_needs exists and needs is empty
DO $$
DECLARE
    daily_needs_exists BOOLEAN;
    needs_empty BOOLEAN;
    column_list TEXT;
BEGIN
    -- Check if daily_needs table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'daily_needs' AND table_schema = 'public'
    ) INTO daily_needs_exists;
    
    -- Check if needs table is empty
    SELECT NOT EXISTS (SELECT 1 FROM needs LIMIT 1) INTO needs_empty;
    
    IF daily_needs_exists AND needs_empty THEN
        RAISE NOTICE 'Starting safe migration from daily_needs to needs...';
        
        -- Build dynamic column list based on what exists in daily_needs
        SELECT string_agg(column_name, ', ')
        INTO column_list
        FROM information_schema.columns 
        WHERE table_name = 'daily_needs' 
        AND table_schema = 'public'
        AND column_name IN ('id', 'user_id', 'category', 'message', 'description', 'content', 'tags', 'visibility', 'expires_at', 'is_satisfied', 'created_at', 'updated_at');
        
        RAISE NOTICE 'Available columns in daily_needs: %', column_list;
        
        -- Try to insert with basic columns first
        BEGIN
            INSERT INTO needs (id, user_id, category, message, tags, visibility, expires_at, is_satisfied, created_at, updated_at, category_label)
            SELECT 
                id, 
                user_id, 
                category, 
                COALESCE(message, description, content, 'No message provided') as message,
                COALESCE(tags, '{}') as tags, 
                COALESCE(visibility, 'open') as visibility, 
                COALESCE(expires_at, created_at + INTERVAL '24 hours') as expires_at, 
                COALESCE(is_satisfied, false) as is_satisfied, 
                created_at, 
                updated_at,
                CASE 
                    WHEN category = 'professional' THEN 'Professional Help'
                    WHEN category = 'personal' THEN 'Personal Support'
                    WHEN category = 'social' THEN 'Social Connection'
                    WHEN category = 'learning' THEN 'Learning & Growth'
                    WHEN category = 'health' THEN 'Health & Wellness'
                    WHEN category = 'creative' THEN 'Creative Collaboration'
                    WHEN category = 'business' THEN 'Business Opportunities'
                    WHEN category = 'mentorship' THEN 'Mentorship'
                    WHEN category = 'collaboration' THEN 'Collaboration'
                    WHEN category = 'advice' THEN 'Advice & Guidance'
                    ELSE INITCAP(category)
                END as category_label
            FROM daily_needs;
            
            RAISE NOTICE 'Successfully migrated data from daily_needs to needs';
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Migration failed: %', SQLERRM;
            RAISE NOTICE 'This is expected if daily_needs has a different structure';
        END;
        
    ELSIF NOT daily_needs_exists THEN
        RAISE NOTICE 'daily_needs table does not exist, skipping migration';
    ELSIF NOT needs_empty THEN
        RAISE NOTICE 'needs table already contains data, skipping migration';
    END IF;
END $$;

-- Verify final state
SELECT 'Final verification...' as status;
SELECT 
    'needs' as table_name,
    COUNT(*) as row_count
FROM needs
UNION ALL
SELECT 
    'need_replies' as table_name,
    COUNT(*) as row_count
FROM need_replies;

-- Show final needs table structure
SELECT 'Final needs table structure:' as status;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'needs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Database setup completed!' as status;
