"use client"
import React, { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useCustomAuth } from '@/components/auth/custom-auth-provider'
import { LinkSendAccent } from '@/components/auth/link-send-accent'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

function VerifyEmailContent() {
  const router = useRouter()
  const { resendVerificationEmail } = useCustomAuth()
  const [email, setEmail] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const emailParam = urlParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    } else {
      const registeredEmail = localStorage.getItem('registeredEmail')
      if (registeredEmail) {
        setEmail(registeredEmail)
      }
    }
  }, [])

  const handleResendEmail = async () => {
    if (!email) {
      setMessage('Mohon masukkan alamat email Anda')
      return
    }

    setIsResending(true)
    setMessage('')

    try {
      const result = await resendVerificationEmail(email)
      if (result.success) {
        setMessage('Email verifikasi berhasil dikirim ulang!')
      } else {
        setMessage(result.error || 'Gagal mengirim ulang email verifikasi')
      }
    } catch (error) {
      setMessage('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsResending(false)
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
            <h1 className="text-[38px] font-semibold leading-tight text-[#111827] sm:text-[44px]">
              Periksa Email Anda
            </h1>
            <p className="mt-4 text-[17px] text-[#6d7079]">
              Kami telah mengirimkan tautan verifikasi ke {email ? <span className="font-semibold text-[#1f2937]">{email}</span> : 'email Anda'}.
            </p>
            <p className="mt-2 text-[15px] text-[#6d7079]">
              Silakan periksa email Anda dan klik tautan verifikasi untuk mengaktifkan akun Anda.
            </p>

            {/* Important Info */}
            <div className="mt-8 rounded-[16px] border border-[#dfe2ec] bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#3b82f6] text-white">
                  <span className="text-xs font-bold">i</span>
                </div>
                <div>
                  <h3 className="font-semibold text-[#1f2937] mb-2">Penting:</h3>
                  <ul className="space-y-1.5 text-sm text-[#4b5563]">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-[#9ca3af]"></span>
                      Tautan verifikasi akan kedaluwarsa dalam 1 jam
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-[#9ca3af]"></span>
                      Periksa folder spam jika Anda tidak melihat email
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-[#9ca3af]"></span>
                      Pastikan untuk verifikasi sebelum mencoba masuk
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Development Mode Helper */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 rounded-[14px] border border-[#fde68a] bg-[#fffbeb] p-4 text-sm text-[#92400e]">
                <h3 className="mb-2 font-semibold">🔧 Mode Pengembangan</h3>
                <p className="mb-2">Pengiriman email dikonfigurasi tetapi mungkin memerlukan setup Password Aplikasi Gmail.</p>
                {(() => {
                  if (typeof window === 'undefined') return null
                  const devLinks = []
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i)
                    if (key && key.startsWith('dev_verification_')) {
                      const link = localStorage.getItem(key)
                      if (link) devLinks.push(link)
                    }
                  }
                  return devLinks.length > 0 ? (
                    <div>
                      <p className="mb-1 font-medium">Tautan Verifikasi Manual:</p>
                      {devLinks.map((link, index) => (
                        <div key={index} className="mb-1">
                          <a href={link} target="_blank" rel="noopener noreferrer" className="break-all text-blue-600 underline hover:text-blue-800">
                            {link}
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : null
                })()}
              </div>
            )}

            {/* Message Display */}
            {message && (
              <div className={`mt-6 flex items-start gap-2 rounded-[14px] px-4 py-3 text-sm ${message.includes('berhasil')
                  ? 'border border-[#86efac] bg-[#dcfce7] text-[#166534]'
                  : 'border border-[#f9a8d4] bg-[#ffe8ef] text-[#b4235d]'
                }`}>
                {message.includes('berhasil') ? <RefreshCw className="mt-0.5 h-4 w-4 flex-shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />}
                <span>{message}</span>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-4">
              <Link
                href="/"
                className="inline-flex w-full items-center justify-center rounded-[14px] bg-[#ff007a] px-8 py-3 text-base font-semibold text-white shadow-[0_25px_45px_rgba(255,0,122,0.35)] transition hover:bg-[#e6006f] focus:outline-none focus:ring-2 focus:ring-[#ff007a] focus:ring-offset-2 focus:ring-offset-[#f7f6fb]"
              >
                Masuk
              </Link>

              <button
                onClick={handleResendEmail}
                disabled={isResending || !email}
                className="inline-flex w-full items-center justify-center rounded-[14px] border border-[#dfe2ec] bg-white px-8 py-3 text-base font-semibold text-[#1f2937] transition hover:bg-[#f9fafb] focus:outline-none focus:ring-2 focus:ring-[#dfe2ec] focus:ring-offset-2 focus:ring-offset-[#f7f6fb] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isResending ? 'Mengirim...' : 'Kirim Ulang Email Verifikasi'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Decorative Panel */}
      <div className="relative hidden items-center justify-center bg-[#f7f6fb] lg:flex lg:w-[48%] xl:w-[52%]">
        <div className="relative w-full max-w-[700px] rounded-[72px] bg-[#ff007a] shadow-[0_45px_110px_rgba(255,0,122,0.35)] aspect-[442/550] overflow-hidden">
          <LinkSendAccent className="absolute inset-0 scale-[1.04]" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailSentPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#f7f6fb]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#ff007a] border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-lg font-medium text-[#1f2937]">Memuat...</div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
