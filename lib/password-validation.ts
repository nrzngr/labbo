import { z } from 'zod'

/**
 * Password Validation and Security
 * Implements strong password policies and breach detection
 */

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong' | 'very-strong'
  score: number
}

export interface BreachedPasswordResult {
  isBreached: boolean
  breachCount?: number
  message?: string
}

/**
 * Password complexity validation schema
 */
export const passwordSchema = z.object({
  password: z
    .string()
    .min(12, 'Kata sandi minimal harus 12 karakter')
    .max(128, 'Kata sandi tidak boleh melebihi 128 karakter')
    .regex(/[A-Z]/, 'Password harus mengandung setidaknya satu huruf besar')
    .regex(/[a-z]/, 'Password harus mengandung setidaknya satu huruf kecil')
    .regex(/[0-9]/, 'Password harus mengandung setidaknya satu angka')
    .regex(/[^A-Za-z0-9]/, 'Password harus mengandung setidaknya satu karakter khusus')
    .regex(/^(?!.*(.).*\1).*$/, 'Password tidak boleh mengandung karakter yang sama')
    .regex(/^(?!.*(123|abc|qwe|password|admin|user)).*$/i, 'Password tidak boleh mengandung pola umum')
})

/**
 * Calculate password strength score
 */
export function calculatePasswordStrength(password: string): {
  strength: 'weak' | 'medium' | 'strong' | 'very-strong'
  score: number
} {
  let score = 0

  // Length contribution (max 30 points)
  if (password.length >= 12) score += 30
  if (password.length >= 16) score += 10
  if (password.length >= 20) score += 10

  // Character variety (max 40 points)
  if (/[a-z]/.test(password)) score += 10
  if (/[A-Z]/.test(password)) score += 10
  if (/[0-9]/.test(password)) score += 10
  if (/[^A-Za-z0-9]/.test(password)) score += 10

  // Complexity (max 30 points)
  const uniqueChars = new Set(password).size
  if (uniqueChars >= password.length * 0.6) score += 15
  if (uniqueChars >= password.length * 0.8) score += 15

  // Determine strength level
  let strength: 'weak' | 'medium' | 'strong' | 'very-strong'
  if (score < 40) strength = 'weak'
  else if (score < 60) strength = 'medium'
  else if (score < 80) strength = 'strong'
  else strength = 'very-strong'

  return { strength, score }
}

/**
 * Validate password against security requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []

  try {
    passwordSchema.parse({ password })
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.issues.map(e => e.message))
    }
  }

  // Additional validation checks
  if (password.toLowerCase().includes('password')) {
    errors.push('Password tidak boleh mengandung kata "password"')
  }

  if (password.toLowerCase().includes('labinventory')) {
    errors.push('Password tidak boleh mengandung nama aplikasi')
  }

  // Check for common passwords
  const commonPasswords = [
    '123456', '123456789', 'qwerty', 'abc123', 'password123',
    'admin123', 'letmein', 'welcome', 'monkey', 'dragon'
  ]

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password terlalu umum dan mudah ditebak')
  }

  const { strength, score } = calculatePasswordStrength(password)

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score
  }
}

/**
 * Check if password has been breached using HaveIBeenPwned API
 */
export async function checkBreachedPassword(
  password: string
): Promise<BreachedPasswordResult> {
  try {
    // Create SHA-1 hash of the password
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-1', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()

    // Use k-anonymity model: send first 5 chars of hash
    const prefix = hashHex.substring(0, 5)
    const suffix = hashHex.substring(5)

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Lab-Inventory-System',
        'Add-Padding': 'true'
      }
    })

    if (!response.ok) {
      console.warn('HaveIBeenPwned API unavailable, skipping breach check')
      return { isBreached: false }
    }

    const responseData = await response.text()
    const lines = responseData.split('\n')

    for (const line of lines) {
      const [hashSuffix, count] = line.split(':')
      if (hashSuffix === suffix) {
        return {
          isBreached: true,
          breachCount: parseInt(count),
          message: `Password ini telah ditemukan dalam ${count} data breaches. Harap pilih password yang berbeda.`
        }
      }
    }

    return { isBreached: false }
  } catch (error) {
    // Silently fail or warn if API is unreachable (common in dev/offline)
    console.warn('Skipping breach check (API unreachable):', error instanceof Error ? error.message : 'Unknown error')
    return { isBreached: false }
  }
}

/**
 * Check password against history (prevent reuse)
 */
export function checkPasswordHistory(
  newPassword: string,
  passwordHistory: string[]
): boolean {
  return !passwordHistory.includes(newPassword)
}

/**
 * Generate secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''

  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
  password += '0123456789'[Math.floor(Math.random() * 10)]
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]

  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

/**
 * Validate password with all security checks
 */
export async function performCompletePasswordValidation(
  password: string,
  userId?: string,
  passwordHistory?: string[]
): Promise<{
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong' | 'very-strong'
  score: number
  breachInfo?: BreachedPasswordResult
}> {
  const validation = validatePassword(password)

  if (!validation.isValid) {
    return validation
  }

  if (passwordHistory && !checkPasswordHistory(password, passwordHistory)) {
    validation.errors.push('Kamu tidak dapat menggunakan password sebelumnya')
    validation.isValid = false
  }
  const breachInfo = await checkBreachedPassword(password)
  if (breachInfo.isBreached) {
    validation.errors.push(breachInfo.message || 'Password telah ditemukan dalam data breaches')
    validation.isValid = false
  }

  return {
    ...validation,
    breachInfo: breachInfo.isBreached ? breachInfo : undefined
  }
}