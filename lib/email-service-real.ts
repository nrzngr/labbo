import { Resend } from 'resend'
// Note: nodemailer is only imported on server-side to avoid bundling issues

export interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
  replyTo?: string
}

export interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

export interface EmailProvider {
  send(options: EmailOptions): Promise<{ success: boolean; error?: string }>
}

export class ResendEmailProvider implements EmailProvider {
  private resend: Resend
  private fromEmail: string
  private fromName: string

  constructor(apiKey: string, fromEmail: string, fromName: string = 'Labbo') {
    this.resend = new Resend(apiKey)
    this.fromEmail = fromEmail
    this.fromName = fromName
  }

  async send(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        replyTo: options.replyTo || this.fromEmail,
      })

      if (error) {
        console.error('Resend email error:', error)
        return { success: false, error: `Failed to send email: ${error.message}` }
      }

      console.log('Email sent successfully via Resend:', {
        to: options.to,
        subject: options.subject,
        id: data?.id
      })

      return { success: true }
    } catch (error) {
      console.error('Resend email provider error:', error)
      return { success: false, error: 'Email provider error' }
    }
  }
}

export class NodemailerEmailProvider implements EmailProvider {
  private transporter: any
  private fromEmail: string
  private fromName: string

  constructor(config: {
    host: string
    port: number
    secure: boolean
    auth: { user: string; pass: string }
    fromEmail: string
    fromName?: string
  }) {
    this.fromEmail = config.fromEmail
    this.fromName = config.fromName || 'Labbo'

    // Only create transporter in server environment
    if (typeof window === 'undefined') {
      this.initializeTransporter(config)
    }
  }

  private async initializeTransporter(config: any) {
    try {
      // Dynamic import to avoid bundling nodemailer in client-side code
      const nodemailer = await import('nodemailer')

      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.auth,
        tls: {
          rejectUnauthorized: false // Allow self-signed certificates for testing
        }
      })
    } catch (error) {
      console.error('Failed to initialize Nodemailer:', error)
      this.transporter = null
    }
  }

  async send(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if we're in server environment
      if (typeof window !== 'undefined') {
        return { success: false, error: 'Email service only available on server-side' }
      }

      // Initialize transporter if not already done
      if (!this.transporter) {
        return { success: false, error: 'Email transporter not initialized' }
      }

      const info = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        replyTo: options.replyTo || this.fromEmail,
      })

      console.log('✅ Email sent successfully via Gmail SMTP:', {
        to: options.to,
        subject: options.subject,
        messageId: info.messageId
      })

      return { success: true }
    } catch (error) {
      console.error('❌ Gmail SMTP email provider error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email provider error'
      }
    }
  }
}

export class SendGridEmailProvider implements EmailProvider {
  private apiKey: string
  private fromEmail: string
  private fromName: string

  constructor(apiKey: string, fromEmail: string, fromName: string = 'Labbo') {
    this.apiKey = apiKey
    this.fromEmail = fromEmail
    this.fromName = fromName
  }

  async send(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: options.to }],
            subject: options.subject,
          }],
          from: { email: this.fromEmail, name: this.fromName },
          content: [{
            type: 'text/html',
            value: options.html,
          }],
          reply_to: { email: options.replyTo || this.fromEmail },
        }),
      })

      if (response.status >= 400) {
        const errorData = await response.json()
        console.error('SendGrid email error:', errorData)
        return { success: false, error: `Failed to send email: ${errorData.message || 'Unknown error'}` }
      }

      console.log('Email sent successfully via SendGrid:', {
        to: options.to,
        subject: options.subject,
        status: response.status
      })

      return { success: true }
    } catch (error) {
      console.error('SendGrid email provider error:', error)
      return { success: false, error: 'Email provider error' }
    }
  }
}

// Mock email provider for development/testing
export class MockEmailProvider implements EmailProvider {
  async send(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    console.log('📧 MOCK EMAIL SENT:', {
      to: options.to,
      subject: options.subject,
      html: options.html,
      timestamp: new Date().toISOString()
    })

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500))

    return { success: true }
  }
}

export class EmailService {
  private provider: EmailProvider

  constructor(provider?: EmailProvider) {
    this.provider = provider || new MockEmailProvider()
  }

  async sendPasswordResetEmail(email: string, resetLink: string, userName: string): Promise<{ success: boolean; error?: string }> {
    const template = this.getPasswordResetTemplate(userName, resetLink)

    return this.provider.send({
      to: email,
      subject: template.subject,
      html: template.html
    })
  }

  async sendEmailVerificationEmail(email: string, verificationLink: string, userName: string): Promise<{ success: boolean; error?: string }> {
    const template = this.getEmailVerificationTemplate(userName, verificationLink)

    return this.provider.send({
      to: email,
      subject: template.subject,
      html: template.html
    })
  }

  async sendAccountLockedEmail(email: string, lockDuration: string, userName: string): Promise<{ success: boolean; error?: string }> {
    const template = this.getAccountLockedTemplate(userName, lockDuration)

    return this.provider.send({
      to: email,
      subject: template.subject,
      html: template.html
    })
  }

  async sendWelcomeEmail(email: string, userName: string): Promise<{ success: boolean; error?: string }> {
    const template = this.getWelcomeTemplate(userName)

    return this.provider.send({
      to: email,
      subject: template.subject,
      html: template.html
    })
  }

  private getPasswordResetTemplate(userName: string, resetLink: string): EmailTemplate {
    return {
      subject: 'Reset your Labbo password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset your Labbo password</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: #FF3E96;
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #fff;
              padding: 40px;
              border-radius: 0 0 10px 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .button {
              display: inline-block;
              background: #FF3E96;
              color: white;
              text-decoration: none;
              padding: 15px 30px;
              border-radius: 5px;
              font-weight: 600;
              margin: 20px 0;
            }
            .button:hover {
              background: #E6318E;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 14px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Labbo</h1>
            <p>Reset your password</p>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>We received a request to reset your password for your Labbo account. Click the button below to create a new password:</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            <p><strong>Important:</strong></p>
            <ul>
              <li>This link will expire in 24 hours</li>
              <li>If you didn't request this password reset, please ignore this email</li>
              <li>Never share this link with anyone</li>
            </ul>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666; background: #f5f5f5; padding: 10px; border-radius: 5px;">${resetLink}</p>
          </div>
          <div class="footer">
            <p>This is an automated message from Labbo. Please do not reply to this email.</p>
          </div>
        </body>
        </html>
      `
    }
  }

  private getEmailVerificationTemplate(userName: string, verificationLink: string): EmailTemplate {
    return {
      subject: 'Verify your Labbo account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your Labbo account</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: #FF3E96;
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #fff;
              padding: 40px;
              border-radius: 0 0 10px 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .button {
              display: inline-block;
              background: #FF3E96;
              color: white;
              text-decoration: none;
              padding: 15px 30px;
              border-radius: 5px;
              font-weight: 600;
              margin: 20px 0;
            }
            .button:hover {
              background: #E6318E;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 14px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Labbo</h1>
            <p>Verify your account</p>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>Welcome to Labbo! To complete your registration and start using our laboratory inventory management system, please verify your email address:</p>
            <div style="text-align: center;">
              <a href="${verificationLink}" class="button">Verify Email</a>
            </div>
            <p><strong>Important:</strong></p>
            <ul>
              <li>This verification link will expire in 1 hour</li>
              <li>If you didn't create an account with Labbo, please ignore this email</li>
              <li>Your account will not be activated until you verify your email</li>
            </ul>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666; background: #f5f5f5; padding: 10px; border-radius: 5px;">${verificationLink}</p>
          </div>
          <div class="footer">
            <p>This is an automated message from Labbo. Please do not reply to this email.</p>
          </div>
        </body>
        </html>
      `
    }
  }

  private getAccountLockedTemplate(userName: string, lockDuration: string): EmailTemplate {
    return {
      subject: 'Your Labbo account has been locked',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account locked</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: #dc3545;
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #fff;
              padding: 40px;
              border-radius: 0 0 10px 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              color: #856404;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 14px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔒 Account Locked</h1>
            <p>Security Alert</p>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <div class="warning">
              <strong>⚠️ Your Labbo account has been temporarily locked</strong>
            </div>
            <p>We detected multiple failed login attempts on your account. To protect your security, your account has been locked for <strong>${lockDuration}</strong>.</p>
            <p><strong>What happened?</strong></p>
            <ul>
              <li>Multiple failed login attempts were detected</li>
              <li>Your account was automatically locked as a security measure</li>
              <li>This prevents unauthorized access to your account</li>
            </ul>
            <p><strong>What you can do:</strong></p>
            <ul>
              <li>Wait for the lockout period to expire</li>
              <li>Try logging in again with the correct password</li>
              <li>If you've forgotten your password, use the "Forgot Password" feature</li>
              <li>Contact support if you believe this was an error</li>
            </ul>
            <p>If you didn't attempt to log in or believe this is an error, please contact our support team immediately.</p>
          </div>
          <div class="footer">
            <p>This is an automated security message from Labbo. Please do not reply to this email.</p>
          </div>
        </body>
        </html>
      `
    }
  }

  private getWelcomeTemplate(userName: string): EmailTemplate {
    return {
      subject: 'Welcome to Labbo! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Labbo!</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: #FF3E96;
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #fff;
              padding: 40px;
              border-radius: 0 0 10px 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .features {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .features h3 {
              color: #FF3E96;
              margin-top: 0;
            }
            .next-steps {
              background: #e9ecef;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 14px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Welcome to Labbo!</h1>
            <p>Your account is ready</p>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>Congratulations! Your Labbo account has been successfully created and verified. You're now ready to start managing your laboratory inventory efficiently.</p>

            <div class="features">
              <h3>✨ What you can do with Labbo:</h3>
              <ul>
                <li>Track equipment usage and availability</li>
                <li>Manage equipment reservations and checkouts</li>
                <li>Schedule maintenance and calibrations</li>
                <li>Generate detailed reports and analytics</li>
                <li>Collaborate with your lab team</li>
              </ul>
            </div>

            <div class="next-steps">
              <h3>🚀 Next Steps:</h3>
              <ol>
                <li>Log in to your account</li>
                <li>Complete your profile information</li>
                <li>Explore the dashboard features</li>
                <li>Start managing your lab equipment</li>
              </ol>
            </div>

            <p>If you have any questions or need help getting started, please don't hesitate to contact our support team.</p>
          </div>
          <div class="footer">
            <p>Welcome to the Labbo community! 🧪</p>
          </div>
        </body>
        </html>
      `
    }
  }

  setProvider(provider: EmailProvider): void {
    this.provider = provider
  }
}

// Create singleton instance with automatic provider selection
export function createEmailService(): EmailService {
  const provider = process.env.EMAIL_PROVIDER || 'mock'

  switch (provider.toLowerCase()) {
    case 'resend': {
      const apiKey = process.env.RESEND_API_KEY
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@labbo.com'
      const fromName = process.env.RESEND_FROM_NAME || 'Labbo'

      if (!apiKey) {
        console.warn('RESEND_API_KEY not found, falling back to mock provider')
        return new EmailService()
      }

      return new EmailService(new ResendEmailProvider(apiKey, fromEmail, fromName))
    }

    case 'sendgrid': {
      const apiKey = process.env.SENDGRID_API_KEY
      const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@labbo.com'
      const fromName = process.env.SENDGRID_FROM_NAME || 'Labbo'

      if (!apiKey) {
        console.warn('SENDGRID_API_KEY not found, falling back to mock provider')
        return new EmailService()
      }

      return new EmailService(new SendGridEmailProvider(apiKey, fromEmail, fromName))
    }

    case 'gmail': {
      const config = {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.GMAIL_USER || process.env.SMTP_USER || '',
          pass: process.env.GMAIL_PASS || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || ''
        },
        fromEmail: process.env.GMAIL_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || process.env.GMAIL_USER || 'noreply@labbo.com',
        fromName: process.env.GMAIL_FROM_NAME || process.env.SMTP_FROM_NAME || 'Labbo'
      }

      if (!config.auth.user || !config.auth.pass) {
        console.warn('⚠️ Gmail SMTP credentials not found. Please set GMAIL_USER and GMAIL_PASS or GMAIL_APP_PASSWORD in .env.local')
        console.log('📧 Falling back to mock email provider')
        return new EmailService()
      }

      console.log('📧 Using Gmail SMTP provider')
      return new EmailService(new NodemailerEmailProvider(config))
    }

    case 'mock':
    default:
      return new EmailService()
  }
}

// Create singleton instance
export const emailService = createEmailService()