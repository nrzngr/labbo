import { emailService } from './email-service'

async function testEmailService() {
  console.log('🧪 Testing Email Service...')
  console.log('Provider:', process.env.EMAIL_PROVIDER || 'mock')

  const testEmail = process.env.TEST_EMAIL || 'test@example.com'
  const testUserName = 'Test User'
  const testLink = 'https://labbo.com/test-reset?token=test123'

  try {
    // Test password reset email
    console.log('\n📧 Testing password reset email...')
    const resetResult = await emailService.sendPasswordResetEmail(
      testEmail,
      testLink,
      testUserName
    )
    console.log('Password reset result:', resetResult)

    // Test email verification
    console.log('\n📧 Testing email verification...')
    const verifyResult = await emailService.sendEmailVerificationEmail(
      testEmail,
      testLink,
      testUserName
    )
    console.log('Email verification result:', verifyResult)

    // Test welcome email
    console.log('\n📧 Testing welcome email...')
    const welcomeResult = await emailService.sendWelcomeEmail(testEmail, testUserName)
    console.log('Welcome email result:', welcomeResult)

    console.log('\n✅ Email service test completed!')

  } catch (error) {
    console.error('❌ Email service test failed:', error)
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testEmailService()
}

export { testEmailService }