import { supabase } from '@/lib/supabase'
import {
  generatePasswordResetToken,
  generateEmailVerificationToken,
  generateRefreshToken,
  createTokenExpiration,
  isTokenExpired,
  createTokenMetadata
} from './token-utils'

export interface TokenRecord {
  id: string
  user_id: string
  token: string
  expires_at: string
  used_at: string | null
  created_at: string
  updated_at: string
}

export interface TokenValidationResult {
  valid: boolean
  userId?: string
  error?: string
  expired?: boolean
  alreadyUsed?: boolean
}

/**
 * Create a password reset token for a user
 */
export async function createPasswordResetToken(userId: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const token = generatePasswordResetToken()
    const expiresAt = createTokenExpiration(24) // 24 hours

    // Invalidate any existing tokens for this user
    await invalidateUserPasswordResetTokens(userId)

    // TODO: Create password reset token when database schema is properly configured
    // const { data, error } = await supabase
    //   .from('password_reset_tokens')
    //   .insert({
    //     user_id: userId,
    //     token,
    //     expires_at: expiresAt
    //   })
    //   .select()
    //   .single()

    // if (error) {
    //   console.error('Error creating password reset token:', error)
    //   return { success: false, error: 'Failed to create reset token' }
    // }

    console.log('Password reset token created:', { userId, token, expiresAt })

    // TODO: Log the token creation when audit system is properly configured
    // await supabase.rpc('log_audit_event', {
    //   p_user_id: userId,
    //   p_action: 'PASSWORD_RESET_REQUESTED',
    //   p_resource_type: 'user',
    //   p_resource_id: userId,
    //   p_details: createTokenMetadata('password_reset', userId, expiresAt)
    // })

    return { success: true, token }
  } catch (error) {
    console.error('Error in createPasswordResetToken:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Validate a password reset token
 */
export async function validatePasswordResetToken(token: string): Promise<TokenValidationResult> {
  try {
    // TODO: Implement when database schema is properly configured
    // For now, just validate the token format
    if (!token || token.length < 10) {
      return { valid: false, error: 'Invalid reset token' }
    }

    // Mock validation - in production this would check the database
    return {
      valid: true,
      userId: 'mock-user-id'
    }
  } catch (error) {
    console.error('Error in validatePasswordResetToken:', error)
    return { valid: false, error: 'Internal server error' }
  }
}

/**
 * Mark a password reset token as used
 */
export async function usePasswordResetToken(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: Implement when database schema is properly configured
    console.log('Marking password reset token as used:', token)
    return { success: true }
  } catch (error) {
    console.error('Error in usePasswordResetToken:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Create an email verification token for a user
 */
export async function createEmailVerificationToken(userId: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const token = generateEmailVerificationToken()
    const expiresAt = createTokenExpiration(1) // 1 hour

    // Check if this is a local user (starts with 'local-user-')
    if (userId.startsWith('local-user-')) {
      // For local users, store tokens in localStorage
      const existingTokens = JSON.parse(localStorage.getItem('localEmailVerificationTokens') || '[]')

      // Invalidate existing tokens for this user
      const filteredTokens = existingTokens.filter((t: any) => t.user_id !== userId || t.used_at || new Date(t.expires_at) < new Date())

      const newToken = {
        user_id: userId,
        token,
        expires_at: expiresAt,
        used_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      filteredTokens.push(newToken)
      localStorage.setItem('localEmailVerificationTokens', JSON.stringify(filteredTokens))

      console.log('Local email verification token created:', { userId, token, expiresAt })
      return { success: true, token }
    }

    // For database users, invalidate any existing tokens for this user
    await invalidateUserEmailVerificationTokens(userId)

    // Create email verification token in database
    const { data, error } = await supabase
      .from('email_verification_tokens')
      .insert({
        user_id: userId,
        token,
        expires_at: expiresAt
      } as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating email verification token:', error)
      return { success: false, error: 'Failed to create verification token' }
    }

    console.log('Email verification token created:', { userId, token, expiresAt })

    return { success: true, token }
  } catch (error) {
    console.error('Error in createEmailVerificationToken:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Validate an email verification token
 */
export async function validateEmailVerificationToken(token: string): Promise<TokenValidationResult> {
  try {
    // First try database
    const { data: tokenRecord, error } = await supabase
      .from('email_verification_tokens')
      .select('*')
      .eq('token', token)
      .single() as any

    if (!error && tokenRecord) {
      // Check if token is expired
      if (isTokenExpired(tokenRecord.expires_at)) {
        return { valid: false, expired: true, error: 'Verification token has expired' }
      }

      // Check if token has already been used
      if (tokenRecord.used_at) {
        return { valid: false, alreadyUsed: true, error: 'Verification token has already been used' }
      }

      return {
        valid: true,
        userId: tokenRecord.user_id
      }
    }

    // If not in database, check local storage
    const localTokens = JSON.parse(localStorage.getItem('localEmailVerificationTokens') || '[]')
    const localTokenRecord = localTokens.find((t: any) => t.token === token)

    if (!localTokenRecord) {
      return { valid: false, error: 'Invalid verification token' }
    }

    // Check if token is expired
    if (isTokenExpired(localTokenRecord.expires_at)) {
      return { valid: false, expired: true, error: 'Verification token has expired' }
    }

    // Check if token has already been used
    if (localTokenRecord.used_at) {
      return { valid: false, alreadyUsed: true, error: 'Verification token has already been used' }
    }

    return {
      valid: true,
      userId: localTokenRecord.user_id
    }
  } catch (error) {
    console.error('Error in validateEmailVerificationToken:', error)
    return { valid: false, error: 'Internal server error' }
  }
}

/**
 * Mark an email verification token as used
 */
export async function useEmailVerificationToken(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    // First try database
    const updateData = { used_at: new Date().toISOString() }
    const { error } = await (supabase
      .from('email_verification_tokens') as any)
      .update(updateData)
      .eq('token', token)
      .is('used_at', null)

    if (!error) {
      return { success: true }
    }

    // If database fails, try local storage
    const localTokens = JSON.parse(localStorage.getItem('localEmailVerificationTokens') || '[]')
    const tokenIndex = localTokens.findIndex((t: any) => t.token === token)

    if (tokenIndex !== -1) {
      localTokens[tokenIndex].used_at = new Date().toISOString()
      localTokens[tokenIndex].updated_at = new Date().toISOString()
      localStorage.setItem('localEmailVerificationTokens', JSON.stringify(localTokens))
      return { success: true }
    }

    console.error('Error marking email verification token as used:', error)
    return { success: false, error: 'Failed to validate verification token' }
  } catch (error) {
    console.error('Error in useEmailVerificationToken:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Invalidate all password reset tokens for a user
 */
export async function invalidateUserPasswordResetTokens(userId: string): Promise<void> {
  try {
    // TODO: Implement when database schema is properly configured
    console.log('Invalidating password reset tokens for user:', userId)
  } catch (error) {
    console.error('Error in invalidateUserPasswordResetTokens:', error)
  }
}

/**
 * Invalidate all email verification tokens for a user
 */
export async function invalidateUserEmailVerificationTokens(userId: string): Promise<void> {
  try {
    // Check if this is a local user
    if (userId.startsWith('local-user-')) {
      // For local users, invalidate in localStorage
      const localTokens = JSON.parse(localStorage.getItem('localEmailVerificationTokens') || '[]')
      const updatedTokens = localTokens.map((t: any) =>
        t.user_id === userId && !t.used_at ? { ...t, used_at: new Date().toISOString(), updated_at: new Date().toISOString() } : t
      )
      localStorage.setItem('localEmailVerificationTokens', JSON.stringify(updatedTokens))
      return
    }

    // For database users, invalidate in database
    const updateData = { used_at: new Date().toISOString() }
    const { error } = await (supabase
      .from('email_verification_tokens') as any)
      .update(updateData)
      .eq('user_id', userId)
      .is('used_at', null)

    if (error) {
      console.error('Error invalidating email verification tokens:', error)
    }
  } catch (error) {
    console.error('Error in invalidateUserEmailVerificationTokens:', error)
  }
}

/**
 * Clean up expired tokens (maintenance function)
 */
export async function cleanupExpiredTokens(): Promise<{ passwordReset: number; emailVerification: number }> {
  try {
    // TODO: Implement when database schema is properly configured
    console.log('Cleaning up expired tokens')
    return { passwordReset: 0, emailVerification: 0 }
  } catch (error) {
    console.error('Error in cleanupExpiredTokens:', error)
    return { passwordReset: 0, emailVerification: 0 }
  }
}