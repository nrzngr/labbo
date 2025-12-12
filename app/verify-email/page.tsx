"use client"

import { Suspense } from 'react'
import { EmailVerificationForm } from '@/components/auth/email-verification-form'

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    }>
      <EmailVerificationForm />
    </Suspense>
  )
}
