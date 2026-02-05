'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag, ArrowRight, ChevronLeft, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cart-store';

// ============================================================================
// CART DRAWER - SLIDE-OUT PANEL WITH PORTAL
// Uses React Portal to escape stacking context and appear above all content
// ============================================================================

export function CartDrawer() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { 
    items, 
    isOpen, 
    closeCart, 
    removeItem, 
    updateQuantity, 
    getSummary,
    clearCart,
  } = useCartStore();

  const summary = getSummary();

  // Mount check for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleContinueShopping = () => {
    closeCart();
    router.push('/store');
  };

  // Portal content - renders at document.body level
  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Invisible but clickable to close cart */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0"
            style={{ zIndex: 2147483648, background: 'transparent' }}
          />

          {/* Drawer Panel - Full height on mobile */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-black border-l border-white/10 flex flex-col safe-area-inset-bottom"
            style={{ zIndex: 2147483649 }}
          >
            {/* Header with Back Button */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10">
              {/* Back / Close Button */}
              <button
                onClick={closeCart}
                className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
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
                className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            {/* Cart Items - Scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <ShoppingBag className="w-14 h-14 md:w-16 md:h-16 text-white/20 mb-4" />
                  <p className="text-white/60 mb-4 md:mb-6">Your cart is empty</p>
                  <button
                    onClick={handleContinueShopping}
                    className="px-5 py-2.5 md:px-6 md:py-3 bg-white text-black rounded-xl text-sm md:text-base hover:bg-white/90 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4 md:space-y-6">
                  {items.map((item) => {
                    const price = item.product.base_price + item.variant.price_adjustment;
                    const total = price * item.quantity;
                    const optionsText = Object.values(item.variant.options)
                      .filter(Boolean)
                      .join(' / ');

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="flex gap-3 md:gap-4"
                      >
                        {/* Product Image */}
                        <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg md:rounded-xl overflow-hidden bg-white/5 shrink-0">
                          {item.product.primary_image ? (
                            <Image
                              src={item.product.primary_image}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                              sizes="96px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-white/20 text-xl md:text-2xl">B</span>
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <Link 
                            href={`/store/product/${item.product.slug}`}
                            onClick={closeCart}
                            className="font-medium text-sm md:text-base hover:text-white/80 transition-colors line-clamp-2"
                          >
                            {item.product.name}
                          </Link>
                          {optionsText && (
                            <p className="text-white/40 text-xs md:text-sm mt-0.5">{optionsText}</p>
                          )}
                          <p className="text-white/60 text-xs md:text-sm mt-1">${price.toFixed(2)}</p>

                          {/* Quantity Controls - Larger touch targets */}
                          <div className="flex items-center justify-between mt-2 md:mt-3">
                            <div className="flex items-center h-9 md:h-8 bg-white/5 rounded-lg">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-9 md:w-8 h-full flex items-center justify-center text-white/60 hover:text-white active:bg-white/10 transition-all rounded-l-lg"
                              >
                                <Minus className="w-3.5 h-3.5 md:w-3 md:h-3" />
                              </button>
                              <span className="w-8 text-center text-sm">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                disabled={item.quantity >= item.variant.inventory_count}
                                className="w-9 md:w-8 h-full flex items-center justify-center text-white/60 hover:text-white disabled:opacity-30 active:bg-white/10 transition-all rounded-r-lg"
                              >
                                <Plus className="w-3.5 h-3.5 md:w-3 md:h-3" />
                              </button>
                            </div>

                            <div className="flex items-center gap-2 md:gap-3">
                              <span className="font-medium text-sm md:text-base">${total.toFixed(2)}</span>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="p-1.5 text-white/40 hover:text-white active:scale-90 transition-all"
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
              <div className="border-t border-white/10 p-4 md:p-6 space-y-3 md:space-y-4 pb-safe">
                {/* Summary Lines */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-white/60">
                    <span>Subtotal</span>
                    <span>${summary.subtotal.toFixed(2)}</span>
                  </div>
                  {summary.discount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Discount</span>
                      <span>-${summary.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white/60">
                    <span>Shipping</span>
                    <span>{summary.shipping === 0 ? 'Free' : `$${summary.shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Tax</span>
                    <span>${summary.tax.toFixed(2)}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between text-base md:text-lg font-medium pt-2 border-t border-white/10">
                  <span>Total</span>
                  <span>${summary.total.toFixed(2)}</span>
                </div>

                {/* Free Shipping Progress */}
                {summary.shipping > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-white/40 text-center">
                      Add ${(150 - summary.subtotal).toFixed(2)} more for free shipping
                    </p>
                    <div className="h-1.5 md:h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-linear-to-r from-white/80 to-white"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (summary.subtotal / 150) * 100)}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2 md:space-y-3 pt-1">
                  <Link
                    href="/store/checkout"
                    onClick={closeCart}
                    className="w-full h-12 md:h-14 bg-white text-black rounded-xl font-medium
                             flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] transition-all"
                  >
                    Checkout
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                  </Link>
                  <button
                    onClick={clearCart}
                    className="w-full h-10 md:h-12 text-white/60 hover:text-white text-sm active:text-white/80 transition-colors"
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
  if (!mounted) return null;
  
  return createPortal(drawerContent, document.body);
}
