import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'
import { createPageMetadata } from "@/lib/page-metadata"

export const metadata = createPageMetadata("Forgot Password")

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
