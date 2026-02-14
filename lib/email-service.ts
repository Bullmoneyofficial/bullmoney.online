import nodemailer from 'nodemailer';
import { getEmailAttachments } from './email-attachments';

// ============================================================================
// EMAIL SERVICE - Nodemailer with Render SMTP (primary) + Gmail SMTP (fallback)
// Uses inline image attachments when enabled
// ============================================================================

// Email provider configuration
interface EmailProvider {
  name: string;
  enabled: boolean;
}

// Check which providers are configured
export function listConfiguredProviders(): EmailProvider[] {
  const providers: EmailProvider[] = [];

  // SendGrid (recommended on Render where outbound SMTP may be blocked)
  if (process.env.SENDGRID_API_KEY && !process.env.SENDGRID_API_KEY.includes('xxxxx')) {
    providers.push({ name: 'sendgrid', enabled: true });
  }
  
  // Gmail SMTP (primary)
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    providers.push({ name: 'gmail', enabled: true });
  }
  
  // Render SMTP (primary)
  if (process.env.RENDER_SMTP_HOST && process.env.RENDER_SMTP_USER && process.env.RENDER_SMTP_PASS) {
    providers.push({ name: 'render', enabled: true });
  }
  
  return providers;
}

async function sendWithSendgrid(params: {
  to: string[];
  subject: string;
  html: string;
  from: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: Buffer; cid?: string }>; // content must be a Buffer
}): Promise<SendEmailResult> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey || apiKey.includes('xxxxx')) {
    return { success: false, provider: 'sendgrid', error: 'SENDGRID_API_KEY not configured' };
  }

  const mod: any = await import('@sendgrid/mail');
  const sgMail = mod?.default || mod;
  if (!sgMail?.setApiKey || !sgMail?.send) {
    return { success: false, provider: 'sendgrid', error: 'SendGrid client not available' };
  }

  sgMail.setApiKey(apiKey);

  const attachments = (params.attachments || []).map((att) => ({
    filename: att.filename,
    content: att.content.toString('base64'),
    type: 'application/octet-stream',
    disposition: 'inline',
    content_id: att.cid,
  }));

  for (const recipient of params.to) {
    await sgMail.send({
      to: recipient,
      from: params.from,
      subject: params.subject,
      html: params.html,
      replyTo: params.replyTo,
      attachments: attachments.length ? attachments : undefined,
    });
    console.log(`[Email] Sent to ${recipient} via SendGrid`);
  }

  return { success: true, provider: 'sendgrid', messageId: 'batch-sent' };
}

// Create nodemailer transporter for Render SMTP
function createRenderTransporter() {
  const host = process.env.RENDER_SMTP_HOST || '';
  const port = parseInt(process.env.RENDER_SMTP_PORT || '587', 10);
  const secure = process.env.RENDER_SMTP_SECURE === 'true' || port === 465;
  const user = process.env.RENDER_SMTP_USER || '';
  const pass = process.env.RENDER_SMTP_PASS || '';

  console.log('[Email] Creating Render SMTP transporter');
  console.log('[Email] RENDER_SMTP_HOST:', host);
  console.log('[Email] RENDER_SMTP_PORT:', port);

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
}

// Create nodemailer transporter for Gmail
function createGmailTransporter() {
  // Clean the password - remove quotes and extra spaces
  const rawPass = process.env.SMTP_PASS || '';
  const password = rawPass
    .replace(/^["']|["']$/g, '')  // Remove surrounding quotes
    .replace(/\s+/g, '');          // Remove all spaces
  
  console.log('[Email] Creating Gmail transporter');
  console.log('[Email] SMTP_USER:', process.env.SMTP_USER);
  console.log('[Email] Raw password:', rawPass.substring(0, 4) + '...');
  console.log('[Email] Cleaned password length:', password.length);
  console.log('[Email] First 4 chars:', password.substring(0, 4));
  
  // Use Gmail service directly for better compatibility
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: password,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
}

// Email sending options
interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: boolean; // Include logo attachments
}

// Email with file attachment options
interface SendEmailWithAttachmentOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  pdfAttachment?: {
    filename: string;
    path: string;
    name?: string;
  };
}

// Send email result
interface SendEmailResult {
  success: boolean;
  provider: string;
  messageId?: string;
  error?: string;
}

/**
 * Send an email using configured providers
 * Tries Gmail SMTP first, falls back to other providers
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { to, subject, html, from, replyTo, attachments = true } = options;
  
  const recipients = Array.isArray(to) ? to : [to];
  const fromAddress = from || process.env.SMTP_FROM || 'Bullmoney <mrbullmoney@gmail.com>';
  
  // Get logo attachments for inline images
  const emailAttachments = attachments ? getEmailAttachments() : [];

  // Try SendGrid first when configured (works on Render even if SMTP is blocked)
  if (process.env.SENDGRID_API_KEY && !process.env.SENDGRID_API_KEY.includes('xxxxx')) {
    try {
      return await sendWithSendgrid({
        to: recipients,
        subject,
        html,
        from: fromAddress,
        replyTo: replyTo || process.env.SMTP_USER,
        attachments: emailAttachments.map((att) => ({
          filename: att.filename,
          content: att.content,
          cid: att.content_id,
        })),
      });
    } catch (error) {
      console.error('[Email] SendGrid error:', error);
    }
  }
  
  // Try Render SMTP first (primary)
  if (process.env.RENDER_SMTP_HOST && process.env.RENDER_SMTP_USER && process.env.RENDER_SMTP_PASS) {
    try {
      const transporter = createRenderTransporter();
      const renderFrom = process.env.RENDER_SMTP_FROM || fromAddress;
      
      // Send to each recipient
      for (const recipient of recipients) {
        const result = await transporter.sendMail({
          from: renderFrom,
          to: recipient,
          replyTo: replyTo || process.env.SMTP_USER,
          subject,
          html,
          attachments: emailAttachments.map(att => ({
            filename: att.filename,
            content: att.content,
            cid: att.content_id,
          })),
        });
        
        console.log(`[Email] Sent to ${recipient} via Render SMTP - MessageId: ${result.messageId}`);
      }
      
      return {
        success: true,
        provider: 'render',
        messageId: 'batch-sent',
      };
    } catch (error) {
      console.error('[Email] Render SMTP error:', error);
    }
  }

  // Try Gmail SMTP as fallback
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = createGmailTransporter();
      
      // Send to each recipient
      for (const recipient of recipients) {
        const result = await transporter.sendMail({
          from: fromAddress,
          to: recipient,
          replyTo: replyTo || process.env.SMTP_USER,
          subject,
          html,
          attachments: emailAttachments.map(att => ({
            filename: att.filename,
            content: att.content,
            cid: att.content_id,
          })),
        });
        
        console.log(`[Email] Sent to ${recipient} via Gmail - MessageId: ${result.messageId}`);
      }
      
      return {
        success: true,
        provider: 'gmail',
        messageId: 'batch-sent',
      };
    } catch (error) {
      console.error('[Email] Gmail SMTP error:', error);
      return {
        success: false,
        provider: 'gmail',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  return {
    success: false,
    provider: 'none',
    error: 'No email providers configured. Set Render SMTP or Gmail SMTP in .env.local',
  };
}

/**
 * Send an email with a PDF file attachment
 * Used for newsletter welcome emails with trading guides
 */
export async function sendEmailWithAttachment(options: SendEmailWithAttachmentOptions): Promise<SendEmailResult> {
  const { to, subject, html, from, replyTo, pdfAttachment } = options;
  
  const recipients = Array.isArray(to) ? to : [to];
  const fromAddress = from || process.env.SMTP_FROM || 'Bullmoney <mrbullmoney@gmail.com>';
  
  // Get logo attachments for inline images
  const logoAttachments = getEmailAttachments();
  
  // Build attachments array
  const allAttachments: any[] = logoAttachments.map(att => ({
    filename: att.filename,
    content: att.content,
    cid: att.content_id,
  }));
  
  // Add PDF attachment if provided
  if (pdfAttachment) {
    const fs = await import('fs');
    if (fs.existsSync(pdfAttachment.path)) {
      allAttachments.push({
        filename: pdfAttachment.filename,
        content: fs.readFileSync(pdfAttachment.path),
        contentType: 'application/pdf',
      });
      console.log(`[Email] Adding PDF attachment: ${pdfAttachment.filename}`);
    } else {
      console.warn(`[Email] PDF attachment not found: ${pdfAttachment.path}`);
    }
  }

  // Try SendGrid first when configured
  if (process.env.SENDGRID_API_KEY && !process.env.SENDGRID_API_KEY.includes('xxxxx')) {
    try {
      return await sendWithSendgrid({
        to: recipients,
        subject,
        html,
        from: fromAddress,
        replyTo: replyTo || process.env.SMTP_USER,
        attachments: allAttachments.map((att) => ({
          filename: att.filename,
          content: Buffer.isBuffer(att.content) ? att.content : Buffer.from(att.content),
          cid: att.cid,
        })),
      });
    } catch (error) {
      console.error('[Email] SendGrid error with attachment:', error);
    }
  }
  
  // Try Render SMTP first
  if (process.env.RENDER_SMTP_HOST && process.env.RENDER_SMTP_USER && process.env.RENDER_SMTP_PASS) {
    try {
      const transporter = createRenderTransporter();
      const renderFrom = process.env.RENDER_SMTP_FROM || fromAddress;
      
      // Send to each recipient
      for (const recipient of recipients) {
        const result = await transporter.sendMail({
          from: renderFrom,
          to: recipient,
          replyTo: replyTo || process.env.SMTP_USER,
          subject,
          html,
          attachments: allAttachments,
        });
        
        console.log(`[Email] Sent with attachment to ${recipient} via Render SMTP - MessageId: ${result.messageId}`);
      }
      
      return {
        success: true,
        provider: 'render',
        messageId: 'batch-sent',
      };
    } catch (error) {
      console.error('[Email] Render SMTP error with attachment:', error);
    }
  }

  // Try Gmail SMTP as fallback
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = createGmailTransporter();
      
      // Send to each recipient
      for (const recipient of recipients) {
        const result = await transporter.sendMail({
          from: fromAddress,
          to: recipient,
          replyTo: replyTo || process.env.SMTP_USER,
          subject,
          html,
          attachments: allAttachments,
        });
        
        console.log(`[Email] Sent with attachment to ${recipient} via Gmail - MessageId: ${result.messageId}`);
      }
      
      return {
        success: true,
        provider: 'gmail',
        messageId: 'batch-sent',
      };
    } catch (error) {
      console.error('[Email] Gmail SMTP error with attachment:', error);
      return {
        success: false,
        provider: 'gmail',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  return {
    success: false,
    provider: 'none',
    error: 'No email providers configured. Set Render SMTP or Gmail SMTP in .env.local',
  };
}

/**
 * Send a test email to verify configuration using email-templates.ts
 */
export async function sendTestEmail(to: string, templateName: string = 'grand_launch'): Promise<SendEmailResult> {
  // Import templates dynamically to avoid circular dependencies
  const templates = await import('@/lib/email-templates');
  
  const firstName = to.split('@')[0].charAt(0).toUpperCase() + to.split('@')[0].slice(1).replace(/[0-9_.-]/g, '');
  
  // Get template based on name
  let emailContent: { subject: string; html: string };
  
  switch (templateName) {
    case 'welcome':
      emailContent = templates.welcomeEmail(to);
      break;
    case 'grand_launch':
      emailContent = templates.grandLaunchEmail(firstName, to);
      break;
    case 'store_promo':
      emailContent = templates.storePromoEmail(firstName, to);
      break;
    case 'vip_promo':
      emailContent = templates.vipPromoEmail(firstName, to);
      break;
    case 'affiliate_promo':
      emailContent = templates.affiliatePromoEmail(firstName, to);
      break;
    default:
      emailContent = templates.grandLaunchEmail(firstName, to);
  }
  
  return sendEmail({
    to,
    subject: emailContent.subject,
    html: emailContent.html,
    attachments: true,
  });
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig(): Promise<{ configured: boolean; providers: EmailProvider[]; error?: string }> {
  const providers = listConfiguredProviders();
  
  if (providers.length === 0) {
    return {
      configured: false,
      providers: [],
      error: 'No email providers configured',
    };
  }

  // Avoid network calls here; SMTP is commonly blocked on PaaS and can hang.
  // Actual connectivity is validated by POST test sends.
  return { configured: true, providers };
}
