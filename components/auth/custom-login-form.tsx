'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, User, Key } from 'lucide-react'

import { LoginAccent } from './login-accent'
import { useCustomAuth } from './custom-auth-provider'

interface DemoAccount {
  email: string
  password: string
  role: string
  description: string
  full_name: string
  isDatabase: boolean
  created_at?: string
}

export function CustomLoginForm() {
  const { login, loading, user } = useCustomAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([])
  const [loadingDemo, setLoadingDemo] = useState(true)
  const [showDemoPasswords, setShowDemoPasswords] = useState(false)

  // Fetch demo accounts from database
  useEffect(() => {
    const fetchDemoAccounts = async () => {
      try {
        const response = await fetch('/api/demo-accounts')
        if (response.ok) {
          const data = await response.json()
          setDemoAccounts(data.demoAccounts || [])
        } else {
          console.error('Failed to fetch demo accounts')
        }
      } catch (error) {
        console.error('Error fetching demo accounts:', error)
      } finally {
        setLoadingDemo(false)
      }
    }

    fetchDemoAccounts()
  }, [])

  const handleDemoAccountClick = (account: DemoAccount) => {
    setFormData({
      email: account.email,
      password: account.password
    })
    setShowPassword(true)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const result = await login(formData.email, formData.password)
      if (result.success) {
        const target = user?.role === 'student' ? '/dashboard/student' : '/dashboard'
        setTimeout(() => router.push(target), 400)
      } else {
        setError(result.error || 'Login gagal')
      }
    } catch (submitError) {
      console.error(submitError)
      setError('Terjadi kesalahan. Silakan coba lagi.')
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

  const isBusy = isSubmitting || loading

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
          <div className="max-w-[420px]">
            <h1 className="text-[38px] font-semibold leading-tight text-[#111827] sm:text-[44px]">
              Back to work, genius!
            </h1>
            <p className="mt-4 text-[17px] text-[#6d7079]">
              Let&apos;s make some science happen
            </p>

            <form onSubmit={handleSubmit} className="mt-12 space-y-6">
              <div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email"
                  autoComplete="email"
                  required
                  className="w-full rounded-[16px] border border-[#dfe2ec] bg-[#eef0f8] px-5 py-4 text-[15px] text-[#1f2937] shadow-sm outline-none transition focus:border-[#ff007a] focus:ring-4 focus:ring-[rgba(255,0,122,0.16)] placeholder:text-[#9aa1b3]"
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-[16px] border border-[#dfe2ec] bg-[#eef0f8] px-5 py-4 text-[15px] text-[#1f2937] shadow-sm outline-none transition focus:border-[#ff007a] focus:ring-4 focus:ring-[rgba(255,0,122,0.16)] placeholder:text-[#9aa1b3]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(previous => !previous)}
                  className="absolute inset-y-0 right-4 flex items-center text-[#8b8f99] transition hover:text-[#ff007a]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <div className="flex justify-end text-[#6d7079]">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium transition hover:text-[#ff007a]"
                >
                  Forgot Password?
                </Link>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isBusy}
                  className="inline-flex items-center justify-center rounded-[14px] bg-[#ff007a] px-12 py-3 text-base font-semibold text-white shadow-[0_25px_45px_rgba(255,0,122,0.35)] transition hover:bg-[#e6006f] focus:outline-none focus:ring-2 focus:ring-[#ff007a] focus:ring-offset-2 focus:ring-offset-[#f7f6fb] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isBusy ? 'Signing In...' : 'Sign In'}
                </button>
              </div>

              {error && (
                <p className="text-sm text-[#f04438]" role="alert">
                  {error}
                </p>
              )}
            </form>

            {/* Demo Accounts Section */}
            <div className="mt-12">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#6d7079]">
                  Demo Accounts
                </h3>
                <button
                  type="button"
                  onClick={() => setShowDemoPasswords(!showDemoPasswords)}
                  className="text-xs text-[#ff007a] hover:text-[#e6006f] transition-colors"
                >
                  {showDemoPasswords ? 'Hide' : 'Show'} Passwords
                </button>
              </div>

              {loadingDemo ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-[#eef0f8] rounded-xl"></div>
                    </div>
                  ))}
                </div>
              ) : demoAccounts.length > 0 ? (
                <div className="space-y-2">
                  {demoAccounts.map((account, index) => (
                    <div
                      key={index}
                      onClick={() => handleDemoAccountClick(account)}
                      className="group relative overflow-hidden rounded-xl border border-[#dfe2ec] bg-[#eef0f8] p-3 cursor-pointer transition-all hover:shadow-md hover:border-[#ff007a] hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#ff007a]/10 group-hover:bg-[#ff007a]/20 transition-colors">
                            <User className="w-4 h-4 text-[#ff007a]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-[#1f2937] truncate">
                                {account.full_name}
                              </p>
                              {account.isDatabase && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-[#ff007a]/10 text-[#ff007a]">
                                  DB
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#6d7079] truncate">
                              {account.email}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#dfe2ec] text-[#6d7079]">
                                {account.role}
                              </span>
                              <span className="text-xs text-[#9aa1b3]">
                                {account.description}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {showDemoPasswords && (
                            <div className="flex items-center space-x-1 bg-[#1f2937] px-2 py-1 rounded-lg">
                              <Key className="w-3 h-3 text-[#9aa1b3]" />
                              <span className="text-xs text-[#eef0f8] font-mono">
                                {account.password}
                              </span>
                            </div>
                          )}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-6 h-6 rounded-full bg-[#ff007a] flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-[#9aa1b3]">
                    No demo accounts available
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-20 text-sm text-[#6c6f78]">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="font-medium text-[#ff007a] transition hover:text-[#e6006f]"
            >
              Register
            </Link>
          </div>
        </div>
      </div>

      <div className="relative hidden items-center justify-center bg-[#f7f6fb] lg:flex lg:w-[48%] xl:w-[52%]">
        <div className="relative w-full max-w-[700px] rounded-[72px] bg-[#ff007a] shadow-[0_45px_110px_rgba(255,0,122,0.35)] aspect-[442/550] overflow-hidden">
          <LoginAccent className="absolute inset-0 scale-[1.04]" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
