-- Create failed_login_attempts table
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email ON failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_ip_address ON failed_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_attempted_at ON failed_login_attempts(attempted_at);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_created_at ON failed_login_attempts(created_at);

-- Enable RLS
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - Service role can manage all failed login attempts
CREATE POLICY "Service role full access to failed login attempts" ON failed_login_attempts
  FOR ALL USING (
    auth.role() = 'service_role'
  );

-- Create function to clean up old failed login attempts (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_failed_login_attempts()
RETURNS void AS $$
BEGIN
  DELETE FROM failed_login_attempts
  WHERE attempted_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Create function to get failed login count for an email in the last hour
CREATE OR REPLACE FUNCTION get_failed_login_count_last_hour(
  p_email VARCHAR(255)
) RETURNS INTEGER AS $$
DECLARE
  attempt_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO attempt_count
  FROM failed_login_attempts
  WHERE email = p_email
    AND attempted_at > NOW() - INTERVAL '1 hour';

  RETURN COALESCE(attempt_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to get failed login count for an IP in the last hour
CREATE OR REPLACE FUNCTION get_failed_login_count_last_hour_by_ip(
  p_ip_address INET
) RETURNS INTEGER AS $$
DECLARE
  attempt_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO attempt_count
  FROM failed_login_attempts
  WHERE ip_address = p_ip_address
    AND attempted_at > NOW() - INTERVAL '1 hour';

  RETURN COALESCE(attempt_count, 0);
END;
$$ LANGUAGE plpgsql;