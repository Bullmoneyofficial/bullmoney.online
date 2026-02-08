// ============================================================================
// INVOICE HTML GENERATOR — Reusable inline-HTML invoice for email attachments
// Renders a professional invoice that works in all email clients
// ============================================================================

const BRAND = {
  black: '#000000',
  white: '#ffffff',
  card: '#111111',
  border: '#222222',
  muted: '#888888',
  blue: '#3b82f6',
};

interface InvoiceLineItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceData {
  orderNumber: string;
  date: string;                 // ISO string or formatted
  status: string;               // pending, confirmed, refunded ...
  
  // Customer
  customerEmail?: string;
  
  // Payment
  paymentMethod: string;         // e.g. "Crypto (ETH / Ethereum)"
  txHash?: string;
  coin?: string;
  network?: string;
  amountCrypto?: number | string | null;
  amountUSD: number;
  lockedPrice?: number | null;
  senderWallet?: string | null;
  walletAddress?: string;
  
  // Line items
  items: InvoiceLineItem[];
  
  // Totals
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  
  // Refund (optional)
  refundAmount?: number;
  refundReason?: string;
  
  // Branding
  companyName?: string;
  siteUrl?: string;
  logoUrl?: string;
}

export function generateInvoiceHTML(data: InvoiceData): string {
  const {
    orderNumber,
    date,
    status,
    customerEmail,
    paymentMethod,
    txHash,
    coin,
    network,
    amountCrypto,
    amountUSD,
    lockedPrice,
    senderWallet,
    walletAddress,
    items,
    subtotal,
    tax = 0,
    discount = 0,
    total,
    refundAmount,
    refundReason,
    companyName = 'Bullmoney',
    siteUrl = 'https://bullmoney.shop',
  } = data;

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  const statusColor = {
    pending: '#f59e0b',
    confirming: '#3b82f6',
    confirmed: '#22c55e',
    failed: '#ef4444',
    expired: '#6b7280',
    underpaid: '#f59e0b',
    refunded: '#8b5cf6',
    manual_review: '#f59e0b',
  }[status] || BRAND.muted;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Invoice ${orderNumber}</title></head>
<body style="margin: 0; padding: 0; background: ${BRAND.black}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: ${BRAND.white};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BRAND.black}">
    <tr><td align="center" style="padding: 40px 20px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">

        <!-- Header -->
        <tr><td style="padding: 0 0 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                  ${companyName.toUpperCase()}
                </h1>
                <p style="margin: 4px 0 0; font-size: 12px; color: ${BRAND.muted};">${siteUrl}</p>
              </td>
              <td align="right">
                <div style="display: inline-block; padding: 6px 14px; border-radius: 20px; background: ${statusColor}22; border: 1px solid ${statusColor}44;">
                  <span style="color: ${statusColor}; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                    ${statusLabel}
                  </span>
                </div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Invoice Info -->
        <tr><td style="padding: 0 0 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: ${BRAND.card}; border-radius: 12px; border: 1px solid ${BRAND.border};">
            <tr><td style="padding: 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="50%" valign="top">
                    <p style="margin: 0 0 4px; font-size: 10px; color: ${BRAND.muted}; text-transform: uppercase; letter-spacing: 1px;">Invoice</p>
                    <p style="margin: 0; font-size: 16px; font-weight: 700;">${orderNumber}</p>
                  </td>
                  <td width="50%" valign="top" align="right">
                    <p style="margin: 0 0 4px; font-size: 10px; color: ${BRAND.muted}; text-transform: uppercase; letter-spacing: 1px;">Date</p>
                    <p style="margin: 0; font-size: 14px;">${formattedDate}</p>
                  </td>
                </tr>
                ${customerEmail ? `
                <tr><td colspan="2" style="padding-top: 12px;">
                  <p style="margin: 0 0 4px; font-size: 10px; color: ${BRAND.muted}; text-transform: uppercase; letter-spacing: 1px;">Customer</p>
                  <p style="margin: 0; font-size: 14px;">${customerEmail}</p>
                </td></tr>
                ` : ''}
              </table>
            </td></tr>
          </table>
        </td></tr>

        <!-- Line Items -->
        <tr><td style="padding: 0 0 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: ${BRAND.card}; border-radius: 12px; border: 1px solid ${BRAND.border};">
            <!-- Header row -->
            <tr style="border-bottom: 1px solid ${BRAND.border};">
              <td style="padding: 14px 20px; font-size: 10px; color: ${BRAND.muted}; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Item</td>
              <td align="center" style="padding: 14px 12px; font-size: 10px; color: ${BRAND.muted}; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Qty</td>
              <td align="right" style="padding: 14px 12px; font-size: 10px; color: ${BRAND.muted}; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Price</td>
              <td align="right" style="padding: 14px 20px; font-size: 10px; color: ${BRAND.muted}; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Total</td>
            </tr>
            ${items.map((item, i) => `
            <tr${i < items.length - 1 ? ` style="border-bottom: 1px solid ${BRAND.border};"` : ''}>
              <td style="padding: 14px 20px; font-size: 14px; font-weight: 500;">${item.name}</td>
              <td align="center" style="padding: 14px 12px; font-size: 14px; color: ${BRAND.muted};">${item.quantity}</td>
              <td align="right" style="padding: 14px 12px; font-size: 14px; color: ${BRAND.muted};">$${item.unitPrice.toFixed(2)}</td>
              <td align="right" style="padding: 14px 20px; font-size: 14px; font-weight: 600;">$${item.total.toFixed(2)}</td>
            </tr>
            `).join('')}
          </table>
        </td></tr>

        <!-- Totals -->
        <tr><td style="padding: 0 0 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: ${BRAND.card}; border-radius: 12px; border: 1px solid ${BRAND.border};">
            <tr><td style="padding: 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: ${BRAND.muted};">Subtotal</td>
                  <td align="right" style="padding: 4px 0; font-size: 14px;">$${subtotal.toFixed(2)}</td>
                </tr>
                ${tax > 0 ? `
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: ${BRAND.muted};">Tax</td>
                  <td align="right" style="padding: 4px 0; font-size: 14px;">$${tax.toFixed(2)}</td>
                </tr>
                ` : ''}
                ${discount > 0 ? `
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: ${BRAND.muted};">Discount</td>
                  <td align="right" style="padding: 4px 0; font-size: 14px; color: #22c55e;">-$${discount.toFixed(2)}</td>
                </tr>
                ` : ''}
                <tr style="border-top: 1px solid ${BRAND.border};">
                  <td style="padding: 12px 0 0; font-size: 18px; font-weight: 800;">Total (USD)</td>
                  <td align="right" style="padding: 12px 0 0; font-size: 18px; font-weight: 800;">$${total.toFixed(2)}</td>
                </tr>
                ${amountCrypto && coin ? `
                <tr>
                  <td style="padding: 4px 0 0; font-size: 14px; color: ${BRAND.muted};">Crypto Amount</td>
                  <td align="right" style="padding: 4px 0 0; font-size: 14px; font-weight: 600;">${amountCrypto} ${coin}</td>
                </tr>
                ` : ''}
                ${lockedPrice ? `
                <tr>
                  <td style="padding: 4px 0 0; font-size: 12px; color: ${BRAND.muted};">Rate at Purchase</td>
                  <td align="right" style="padding: 4px 0 0; font-size: 12px; color: ${BRAND.muted};">1 ${coin} = $${lockedPrice.toFixed(2)}</td>
                </tr>
                ` : ''}
                ${refundAmount ? `
                <tr style="border-top: 1px solid ${BRAND.border};">
                  <td style="padding: 12px 0 0; font-size: 16px; font-weight: 700; color: #8b5cf6;">Refund</td>
                  <td align="right" style="padding: 12px 0 0; font-size: 16px; font-weight: 700; color: #8b5cf6;">-$${refundAmount.toFixed(2)}</td>
                </tr>
                ${refundReason ? `
                <tr>
                  <td colspan="2" style="padding: 4px 0 0; font-size: 12px; color: ${BRAND.muted};">Reason: ${refundReason}</td>
                </tr>
                ` : ''}
                ` : ''}
              </table>
            </td></tr>
          </table>
        </td></tr>

        <!-- Payment Details -->
        <tr><td style="padding: 0 0 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: ${BRAND.card}; border-radius: 12px; border: 1px solid ${BRAND.border};">
            <tr><td style="padding: 20px;">
              <p style="margin: 0 0 12px; font-size: 10px; color: ${BRAND.muted}; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Payment Details</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: ${BRAND.muted}; width: 35%;">Method</td>
                  <td style="padding: 6px 0; font-size: 13px;">${paymentMethod}</td>
                </tr>
                ${network ? `
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: ${BRAND.muted};">Network</td>
                  <td style="padding: 6px 0; font-size: 13px;">${network}</td>
                </tr>
                ` : ''}
                ${txHash ? `
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: ${BRAND.muted};">TX Hash</td>
                  <td style="padding: 6px 0; font-size: 11px; font-family: monospace; word-break: break-all;">${txHash}</td>
                </tr>
                ` : ''}
                ${senderWallet ? `
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: ${BRAND.muted};">From Wallet</td>
                  <td style="padding: 6px 0; font-size: 11px; font-family: monospace; word-break: break-all;">${senderWallet}</td>
                </tr>
                ` : ''}
                ${walletAddress ? `
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: ${BRAND.muted};">To Wallet</td>
                  <td style="padding: 6px 0; font-size: 11px; font-family: monospace; word-break: break-all;">${walletAddress}</td>
                </tr>
                ` : ''}
              </table>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding: 20px 0 0; border-top: 1px solid ${BRAND.border};">
          <p style="margin: 0 0 8px; font-size: 12px; color: ${BRAND.muted}; text-align: center;">
            This is an automated invoice from ${companyName}. 
            For questions, contact <a href="mailto:officialbullmoneywebsite@gmail.com" style="color: ${BRAND.blue};">officialbullmoneywebsite@gmail.com</a>
          </p>
          <p style="margin: 0; font-size: 11px; color: #444; text-align: center;">
            &copy; ${new Date().getFullYear()} ${companyName}. All rights reserved. <a href="${siteUrl}" style="color: ${BRAND.blue};">${siteUrl}</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Build invoice data from a crypto payment record
 */
export function buildCryptoInvoiceData(payment: Record<string, unknown>): InvoiceData {
  const coin = payment.coin as string || 'CRYPTO';
  const network = payment.network as string || '';
  const productName = payment.product_name as string || 'Digital Product';
  const quantity = (payment.quantity as number) || 1;
  const amountUSD = (payment.amount_usd as number) || 0;
  const unitPrice = quantity > 0 ? amountUSD / quantity : amountUSD;

  return {
    orderNumber: payment.order_number as string || 'N/A',
    date: (payment.submitted_at as string) || (payment.created_at as string) || new Date().toISOString(),
    status: payment.status as string || 'pending',
    customerEmail: (payment.guest_email as string) || undefined,
    paymentMethod: `Crypto (${coin}${network ? ` / ${network}` : ''})`,
    txHash: payment.tx_hash as string,
    coin,
    network,
    amountCrypto: payment.amount_crypto as number | null,
    amountUSD,
    lockedPrice: payment.locked_price as number | null,
    senderWallet: payment.sender_wallet as string | null,
    walletAddress: payment.wallet_address as string,
    items: [{
      name: productName,
      quantity,
      unitPrice,
      total: amountUSD,
    }],
    subtotal: amountUSD,
    total: amountUSD,
    refundAmount: payment.refund_amount_usd as number | undefined,
    siteUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://bullmoney.shop',
  };
}
