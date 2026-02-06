// ============================================================================
// DRIP EMAIL SEQUENCES
// Email templates for automated drip campaigns (15-email 30-day sequence)
// ============================================================================

export const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://bullmoney.shop';
export const STORE_URL = `${SITE_URL}/store`;
export const VIP_URL = `${SITE_URL}/VIP`;
export const COURSE_URL = `${SITE_URL}/course`;
export const AFFILIATE_URL = `${SITE_URL}/recruit`;

const BRAND_BLUE = '#3b82f6';
const LINK_STYLE = `color: ${BRAND_BLUE}; text-decoration: underline; font-weight: 600;`;

// CIDs for inline images
export const EMAIL_LOGO_CID = 'bullmoney-logo';
export const EMAIL_FOOTER_LOGO_CID = 'bullmoney-footer';

// ============================================================================
// EMAIL WRAPPER
// ============================================================================
function emailWrapper(content: string, unsubscribeEmail: string): string {
  const unsubscribeUrl = `${SITE_URL}/api/store/unsubscribe?email=${encodeURIComponent(unsubscribeEmail)}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bullmoney</title>
  <style>
    body { background-color: #000000 !important; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #000000;">
          <tr>
            <td style="padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <img src="cid:${EMAIL_LOGO_CID}" alt="Bullmoney" width="60" height="60" style="border-radius: 16px;" />
                <div style="margin-top: 8px; font-size: 20px; font-weight: 700; color: #ffffff;">BULLMONEY</div>
              </div>
              ${content}
              <div style="text-align: center; margin-top: 32px; padding: 20px; background: #0a0a0a; border-radius: 12px;">
                <a href="${STORE_URL}" style="color: ${BRAND_BLUE}; margin: 0 12px;">Store</a>
                <a href="${VIP_URL}" style="color: ${BRAND_BLUE}; margin: 0 12px;">VIP</a>
                <a href="${COURSE_URL}" style="color: ${BRAND_BLUE}; margin: 0 12px;">Course</a>
                <a href="${AFFILIATE_URL}" style="color: ${BRAND_BLUE}; margin: 0 12px;">Earn</a>
              </div>
              <div style="text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px solid #222;">
                <img src="cid:${EMAIL_FOOTER_LOGO_CID}" alt="Bullmoney" width="120" style="max-width: 120px;" />
                <p style="color: #666; font-size: 12px; margin: 16px 0 8px 0;">© ${new Date().getFullYear()} Bullmoney</p>
                <a href="${unsubscribeUrl}" style="color: #666; font-size: 12px;">Unsubscribe</a>
              </div>
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
// STORE REMINDER 30-DAY CAMPAIGN (15 emails over 30 days)
// ============================================================================
const storeReminder30DayEmails: { subject: string; getContent: (firstName: string) => string }[] = [
  // Email 1: Welcome + Store Introduction
  {
    subject: "Welcome to Bullmoney - Your Trading Journey Starts Here",
    getContent: (firstName) => `
      <div style="background: linear-gradient(135deg, #111, #1a1a1a); border: 1px solid #222; border-radius: 20px; padding: 40px; text-align: center;">
        <h1 style="color: ${BRAND_BLUE}; margin: 0 0 16px 0; font-size: 28px;">Welcome, ${firstName}!</h1>
        <p style="color: #e0e0e0; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
          You're now part of the Bullmoney community. We're here to help you become a better trader.
        </p>
        <p style="color: #ccc; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
          Check out our store for exclusive trading gear and merchandise designed for traders like you.
        </p>
        <a href="${STORE_URL}" style="display: inline-block; background: linear-gradient(135deg, ${BRAND_BLUE}, #1d4ed8); color: #fff; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; text-decoration: none;">
          Visit The Store
        </a>
      </div>
    `,
  },
  // Email 2: VIP Signal Service
  {
    subject: "Get Live Trading Signals - VIP Access",
    getContent: (firstName) => `
      <div style="background: linear-gradient(135deg, #111, #1a1a1a); border: 1px solid #222; border-radius: 20px; padding: 40px; text-align: center;">
        <h1 style="color: ${BRAND_BLUE}; margin: 0 0 16px 0; font-size: 28px;">Trade With Confidence, ${firstName}</h1>
        <p style="color: #e0e0e0; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
          Our VIP members get real-time trading signals with entry, take profit, and stop loss levels.
        </p>
        <div style="background: #0a0a0a; border-radius: 16px; padding: 24px; margin-bottom: 24px; text-align: left;">
          <p style="color: #fff; font-size: 15px; margin: 8px 0;"><strong style="color: ${BRAND_BLUE};">✓</strong> Live signals via Telegram</p>
          <p style="color: #fff; font-size: 15px; margin: 8px 0;"><strong style="color: ${BRAND_BLUE};">✓</strong> Daily market analysis</p>
          <p style="color: #fff; font-size: 15px; margin: 8px 0;"><strong style="color: ${BRAND_BLUE};">✓</strong> Entry, TP & SL levels</p>
          <p style="color: #fff; font-size: 15px; margin: 8px 0;"><strong style="color: ${BRAND_BLUE};">✓</strong> Starting at just $49/month</p>
        </div>
        <a href="${VIP_URL}" style="display: inline-block; background: linear-gradient(135deg, ${BRAND_BLUE}, #1d4ed8); color: #fff; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; text-decoration: none;">
          Join VIP Today
        </a>
      </div>
    `,
  },
  // Email 3: Premium Hoodie Feature
  {
    subject: "Rep Bullmoney - Premium Hoodies Now Available",
    getContent: (firstName) => `
      <div style="background: linear-gradient(135deg, #111, #1a1a1a); border: 1px solid #222; border-radius: 20px; padding: 40px; text-align: center;">
        <h1 style="color: ${BRAND_BLUE}; margin: 0 0 16px 0; font-size: 28px;">Look Like a Trader, ${firstName}</h1>
        <p style="color: #e0e0e0; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
          Our premium hoodies are made for traders who move markets. Premium quality, timeless design.
        </p>
        <div style="background: #0a0a0a; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
          <p style="color: #888; font-size: 14px; text-decoration: line-through; margin: 0 0 8px 0;">$89.99</p>
          <p style="color: ${BRAND_BLUE}; font-size: 32px; font-weight: 700; margin: 0;">$29.99</p>
          <p style="color: #22c55e; font-size: 14px; margin: 8px 0 0 0;">Save 66%</p>
        </div>
        <a href="${STORE_URL}?product=hoodie" style="display: inline-block; background: linear-gradient(135deg, ${BRAND_BLUE}, #1d4ed8); color: #fff; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; text-decoration: none;">
          Get Your Hoodie
        </a>
      </div>
    `,
  },
  // Email 4: Trading Course
  {
    subject: "Master Trading - Complete Course Available",
    getContent: (firstName) => `
      <div style="background: linear-gradient(135deg, #111, #1a1a1a); border: 1px solid #222; border-radius: 20px; padding: 40px; text-align: center;">
        <h1 style="color: ${BRAND_BLUE}; margin: 0 0 16px 0; font-size: 28px;">Learn To Trade, ${firstName}</h1>
        <p style="color: #e0e0e0; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
          From beginner to pro - our complete trading course covers everything you need to know.
        </p>
        <div style="background: #0a0a0a; border-radius: 16px; padding: 24px; margin-bottom: 24px; text-align: left;">
          <p style="color: #fff; font-size: 15px; margin: 8px 0;"><strong style="color: ${BRAND_BLUE};">✓</strong> 50+ Video Lessons</p>
          <p style="color: #fff; font-size: 15px; margin: 8px 0;"><strong style="color: ${BRAND_BLUE};">✓</strong> Technical Analysis Mastery</p>
          <p style="color: #fff; font-size: 15px; margin: 8px 0;"><strong style="color: ${BRAND_BLUE};">✓</strong> Risk Management Strategies</p>
          <p style="color: #fff; font-size: 15px; margin: 8px 0;"><strong style="color: ${BRAND_BLUE};">✓</strong> Lifetime Access - $199</p>
        </div>
        <a href="${COURSE_URL}" style="display: inline-block; background: linear-gradient(135deg, ${BRAND_BLUE}, #1d4ed8); color: #fff; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; text-decoration: none;">
          Start Learning
        </a>
      </div>
    `,
  },
  // Email 5: Affiliate Program
  {
    subject: "Earn While You Trade - 20% Commission",
    getContent: (firstName) => `
      <div style="background: linear-gradient(135deg, #111, #1a1a1a); border: 1px solid #222; border-radius: 20px; padding: 40px; text-align: center;">
        <h1 style="color: ${BRAND_BLUE}; margin: 0 0 16px 0; font-size: 28px;">Earn Money, ${firstName}</h1>
        <p style="color: #e0e0e0; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
          Share Bullmoney with your friends and earn 20% commission on every sale they make.
        </p>
        <div style="background: #0a0a0a; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
          <p style="color: ${BRAND_BLUE}; font-size: 48px; font-weight: 700; margin: 0;">20%</p>
          <p style="color: #888; font-size: 16px; margin: 8px 0 0 0;">Commission on every referral</p>
        </div>
        <a href="${AFFILIATE_URL}" style="display: inline-block; background: linear-gradient(135deg, ${BRAND_BLUE}, #1d4ed8); color: #fff; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; text-decoration: none;">
          Start Earning
        </a>
      </div>
    `,
  },
  // Email 6: Snapback Cap Feature
  {
    subject: "Trader's Essential - Bullmoney Snapback",
    getContent: (firstName) => `
      <div style="background: linear-gradient(135deg, #111, #1a1a1a); border: 1px solid #222; border-radius: 20px; padding: 40px; text-align: center;">
        <h1 style="color: ${BRAND_BLUE}; margin: 0 0 16px 0; font-size: 28px;">Complete Your Look, ${firstName}</h1>
        <p style="color: #e0e0e0; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
          The Bullmoney Snapback - premium quality for traders who stand out.
        </p>
        <div style="background: #0a0a0a; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
          <p style="color: #888; font-size: 14px; text-decoration: line-through; margin: 0 0 8px 0;">$34.99</p>
          <p style="color: ${BRAND_BLUE}; font-size: 32px; font-weight: 700; margin: 0;">$14.99</p>
        </div>
        <a href="${STORE_URL}?product=cap" style="display: inline-block; background: linear-gradient(135deg, ${BRAND_BLUE}, #1d4ed8); color: #fff; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; text-decoration: none;">
          Get Your Cap
        </a>
      </div>
    `,
  },
  // Email 7: Live Streams Reminder
  {
    subject: "Free Daily Analysis - Join Our Live Streams",
    getContent: (firstName) => `
      <div style="background: linear-gradient(135deg, #111, #1a1a1a); border: 1px solid #222; border-radius: 20px; padding: 40px; text-align: center;">
        <h1 style="color: ${BRAND_BLUE}; margin: 0 0 16px 0; font-size: 28px;">Trade Live With Us, ${firstName}</h1>
        <p style="color: #e0e0e0; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
          Join our free daily live streams on YouTube for real-time market analysis and trading insights.
        </p>
        <div style="background: #0a0a0a; border-radius: 16px; padding: 24px; margin-bottom: 24px; text-align: left;">
          <p style="color: #fff; font-size: 15px; margin: 8px 0;"><strong style="color: ${BRAND_BLUE};">📺</strong> Daily live market analysis</p>
          <p style="color: #fff; font-size: 15px; margin: 8px 0;"><strong style="color: ${BRAND_BLUE};">💬</strong> Q&A with the community</p>
          <p style="color: #fff; font-size: 15px; margin: 8px 0;"><strong style="color: ${BRAND_BLUE};">📈</strong> Real-time trade ideas</p>
        </div>
        <a href="${SITE_URL}/socials" style="display: inline-block; background: linear-gradient(135deg, ${BRAND_BLUE}, #1d4ed8); color: #fff; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; text-decoration: none;">
          Watch Now
        </a>
      </div>
    `,
  },
  // Email 8: T-Shirt Feature
  {
    subject: "Classic Style - Bullmoney T-Shirts",
    getContent: (firstName) => `
      <div style="background: linear-gradient(135deg, #111, #1a1a1a); border: 1px solid #222; border-radius: 20px; padding: 40px; text-align: center;">
        <h1 style="color: ${BRAND_BLUE}; margin: 0 0 16px 0; font-size: 28px;">Wear Your Success, ${firstName}</h1>
        <p style="color: #e0e0e0; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
          Premium cotton t-shirts with the Bullmoney logo. Comfort meets style.
        </p>
        <div style="background: #0a0a0a; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
          <p style="color: #888; font-size: 14px; text-decoration: line-through; margin: 0 0 8px 0;">$39.99</p>
          <p style="color: ${BRAND_BLUE}; font-size: 32px; font-weight: 700; margin: 0;">$19.99</p>
        </div>
        <a href="${STORE_URL}?product=tshirt" style="display: inline-block; background: linear-gradient(135deg, ${BRAND_BLUE}, #1d4ed8); color: #fff; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; text-decoration: none;">
          Shop T-Shirts
        </a>
      </div>
    `,
  },
  // Email 9: VIP Success Stories
  {
    subject: "See What VIP Members Are Saying",
    getContent: (firstName) => `
      <div style="background: linear-gradient(135deg, #111, #1a1a1a); border: 1px solid #222; border-radius: 20px; padding: 40px; text-align: center;">
        <h1 style="color: ${BRAND_BLUE}; margin: 0 0 16px 0; font-size: 28px;">Real Results, ${firstName}</h1>
        <p style="color: #e0e0e0; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
          See how our VIP members are transforming their trading.
        </p>
        <div style="background: #0a0a0a; border-radius: 16px; padding: 24px; margin-bottom: 24px; text-align: left;">
          <p style="color: #fff; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0; font-style: italic;">
            "The signals have completely changed my trading. Made back my subscription in the first week!"
          </p>
          <p style="color: #888; font-size: 14px; margin: 0;">- VIP Member</p>
        </div>
        <a href="${VIP_URL}" style="display: inline-block; background: linear-gradient(135deg, ${BRAND_BLUE}, #1d4ed8); color: #fff; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; text-decoration: none;">
          Join VIP
        </a>
      </div>
    `,
  },
  // Email 10: Bundle Deal
  {
    subject: "Exclusive Bundle - Save 40%",
    getContent: (firstName) => `
      <div style="background: linear-gradient(135deg, #111, #1a1a1a); border: 1px solid #222; border-radius: 20px; padding: 40px; text-align: center;">
        <h1 style="color: ${BRAND_BLUE}; margin: 0 0 16px 0; font-size: 28px;">Special Bundle Deal, ${firstName}</h1>
        <p style="color: #e0e0e0; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
          Get the hoodie + cap + t-shirt bundle and save 40%.
        </p>
        <div style="background: #0a0a0a; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
          <p style="color: #888; font-size: 14px; margin: 0 0 8px 0;">Hoodie + Cap + T-Shirt</p>
          <p style="color: #888; font-size: 14px; text-decoration: line-through; margin: 0 0 8px 0;">$64.97</p>
          <p style="color: ${BRAND_BLUE}; font-size: 32px; font-weight: 700; margin: 0;">$38.99</p>
        </div>
        <a href="${STORE_URL}" style="display: inline-block; background: linear-gradient(135deg, ${BRAND_BLUE}, #1d4ed8); color: #fff; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; text-decoration: none;">
          Get The Bundle
        </a>
      </div>
    `,
  },
  // Email 11: Tumbler Feature
  {
    subject: "Stay Hydrated While Trading",
    getContent: (firstName) => `
      <div style="background: linear-gradient(135deg, #111, #1a1a1a); border: 1px solid #222; border-radius: 20px; padding: 40px; text-align: center;">
        <h1 style="color: ${BRAND_BLUE}; margin: 0 0 16px 0; font-size: 28px;">Desk Essential, ${firstName}</h1>
        <p style="color: #e0e0e0; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
          The Bullmoney Tumbler - keep your drinks at the perfect temperature during long trading sessions.
        </p>
        <div style="background: #0a0a0a; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
          <p style="color: #888; font-size: 14px; text-decoration: line-through; margin: 0 0 8px 0;">$34.99</p>
          <p style="color: ${BRAND_BLUE}; font-size: 32px; font-weight: 700; margin: 0;">$12.99</p>
        </div>
        <a href="${STORE_URL}?product=tumbler" style="display: inline-block; background: linear-gradient(135deg, ${BRAND_BLUE}, #1d4ed8); color: #fff; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; text-decoration: none;">
          Get Your Tumbler
        </a>
      </div>
    `,
  },
  // Email 12: Course Module Preview
  {
    subject: "Free Preview - Trading Course Sample",
    getContent: (firstName) => `
      <div style="background: linear-gradient(135deg, #111, #1a1a1a); border: 1px solid #222; border-radius: 20px; padding: 40px; text-align: center;">
        <h1 style="color: ${BRAND_BLUE}; margin: 0 0 16px 0; font-size: 28px;">Try Before You Buy, ${firstName}</h1>
        <p style="color: #e0e0e0; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
          Get a free preview of our complete trading course. See what you'll learn.
        </p>
        <div style="background: #0a0a0a; border-radius: 16px; padding: 24px; margin-bottom: 24px; text-align: left;">
          <p style="color: #fff; font-size: 15px; margin: 8px 0;"><strong>Module 1:</strong> Trading Basics & Market Structure</p>
          <p style="color: #fff; font-size: 15px; margin: 8px 0;"><strong>Module 2:</strong> Technical Analysis Fundamentals</p>
          <p style="color: #fff; font-size: 15px; margin: 8px 0;"><strong>Module 3:</strong> Risk Management Essentials</p>
          <p style="color: #888; font-size: 14px; margin: 16px 0 0 0;">+ 7 more advanced modules</p>
        </div>
        <a href="${COURSE_URL}" style="display: inline-block; background: linear-gradient(135deg, ${BRAND_BLUE}, #1d4ed8); color: #fff; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; text-decoration: none;">
          Preview Course
        </a>
      </div>
    `,
  },
  // Email 13: Social Proof
  {
    subject: "Join 1000+ Traders In The Community",
    getContent: (firstName) => `
      <div style="background: linear-gradient(135deg, #111, #1a1a1a); border: 1px solid #222; border-radius: 20px; padding: 40px; text-align: center;">
        <h1 style="color: ${BRAND_BLUE}; margin: 0 0 16px 0; font-size: 28px;">${firstName}, You're Not Alone</h1>
        <p style="color: #e0e0e0; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
          Over 1000 traders trust Bullmoney for their trading education and signals.
        </p>
        <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 24px;">
          <div style="background: #0a0a0a; border-radius: 12px; padding: 20px; text-align: center;">
            <p style="color: ${BRAND_BLUE}; font-size: 28px; font-weight: 700; margin: 0;">1000+</p>
            <p style="color: #888; font-size: 12px; margin: 4px 0 0 0;">Members</p>
          </div>
          <div style="background: #0a0a0a; border-radius: 12px; padding: 20px; text-align: center;">
            <p style="color: ${BRAND_BLUE}; font-size: 28px; font-weight: 700; margin: 0;">85%</p>
            <p style="color: #888; font-size: 12px; margin: 4px 0 0 0;">Win Rate</p>
          </div>
        </div>
        <a href="${SITE_URL}" style="display: inline-block; background: linear-gradient(135deg, ${BRAND_BLUE}, #1d4ed8); color: #fff; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; text-decoration: none;">
          Join The Community
        </a>
      </div>
    `,
  },
  // Email 14: Limited Time Offer
  {
    subject: "48 Hours Only - Exclusive Discount Inside",
    getContent: (firstName) => `
      <div style="background: linear-gradient(135deg, #111, #1a1a1a); border: 1px solid #222; border-radius: 20px; padding: 40px; text-align: center;">
        <h1 style="color: #ef4444; margin: 0 0 16px 0; font-size: 28px;">Limited Time, ${firstName}</h1>
        <p style="color: #e0e0e0; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
          For the next 48 hours, get 25% off everything in the store. Don't miss out!
        </p>
        <div style="background: linear-gradient(135deg, #7f1d1d, #991b1b); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
          <p style="color: #fff; font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">USE CODE AT CHECKOUT:</p>
          <p style="color: #fff; font-size: 32px; font-weight: 700; margin: 0; letter-spacing: 4px;">BULL25</p>
        </div>
        <a href="${STORE_URL}" style="display: inline-block; background: linear-gradient(135deg, ${BRAND_BLUE}, #1d4ed8); color: #fff; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; text-decoration: none;">
          Shop Now
        </a>
      </div>
    `,
  },
  // Email 15: Final Reminder
  {
    subject: "We Miss You - Come Back To Bullmoney",
    getContent: (firstName) => `
      <div style="background: linear-gradient(135deg, #111, #1a1a1a); border: 1px solid #222; border-radius: 20px; padding: 40px; text-align: center;">
        <h1 style="color: ${BRAND_BLUE}; margin: 0 0 16px 0; font-size: 28px;">Hey ${firstName}, We Miss You!</h1>
        <p style="color: #e0e0e0; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
          It's been a while since you visited. We've got new products, signals, and content waiting for you.
        </p>
        <div style="background: #0a0a0a; border-radius: 16px; padding: 24px; margin-bottom: 24px; text-align: left;">
          <p style="color: #fff; font-size: 15px; margin: 8px 0;"><strong style="color: ${BRAND_BLUE};">🛒</strong> <a href="${STORE_URL}" style="${LINK_STYLE}">New arrivals in the store</a></p>
          <p style="color: #fff; font-size: 15px; margin: 8px 0;"><strong style="color: ${BRAND_BLUE};">📊</strong> <a href="${VIP_URL}" style="${LINK_STYLE}">Fresh VIP signals daily</a></p>
          <p style="color: #fff; font-size: 15px; margin: 8px 0;"><strong style="color: ${BRAND_BLUE};">📚</strong> <a href="${COURSE_URL}" style="${LINK_STYLE}">Updated course content</a></p>
          <p style="color: #fff; font-size: 15px; margin: 8px 0;"><strong style="color: ${BRAND_BLUE};">💰</strong> <a href="${AFFILIATE_URL}" style="${LINK_STYLE}">Earn with referrals</a></p>
        </div>
        <a href="${SITE_URL}" style="display: inline-block; background: linear-gradient(135deg, ${BRAND_BLUE}, #1d4ed8); color: #fff; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; text-decoration: none;">
          Come Back
        </a>
      </div>
    `,
  },
];

// ============================================================================
// GET DRIP EMAIL BY SEQUENCE
// ============================================================================
export function getDripEmailBySequence(
  campaignName: string,
  sequenceNumber: number,
  firstName: string,
  email: string
): { subject: string; html: string } | null {
  let emails: typeof storeReminder30DayEmails | null = null;
  
  switch (campaignName) {
    case 'store_reminder_30day':
      emails = storeReminder30DayEmails;
      break;
    default:
      return null;
  }
  
  if (!emails || sequenceNumber >= emails.length) {
    return null;
  }
  
  const template = emails[sequenceNumber];
  return {
    subject: template.subject,
    html: emailWrapper(template.getContent(firstName), email),
  };
}

// ============================================================================
// GET ALL DRIP CAMPAIGNS
// ============================================================================
export function getAvailableDripCampaigns(): string[] {
  return ['store_reminder_30day'];
}

export function getDripCampaignInfo(campaignName: string): { name: string; totalEmails: number; intervalDays: number } | null {
  switch (campaignName) {
    case 'store_reminder_30day':
      return { name: 'Store Reminder (30 Day)', totalEmails: 15, intervalDays: 2 };
    default:
      return null;
  }
}
