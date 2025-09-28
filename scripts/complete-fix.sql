-- =====================================================
-- COMPLETE FIX FOR ALL USERS TABLE DEPENDENCIES
-- Based on Supabase Debug Assistant recommendations
-- =====================================================

-- Step 1: Drop existing FKs that point to public.users
ALTER TABLE public.security_questions DROP CONSTRAINT IF EXISTS security_questions_user_id_fkey;
ALTER TABLE public.profile_updates DROP CONSTRAINT IF EXISTS profile_updates_user_id_fkey;
ALTER TABLE public.contacts DROP CONSTRAINT IF EXISTS contacts_user_id_fkey;

-- Drop additional FKs that might point to users table
ALTER TABLE public.qr_scan_events DROP CONSTRAINT IF EXISTS qr_scan_events_scanner_id_fkey;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- Step 2: Re-create FKs to reference public.profiles instead of public.users
ALTER TABLE public.security_questions
  ADD CONSTRAINT security_questions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.profile_updates
  ADD CONSTRAINT profile_updates_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.contacts
  ADD CONSTRAINT contacts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.qr_scan_events
  ADD CONSTRAINT qr_scan_events_scanner_id_fkey
  FOREIGN KEY (scanner_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Step 3: Add indexes on FK columns to improve join performance
CREATE INDEX IF NOT EXISTS idx_security_questions_user_id ON public.security_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_updates_user_id ON public.profile_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_scan_events_scanner_id ON public.qr_scan_events(scanner_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- Step 4: Verification - Check for any remaining dependencies
SELECT 'Checking for remaining dependencies on users table...' as status;

-- List any foreign key constraints referencing public.users
SELECT
  tc.table_schema,
  tc.table_name,
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (ccu.table_name = 'users' AND ccu.table_schema = 'public');

-- Step 5: Check for orphaned records (should be 0 since tables are empty)
SELECT COUNT(*) AS orphan_security_questions
FROM public.security_questions sq
LEFT JOIN public.profiles p ON p.id = sq.user_id
WHERE p.id IS NULL;

SELECT COUNT(*) AS orphan_profile_updates
FROM public.profile_updates pu
LEFT JOIN public.profiles p ON p.id = pu.user_id
WHERE p.id IS NULL;

SELECT COUNT(*) AS orphan_contacts
FROM public.contacts c
LEFT JOIN public.profiles p ON p.id = c.user_id
WHERE p.id IS NULL;

-- Step 6: If verification shows no dependencies, drop the users table
-- (This will only run if no foreign keys are found)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND (ccu.table_name = 'users' AND ccu.table_schema = 'public')
    ) THEN
        DROP TABLE IF EXISTS public.users;
        RAISE NOTICE 'Users table dropped successfully!';
    ELSE
        RAISE NOTICE 'Users table still has dependencies. Please check the verification results above.';
    END IF;
END $$;

-- Final verification
SELECT 'Database fix completed. Check results above for any remaining issues.' AS final_status;
