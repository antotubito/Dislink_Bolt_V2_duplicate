import { logger } from './logger';
import { supabase } from './supabase';

// Email service configuration
const EMAIL_CONFIG = {
  // Use Supabase Edge Functions for production emails
  // For now, we'll use console logging and database storage
  provider: 'supabase',
  fallbackProvider: 'console'
};

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface ConnectionRequestEmail {
  requesterName: string;
  requesterEmail: string;
  targetName: string;
  targetEmail: string;
  connectionCode: string;
  location?: {
    name: string;
    latitude: number;
    longitude: number;
  };
}

export interface WaitlistConfirmationEmail {
  email: string;
  name?: string;
  source: string;
}

// Send connection request email
export async function sendConnectionRequestEmail(data: ConnectionRequestEmail): Promise<boolean> {
  try {
    logger.info('Sending connection request email', { 
      requester: data.requesterName,
      target: data.targetName 
    });

    const emailTemplate: EmailTemplate = {
      to: data.targetEmail,
      subject: `${data.requesterName} wants to connect with you on Dislink`,
      html: generateConnectionRequestHTML(data),
      text: generateConnectionRequestText(data)
    };

    // Store email in database for tracking
    await logEmailEvent({
      type: 'connection_request',
      recipient: data.targetEmail,
      subject: emailTemplate.subject,
      data: data
    });

    // In production, send via Supabase Edge Function or email provider
    return await sendEmail(emailTemplate);
    
  } catch (error) {
    logger.error('Error sending connection request email:', error);
    return false;
  }
}

// Send waitlist confirmation email
export async function sendWaitlistConfirmationEmail(data: WaitlistConfirmationEmail): Promise<boolean> {
  try {
    logger.info('Sending waitlist confirmation email', { email: data.email });

    const emailTemplate: EmailTemplate = {
      to: data.email,
      subject: 'Welcome to the Dislink Waitlist! 🎉',
      html: generateWaitlistConfirmationHTML(data),
      text: generateWaitlistConfirmationText(data)
    };

    // Store email in database
    await logEmailEvent({
      type: 'waitlist_confirmation',
      recipient: data.email,
      subject: emailTemplate.subject,
      data: data
    });

    return await sendEmail(emailTemplate);
    
  } catch (error) {
    logger.error('Error sending waitlist confirmation email:', error);
    return false;
  }
}

// Send connection acceptance notification
export async function sendConnectionAcceptedEmail(accepterName: string, accepterEmail: string, requesterEmail: string): Promise<boolean> {
  try {
    const emailTemplate: EmailTemplate = {
      to: requesterEmail,
      subject: `${accepterName} accepted your connection request!`,
      html: generateConnectionAcceptedHTML(accepterName, accepterEmail),
      text: `Great news! ${accepterName} has accepted your connection request on Dislink. You can now view their profile and start building your professional relationship.`
    };

    await logEmailEvent({
      type: 'connection_accepted',
      recipient: requesterEmail,
      subject: emailTemplate.subject,
      data: { accepterName, accepterEmail }
    });

    return await sendEmail(emailTemplate);
    
  } catch (error) {
    logger.error('Error sending connection accepted email:', error);
    return false;
  }
}

// Core email sending function
async function sendEmail(template: EmailTemplate): Promise<boolean> {
  try {
    if (EMAIL_CONFIG.provider === 'supabase') {
      // In production, call Supabase Edge Function
      // For now, log to console and return success
      console.log('📧 EMAIL SENT:', {
        to: template.to,
        subject: template.subject,
        preview: template.text?.substring(0, 100) + '...'
      });
      
      return true;
    }
    
    // Fallback to console logging
    console.log('📧 EMAIL (CONSOLE):', template);
    return true;
    
  } catch (error) {
    logger.error('Error in sendEmail:', error);
    return false;
  }
}

// Log email events for analytics and debugging
async function logEmailEvent(event: {
  type: string;
  recipient: string;
  subject: string;
  data: any;
}): Promise<void> {
  try {
    const { error } = await supabase
      .from('email_logs')
      .insert({
        type: event.type,
        recipient: event.recipient,
        subject: event.subject,
        data: event.data,
        status: 'sent',
        created_at: new Date().toISOString()
      });

    if (error) {
      logger.error('Error logging email event:', error);
    }
  } catch (error) {
    // Don't fail email sending if logging fails
    logger.warn('Failed to log email event:', error);
  }
}

// HTML template generators
function generateConnectionRequestHTML(data: ConnectionRequestEmail): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Connection Request - Dislink</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .location { background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🤝 New Connection Request</h1>
          <p>Someone wants to connect with you on Dislink</p>
        </div>
        <div class="content">
          <h2>Hi ${data.targetName}!</h2>
          <p><strong>${data.requesterName}</strong> scanned your QR code and would like to connect with you.</p>
          
          ${data.location ? `
          <div class="location">
            <h3>📍 Meeting Location</h3>
            <p>${data.location.name}</p>
            <small>Lat: ${data.location.latitude}, Lng: ${data.location.longitude}</small>
          </div>
          ` : ''}
          
          <p>To accept this connection request and start building your professional relationship:</p>
          
          <a href="https://dislinkboltv2duplicate.netlify.app/app/connections?request=${data.connectionCode}" class="button">
            Accept Connection
          </a>
          
          <p>Or copy this link: <br>
          <code>https://dislinkboltv2duplicate.netlify.app/app/connections?request=${data.connectionCode}</code></p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p><small>This connection request will expire in 7 days. If you don't recognize ${data.requesterName}, you can safely ignore this email.</small></p>
        </div>
        <div class="footer">
          <p>Sent by Dislink - Your Professional Networking Assistant</p>
          <p><a href="https://dislinkboltv2duplicate.netlify.app">Visit Dislink</a> | <a href="mailto:support@dislink.com">Support</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateConnectionRequestText(data: ConnectionRequestEmail): string {
  return `
New Connection Request - Dislink

Hi ${data.targetName}!

${data.requesterName} scanned your QR code and would like to connect with you.

${data.location ? `
Meeting Location: ${data.location.name}
Coordinates: ${data.location.latitude}, ${data.location.longitude}
` : ''}

To accept this connection request, visit:
https://dislinkboltv2duplicate.netlify.app/app/connections?request=${data.connectionCode}

This request will expire in 7 days.

---
Dislink - Your Professional Networking Assistant
https://dislinkboltv2duplicate.netlify.app
  `;
}

function generateWaitlistConfirmationHTML(data: WaitlistConfirmationEmail): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Dislink Waitlist!</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .feature { padding: 15px; margin: 10px 0; border-left: 4px solid #667eea; background: #f8f9fa; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to Dislink!</h1>
          <p>You're now on the waitlist for the future of professional networking</p>
        </div>
        <div class="content">
          <h2>Hi there!</h2>
          <p>Thank you for joining the Dislink waitlist. We're excited to have you as part of our early community!</p>
          
          <h3>What's Coming:</h3>
          <div class="feature">
            <strong>🔗 QR Code Networking</strong><br>
            Connect instantly by scanning QR codes at events and meetings
          </div>
          <div class="feature">
            <strong>📍 Context-Rich Connections</strong><br>
            Remember where, when, and how you met each person
          </div>
          <div class="feature">
            <strong>⚡ Smart Follow-ups</strong><br>
            Never miss an opportunity to nurture relationships
          </div>
          <div class="feature">
            <strong>🔒 Privacy First</strong><br>
            Your data stays private and secure
          </div>
          
          <p>We'll notify you as soon as Dislink is ready for early access. In the meantime, follow us for updates!</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p><small>Joined from: ${data.source}</small></p>
        </div>
        <div class="footer">
          <p>Dislink - A Smarter Way to Keep Connections</p>
          <p><a href="https://dislinkboltv2duplicate.netlify.app">Visit Website</a> | <a href="mailto:hello@dislink.com">Contact Us</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateWaitlistConfirmationText(data: WaitlistConfirmationEmail): string {
  return `
Welcome to Dislink! 🎉

Thank you for joining our waitlist. We're building the future of professional networking with features like:

• QR Code Networking - Connect instantly at events
• Context-Rich Connections - Remember meeting details  
• Smart Follow-ups - Never miss relationship opportunities
• Privacy First - Your data stays secure

We'll notify you when early access is ready!

Joined from: ${data.source}

---
Dislink - A Smarter Way to Keep Connections
https://dislinkboltv2duplicate.netlify.app
  `;
}

function generateConnectionAcceptedHTML(accepterName: string, accepterEmail: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Connection Accepted - Dislink</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Connection Accepted!</h1>
          <p>Your networking just got stronger</p>
        </div>
        <div class="content">
          <h2>Great news!</h2>
          <p><strong>${accepterName}</strong> has accepted your connection request.</p>
          
          <p>You can now:</p>
          <ul>
            <li>View their full profile</li>
            <li>Add notes about your meeting</li>
            <li>Set follow-up reminders</li>
            <li>Share your social links</li>
          </ul>
          
          <a href="https://dislinkboltv2duplicate.netlify.app/app/contacts" class="button">
            View Your Connections
          </a>
          
          <p>Start building your professional relationship today!</p>
        </div>
        <div class="footer">
          <p>Dislink - Your Professional Networking Assistant</p>
          <p><a href="https://dislinkboltv2duplicate.netlify.app">Visit Dislink</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
} 