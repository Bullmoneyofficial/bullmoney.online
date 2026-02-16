// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag, ChevronLeft, ArrowLeft, Tag, Loader2, Sparkles, CreditCard } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cart-store';
import { useUIState } from '@/contexts/UIStateContext';
import { toast } from 'sonner';
import TextType from '@/components/TextType';
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';
import { CryptoCheckoutInline } from '@/components/shop/CryptoCheckoutInline';

// ============================================================================
// CART DRAWER - SLIDE-OUT PANEL WITH PORTAL
// Uses React Portal to escape stacking context and appear above all content
// ============================================================================

export function CartDrawer() {
  const router = useRouter();
  const { shouldSkipHeavyEffects } = useUIState();
  const CART_DRAWER_BACKDROP_Z_INDEX = 2147483600;
  const CART_DRAWER_PANEL_Z_INDEX = 2147483601;
  const [isDesktop, setIsDesktop] = useState(false);
  const { 
    items, 
    isOpen, 
    closeCart, 
    removeItem, 
    updateQuantity, 
    getSummary,
    clearCart,
    setDiscountCode,
    discountCode,
    vipShippingCharged,
    loadVipShippingSetting,
  } = useCartStore();

  const summary = getSummary();
  const primaryItem = items[0];
  const cryptoProductName = items.length > 1
    ? `Cart (${items.length} items)`
    : primaryItem?.product.name || 'Cart Checkout';
  const cryptoProductImage = primaryItem?.product.primary_image;
  const cryptoProductId = primaryItem?.product.id?.toString() || 'cart';
  const cryptoVariantId = primaryItem?.variant.id?.toString();
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [showCoupon, setShowCoupon] = useState(false);
  const [showCryptoCheckout, setShowCryptoCheckout] = useState(false);

  const isVipProduct = (product: any) => {
    return Boolean(product?.buy_url || product?._source === 'vip' || product?.details?.buy_url);
  };

  useEffect(() => {
    loadVipShippingSetting();
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const updateMatch = () => setIsDesktop(mediaQuery.matches);
    updateMatch();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateMatch);
    } else {
      mediaQuery.addListener(updateMatch);
    }

    return () => {
      if (mediaQuery.addEventListener) {
        mediaQuery.removeEventListener('change', updateMatch);
      } else {
        mediaQuery.removeListener(updateMatch);
      }
    };
  }, [loadVipShippingSetting]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    const body = document.body;

    if (isOpen) {
      html.setAttribute('data-cart-open', 'true');
      body.setAttribute('data-cart-open', 'true');
      return () => {
        html.removeAttribute('data-cart-open');
        body.removeAttribute('data-cart-open');
      };
    }

    html.removeAttribute('data-cart-open');
    body.removeAttribute('data-cart-open');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || items.length === 0) {
      setShowCryptoCheckout(false);
    }
  }, [isOpen, items.length]);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim() || couponLoading) return;
    setCouponLoading(true);
    try {
      const res = await fetch('/api/store/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (res.ok && data.discount) {
        setDiscountCode(couponInput.trim().toUpperCase(), data.discount);
        toast.success(`Coupon applied! -$${data.discount.toFixed(2)} off`);
        setShowCoupon(false);
        setCouponInput('');
      } else {
        toast.error(data.error || 'Invalid coupon code');
      }
    } catch {
      toast.error('Failed to validate coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleContinueShopping = () => {
    closeCart();
    router.push('/store');
  };

  const nonVipSubtotal = vipShippingCharged
    ? summary.subtotal
    : items.reduce((sum, item) => {
        if (isVipProduct(item.product)) return sum;
        const itemPrice = item.product.base_price + ((item.variant as any)?.price_adjustment || 0);
        return sum + itemPrice * item.quantity;
      }, 0);

  // Portal content - renders at document.body level
  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Invisible but clickable to close cart */}
          <motion.div
            initial={shouldSkipHeavyEffects ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldSkipHeavyEffects ? undefined : { opacity: 0 }}
            transition={shouldSkipHeavyEffects ? { duration: 0 } : { duration: 0.12 }}
            onClick={closeCart}
            className="fixed inset-0"
            style={{ zIndex: CART_DRAWER_BACKDROP_Z_INDEX, background: shouldSkipHeavyEffects ? 'rgba(255,255,255,0.62)' : 'rgba(0,0,0,0.2)' }}
          />

          {/* Drawer Panel - Full height on mobile */}
          <motion.div
            initial={shouldSkipHeavyEffects ? false : (isDesktop ? { y: '-100%' } : { x: '100%' })}
            animate={isDesktop ? { y: 0 } : { x: 0 }}
            exit={shouldSkipHeavyEffects ? undefined : (isDesktop ? { y: '-100%' } : { x: '100%' })}
            transition={shouldSkipHeavyEffects ? { duration: 0 } : { type: 'tween', duration: 0.15, ease: [0.25, 1, 0.5, 1] }}
            onClick={(e) => e.stopPropagation()}
            className={
              isDesktop
                ? 'fixed top-0 left-0 right-0 w-full bg-white border-b border-black/10 flex flex-col safe-area-inset-bottom max-h-[90vh] overflow-hidden'
                : 'fixed top-0 right-0 bottom-0 w-full max-w-md bg-white border-l border-black/10 flex flex-col safe-area-inset-bottom overflow-hidden'
            }
            style={{ zIndex: CART_DRAWER_PANEL_Z_INDEX, color: '#1d1d1f', backgroundColor: '#ffffff', colorScheme: 'light' as const }}
          >
            {/* Header with Back Button */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-black/10">
              {/* Back / Close Button */}
              <button
                onClick={closeCart}
                className="h-10 w-10 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2 md:gap-3">
                <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" />
                <h2 className="text-lg md:text-xl font-light">Your Cart</h2>
                <span className="px-2 py-0.5 bg-white/10 rounded-full text-xs md:text-sm">
                  {summary.itemCount}
                </span>
              </div>
              
              <button
                onClick={closeCart}
                className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            {/* Cart Items - Scrollable */}
            <div
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-4 md:p-6"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                  <div className="w-20 h-20 rounded-full bg-black/5 flex items-center justify-center mb-6">
                    <ShoppingBag className="w-10 h-10" style={{ color: 'rgba(0,0,0,0.2)' }} />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
                    <p className="text-sm mb-6 max-w-60" style={{ color: 'rgba(0,0,0,0.5)' }}>
                    Looks like you haven't added anything yet. Explore our collection!
                  </p>
                  <button
                    onClick={handleContinueShopping}
                    className="px-6 py-3 rounded-xl text-sm font-medium active:scale-95 transition-all flex items-center gap-2"
                    style={{ background: '#111111', color: '#ffffff' }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Browse Products
                  </button>
                  <button
                    onClick={handleContinueShopping}
                    className="mt-3 text-xs transition-colors"
                    style={{ color: 'rgba(0,0,0,0.45)' }}
                  >
                    or go back to the store
                  </button>
                </div>
              ) : (
                <div className="space-y-4 md:space-y-6">
                  {items.map((item) => {
                    const vip = isVipProduct(item.product);
                    const price = item.product.base_price + (item.variant?.price_adjustment || 0);
                    const total = price * item.quantity;
                    const optionsText = Object.values((item.variant as any)?.options ?? {})
                      .filter(Boolean)
                      .join(' / ');

                    return (
                      <motion.div
                        key={item.id}
                        layout="position"
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -60 }}
                        transition={{ duration: 0.1 }}
                        className="flex gap-3 md:gap-4"
                      >
                        {/* Product Image */}
                        <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg md:rounded-xl overflow-hidden bg-black/5 shrink-0">
                          {item.product.primary_image ? (
                            <Image
                              src={(() => {
                                let src = item.product.primary_image;
                                if (src.startsWith('/http://') || src.startsWith('/https://')) {
                                  src = src.substring(1);
                                }
                                if (src.startsWith('http://') || src.startsWith('https://')) {
                                  return src;
                                }
                                return src.startsWith('/') ? src : `/${src.replace(/^public\//, '')}`;
                              })()}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                              sizes="96px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <span className="text-xl md:text-2xl" style={{ color: 'rgba(0,0,0,0.25)' }}>B</span>
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <Link 
                            href={`/store/product/${item.product.slug}`}
                            onClick={closeCart}
                            className="font-medium text-sm md:text-base transition-colors line-clamp-2"
                            style={{ color: '#111111' }}
                          >
                            <TextType text={item.product.name} typingSpeed={Math.max(5, 25 - item.product.name.length / 2)} showCursor={false} loop={false} as="span" />
                          </Link>
                          {optionsText && (
                            <p className="text-xs md:text-sm mt-0.5" style={{ color: 'rgba(0,0,0,0.45)' }}>{optionsText}</p>
                          )}
                          <p className="text-xs md:text-sm mt-1" style={{ color: 'rgba(0,0,0,0.6)' }}>{useCurrencyLocaleStore.getState().formatPrice(price)}</p>

                          {/* Quantity Controls - Larger touch targets */}
                          <div className="flex items-center justify-between mt-2 md:mt-3">
                            <div className="flex items-center h-9 md:h-8 bg-black/5 rounded-lg">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-9 md:w-8 h-full flex items-center justify-center transition-all rounded-l-lg"
                                style={{ color: 'rgba(0,0,0,0.6)' }}
                              >
                                <Minus className="w-3.5 h-3.5 md:w-3 md:h-3" />
                              </button>
                              <span className="w-8 text-center text-sm">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                disabled={!vip && typeof item.variant?.inventory_count === 'number' && item.quantity >= item.variant.inventory_count}
                                className="w-9 md:w-8 h-full flex items-center justify-center disabled:opacity-30 transition-all rounded-r-lg"
                                style={{ color: 'rgba(0,0,0,0.6)' }}
                              >
                                <Plus className="w-3.5 h-3.5 md:w-3 md:h-3" />
                              </button>
                            </div>

                            <div className="flex items-center gap-2 md:gap-3">
                              <span className="font-medium text-sm md:text-base">{useCurrencyLocaleStore.getState().formatPrice(total)}</span>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="p-1.5 active:scale-90 transition-all"
                                style={{ color: 'rgba(0,0,0,0.45)' }}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer with Summary - Safe area for mobile */}
            {items.length > 0 && (
              <div className="border-t border-black/10 p-4 md:p-6 space-y-3 md:space-y-4 pb-safe">
                {/* Summary Lines */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between" style={{ color: 'rgba(0,0,0,0.6)' }}>
                    <span>Subtotal</span>
                    <span>{useCurrencyLocaleStore.getState().formatPrice(summary.subtotal)}</span>
                  </div>
                  {summary.discount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Discount</span>
                      <span>-{useCurrencyLocaleStore.getState().formatPrice(summary.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between" style={{ color: 'rgba(0,0,0,0.6)' }}>
                    <span>Shipping</span>
                    <span>{summary.shipping === 0 ? 'Free' : useCurrencyLocaleStore.getState().formatPrice(summary.shipping)}</span>
                  </div>
                  <div className="flex justify-between" style={{ color: 'rgba(0,0,0,0.6)' }}>
                    <span>Tax</span>
                    <span>{useCurrencyLocaleStore.getState().formatPrice(summary.tax)}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between text-base md:text-lg font-medium pt-2 border-t border-black/10">
                  <span>Total</span>
                  <span>{useCurrencyLocaleStore.getState().formatPrice(summary.total)}</span>
                </div>

                {/* Free Shipping Progress */}
                {summary.shipping > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-center" style={{ color: 'rgba(0,0,0,0.45)' }}>
                      Add {useCurrencyLocaleStore.getState().formatPrice(150 - nonVipSubtotal)} more for free shipping
                    </p>
                    <div className="h-1.5 md:h-1 bg-black/10 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full"
                        style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.45), rgba(0,0,0,0.15))' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (nonVipSubtotal / 150) * 100)}%` }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                )}

                {/* Coupon Code */}
                {!discountCode ? (
                  <div className="pt-1">
                    {!showCoupon ? (
                      <button
                        onClick={() => setShowCoupon(true)}
                        className="flex items-center gap-2 text-xs transition-colors"
                        style={{ color: 'rgba(0,0,0,0.5)' }}
                      >
                        <Tag className="w-3.5 h-3.5" />
                        Have a coupon code?
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                          placeholder="Enter code"
                          className="flex-1 h-10 px-3 bg-white border border-black/10 rounded-lg text-xs
                                   placeholder:text-black/40 focus:outline-none focus:border-black/20 uppercase tracking-wider"
                          autoFocus
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={couponLoading}
                          className="h-10 px-4 border border-black/10 rounded-lg text-xs font-medium
                                   hover:bg-black/5 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                          style={{ color: '#111111' }}
                        >
                          {couponLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Apply'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs text-green-400 flex items-center gap-1.5">
                      <Tag className="w-3 h-3" /> {discountCode}
                    </span>
                    <button
                      onClick={() => setDiscountCode(null, 0)}
                      className="text-xs transition-colors"
                      style={{ color: 'rgba(0,0,0,0.45)' }}
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2 md:space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2 space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (items.length === 0) return;
                          setShowCryptoCheckout((prev) => !prev);
                        }}
                        disabled={items.length === 0}
                        className="w-full h-12 md:h-14 rounded-xl font-medium flex items-center justify-center gap-2 transition-all border border-black/15 bg-white text-black hover:bg-black/5 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <CreditCard className="w-4 h-4 md:w-5 md:h-5" />
                        {showCryptoCheckout ? 'Hide Crypto Checkout' : 'Pay with Crypto'}
                      </button>

                      <AnimatePresence initial={false}>
                        {showCryptoCheckout && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="rounded-xl border border-black/10 bg-white p-2 overflow-hidden max-h-[52vh] overflow-y-auto"
                          >
                            <CryptoCheckoutInline
                              productName={cryptoProductName}
                              productImage={cryptoProductImage}
                              priceUSD={summary.total}
                              productId={cryptoProductId}
                              variantId={cryptoVariantId}
                              quantity={1}
                              inline
                              onClose={() => setShowCryptoCheckout(false)}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (items.length === 0) return;
                        // Find the best Whop/buy URL from cart items
                        // VIP products have buy_url at top level or in details
                        for (const item of items) {
                          const p = item.product as any;
                          const buyUrl = p.buy_url || p.details?.buy_url;
                          if (buyUrl) {
                            window.open(buyUrl, '_blank', 'noopener');
                            return;
                          }
                        }
                        // Fallback: use the first item's slug on Whop
                        const slug = primaryItem?.product.slug || primaryItem?.product.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                        if (slug) {
                          window.open(`https://whop.com/checkout/${slug}`, '_blank', 'noopener');
                        }
                      }}
                      disabled={items.length === 0}
                      className="w-full h-12 md:h-14 rounded-xl font-medium
                               flex items-center justify-center gap-2 transition-all border border-black/10 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff' }}
                    >
                      <CreditCard className="w-4 h-4 md:w-5 md:h-5" />
                      Checkout on Whop
                    </button>
                    <button
                      type="button"
                      disabled
                      className="w-full h-12 md:h-14 rounded-xl font-medium
                               flex items-center justify-center gap-2 transition-all"
                      style={{ background: 'rgba(0,0,0,0.08)', color: 'rgba(0,0,0,0.4)' }}
                    >
                      <CreditCard className="w-4 h-4 md:w-5 md:h-5" />
                      Skrill - Soon
                    </button>
                    <button
                      type="button"
                      disabled
                      className="w-full h-12 md:h-14 rounded-xl font-medium
                               flex items-center justify-center gap-2 transition-all"
                      style={{ background: 'rgba(0,0,0,0.08)', color: 'rgba(0,0,0,0.4)' }}
                    >
                      <CreditCard className="w-4 h-4 md:w-5 md:h-5" />
                      Stripe - Soon
                    </button>
                  </div>
                  <button
                    onClick={clearCart}
                    className="w-full h-10 md:h-12 text-sm transition-colors"
                    style={{ color: 'rgba(0,0,0,0.6)' }}
                  >
                    Clear cart
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Use portal to render at document.body level, escaping stacking context
  if (typeof document === 'undefined') return null;

  return createPortal(drawerContent, document.body);
}
