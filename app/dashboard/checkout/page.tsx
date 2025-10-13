'use client'

import { MobileCheckout } from '@/components/mobile/mobile-checkout'
import { ArrowLeft } from 'lucide-react'
import { ModernButton } from '@/components/ui/modern-button'
import { useRouter } from 'next/navigation'

export default function CheckoutPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileCheckout onClose={() => router.back()} />
    </div>
  )
}