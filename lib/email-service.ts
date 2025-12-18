import { Resend } from 'resend'
import nodemailer from 'nodemailer'

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
  private transporter: nodemailer.Transporter | null = null
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

      console.log('✅ Email sent successfully via Nodemailer:', {
        to: options.to,
        subject: options.subject,
        messageId: info.messageId
      })

      return { success: true }
    } catch (error) {
      console.error('❌ Nodemailer email provider error:', error)
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

export class MockEmailProvider implements EmailProvider {
  async send(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    console.log('📧 MOCK EMAIL SENT:', {
      to: options.to,
      subject: options.subject,
      html: options.html,
      timestamp: new Date().toISOString()
    })

    return { success: true }
  }
}

export class EmailService {
  private provider: EmailProvider
  private appUrl: string

  constructor(provider?: EmailProvider) {
    this.provider = provider || new MockEmailProvider()
    this.appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  }

  setProvider(provider: EmailProvider): void {
    this.provider = provider
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

  private getCommonStyles(): string {
    return `
      body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f9fafb; }
      .container { background-color: #ffffff; margin: 20px auto; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
      .header { background: #ff007a; padding: 32px 20px; text-align: center; }
      .logo { height: 40px; width: auto; margin-bottom: 0; }
      .content { padding: 40px 32px; }
      .button { display: inline-block; background-color: #ff007a; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 9999px; font-weight: 600; font-size: 16px; margin: 24px 0; box-shadow: 0 4px 14px 0 rgba(255, 0, 122, 0.39); transition: transform 0.2s; }
      .button:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(255, 0, 122, 0.23); }
      .footer { background-color: #f9fafb; padding: 24px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
      .note { background-color: #fff1f2; border-left: 4px solid #ff007a; color: #be123c; padding: 16px; border-radius: 4px; font-size: 14px; margin: 24px 0; }
      .link-fallback { word-break: break-all; color: #6b7280; background: #f3f4f6; padding: 12px; border-radius: 8px; font-size: 13px; margin-top: 8px; font-family: monospace; }
      h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; margin-top: 16px; }
      p { margin-bottom: 16px; font-size: 16px; color: #374151; }
      ul { padding-left: 20px; margin-bottom: 24px; }
      li { margin-bottom: 8px; color: #374151; }
    `
  }

  private getLogoHtml(): string {
    return `<img src="${this.appUrl}/logo.svg" alt="Labbo" class="logo" style="height: 40px; width: auto;">`
  }

  private getPasswordResetTemplate(userName: string, resetLink: string): EmailTemplate {
    return {
      subject: 'Atur ulang kata sandi Labbo Anda',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Atur ulang kata sandi</title>
          <style>${this.getCommonStyles()}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${this.getLogoHtml()}
              <h1 style="margin-top: 16px;">Atur Ulang Kata Sandi</h1>
            </div>
            <div class="content">
              <p>Halo ${userName},</p>
              <p>Kami menerima permintaan untuk mengatur ulang kata sandi akun Labbo Anda. Klik tombol di bawah ini untuk membuat kata sandi baru:</p>
              
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Atur Ulang Kata Sandi</a>
              </div>
              
              <div class="note">
                <strong>Penting:</strong> Tautan ini hanya berlaku selama 24 jam. Jika Anda tidak meminta ini, silakan abaikan email ini.
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">Jika tombol di atas tidak berfungsi, salin dan tempel tautan berikut ke browser Anda:</p>
              <div class="link-fallback">${resetLink}</div>
            </div>
            <div class="footer">
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} Lab Inventory System. Hak Cipta Dilindungi.</p>
              <p style="margin: 8px 0 0;">Email ini dikirim secara otomatis, mohon tidak membalas.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }
  }

  private getEmailVerificationTemplate(userName: string, verificationLink: string): EmailTemplate {
    return {
      subject: 'Verifikasi akun Labbo Anda',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verifikasi Akun</title>
          <style>${this.getCommonStyles()}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${this.getLogoHtml()}
              <h1 style="margin-top: 16px;">Verifikasi Akun</h1>
            </div>
            <div class="content">
              <p>Halo ${userName},</p>
              <p>Selamat datang di Labbo! Untuk menyelesaikan pendaftaran dan mengaktifkan akun Anda, silakan verifikasi alamat email Anda:</p>
              
              <div style="text-align: center;">
                <a href="${verificationLink}" class="button">Verifikasi Email</a>
              </div>
              
              <div class="note">
                <strong>Penting:</strong> Tautan ini akan kedaluwarsa dalam 1 jam. Akun Anda tidak akan aktif sampai Anda memverifikasi email Anda.
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">Jika tombol di atas tidak berfungsi, salin dan tempel tautan berikut ke browser Anda:</p>
              <div class="link-fallback">${verificationLink}</div>
            </div>
            <div class="footer">
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} Lab Inventory System. Hak Cipta Dilindungi.</p>
              <p style="margin: 8px 0 0;">Email ini dikirim secara otomatis, mohon tidak membalas.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }
  }

  private getAccountLockedTemplate(userName: string, lockDuration: string): EmailTemplate {
    return {
      subject: 'Akun Labbo Anda telah dikunci',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Akun Terkunci</title>
          <style>
            ${this.getCommonStyles()}
            .header { background: #dc2626; }
            .button { background-color: #dc2626; box-shadow: 0 4px 14px 0 rgba(220, 38, 38, 0.39); }
            .button:hover { box-shadow: 0 6px 20px rgba(220, 38, 38, 0.23); }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${this.getLogoHtml()}
              <h1 style="margin-top: 16px;">Akun Terkunci</h1>
            </div>
            <div class="content">
              <p>Halo ${userName},</p>
              
              <div style="background-color: #fef2f2; border: 1px solid #fca5a5; color: #991b1b; padding: 16px; border-radius: 8px; margin: 24px 0; text-align: center;">
                <strong>⚠️ Peringatan Keamanan</strong>
              </div>
              
              <p>Kami mendeteksi beberapa percobaan masuk yang gagal. Demi keamanan, akun Anda telah dikunci sementara selama <strong>${lockDuration}</strong>.</p>
              
              <p><strong>Apa yang dapat Anda lakukan?</strong></p>
              <ul>
                <li>Tunggu hingga periode penguncian berakhir</li>
                <li>Coba masuk kembali dengan kata sandi yang benar</li>
                <li>Jika lupa kata sandi, gunakan fitur "Lupa Kata Sandi"</li>
              </ul>
            </div>
            <div class="footer">
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} Lab Inventory System. Hak Cipta Dilindungi.</p>
              <p style="margin: 8px 0 0;">Jika Anda merasa ini adalah kesalahan, silakan hubungi administrator.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }
  }

  private getWelcomeTemplate(userName: string): EmailTemplate {
    return {
      subject: 'Selamat datang di Labbo! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Selamat Datang</title>
          <style>
            ${this.getCommonStyles()}
            .feature-list h3 { color: #ff007a; margin-top: 0; margin-bottom: 16px; }
            .feature-item { display: flex; align-items: flex-start; margin-bottom: 12px; }
            .feature-icon { color: #ff007a; margin-right: 12px; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${this.getLogoHtml()}
              <h1 style="margin-top: 16px;">Selamat Datang!</h1>
            </div>
            <div class="content">
              <p>Halo ${userName},</p>
              <p>Selamat! Akun Labbo Anda telah berhasil dibuat dan diverifikasi. Anda sekarang siap untuk mulai mengelola inventaris laboratorium Anda dengan lebih efisien.</p>
              
              <div style="background-color: #fdf2f8; padding: 24px; border-radius: 12px; margin: 24px 0;" class="feature-list">
                <h3>✨ Apa yang bisa Anda lakukan di Labbo:</h3>
                <div class="feature-item">
                  <span class="feature-icon">✓</span>
                  <div>Melacak penggunaan dan ketersediaan peralatan</div>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">✓</span>
                  <div>Mengelola peminjaman dan reservasi alat</div>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">✓</span>
                  <div>Menjadwalkan pemeliharaan dan kalibrasi</div>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">✓</span>
                  <div>Membuat laporan dan analitik mendetail</div>
                </div>
              </div>
              
              <div style="text-align: center;">
                <a href="${this.appUrl}/dashboard" class="button">Masuk ke Dashboard</a>
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} Lab Inventory System. Hak Cipta Dilindungi.</p>
              <p style="margin: 8px 0 0;">Terima kasih telah bergabung dengan kami!</p>
            </div>
          </div>
        </body>
        </html>
      `
    }
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
          pass: process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || process.env.SMTP_PASS || ''
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

// Export singleton instance
export const emailService = createEmailService()

// Alias to maintain compatibility with existing imports
export const serverEmailService = emailService