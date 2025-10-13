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
      const demoAccounts = {
        'admin@example.com': 'admin123',
        'student@example.com': 'student123',
        'lecturer@example.com': 'lecturer123',
        'labstaff@example.com': 'labstaff123'
      }

      if (demoAccounts[email as keyof typeof demoAccounts]) {
        const tempPassword = localStorage.getItem(`tempPassword_${email}`)

        const expectedPassword = tempPassword || demoAccounts[email as keyof typeof demoAccounts]

        if (password !== expectedPassword) {
          return { success: false, error: 'Email atau password salah' }
        }

        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single()

        if (error || !user) {
          return { success: false, error: 'Akun pengguna tidak ditemukan' }
        }

        const sessionData = {
          userId: (user as any).id,
          loginTime: new Date().toISOString()
        }

        localStorage.setItem('authSession', JSON.stringify(sessionData))
        setUser(user)

        return { success: true }
      }

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (error || !user) {
        return { success: false, error: 'Email atau password salah' }
      }

      const customPassword = (user as any).custom_password

      if (!customPassword) {
        return { success: false, error: 'User account not configured for traditional auth' }
      }

      const passwordMatch = await bcrypt.compare(password, customPassword)

      if (!passwordMatch) {
        return { success: false, error: 'Email atau password salah' }
      }

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
      localStorage.removeItem('authSession')
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
      localStorage.removeItem('authSession')
      setUser(null)
    }
  }

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; error?: string; newPassword?: string }> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return { success: false, error: 'Format email tidak valid' }
      }

      const demoAccounts = [
        'admin@example.com',
        'student@example.com',
        'lecturer@example.com',
        'labstaff@example.com'
      ]

      if (!demoAccounts.includes(email)) {
        return { success: false, error: 'Email tidak terdaftar dalam sistem' }
      }

      const generateRandomPassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
        let password = ''
        for (let i = 0; i < 12; i++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return password
      }

      const newPassword = generateRandomPassword()

      const hashedPassword = await bcrypt.hash(newPassword, 10)

      console.log('Password reset successful for email:', email)
      console.log('New password:', newPassword)
      console.log('New password hash:', hashedPassword)

      localStorage.setItem(`tempPassword_${email}`, newPassword)

      return { success: true, newPassword }
    } catch (error) {
      console.error('Password reset request error:', error)
      return { success: false, error: 'Terjadi kesalahan saat reset password' }
    }
  }

  const resetPassword = async (token: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const validTokens = ['demo-reset-token', 'test-token', 'valid-token']

      if (!validTokens.includes(token)) {
        return { success: false, error: 'Token reset password tidak valid atau telah kadaluarsa' }
      }

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

      const hashedPassword = await bcrypt.hash(newPassword, 10)

      console.log('Password reset successful for token:', token)
      console.log('New password hash:', hashedPassword)

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