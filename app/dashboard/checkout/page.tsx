'use client'

import { Suspense } from 'react'
import { MobileCheckout } from '@/components/mobile/mobile-checkout'
import { ArrowLeft } from 'lucide-react'
import { ModernButton } from '@/components/ui/modern-button'
import { useRouter } from 'next/navigation'

export default function CheckoutPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      }>
        <MobileCheckout onClose={() => router.back()} />
      </Suspense>
    </div>
  )
}