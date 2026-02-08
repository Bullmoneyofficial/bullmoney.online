// ============================================================================
// SKRILL PAYMENT INTEGRATION
// Quick Checkout via Skrill's payment gateway
// Docs: https://www.skrill.com/fileadmin/content/pdf/Skrill_Quick_Checkout_Guide.pdf
// ============================================================================

import crypto from 'crypto';

const SKRILL_MERCHANT_EMAIL = process.env.SKRILL_MERCHANT_EMAIL || '';
const SKRILL_SECRET_WORD = process.env.SKRILL_SECRET_WORD || '';
const SKRILL_API_PASSWORD = process.env.SKRILL_API_PASSWORD || '';

// Skrill Quick Checkout endpoint
const SKRILL_PAY_URL = 'https://pay.skrill.com';

export interface SkrillCheckoutParams {
  /** Unique transaction reference */
  transactionId: string;
  /** Amount in USD */
  amount: number;
  /** Product/order description */
  description: string;
  /** Product name shown to customer */
  detail1Text?: string;
  detail1Description?: string;
  /** Customer email (optional, pre-fills form) */
  customerEmail?: string;
  /** URL to redirect after successful payment */
  returnUrl: string;
  /** URL to redirect if customer cancels */
  cancelUrl: string;
  /** URL for Skrill to POST payment status */
  statusUrl: string;
}

/**
 * Generate the MD5 signature for Skrill status verification.
 * Skrill sends: merchant_id, transaction_id, secret_word (MD5 uppercased), 
 * mb_amount, mb_currency, status
 */
export function verifySkrillSignature(params: {
  merchantId: string;
  transactionId: string;
  mbAmount: string;
  mbCurrency: string;
  status: string;
  mdSignature: string;
}): boolean {
  const secretWordHash = crypto
    .createHash('md5')
    .update(SKRILL_SECRET_WORD)
    .digest('hex')
    .toUpperCase();

  const signatureString = [
    params.merchantId,
    params.transactionId,
    secretWordHash,
    params.mbAmount,
    params.mbCurrency,
    params.status,
  ].join('');

  const expectedSignature = crypto
    .createHash('md5')
    .update(signatureString)
    .digest('hex')
    .toUpperCase();

  return expectedSignature === params.mdSignature.toUpperCase();
}

/**
 * Build Skrill Quick Checkout form data.
 * Returns an object of key-value pairs to POST to https://pay.skrill.com
 */
export function buildSkrillCheckoutData(params: SkrillCheckoutParams): Record<string, string> {
  return {
    pay_to_email: SKRILL_MERCHANT_EMAIL,
    transaction_id: params.transactionId,
    amount: params.amount.toFixed(2),
    currency: 'USD',
    language: 'EN',
    detail1_description: params.detail1Description || 'Product',
    detail1_text: params.detail1Text || params.description,
    return_url: params.returnUrl,
    cancel_url: params.cancelUrl,
    status_url: params.statusUrl,
    // Optional: pre-fill customer email
    ...(params.customerEmail ? { pay_from_email: params.customerEmail } : {}),
    // Merchant branding
    logo_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://bullmoney.com'}/logo.png`,
    prepare_only: '1', // Return a session ID instead of HTML redirect
  };
}

/**
 * Create a Skrill Quick Checkout session.
 * POSTs form data to pay.skrill.com and returns a redirect URL.
 */
export async function createSkrillCheckoutSession(
  params: SkrillCheckoutParams
): Promise<{ url: string } | { error: string }> {
  if (!SKRILL_MERCHANT_EMAIL) {
    return { error: 'Skrill merchant email not configured' };
  }

  const formData = buildSkrillCheckoutData(params);

  try {
    // Skrill expects application/x-www-form-urlencoded
    const body = new URLSearchParams(formData).toString();

    const response = await fetch(SKRILL_PAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const text = await response.text();

    // If prepare_only=1, Skrill returns a SESSION_ID in the response body
    // The redirect URL is: https://pay.skrill.com/?sid=SESSION_ID
    const sessionId = text.trim();

    if (!sessionId || sessionId.includes('error') || sessionId.length < 10) {
      console.error('Skrill session creation failed:', text);
      return { error: 'Failed to create Skrill payment session' };
    }

    return {
      url: `${SKRILL_PAY_URL}?sid=${sessionId}`,
    };
  } catch (error: any) {
    console.error('Skrill API error:', error);
    return { error: error.message || 'Skrill service unavailable' };
  }
}

export { SKRILL_PAY_URL, SKRILL_MERCHANT_EMAIL };
