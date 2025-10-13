'use client'

import { useState } from 'react'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'
import { CustomLoginForm } from '@/components/auth/custom-login-form'
import { useRouter } from 'next/navigation'

export default function ForgotPasswordPage() {
  const [currentView, setCurrentView] = useState<'forgot' | 'login'>('forgot')
  const router = useRouter()

  const handleForgotSuccess = (email: string) => {
    setTimeout(() => {
      setCurrentView('login')
    }, 3000)
  }

  const handleBackToLogin = () => {
    setCurrentView('login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {currentView === 'forgot' ? (
          <ForgotPasswordForm
            onBack={handleBackToLogin}
            onSuccess={handleForgotSuccess}
          />
        ) : (
          <CustomLoginForm />
        )}
      </div>
    </div>
  )
}