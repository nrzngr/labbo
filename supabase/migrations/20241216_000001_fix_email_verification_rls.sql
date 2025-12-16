-- Allow users to insert their own tokens
CREATE POLICY "Users can insert own email verification tokens" ON email_verification_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own tokens (e.g. to invalidate old ones)
CREATE POLICY "Users can update own email verification tokens" ON email_verification_tokens
  FOR UPDATE USING (auth.uid() = user_id);
