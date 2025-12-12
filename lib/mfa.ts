import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import crypto from 'crypto'

/**
 * MFA (Multi-Factor Authentication) Utility Functions
 * Implements TOTP-based 2FA with backup codes support
 */

export interface MFASecret {
  secret: string
  backupCodes: string[]
  qrCodeUrl?: string
}

export interface MFAVerificationResult {
  valid: boolean
  error?: string
}

/**
 * Generate a new TOTP secret for MFA
 */
export function generateMFASecret(): string {
  return authenticator.generateSecret()
}

/**
 * Generate TOTP QR code URL for authenticator apps
 */
export function generateQRCodeURL(email: string, secret: string): string {
  return authenticator.keyuri(email, 'Lab Inventory System', secret)
}

/**
 * Generate QR code image data URL
 */
export async function generateQRCodeImage(url: string): Promise<string> {
  try {
    return await QRCode.toDataURL(url)
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

/**
 * Verify TOTP token
 */
export function verifyTOTPToken(token: string, secret: string): MFAVerificationResult {
  try {
    const isValid = authenticator.verify({ token, secret })

    if (!isValid) {
      // Check if token is expired (older than current window)
      const currentTime = Math.floor(Date.now() / 1000)
      const tokenTime = authenticator.timeUsed()

      if (Math.abs(currentTime - tokenTime) > 30) {
        return { valid: false, error: 'Token has expired' }
      }

      return { valid: false, error: 'Invalid token' }
    }

    return { valid: true }
  } catch (error) {
    console.error('Error verifying TOTP token:', error)
    return { valid: false, error: 'Token verification failed' }
  }
}

/**
 * Generate backup codes for account recovery
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = []

  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    codes.push(code)
  }

  return codes
}

/**
 * Verify backup code
 */
export function verifyBackupCode(code: string, backupCodes: string[]): boolean {
  const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return backupCodes.includes(normalizedCode)
}

/**
 * Remove used backup code
 */
export function removeBackupCode(code: string, backupCodes: string[]): string[] {
  const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return backupCodes.filter(c => c !== normalizedCode)
}

/**
 * Encrypt MFA secret for storage
 */
export function encryptMFASecret(secret: string): string {
  const key = process.env.MFA_ENCRYPTION_KEY
  if (!key) {
    throw new Error('MFA_ENCRYPTION_KEY environment variable not set')
  }

  const algorithm = 'aes-256-gcm'
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv)

  let encrypted = cipher.update(secret, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
}

/**
 * Decrypt MFA secret for usage
 */
export function decryptMFASecret(encryptedSecret: string): string {
  const key = process.env.MFA_ENCRYPTION_KEY
  if (!key) {
    throw new Error('MFA_ENCRYPTION_KEY environment variable not set')
  }

  const algorithm = 'aes-256-gcm'
  const parts = encryptedSecret.split(':')

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted secret format')
  }

  const iv = Buffer.from(parts[0], 'hex')
  const authTag = Buffer.from(parts[1], 'hex')
  const encrypted = parts[2]

  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Generate MFA setup response
 */
export async function generateMFASetup(email: string): Promise<MFASecret> {
  const secret = generateMFASecret()
  const backupCodes = generateBackupCodes()
  const qrCodeURL = generateQRCodeURL(email, secret)
  const qrCodeImage = await generateQRCodeImage(qrCodeURL)

  return {
    secret,
    backupCodes,
    qrCodeUrl: qrCodeImage
  }
}

/**
 * Check if user has MFA enabled
 */
export function isMFAEnabled(user: any): boolean {
  return !!(user.mfa_secret && user.mfa_enabled)
}

/**
 * Get remaining backup codes count
 */
export function getBackupCodesCount(user: any): number {
  if (!user.backup_codes) return 0

  try {
    const backupCodes = JSON.parse(user.backup_codes)
    return Array.isArray(backupCodes) ? backupCodes.length : 0
  } catch {
    return 0
  }
}