'use client'

import { useState, useEffect } from 'react'
import { useCustomAuth } from '@/components/auth/custom-auth-provider'
import { ModernButton } from '@/components/ui/modern-button'
import { ModernInput } from '@/components/ui/modern-input'
import { ModernCard } from '@/components/ui/modern-card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lock, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react'

interface ResetPasswordFormProps {
  email: string
  token: string
  onSuccess: () => void
  onError: (message: string) => void
}

export function ResetPasswordForm({ email, token, onSuccess, onError }: ResetPasswordFormProps) {
  const { resetPassword } = useCustomAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null)

  useEffect(() => {
    validateToken()
  }, [token])

  const validateToken = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500))

      const validTokens = ['demo-reset-token', 'test-token', 'valid-token']

      if (validTokens.includes(token)) {
        setIsTokenValid(true)
      } else {
        setIsTokenValid(false)
        onError('Link reset password tidak valid atau telah kadaluarsa')
      }
    } catch (error) {
      setIsTokenValid(false)
      onError('Terjadi kesalahan saat memvalidasi token')
    }
  }

  const validatePassword = (password: string): boolean => {
    if (password.length < 8) {
      return false
    }

    if (!/[A-Z]/.test(password)) {
      return false
    }

    if (!/[a-z]/.test(password)) {
      return false
    }

    if (!/\d/.test(password)) {
      return false
    }

    return true
  }

  const getPasswordStrength = (password: string): { score: number; message: string; color: string } => {
    if (password.length === 0) {
      return { score: 0, message: '', color: '' }
    }

    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    const strengthLevels = [
      { score: 0, message: 'Sangat Lemah', color: 'bg-red-500' },
      { score: 1, message: 'Lemah', color: 'bg-red-400' },
      { score: 2, message: 'Sedang', color: 'bg-yellow-500' },
      { score: 3, message: 'Baik', color: 'bg-blue-500' },
      { score: 4, message: 'Kuat', color: 'bg-green-500' },
      { score: 5, message: 'Sangat Kuat', color: 'bg-green-600' }
    ]

    return strengthLevels[score] || strengthLevels[0]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!validatePassword(password)) {
        setError('Password harus minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka')
        return
      }

      if (password !== confirmPassword) {
        setError('Password dan konfirmasi password tidak cocok')
        return
      }

      const result = await resetPassword(token, password)

      if (!result.success) {
        setError(result.error || 'Terjadi kesalahan saat reset password')
        return
      }

      onSuccess()

    } catch (error) {
      setError('Terjadi kesalahan saat reset password')
    } finally {
      setIsLoading(false)
    }
  }

  if (isTokenValid === null) {
    return (
      <ModernCard variant="default" padding="lg" className="w-full max-w-md mx-auto">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto">
            <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-2">Memvalidasi Token...</h3>
            <p className="text-gray-600 text-sm">
              Sedang memvalidasi link reset password Anda
            </p>
          </div>
        </div>
      </ModernCard>
    )
  }

  if (isTokenValid === false) {
    return (
      <ModernCard variant="default" padding="lg" className="w-full max-w-md mx-auto">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-2 text-red-600">Link Tidak Valid</h3>
            <p className="text-gray-600 text-sm">
              Link reset password tidak valid atau telah kadaluarsa. Silakan request link baru.
            </p>
          </div>
        </div>
      </ModernCard>
    )
  }

  const passwordStrength = getPasswordStrength(password)

  return (
    <ModernCard variant="default" padding="lg" className="w-full max-w-md mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Reset Password</h2>
          <p className="text-gray-600 text-sm">
            Buat password baru untuk akun: <span className="font-medium">{email}</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800 text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-bold text-gray-700 uppercase tracking-wider">
              Password Baru
            </label>
            <div className="relative">
              <ModernInput
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan password baru"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
            </div>

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Kekuatan Password:</span>
                  <span className={`text-xs font-medium ${
                    passwordStrength.score <= 2 ? 'text-red-600' :
                    passwordStrength.score <= 3 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {passwordStrength.message}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Password Requirements */}
            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-700 mb-2">Password harus:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className={`flex items-center ${password.length >= 8 ? 'text-green-600' : ''}`}>
                  <span className="mr-1">{password.length >= 8 ? '✓' : '○'}</span>
                  Minimal 8 karakter
                </li>
                <li className={`flex items-center ${/[A-Z]/.test(password) ? 'text-green-600' : ''}`}>
                  <span className="mr-1">{/[A-Z]/.test(password) ? '✓' : '○'}</span>
                  Mengandung huruf besar (A-Z)
                </li>
                <li className={`flex items-center ${/[a-z]/.test(password) ? 'text-green-600' : ''}`}>
                  <span className="mr-1">{/[a-z]/.test(password) ? '✓' : '○'}</span>
                  Mengandung huruf kecil (a-z)
                </li>
                <li className={`flex items-center ${/\d/.test(password) ? 'text-green-600' : ''}`}>
                  <span className="mr-1">{/\d/.test(password) ? '✓' : '○'}</span>
                  Mengandung angka (0-9)
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-bold text-gray-700 uppercase tracking-wider">
              Konfirmasi Password
            </label>
            <div className="relative">
              <ModernInput
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Konfirmasi password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
            </div>
            {confirmPassword.length > 0 && (
              <p className={`text-xs ${password === confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                {password === confirmPassword ? '✓ Password cocok' : '✗ Password tidak cocok'}
              </p>
            )}
          </div>

          <ModernButton
            type="submit"
            variant="default"
            size="lg"
            disabled={isLoading || !password || !confirmPassword || password !== confirmPassword || !validatePassword(password)}
            loading={isLoading}
            className="w-full"
          >
            {isLoading ? 'Mereset Password...' : 'Reset Password'}
          </ModernButton>
        </form>
      </div>
    </ModernCard>
  )
}