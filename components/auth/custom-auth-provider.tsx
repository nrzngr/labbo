'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

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
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  isAuthenticated: boolean
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string; newPassword?: string }>
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function CustomAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionData = localStorage.getItem('authSession')
        if (!sessionData) {
          setLoading(false)
          return
        }

        const session = JSON.parse(sessionData)
        if (!session.userId) {
          localStorage.removeItem('authSession')
          setLoading(false)
          return
        }

        // Verify user still exists in database
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.userId)
          .single()

        if (error || !user) {
          localStorage.removeItem('authSession')
          setLoading(false)
          return
        }

        setUser(user)
      } catch (error) {
        console.error('Session check error:', error)
        localStorage.removeItem('authSession')
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // For demo purposes, use hardcoded demo accounts
      const demoAccounts = {
        'admin@example.com': 'admin123',
        'student@example.com': 'student123',
        'lecturer@example.com': 'lecturer123',
        'labstaff@example.com': 'labstaff123'
      }

      // Check if this is a demo account
      if (demoAccounts[email as keyof typeof demoAccounts]) {
        // First check if there's a temporary password set
        const tempPassword = localStorage.getItem(`tempPassword_${email}`)

        // If temp password exists, use it instead of default password
        const expectedPassword = tempPassword || demoAccounts[email as keyof typeof demoAccounts]

        if (password !== expectedPassword) {
          return { success: false, error: 'Email atau password salah' }
        }

        // Find the user in the database to get their full profile
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single()

        if (error || !user) {
          return { success: false, error: 'Akun pengguna tidak ditemukan' }
        }

        // Login successful - create session
        const sessionData = {
          userId: (user as any).id,
          loginTime: new Date().toISOString()
        }

        localStorage.setItem('authSession', JSON.stringify(sessionData))
        setUser(user)

        return { success: true }
      }

      // For non-demo accounts, check custom_password field
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (error || !user) {
        return { success: false, error: 'Email atau password salah' }
      }

      // Check if user has custom password
      const customPassword = (user as any).custom_password

      if (!customPassword) {
        return { success: false, error: 'User account not configured for traditional auth' }
      }

      // Compare password with stored hash
      const passwordMatch = await bcrypt.compare(password, customPassword)

      if (!passwordMatch) {
        return { success: false, error: 'Email atau password salah' }
      }

      // Login successful - create session
      const sessionData = {
        userId: (user as any).id,
        loginTime: new Date().toISOString()
      }

      localStorage.setItem('authSession', JSON.stringify(sessionData))
      setUser(user)

      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Terjadi kesalahan koneksi' }
    }
  }

  const logout = async () => {
    try {
      // Clear local session
      localStorage.removeItem('authSession')
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
      // Still clear session even if error occurs
      localStorage.removeItem('authSession')
      setUser(null)
    }
  }

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; error?: string; newPassword?: string }> => {
    try {
      // Simulate API call to request password reset
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return { success: false, error: 'Format email tidak valid' }
      }

      // Check if email exists in demo accounts
      const demoAccounts = [
        'admin@example.com',
        'student@example.com',
        'lecturer@example.com',
        'labstaff@example.com'
      ]

      if (!demoAccounts.includes(email)) {
        return { success: false, error: 'Email tidak terdaftar dalam sistem' }
      }

      // Generate new random password
      const generateRandomPassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
        let password = ''
        for (let i = 0; i < 12; i++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return password
      }

      const newPassword = generateRandomPassword()

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10)

      // For demo purposes, we'll just log the password
      console.log('Password reset successful for email:', email)
      console.log('New password:', newPassword)
      console.log('New password hash:', hashedPassword)

      // In production, update the password in database
      // For demo purposes, we'll store it in localStorage
      localStorage.setItem(`tempPassword_${email}`, newPassword)

      return { success: true, newPassword }
    } catch (error) {
      console.error('Password reset request error:', error)
      return { success: false, error: 'Terjadi kesalahan saat reset password' }
    }
  }

  const resetPassword = async (token: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Simulate API call to reset password
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Validate token (in production, check against database)
      const validTokens = ['demo-reset-token', 'test-token', 'valid-token']

      if (!validTokens.includes(token)) {
        return { success: false, error: 'Token reset password tidak valid atau telah kadaluarsa' }
      }

      // Validate new password
      if (newPassword.length < 8) {
        return { success: false, error: 'Password harus minimal 8 karakter' }
      }

      if (!/[A-Z]/.test(newPassword)) {
        return { success: false, error: 'Password harus mengandung huruf besar' }
      }

      if (!/[a-z]/.test(newPassword)) {
        return { success: false, error: 'Password harus mengandung huruf kecil' }
      }

      if (!/\d/.test(newPassword)) {
        return { success: false, error: 'Password harus mengandung angka' }
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10)

      console.log('Password reset successful for token:', token)
      console.log('New password hash:', hashedPassword)

      // In production, update the password in database
      // For demo purposes, we'll just log it

      // Clear any reset tokens from localStorage
      const keys = Object.keys(localStorage).filter(key => key.startsWith('resetToken_'))
      keys.forEach(key => localStorage.removeItem(key))

      return { success: true }
    } catch (error) {
      console.error('Password reset error:', error)
      return { success: false, error: 'Terjadi kesalahan saat reset password' }
    }
  }

  const value = {
    user,
    loading,
    login,
    logout,
    requestPasswordReset,
    resetPassword,
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