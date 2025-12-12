'use client'

import { useState } from 'react'
import { useCustomAuth } from './custom-auth-provider'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export function useAuth() {
  return useCustomAuth()
}

export function LoginForm() {
  const { login, loading, user } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const result = await login(formData.email, formData.password)
      if (result.success) {
        setTimeout(() => {
          if (user?.role === 'student') {
            router.push('/dashboard/student')
          } else {
            router.push('/dashboard')
          }
        }, 500)
      } else {
        setError(result.error || 'Login gagal')
      }
    } catch (error) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
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
    <div
      className="min-h-screen bg-[#F9F9F9]"
      style={{
        fontFamily: 'Satoshi, system-ui, -apple-system, sans-serif'
      }}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col lg:h-screen lg:flex-row">
        <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
          <div className="w-full max-w-md">
            <div className="flex items-center justify-center lg:justify-start">
              <img
                src="/logo-icon.svg"
                alt="Labbo"
                className="h-12 w-auto"
              />
              <img
                src="/logo.svg"
                alt="Labbo"
                className="ml-6 h-10 w-auto"
              />
            </div>

            <div className="mt-10 text-center lg:text-left">
              <h1 className="text-[28px] font-bold leading-tight text-[#222222] lg:text-[32px]">
                Back to work, genius!
              </h1>
              <p className="mt-4 text-[18px] leading-relaxed text-[#444444]">
                Let&apos;s make some science happen
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-10 space-y-6">
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email"
                  className="w-full rounded-xl border border-[#D5D5D5] bg-white px-5 py-3 text-[16px] text-[#222222] placeholder-[#9E9E9E] outline-none transition-all hover:border-[#FF66A3] focus:border-[#FF66A3] focus:ring-2 focus:ring-[#FFB3D3]"
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
                  className="w-full rounded-xl border border-[#D5D5D5] bg-white px-5 py-3 pr-12 text-[16px] text-[#222222] placeholder-[#9E9E9E] outline-none transition-all hover:border-[#FF66A3] focus:border-[#FF66A3] focus:ring-2 focus:ring-[#FFB3D3]"
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9E9E9E] transition-colors hover:text-[#222222] focus-visible:text-[#222222]"
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  )}
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-600" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !formData.email || !formData.password}
                className="flex w-full items-center justify-center rounded-xl bg-[#FD1278] px-6 py-3.5 text-[16px] font-semibold text-white transition-colors hover:bg-[#E10E68] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFB3D3] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sign In
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 text-center lg:text-right">
              <Link
                href="/forgot-password"
                className="text-[16px] font-medium text-[#333333] transition-colors hover:text-[#FD1278] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFB3D3]"
              >
                Forgot Password?
              </Link>
            </div>

            <div className="mt-10 flex items-center justify-center gap-2 text-[16px] text-[#222222] lg:justify-start">
              <span>Don&apos;t have an account?</span>
              <Link
                href="/register"
                className="font-semibold text-[#FD1278] transition-colors hover:text-[#E10E68] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFB3D3]"
              >
                Register
              </Link>
            </div>

            <div className="mt-12 flex justify-center lg:hidden">
              <div className="h-40 w-full max-w-sm rounded-3xl bg-[#FF66A3]/20" />
            </div>
          </div>
        </div>

        <div className="relative hidden w-[35%] flex-none items-center justify-center overflow-hidden rounded-l-[48px] lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF66A3] via-[#FF85B6] to-[#FFC5DD]" />
          <div className="absolute inset-y-10 inset-x-6 rounded-l-[40px] bg-white/10 backdrop-blur-[2px]" />
          <div className="relative mx-12 text-white">
            <div className="rounded-3xl bg-white/10 p-8 shadow-lg backdrop-blur-sm">
              <p className="text-lg font-semibold tracking-wide">
                Organized labs start here.
              </p>
              <p className="mt-4 text-sm text-white/90">
                Keep your inventory in sync and get back to what matters most—running experiments.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
