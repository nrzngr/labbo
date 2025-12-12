'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'

import { LoginAccent } from './login-accent'
import { useCustomAuth } from '@/components/auth/custom-auth-provider'

interface ForgotPasswordFormProps {
  onBack?: () => void
  onSuccess?: (email: string) => void
}

export function ForgotPasswordForm({ onBack, onSuccess }: ForgotPasswordFormProps) {
  const { requestPasswordReset } = useCustomAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await requestPasswordReset(email)

      if (!result.success) {
        setError(result.error || 'Failed to reset password')
        return
      }

      // Redirect to link sent page with email parameter
      router.push(`/link-sent?email=${encodeURIComponent(email)}`)

    } catch (error) {
      setError('An error occurred while resetting password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#f8f7fb] text-[#111827] lg:flex-row">
      <div className="flex flex-1 flex-col px-8 py-12 sm:px-16 lg:px-20 xl:px-28">
        <Link href="/" className="flex w-fit items-center" aria-label="Labbo home">
          <Image
            src="/logo.svg"
            alt="Labbo"
            width={160}
            height={48}
            priority
            className="h-10 w-auto"
          />
        </Link>

        <div className="mt-16 flex flex-1 flex-col sm:mt-24">
          <div className="max-w-[420px]">
            <h1 className="text-[40px] font-semibold leading-tight text-[#111827] sm:text-[46px]">
              Forgot your password?
            </h1>
            <p className="mt-4 text-[17px] text-[#6d7079]">
              Don&apos;t worry just enter your email below and we&apos;ll send you a link to reset it.
            </p>

            <form onSubmit={handleSubmit} className="mt-12 space-y-6">
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-[16px] border border-[#e6e7eb] bg-white px-5 py-4 text-[15px] text-[#111827] shadow-sm outline-none transition focus:border-[#ff007a] focus:ring-4 focus:ring-[rgba(255,0,122,0.16)] placeholder:text-[#b1b4bd]"
                  required
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-[14px] border border-[#f9a8d4] bg-[#ffe8ef] px-4 py-3 text-sm text-[#b4235d]">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="inline-flex w-full items-center justify-center rounded-[14px] bg-[#ff007a] px-12 py-3 text-base font-semibold text-white shadow-[0_18px_36px_rgba(255,0,122,0.3)] transition hover:bg-[#e6006f] focus:outline-none focus:ring-2 focus:ring-[#ff007a] focus:ring-offset-2 focus:ring-offset-[#f8f7fb] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? 'Sending...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-16 text-sm text-[#6c6f78]">
            Remember your password?{' '}
            <Link
              href="/"
              className="font-medium text-[#ff007a] transition hover:text-[#e6006f]"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      <div className="relative hidden items-center justify-center bg-[#f8f7fb] lg:flex lg:w-[48%] xl:w-[52%]">
        <div className="relative w-full max-w-[700px] rounded-[72px] bg-[#ff007a] shadow-[0_40px_90px_rgba(255,0,122,0.32)] aspect-[442/550] overflow-hidden">
          <LoginAccent className="absolute inset-0 scale-[1.04]" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
