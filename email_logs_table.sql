-- Create email_logs table for email tracking
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL, -- 'waitlist_confirmation', 'connection_request', etc.
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  data JSONB,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(type);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin only access)
CREATE POLICY "Only authenticated users can view email logs" ON email_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can insert email logs" ON email_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

COMMIT;
