'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import Package from 'lucide-react/dist/esm/icons/package';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Link from 'next/link';
import { useCartStore } from '@/stores/cart-store';

interface OrderDetails {
  id: string;
  customerEmail?: string;
  customerName?: string;
  amountTotal?: number;
  currency?: string;
  lineItems?: Array<{ name: string; quantity: number; amount: number }>;
  createdAt?: string;
  shippingDetails?: any;
  trackingNumber?: string;
  carrier?: string;
  orderNumber?: string;
  status?: string;
}

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    // Clear the cart after successful payment
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    if (sessionId) {
      fetch(`/api/stripe/session/${sessionId}`)
        .then((res) => res.json())
        .then(async (data) => {
          if (!data.error) {
            setOrderDetails(data);

            // Auto-save order to store_orders as fallback (in case webhook isn't configured)
            try {
              const saveRes = await fetch('/api/store/orders/auto-create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  session_id: sessionId,
                  email: data.customerEmail,
                  customer_name: data.customerName,
                  amount_total: data.amountTotal,
                  currency: data.currency,
                  line_items: data.lineItems,
                  shipping_details: data.shippingDetails,
                }),
              });
              const saved = await saveRes.json();
              if (saved.order_number) {
                setOrderDetails(prev => prev ? {
                  ...prev,
                  orderNumber: saved.order_number,
                  status: saved.status || 'processing',
                  // tracking_number will be null — only real numbers from carriers
                  trackingNumber: saved.tracking_number || undefined,
                  carrier: saved.carrier || undefined,
                } : prev);
              }
            } catch (e) {
              // Webhook will handle it — this is just a fallback
              console.log('Auto-create fallback skipped (webhook handles it)');
            }
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-black/90 border border-white/20 rounded-2xl p-8 md:p-12 text-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center"
        >
          <CheckCircle className="w-12 h-12 text-green-500" />
        </motion.div>

        {/* Success Message */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-3xl md:text-4xl font-bold text-white mb-4"
        >
          Payment Successful!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white/60 text-lg mb-8"
        >
          {orderDetails?.customerName 
            ? `Thank you, ${orderDetails.customerName}! Your order has been confirmed.`
            : 'Thank you for your purchase. Your order has been confirmed.'}
        </motion.p>

        {/* Order Details */}
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center py-8"
          >
            <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
          </motion.div>
        ) : orderDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white/5 rounded-xl p-6 mb-8 text-left space-y-4"
          >
            {orderDetails.amountTotal && (
              <div>
                <p className="text-white/40 text-sm mb-1">Total Paid</p>
                <p className="text-2xl font-bold text-green-500">
                  ${(orderDetails.amountTotal / 100).toFixed(2)} {orderDetails.currency?.toUpperCase()}
                </p>
              </div>
            )}
            
            {orderDetails.lineItems && orderDetails.lineItems.length > 0 && (
              <div>
                <p className="text-white/40 text-sm mb-2">Items</p>
                <div className="space-y-2">
                  {orderDetails.lineItems.map((item, i) => (
                    <div key={i} className="flex justify-between text-white">
                      <span>{item.name} × {item.quantity}</span>
                      <span>${(item.amount / 100).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {orderDetails.customerEmail && (
              <div>
                <p className="text-white/40 text-sm mb-1">Receipt sent to</p>
                <p className="text-white">{orderDetails.customerEmail}</p>
              </div>
            )}

            <div>
              <p className="text-white/40 text-sm mb-1">Order ID</p>
              <p className="text-white font-mono text-xs break-all">{orderDetails.orderNumber || sessionId}</p>
            </div>

            {/* Auto-tracking info */}
            {orderDetails.trackingNumber ? (
              <div className="pt-3 border-t border-white/10">
                <p className="text-white/40 text-sm mb-1">Tracking Number</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                    {(orderDetails.carrier || '').replace(/_/g, ' ')}
                  </span>
                  <span className="text-white font-mono text-sm">{orderDetails.trackingNumber}</span>
                </div>
              </div>
            ) : (
              <div className="pt-3 border-t border-white/10">
                <p className="text-white/40 text-sm mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    Processing
                  </span>
                </div>
                <p className="text-white/30 text-xs mt-1">Tracking number will appear in your Account once shipped with a real carrier</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-4 mb-8"
        >
          <div className="flex items-start gap-4 text-left">
            <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-sky-500" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Confirmation Email</h3>
              <p className="text-white/60 text-sm">
                We've sent a confirmation email with your order details and receipt.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 text-left">
            <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-sky-500" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Order Processing</h3>
              <p className="text-white/60 text-sm">
                Your order is being processed and will be shipped within 2-3 business days.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link
            href="/store"
            className="flex-1 py-3 px-6 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition-all active:scale-95"
          >
            Continue Shopping
          </Link>
          <Link
            href="/"
            className="flex-1 py-3 px-6 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all active:scale-95"
          >
            Back to Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
