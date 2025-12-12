import nodemailer from 'nodemailer'
import { EmailOptions, EmailTemplate } from './email-service-real'

export class GmailEmailProvider {
  private transporter: nodemailer.Transporter
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

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates for testing
      }
    })
  }

  async send(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
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

export class ServerEmailService {
  private provider: GmailEmailProvider | null = null
  private mockMode: boolean = false

  constructor() {
    this.initializeProvider()
  }

  private initializeProvider() {
    const provider = process.env.EMAIL_PROVIDER

    if (provider === 'gmail') {
      const config = {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.GMAIL_USER || process.env.SMTP_USER || '',
          pass: process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || process.env.SMTP_PASS || ''
        },
        fromEmail: process.env.GMAIL_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || process.env.GMAIL_USER || 'noreply@labbo.com',
        fromName: process.env.GMAIL_FROM_NAME || process.env.SMTP_FROM_NAME || 'Labbo'
      }

      if (config.auth.user && config.auth.pass) {
        console.log('📧 Initializing Gmail SMTP provider')
        this.provider = new GmailEmailProvider(config)
      } else {
        console.warn('⚠️ Gmail SMTP credentials not found. Email service will use mock mode.')
        this.mockMode = true
      }
    } else {
      console.log('📧 Email service using mock mode (EMAIL_PROVIDER != gmail)')
      this.mockMode = true
    }
  }

  async sendPasswordResetEmail(email: string, resetLink: string, userName: string): Promise<{ success: boolean; error?: string }> {
    if (this.mockMode) {
      return this.mockSend('password-reset', { email, resetLink, userName })
    }

    const template = this.getPasswordResetTemplate(userName, resetLink)
    return this.provider!.send({
      to: email,
      subject: template.subject,
      html: template.html
    })
  }

  async sendEmailVerificationEmail(email: string, verificationLink: string, userName: string): Promise<{ success: boolean; error?: string }> {
    if (this.mockMode) {
      return this.mockSend('email-verification', { email, verificationLink, userName })
    }

    const template = this.getEmailVerificationTemplate(userName, verificationLink)
    return this.provider!.send({
      to: email,
      subject: template.subject,
      html: template.html
    })
  }

  async sendAccountLockedEmail(email: string, lockDuration: string, userName: string): Promise<{ success: boolean; error?: string }> {
    if (this.mockMode) {
      return this.mockSend('account-locked', { email, lockDuration, userName })
    }

    const template = this.getAccountLockedTemplate(userName, lockDuration)
    return this.provider!.send({
      to: email,
      subject: template.subject,
      html: template.html
    })
  }

  async sendWelcomeEmail(email: string, userName: string): Promise<{ success: boolean; error?: string }> {
    if (this.mockMode) {
      return this.mockSend('welcome', { email, userName })
    }

    const template = this.getWelcomeTemplate(userName)
    return this.provider!.send({
      to: email,
      subject: template.subject,
      html: template.html
    })
  }

  private async mockSend(type: string, data: any): Promise<{ success: boolean; error?: string }> {
    console.log(`📧 MOCK EMAIL (${type}):`, {
      ...data,
      timestamp: new Date().toISOString()
    })
    return { success: true }
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
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #FF3E96; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #fff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .button { display: inline-block; background: #FF3E96; color: white; text-decoration: none; padding: 15px 30px; border-radius: 5px; font-weight: 600; margin: 20px 0; }
            .button:hover { background: #E6318E; }
          </style>
        </head>
        <body>
          <div class="header"><h1>Labbo</h1><p>Reset your password</p></div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center;"><a href="${resetLink}" class="button">Reset Password</a></div>
            <p><strong>Important:</strong> This link will expire in 24 hours. If you didn't request this, please ignore this email.</p>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666; background: #f5f5f5; padding: 10px; border-radius: 5px;">${resetLink}</p>
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
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #FF3E96; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #fff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .button { display: inline-block; background: #FF3E96; color: white; text-decoration: none; padding: 15px 30px; border-radius: 5px; font-weight: 600; margin: 20px 0; }
            .button:hover { background: #E6318E; }
          </style>
        </head>
        <body>
          <div class="header"><h1>Labbo</h1><p>Verify your account</p></div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>Welcome to Labbo! To complete your registration, please verify your email address:</p>
            <div style="text-align: center;"><a href="${verificationLink}" class="button">Verify Email</a></div>
            <p><strong>Important:</strong> This link will expire in 1 hour. Your account will not be activated until you verify your email.</p>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666; background: #f5f5f5; padding: 10px; border-radius: 5px;">${verificationLink}</p>
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
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc3545; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #fff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header"><h1>🔒 Account Locked</h1><p>Security Alert</p></div>
          <div class="content">
            <p>Hi ${userName},</p>
            <div class="warning"><strong>⚠️ Your Labbo account has been temporarily locked</strong></div>
            <p>We detected multiple failed login attempts. Your account has been locked for <strong>${lockDuration}</strong>.</p>
            <p><strong>What you can do:</strong></p>
            <ul>
              <li>Wait for the lockout period to expire</li>
              <li>Try logging in again with the correct password</li>
              <li>If you've forgotten your password, use the "Forgot Password" feature</li>
            </ul>
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
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #FF3E96; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #fff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .features { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .features h3 { color: #FF3E96; margin-top: 0; }
          </style>
        </head>
        <body>
          <div class="header"><h1>🎉 Welcome to Labbo!</h1><p>Your account is ready</p></div>
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
              </ul>
            </div>
          </div>
        </body>
        </html>
      `
    }
  }
}

// Create singleton instance
export const serverEmailService = new ServerEmailService()