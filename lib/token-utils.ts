import crypto from 'crypto'

/**
 * Generate a cryptographically secure random token
 * @param length - Length of the token (default: 32)
 * @returns Random token string
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Generate a password reset token
 * @returns Password reset token
 */
export function generatePasswordResetToken(): string {
  return generateSecureToken(32)
}

/**
 * Generate an email verification token
 * @returns Email verification token
 */
export function generateEmailVerificationToken(): string {
  return generateSecureToken(32)
}

/**
 * Generate a refresh token
 * @returns Refresh token
 */
export function generateRefreshToken(): string {
  return generateSecureToken(64)
}

/**
 * Create token expiration timestamp
 * @param hours - Hours from now until expiration
 * @returns ISO string of expiration timestamp
 */
export function createTokenExpiration(hours: number): string {
  const expiration = new Date()
  expiration.setHours(expiration.getHours() + hours)
  return expiration.toISOString()
}

/**
 * Check if a token has expired
 * @param expiresAt - Expiration timestamp string
 * @returns True if token is expired
 */
export function isTokenExpired(expiresAt: string): boolean {
  return new Date() > new Date(expiresAt)
}

/**
 * Create secure hash for token verification
 * @param token - Token to hash
 * @returns Hashed token
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Verify token against hash
 * @param token - Token to verify
 * @param hash - Hash to verify against
 * @returns True if token matches hash
 */
export function verifyTokenHash(token: string, hash: string): boolean {
  return hashToken(token) === hash
}

/**
 * Generate a random numeric code (for email verification)
 * @param length - Length of the code (default: 6)
 * @returns Numeric code string
 */
export function generateNumericCode(length: number = 6): string {
  const digits = '0123456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += digits.charAt(crypto.randomInt(0, digits.length))
  }
  return code
}

/**
 * Validate token format
 * @param token - Token to validate
 * @returns True if token format is valid
 */
export function isValidTokenFormat(token: string): boolean {
  // Basic validation: should be alphanumeric, 32+ characters for security
  return /^[a-zA-Z0-9]{32,}$/.test(token)
}

/**
 * Create token metadata for logging
 * @param tokenType - Type of token (password_reset, email_verification, refresh)
 * @param userId - User ID
 * @param expiresAt - Expiration timestamp
 * @returns Token metadata object
 */
export function createTokenMetadata(
  tokenType: string,
  userId: string,
  expiresAt: string
) {
  return {
    type: tokenType,
    userId,
    expiresAt,
    createdAt: new Date().toISOString(),
    expiresInSeconds: Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
  }
}