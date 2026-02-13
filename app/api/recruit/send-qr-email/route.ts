import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

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

function createTemplate({
  logoUrl,
  name,
  code,
  shortLink,
  referralLink,
  info,
}: {
  logoUrl: string;
  name: string;
  code: string;
  shortLink: string;
  referralLink: string;
  info: string;
}) {
  const safeName = escapeHtml(name);
  const safeCode = escapeHtml(code);
  const safeShort = escapeHtml(shortLink);
  const safeReferral = escapeHtml(referralLink);
  const safeInfo = escapeHtml(info);

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
                <img src="${logoUrl}" alt="BullMoney" width="64" height="64" style="display:block;margin:0 auto 10px auto;border-radius:12px;" />
                <div style="font-weight:800;font-size:24px;letter-spacing:-0.02em;">BullMoney Affiliate Kit</div>
                <div style="margin-top:6px;font-size:13px;color:#555;">Your QR assets and share files are attached</div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px;">
                <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px;">
                  <div style="font-size:14px;"><strong>Name:</strong> ${safeName}</div>
                  <div style="font-size:14px;margin-top:8px;"><strong>Code:</strong> ${safeCode}</div>
                  <div style="font-size:14px;margin-top:8px;"><strong>Short Link:</strong> ${safeShort}</div>
                  <div style="font-size:14px;margin-top:8px;"><strong>Referral Link:</strong> <a href="${safeReferral}" style="color:#111;word-break:break-all;">${safeReferral}</a></div>
                </div>

                <h3 style="margin:18px 0 8px 0;font-size:16px;">What this is for</h3>
                <p style="margin:0 0 10px 0;font-size:14px;line-height:1.6;color:#444;">These files help you promote your BullMoney affiliate link professionally. When someone signs up through your link or code, that referral is tracked to you.</p>

                <h3 style="margin:14px 0 8px 0;font-size:16px;">How to use your link or code</h3>
                <ul style="margin:0 0 10px 18px;padding:0;font-size:14px;line-height:1.6;color:#444;">
                  <li>Share your referral link directly in messages, bios, and posts.</li>
                  <li>If someone can’t click, give them your code: <strong>${safeCode}</strong>.</li>
                  <li>Use the attached PNG/JPEG/SVG for story posts, reels covers, and status updates.</li>
                </ul>

                <h3 style="margin:14px 0 8px 0;font-size:16px;">Where to share</h3>
                <p style="margin:0 0 10px 0;font-size:14px;line-height:1.6;color:#444;">Instagram stories, WhatsApp status, Telegram groups, Discord communities, TikTok profile links, YouTube descriptions, and X posts.</p>

                <p style="margin:0 0 12px 0;font-size:13px;line-height:1.6;color:#666;">${safeInfo}</p>

                <a href="${safeReferral}" style="display:inline-block;padding:12px 18px;background:#111;color:#fff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:700;">Open Referral Link</a>
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
    const to = String(body?.to || '').trim().toLowerCase();
    const isGmail = /^[^\s@]+@(gmail\.com|googlemail\.com)$/i.test(to);

    if (!isGmail) {
      return NextResponse.json({ error: 'Valid Gmail address is required.' }, { status: 400 });
    }

    const name = String(body?.name || 'Affiliate Partner').trim();
    const code = String(body?.code || 'PARTNER').trim();
    const shortLink = String(body?.shortLink || '').trim();
    const referralLink = String(body?.referralLink || '').trim();
    const info = String(body?.info || '').trim();

    const files = body?.files || {};
    const pngData = parseDataUrl(String(files?.pngDataUrl || ''));
    const jpegData = parseDataUrl(String(files?.jpegDataUrl || ''));
    const svgContent = String(files?.svgContent || '');
    const csvContent = String(files?.csvContent || '');
    const txtContent = String(files?.txtContent || '');
    const docContent = String(files?.docContent || '');

    if (!pngData || !jpegData || !svgContent || !csvContent || !txtContent || !docContent) {
      return NextResponse.json({ error: 'Missing required QR file data.' }, { status: 400 });
    }

    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
    if (!smtpUser || !smtpPass) {
      return NextResponse.json({ error: 'Gmail SMTP is not configured.' }, { status: 503 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass.replace(/^['"]|['"]$/g, '').replace(/\s+/g, ''),
      },
    });

    const origin = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const logoUrl = new URL('/IMG_2921.PNG', origin).toString();

    const html = createTemplate({
      logoUrl,
      name,
      code,
      shortLink,
      referralLink,
      info,
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `BullMoney <${smtpUser}>`,
      to,
      replyTo: smtpUser,
      subject: `BullMoney Affiliate QR Files • ${code}`,
      html,
      attachments: [
        {
          filename: `bullmoney-qr-card-${code}.png`,
          content: pngData.buffer,
          contentType: pngData.mime || 'image/png',
        },
        {
          filename: `bullmoney-qr-card-${code}.jpg`,
          content: jpegData.buffer,
          contentType: jpegData.mime || 'image/jpeg',
        },
        {
          filename: `bullmoney-qr-card-${code}.svg`,
          content: Buffer.from(svgContent, 'utf8'),
          contentType: 'image/svg+xml',
        },
        {
          filename: `bullmoney-qr-card-${code}.csv`,
          content: Buffer.from(csvContent, 'utf8'),
          contentType: 'text/csv',
        },
        {
          filename: `bullmoney-qr-card-${code}.txt`,
          content: Buffer.from(txtContent, 'utf8'),
          contentType: 'text/plain',
        },
        {
          filename: `bullmoney-qr-card-${code}.doc`,
          content: Buffer.from(docContent, 'utf8'),
          contentType: 'application/msword',
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Recruit QR Email] Send failed:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to send QR files email.' },
      { status: 500 }
    );
  }
}
