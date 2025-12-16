'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCustomAuth } from './custom-auth-provider'
import { AlertTriangle, CheckCircle, RefreshCw, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { RegisterAccent } from './register-accent'

export function EmailVerificationForm() {
  const { verifyEmail } = useCustomAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setError('Tautan verifikasi tidak valid')
      return
    }

    handleVerification()
  }, [token])

  const handleVerification = async () => {
    if (isVerifying || isVerified) return

    setIsVerifying(true)
    setError('')

    try {
      const result = await verifyEmail(token)

      if (result.success) {
        setIsVerified(true)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/')
        }, 3000)
      } else {
        setError(result.error || 'Gagal memverifikasi email')
      }
    } catch (error) {
      console.error('Email verification error:', error)
      setError('Terjadi kesalahan saat memverifikasi email Anda')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#f7f6fb] text-[#111827] lg:flex-row">
      {/* Left Column - Content */}
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

            {/* Status Content */}
            {isVerified ? (
              <>
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <CheckCircle className="h-10 w-10" />
                </div>
                <h1 className="text-[32px] font-semibold leading-tight text-[#111827] sm:text-[38px]">
                  Email Terverifikasi!
                </h1>
                <p className="mt-4 text-[17px] text-[#6d7079]">
                  Akun Anda telah berhasil diverifikasi. Anda sekarang dapat masuk dan mengakses layanan kami.
                </p>
                <div className="mt-8 rounded-[14px] bg-green-50 p-4 text-green-700 border border-green-200">
                  <p className="flex items-center gap-2 font-medium">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mengalihkan ke halaman login...
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#ff007a] text-white">
                  {isVerifying ? (
                    <Loader2 className="h-10 w-10 animate-spin" />
                  ) : (
                    <RefreshCw className="h-10 w-10" />
                  )}
                </div>
                <h1 className="text-[32px] font-semibold leading-tight text-[#111827] sm:text-[38px]">
                  Verifikasi Email Anda
                </h1>
                <p className="mt-4 text-[17px] text-[#6d7079]">
                  {isVerifying
                    ? 'Mohon tunggu sementara kami memverifikasi token email Anda ini untuk memastikan keamanan akun.'
                    : error
                      ? 'Sayangnya kami tidak dapat memverifikasi email Anda dengan tautan tersebut.'
                      : 'Memproses verifikasi email...'}
                </p>
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-6 flex items-start gap-2 rounded-[14px] border border-[#f9a8d4] bg-[#ffe8ef] px-4 py-3 text-[#b4235d]">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Manual Actions if not auto-redirecting or if error */}
            {!isVerified && !isVerifying && (
              <div className="mt-8 flex flex-col gap-4">
                {error && (
                  <Link
                    href="/verify-email-sent"
                    className="inline-flex w-full items-center justify-center rounded-[14px] border border-[#dfe2ec] bg-white px-8 py-3 text-base font-semibold text-[#1f2937] transition hover:bg-[#f9fafb] focus:outline-none focus:ring-2 focus:ring-[#dfe2ec] focus:ring-offset-2 focus:ring-offset-[#f7f6fb]"
                  >
                    Minta tautan baru
                  </Link>
                )}
                <Link
                  href="/"
                  className="inline-flex w-full items-center justify-center rounded-[14px] bg-[#ff007a] px-8 py-3 text-base font-semibold text-white shadow-[0_25px_45px_rgba(255,0,122,0.35)] transition hover:bg-[#e6006f] focus:outline-none focus:ring-2 focus:ring-[#ff007a] focus:ring-offset-2 focus:ring-offset-[#f7f6fb]"
                >
                  Kembali ke Masuk
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Decorative Panel */}
      <div className="relative hidden items-center justify-center bg-[#f7f6fb] lg:flex lg:w-[48%] xl:w-[52%]">
        <div className="relative w-full max-w-[700px] rounded-[72px] bg-[#ff007a] shadow-[0_45px_110px_rgba(255,0,122,0.35)] aspect-[442/550] overflow-hidden">
          <RegisterAccent className="absolute inset-0 scale-[1.04]" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}