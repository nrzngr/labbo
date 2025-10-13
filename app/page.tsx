'use client'

import { CustomLoginForm } from "@/components/auth/custom-login-form"
import { useCustomAuth } from "@/components/auth/custom-auth-provider"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"

function HomeContent() {
  const { user, loading, isAuthenticated } = useCustomAuth()
  const searchParams = useSearchParams()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const message = searchParams.get('message')

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

  return <CustomLoginForm />
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-lg font-medium">Memuat...</div>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
