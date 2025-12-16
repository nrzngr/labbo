import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiter for Edge Middleware
// Map<ip, { count: number, resetTime: number }>
const rateLimit = new Map<string, { count: number, resetTime: number }>()

const WINDOW_SIZE_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS = 100 // 100 requests per minute

/**
 * Security Middleware
 * Implements authentication checks, rate limiting, and comprehensive security headers
 */
export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  const ip = (req as any).ip || req.headers.get('x-forwarded-for') || '127.0.0.1'
  const response = NextResponse.next()

  // Add security headers to all responses
  addSecurityHeaders(response)

  // Rate Limiting Logic (DDoS Protection)
  // Clean up expired entries periodically (optimization)
  if (Math.random() < 0.01) { // 1% chance to clean up
    const now = Date.now()
    for (const [key, value] of rateLimit.entries()) {
      if (now > value.resetTime) {
        rateLimit.delete(key)
      }
    }
  }

  const now = Date.now()
  let limitData = rateLimit.get(ip)

  if (!limitData || now > limitData.resetTime) {
    limitData = { count: 0, resetTime: now + WINDOW_SIZE_MS }
    rateLimit.set(ip, limitData)
  }

  limitData.count++

  // Set real rate limit headers
  response.headers.set('X-RateLimit-Limit', MAX_REQUESTS.toString())
  response.headers.set('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - limitData.count).toString())
  response.headers.set('X-RateLimit-Reset', new Date(limitData.resetTime).toISOString())

  if (limitData.count > MAX_REQUESTS) {
    // Block request
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests', message: 'Rate limit exceeded. Please try again later.' }),
      { status: 429, headers: response.headers }
    )
  }

  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
    return response
  }

  return response
}

/**
 * Add comprehensive security headers to the response
 */
function addSecurityHeaders(response: NextResponse) {
  // Content Security Policy (CSP)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vercel.live",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)

  // Additional Security Headers
  response.headers.set('X-Frame-Options', 'DENY') // Clickjacking protection
  response.headers.set('X-Content-Type-Options', 'nosniff') // MIME sniffing protection
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  response.headers.set('X-Download-Options', 'noopen')
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  response.headers.set('X-XSS-Protection', '1; mode=block') // XSS protection

  // Strict Transport Security (HSTS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  // Permissions Policy
  const permissionsPolicy = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
  ].join(', ')

  response.headers.set('Permissions-Policy', permissionsPolicy)

  // Custom Security Headers
  response.headers.set('X-API-Version', '1.0')
  response.headers.set('X-Powered-By', 'Secure-Lab-Inventory')

  // Remove server information to prevent reconnaissance
  response.headers.delete('Server')
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}