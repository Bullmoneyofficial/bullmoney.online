import fs from 'fs';
import path from 'path';

// ============================================================================
// EMAIL ATTACHMENTS - Logo images for email sends
// Uses CID (Content-ID) for inline images in HTML emails
// ============================================================================

export const EMAIL_LOGO_CID = 'bullmoney-logo';
export const EMAIL_FOOTER_LOGO_CID = 'bullmoney-footer';

/**
 * Get email attachments for email sends
 * Returns attachments with CID for inline display in emails
 */
export function getEmailAttachments() {
  const publicDir = path.join(process.cwd(), 'public');
  
  const attachments: {
    filename: string;
    content: Buffer;
    content_id: string;
  }[] = [];

  // Header logo (favicon.svg)
  try {
    const faviconPath = path.join(publicDir, 'favicon.svg');
    if (fs.existsSync(faviconPath)) {
      attachments.push({
        filename: 'logo.svg',
        content: fs.readFileSync(faviconPath),
        content_id: EMAIL_LOGO_CID,
      });
    }
  } catch (e) {
    console.warn('[Email] Could not load favicon.svg:', e);
  }

  // Footer logo (bullmoney-logo.png)
  try {
    const footerLogoPath = path.join(publicDir, 'bullmoney-logo.png');
    if (fs.existsSync(footerLogoPath)) {
      attachments.push({
        filename: 'bullmoney-logo.png',
        content: fs.readFileSync(footerLogoPath),
        content_id: EMAIL_FOOTER_LOGO_CID,
      });
    }
  } catch (e) {
    console.warn('[Email] Could not load bullmoney-logo.png:', e);
  }

  return attachments;
}

/**
 * Get attachments as base64 for environments where fs is not available
 */
export async function getEmailAttachmentsFromUrl(baseUrl: string) {
  const attachments: {
    filename: string;
    path: string;
    content_id: string;
  }[] = [];

  // Use URL-based attachments as fallback
  attachments.push({
    filename: 'logo.svg',
    path: `${baseUrl}/favicon.svg`,
    content_id: EMAIL_LOGO_CID,
  });

  attachments.push({
    filename: 'bullmoney-logo.png',
    path: `${baseUrl}/images/logos/bullmoney-logo.png`,
    content_id: EMAIL_FOOTER_LOGO_CID,
  });

  return attachments;
}
