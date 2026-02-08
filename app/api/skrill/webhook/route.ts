import { NextRequest, NextResponse } from 'next/server';
import { verifySkrillSignature } from '@/lib/skrill';

/**
 * Skrill Status URL webhook - receives POST when payment status changes.
 * Skrill sends form-encoded data with payment details.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const status = formData.get('status')?.toString() || '';
    const transactionId = formData.get('transaction_id')?.toString() || '';
    const mbAmount = formData.get('mb_amount')?.toString() || '';
    const mbCurrency = formData.get('mb_currency')?.toString() || '';
    const merchantId = formData.get('merchant_id')?.toString() || '';
    const mdSignature = formData.get('md5sig')?.toString() || '';
    const payFromEmail = formData.get('pay_from_email')?.toString() || '';
    const amount = formData.get('amount')?.toString() || '';
    const currency = formData.get('currency')?.toString() || '';
    const skrillTxnId = formData.get('mb_transaction_id')?.toString() || '';

    console.log('[Skrill Webhook] Status:', status, 'TXN:', transactionId, 'Amount:', mbAmount, mbCurrency);

    // Verify MD5 signature
    const isValid = verifySkrillSignature({
      merchantId,
      transactionId,
      mbAmount,
      mbCurrency,
      status,
      mdSignature,
    });

    if (!isValid) {
      console.error('[Skrill Webhook] Invalid signature for TXN:', transactionId);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    // Status codes:
    // 2 = Processed (success)
    // 0 = Pending
    // -1 = Cancelled
    // -2 = Failed
    // -3 = Chargeback
    const statusCode = parseInt(status, 10);

    if (statusCode === 2) {
      // Payment successful
      console.log('[Skrill Webhook] Payment SUCCESS:', {
        transactionId,
        skrillTxnId,
        amount: mbAmount,
        currency: mbCurrency,
        payerEmail: payFromEmail,
      });

      // TODO: Fulfill order in your database
      // await fulfillOrder(transactionId, {
      //   paymentMethod: 'skrill',
      //   skrillTransactionId: skrillTxnId,
      //   amount: parseFloat(mbAmount),
      //   currency: mbCurrency,
      //   payerEmail: payFromEmail,
      // });
    } else if (statusCode === 0) {
      console.log('[Skrill Webhook] Payment PENDING:', transactionId);
    } else {
      console.log('[Skrill Webhook] Payment FAILED/CANCELLED:', transactionId, 'status:', status);
    }

    // Skrill expects a 200 response
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Skrill Webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
