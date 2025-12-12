import { Suspense } from 'react'
import { LinkSendForm } from '@/components/auth/link-send-form'
import { createPageMetadata } from "@/lib/page-metadata"

export const metadata = createPageMetadata("Link Sent")

export default function LinkSentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    }>
      <LinkSendForm />
    </Suspense>
  )
}
