"use client"

import { RegisterForm } from "@/components/auth/register-form"
import { useCustomAuth } from "@/components/auth/custom-auth-provider"
import { useEffect, useState, Suspense } from "react"
import { useRouter } from "next/navigation"


function RegisterContent() {
  const { user, loading, isAuthenticated } = useCustomAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (isAuthenticated && !loading && !isRedirecting) {
      setIsRedirecting(true)
      if (user?.role === 'student') {
        window.location.href = '/dashboard/student'
      } else {
        window.location.href = '/dashboard'
      }
    }
  }, [isAuthenticated, loading, isRedirecting, user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-lg font-medium">Checking session...</div>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-lg font-medium">Redirecting to dashboard...</div>
        </div>
      </div>
    )
  }

  return <RegisterForm />
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-lg font-medium">Loading...</div>
        </div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  )
}
