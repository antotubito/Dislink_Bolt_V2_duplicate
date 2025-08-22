-- ===============================================
-- CRITICAL MVP FIXES - RUN IN SUPABASE SQL EDITOR
-- ===============================================

-- 1. Fix waitlist table RLS policies for public email collection
DROP POLICY IF EXISTS "Only authenticated users can view waitlist" ON waitlist;

-- Allow public email signups (homepage forms)
CREATE POLICY "Allow public waitlist signups" ON waitlist
  FOR INSERT WITH CHECK (true);

-- Allow public duplicate email checks  
CREATE POLICY "Allow public email duplicate checks" ON waitlist
  FOR SELECT USING (true);

-- Keep admin access for viewing full waitlist
CREATE POLICY "Authenticated users can view full waitlist" ON waitlist
  FOR ALL USING (auth.role() = 'authenticated');

-- 2. Create email_logs table if missing
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  recipient TEXT NOT NULL, 
  subject TEXT NOT NULL,
  data JSONB,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for email_logs
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(type);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);

-- Enable RLS on email_logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_logs
CREATE POLICY "Allow service role to manage email logs" ON email_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can view their email logs" ON email_logs
  FOR SELECT USING (auth.role() = 'authenticated');

COMMIT;
