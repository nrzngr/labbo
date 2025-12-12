'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCustomAuth } from './custom-auth-provider'
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export function EmailVerificationForm() {
  const { verifyEmail } = useCustomAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (!token) {
      setError('Invalid verification link')
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
        setError(result.error || 'Failed to verify email')
      }
    } catch (error) {
      console.error('Email verification error:', error)
      setError('An error occurred while verifying your email')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Column - Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900">Labbo</span>
          </div>

          {/* Status */}
          {isVerified ? (
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Verified!</h1>
              <p className="text-lg text-gray-600">Your account has been successfully verified.</p>
            </div>
          ) : (
            <div className="mb-8">
              <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                {isVerifying ? (
                  <RefreshCw className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a8 8 0 100-8 8 0 018 8 8 0 018-8 8 0 00-8zm1 12V9H8v2l4 2 4-2h5z" />
                  </svg>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
              <p className="text-lg text-gray-600">Please wait while we verify your email address.</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-6">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {isVerified && (
            <div className="text-center">
              <p className="text-green-600 font-medium mb-4">
                Redirecting to login page...
              </p>
              <div className="w-6 h-6 bg-green-500 rounded-full mx-auto animate-pulse"></div>
            </div>
          )}

          {/* Loading State */}
          {isVerifying && (
            <div className="text-center">
              <p className="text-pink-500 font-medium">
                Verifying your email...
              </p>
              <div className="w-6 h-6 bg-pink-500 rounded-full mx-auto animate-spin"></div>
            </div>
          )}

          {/* Help Text */}
          {!isVerified && !isVerifying && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 mb-4">
                This verification link will expire in 1 hour.
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  Didn't receive the email?
                </p>
                <Link
                  href="/verify-email-sent"
                  className="text-pink-500 hover:text-pink-600 font-medium text-sm transition-colors"
                >
                  Request a new verification link
                </Link>
              </div>
            </div>
          )}

          {/* Back to Sign In */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Right Column - Decorative Panel */}
      <div className="hidden lg:flex lg:flex-1 bg-pink-500 items-center justify-center p-8">
        <div className="relative w-full h-full max-w-2xl max-h-[600px]">
          {/* Abstract Decorative Shapes */}
          <svg className="w-full h-full" viewBox="0 0 400 600" fill="none">
            {/* Curved Lines */}
            <path d="M50 300 Q100 200 150 250 T250 200" stroke="white" strokeWidth="3" opacity="0.3"/>
            <path d="M100 400 Q200 350 250 400 T350 350" stroke="white" strokeWidth="2" opacity="0.2"/>
            <path d="M80 180 Q150 120 200 160 T300 140" stroke="white" strokeWidth="2.5" opacity="0.25"/>
            <path d="M120 500 Q180 450 220 480 T280 460" stroke="white" strokeWidth="2" opacity="0.2"/>

            {/* Diagonal Line */}
            <path d="M300 50 L100 500" stroke="white" strokeWidth="2" opacity="0.15"/>

            {/* Curved Top Edge */}
            <path d="M50 100 Q200 50 350 100" stroke="white" strokeWidth="4" opacity="0.2"/>

            {/* Geometric Shapes */}
            <circle cx="80" cy="150" r="40" fill="white" opacity="0.1"/>
            <rect x="300" y="100" width="60" height="60" fill="white" opacity="0.1" transform="rotate(45 330 130)"/>
            <polygon points="200,450 250,500 150,500" fill="white" opacity="0.1"/>

            {/* Additional decorative elements */}
            <circle cx="320" cy="400" r="25" fill="white" opacity="0.08"/>
            <rect x="50" y="500" width="40" height="40" fill="white" opacity="0.08" transform="rotate(30 70 520)"/>
            <ellipse cx="250" cy="300" rx="35" ry="20" fill="white" opacity="0.06"/>
          </svg>
        </div>
      </div>
    </div>
  )
}