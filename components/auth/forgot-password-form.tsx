'use client'

import { useState } from 'react'
import { useCustomAuth } from '@/components/auth/custom-auth-provider'
import { ModernButton } from '@/components/ui/modern-button'
import { ModernInput } from '@/components/ui/modern-input'
import { ModernCard } from '@/components/ui/modern-card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'

interface ForgotPasswordFormProps {
  onBack: () => void
  onSuccess: (email: string) => void
}

export function ForgotPasswordForm({ onBack, onSuccess }: ForgotPasswordFormProps) {
  const { requestPasswordReset } = useCustomAuth()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [newPassword, setNewPassword] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await requestPasswordReset(email)

      if (!result.success) {
        setError(result.error || 'Terjadi kesalahan saat reset password')
        return
      }

      if (result.newPassword) {
        setNewPassword(result.newPassword)
      }

      setIsSubmitted(true)

    } catch (error) {
      setError('Terjadi kesalahan saat reset password')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted && newPassword) {
    const copyToClipboard = () => {
      navigator.clipboard.writeText(newPassword)
      alert('Password berhasil disalin!')
    }

    return (
      <ModernCard variant="default" padding="lg" className="w-full max-w-md mx-auto">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Password Berhasil Direset!</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Password baru telah dihasilkan untuk akun Anda. Gunakan password ini untuk login.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300 mb-4">
              <p className="text-xs text-gray-500 mb-2">PASSWORD BARU ANDA:</p>
              <div className="flex items-center justify-center space-x-2">
                <code className="text-lg font-mono font-bold text-blue-600 bg-white px-3 py-2 rounded border">
                  {newPassword}
                </code>
                <button
                  onClick={copyToClipboard}
                  className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                  title="Salin password"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>Penting:</strong> Simpan password ini dengan aman.
                Password bersifat sementara dan dapat diubah melalui menu pengaturan setelah login.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <ModernButton
              onClick={() => onSuccess(email)}
              variant="default"
              size="lg"
              className="w-full"
            >
              Lanjut ke Login
            </ModernButton>

            <ModernButton
              onClick={onBack}
              variant="outline"
              size="lg"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </ModernButton>
          </div>
        </div>
      </ModernCard>
    )
  }

  return (
    <ModernCard variant="default" padding="lg" className="w-full max-w-md mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-gray-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Lupa Password?</h2>
          <p className="text-gray-600 text-sm">
            Masukkan email Anda dan kami akan generate password baru secara instan
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
            <label htmlFor="email" className="text-sm font-bold text-gray-700 uppercase tracking-wider">
              Email Address
            </label>
            <ModernInput
              id="email"
              type="email"
              placeholder="Masukkan email Anda"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              leftIcon={<Mail className="w-4 h-4" />}
            />
          </div>

          <div className="space-y-3">
            <ModernButton
              type="submit"
              variant="default"
              size="lg"
              disabled={isLoading || !email}
              loading={isLoading}
              className="w-full"
            >
              {isLoading ? 'Menggenerate Password...' : 'Generate Password Baru'}
            </ModernButton>

            <ModernButton
              type="button"
              variant="outline"
              size="lg"
              onClick={onBack}
              disabled={isLoading}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Login
            </ModernButton>
          </div>
        </form>

        {/* Demo Accounts Info */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            <strong>Akun Demo:</strong><br />
            admin@example.com | student@example.com<br />
            lecturer@example.com | labstaff@example.com
          </p>
        </div>
      </div>
    </ModernCard>
  )
}