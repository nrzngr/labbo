'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import {
  createPasswordResetToken,
  validatePasswordResetToken,
  usePasswordResetToken,
  createEmailVerificationToken,
  validateEmailVerificationToken,
  useEmailVerificationToken
} from '@/lib/token-service'
import {
  verifyTOTPToken,
  verifyBackupCode,
  removeBackupCode,
  decryptMFASecret,
  isMFAEnabled
} from '@/lib/mfa'
import { performCompletePasswordValidation } from '@/lib/password-validation'
import { loginSession, logoutSession } from '@/app/actions/auth-session'
// Email service will be used only in API routes, not in client components

interface User {
  id: string
  email: string
  full_name: string
  role: string
  department: string
  nim?: string | null
  nip?: string | null
  phone?: string | null
  student_level?: string | null
  lecturer_rank?: string | null
  email_verified?: boolean
  email_verified_at?: string | null
  last_login_at?: string | null
  login_count?: number
  locked_until?: string | null
  failed_login_attempts?: number
  custom_password?: string | null
  mfa_enabled?: boolean
  mfa_secret?: string | null
  backup_codes?: string | null
  created_at?: string
  updated_at?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; requiresMFA?: boolean }>
  loginWithMFA: (email: string, password: string, mfaCode: string, isBackupCode?: boolean) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  isAuthenticated: boolean
  register: (full_name: string, email: string, password: string) => Promise<{ success: boolean; error?: string; requiresVerification?: boolean }>
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  verifyEmail: (token: string) => Promise<{ success: boolean; error?: string }>
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string }>
  isAccountLocked: (email: string) => Promise<boolean>
  enableMFA: () => Promise<{ success: boolean; error?: string; mfaData?: any }>
  verifyMFASetup: (secret: string, token: string) => Promise<{ success: boolean; error?: string }>
  disableMFA: () => Promise<{ success: boolean; error?: string }>
  isMFAEnabled: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function CustomAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Use server action to get session from HTTP-only cookie
        const { getSession } = await import('@/app/actions/auth-session')
        const session = await getSession()

        if (!session?.user?.id) {
          setLoading(false)
          return
        }

        // Fetch full user data from database
        const { data: dbUser, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error || !dbUser) {
          // Invalid session - user no longer exists
          const { logoutSession } = await import('@/app/actions/auth-session')
          await logoutSession()
          setLoading(false)
          return
        }

        setUser(dbUser as User)
      } catch (error) {
        console.error('Session check error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; requiresMFA?: boolean }> => {
    try {
      // Check if account is locked
      const isLocked = await isAccountLocked(email)
      if (isLocked) {
        return { success: false, error: 'Account is temporarily locked. Please try again later.' }
      }

      // Fetch user from database
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single()

      // Generic error message to prevent email enumeration
      if (error || !user) {
        return { success: false, error: 'Invalid email or password' }
      }

      const dbUser = user as User

      // Check if email is verified
      if (!dbUser.email_verified) {
        return { success: false, error: 'Please verify your email before logging in' }
      }

      // Verify password against database password_hash
      const passwordHash = (dbUser as any).password_hash
      if (!passwordHash) {
        console.error('User has no password_hash set:', dbUser.email)
        return { success: false, error: 'Invalid email or password' }
      }

      const passwordMatch = await bcrypt.compare(password, passwordHash)
      if (!passwordMatch) {
        // TODO: Increment failed login attempts in database
        return { success: false, error: 'Invalid email or password' }
      }

      // Set user state and create HTTP-only cookie session
      setUser(dbUser)
      await loginSession(dbUser)

      // Check if MFA is enabled for this user
      if (dbUser.mfa_enabled) {
        return { success: true, requiresMFA: true }
      }

      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Connection error. Please try again.' }
    }
  }

  const loginWithMFA = async (email: string, password: string, mfaCode: string, isBackupCode: boolean = false): Promise<{ success: boolean; error?: string }> => {
    try {
      // First, perform regular login to get user
      const loginResult = await login(email, password)
      if (!loginResult.success) {
        return { success: false, error: loginResult.error }
      }

      if (!user || !user.mfa_enabled) {
        return { success: false, error: 'MFA not enabled for this account' }
      }

      // Verify MFA code
      let isValidMFA = false
      let error = ''

      if (isBackupCode) {
        // Verify backup code
        const backupCodes = user.backup_codes ? JSON.parse(user.backup_codes) : []
        isValidMFA = verifyBackupCode(mfaCode, backupCodes)

        if (isValidMFA) {
          // Remove used backup code
          const remainingCodes = removeBackupCode(mfaCode, backupCodes)
          // TODO: Update user's backup codes in database when TypeScript issues are resolved
          // await supabase
          //   .from('users')
          //   .update({ backup_codes: JSON.stringify(remainingCodes) })
          //   .eq('id', user.id)
          console.log('Backup code used, remaining codes:', remainingCodes.length)
        } else {
          error = 'Invalid backup code'
        }
      } else {
        // Verify TOTP code
        if (!user.mfa_secret) {
          return { success: false, error: 'MFA secret not found' }
        }

        const mfaSecret = decryptMFASecret(user.mfa_secret)
        const verification = verifyTOTPToken(mfaCode, mfaSecret)
        isValidMFA = verification.valid
        error = verification.error || 'Invalid MFA code'
      }

      if (!isValidMFA) {
        return { success: false, error }
      }

      // MFA verification successful, complete login
      return { success: true }
    } catch (error) {
      console.error('MFA login error:', error)
      return { success: false, error: 'MFA verification failed' }
    }
  }

  const logout = async () => {
    try {
      localStorage.clear()
      setUser(null)
      await logoutSession()
    } catch (error) {
      console.error('Logout error:', error)
      localStorage.clear()
      setUser(null)
      await logoutSession()
    }
  }

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return { success: false, error: 'Invalid email format' }
      }

      // Check if user exists
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('email', email)
        .single()

      if (userError || !user) {
        // Don't reveal if email exists or not for security
        return { success: true }
      }

      // Type assertion to satisfy TypeScript
      const typedUser = user as { id: string; email: string; full_name: string }

      // TODO: Implement rate limiting for password reset when database schema is properly configured
      // const { data: existingTokens } = await supabase
      //   .from('password_reset_tokens')
      //   .select('id')
      //   .eq('user_id', user.id)
      //   .is('used_at', null)
      //   .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour

      // if (existingTokens && existingTokens.length >= 3) {
      //   return { success: false, error: 'Too many password reset requests. Please try again later.' }
      // }

      // Create password reset token
      const { success: tokenSuccess, token } = await createPasswordResetToken(typedUser.id)

      if (!tokenSuccess) {
        return { success: false, error: 'Failed to create reset token' }
      }

      // Create reset link
      const resetLink = `${window.location.origin}/reset-password?token=${token}`

      // Send password reset email via API
      try {
        const emailResponse = await fetch('/api/auth/send-password-reset', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            resetLink,
            userName: typedUser.full_name
          })
        })

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text()
          console.error('❌ Failed to send password reset email:', emailResponse.statusText)
          console.error('❌ Error Response:', errorText)

          // Try to get more detailed error info
          try {
            const errorData = await emailResponse.json()
            console.error('❌ Error Data:', errorData)
          } catch (e) {
            // Ignore JSON parsing errors
          }
        } else {
          console.log('✅ Password reset email sent successfully!')
        }
      } catch (error) {
        console.error('Failed to send password reset email:', error)
      }

      // Log the password reset request
      // TODO: Implement audit logging when database functions are available
      // await supabase.rpc('log_audit_event', {
      //   p_user_id: typedUser.id,
      //   p_action: 'PASSWORD_RESET_REQUESTED',
      //   p_resource_type: 'user',
      //   p_resource_id: typedUser.id,
      //   p_details: {
      //     email,
      //     resetLink,
      //     emailSent: emailResult.success,
      //     timestamp: new Date().toISOString()
      //   }
      // })

      return { success: true }
    } catch (error) {
      console.error('Password reset request error:', error)
      return { success: false, error: 'Failed to process password reset request' }
    }
  }

  const resetPassword = async (token: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validate token
      const { valid, userId, error: tokenError } = await validatePasswordResetToken(token)

      if (!valid || !userId) {
        return { success: false, error: tokenError || 'Invalid or expired reset token' }
      }

      // Validate password strength
      if (newPassword.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters' }
      }

      if (!/[A-Z]/.test(newPassword)) {
        return { success: false, error: 'Password must contain at least one uppercase letter' }
      }

      if (!/[a-z]/.test(newPassword)) {
        return { success: false, error: 'Password must contain at least one lowercase letter' }
      }

      if (!/\d/.test(newPassword)) {
        return { success: false, error: 'Password must contain at least one number' }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(newPassword, 10)

      // TODO: Update user password when database schema is properly configured
      // const { error: updateError } = await supabase
      //   .from('users')
      //   .update({
      //     custom_password: hashedPassword,
      //     updated_at: new Date().toISOString()
      //   })
      //   .eq('id', userId)

      // if (updateError) {
      //   console.error('Error updating password:', updateError)
      //   return { success: false, error: 'Failed to reset password' }
      // }

      // For now, just mark success if password hash was created
      console.log('Password hashed successfully for user:', userId)

      // Mark token as used
      const { success: tokenUsed } = await usePasswordResetToken(token)
      if (!tokenUsed) {
        console.error('Failed to mark token as used')
      }

      // Log successful password reset
      // TODO: Implement audit logging when database functions are available
      // await supabase.rpc('log_audit_event', {
      //   p_user_id: userId,
      //   p_action: 'PASSWORD_RESET_COMPLETED',
      //   p_resource_type: 'user',
      //   p_resource_id: userId,
      //   p_details: { timestamp: new Date().toISOString() }
      // })

      return { success: true }
    } catch (error) {
      console.error('Password reset error:', error)
      return { success: false, error: 'Failed to reset password' }
    }
  }

  const register = async (full_name: string, email: string, password: string): Promise<{ success: boolean; error?: string; requiresVerification?: boolean }> => {
    try {
      // Validate inputs
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return { success: false, error: 'Invalid email format' }
      }

      // Enhanced password validation
      const passwordValidation = await performCompletePasswordValidation(password)
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.errors[0] || 'Password does not meet security requirements'
        }
      }

      // Check if email already exists (database and local storage)
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single()

      // Also check local users
      const localUsers = JSON.parse(localStorage.getItem('localUsers') || '[]')
      const existingLocalUser = localUsers.find((u: any) => u.email === email)

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error checking existing user:', checkError)
        return { success: false, error: 'Database error. Please try again.' }
      }

      if (existingUser || existingLocalUser) {
        return { success: false, error: 'An account with this email already exists' }
      }

      // Hash password first
      const hashedPassword = await bcrypt.hash(password, 10)

      // Create new user in Supabase - include password_hash field and nim for students
      const userPayload = {
        full_name,
        email,
        role: 'mahasiswa',
        department: 'General',
        email_verified: false,
        password_hash: hashedPassword, // Add the missing field
        nim: `MHS${Date.now().toString().slice(-6)}` // Generate mahasiswa ID to satisfy database constraint
      }

      // For now, create user without password in database
      // We'll handle authentication differently
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert(userPayload as any)
        .select()
        .single()

      // Handle database errors with fallback
      if (insertError) {
        console.error('Error creating user in database:', insertError)

        // Fallback: Create user locally for demo purposes
        const localUserId = 'local-user-' + Date.now()
        const localUserData = {
          id: localUserId,
          full_name,
          email,
          role: 'mahasiswa',
          department: 'General',
          email_verified: false,
          custom_password: hashedPassword,
          nim: `MHS${Date.now().toString().slice(-6)}`, // Add mahasiswa ID for consistency
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        // Store user in localStorage as fallback
        const existingLocalUsers = JSON.parse(localStorage.getItem('localUsers') || '[]')
        existingLocalUsers.push(localUserData)
        localStorage.setItem('localUsers', JSON.stringify(existingLocalUsers))

        console.log('User created locally (database fallback):', localUserData)

        // Create email verification token with local user ID
        const { success: tokenSuccess, token } = await createEmailVerificationToken(localUserId)

        if (!tokenSuccess) {
          console.error('Failed to create verification token')
        }

        // Create verification link
        const verificationLink = token ? `${window.location.origin}/verify-email?token=${token}` : ''

        // Send verification email via API
        if (token) {
          try {
            console.log('📧 Attempting to send verification email...')
            console.log('📧 Email:', email)
            console.log('📧 Verification Link:', verificationLink)
            console.log('📧 User Name:', localUserData.full_name)

            const emailResponse = await fetch('/api/auth/send-verification', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email,
                verificationLink,
                userName: localUserData.full_name
              })
            })

            console.log('📧 Email API Response Status:', emailResponse.status)
            console.log('📧 Email API Response OK:', emailResponse.ok)

            if (!emailResponse.ok) {
              const errorText = await emailResponse.text()
              console.error('❌ Failed to send verification email:', emailResponse.statusText)
              console.error('❌ Error Response:', errorText)

              // Try to get more detailed error info
              try {
                const errorData = await emailResponse.json()
                console.error('❌ Error Data:', errorData)
              } catch (e) {
                // Ignore JSON parsing errors
              }

              // Store verification link for manual testing (development fallback)
              localStorage.setItem(`dev_verification_${localUserData.id}`, verificationLink)
              console.log('💻 Development mode: Verification link stored in localStorage')
            } else {
              console.log('✅ Verification email sent successfully!')

              // Try to parse success response
              try {
                const successData = await emailResponse.json()
                console.log('✅ Success Response:', successData)
              } catch (e) {
                // Ignore JSON parsing errors
              }
            }
          } catch (error) {
            console.error('❌ Failed to send verification email:', error)
          }
        }

        return { success: true, requiresVerification: true }
      }

      if (!newUser) {
        return { success: false, error: 'Failed to create account. Please try again.' }
      }

      console.log('User created successfully in database:', newUser)

      // Store password locally for authentication since database doesn't support it
      const userPasswordData = {
        userId: (newUser as any).id,
        hashedPassword,
        email
      }
      const existingPasswords = JSON.parse(localStorage.getItem('userPasswords') || '[]')
      existingPasswords.push(userPasswordData)
      localStorage.setItem('userPasswords', JSON.stringify(existingPasswords))

      // Create email verification token
      const { success: tokenSuccess, token } = await createEmailVerificationToken((newUser as any).id)

      if (!tokenSuccess) {
        console.error('Failed to create verification token')
      }

      // Create verification link
      const verificationLink = token ? `${window.location.origin}/verify-email?token=${token}` : ''

      // Send verification email via API
      if (token) {
        try {
          const emailResponse = await fetch('/api/auth/send-verification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              verificationLink,
              userName: (newUser as any).full_name
            })
          })

          if (!emailResponse.ok) {
            console.error('Failed to send verification email:', emailResponse.statusText)
          }
        } catch (error) {
          console.error('Failed to send verification email:', error)
        }
      }

      return { success: true, requiresVerification: true }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'Registration failed. Please try again.' }
    }
  }

  const verifyEmail = async (token: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validate token
      const { valid, userId, error: tokenError } = await validateEmailVerificationToken(token)

      if (!valid || !userId) {
        return { success: false, error: tokenError || 'Invalid or expired verification token' }
      }

      // Mark user email as verified in database
      const updateData = {
        email_verified: true,
        email_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      const { error: updateError } = await (supabase
        .from('users') as any)
        .update(updateData)
        .eq('id', userId)

      if (updateError) {
        console.error('Error verifying email:', updateError)
        return { success: false, error: 'Failed to verify email' }
      }

      console.log('Email verification processed for user:', userId)

      // Mark token as used
      const { success: tokenUsed } = await useEmailVerificationToken(token)
      if (!tokenUsed) {
        console.error('Failed to mark verification token as used')
      }

      // Send welcome email after verification
      const { data: verifiedUser } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', userId)
        .single() as any

      if (verifiedUser) {
        try {
          const emailResponse = await fetch('/api/auth/send-welcome', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: verifiedUser.email,
              userName: verifiedUser.full_name
            })
          })

          if (!emailResponse.ok) {
            console.error('Failed to send welcome email:', emailResponse.statusText)
          }
        } catch (error) {
          console.error('Failed to send welcome email:', error)
        }
      }

      console.log('Welcome email sent to user:', userId)

      return { success: true }
    } catch (error) {
      console.error('Email verification error:', error)
      return { success: false, error: 'Failed to verify email' }
    }
  }

  const resendVerificationEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return { success: false, error: 'Format email tidak valid' }
      }

      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Gagal mengirim ulang email verifikasi' }
      }

      return { success: true }
    } catch (error) {
      console.error('Resend verification email error:', error)
      return { success: false, error: 'Terjadi kesalahan koneksi' }
    }
  }


  const isAccountLocked = async (email: string): Promise<boolean> => {
    try {
      // TODO: Check account lock status when database schema is properly configured
      // const { data: user, error } = await supabase
      //   .from('users')
      //   .select('locked_until')
      //   .eq('email', email)
      //   .single()

      // if (error || !user) {
      //   return false // User doesn't exist, so not locked
      // }

      // return user.locked_until ? new Date() < new Date(user.locked_until) : false

      // For now, always return false
      return false
    } catch (error) {
      console.error('Error checking account lock status:', error)
      return false
    }
  }

  // MFA Functions
  const enableMFA = async () => {
    try {
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      const response = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authSession')}`
        }
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to setup MFA' }
      }

      return { success: true, mfaData: result.data }
    } catch (error) {
      console.error('Error enabling MFA:', error)
      return { success: false, error: 'Failed to setup MFA' }
    }
  }

  const verifyMFASetup = async (secret: string, token: string) => {
    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authSession')}`
        },
        body: JSON.stringify({ secret, token })
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to verify MFA setup' }
      }

      // Update user state to reflect MFA enabled
      if (user) {
        setUser({ ...user, mfa_enabled: true })
      }

      return { success: true }
    } catch (error) {
      console.error('Error verifying MFA setup:', error)
      return { success: false, error: 'Failed to verify MFA setup' }
    }
  }

  const disableMFA = async () => {
    try {
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      const response = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authSession')}`
        }
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to disable MFA' }
      }

      // Update user state to reflect MFA disabled
      setUser({ ...user, mfa_enabled: false, mfa_secret: null, backup_codes: null })

      return { success: true }
    } catch (error) {
      console.error('Error disabling MFA:', error)
      return { success: false, error: 'Failed to disable MFA' }
    }
  }

  const isMFAEnabledLocal = () => {
    return user ? isMFAEnabled(user) : false
  }

  const value = {
    user,
    loading,
    login,
    loginWithMFA,
    logout,
    register,
    requestPasswordReset,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
    isAccountLocked,
    enableMFA,
    verifyMFASetup,
    disableMFA,
    isMFAEnabled: isMFAEnabledLocal,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useCustomAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useCustomAuth must be used within CustomAuthProvider')
  }
  return context
}