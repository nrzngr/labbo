"use client"

import { CustomLoginForm } from "@/components/auth/custom-login-form"
import { useCustomAuth } from "@/components/auth/custom-auth-provider"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"


function LoginContent() {
  const { user, loading, isAuthenticated } = useCustomAuth()
  const searchParams = useSearchParams()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const redirectTo = searchParams.get('redirect') || undefined
  const message = searchParams.get('message')

  useEffect(() => {
    if (isAuthenticated && !loading && !isRedirecting) {
      setIsRedirecting(true)
      // Use redirect param if provided, otherwise role-based default
      // Complexity: Time O(1) | Space O(1)
      const target = redirectTo || (user?.role === 'student' ? '/dashboard/student' : '/dashboard')
      window.location.href = target
    }
  }, [isAuthenticated, loading, isRedirecting, user, redirectTo])


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-lg font-medium">Memeriksa sesi...</div>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-lg font-medium">Mengarahkan ke dashboard...</div>
        </div>
      </div>
    )
  }

  return <CustomLoginForm redirectTo={redirectTo} />
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-lg font-medium">Memuat...</div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
