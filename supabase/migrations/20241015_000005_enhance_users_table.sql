-- Add new columns to existing users table for enhanced authentication
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token_expires_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_email_verified_at ON users(email_verified_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at);
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until);
CREATE INDEX IF NOT EXISTS idx_users_refresh_token ON users(refresh_token);

-- Create function to check if user account is locked
CREATE OR REPLACE FUNCTION is_user_locked(
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  locked_until_time TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT locked_until INTO locked_until_time
  FROM users
  WHERE id = p_user_id;

  RETURN COALESCE(locked_until_time > NOW(), FALSE);
END;
$$ LANGUAGE plpgsql;

-- Create function to lock user account
CREATE OR REPLACE FUNCTION lock_user_account(
  p_user_id UUID,
  p_duration_minutes INTEGER DEFAULT 15
) RETURNS BOOLEAN AS $$
DECLARE
  lock_until_time TIMESTAMP WITH TIME ZONE;
BEGIN
  lock_until_time := NOW() + (p_duration_minutes || ' minutes')::INTERVAL;

  UPDATE users
  SET
    locked_until = lock_until_time,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Log the account lockout event
  PERFORM log_audit_event(
    p_user_id,
    'ACCOUNT_LOCKED',
    'user',
    p_user_id,
    jsonb_build_object('locked_until', lock_until_time, 'duration_minutes', p_duration_minutes)
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to unlock user account
CREATE OR REPLACE FUNCTION unlock_user_account(
  p_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE users
  SET
    locked_until = NULL,
    failed_login_attempts = 0,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Log the account unlock event
  PERFORM log_audit_event(
    p_user_id,
    'ACCOUNT_UNLOCKED',
    'user',
    p_user_id
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to update user login information
CREATE OR REPLACE FUNCTION update_user_login(
  p_user_id UUID,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE users
  SET
    last_login_at = NOW(),
    login_count = COALESCE(login_count, 0) + 1,
    failed_login_attempts = 0,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Log the successful login event
  PERFORM log_audit_event(
    p_user_id,
    'LOGIN_SUCCESS',
    'user',
    p_user_id,
    jsonb_build_object('ip_address', p_ip_address::TEXT, 'login_count', COALESCE((SELECT login_count FROM users WHERE id = p_user_id), 0) + 1),
    p_ip_address,
    p_user_agent
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;