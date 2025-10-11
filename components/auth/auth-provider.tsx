'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/lib/store'

interface UserProfile {
  id: string
  full_name: string
  email: string
  role: string
  department: string
  nim?: string | null
  nip?: string | null
  phone?: string | null
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const { setUser: setStoreUser, setProfile: setStoreProfile } = useAppStore()

  const fetchProfile = async (userId: string) => {
    try {

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {

        // Don't log error for "not found" cases, just return null
        if (error.code === 'PGRST116') {

          // Create a basic profile if it doesn't exist
          const { data: authUser } = await supabase.auth.getUser()
          if (authUser.user) {
            const userRole = authUser.user.user_metadata?.role || 'student'

            // Generate required IDs based on role
            const profileData: UserProfile = {
              id: userId,
              full_name: authUser.user.user_metadata?.full_name || authUser.user.email?.split('@')[0] || 'Unknown User',
              email: authUser.user.email || '',
              role: userRole,
              department: authUser.user.user_metadata?.department || 'General'
            }

            // Add required IDs based on role to satisfy constraints
            if (userRole === 'student') {
              profileData.nim = authUser.user.user_metadata?.nim ||
                               `STU_${Math.random().toString(36).substring(2, 10).toUpperCase()}`
              profileData.nip = null
            } else if (userRole === 'lecturer') {
              profileData.nip = authUser.user.user_metadata?.nip ||
                               `LEC_${Math.random().toString(36).substring(2, 10).toUpperCase()}`
              profileData.nim = null
            } else {
              // For other roles, add both as null or appropriate values
              profileData.nim = authUser.user.user_metadata?.nim || null
              profileData.nip = authUser.user.user_metadata?.nip || null
            }


            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles')
              .upsert(profileData, {
                onConflict: 'id'
              })
              .select()
              .single()

            if (createError) {

              // Try again with default student role if constraint violation
              if (createError.message?.includes('constraint') || createError.code === '23514') {

                const fallbackData = {
                  id: userId,
                  full_name: authUser.user.user_metadata?.full_name || authUser.user.email?.split('@')[0] || 'Unknown User',
                  email: authUser.user.email,
                  role: 'student',
                  department: authUser.user.user_metadata?.department || 'General',
                  nim: `STU_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
                  nip: null
                }

                const { data: fallbackProfile, error: fallbackError } = await supabase
                  .from('user_profiles')
                  .upsert(fallbackData, {
                    onConflict: 'id'
                  })
                  .select()
                  .single()

                if (fallbackError) {
                  return null
                }

                return fallbackProfile
              }

              return null
            }

            return newProfile
          }
        } else {
          // For other errors (like 406 Not Acceptable), try a different approach

          // Try to get profile without single() to avoid 406 errors
          const { data: profiles, error: listError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .limit(1)

          if (!listError && profiles && profiles.length > 0) {
            return profiles[0]
          }
        }

        return null
      }

      return data
    } catch (error) {
      return null
    }
  }

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id)
      setProfile(profileData)
      setStoreProfile(profileData)
    }
  }

  useEffect(() => {
    let mounted = true

    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!mounted) return

        setUser(session?.user || null)

        if (session?.user) {
          const profileData = await fetchProfile(session.user.id)

          // Combine profile data with auth user data
          const combinedProfileData = profileData ? {
            ...profileData,
            email: session.user.email
          } : null

          setProfile(combinedProfileData)
          setStoreUser(session.user)
          setStoreProfile(combinedProfileData)
        } else {
          setStoreUser(null)
          setStoreProfile(null)
        }
      } catch (error) {
        setStoreUser(null)
        setStoreProfile(null)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getSession()

    // Add a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (mounted) {
        setLoading(false)
      }
    }, 3000) // 3 seconds timeout

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        setUser(session?.user || null)

        // Clear the loading timeout since we got a response
        clearTimeout(loadingTimeout)

        if (session?.user) {
          try {
            const profileData = await fetchProfile(session.user.id)

            // Combine profile data with auth user data
            const combinedProfileData = profileData ? {
              ...profileData,
              email: session.user.email
            } : null

            setProfile(combinedProfileData)
            setStoreUser(session.user)
            setStoreProfile(combinedProfileData)
          } catch (error) {
            setStoreUser(session.user)
            setStoreProfile(null)
          }
        } else {
          setProfile(null)
          setStoreUser(null)
          setStoreProfile(null)
        }

        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
      clearTimeout(loadingTimeout)
    }
  }, [setStoreProfile, setStoreUser])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setStoreUser(null)
      setStoreProfile(null)
    } catch (error) {
    }
  }

  const value = {
    user,
    profile,
    loading,
    signOut,
    refreshProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}