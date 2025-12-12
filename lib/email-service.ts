// Re-export from the real email service implementation
export {
  EmailService,
  ResendEmailProvider,
  NodemailerEmailProvider,
  SendGridEmailProvider,
  MockEmailProvider,
  createEmailService,
  emailService
} from './email-service-real'

export type {
  EmailOptions,
  EmailTemplate,
  EmailProvider
} from './email-service-real'