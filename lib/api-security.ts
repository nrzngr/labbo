import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * API Security Middleware
 * Implements rate limiting, input validation, and security headers for API routes
 */

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

interface SecurityContext {
  ipAddress: string
  userAgent?: string
  requestId: string
  timestamp: number
}

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limit configurations for different endpoints
const rateLimits: Record<string, RateLimitConfig> = {
  '/api/auth/login': { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  '/api/auth/register': { windowMs: 15 * 60 * 1000, maxRequests: 3 },
  '/api/auth/reset-password': { windowMs: 15 * 60 * 1000, maxRequests: 3 },
  '/api/auth/mfa': { windowMs: 15 * 60 * 1000, maxRequests: 10 },
  '/api/equipment': { windowMs: 15 * 60 * 1000, maxRequests: 100 },
  '/api/admin': { windowMs: 15 * 60 * 1000, maxRequests: 50 },
  '/api/transaction': { windowMs: 15 * 60 * 1000, maxRequests: 50 },
}

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIP || '127.0.0.1'
  return ip.trim()
}

/**
 * Get security context from request
 */
function getSecurityContext(request: NextRequest): SecurityContext {
  return {
    ipAddress: getClientIP(request),
    userAgent: request.headers.get('user-agent') || undefined,
    requestId: crypto.randomUUID(),
    timestamp: Date.now(),
  }
}

/**
 * Check rate limit for a specific key
 */
function checkRateLimit(key: string, config: RateLimitConfig): {
  allowed: boolean
  remaining: number
  resetTime: number
} {
  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    // New window or expired record
    const resetTime = now + config.windowMs
    rateLimitStore.set(key, { count: 1, resetTime })
    return { allowed: true, remaining: config.maxRequests - 1, resetTime }
  }

  if (record.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }

  record.count++
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  }
}

/**
 * Get rate limit key for request
 */
function getRateLimitKey(
  securityContext: SecurityContext,
  endpoint: string,
  userId?: string
): string {
  if (userId) {
    return `user:${userId}:${endpoint}`
  }
  return `ip:${securityContext.ipAddress}:${endpoint}`
}

/**
 * Apply rate limiting to request
 */
export function applyRateLimiting(
  request: NextRequest,
  endpoint: string,
  userId?: string
): {
  allowed: boolean
  response?: NextResponse
  headers: Record<string, string>
} {
  const securityContext = getSecurityContext(request)
  const config = rateLimits[endpoint] || {
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
  }

  const key = getRateLimitKey(securityContext, endpoint, userId)
  const result = checkRateLimit(key, config)

  const headers = {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
    'X-Request-ID': securityContext.requestId,
  }

  if (!result.allowed) {
    const response = NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        requestId: securityContext.requestId,
      },
      { status: 429 }
    )

    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    response.headers.set('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000).toString())

    return { allowed: false, response, headers }
  }

  return { allowed: true, headers }
}

/**
 * Validate input data against schema
 */
export function validateInput<T>(data: unknown, schema: z.ZodSchema<T>): {
  isValid: boolean
  data?: T
  errors?: string[]
  response?: NextResponse
} {
  try {
    const validatedData = schema.parse(data)
    return { isValid: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(e => e.message)
      const response = NextResponse.json(
        {
          error: 'Validation failed',
          details: errors,
        },
        { status: 400 }
      )
      return { isValid: false, errors, response }
    }

    const response = NextResponse.json(
      { error: 'Invalid input data' },
      { status: 400 }
    )
    return { isValid: false, response }
  }
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  uuid: z.string().uuid(),
  email: z.string().email('Invalid email format'),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    offset: z.coerce.number().min(0).optional(),
  }),
  searchQuery: z.object({
    q: z.string().min(1).max(100),
    category: z.string().optional(),
    status: z.enum(['available', 'borrowed', 'maintenance', 'lost']).optional(),
  }),
}

/**
 * Add security headers to API response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-API-Version', '1.0')

  // CORS headers (adjust as needed)
  response.headers.set('Access-Control-Allow-Origin', process.env.NODE_ENV === 'development' ? '*' : 'false')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400')

  return response
}

/**
 * Sanitize and validate user input
 */
export function sanitizeInput(input: any): any {
  if (typeof input !== 'object' || input === null) {
    return typeof input === 'string' ? input.trim() : input
  }

  const sanitized: any = {}
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      sanitized[key] = value.trim()
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? item.trim() : item
      )
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeInput(value)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Create security audit log entry
 */
export async function logSecurityEvent(
  eventType: string,
  details: Record<string, any>,
  securityContext: SecurityContext,
  userId?: string
): Promise<void> {
  const logEntry = {
    eventType,
    details,
    securityContext,
    userId,
    timestamp: new Date().toISOString(),
  }

  // In production, send to logging service or database
  console.log('Security Event:', JSON.stringify(logEntry, null, 2))

  // TODO: Implement proper logging to database or external service
}

/**
 * Middleware wrapper for API routes
 */
export function withApiSecurity(
  handler: (request: NextRequest, context: SecurityContext) => Promise<NextResponse>,
  options: {
    rateLimit?: RateLimitConfig
    requireAuth?: boolean
    validationSchema?: z.ZodSchema<any>
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const securityContext = getSecurityContext(request)

    try {
      // Apply rate limiting
      if (options.rateLimit) {
        const rateLimitKey = getRateLimitKey(securityContext, request.nextUrl.pathname)
        const rateLimitResult = checkRateLimit(rateLimitKey, options.rateLimit)

        if (!rateLimitResult.allowed) {
          const response = NextResponse.json(
            { error: 'Rate limit exceeded' },
            { status: 429 }
          )
          return addSecurityHeaders(response)
        }
      }

      // Validate input if schema provided
      if (options.validationSchema && request.method !== 'GET') {
        const body = await request.clone().json()
        const validation = validateInput(body, options.validationSchema)
        if (!validation.isValid) {
          return validation.response || NextResponse.json(
            { error: 'Invalid input' },
            { status: 400 }
          )
        }
      }

      // Call the handler
      const response = await handler(request, securityContext)

      // Add security headers
      return addSecurityHeaders(response)
    } catch (error) {
      console.error('API Security Error:', error)

      // Log security event
      await logSecurityEvent(
        'API_SECURITY_ERROR',
        { error: error instanceof Error ? error.message : 'Unknown error' },
        securityContext
      )

      const response = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
      return addSecurityHeaders(response)
    }
  }
}