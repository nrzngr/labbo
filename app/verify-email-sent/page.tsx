"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { useCustomAuth } from '@/components/auth/custom-auth-provider'


export default function VerifyEmailSentPage() {
  const router = useRouter()
  const { resendVerificationEmail } = useCustomAuth()
  const [email, setEmail] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [message, setMessage] = useState('')

  // Get email from URL params or localStorage
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const emailParam = urlParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    } else {
      // Try to get from localStorage or recent registration
      const registeredEmail = localStorage.getItem('registeredEmail')
      if (registeredEmail) {
        setEmail(registeredEmail)
      }
    }
  }, [])

  const handleResendEmail = async () => {
    if (!email) {
      setMessage('Please enter your email address')
      return
    }

    setIsResending(true)
    setMessage('')

    try {
      const result = await resendVerificationEmail(email)
      if (result.success) {
        setMessage('Verification email resent successfully!')
      } else {
        setMessage(result.error || 'Failed to resend verification email')
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Column - Content */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md text-center">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900">Labbo</span>
          </div>

          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-green-600" />
          </div>

          {/* Headline */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Check your email</h1>
            <p className="text-lg text-gray-600 mb-2">
              We've sent you a verification link
            </p>
            <p className="text-gray-500">
              Please check your email and click the verification link to activate your account.
            </p>
          </div>

          {/* Important Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-left">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">i</span>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Important:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• The verification link will expire in 1 hour</li>
                  <li>• Check your spam folder if you don't see the email</li>
                  <li>• Make sure to verify before trying to log in</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Email Input (if no email detected) */}
          {!email && (
            <div className="mb-6">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Development Mode - Show Verification Link */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">🔧 Development Mode</h3>
              <p className="text-sm text-yellow-700 mb-3">
                Email sending is configured but may require Gmail App Password setup.
              </p>
              {(() => {
                // Check for any development verification links in localStorage
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
                    <p className="text-sm font-medium text-yellow-800 mb-2">Manual Verification Links:</p>
                    {devLinks.map((link, index) => (
                      <div key={index} className="mb-2">
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 underline break-all"
                        >
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
            <div className={`mb-6 p-3 rounded-lg text-sm ${
              message.includes('success')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link
              href="/"
              className="w-full bg-pink-500 text-white py-3 rounded-lg font-medium hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-colors inline-block"
            >
              Go to Sign In
            </Link>

            <button
              onClick={handleResendEmail}
              disabled={isResending || !email}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </div>

          {/* Back Link */}
          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
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
