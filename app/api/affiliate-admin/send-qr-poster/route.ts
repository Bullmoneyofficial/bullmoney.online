import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_AFFILIATE_ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

function parseDataUrl(dataUrl: string) {
  const match = /^data:(.+);base64,(.+)$/.exec(dataUrl || '');
  if (!match) return null;
  return {
    mime: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  };
}

function escapeHtml(value: string) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createEmailTemplate({
  affiliateName,
  affiliateCode,
  referralLink,
}: {
  affiliateName: string;
  affiliateCode: string;
  referralLink: string;
}) {
  const safeName = escapeHtml(affiliateName);
  const safeCode = escapeHtml(affiliateCode);
  const safeReferral = escapeHtml(referralLink);

  return `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f6f6f6;font-family:Inter,Arial,sans-serif;color:#111;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:20px 10px;">
      <tr>
        <td align="center">
          <table role="presentation" width="620" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:20px;border-bottom:1px solid #eee; text-align:center;">
                <div style="font-weight:800;font-size:24px;letter-spacing:-0.02em;">BullMoney Affiliate Poster</div>
                <div style="margin-top:6px;font-size:13px;color:#555;">Your personalized QR poster is attached</div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px;">
                <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px;">
                  <div style="font-size:14px;"><strong>Name:</strong> ${safeName}</div>
                  <div style="font-size:14px;margin-top:8px;"><strong>Code:</strong> ${safeCode}</div>
                  <div style="font-size:14px;margin-top:8px;"><strong>Referral Link:</strong> <a href="${safeReferral}" style="color:#111;word-break:break-all;">${safeReferral}</a></div>
                </div>

                <h3 style="margin:18px 0 8px 0;font-size:16px;">Your Affiliate Poster</h3>
                <p style="margin:0 0 10px 0;font-size:14px;line-height:1.6;color:#444;">
                  Your personalized QR poster has been created and attached to this email as a PNG image. 
                  You can use this poster to promote your affiliate link on social media, print it out, 
                  or share it digitally with potential referrals.
                </p>
                
                <h3 style="margin:14px 0 8px 0;font-size:16px;">How to use your poster</h3>
                <ul style="margin:0 0 10px 18px;padding:0;font-size:14px;line-height:1.6;color:#444;">
                  <li>Share on Instagram stories and posts</li>
                  <li>Post in WhatsApp and Telegram groups</li>
                  <li>Print for in-person networking events</li>
                  <li>Add to your email signature</li>
                  <li>Include in YouTube video descriptions</li>
                </ul>

                <p style="margin:0 0 12px 0;font-size:13px;line-height:1.6;color:#666;">
                  When someone scans your QR code, they'll be taken directly to the BullMoney registration page 
                  with your affiliate code pre-filled. Any signups through your link will be tracked to your account.
                </p>

                <a href="${safeReferral}" style="display:inline-block;padding:12px 18px;background:#111;color:#fff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:700;">Open Referral Link</a>
              </td>
            </tr>
            <tr>
              <td style="padding:20px;border-top:1px solid #eee;text-align:center;">
                <div style="font-size:12px;color:#888;">
                  This email was sent by BullMoney Admin<br/>
                  Questions? Reply to this email or contact support.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email: to, 
      affiliateName, 
      affiliateCode, 
      posterImage, 
      referralLink,
      adminEmail 
    } = body || {};

    // Validate required fields
    if (!to) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    if (!posterImage) {
      return NextResponse.json({ error: 'Poster image is required.' }, { status: 400 });
    }

    // Configure email transport
    const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT || 587);
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_SERVER_PASSWORD;
    const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_FROM || 'noreply@bullmoney.online';

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error('Email configuration missing:', { smtpHost: !!smtpHost, smtpUser: !!smtpUser, smtpPass: !!smtpPass });
      return NextResponse.json({ error: 'Email service not configured.' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Parse poster image from data URL
    const posterData = parseDataUrl(posterImage);
    if (!posterData) {
      return NextResponse.json({ error: 'Invalid poster image format.' }, { status: 400 });
    }

    // Generate filename
    const filename = `bullmoney-affiliate-poster-${affiliateCode || 'partner'}.png`;

    // Create email with attachment
    const mailOptions = {
      from: `"BullMoney" <${fromEmail}>`,
      to,
      subject: `Your BullMoney Affiliate Poster - ${affiliateName || 'Partner'}`,
      html: createEmailTemplate({
        affiliateName: affiliateName || 'BullMoney Affiliate',
        affiliateCode: affiliateCode || 'PARTNER',
        referralLink: referralLink || 'https://bullmoney.online/',
      }),
      attachments: [
        {
          filename,
          content: posterData.buffer,
          contentType: posterData.mime,
          cid: 'affiliate-poster',
        },
      ],
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ 
      success: true, 
      message: `Poster sent to ${to}`,
    });

  } catch (err: any) {
    console.error('Send poster email failed:', err);
    return NextResponse.json({ 
      error: err?.message || 'Failed to send email',
    }, { status: 500 });
  }
}
