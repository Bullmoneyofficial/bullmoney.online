'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  MapPin,
  Mail,
  Phone,
  CreditCard,
  Clock,
  Check,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import type { OrderWithItems, OrderStatus, OrderItem } from '@/types/store';

// ============================================================================
// ADMIN ORDER DETAIL - VIEW & MANAGE SINGLE ORDER
// ============================================================================

interface AdminOrderDetailProps {
  orderId: string;
}

const ORDER_FLOW: OrderStatus[] = [
  'PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
];

export function AdminOrderDetail({ orderId }: AdminOrderDetailProps) {
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/store/admin/orders/${orderId}`);
      const data = await response.json();
      setOrder(data.data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: OrderStatus) => {
    if (!order) return;
    setUpdating(true);

    try {
      await fetch(`/api/store/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      setOrder({ ...order, status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update order:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-white/5 rounded-lg" />
        <div className="h-96 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Package className="w-12 h-12 text-white/20 mb-4" />
        <p className="text-white/40 mb-4">Order not found</p>
        <Link
          href="/store/admin/orders"
          className="text-white hover:underline"
        >
          Back to orders
        </Link>
      </div>
    );
  }

  const currentStepIndex = ORDER_FLOW.indexOf(order.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/store/admin/orders"
            className="p-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-light">Order {order.order_number}</h1>
            <p className="text-white/40 text-sm">
              Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Order Flow */}
      {!['CANCELLED', 'REFUNDED'].includes(order.status) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white/5 border border-white/10 rounded-2xl"
        >
          <h2 className="text-lg font-medium mb-6">Order Progress</h2>
          
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute left-0 right-0 top-5 h-0.5 bg-white/10" />
            <div 
              className="absolute left-0 top-5 h-0.5 bg-white transition-all"
              style={{ width: `${(currentStepIndex / (ORDER_FLOW.length - 1)) * 100}%` }}
            />

            {ORDER_FLOW.map((status, index) => {
              const isComplete = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              
              return (
                <div key={status} className="relative flex flex-col items-center z-10">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors
                      ${isComplete 
                        ? 'bg-white border-white text-black' 
                        : 'bg-black border-white/20 text-white/40'
                      }
                      ${isCurrent ? 'ring-4 ring-white/20' : ''}
                    `}
                  >
                    {isComplete ? <Check className="w-5 h-5" /> : index + 1}
                  </div>
                  <span className={`mt-2 text-xs ${isComplete ? 'text-white' : 'text-white/40'}`}>
                    {status}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
            {order.status === 'PAID' && (
              <button
                onClick={() => updateStatus('PROCESSING')}
                disabled={updating}
                className="h-10 px-4 bg-white text-black rounded-xl text-sm font-medium
                         hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                Start Processing
              </button>
            )}
            {order.status === 'PROCESSING' && (
              <button
                onClick={() => updateStatus('SHIPPED')}
                disabled={updating}
                className="h-10 px-4 bg-white text-black rounded-xl text-sm font-medium
                         hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                Mark as Shipped
              </button>
            )}
            {order.status === 'SHIPPED' && (
              <button
                onClick={() => updateStatus('DELIVERED')}
                disabled={updating}
                className="h-10 px-4 bg-white text-black rounded-xl text-sm font-medium
                         hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                Mark as Delivered
              </button>
            )}
            {!['CANCELLED', 'REFUNDED', 'DELIVERED'].includes(order.status) && (
              <button
                onClick={() => updateStatus('CANCELLED')}
                disabled={updating}
                className="h-10 px-4 bg-red-500/20 text-red-400 rounded-xl text-sm font-medium
                         hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                Cancel Order
              </button>
            )}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 p-6 bg-white/5 border border-white/10 rounded-2xl"
        >
          <h2 className="text-lg font-medium mb-4">Order Items</h2>
          
          <div className="space-y-4">
            {order.items?.map((item) => (
              <OrderItemRow key={item.id} item={item} />
            ))}
          </div>

          {/* Order Summary */}
          <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
            <div className="flex justify-between text-white/60">
              <span>Subtotal</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-white/60">
              <span>Shipping</span>
              <span>${order.shipping_cost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-white/60">
              <span>Tax</span>
              <span>${order.tax_amount.toFixed(2)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Discount</span>
                <span>-${order.discount_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-medium pt-3 border-t border-white/10">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>
        </motion.div>

        {/* Customer & Shipping Info */}
        <div className="space-y-6">
          {/* Customer Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 bg-white/5 border border-white/10 rounded-2xl"
          >
            <h2 className="text-lg font-medium mb-4">Customer</h2>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-white/40" />
                <span className="text-sm">{order.guest_email || 'N/A'}</span>
              </div>
              {order.shipping_address?.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-white/40" />
                  <span className="text-sm">{order.shipping_address.phone}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Shipping Address */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 bg-white/5 border border-white/10 rounded-2xl"
          >
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-white/40" />
              Shipping Address
            </h2>
            
            {order.shipping_address ? (
              <div className="space-y-1 text-sm text-white/80">
                <p className="font-medium text-white">
                  {order.shipping_address.first_name} {order.shipping_address.last_name}
                </p>
                <p>{order.shipping_address.line1}</p>
                {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
                <p>
                  {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                </p>
                <p>{order.shipping_address.country}</p>
              </div>
            ) : (
              <p className="text-white/40 text-sm">No shipping address</p>
            )}
          </motion.div>

          {/* Payment Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 bg-white/5 border border-white/10 rounded-2xl"
          >
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-white/40" />
              Payment
            </h2>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Status</span>
                <span className={order.paid_at ? 'text-green-400' : 'text-yellow-400'}>
                  {order.paid_at ? 'Paid' : 'Pending'}
                </span>
              </div>
              {order.stripe_payment_intent_id && (
                <div className="flex justify-between">
                  <span className="text-white/60">Payment ID</span>
                  <span className="font-mono text-xs">
                    {order.stripe_payment_intent_id.slice(-12)}
                  </span>
                </div>
              )}
              {order.paid_at && (
                <div className="flex justify-between">
                  <span className="text-white/60">Paid at</span>
                  <span>
                    {new Date(order.paid_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-6 bg-white/5 border border-white/10 rounded-2xl"
          >
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-white/40" />
              Timeline
            </h2>
            
            <div className="space-y-4">
              <TimelineItem
                label="Order placed"
                date={order.created_at}
              />
              {order.paid_at && (
                <TimelineItem
                  label="Payment received"
                  date={order.paid_at}
                />
              )}
              {order.shipped_at && (
                <TimelineItem
                  label="Shipped"
                  date={order.shipped_at}
                />
              )}
              {order.delivered_at && (
                <TimelineItem
                  label="Delivered"
                  date={order.delivered_at}
                />
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const statusStyles: Record<string, string> = {
    PENDING: 'bg-yellow-500/20 text-yellow-400',
    PAID: 'bg-green-500/20 text-green-400',
    PROCESSING: 'bg-blue-500/20 text-blue-400',
    SHIPPED: 'bg-purple-500/20 text-purple-400',
    DELIVERED: 'bg-green-500/20 text-green-400',
    CANCELLED: 'bg-red-500/20 text-red-400',
    REFUNDED: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusStyles[status] || statusStyles.PENDING}`}>
      {status}
    </span>
  );
}

function OrderItemRow({ item }: { item: OrderItem }) {
  const snapshot = item.product_snapshot;

  return (
    <div className="flex gap-4">
      {/* Image */}
      <div className="w-20 h-20 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
        {snapshot?.image_url ? (
          <Image
            src={snapshot.image_url}
            alt={snapshot.name}
            width={80}
            height={80}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-6 h-6 text-white/20" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate">{snapshot?.name || 'Unknown Product'}</h4>
        {snapshot?.sku && (
          <p className="text-xs text-white/40 font-mono">SKU: {snapshot.sku}</p>
        )}
        {snapshot?.options && Object.keys(snapshot.options).length > 0 && (
          <p className="text-sm text-white/60">
            {Object.entries(snapshot.options)
              .filter(([_, v]) => v)
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ')}
          </p>
        )}
        <p className="text-sm text-white/60">Qty: {item.quantity}</p>
      </div>

      {/* Price */}
      <div className="text-right">
        <p className="font-medium">${item.total_price.toFixed(2)}</p>
        <p className="text-sm text-white/40">${item.unit_price.toFixed(2)} each</p>
      </div>
    </div>
  );
}

function TimelineItem({ label, date }: { label: string; date: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-white" />
      <div className="flex-1">
        <p className="text-sm">{label}</p>
        <p className="text-xs text-white/40">
          {new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}
