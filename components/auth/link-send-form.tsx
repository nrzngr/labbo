'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { LinkSendAccent } from './link-send-accent'

export function LinkSendForm() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  const handleResendLink = async () => {
    setIsResending(true)
    setResendMessage('')

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      setResendMessage('Link has been resent to your email!')
    } catch (error) {
      setResendMessage('Failed to resend link. Please try again.')
    } finally {
      setIsResending(false)
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
            <div className="mb-10 flex h-20 w-20 items-center justify-center rounded-full bg-[#ff007a] shadow-[0_18px_36px_rgba(255,0,122,0.35)]">
              <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-[40px] font-semibold leading-tight text-[#111827] sm:text-[46px]">
              Reset link sent!
            </h1>
            <p className="mt-4 text-[17px] text-[#6d7079]">
              Check your inbox and follow the instructions to create a new password.
            </p>

            <div className="mt-12 text-sm text-[#6d7079]">
              Didn&apos;t receive the email?{' '}
              <button
                onClick={handleResendLink}
                disabled={isResending}
                className="font-medium text-[#ff007a] transition hover:text-[#e6006f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResending ? 'Sending...' : 'Resend link'}
              </button>
            </div>

            {resendMessage && (
              <div
                className={`mt-5 inline-flex rounded-[12px] px-4 py-3 text-sm ${
                  resendMessage.toLowerCase().includes('fail')
                    ? 'border border-[#f9a8d4] bg-[#ffe8ef] text-[#b4235d]'
                    : 'border border-[#b7f0d1] bg-[#e9fdf1] text-[#10753f]'
                }`}
              >
                {resendMessage}
              </div>
            )}
          </div>

          <div className="mt-16 text-sm text-[#6c6f78]">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-medium text-[#ff007a] transition hover:text-[#e6006f]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>

      <div className="relative hidden items-center justify-center bg-[#f8f7fb] lg:flex lg:w-[48%] xl:w-[52%]">
        <div className="relative w-full max-w-[700px] rounded-[72px] bg-[#ff007a] shadow-[0_40px_90px_rgba(255,0,122,0.32)] aspect-[442/550] overflow-hidden">
          <LinkSendAccent className="absolute inset-0 scale-[1.04]" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
