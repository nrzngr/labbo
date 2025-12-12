'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, AlertTriangle } from 'lucide-react'

import { RegisterAccent } from './register-accent'
import { useCustomAuth } from './custom-auth-provider'

export function RegisterForm() {
  const { register, user } = useCustomAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    repeatPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showRepeatPassword, setShowRepeatPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    // Validate passwords match
    if (formData.password !== formData.repeatPassword) {
      setError('Passwords do not match')
      setIsSubmitting(false)
      return
    }

    try {
      const result = await register(formData.full_name, formData.email, formData.password)
      if (result.success) {
        // Store email for resend functionality
        localStorage.setItem('registeredEmail', formData.email)

        if (result.requiresVerification) {
          // Show email verification message
          setError('')
          // Redirect to email verification sent page with email parameter
          router.push(`/verify-email-sent?email=${encodeURIComponent(formData.email)}`)
        } else {
          // This should not happen with our new implementation, but handle it just in case
          setTimeout(() => {
            if (user?.role === 'student') {
              router.push('/dashboard/student')
            } else {
              router.push('/dashboard')
            }
          }, 500)
        }
      } else {
        setError(result.error || 'Registration failed')
      }
    } catch (error) {
      setError('An error occurred during registration. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) {
      setError('')
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#f7f6fb] text-[#111827] lg:flex-row">
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
          <div className="max-w-[440px]">
            <h1 className="text-[38px] font-semibold leading-tight text-[#111827] sm:text-[44px]">
              Create your lab account
            </h1>
            <p className="mt-4 text-[17px] text-[#6d7079]">
              Your journey to smarter inventory starts here.
            </p>

            <form onSubmit={handleSubmit} className="mt-12 space-y-6">
              <div>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Full name"
                  className="w-full rounded-[16px] border border-[#dfe2ec] bg-[#eef0f8] px-5 py-4 text-[15px] text-[#1f2937] shadow-sm outline-none transition focus:border-[#ff007a] focus:ring-4 focus:ring-[rgba(255,0,122,0.16)] placeholder:text-[#9aa1b3]"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email"
                  className="w-full rounded-[16px] border border-[#dfe2ec] bg-[#eef0f8] px-5 py-4 text-[15px] text-[#1f2937] shadow-sm outline-none transition focus:border-[#ff007a] focus:ring-4 focus:ring-[rgba(255,0,122,0.16)] placeholder:text-[#9aa1b3]"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Password"
                  className="w-full rounded-[16px] border border-[#dfe2ec] bg-[#eef0f8] px-5 py-4 pr-12 text-[15px] text-[#1f2937] shadow-sm outline-none transition focus:border-[#ff007a] focus:ring-4 focus:ring-[rgba(255,0,122,0.16)] placeholder:text-[#9aa1b3]"
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
                  type={showRepeatPassword ? 'text' : 'password'}
                  name="repeatPassword"
                  value={formData.repeatPassword}
                  onChange={handleInputChange}
                  placeholder="Repeat password"
                  className="w-full rounded-[16px] border border-[#dfe2ec] bg-[#eef0f8] px-5 py-4 pr-12 text-[15px] text-[#1f2937] shadow-sm outline-none transition focus:border-[#ff007a] focus:ring-4 focus:ring-[rgba(255,0,122,0.16)] placeholder:text-[#9aa1b3]"
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowRepeatPassword(previous => !previous)}
                  className="absolute inset-y-0 right-4 flex items-center text-[#8b8f99] transition hover:text-[#ff007a]"
                  disabled={isSubmitting}
                  aria-label={showRepeatPassword ? 'Hide password' : 'Show password'}
                >
                  {showRepeatPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                  disabled={
                    isSubmitting ||
                    !formData.full_name ||
                    !formData.email ||
                    !formData.password ||
                    !formData.repeatPassword
                  }
                  className="inline-flex items-center justify-center rounded-[14px] bg-[#ff007a] px-12 py-3 text-base font-semibold text-white shadow-[0_25px_45px_rgba(255,0,122,0.35)] transition hover:bg-[#e6006f] focus:outline-none focus:ring-2 focus:ring-[#ff007a] focus:ring-offset-2 focus:ring-offset-[#f7f6fb] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? 'Creating Account...' : 'Register'}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-16 text-sm text-[#6c6f78]">
            Already have an account?{' '}
            <Link
              href="/"
              className="font-medium text-[#ff007a] transition hover:text-[#e6006f]"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      <div className="relative hidden items-center justify-center bg-[#f7f6fb] lg:flex lg:w-[48%] xl:w-[52%]">
        <div className="relative w-full max-w-[700px] rounded-[72px] bg-[#ff007a] shadow-[0_45px_110px_rgba(255,0,122,0.35)] aspect-[442/550] overflow-hidden">
          <RegisterAccent className="absolute inset-0 scale-[1.04]" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
