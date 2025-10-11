'use client'

import { LoginForm } from "@/components/auth/login-form"
import { useAuth } from "@/components/auth/auth-provider"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"

function HomeContent() {
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const message = searchParams.get('message')

  // Only redirect if user is authenticated and NOT loading
  useEffect(() => {
    if (user && !loading && !isRedirecting) {
      setIsRedirecting(true)
      // Use window.location for more reliable redirect
      window.location.href = '/dashboard'
    }
  }, [user, loading, isRedirecting])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  // If user is authenticated, show loading while redirecting
  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Redirecting to dashboard...</div>
      </div>
    )
  }

  // Show login form if not authenticated
  return <LoginForm initialMessage={message} />
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
