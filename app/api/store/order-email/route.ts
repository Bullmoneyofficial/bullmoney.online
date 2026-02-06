import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// ORDER CONFIRMATION EMAIL API - Sends via Gmail SMTP
// Uses GMAIL_USER and GMAIL_APP_PASSWORD from .env.local
// Now loads templates from email_templates table (admin-editable)
// Falls back to hardcoded template if DB fetch fails
// ============================================================================

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Map email type to template slug
const TYPE_TO_SLUG: Record<string, string> = {
  confirmation: 'order_confirmation',
  shipped: 'order_shipped',
  delivered: 'order_delivered',
};

// Fetch template from DB and replace {{variables}}
async function getTemplateFromDB(
  type: string,
  variables: Record<string, string>
): Promise<{ subject: string; html: string } | null> {
  try {
    const slug = TYPE_TO_SLUG[type];
    if (!slug) return null;

    const { data, error } = await supabase
      .from('email_templates')
      .select('subject, html_body')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;

    let subject = data.subject;
    let html = data.html_body;

    // Replace all {{variable}} placeholders
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      subject = subject.replace(regex, value);
      html = html.replace(regex, value);
    });

    return { subject, html };
  } catch {
    return null;
  }
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
  options?: string;
}

interface OrderEmailData {
  to: string;
  customerName: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  shippingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  type: 'confirmation' | 'shipped' | 'delivered';
  trackingNumber?: string;
  trackingUrl?: string;
}

function generateOrderConfirmationHtml(data: OrderEmailData): string {
  const itemRows = data.items.map((item) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div>
            <p style="margin: 0; color: #ffffff; font-weight: 500;">${item.name}</p>
            ${item.options ? `<p style="margin: 4px 0 0; color: #888; font-size: 13px;">${item.options}</p>` : ''}
            <p style="margin: 4px 0 0; color: #888; font-size: 13px;">Qty: ${item.quantity}</p>
          </div>
        </div>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; text-align: right; color: #ffffff;">
        $${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');

  const subjectMap = {
    confirmation: 'Order Confirmed',
    shipped: 'Order Shipped',
    delivered: 'Order Delivered',
  };
  
  const headerMap = {
    confirmation: '🎉 Order Confirmed!',
    shipped: '📦 Your Order Has Shipped!',
    delivered: '✅ Order Delivered!',
  };
  
  const messageMap = {
    confirmation: 'Thank you for your purchase! Your order has been confirmed and is being processed.',
    shipped: `Your order is on its way!${data.trackingNumber ? ` Tracking: ${data.trackingNumber}` : ''}`,
    delivered: 'Your order has been delivered. We hope you love your purchase!',
  };

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 4px;">BULLMONEY</h1>
      <p style="color: #666; font-size: 12px; letter-spacing: 2px; margin: 0;">PREMIUM TRADING LIFESTYLE</p>
    </div>
    
    <!-- Main Card -->
    <div style="background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 16px; padding: 32px; margin-bottom: 24px;">
      <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 8px; text-align: center;">
        ${headerMap[data.type]}
      </h2>
      <p style="color: #888; text-align: center; margin: 0 0 24px; font-size: 15px;">
        ${messageMap[data.type]}
      </p>
      
      ${data.customerName ? `<p style="color: #ccc; margin: 0 0 24px;">Hi ${data.customerName},</p>` : ''}
      
      <!-- Order Number -->
      <div style="background: #111; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
        <p style="color: #666; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">Order Number</p>
        <p style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0; font-family: monospace;">${data.orderNumber}</p>
      </div>
      
      ${data.trackingNumber && data.type !== 'confirmation' ? `
      <div style="background: #111; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
        <p style="color: #666; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">Tracking Number</p>
        <p style="color: #ffffff; font-size: 16px; margin: 0;">
          ${data.trackingUrl ? `<a href="${data.trackingUrl}" style="color: #3b82f6; text-decoration: none;">${data.trackingNumber}</a>` : data.trackingNumber}
        </p>
      </div>
      ` : ''}
      
      <!-- Items -->
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 8px 0; border-bottom: 1px solid #1a1a1a; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Item</th>
            <th style="text-align: right; padding: 8px 0; border-bottom: 1px solid #1a1a1a; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
      
      <!-- Totals -->
      <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #1a1a1a;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #888;">Subtotal</span>
          <span style="color: #ccc;">$${data.subtotal.toFixed(2)}</span>
        </div>
        ${data.discount > 0 ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #22c55e;">Discount</span>
          <span style="color: #22c55e;">-$${data.discount.toFixed(2)}</span>
        </div>` : ''}
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #888;">Shipping</span>
          <span style="color: #ccc;">${data.shipping === 0 ? 'Free' : `$${data.shipping.toFixed(2)}`}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
          <span style="color: #888;">Tax</span>
          <span style="color: #ccc;">$${data.tax.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 1px solid #1a1a1a;">
          <span style="color: #ffffff; font-weight: 600; font-size: 18px;">Total</span>
          <span style="color: #ffffff; font-weight: 600; font-size: 18px;">$${data.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
    
    ${data.shippingAddress ? `
    <!-- Shipping Address -->
    <div style="background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
      <h3 style="color: #ffffff; font-size: 16px; margin: 0 0 12px;">Shipping Address</h3>
      <p style="color: #888; margin: 0; line-height: 1.6;">
        ${data.shippingAddress.line1}<br>
        ${data.shippingAddress.line2 ? `${data.shippingAddress.line2}<br>` : ''}
        ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postal_code}<br>
        ${data.shippingAddress.country}
      </p>
    </div>
    ` : ''}
    
    <!-- CTA -->
    <div style="text-align: center; margin-bottom: 32px;">
      <a href="https://bullmoney.com/store" 
         style="display: inline-block; background: #ffffff; color: #000000; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px;">
        Continue Shopping
      </a>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding-top: 24px; border-top: 1px solid #1a1a1a;">
      <p style="color: #444; font-size: 12px; margin: 0 0 8px;">
        Questions? Contact us at <a href="mailto:support@bullmoney.com" style="color: #3b82f6;">support@bullmoney.com</a>
      </p>
      <p style="color: #333; font-size: 11px; margin: 0;">
        © ${new Date().getFullYear()} Bullmoney. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const data: OrderEmailData = await request.json();

    if (!data.to || !data.orderNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('[Order Email] GMAIL_USER or GMAIL_APP_PASSWORD not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    // Build template variables from order data
    const itemRows = data.items.map((item) => `
      <tr><td style="padding:12px 0;border-bottom:1px solid #1a1a1a;">
        <p style="margin:0;color:#fff;font-weight:500;">${item.name}</p>
        ${item.options ? `<p style="margin:4px 0 0;color:#888;font-size:13px;">${item.options}</p>` : ''}
        <p style="margin:4px 0 0;color:#888;font-size:13px;">Qty: ${item.quantity}</p>
      </td><td style="padding:12px 0;border-bottom:1px solid #1a1a1a;text-align:right;color:#fff;">$${(item.price * item.quantity).toFixed(2)}</td></tr>
    `).join('');

    const addressParts = data.shippingAddress 
      ? [
          data.shippingAddress.line1,
          data.shippingAddress.line2,
          `${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postal_code}`,
          data.shippingAddress.country,
        ].filter(Boolean).join(', ')
      : '';

    const templateVars: Record<string, string> = {
      customer_name: data.customerName || '',
      order_number: data.orderNumber,
      order_items_html: itemRows,
      subtotal: data.subtotal.toFixed(2),
      shipping: data.shipping === 0 ? 'Free' : `$${data.shipping.toFixed(2)}`,
      tax: data.tax.toFixed(2),
      discount: data.discount.toFixed(2),
      total: data.total.toFixed(2),
      shipping_address: addressParts,
      tracking_number: data.trackingNumber || '',
      tracking_url: data.trackingUrl || '',
    };

    // Try DB template first, fall back to hardcoded
    const dbTemplate = await getTemplateFromDB(data.type, templateVars);

    const subjectFallback: Record<string, string> = {
      confirmation: `Order Confirmed - ${data.orderNumber}`,
      shipped: `Your Order Has Shipped - ${data.orderNumber}`,
      delivered: `Order Delivered - ${data.orderNumber}`,
    };

    const emailSubject = dbTemplate?.subject || subjectFallback[data.type] || `Order Update - ${data.orderNumber}`;
    const emailHtml = dbTemplate?.html || generateOrderConfirmationHtml(data);

    await transporter.sendMail({
      from: `"Bullmoney Store" <${process.env.GMAIL_USER}>`,
      to: data.to,
      subject: emailSubject,
      html: emailHtml,
    });

    return NextResponse.json({ success: true, source: dbTemplate ? 'database' : 'fallback' });
  } catch (error: any) {
    console.error('[Order Email] Failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
