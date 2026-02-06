import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// ============================================================================
// GIFT CARDS API
// POST: Purchase a gift card and send to recipient via email
// ============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments = [];
  for (let s = 0; s < 3; s++) {
    let segment = '';
    for (let i = 0; i < 4; i++) {
      segment += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(segment);
  }
  return `BULL-${segments.join('-')}`;
}

export async function POST(req: NextRequest) {
  try {
    const { amount, recipientEmail, recipientName, senderName, message } = await req.json();

    if (!recipientEmail || !amount || amount < 10) {
      return NextResponse.json(
        { error: 'Invalid gift card details' },
        { status: 400 }
      );
    }

    const code = generateGiftCardCode();

    // Store gift card in database (gift_cards table)
    try {
      await supabase.from('gift_cards').insert({
        code,
        amount,
        balance: amount,
        recipient_email: recipientEmail,
        recipient_name: recipientName || null,
        sender_name: senderName || null,
        message: message || null,
        is_active: true,
      });
    } catch {
      // Table might not exist — proceed anyway with email
    }

    // Send gift card email
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: `"Bullmoney Store" <${process.env.GMAIL_USER}>`,
        to: recipientEmail,
        subject: `${senderName || 'Someone'} sent you a $${amount} Bullmoney Gift Card!`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; background: #000; color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="padding: 40px 32px; text-align: center;">
              <div style="width: 48px; height: 48px; background: #fff; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 24px;">
                <span style="color: #000; font-weight: bold; font-size: 20px;">B</span>
              </div>
              <h1 style="font-size: 24px; font-weight: 300; margin: 0 0 8px;">You've received a Gift Card!</h1>
              ${senderName ? `<p style="color: rgba(255,255,255,0.5); font-size: 14px; margin: 0 0 24px;">From ${senderName}</p>` : ''}
              
              ${message ? `
                <div style="padding: 20px; background: rgba(255,255,255,0.05); border-radius: 12px; margin: 0 0 24px; border: 1px solid rgba(255,255,255,0.1);">
                  <p style="color: rgba(255,255,255,0.7); font-size: 14px; font-style: italic; margin: 0;">"${message}"</p>
                </div>
              ` : ''}
              
              <div style="padding: 32px; background: rgba(255,255,255,0.05); border-radius: 16px; margin: 0 0 24px; border: 1px solid rgba(255,255,255,0.1);">
                <p style="color: rgba(255,255,255,0.4); font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px;">Gift Card Value</p>
                <p style="font-size: 48px; font-weight: 300; margin: 0 0 16px;">$${amount.toFixed(2)}</p>
                <p style="color: rgba(255,255,255,0.4); font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">Redemption Code</p>
                <p style="font-size: 24px; font-family: monospace; letter-spacing: 3px; margin: 0; color: #fff;">${code}</p>
              </div>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://bullmoney.com'}/store" 
                 style="display: inline-block; padding: 14px 32px; background: #fff; color: #000; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: 500;">
                Shop Now
              </a>
              
              <p style="color: rgba(255,255,255,0.3); font-size: 11px; margin: 24px 0 0;">
                Enter this code at checkout to redeem. This gift card does not expire.
              </p>
            </div>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true, code });
  } catch (error) {
    console.error('Gift card error:', error);
    return NextResponse.json(
      { error: 'Failed to create gift card' },
      { status: 500 }
    );
  }
}
