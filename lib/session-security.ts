import crypto from 'crypto'
import { supabase } from '@/lib/supabase'

/**
 * Session Security Management
 * Implements secure session handling with JWT rotation and concurrent session limits
 */

export interface SessionData {
  userId: string
  userEmail: string
  userRole: string
  loginTime: string
  lastActivity: string
  sessionId: string
  ipAddress?: string
  userAgent?: string
}

export interface SessionValidationResult {
  valid: boolean
  session?: SessionData
  error?: string
  requiresRefresh?: boolean
}

// Session storage (in production, use Redis)
const activeSessions = new Map<string, SessionData>()
const userSessions = new Map<string, Set<string>>()

// Session configuration
const SESSION_TIMEOUT = 15 * 60 * 1000 // 15 minutes
const MAX_CONCURRENT_SESSIONS = 3
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000 // 5 minutes before expiry

/**
 * Generate secure session ID
 */
function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Create new session
 */
export async function createSession(
  userId: string,
  userEmail: string,
  userRole: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ sessionId: string; sessionData: SessionData }> {
  const sessionId = generateSessionId()
  const now = new Date().toISOString()

  const sessionData: SessionData = {
    userId,
    userEmail,
    userRole,
    loginTime: now,
    lastActivity: now,
    sessionId,
    ipAddress,
    userAgent,
  }

  // Check concurrent session limit
  const userSessionSet = userSessions.get(userId) || new Set()
  if (userSessionSet.size >= MAX_CONCURRENT_SESSIONS) {
    // Remove oldest session
    const oldestSessionId = Array.from(userSessionSet)[0]
    await removeSession(oldestSessionId)
    userSessionSet.delete(oldestSessionId)
  }

  // Store session
  activeSessions.set(sessionId, sessionData)
  userSessionSet.add(sessionId)
  userSessions.set(userId, userSessionSet)

  // Log session creation
  await logSessionEvent('SESSION_CREATED', {
    userId,
    sessionId,
    ipAddress,
    userAgent,
  })

  return { sessionId, sessionData }
}

/**
 * Validate session
 */
export async function validateSession(
  sessionId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<SessionValidationResult> {
  const session = activeSessions.get(sessionId)

  if (!session) {
    return { valid: false, error: 'Session not found' }
  }

  const now = Date.now()
  const lastActivity = new Date(session.lastActivity).getTime()
  const sessionAge = now - lastActivity

  // Check session timeout
  if (sessionAge > SESSION_TIMEOUT) {
    await removeSession(sessionId)
    return { valid: false, error: 'Session expired' }
  }

  // Check for suspicious activity (different IP or user agent)
  let securityFlags = []
  if (ipAddress && session.ipAddress && ipAddress !== session.ipAddress) {
    securityFlags.push('IP_CHANGED')
  }
  if (userAgent && session.userAgent && userAgent !== session.userAgent) {
    securityFlags.push('USER_AGENT_CHANGED')
  }

  if (securityFlags.length > 0) {
    await logSessionEvent('SESSION_SECURITY_FLAG', {
      sessionId,
      userId: session.userId,
      flags: securityFlags,
      originalIp: session.ipAddress,
      newIp: ipAddress,
      originalUserAgent: session.userAgent,
      newUserAgent: userAgent,
    })
  }

  // Update last activity
  session.lastActivity = new Date().toISOString()

  // Check if session should be refreshed
  const loginTime = new Date(session.loginTime).getTime()
  const requiresRefresh = (now - loginTime) > TOKEN_REFRESH_THRESHOLD

  return {
    valid: true,
    session,
    requiresRefresh,
  }
}

/**
 * Remove session
 */
export async function removeSession(sessionId: string): Promise<void> {
  const session = activeSessions.get(sessionId)
  if (session) {
    const userSessionSet = userSessions.get(session.userId)
    if (userSessionSet) {
      userSessionSet.delete(sessionId)
      if (userSessionSet.size === 0) {
        userSessions.delete(session.userId)
      }
    }

    activeSessions.delete(sessionId)

    // Log session removal
    await logSessionEvent('SESSION_REMOVED', {
      sessionId,
      userId: session.userId,
    })
  }
}

/**
 * Remove all sessions for a user
 */
export async function removeAllUserSessions(userId: string): Promise<void> {
  const userSessionSet = userSessions.get(userId)
  if (userSessionSet) {
    for (const sessionId of userSessionSet) {
      activeSessions.delete(sessionId)
    }
    userSessions.delete(userId)

    // Log bulk session removal
    await logSessionEvent('ALL_USER_SESSIONS_REMOVED', {
      userId,
      sessionCount: userSessionSet.size,
    })
  }
}

/**
 * Get active sessions for a user
 */
export function getUserSessions(userId: string): SessionData[] {
  const userSessionSet = userSessions.get(userId)
  if (!userSessionSet) return []

  return Array.from(userSessionSet)
    .map(sessionId => activeSessions.get(sessionId))
    .filter(Boolean) as SessionData[]
}

/**
 * Refresh session (extend session time)
 */
export async function refreshSession(sessionId: string): Promise<boolean> {
  const session = activeSessions.get(sessionId)
  if (!session) return false

  session.lastActivity = new Date().toISOString()

  await logSessionEvent('SESSION_REFRESHED', {
    sessionId,
    userId: session.userId,
  })

  return true
}

/**
 * Get session security information
 */
export function getSessionSecurityInfo(sessionId: string): {
  sessionAge: number
  timeToExpiry: number
  concurrentSessions: number
} | null {
  const session = activeSessions.get(sessionId)
  if (!session) return null

  const now = Date.now()
  const lastActivity = new Date(session.lastActivity).getTime()
  const sessionAge = now - new Date(session.loginTime).getTime()
  const timeToExpiry = SESSION_TIMEOUT - (now - lastActivity)
  const concurrentSessions = userSessions.get(session.userId)?.size || 0

  return {
    sessionAge,
    timeToExpiry,
    concurrentSessions,
  }
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
  const now = Date.now()
  const expiredSessions: string[] = []

  for (const [sessionId, session] of activeSessions.entries()) {
    const lastActivity = new Date(session.lastActivity).getTime()
    if (now - lastActivity > SESSION_TIMEOUT) {
      expiredSessions.push(sessionId)
    }
  }

  for (const sessionId of expiredSessions) {
    await removeSession(sessionId)
  }

  if (expiredSessions.length > 0) {
    await logSessionEvent('EXPIRED_SESSIONS_CLEANED', {
      expiredCount: expiredSessions.length,
    })
  }
}

/**
 * Log session events
 */
async function logSessionEvent(
  eventType: string,
  details: Record<string, any>
): Promise<void> {
  try {
    await supabase.from('audit_log').insert({
      action: eventType,
      table_name: 'session',
      record_id: details.sessionId || details.userId || 'system',
      new_values: details,
      created_at: new Date().toISOString(),
    } as any)
  } catch (error) {
    console.error('Failed to log session event:', error)
  }
}

/**
 * Generate secure session token
 */
export function generateSessionToken(sessionData: SessionData): string {
  const tokenData = {
    sessionId: sessionData.sessionId,
    userId: sessionData.userId,
    exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
    iat: Math.floor(Date.now() / 1000),
  }

  // In production, use proper JWT signing
  return Buffer.from(JSON.stringify(tokenData)).toString('base64')
}

/**
 * Validate session token
 */
export function validateSessionToken(token: string): SessionData | null {
  try {
    const tokenData = JSON.parse(Buffer.from(token, 'base64').toString())

    if (tokenData.exp < Math.floor(Date.now() / 1000)) {
      return null // Token expired
    }

    const session = activeSessions.get(tokenData.sessionId)
    return session || null
  } catch {
    return null
  }
}

/**
 * Check if user has exceeded session limit
 */
export function hasExceededSessionLimit(userId: string): boolean {
  const userSessionSet = userSessions.get(userId)
  return (userSessionSet?.size || 0) >= MAX_CONCURRENT_SESSIONS
}

/**
 * Get session statistics
 */
export function getSessionStats(): {
  totalSessions: number
  uniqueUsers: number
  averageSessionsPerUser: number
} {
  const totalSessions = activeSessions.size
  const uniqueUsers = userSessions.size
  const averageSessionsPerUser = uniqueUsers > 0 ? totalSessions / uniqueUsers : 0

  return {
    totalSessions,
    uniqueUsers,
    averageSessionsPerUser,
  }
}

// Auto-cleanup expired sessions every 5 minutes
setInterval(cleanupExpiredSessions, 5 * 60 * 1000)