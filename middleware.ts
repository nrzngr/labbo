import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // API routes and static assets - bypass middleware
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // Create Supabase client for middleware
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

  // Get auth token from cookies (try different possible names)
  const cookies = req.cookies
  const accessToken = cookies.get('sb-access-token')?.value
  const refreshToken = cookies.get('sb-refresh-token')?.value

  // Debug: Log available cookies (fix for Next.js 15)

  let session = null

  // Try multiple methods to get the session
  try {
    // Method 1: Use access token if available
    if (accessToken) {
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!error && user) {
        session = { user }
      }
    }

    // Method 2: Try session-based auth if token method fails
    if (!session) {
      const { data: { session: supabaseSession }, error } = await supabase.auth.getSession()
      if (!error && supabaseSession) {
        session = supabaseSession
      }
    }

  } catch (error) {
  }

  // Define protected routes
  const protectedRoutes = ['/dashboard', '/equipment', '/users', '/categories', '/borrowing', '/maintenance']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Define auth routes (redirect to dashboard if already logged in)
  const authRoutes = ['/']
  const isAuthRoute = authRoutes.includes(pathname)

  // Debug logging

  // TEMPORARILY DISABLE REDIRECTS TO ALLOW ACCESS
  // Comment out redirects for debugging

  // If accessing protected route without session, redirect to login
  // if (isProtectedRoute && !session) {
  //   const redirectUrl = new URL('/', req.url)
  //   redirectUrl.searchParams.set('message', 'Please login to access this page')
  //   return NextResponse.redirect(redirectUrl)
  // }

  // If accessing auth route with session, redirect to dashboard
  // if (isAuthRoute && session) {
  //   const redirectUrl = new URL('/dashboard', req.url)
  //   return NextResponse.redirect(redirectUrl)
  // }


  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (they handle their own auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)',
  ],
}