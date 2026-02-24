'use client';

/**
 * StoreQuickAddPanel.tsx
 *
 * Desktop-only slide-down panel that appears below the nav when a product
 * is "quick-added" to cart. Shows product summary + payment method buttons.
 */

import Link from 'next/link';
import { CreditCard, ShoppingBag, X } from 'lucide-react';
import type { ProductWithDetails } from '@/types/store';
import type { PaymentMethod } from '../_types/store-page.types';

interface StoreQuickAddPanelProps {
  expandedProduct: ProductWithDetails | null;
  onClose: () => void;
  onBuy: (method: PaymentMethod) => void;
  formatPrice: (value: number) => string;
  isVipProduct: (p: ProductWithDetails) => boolean;
  canAddToCart: (p: ProductWithDetails) => boolean;
}

export function StoreQuickAddPanel({
  expandedProduct,
  onClose,
  onBuy,
  formatPrice,
  isVipProduct,
  canAddToCart,
}: StoreQuickAddPanelProps) {
  if (!expandedProduct) return null;

  // Resolved image
  const primaryImage =
    expandedProduct.primary_image ||
    expandedProduct.images?.find((img) => img.is_primary)?.url ||
    expandedProduct.images?.[0]?.url ||
    '';

  const expandedVariant = expandedProduct.variants?.[0];
  const expandedInventory = expandedVariant?.inventory_count;
  const expandedIsVip = isVipProduct(expandedProduct);
  const expandedInStock = canAddToCart(expandedProduct);
  const expandedBuyUrl =
    (expandedProduct as any).buy_url ||
    (expandedProduct.details as { buy_url?: string } | undefined)?.buy_url;
  const expandedDetailsHref = expandedBuyUrl || '/VIP';

  return (
    <div
      className={`fixed left-0 right-0 z-[495] hidden lg:block transition-all duration-200 ease-out ${
        expandedProduct
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 -translate-y-full pointer-events-none'
      }`}
      style={{ top: 0 }}
      role="dialog"
      aria-label="Quick add preview"
      aria-hidden={!expandedProduct}
    >
      <div className="mx-auto w-full max-w-6xl px-5">
        <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl">
          <div className="flex items-center gap-4 px-5 py-4">
            {/* Product thumbnail */}
            <div className="h-16 w-16 overflow-hidden rounded-2xl bg-black/5 shrink-0">
              {primaryImage ? (
                <img
                  src={primaryImage}
                  alt={expandedProduct.name || 'Product preview'}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-xs"
                  style={{ color: 'rgba(0,0,0,0.45)' }}
                >
                  Preview
                </div>
              )}
            </div>

            {/* Product info */}
            <div className="min-w-0 flex-1">
              <p
                className="text-[11px] uppercase tracking-[0.28em]"
                style={{ color: 'rgba(0,0,0,0.45)' }}
              >
                Quick add
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h3 className="truncate text-lg font-semibold tracking-tight">
                  {expandedProduct.name}
                </h3>
                <span
                  className="rounded-full bg-black/5 px-3 py-1 text-sm font-medium"
                  style={{ color: 'rgba(0,0,0,0.7)' }}
                >
                  {formatPrice(expandedProduct.base_price)}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm" style={{ color: 'rgba(0,0,0,0.6)' }}>
                {expandedProduct.short_description ||
                  expandedProduct.description ||
                  'A focused essential designed for the desk.'}
              </p>
              <div
                className="mt-2 flex flex-wrap items-center gap-3 text-xs"
                style={{ color: 'rgba(0,0,0,0.6)' }}
              >
                {expandedVariant?.name && <span>{expandedVariant.name}</span>}
                {(expandedInventory !== undefined || expandedIsVip) && (
                  <span
                    className={`rounded-full px-2 py-1 ${
                      expandedInStock
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {expandedInStock
                      ? expandedIsVip
                        ? 'Available'
                        : `${Math.max(0, expandedInventory!)} in stock`
                      : 'Out of stock'}
                  </span>
                )}
              </div>

              {/* Payment method buttons */}
              <div className="mt-3 w-full grid grid-cols-2 gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => onBuy('cart')}
                  disabled={!expandedInStock}
                  className={`rounded-full px-3 py-2 inline-flex items-center justify-center gap-2 ${
                    expandedInStock
                      ? 'bg-black text-white hover:bg-black/90'
                      : 'bg-black/10 text-black/40 cursor-not-allowed'
                  }`}
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Add to Cart
                </button>
                <button
                  type="button"
                  onClick={() => onBuy('whop')}
                  disabled={!expandedInStock}
                  className={`rounded-full px-3 py-2 inline-flex items-center justify-center gap-2 ${
                    expandedInStock
                      ? 'bg-white border border-black/10 text-black hover:bg-black/5'
                      : 'bg-black/10 text-black/40 cursor-not-allowed'
                  }`}
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  Pay with Whop
                </button>
                <button
                  type="button"
                  disabled
                  className="rounded-full px-3 py-2 inline-flex items-center justify-center gap-2 bg-black/10 text-black/40 cursor-not-allowed"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  Skrill - Soon
                </button>
                <button
                  type="button"
                  disabled
                  className="rounded-full px-3 py-2 inline-flex items-center justify-center gap-2 bg-black/10 text-black/40 cursor-not-allowed"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  Stripe - Soon
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-end gap-2 sm:flex-row shrink-0">
              <Link
                href={expandedDetailsHref}
                className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold"
                style={{ color: 'rgba(0,0,0,0.75)' }}
                onClick={onClose}
              >
                View details
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10"
                style={{ color: 'rgba(0,0,0,0.6)' }}
                aria-label="Close quick add"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
