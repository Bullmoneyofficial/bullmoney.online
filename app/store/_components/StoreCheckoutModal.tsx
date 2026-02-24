'use client';

/**
 * StoreCheckoutModal.tsx
 *
 * Full-screen overlay checkout dialog. Lets the user pick between Cart,
 * Whop, Skrill (soon), and Stripe (soon) — then confirms the order.
 */

import { CreditCard, ShoppingBag, X } from 'lucide-react';
import type { ProductWithDetails } from '@/types/store';
import type { PaymentMethod } from '../_types/store-page.types';
import { CryptoCheckoutTrigger } from '../_lazy/store-dynamics';

interface StoreCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  checkoutProduct: ProductWithDetails | null;
  paymentMethod: PaymentMethod;
  onSelectPaymentMethod: (method: PaymentMethod) => void;
  onConfirm: () => void;
  formatPrice: (value: number) => string;
  isVipProduct: (p: ProductWithDetails) => boolean;
}

export function StoreCheckoutModal({
  open,
  onClose,
  checkoutProduct,
  paymentMethod,
  onSelectPaymentMethod,
  onConfirm,
  formatPrice,
  isVipProduct,
}: StoreCheckoutModalProps) {
  if (!open) return null;

  const checkoutVariant = checkoutProduct?.variants?.[0];
  const checkoutIsVip = checkoutProduct ? isVipProduct(checkoutProduct) : false;
  const checkoutInStock =
    checkoutIsVip ||
    Boolean(checkoutVariant && checkoutVariant.inventory_count > 0);
  const checkoutPrice = checkoutProduct
    ? checkoutProduct.base_price + (checkoutVariant?.price_adjustment || 0)
    : 0;

  return (
    <div
      className="fixed inset-0 z-[650] flex items-center justify-center bg-black/40 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label="Checkout menu"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_rgba(0,0,0,0.2)]">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-black/10 px-6 py-5">
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.28em]"
              style={{ color: 'rgba(0,0,0,0.45)' }}
            >
              Checkout menu
            </p>
            <h3 className="mt-2 text-xl font-semibold">Choose your payment method</h3>
            <p className="mt-1 text-sm" style={{ color: 'rgba(0,0,0,0.6)' }}>
              {checkoutProduct?.name
                ? `${checkoutProduct.name} · ${formatPrice(checkoutProduct.base_price)}`
                : 'Cart ready to check out.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10"
            style={{ color: 'rgba(0,0,0,0.6)' }}
            aria-label="Close checkout menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="space-y-5">
            {/* Crypto checkout */}
            <div>
              <CryptoCheckoutTrigger
                productName={checkoutProduct?.name || 'Product'}
                productImage={checkoutProduct?.primary_image}
                priceUSD={checkoutPrice}
                productId={checkoutProduct?.id?.toString() || ''}
                variantId={checkoutVariant?.id?.toString()}
                quantity={1}
                disabled={!checkoutInStock}
              />
            </div>

            {/* Payment method toggle + confirm button */}
            <div className="w-full flex flex-col gap-0">
              <div className="grid grid-cols-4 w-full rounded-2xl overflow-hidden border border-black/10">
                {(
                  [
                    { value: 'cart', label: 'Cart', soon: false },
                    { value: 'whop', label: 'Whop', soon: false },
                    { value: 'skrill', label: 'Skrill', soon: true },
                    { value: 'stripe', label: 'Stripe', soon: true },
                  ] as { value: PaymentMethod; label: string; soon: boolean }[]
                ).map((opt, i) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => !opt.soon && onSelectPaymentMethod(opt.value)}
                    className={`py-3 text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                      i > 0 ? 'border-l border-black/10' : ''
                    } ${
                      paymentMethod === opt.value
                        ? 'bg-black text-white'
                        : 'bg-black/5 text-black/70 hover:bg-black/10'
                    }`}
                    aria-pressed={paymentMethod === opt.value}
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>{opt.label}</span>
                    {opt.soon && (
                      <span className="text-[8px] opacity-50 leading-none -mt-0.5">
                        Soon
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={onConfirm}
                disabled={
                  paymentMethod === 'stripe' ||
                  paymentMethod === 'skrill' ||
                  !checkoutInStock
                }
                className={`w-full py-3.5 rounded-2xl mt-3 transition-all flex items-center justify-center gap-2 text-sm font-semibold ${
                  paymentMethod === 'stripe' || paymentMethod === 'skrill'
                    ? 'bg-black/10 text-black/40 cursor-not-allowed'
                    : paymentMethod === 'cart'
                    ? 'bg-black text-white hover:bg-black/90'
                    : 'bg-white border border-black/10 text-black hover:bg-black/5'
                }`}
              >
                {paymentMethod === 'cart' && (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    <span>Add to Cart</span>
                  </>
                )}
                {paymentMethod === 'whop' && (
                  <>
                    <CreditCard className="h-4 w-4" />
                    <span>Pay with Whop</span>
                  </>
                )}
                {paymentMethod === 'skrill' && (
                  <>
                    <CreditCard className="h-4 w-4" />
                    <span>Skrill - Coming Soon</span>
                  </>
                )}
                {paymentMethod === 'stripe' && (
                  <>
                    <CreditCard className="h-4 w-4" />
                    <span>Stripe - Coming Soon</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs" style={{ color: 'rgba(0,0,0,0.5)' }}>
                Secure checkout options match the product quick view.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-black/10 px-5 py-2 text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
