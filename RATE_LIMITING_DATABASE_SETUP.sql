-- Rate Limiting Database Setup
-- Create table and policies for server-side rate limiting

-- Create rate_limiting table
CREATE TABLE IF NOT EXISTS rate_limiting (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL,
  identifier TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limiting_key ON rate_limiting(key);
CREATE INDEX IF NOT EXISTS idx_rate_limiting_identifier ON rate_limiting(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limiting_created_at ON rate_limiting(created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limiting_key_created_at ON rate_limiting(key, created_at);

-- Enable RLS
ALTER TABLE rate_limiting ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow system to manage rate limiting data
CREATE POLICY "System can manage rate limiting" ON rate_limiting
  FOR ALL USING (true);

-- Allow users to read their own rate limiting data (for debugging)
CREATE POLICY "Users can read their own rate limiting data" ON rate_limiting
  FOR SELECT USING (identifier = auth.uid()::text);

-- Create function to clean up old rate limiting data
CREATE OR REPLACE FUNCTION cleanup_old_rate_limiting()
RETURNS void AS $$
BEGIN
  -- Delete rate limiting records older than 24 hours
  DELETE FROM rate_limiting 
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old data (if pg_cron is available)
-- This would typically be set up in the Supabase dashboard
-- SELECT cron.schedule('cleanup-rate-limiting', '0 * * * *', 'SELECT cleanup_old_rate_limiting();');

-- Grant necessary permissions
GRANT ALL ON rate_limiting TO authenticated;
GRANT ALL ON rate_limiting TO anon;
GRANT EXECUTE ON FUNCTION cleanup_old_rate_limiting() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_rate_limiting() TO anon;

-- Verify table creation
SELECT 'Rate limiting table created successfully' as status;
SELECT COUNT(*) as existing_records FROM rate_limiting;
