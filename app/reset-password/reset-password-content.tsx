'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import { ModernCard } from '@/components/ui/modern-card'
import { ModernButton } from '@/components/ui/modern-button'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const [currentView, setCurrentView] = useState<'reset' | 'success' | 'error'>('reset')
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const emailParam = searchParams.get('email')
    const tokenParam = searchParams.get('token')

    if (!emailParam || !tokenParam) {
      setCurrentView('error')
      setErrorMessage('Link reset password tidak lengkap. Pastikan Anda memiliki email dan token yang valid.')
    } else {
      setEmail(emailParam)
      setToken(tokenParam)
    }
  }, [searchParams])

  const handleResetSuccess = () => {
    setCurrentView('success')
  }

  const handleResetError = (message: string) => {
    setErrorMessage(message)
    setCurrentView('error')
  }

  if (currentView === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <ModernCard variant="default" padding="lg" className="w-full max-w-md mx-auto">
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-red-600">Error</h2>
              <p className="text-gray-600 text-sm">
                {errorMessage}
              </p>
            </div>

            <div className="space-y-3">
              <Link href="/forgot-password">
                <ModernButton
                  variant="default"
                  size="lg"
                  className="w-full"
                >
                  Request Link Baru
                </ModernButton>
              </Link>

              <Link href="/login">
                <ModernButton
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali ke Login
                </ModernButton>
              </Link>
            </div>
          </div>
        </ModernCard>
      </div>
    )
  }

  if (currentView === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <ModernCard variant="default" padding="lg" className="w-full max-w-md mx-auto">
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Password Berhasil Direset!</h2>
              <p className="text-gray-600 text-sm">
                Password Anda telah berhasil diubah. Sekarang Anda bisa login dengan password baru.
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-xs text-blue-800 text-center">
                <strong>Untuk demo:</strong> Password baru telah diset. Anda bisa langsung login.
              </p>
            </div>

            <Link href="/login">
              <ModernButton
                variant="default"
                size="lg"
                className="w-full"
              >
                Login Sekarang
              </ModernButton>
            </Link>
          </div>
        </ModernCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <ResetPasswordForm
          email={email}
          token={token}
          onSuccess={handleResetSuccess}
          onError={handleResetError}
        />
      </div>
    </div>
  )
}