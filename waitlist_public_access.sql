-- Fix waitlist table RLS policies to allow public email signups
-- This allows anonymous users to submit emails on the homepage

-- Remove the restrictive policies
DROP POLICY IF EXISTS "Only authenticated users can view waitlist" ON waitlist;

-- Add public INSERT policy for email signups
CREATE POLICY "Allow public waitlist signups" ON waitlist
  FOR INSERT WITH CHECK (true);

-- Keep admin-only SELECT policy (authenticated users can view the list)
CREATE POLICY "Only authenticated users can view waitlist" ON waitlist
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow public access to check for duplicate emails (needed for the form)
CREATE POLICY "Allow public email duplicate checks" ON waitlist
  FOR SELECT USING (true);

COMMIT;
