// Email configuration test utility
import { emailService } from './email-service-real'

export function testEmailConfiguration() {
  console.log('🧪 Testing Email Configuration...\n')

  // Check environment variables
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS
  const provider = process.env.EMAIL_PROVIDER

  console.log('📧 Email Configuration:')
  console.log('  Provider:', provider || 'not set')
  console.log('  Gmail User:', gmailUser ? `${gmailUser.slice(0, 3)}***@***.com` : 'not set')
  console.log('  Gmail Password:', gmailPass ? 'configured' : 'not set')
  console.log('  Gmail From Email:', process.env.GMAIL_FROM_EMAIL || 'not set')
  console.log('  Gmail From Name:', process.env.GMAIL_FROM_NAME || 'not set')

  if (provider === 'gmail' && gmailUser && gmailPass) {
    console.log('\n✅ Gmail SMTP is properly configured!')
    console.log('📧 Ready to send emails via Gmail SMTP')
  } else if (provider === 'mock') {
    console.log('\n⚠️ Using mock email provider (emails will only be logged)')
  } else {
    console.log('\n❌ Email service not properly configured')
    console.log('💡 See SETUP_GMAIL_SMTP.md for configuration instructions')
  }

  return {
    provider: provider || 'mock',
    gmailConfigured: !!(gmailUser && gmailPass),
    readyToSend: provider === 'gmail' && !!(gmailUser && gmailPass)
  }
}

// Test function to send a test email (server-side only)
export async function sendTestEmail(toEmail: string) {
  if (typeof window !== 'undefined') {
    return { success: false, error: 'Email sending only available on server-side' }
  }

  try {
    const result = await emailService.sendWelcomeEmail(toEmail, 'Test User')
    console.log('📧 Test email result:', result)
    return result
  } catch (error) {
    console.error('❌ Failed to send test email:', error)
    return { success: false, error: 'Failed to send test email' }
  }
}

// Export for use in other files
export { testEmailService } from './test-email'