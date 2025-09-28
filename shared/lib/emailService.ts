// 🚀 PRODUCTION EMAIL SERVICE INTEGRATION
// Support for Gmail SMTP, SendGrid, Mailgun, and other email providers

import { logger } from './logger';

export interface EmailProvider {
  name: string;
  sendEmail(params: EmailParams): Promise<boolean>;
  sendTemplatedEmail(params: TemplatedEmailParams): Promise<boolean>;
}

export interface EmailParams {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

export interface TemplatedEmailParams {
  to: string;
  from?: string;
  templateId: string;
  variables: Record<string, any>;
}

export interface EmailAttachment {
  filename: string;
  content: string; // base64 encoded
  type?: string;
}

/**
 * SendGrid Email Provider
 */
class SendGridProvider implements EmailProvider {
  name = 'SendGrid';
  private apiKey: string;
  private fromEmail: string;

  constructor(apiKey: string, fromEmail: string = 'hel@dislink.com') {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
  }

  async sendEmail(params: EmailParams): Promise<boolean> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: params.to }],
            subject: params.subject
          }],
          from: { email: params.from || this.fromEmail },
          content: [
            { type: 'text/html', value: params.html },
            ...(params.text ? [{ type: 'text/plain', value: params.text }] : [])
          ],
          ...(params.attachments && {
            attachments: params.attachments.map(att => ({
              filename: att.filename,
              content: att.content,
              type: att.type || 'application/octet-stream',
              disposition: 'attachment'
            }))
          })
        })
      });

      if (response.ok) {
        logger.info('Email sent successfully via SendGrid', { to: params.to });
        return true;
      } else {
        const error = await response.text();
        logger.error('SendGrid email failed:', { status: response.status, error });
        return false;
      }
    } catch (error) {
      logger.error('SendGrid email error:', error);
      return false;
    }
  }

  async sendTemplatedEmail(params: TemplatedEmailParams): Promise<boolean> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: params.to }],
            dynamic_template_data: params.variables
          }],
          from: { email: params.from || this.fromEmail },
          template_id: params.templateId
        })
      });

      if (response.ok) {
        logger.info('Templated email sent via SendGrid', { to: params.to, templateId: params.templateId });
        return true;
      } else {
        const error = await response.text();
        logger.error('SendGrid templated email failed:', { status: response.status, error });
        return false;
      }
    } catch (error) {
      logger.error('SendGrid templated email error:', error);
      return false;
    }
  }
}

/**
 * Mailgun Email Provider
 */
class MailgunProvider implements EmailProvider {
  name = 'Mailgun';
  private apiKey: string;
  private domain: string;
  private fromEmail: string;

  constructor(apiKey: string, domain: string, fromEmail: string = 'hello@dislink.com') {
    this.apiKey = apiKey;
    this.domain = domain;
    this.fromEmail = fromEmail;
  }

  async sendEmail(params: EmailParams): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('from', params.from || this.fromEmail);
      formData.append('to', params.to);
      formData.append('subject', params.subject);
      formData.append('html', params.html);
      if (params.text) formData.append('text', params.text);

      if (params.attachments) {
        params.attachments.forEach((att) => {
          // Convert base64 to Uint8Array for browser compatibility
          const binaryString = atob(att.content);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: att.type });
          formData.append('attachment', blob, att.filename);
        });
      }

      const response = await fetch(`https://api.mailgun.net/v3/${this.domain}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`api:${this.apiKey}`)}`
        },
        body: formData
      });

      if (response.ok) {
        logger.info('Email sent successfully via Mailgun', { to: params.to });
        return true;
      } else {
        const error = await response.text();
        logger.error('Mailgun email failed:', { status: response.status, error });
        return false;
      }
    } catch (error) {
      logger.error('Mailgun email error:', error);
      return false;
    }
  }

  async sendTemplatedEmail(_params: TemplatedEmailParams): Promise<boolean> {
    // Mailgun doesn't have built-in templates like SendGrid
    // You would implement template rendering here
    logger.warn('Templated emails not implemented for Mailgun provider');
    return false;
  }
}

/**
 * Email Service Manager
 */
export class EmailService {
  private provider: EmailProvider;
  private defaultFromEmail: string;

  constructor(provider: EmailProvider, defaultFromEmail: string = 'hello@dislink.com') {
    this.provider = provider;
    this.defaultFromEmail = defaultFromEmail;
  }

  /**
   * Send QR scan invitation email
   */
  async sendQRInvitationEmail(
    recipientEmail: string,
    senderName: string,
    registrationUrl: string,
    location?: string
  ): Promise<boolean> {
    const subject = `${senderName} wants to connect with you on Dislink`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: #4F46E5; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 20px 30px; text-align: center; color: #64748b; font-size: 14px; }
          .location { background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤝 You're invited to connect!</h1>
            <p>Someone wants to add you to their professional network</p>
          </div>
          <div class="content">
            <p><strong>${senderName}</strong> scanned your QR code and would like to connect with you on Dislink.</p>
            
            ${location ? `
              <div class="location">
                <strong>📍 Meeting Location:</strong> ${location}
              </div>
            ` : ''}
            
            <p>Dislink helps professionals build and maintain meaningful connections. Join now to:</p>
            <ul>
              <li>📝 Remember important details about your connections</li>
              <li>📅 Set follow-up reminders</li>
              <li>🎯 Organize contacts by relationship strength</li>
              <li>🔄 Never lose track of valuable relationships</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${registrationUrl}" class="button">Join Dislink & Connect</a>
            </div>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
              This invitation will expire in 7 days. If you don't want to receive these emails, you can ignore this message.
            </p>
          </div>
          <div class="footer">
            <p>Dislink - Building Meaningful Professional Connections</p>
            <p>Made with ❤️ for professionals worldwide</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ${senderName} wants to connect with you on Dislink!
      
      ${senderName} scanned your QR code and would like to connect with you on Dislink.
      
      ${location ? `Meeting Location: ${location}` : ''}
      
      Join Dislink to connect: ${registrationUrl}
      
      Dislink helps professionals build and maintain meaningful connections.
    `;

    return await this.provider.sendEmail({
      to: recipientEmail,
      subject,
      html,
      text
    });
  }

  /**
   * Send connection request notification
   */
  async sendConnectionRequestEmail(
    recipientEmail: string,
    senderName: string,
    senderCompany: string,
    connectionUrl: string
  ): Promise<boolean> {
    const subject = `New connection request from ${senderName}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: #4F46E5; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 20px 30px; text-align: center; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 New Connection Request</h1>
          </div>
          <div class="content">
            <p><strong>${senderName}</strong> from <strong>${senderCompany}</strong> wants to connect with you on Dislink.</p>
            
            <div style="text-align: center;">
              <a href="${connectionUrl}" class="button">View Request</a>
            </div>
          </div>
          <div class="footer">
            <p>Dislink - Building Meaningful Professional Connections</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.provider.sendEmail({
      to: recipientEmail,
      subject,
      html
    });
  }

  /**
   * Send follow-up reminder email
   */
  async sendFollowUpReminder(
    recipientEmail: string,
    contactName: string,
    reminderText: string,
    profileUrl: string
  ): Promise<boolean> {
    const subject = `Follow-up reminder: ${contactName}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: #4F46E5; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .reminder { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Follow-up Reminder</h1>
          </div>
          <div class="content">
            <p>You have a follow-up reminder for <strong>${contactName}</strong>:</p>
            
            <div class="reminder">
              <strong>Reminder:</strong> ${reminderText}
            </div>
            
            <div style="text-align: center;">
              <a href="${profileUrl}" class="button">View Contact</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.provider.sendEmail({
      to: recipientEmail,
      subject,
      html
    });
  }

  /**
   * Generic method to send any email
   */
  async sendEmail(params: EmailParams): Promise<boolean> {
    return await this.provider.sendEmail({
      ...params,
      from: params.from || this.defaultFromEmail
    });
  }
}

/**
 * Factory function to create email service based on environment variables
 */
export function createEmailService(): EmailService | null {
  try {
    // 🔍 ENHANCED EMAIL SERVICE DEBUG LOGGING
    console.log('🔍 EMAIL SERVICE: Checking configuration...');

    // Check for SendGrid configuration (multiple possible env var names)
    const sendGridApiKey = import.meta.env.VITE_SENDGRID_API_KEY || import.meta.env.VITE_EMAIL_SERVICE_API_KEY;
    const sendGridFrom = import.meta.env.VITE_SENDGRID_FROM || 'support@dislink.app';

    console.log('🔍 EMAIL SERVICE: Environment variables:', {
      hasSendGridKey: !!sendGridApiKey,
      hasSendGridFrom: !!sendGridFrom,
      sendGridFrom: sendGridFrom,
      hasMailgunKey: !!import.meta.env.VITE_MAILGUN_API_KEY,
      hasMailgunDomain: !!import.meta.env.VITE_MAILGUN_DOMAIN,
      gmailSmtpConfigured: 'Gmail SMTP configured via Supabase dashboard'
    });

    if (sendGridApiKey) {
      console.log('🔍 EMAIL SERVICE: Creating SendGrid provider');
      const provider = new SendGridProvider(sendGridApiKey, sendGridFrom);
      const service = new EmailService(provider, sendGridFrom);
      console.log('✅ EMAIL SERVICE: SendGrid service created successfully');
      return service;
    }

    // Check for Mailgun configuration
    const mailgunApiKey = import.meta.env.VITE_MAILGUN_API_KEY;
    const mailgunDomain = import.meta.env.VITE_MAILGUN_DOMAIN;
    if (mailgunApiKey && mailgunDomain) {
      console.log('🔍 EMAIL SERVICE: Creating Mailgun provider');
      const provider = new MailgunProvider(mailgunApiKey, mailgunDomain);
      const service = new EmailService(provider);
      console.log('✅ EMAIL SERVICE: Mailgun service created successfully');
      return service;
    }

    console.warn('⚠️ EMAIL SERVICE: No external email service configuration found');
    logger.warn('No external email service configuration found. Gmail SMTP is configured via Supabase dashboard. Set VITE_SENDGRID_API_KEY, VITE_EMAIL_SERVICE_API_KEY, or VITE_MAILGUN_API_KEY for additional providers');
    return null;
  } catch (error) {
    console.error('❌ EMAIL SERVICE: Error creating email service:', error);
    logger.error('Error creating email service:', error);
    return null;
  }
}

// Default email service instance
export const emailService = createEmailService();

// Email templates
export const EMAIL_TEMPLATES = {
  QR_INVITATION: 'QR_INVITATION',
  CONNECTION_REQUEST: 'CONNECTION_REQUEST',
  FOLLOW_UP_REMINDER: 'FOLLOW_UP_REMINDER',
  WELCOME: 'WELCOME',
  PASSWORD_RESET: 'PASSWORD_RESET'
};

// Export provider classes for custom implementations
export { SendGridProvider, MailgunProvider };
