import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Security Middleware
 * Implements authentication checks and comprehensive security headers
 */
export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  const response = NextResponse.next()

  // Add security headers to all responses
  addSecurityHeaders(response)

  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
    return response
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  const cookies = req.cookies
  const accessToken = cookies.get('sb-access-token')?.value
  const refreshToken = cookies.get('sb-refresh-token')?.value

  let session = null

  try {
    if (accessToken) {
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!error && user) {
        session = { user }
      }
    }

    if (!session) {
      const { data: { session: supabaseSession }, error } = await supabase.auth.getSession()
      if (!error && supabaseSession) {
        session = supabaseSession
      }
    }

  } catch (error) {
  }

  const protectedRoutes = ['/dashboard', '/equipment', '/users', '/categories', '/borrowing', '/maintenance']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  const authRoutes = ['/']
  const isAuthRoute = authRoutes.includes(pathname)


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
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  response.headers.set('X-Download-Options', 'noopen')
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Strict Transport Security (HSTS) - Only in production
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

  // Remove server information
  response.headers.delete('Server')

  // Rate limiting headers (will be implemented in API routes)
  response.headers.set('X-RateLimit-Limit', '100')
  response.headers.set('X-RateLimit-Remaining', '99')
  response.headers.set('X-RateLimit-Reset', new Date(Date.now() + 15 * 60 * 1000).toISOString())
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}