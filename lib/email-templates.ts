// ============================================================================
// BULLMONEY RESEND EMAIL TEMPLATES
// Professional email templates for Resend - no emojis, clean design
// ============================================================================

export const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://bullmoney.shop';
export const STORE_URL = `${SITE_URL}/store`;
export const VIP_URL = `${SITE_URL}/VIP`;
export const COURSE_URL = `${SITE_URL}/course`;
export const AFFILIATE_URL = `${SITE_URL}/recruit`;

// Shared styles
const BRAND_BLUE = '#3b82f6';
const BRAND_DARK = '#000000';
const CARD_BG = '#111111';
const BORDER_COLOR = '#222222';

// Inline link style
const LINK_STYLE = `color: ${BRAND_BLUE}; text-decoration: underline; font-weight: 600;`;

// Image URLs for emails - using CID for inline attachments
export const EMAIL_LOGO_CID = 'bullmoney-logo';
export const EMAIL_FOOTER_LOGO_CID = 'bullmoney-footer';

// ============================================================================
// EMAIL WRAPPER - Wraps all emails with consistent branding
// ============================================================================
function emailWrapper(content: string, unsubscribeEmail?: string): string {
  const unsubscribeUrl = unsubscribeEmail 
    ? `${SITE_URL}/api/store/unsubscribe?email=${encodeURIComponent(unsubscribeEmail)}`
    : '#';
    
  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <meta name="x-apple-disable-message-reformatting">
  <title>Bullmoney</title>
  <!--[if !mso]><!-->
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    * { -webkit-text-size-adjust: none; text-size-adjust: none; }
    html, body { margin: 0 !important; padding: 0 !important; height: 100% !important; width: 100% !important; }
    body, table, td, div, p, a, span, li, ul { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; }
  </style>
  <!--<![endif]-->
  <!--[if mso]>
  <style type="text/css">
    table {border-collapse:collapse;border-spacing:0;margin:0;}
    div, td {padding:0;}
    div {margin:0 !important;}
  </style>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body class="body" style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;" bgcolor="#000000">
  <!-- Outer table for full-width black background -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#000000" style="background-color: #000000; background: #000000;">
    <tr>
      <td align="center" bgcolor="#000000" style="background-color: #000000; background: #000000;">
        <!-- Inner container -->
        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#000000" style="max-width: 600px; background-color: #000000; background: #000000;">
          <tr>
            <td bgcolor="#000000" style="padding: 40px 20px; background-color: #000000; background: #000000;">
    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 32px;">
      <a href="${SITE_URL}" style="text-decoration: none;">
        <img src="cid:${EMAIL_LOGO_CID}" alt="Bullmoney" width="60" height="60" style="width: 60px; height: 60px; border-radius: 16px;" />
        <div style="margin-top: 8px; font-size: 20px; font-weight: 700; color: #ffffff;">
          BULLMONEY
        </div>
      </a>
    </div>
    
    ${content}
    
    <!-- Quick Links -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0a0a0a" style="margin-top: 32px; background-color: #0a0a0a; border-radius: 12px;">
      <tr>
        <td align="center" bgcolor="#0a0a0a" style="padding: 20px; background-color: #0a0a0a;">
          <p style="color: #888; font-size: 12px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">Quick Links</p>
          <a href="${STORE_URL}" style="color: ${BRAND_BLUE}; text-decoration: none; margin: 0 12px; font-size: 14px;">Store</a>
          <a href="${VIP_URL}" style="color: ${BRAND_BLUE}; text-decoration: none; margin: 0 12px; font-size: 14px;">VIP</a>
          <a href="${COURSE_URL}" style="color: ${BRAND_BLUE}; text-decoration: none; margin: 0 12px; font-size: 14px;">Course</a>
          <a href="${AFFILIATE_URL}" style="color: ${BRAND_BLUE}; text-decoration: none; margin: 0 12px; font-size: 14px;">Earn</a>
        </td>
      </tr>
    </table>
    
    <!-- Footer with Logo -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#000000" style="margin-top: 24px; background-color: #000000; border-top: 1px solid ${BORDER_COLOR};">
      <tr>
        <td align="center" bgcolor="#000000" style="padding-top: 24px; background-color: #000000;">
          <!-- Footer Logo -->
          <a href="${SITE_URL}" style="text-decoration: none;">
            <img src="cid:${EMAIL_FOOTER_LOGO_CID}" alt="Bullmoney" width="120" height="auto" style="max-width: 120px; height: auto;" />
          </a>
        </td>
      </tr>
      <tr>
        <td align="center" bgcolor="#000000" style="padding: 20px 0; background-color: #000000;">
          <!-- Social Links -->
          <a href="https://instagram.com/bullmoneyfx" style="color: #888; text-decoration: none; margin: 0 8px;">Instagram</a>
          <a href="https://youtube.com/@bullmoneyfx" style="color: #888; text-decoration: none; margin: 0 8px;">YouTube</a>
          <a href="https://discord.gg/bullmoney" style="color: #888; text-decoration: none; margin: 0 8px;">Discord</a>
          <a href="https://t.me/bullmoneyfx" style="color: #888; text-decoration: none; margin: 0 8px;">Telegram</a>
        </td>
      </tr>
      <tr>
        <td align="center" bgcolor="#000000" style="padding-bottom: 20px; background-color: #000000;">
          <p style="color: #666666; font-size: 12px; margin: 0 0 8px 0;">
            © ${new Date().getFullYear()} Bullmoney. All rights reserved.
          </p>
          <a href="${unsubscribeUrl}" style="color: #666666; font-size: 12px; text-decoration: underline;">
            Unsubscribe from emails
          </a>
        </td>
      </tr>
    </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// ============================================================================
// TEMPLATE: GRAND LAUNCH - Full website & store announcement
// ============================================================================
export function grandLaunchEmail(firstName: string, email: string): { subject: string; html: string } {
  const content = `
    <!-- Hero Section -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#111111" style="background-color: #111111; border: 1px solid #222222; border-radius: 20px;">
      <tr><td bgcolor="#111111" style="padding: 40px; background-color: #111111; color: #ffffff; text-align: center;">
      <!-- Icon -->
      <div style="width: 64px; height: 64px; margin: 0 auto 20px; background: linear-gradient(135deg, ${BRAND_BLUE}, #1d4ed8); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <div style="width: 0; height: 0; border-left: 16px solid #fff; border-top: 10px solid transparent; border-bottom: 10px solid transparent; margin-left: 4px;"></div>
      </div>
      
      <h1 style="margin: 0 0 16px 0; font-size: 32px; font-weight: 700; color: ${BRAND_BLUE};">
        We're Live, ${firstName}
      </h1>
      
      <p style="color: #e0e0e0; font-size: 18px; line-height: 1.7; margin: 0 0 24px 0;">
        The wait is over. <a href="${SITE_URL}" style="${LINK_STYLE}">Bullmoney</a> is officially here — built for traders who want real results.
      </p>
      
      <div style="background: #0a0a0a; border: 1px solid #333; border-radius: 16px; padding: 24px; margin-bottom: 24px; text-align: left;">
        <h3 style="color: ${BRAND_BLUE}; margin: 0 0 16px 0; font-size: 16px;">What's waiting for you:</h3>
        <ul style="color: #ccc; font-size: 15px; line-height: 2.2; margin: 0; padding-left: 20px;">
          <li><a href="${VIP_URL}" style="${LINK_STYLE}">VIP Trading Signals</a> — Live calls starting at just <strong style="color: #fff;">$49/month</strong></li>
          <li><a href="${STORE_URL}" style="${LINK_STYLE}">The Bullmoney Store</a> — Hoodies from <strong style="color: #fff;">$29.99</strong>, caps from <strong style="color: #fff;">$14.99</strong></li>
          <li><a href="${SITE_URL}/socials" style="${LINK_STYLE}">Live Streams</a> — Free daily market analysis on YouTube</li>
          <li><a href="${COURSE_URL}" style="${LINK_STYLE}">Trading Course</a> — Full curriculum for only <strong style="color: #fff;">$199</strong> (lifetime)</li>
          <li><a href="${AFFILIATE_URL}" style="${LINK_STYLE}">Affiliate Program</a> — Earn <strong style="color: #fff;">20% commission</strong> on every referral</li>
        </ul>
      </div>
      
      <a href="${STORE_URL}" 
         style="display: inline-block; background: linear-gradient(135deg, ${BRAND_BLUE}, #1d4ed8); color: #ffffff; padding: 18px 48px; 
                text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 18px; margin-bottom: 12px;">
        Shop The Store
      </a>
      
      <br>
      
      <a href="${VIP_URL}" 
         style="display: inline-block; background: transparent; border: 2px solid ${BRAND_BLUE}; color: ${BRAND_BLUE}; padding: 14px 40px; 
                text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; margin-top: 8px;">
        Join VIP Access
      </a>
      
      <p style="color: #888; font-size: 13px; margin: 20px 0 0 0;">
        Questions? Reply to this email or visit <a href="${SITE_URL}" style="${LINK_STYLE}">bullmoney.shop</a>
      </p>
      </td></tr>
    </table>
  `;
  
  return {
    subject: "Bullmoney Is LIVE — Everything You Need Is Here",
    html: emailWrapper(content, email),
  };
}

// ============================================================================
// TEMPLATE: STORE PROMO - Promote store products
// ============================================================================
export function storePromoEmail(firstName: string, email: string): { subject: string; html: string } {
  const products = [
    { name: 'Premium Hoodie', price: '$29.99', oldPrice: '$89.99', link: `${STORE_URL}?product=hoodie` },
    { name: 'Trader Snapback Cap', price: '$14.99', oldPrice: '$34.99', link: `${STORE_URL}?product=cap` },
    { name: 'Classic T-Shirt', price: '$19.99', oldPrice: '$39.99', link: `${STORE_URL}?product=tshirt` },
    { name: 'Market Tumbler', price: '$12.99', oldPrice: '$34.99', link: `${STORE_URL}?product=tumbler` },
  ];
  
  const productHtml = products.map(p => `
    <tr>
      <td style="padding: 14px 0; border-bottom: 1px solid #222;">
        <a href="${p.link}" style="${LINK_STYLE}">${p.name}</a>
      </td>
      <td style="padding: 14px 0; border-bottom: 1px solid #222; text-align: right;">
        <span style="color: #666; text-decoration: line-through; font-size: 13px; margin-right: 8px;">${p.oldPrice}</span>
        <span style="color: ${BRAND_BLUE}; font-weight: 700; font-size: 16px;">${p.price}</span>
      </td>
    </tr>
  `).join('');

  const content = `
    <!-- Main Card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#111111" style="background-color: #111111; border: 1px solid #222222; border-radius: 20px;">
      <tr><td bgcolor="#111111" style="padding: 40px; background-color: #111111; color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <!-- Shopping bag icon -->
        <div style="width: 56px; height: 56px; margin: 0 auto 16px; background: linear-gradient(135deg, ${BRAND_BLUE}, #1d4ed8); border-radius: 50%; position: relative;">
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 16px; border: 3px solid #fff; border-radius: 4px;"></div>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #fff;">
          The <a href="${STORE_URL}" style="${LINK_STYLE}">Bullmoney Store</a> Is Open
        </h1>
        <p style="color: #999; margin: 0;">Premium trader gear at prices you won't believe</p>
      </div>
      
      <!-- Featured Products -->
      <div style="background: #0a0a0a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h3 style="color: ${BRAND_BLUE}; margin: 0 0 16px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
          Launch Sale — Up to 70% Off
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${productHtml}
        </table>
        <p style="color: #888; font-size: 12px; margin: 12px 0 0 0; text-align: center;">
          <a href="${STORE_URL}" style="${LINK_STYLE}">View all products</a> — Free shipping on orders over $50
        </p>
      </div>
      
      <!-- Discount Code -->
      <div style="background-color: #0f0f0f; border: 2px dashed ${BRAND_BLUE}; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <p style="color: #999; margin: 0 0 8px 0; font-size: 14px;">Extra 10% off with code:</p>
        <div style="font-size: 28px; font-weight: 700; color: ${BRAND_BLUE}; letter-spacing: 3px;">
          WELCOME10
        </div>
        <p style="color: #666; margin: 8px 0 0 0; font-size: 12px;">Valid on your first order at <a href="${STORE_URL}" style="${LINK_STYLE}">bullmoney.shop/store</a></p>
      </div>
      
      <div style="text-align: center;">
        <a href="${STORE_URL}" 
           style="display: inline-block; background: linear-gradient(135deg, ${BRAND_BLUE}, #1d4ed8); color: #ffffff; padding: 16px 48px; 
                  text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;">
          Shop Now
        </a>
      </div>
    </div>
    
    <!-- Categories Grid -->
    <table style="width: 100%; margin-top: 24px; border-collapse: separate; border-spacing: 12px;">
      <tr>
        <td style="width: 50%; background: #111; border: 1px solid #222; border-radius: 12px; padding: 20px; text-align: center;">
          <a href="${STORE_URL}?category=apparel" style="text-decoration: none;">
            <div style="width: 32px; height: 32px; margin: 0 auto 8px; background: #222; border-radius: 8px;"></div>
            <p style="color: #fff; margin: 0; font-size: 14px;">Apparel</p>
            <p style="color: ${BRAND_BLUE}; margin: 4px 0 0 0; font-size: 12px;">From $14.99</p>
          </a>
        </td>
        <td style="width: 50%; background: #111; border: 1px solid #222; border-radius: 12px; padding: 20px; text-align: center;">
          <a href="${STORE_URL}?category=accessories" style="text-decoration: none;">
            <div style="width: 32px; height: 32px; margin: 0 auto 8px; background: #222; border-radius: 8px;"></div>
            <p style="color: #fff; margin: 0; font-size: 14px;">Accessories</p>
            <p style="color: ${BRAND_BLUE}; margin: 4px 0 0 0; font-size: 12px;">From $9.99</p>
          </a>
        </td>
      </tr>
      <tr>
        <td style="width: 50%; background: #111; border: 1px solid #222; border-radius: 12px; padding: 20px; text-align: center;">
          <a href="${STORE_URL}?category=tech" style="text-decoration: none;">
            <div style="width: 32px; height: 32px; margin: 0 auto 8px; background: #222; border-radius: 8px;"></div>
            <p style="color: #fff; margin: 0; font-size: 14px;">Tech & Gear</p>
            <p style="color: ${BRAND_BLUE}; margin: 4px 0 0 0; font-size: 12px;">From $29.99</p>
          </a>
        </td>
        <td style="width: 50%; background: #111; border: 1px solid #222; border-radius: 12px; padding: 20px; text-align: center;">
          <a href="${STORE_URL}?category=limited" style="text-decoration: none;">
            <div style="width: 32px; height: 32px; margin: 0 auto 8px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 8px;"></div>
            <p style="color: #fff; margin: 0; font-size: 14px;">Limited Edition</p>
            <p style="color: ${BRAND_BLUE}; margin: 4px 0 0 0; font-size: 12px;">Exclusive drops</p>
          </a>
        </td>
      </tr>
    </table>
  `;
  
  return {
    subject: "The Bullmoney Store Is Open — Hoodies from $29.99",
    html: emailWrapper(content, email),
  };
}

// ============================================================================
// TEMPLATE: VIP PROMO - Promote VIP membership
// ============================================================================
export function vipPromoEmail(firstName: string, email: string): { subject: string; html: string } {
  const benefits = [
    { title: 'Live Trading Signals', desc: 'Real-time entries, exits, and analysis', color: '#10b981' },
    { title: 'Private Live Streams', desc: 'VIP-only market breakdowns', color: '#8b5cf6' },
    { title: 'Private Telegram Group', desc: 'Direct access to the team', color: '#3b82f6' },
    { title: 'Full Course Access', desc: 'Learn the complete trading system', color: '#1d4ed8' },
  ];
  
  const benefitHtml = benefits.map(b => `
    <tr>
      <td style="padding: 14px 0; border-bottom: 1px solid #222;">
        <div style="display: inline-block; width: 10px; height: 10px; background: ${b.color}; border-radius: 50%; margin-right: 12px;"></div>
        <strong style="color: #fff;">${b.title}</strong>
        <p style="color: #888; margin: 4px 0 0 22px; font-size: 13px;">${b.desc}</p>
      </td>
    </tr>
  `).join('');

  const content = `
    <!-- Main Card -->
    <div style="background-color: #111111; border: 2px solid #2563eb; border-radius: 20px; padding: 40px; color: #ffffff; text-align: center;">
      <!-- Crown icon using CSS -->
      <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 50%; position: relative;">
        <div style="position: absolute; top: 18px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 12px solid transparent; border-right: 12px solid transparent; border-bottom: 20px solid #1a1a1a;"></div>
        <div style="position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); width: 32px; height: 8px; background: #1a1a1a; border-radius: 2px;"></div>
      </div>
      
      <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 700; background: linear-gradient(90deg, #3b82f6, #60a5fa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
        <a href="${VIP_URL}" style="text-decoration: none; background: linear-gradient(90deg, #3b82f6, #60a5fa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">VIP Access Is Here</a>
      </h1>
      
      <p style="color: #999; font-size: 16px; margin: 0 0 32px 0;">
        Join the inner circle of profitable traders at <a href="${VIP_URL}" style="${LINK_STYLE}">bullmoney.shop/vip</a>
      </p>
      
      <!-- Benefits -->
      <div style="background: #0a0a0a; border-radius: 16px; padding: 24px; margin-bottom: 24px; text-align: left;">
        <table style="width: 100%; border-collapse: collapse;">
          ${benefitHtml}
        </table>
        <p style="color: #888; font-size: 12px; margin: 16px 0 0 0; text-align: center;">
          Plus access to the <a href="${COURSE_URL}" style="${LINK_STYLE}">full trading course</a> and <a href="${STORE_URL}" style="${LINK_STYLE}">exclusive store discounts</a>
        </p>
      </div>
      
      <!-- Pricing Tiers -->
      <table style="width: 100%; border-collapse: separate; border-spacing: 8px; margin-bottom: 24px;">
        <tr>
          <td style="width: 33%; background: #111; border: 1px solid #333; border-radius: 12px; padding: 16px; text-align: center;">
            <p style="color: #888; margin: 0 0 4px 0; font-size: 12px;">MONTHLY</p>
            <div style="font-size: 24px; font-weight: 700; color: #3b82f6;">$49</div>
            <p style="color: #666; margin: 0; font-size: 11px;">/month</p>
          </td>
          <td style="width: 33%; background-color: #0f0f0f; border: 2px solid #3b82f6; border-radius: 12px; padding: 16px; text-align: center;">
            <p style="color: #3b82f6; margin: 0 0 4px 0; font-size: 12px; font-weight: 600;">BEST VALUE</p>
            <div style="font-size: 24px; font-weight: 700; color: #3b82f6;">$29</div>
            <p style="color: #666; margin: 0; font-size: 11px;">/month yearly</p>
          </td>
          <td style="width: 33%; background: #111; border: 1px solid #333; border-radius: 12px; padding: 16px; text-align: center;">
            <p style="color: #888; margin: 0 0 4px 0; font-size: 12px;">LIFETIME</p>
            <div style="font-size: 24px; font-weight: 700; color: #3b82f6;">$499</div>
            <p style="color: #666; margin: 0; font-size: 11px;">one-time</p>
          </td>
        </tr>
      </table>
      
      <a href="${VIP_URL}" 
         style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: #000000; padding: 18px 48px; 
                text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 18px;">
        Unlock VIP Access
      </a>
      
      <p style="color: #666; font-size: 12px; margin: 16px 0 0 0;">
        Cancel anytime. 7-day money-back guarantee.
      </p>
    </div>
    
    <!-- Testimonial -->
    <div style="background: #111; border: 1px solid #222; border-radius: 12px; padding: 20px; margin-top: 24px;">
      <p style="color: #ccc; font-style: italic; margin: 0 0 8px 0; font-size: 14px;">
        "Joined VIP two months ago. Made back my subscription cost in the first week."
      </p>
      <p style="color: ${BRAND_BLUE}; margin: 0; font-size: 13px; font-weight: 600;">
        — VIP Member since 2024
      </p>
    </div>
  `;
  
  return {
    subject: "VIP Access Is Live — Plans Starting at $29/month",
    html: emailWrapper(content, email),
  };
}

// ============================================================================
// TEMPLATE: NEW PRODUCT DROP
// ============================================================================
export function newProductEmail(
  firstName: string, 
  email: string,
  productName: string,
  productPrice: string,
  productDescription: string,
  productImage?: string
): { subject: string; html: string } {
  const content = `
    <div style="background-color: #111111; border: 1px solid ${BORDER_COLOR}; border-radius: 20px; padding: 40px; color: #ffffff; text-align: center;">
      <!-- Star burst icon -->
      <div style="width: 56px; height: 56px; margin: 0 auto 16px; background: linear-gradient(135deg, ${BRAND_BLUE}, #1d4ed8); border-radius: 50%; position: relative;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 24px; color: #fff; font-weight: bold;">+</div>
      </div>
      
      <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: ${BRAND_BLUE};">
        New Drop Alert
      </h1>
      
      <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #fff;">
        <a href="${STORE_URL}" style="${LINK_STYLE}">${productName}</a>
      </h2>
      
      ${productImage ? `
        <a href="${STORE_URL}">
          <img src="${productImage}" alt="${productName}" 
               style="max-width: 100%; height: auto; border-radius: 12px; margin-bottom: 20px;" />
        </a>
      ` : ''}
      
      <p style="color: #999; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        ${productDescription}
      </p>
      
      <div style="margin-bottom: 24px;">
        <span style="color: #666; text-decoration: line-through; font-size: 18px; margin-right: 8px;">$79.99</span>
        <span style="font-size: 32px; font-weight: 700; color: ${BRAND_BLUE};">${productPrice}</span>
      </div>
      
      <a href="${STORE_URL}" 
         style="display: inline-block; background: linear-gradient(135deg, ${BRAND_BLUE}, #1d4ed8); color: #ffffff; padding: 16px 48px; 
                text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;">
        Shop Now
      </a>
      
      <p style="color: #888; font-size: 13px; margin: 16px 0 0 0;">
        Browse more new arrivals at <a href="${STORE_URL}" style="${LINK_STYLE}">bullmoney.shop/store</a>
      </p>
    </div>
    
    <!-- Cross-sell -->
    <div style="background: #111; border: 1px solid #222; border-radius: 12px; padding: 20px; margin-top: 24px; text-align: center;">
      <p style="color: #888; margin: 0 0 8px 0; font-size: 14px;">Want the full trading experience?</p>
      <a href="${VIP_URL}" style="${LINK_STYLE}">Join VIP</a>
      <span style="color: #444; margin: 0 8px;">|</span>
      <a href="${COURSE_URL}" style="${LINK_STYLE}">Take the Course</a>
    </div>
  `;
  
  return {
    subject: `Just Dropped: ${productName}`,
    html: emailWrapper(content, email),
  };
}

// ============================================================================
// TEMPLATE: FLASH SALE
// ============================================================================
export function flashSaleEmail(
  firstName: string, 
  email: string,
  discountPercent: number,
  discountCode: string,
  hoursRemaining: number = 24
): { subject: string; html: string } {
  const content = `
    <div style="background-color: #b91c1c; border: 2px solid #ef4444; border-radius: 20px; padding: 40px; color: #ffffff; text-align: center;">
      <!-- Lightning bolt icon -->
      <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: #fff; border-radius: 50%; position: relative;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(15deg); width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 24px solid #dc2626;"></div>
      </div>
      
      <h1 style="margin: 0 0 8px 0; font-size: 36px; font-weight: 700;">
        FLASH SALE
      </h1>
      
      <div style="font-size: 72px; font-weight: 800; margin: 16px 0;">
        ${discountPercent}% OFF
      </div>
      
      <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 0 0 24px 0;">
        Everything in the <a href="${STORE_URL}" style="color: #fff; text-decoration: underline;">store</a>. ${hoursRemaining} hours only!
      </p>
      
      <!-- Countdown -->
      <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <p style="color: rgba(255,255,255,0.7); font-size: 14px; margin: 0 0 8px 0;">Use code at checkout:</p>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 4px;">
          ${discountCode}
        </div>
      </div>
      
      <a href="${STORE_URL}" 
         style="display: inline-block; background: #ffffff; color: #dc2626; padding: 18px 48px; 
                text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 18px;">
        SHOP THE SALE
      </a>
      
      <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 16px 0 0 0;">
        Hoodies from $29.99 | T-Shirts from $19.99 | Caps from $14.99
      </p>
    </div>
    
    <!-- Also check out -->
    <div style="background: #111; border: 1px solid #222; border-radius: 12px; padding: 20px; margin-top: 24px; text-align: center;">
      <p style="color: #888; margin: 0 0 8px 0; font-size: 14px;">While you're here...</p>
      <a href="${VIP_URL}" style="${LINK_STYLE}">Explore VIP Membership</a>
      <span style="color: #444; margin: 0 8px;">|</span>
      <a href="${COURSE_URL}" style="${LINK_STYLE}">Browse Courses</a>
    </div>
  `;
  
  return {
    subject: `FLASH SALE: ${discountPercent}% OFF Everything — ${hoursRemaining}hrs Only`,
    html: emailWrapper(content, email),
  };
}

// ============================================================================
// TEMPLATE: AFFILIATE PROGRAM
// ============================================================================
export function affiliatePromoEmail(firstName: string, email: string): { subject: string; html: string } {
  const content = `
    <div style="background-color: #111111; border: 1px solid ${BORDER_COLOR}; border-radius: 20px; padding: 40px; color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <!-- Dollar/circle icon -->
        <div style="width: 56px; height: 56px; margin: 0 auto 16px; background: linear-gradient(135deg, ${BRAND_BLUE}, #1d4ed8); border-radius: 50%; position: relative;">
          <span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #fff; font-size: 24px; font-weight: bold;">$</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #fff;">
          Earn While You Trade
        </h1>
        <p style="color: #999; margin: 0;">Join the <a href="${AFFILIATE_URL}" style="${LINK_STYLE}">Bullmoney Affiliate Program</a></p>
      </div>
      
      <!-- Earnings -->
      <div style="background: linear-gradient(135deg, ${BRAND_BLUE}22, ${BRAND_BLUE}11); border: 1px solid ${BRAND_BLUE}44; border-radius: 16px; padding: 24px; margin-bottom: 24px; text-align: center;">
        <p style="color: #999; margin: 0 0 8px 0; font-size: 14px;">Earn up to</p>
        <div style="font-size: 48px; font-weight: 700; color: ${BRAND_BLUE};">
          20%
        </div>
        <p style="color: #999; margin: 8px 0 0 0; font-size: 14px;">on every referral — paid monthly</p>
      </div>
      
      <!-- Example earnings -->
      <div style="background: #0a0a0a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h3 style="color: ${BRAND_BLUE}; margin: 0 0 16px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
          Example Earnings
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #222; color: #ccc;">5 VIP referrals/month</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #222; color: ${BRAND_BLUE}; text-align: right; font-weight: 600;">$49/month</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #222; color: #ccc;">10 VIP referrals/month</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #222; color: ${BRAND_BLUE}; text-align: right; font-weight: 600;">$98/month</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #ccc;">25 VIP referrals/month</td>
            <td style="padding: 10px 0; color: ${BRAND_BLUE}; text-align: right; font-weight: 600;">$245/month</td>
          </tr>
        </table>
      </div>
      
      <!-- How it works -->
      <div style="background: #0a0a0a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h3 style="color: ${BRAND_BLUE}; margin: 0 0 16px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
          How It Works
        </h3>
        
        <div style="padding: 12px 0; border-bottom: 1px solid #222;">
          <span style="display: inline-block; width: 24px; height: 24px; background: ${BRAND_BLUE}; border-radius: 50%; text-align: center; line-height: 24px; color: #000; font-weight: 600; font-size: 12px;">1</span>
          <span style="color: #fff; margin-left: 12px;">Get your unique referral code at <a href="${AFFILIATE_URL}" style="${LINK_STYLE}">bullmoney.shop/recruit</a></span>
        </div>
        <div style="padding: 12px 0; border-bottom: 1px solid #222;">
          <span style="display: inline-block; width: 24px; height: 24px; background: ${BRAND_BLUE}; border-radius: 50%; text-align: center; line-height: 24px; color: #000; font-weight: 600; font-size: 12px;">2</span>
          <span style="color: #fff; margin-left: 12px;">Share with your trading community</span>
        </div>
        <div style="padding: 12px 0;">
          <span style="display: inline-block; width: 24px; height: 24px; background: ${BRAND_BLUE}; border-radius: 50%; text-align: center; line-height: 24px; color: #000; font-weight: 600; font-size: 12px;">3</span>
          <span style="color: #fff; margin-left: 12px;">Earn 20% when they join <a href="${VIP_URL}" style="${LINK_STYLE}">VIP</a></span>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="${AFFILIATE_URL}" 
           style="display: inline-block; background: linear-gradient(135deg, ${BRAND_BLUE}, #1d4ed8); color: #ffffff; padding: 16px 48px; 
                  text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;">
          Start Earning
        </a>
        <p style="color: #888; font-size: 13px; margin: 16px 0 0 0;">
          No sign-up fee. Get started in under 60 seconds.
        </p>
      </div>
    </div>
  `;
  
  return {
    subject: "Earn 20% on Every Referral — Join Our Affiliate Program",
    html: emailWrapper(content, email),
  };
}

// ============================================================================
// TEMPLATE: WEEKLY DIGEST
// ============================================================================
export function weeklyDigestEmail(
  firstName: string, 
  email: string,
  stats: {
    newProducts?: number;
    vipSignals?: number;
    upcomingLivestreams?: string[];
  } = {}
): { subject: string; html: string } {
  const content = `
    <div style="background-color: #111111; border: 1px solid ${BORDER_COLOR}; border-radius: 20px; padding: 40px; color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <!-- Mail icon -->
        <div style="width: 56px; height: 56px; margin: 0 auto 16px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 50%; position: relative;">
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 24px; height: 16px; border: 2px solid #fff; border-radius: 2px;"></div>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #fff;">
          Your Weekly <a href="${SITE_URL}" style="${LINK_STYLE}">Bullmoney</a> Update
        </h1>
        <p style="color: #999; margin: 0;">Here's what happened this week</p>
      </div>
      
      <!-- Stats Grid -->
      <table style="width: 100%; border-collapse: separate; border-spacing: 12px; margin-bottom: 24px;">
        <tr>
          <td style="width: 50%; background: #0a0a0a; border-radius: 12px; padding: 20px; text-align: center;">
            <div style="font-size: 32px; font-weight: 700; color: ${BRAND_BLUE};">
              ${stats.newProducts || 0}
            </div>
            <p style="color: #888; margin: 4px 0 0 0; font-size: 13px;"><a href="${STORE_URL}" style="${LINK_STYLE}">New Products</a></p>
          </td>
          <td style="width: 50%; background: #0a0a0a; border-radius: 12px; padding: 20px; text-align: center;">
            <div style="font-size: 32px; font-weight: 700; color: ${BRAND_BLUE};">
              ${stats.vipSignals || 0}
            </div>
            <p style="color: #888; margin: 4px 0 0 0; font-size: 13px;"><a href="${VIP_URL}" style="${LINK_STYLE}">VIP Signals</a> Sent</p>
          </td>
        </tr>
      </table>
      
      ${stats.upcomingLivestreams?.length ? `
        <div style="background: #0a0a0a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h3 style="color: ${BRAND_BLUE}; margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase;">
            Upcoming Livestreams
          </h3>
          ${stats.upcomingLivestreams.map(stream => `
            <p style="color: #ccc; margin: 8px 0; font-size: 14px;">- ${stream}</p>
          `).join('')}
        </div>
      ` : ''}
      
      <!-- Highlights -->
      <div style="background: #0a0a0a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h3 style="color: ${BRAND_BLUE}; margin: 0 0 16px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
          Quick Links
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #222;">
              <a href="${STORE_URL}" style="${LINK_STYLE}">Shop New Arrivals</a>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #222; color: #666; text-align: right; font-size: 13px;">Hoodies from $29.99</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #222;">
              <a href="${VIP_URL}" style="${LINK_STYLE}">Join VIP Today</a>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #222; color: #666; text-align: right; font-size: 13px;">From $29/month</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #222;">
              <a href="${COURSE_URL}" style="${LINK_STYLE}">Start the Trading Course</a>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #222; color: #666; text-align: right; font-size: 13px;">$199 one-time</td>
          </tr>
          <tr>
            <td style="padding: 10px 0;">
              <a href="${AFFILIATE_URL}" style="${LINK_STYLE}">Become an Affiliate</a>
            </td>
            <td style="padding: 10px 0; color: #666; text-align: right; font-size: 13px;">Earn 20% commission</td>
          </tr>
        </table>
      </div>
      
      <!-- CTAs -->
      <div style="text-align: center;">
        <a href="${STORE_URL}" 
           style="display: inline-block; background: linear-gradient(135deg, ${BRAND_BLUE}, #1d4ed8); color: #ffffff; padding: 14px 32px; 
                  text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px; margin: 4px;">
          Shop Store
        </a>
        <a href="${VIP_URL}" 
           style="display: inline-block; background: transparent; border: 2px solid ${BRAND_BLUE}; color: ${BRAND_BLUE}; padding: 12px 32px; 
                  text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px; margin: 4px;">
          Join VIP
        </a>
      </div>
    </div>
  `;
  
  return {
    subject: `Your Weekly Bullmoney Update`,
    html: emailWrapper(content, email),
  };
}

// ============================================================================
// TEMPLATE: WELCOME EMAIL - Sent to new subscribers
// ============================================================================
export function welcomeEmail(email: string): { subject: string; html: string } {
  const firstName = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
  
  const content = `
    <!-- Welcome Hero -->
    <div style="background-color: #111111; border: 1px solid ${BORDER_COLOR}; border-radius: 20px; padding: 40px; color: #ffffff; text-align: center;">
      <!-- Checkmark icon -->
      <div style="width: 64px; height: 64px; margin: 0 auto 20px; background: linear-gradient(135deg, ${BRAND_BLUE}, #1d4ed8); border-radius: 50%; position: relative;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -55%) rotate(45deg); width: 12px; height: 22px; border-right: 4px solid #fff; border-bottom: 4px solid #fff;"></div>
      </div>
      
      <h1 style="margin: 0 0 16px 0; font-size: 32px; font-weight: 700; color: #fff;">
        Welcome to <span style="color: ${BRAND_BLUE};">Bullmoney</span>
      </h1>
      
      <p style="color: #e0e0e0; font-size: 18px; line-height: 1.7; margin: 0 0 32px 0;">
        You're in. Get ready for exclusive drops, trading insights, and deals you won't find anywhere else.
      </p>
    </div>
    
    <!-- What's Next -->
    <div style="background: ${CARD_BG}; border: 1px solid ${BORDER_COLOR}; border-radius: 20px; padding: 32px; margin-top: 24px; color: #ffffff;">
      <h2 style="color: ${BRAND_BLUE}; margin: 0 0 24px 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">
        Here's What You Get
      </h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 16px 0; border-bottom: 1px solid #222;">
            <div style="display: inline-block; width: 10px; height: 10px; background: ${BRAND_BLUE}; border-radius: 50%; margin-right: 12px;"></div>
            <strong style="color: #fff;">Exclusive Store Discounts</strong>
            <p style="color: #888; margin: 4px 0 0 22px; font-size: 14px;">Early access to sales and subscriber-only codes</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px 0; border-bottom: 1px solid #222;">
            <div style="display: inline-block; width: 10px; height: 10px; background: #60a5fa; border-radius: 50%; margin-right: 12px;"></div>
            <strong style="color: #fff;">Trading Tips & Insights</strong>
            <p style="color: #888; margin: 4px 0 0 22px; font-size: 14px;">Weekly market analysis and trading education</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px 0; border-bottom: 1px solid #222;">
            <div style="display: inline-block; width: 10px; height: 10px; background: #2563eb; border-radius: 50%; margin-right: 12px;"></div>
            <strong style="color: #fff;">New Product Alerts</strong>
            <p style="color: #888; margin: 4px 0 0 22px; font-size: 14px;">Be the first to know about drops and restocks</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px 0;">
            <div style="display: inline-block; width: 10px; height: 10px; background: #1d4ed8; border-radius: 50%; margin-right: 12px;"></div>
            <strong style="color: #fff;">VIP & Course Updates</strong>
            <p style="color: #888; margin: 4px 0 0 22px; font-size: 14px;">Special offers on premium memberships</p>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Featured Links -->
    <div style="background: ${CARD_BG}; border: 1px solid ${BORDER_COLOR}; border-radius: 20px; padding: 32px; margin-top: 24px; color: #ffffff;">
      <h2 style="color: ${BRAND_BLUE}; margin: 0 0 24px 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">
        Start Exploring
      </h2>
      
      <table style="width: 100%; border-collapse: separate; border-spacing: 8px;">
        <tr>
          <td style="width: 50%; background: #0a0a0a; border-radius: 12px; padding: 20px; text-align: center;">
            <a href="${STORE_URL}" style="text-decoration: none;">
              <div style="width: 40px; height: 40px; margin: 0 auto 12px; background: linear-gradient(135deg, ${BRAND_BLUE}, #1d4ed8); border-radius: 10px;"></div>
              <p style="color: #fff; margin: 0 0 4px 0; font-size: 16px; font-weight: 600;">Shop Store</p>
              <p style="color: ${BRAND_BLUE}; margin: 0; font-size: 13px;">Hoodies from $29.99</p>
            </a>
          </td>
          <td style="width: 50%; background: #0a0a0a; border-radius: 12px; padding: 20px; text-align: center;">
            <a href="${VIP_URL}" style="text-decoration: none;">
              <div style="width: 40px; height: 40px; margin: 0 auto 12px; background: linear-gradient(135deg, #60a5fa, ${BRAND_BLUE}); border-radius: 10px;"></div>
              <p style="color: #fff; margin: 0 0 4px 0; font-size: 16px; font-weight: 600;">Join VIP</p>
              <p style="color: ${BRAND_BLUE}; margin: 0; font-size: 13px;">From $29/month</p>
            </a>
          </td>
        </tr>
        <tr>
          <td style="width: 50%; background: #0a0a0a; border-radius: 12px; padding: 20px; text-align: center;">
            <a href="${COURSE_URL}" style="text-decoration: none;">
              <div style="width: 40px; height: 40px; margin: 0 auto 12px; background: linear-gradient(135deg, #2563eb, #1d4ed8); border-radius: 10px;"></div>
              <p style="color: #fff; margin: 0 0 4px 0; font-size: 16px; font-weight: 600;">Take the Course</p>
              <p style="color: ${BRAND_BLUE}; margin: 0; font-size: 13px;">$199 one-time</p>
            </a>
          </td>
          <td style="width: 50%; background: #0a0a0a; border-radius: 12px; padding: 20px; text-align: center;">
            <a href="${AFFILIATE_URL}" style="text-decoration: none;">
              <div style="width: 40px; height: 40px; margin: 0 auto 12px; background: linear-gradient(135deg, ${BRAND_BLUE}, #2563eb); border-radius: 10px;"></div>
              <p style="color: #fff; margin: 0 0 4px 0; font-size: 16px; font-weight: 600;">Earn Money</p>
              <p style="color: ${BRAND_BLUE}; margin: 0; font-size: 13px;">20% commission</p>
            </a>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Social Links -->
    <div style="background: linear-gradient(135deg, ${BRAND_BLUE}22, ${BRAND_BLUE}11); border: 1px solid ${BRAND_BLUE}44; border-radius: 16px; padding: 24px; margin-top: 24px; text-align: center;">
      <h3 style="color: #fff; margin: 0 0 16px 0; font-size: 16px;">Follow Us</h3>
      <p style="color: #888; margin: 0; font-size: 14px;">
        <a href="https://instagram.com/bullmoneyfx" style="${LINK_STYLE}">Instagram</a>
        <span style="color: #444; margin: 0 8px;">|</span>
        <a href="https://youtube.com/@bullmoneyfx" style="${LINK_STYLE}">YouTube</a>
        <span style="color: #444; margin: 0 8px;">|</span>
        <a href="https://discord.gg/bullmoney" style="${LINK_STYLE}">Discord</a>
        <span style="color: #444; margin: 0 8px;">|</span>
        <a href="https://t.me/bullmoneyfx" style="${LINK_STYLE}">Telegram</a>
      </p>
    </div>
  `;
  
  return {
    subject: "Welcome to Bullmoney — You're In",
    html: emailWrapper(content, email),
  };
}

// ============================================================================
// CRYPTO PAYMENT TEMPLATES - Used by crypto-payment API & admin hub
// All templates support {{variable}} replacement for SQL-based editing
// ============================================================================

export interface CryptoEmailVars {
  order_number: string;
  tx_hash: string;
  coin: string;
  network: string;
  amount_usd: string;
  amount_crypto: string;
  locked_price?: string;
  product_name: string;
  quantity: string;
  sender_wallet?: string;
  wallet_address: string;
  status: string;
  customer_email?: string;
  explorer_url: string;
  site_url: string;
  confirmations?: string;
  required_confirmations?: string;
  confirmed_at?: string;
  refund_amount_usd?: string;
  refund_tx_hash?: string;
  refund_reason?: string;
  refund_wallet?: string;
}

/**
 * Admin: Crypto Payment Received — full details + invoice
 * Slug: crypto_payment_admin
 */
export function cryptoPaymentAdminEmail(vars: CryptoEmailVars): { subject: string; html: string } {
  const content = `
    <h2 style="color: ${BRAND_BLUE}; font-size: 20px; font-weight: 700; margin: 0 0 20px;">New Crypto Payment Received</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CARD_BG}" style="background-color: ${CARD_BG}; border: 1px solid ${BORDER_COLOR}; border-radius: 12px;">
      <tr><td style="padding: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Order</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right; font-weight: 600;">${vars.order_number}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Customer</td><td style="padding: 8px 0; color: ${BRAND_BLUE}; font-size: 14px; text-align: right;">${vars.customer_email || 'N/A'}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Product</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${vars.product_name} x${vars.quantity}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Amount (USD)</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right; font-weight: 700;">$${vars.amount_usd}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Crypto</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${vars.amount_crypto} ${vars.coin}</td></tr>
          ${vars.locked_price ? `<tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Locked Rate</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">1 ${vars.coin} = $${vars.locked_price}</td></tr>` : ''}
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Network</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${vars.network}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">TX Hash</td><td style="padding: 8px 0; font-size: 12px; text-align: right;"><a href="${vars.explorer_url}" style="color: ${BRAND_BLUE}; font-family: monospace; word-break: break-all;">${vars.tx_hash}</a></td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">To Wallet</td><td style="padding: 8px 0; color: #fff; font-size: 11px; text-align: right; font-family: monospace; word-break: break-all;">${vars.wallet_address}</td></tr>
          ${vars.sender_wallet ? `<tr><td style="padding: 8px 0; color: #888; font-size: 14px;">From Wallet</td><td style="padding: 8px 0; color: #fff; font-size: 11px; text-align: right; font-family: monospace; word-break: break-all;">${vars.sender_wallet}</td></tr>` : ''}
        </table>
      </td></tr>
    </table>
    <div style="background: #0a1628; border: 1px solid #1d4ed8; border-radius: 8px; padding: 12px 16px; margin-top: 16px;">
      <p style="color: #93c5fd; font-size: 13px; margin: 0;">Status: <strong>PENDING VERIFICATION</strong> — Auto-verifying on blockchain every 5 min.</p>
    </div>
    <div style="margin-top: 16px;">
      <a href="${vars.explorer_url}" style="display: inline-block; padding: 10px 20px; background: #1d4ed8; color: #fff; font-weight: 600; font-size: 13px; text-decoration: none; border-radius: 8px; margin-right: 8px;">View on Explorer</a>
      <a href="${vars.site_url}/admin" style="display: inline-block; padding: 10px 20px; background: #fff; color: #000; font-weight: 600; font-size: 13px; text-decoration: none; border-radius: 8px;">Admin Panel</a>
    </div>
  `;
  return {
    subject: `[BullMoney] New Crypto Payment — ${vars.amount_crypto} ${vars.coin} ($${vars.amount_usd}) — ${vars.order_number}`,
    html: emailWrapper(content),
  };
}

/**
 * Customer: Payment Received — pending verification
 * Slug: crypto_payment_customer
 */
export function cryptoPaymentCustomerEmail(vars: CryptoEmailVars): { subject: string; html: string } {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 8px; color: #fff;">Payment Received</h2>
      <p style="color: #888; font-size: 14px; margin: 0;">Thank you for your purchase from BullMoney</p>
    </div>
    <div style="background: #0a1628; border: 1px solid #1d4ed8; border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
      <p style="color: #93c5fd; font-size: 13px; margin: 0 0 4px;">Order Number</p>
      <p style="color: #fff; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: 1px;">${vars.order_number}</p>
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CARD_BG}" style="background-color: ${CARD_BG}; border: 1px solid ${BORDER_COLOR}; border-radius: 12px;">
      <tr><td style="padding: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Product</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${vars.product_name} x${vars.quantity}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Total (USD)</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right; font-weight: 700;">$${vars.amount_usd}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Paid</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${vars.amount_crypto} ${vars.coin}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Network</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${vars.network}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Status</td><td style="padding: 8px 0; color: #f59e0b; font-size: 14px; text-align: right; font-weight: 600;">Pending Verification</td></tr>
        </table>
      </td></tr>
    </table>
    <div style="background: ${CARD_BG}; border: 1px solid ${BORDER_COLOR}; border-radius: 12px; padding: 16px; margin-top: 16px;">
      <p style="color: #888; font-size: 12px; margin: 0 0 6px;">Transaction Hash</p>
      <a href="${vars.explorer_url}" style="color: ${BRAND_BLUE}; font-size: 12px; font-family: monospace; word-break: break-all; text-decoration: underline;">${vars.tx_hash}</a>
    </div>
    <div style="background: #0f0f0f; border: 1px solid ${BORDER_COLOR}; border-radius: 12px; padding: 16px; margin-top: 16px;">
      <h3 style="color: #fff; font-size: 14px; margin: 0 0 8px;">What happens next?</h3>
      <ol style="color: #ccc; font-size: 13px; line-height: 2; margin: 0; padding-left: 20px;">
        <li>Our system is verifying your transaction on the blockchain</li>
        <li>You'll receive an email once payment is confirmed</li>
        <li>Your order will be processed automatically after confirmation</li>
      </ol>
    </div>
    <div style="text-align: center; margin-top: 20px;">
      <a href="${vars.explorer_url}" style="display: inline-block; padding: 12px 32px; background: #1d4ed8; color: #fff; font-weight: 600; font-size: 14px; text-decoration: none; border-radius: 10px;">Track on Blockchain</a>
    </div>
    <div style="text-align: center; margin-top: 16px;">
      <p style="color: #666; font-size: 12px; margin: 0;">Refund Policy: Crypto payments over $100 are eligible for refund within 14 days. Payments under $100 are non-refundable.</p>
    </div>
  `;
  return {
    subject: `Your BullMoney Order ${vars.order_number} — Payment Received`,
    html: emailWrapper(content, vars.customer_email),
  };
}

/**
 * Customer: Payment Confirmed — blockchain verified
 * Slug: crypto_payment_confirmed
 */
export function cryptoPaymentConfirmedEmail(vars: CryptoEmailVars): { subject: string; html: string } {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 8px; color: #22c55e;">Payment Confirmed</h2>
      <p style="color: #888; font-size: 14px; margin: 0;">Your crypto payment has been verified on the blockchain</p>
    </div>
    <div style="background: #052e16; border: 1px solid #22c55e; border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
      <p style="color: #4ade80; font-size: 13px; margin: 0 0 4px;">Order Number</p>
      <p style="color: #fff; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: 1px;">${vars.order_number}</p>
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CARD_BG}" style="background-color: ${CARD_BG}; border: 1px solid ${BORDER_COLOR}; border-radius: 12px;">
      <tr><td style="padding: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Product</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${vars.product_name}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Total</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right; font-weight: 700;">$${vars.amount_usd}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Paid</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${vars.amount_crypto} ${vars.coin}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Confirmations</td><td style="padding: 8px 0; color: #22c55e; font-size: 14px; text-align: right; font-weight: 600;">${vars.confirmations || ''}/${vars.required_confirmations || ''}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Status</td><td style="padding: 8px 0; color: #22c55e; font-size: 14px; text-align: right; font-weight: 600;">Confirmed</td></tr>
        </table>
      </td></tr>
    </table>
    <div style="background: #0f0f0f; border: 1px solid ${BORDER_COLOR}; border-radius: 12px; padding: 16px; margin-top: 16px;">
      <h3 style="color: #fff; font-size: 14px; margin: 0 0 8px;">Your order is being processed</h3>
      <p style="color: #ccc; font-size: 13px; line-height: 1.6; margin: 0;">Your payment has been verified and your order is now being processed. Digital products will be delivered shortly, and physical items will ship within 2-3 business days.</p>
    </div>
    <div style="text-align: center; margin-top: 20px;">
      <a href="${vars.explorer_url}" style="display: inline-block; padding: 12px 32px; background: #22c55e; color: #000; font-weight: 700; font-size: 14px; text-decoration: none; border-radius: 10px;">View Transaction</a>
    </div>
  `;
  return {
    subject: `BullMoney Order ${vars.order_number} — Payment Confirmed`,
    html: emailWrapper(content, vars.customer_email),
  };
}

/**
 * Customer: Payment Failed
 * Slug: crypto_payment_failed
 */
export function cryptoPaymentFailedEmail(vars: CryptoEmailVars & { reason?: string }): { subject: string; html: string } {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 8px; color: #ef4444;">Payment Could Not Be Verified</h2>
      <p style="color: #888; font-size: 14px; margin: 0;">We were unable to verify your transaction on the blockchain</p>
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CARD_BG}" style="background-color: ${CARD_BG}; border: 1px solid ${BORDER_COLOR}; border-radius: 12px;">
      <tr><td style="padding: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Order</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${vars.order_number}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Product</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${vars.product_name}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Amount</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">$${vars.amount_usd} (${vars.amount_crypto} ${vars.coin})</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">TX Hash</td><td style="padding: 8px 0; font-size: 11px; text-align: right;"><a href="${vars.explorer_url}" style="color: ${BRAND_BLUE}; font-family: monospace; word-break: break-all;">${vars.tx_hash}</a></td></tr>
        </table>
      </td></tr>
    </table>
    <div style="background: #1c0a0a; border: 1px solid #ef4444; border-radius: 12px; padding: 16px; margin-top: 16px;">
      <h3 style="color: #fca5a5; font-size: 14px; margin: 0 0 8px;">What to do next</h3>
      <ul style="color: #ccc; font-size: 13px; line-height: 2; margin: 0; padding-left: 20px;">
        <li>Verify the transaction hash is correct on the block explorer</li>
        <li>Make sure the transaction was sent to the correct wallet address</li>
        <li>If this is an error, contact support with your order number</li>
      </ul>
    </div>
    <div style="text-align: center; margin-top: 20px;">
      <a href="mailto:officialbullmoneywebsite@gmail.com?subject=Payment%20Issue%20${vars.order_number}" style="display: inline-block; padding: 12px 32px; background: #fff; color: #000; font-weight: 700; font-size: 14px; text-decoration: none; border-radius: 10px;">Contact Support</a>
    </div>
  `;
  return {
    subject: `BullMoney Order ${vars.order_number} — Payment Issue`,
    html: emailWrapper(content, vars.customer_email),
  };
}

/**
 * Customer: Refund Processed
 * Slug: crypto_refund_processed
 */
export function cryptoRefundProcessedEmail(vars: CryptoEmailVars): { subject: string; html: string } {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 8px; color: #22c55e;">Refund Completed</h2>
      <p style="color: #888; font-size: 14px; margin: 0;">Your refund has been sent to your crypto wallet</p>
    </div>
    <div style="background: #052e16; border: 1px solid #22c55e; border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
      <p style="color: #4ade80; font-size: 13px; margin: 0 0 4px;">Refunded Amount</p>
      <p style="color: #fff; font-size: 22px; font-weight: 700; margin: 0;">$${vars.refund_amount_usd || vars.amount_usd}</p>
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CARD_BG}" style="background-color: ${CARD_BG}; border: 1px solid ${BORDER_COLOR}; border-radius: 12px;">
      <tr><td style="padding: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Order</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${vars.order_number}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Refund TX</td><td style="padding: 8px 0; font-size: 11px; text-align: right; font-family: monospace; word-break: break-all; color: ${BRAND_BLUE};">${vars.refund_tx_hash || 'N/A'}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Coin</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${vars.coin}</td></tr>
          ${vars.refund_reason ? `<tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Reason</td><td style="padding: 8px 0; color: #ccc; font-size: 14px; text-align: right;">${vars.refund_reason}</td></tr>` : ''}
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Status</td><td style="padding: 8px 0; color: #22c55e; font-size: 14px; text-align: right; font-weight: 600;">Completed</td></tr>
        </table>
      </td></tr>
    </table>
    <p style="color: #ccc; font-size: 13px; text-align: center; margin-top: 16px;">The refund transaction may take a few minutes to appear in your wallet depending on the blockchain network.</p>
  `;
  return {
    subject: `BullMoney Order ${vars.order_number} — Refund Processed`,
    html: emailWrapper(content, vars.customer_email),
  };
}

/**
 * Customer: Refund Denied
 * Slug: crypto_refund_denied
 */
export function cryptoRefundDeniedEmail(vars: CryptoEmailVars & { denial_reason?: string }): { subject: string; html: string } {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 8px; color: #ef4444;">Refund Request Not Eligible</h2>
      <p style="color: #888; font-size: 14px; margin: 0;">Your refund request could not be processed</p>
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CARD_BG}" style="background-color: ${CARD_BG}; border: 1px solid ${BORDER_COLOR}; border-radius: 12px;">
      <tr><td style="padding: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Order</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${vars.order_number}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Amount</td><td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">$${vars.amount_usd}</td></tr>
          <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Status</td><td style="padding: 8px 0; color: #ef4444; font-size: 14px; text-align: right; font-weight: 600;">Denied</td></tr>
        </table>
      </td></tr>
    </table>
    <div style="background: #1c0a0a; border: 1px solid #ef4444; border-radius: 12px; padding: 16px; margin-top: 16px;">
      <p style="color: #fca5a5; font-size: 13px; margin: 0;"><strong>Reason:</strong> ${vars.denial_reason || 'Does not meet refund policy requirements'}</p>
    </div>
    <div style="background: #0f0f0f; border: 1px solid ${BORDER_COLOR}; border-radius: 12px; padding: 16px; margin-top: 16px;">
      <h3 style="color: #fff; font-size: 14px; margin: 0 0 8px;">Refund Policy</h3>
      <ul style="color: #ccc; font-size: 13px; line-height: 2; margin: 0; padding-left: 20px;">
        <li>Crypto payments under $100 are <strong>non-refundable</strong> due to blockchain transaction fees</li>
        <li>Refunds must be requested within 14 days of payment confirmation</li>
        <li>Refunds are processed in the original cryptocurrency at the current market rate</li>
      </ul>
    </div>
    <div style="text-align: center; margin-top: 20px;">
      <a href="mailto:officialbullmoneywebsite@gmail.com?subject=Refund%20Question%20${vars.order_number}" style="display: inline-block; padding: 12px 32px; background: #222; color: #fff; font-weight: 700; font-size: 14px; text-decoration: none; border-radius: 10px;">Contact Support</a>
    </div>
  `;
  return {
    subject: `BullMoney Order ${vars.order_number} — Refund Request Update`,
    html: emailWrapper(content, vars.customer_email),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================
export const EmailTemplates = {
  welcome: welcomeEmail,
  grandLaunch: grandLaunchEmail,
  storePromo: storePromoEmail,
  vipPromo: vipPromoEmail,
  newProduct: newProductEmail,
  flashSale: flashSaleEmail,
  affiliatePromo: affiliatePromoEmail,
  weeklyDigest: weeklyDigestEmail,
  // Crypto payment templates
  cryptoPaymentAdmin: cryptoPaymentAdminEmail,
  cryptoPaymentCustomer: cryptoPaymentCustomerEmail,
  cryptoPaymentConfirmed: cryptoPaymentConfirmedEmail,
  cryptoPaymentFailed: cryptoPaymentFailedEmail,
  cryptoRefundProcessed: cryptoRefundProcessedEmail,
  cryptoRefundDenied: cryptoRefundDeniedEmail,
};

export default EmailTemplates;
