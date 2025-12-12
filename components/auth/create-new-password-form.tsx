'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

import { CreateNewPasswordAccent } from './create-new-password-accent'
import { useCustomAuth } from '@/components/auth/custom-auth-provider'

export function CreateNewPasswordForm() {
  const { resetPassword } = useCustomAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmNewPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    if (formData.newPassword !== formData.confirmNewPassword) {
      setError('Passwords do not match')
      setIsSubmitting(false)
      return
    }

    try {
      const result = await resetPassword(token, formData.newPassword)
      if (result.success) {
        setIsSuccess(true)
        setTimeout(() => router.push('/'), 3000)
      } else {
        setError(result.error || 'Failed to reset password')
      }
    } catch (submitError) {
      console.error(submitError)
      setError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormData(previous => ({
      ...previous,
      [name]: value
    }))
    if (error) {
      setError('')
    }
  }

  if (isSuccess) {
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

          <div className="mt-16 flex flex-1 flex-col items-start sm:mt-24">
            <div className="w-full max-w-[420px] text-left">
              <div className="mb-10 flex h-20 w-20 items-center justify-center rounded-full bg-[#22c55e]/15 text-[#16a34a] shadow-[0_18px_36px_rgba(34,197,94,0.25)]">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-[40px] font-semibold leading-tight text-[#111827] sm:text-[46px]">
                Password reset successfully!
              </h1>
              <p className="mt-4 text-[17px] text-[#6d7079]">
                Your password has been updated. We&apos;ll take you back to the sign in page shortly.
              </p>
              <div className="mt-10 flex items-center gap-3 text-sm text-[#6d7079]">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#ff007a] border-t-transparent" />
                Redirecting...
              </div>
            </div>
          </div>
        </div>

        <div className="relative hidden items-center justify-center bg-[#f8f7fb] lg:flex lg:w-[48%] xl:w-[52%]">
          <div className="relative w-full max-w-[700px] rounded-[72px] bg-[#ff007a] shadow-[0_40px_90px_rgba(255,0,122,0.32)] aspect-[442/550] overflow-hidden">
            <CreateNewPasswordAccent className="absolute inset-0 scale-[1.04]" aria-hidden="true" />
          </div>
        </div>
      </div>
    )
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
              Create a new password
            </h1>
            <p className="mt-4 text-[17px] text-[#6d7079]">
              Choose a secure password and confirm it below to finish resetting your account.
            </p>

            <form onSubmit={handleSubmit} className="mt-12 space-y-6">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  placeholder="New password"
                  className="w-full rounded-[16px] border border-[#e6e7eb] bg-white px-5 py-4 pr-12 text-[15px] text-[#111827] shadow-sm outline-none transition focus:border-[#ff007a] focus:ring-4 focus:ring-[rgba(255,0,122,0.16)] placeholder:text-[#b1b4bd]"
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(previous => !previous)}
                  className="absolute inset-y-0 right-4 flex items-center text-[#8b8f99] transition hover:text-[#ff007a]"
                  disabled={isSubmitting}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmNewPassword"
                  value={formData.confirmNewPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm new password"
                  className="w-full rounded-[16px] border border-[#e6e7eb] bg-white px-5 py-4 pr-12 text-[15px] text-[#111827] shadow-sm outline-none transition focus:border-[#ff007a] focus:ring-4 focus:ring-[rgba(255,0,122,0.16)] placeholder:text-[#b1b4bd]"
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(previous => !previous)}
                  className="absolute inset-y-0 right-4 flex items-center text-[#8b8f99] transition hover:text-[#ff007a]"
                  disabled={isSubmitting}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
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
                  disabled={isSubmitting || !formData.newPassword || !formData.confirmNewPassword}
                  className="inline-flex w-full items-center justify-center rounded-[14px] bg-[#ff007a] px-12 py-3 text-base font-semibold text-white shadow-[0_18px_36px_rgba(255,0,122,0.3)] transition hover:bg-[#e6006f] focus:outline-none focus:ring-2 focus:ring-[#ff007a] focus:ring-offset-2 focus:ring-offset-[#f8f7fb] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? 'Creating...' : 'Create New Password'}
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
          <CreateNewPasswordAccent className="absolute inset-0 scale-[1.04]" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
