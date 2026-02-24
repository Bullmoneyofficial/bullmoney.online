'use client';

/**
 * useStoreCartActions.ts
 *
 * Encapsulates all cart + checkout logic:
 *  - isVipProduct / canAddToCart detection
 *  - handleAddToCart, handleAddClick (desktop quick-add panel)
 *  - confirmExpandedAdd
 *  - handleCheckoutAction (cart / whop / skrill / stripe)
 *  - handleExpandedBuy (quick-add panel payment methods)
 *  - handleStoreTelegramUnlock
 */

import { useCallback, useState } from 'react';
import type { ProductWithDetails } from '@/types/store';
import type { PaymentMethod } from '../_types/store-page.types';
import { useCartStore } from '@/stores/cart-store';

export function useStoreCartActions(isDesktop: boolean) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const getItemCount = useCartStore((s) => s.getItemCount);
  const cartCount = getItemCount();

  // ── Expanded (desktop quick-add) product ──────────────────────────────
  const [expandedProduct, setExpandedProduct] = useState<ProductWithDetails | null>(null);

  // ── Checkout modal state ──────────────────────────────────────────────
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState<ProductWithDetails | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cart');

  // ── Product media viewer ──────────────────────────────────────────────
  const [viewerProduct, setViewerProduct] = useState<ProductWithDetails | null>(null);
  const [viewerMounted, setViewerMounted] = useState(false);

  // ── VIP detection ─────────────────────────────────────────────────────
  const isVipProduct = useCallback((product: ProductWithDetails): boolean => {
    return Boolean(
      (product as any).buy_url ||
        (product as any)._source === 'vip' ||
        (product.details as any)?.buy_url
    );
  }, []);

  const canAddToCart = useCallback(
    (product: ProductWithDetails): boolean => {
      if (isVipProduct(product)) return true;
      const variant = product.variants?.[0];
      return Boolean(variant && variant.inventory_count > 0);
    },
    [isVipProduct]
  );

  // ── Core add to cart ──────────────────────────────────────────────────
  const handleAddToCart = useCallback(
    (product: ProductWithDetails) => {
      const variant = product.variants?.[0];
      if (isVipProduct(product)) {
        const syntheticVariant = {
          id: `vip-${product.id}`,
          name: (variant as any)?.name || 'Default',
          price_adjustment: (variant as any)?.price_adjustment || 0,
          inventory_count: 999,
          sort_order: 0,
        };
        addItem(product, syntheticVariant as any, 1);
        return;
      }
      if (!variant || variant.inventory_count <= 0) return;
      addItem(product, variant, 1);
    },
    [addItem, isVipProduct]
  );

  // ── "Add" click — opens quick-add panel on desktop ────────────────────
  const handleAddClick = useCallback(
    (product: ProductWithDetails) => {
      const desktopNow =
        typeof window !== 'undefined'
          ? window.matchMedia('(min-width: 1024px)').matches
          : isDesktop;
      handleAddToCart(product);
      if (desktopNow) setExpandedProduct(product);
    },
    [handleAddToCart, isDesktop]
  );

  const confirmExpandedAdd = useCallback(() => {
    if (!expandedProduct) return;
    handleAddToCart(expandedProduct);
    setExpandedProduct(null);
  }, [expandedProduct, handleAddToCart]);

  // ── Checkout modal action ─────────────────────────────────────────────
  const handleCheckoutAction = useCallback(async () => {
    if (!checkoutProduct) return;
    const variant = checkoutProduct.variants?.[0];
    const vip = isVipProduct(checkoutProduct);
    if (!vip && (!variant || variant.inventory_count <= 0)) return;

    if (paymentMethod === 'cart') {
      if (vip) {
        const syntheticVariant = {
          id: `vip-${checkoutProduct.id}`,
          name: (variant as any)?.name || 'Default',
          price_adjustment: (variant as any)?.price_adjustment || 0,
          inventory_count: 999,
          sort_order: 0,
        };
        addItem(checkoutProduct, syntheticVariant as any, 1);
      } else {
        addItem(checkoutProduct, variant!, 1);
      }
      setCheckoutOpen(false);
      return;
    }

    if (paymentMethod === 'whop') {
      const buyUrl =
        (checkoutProduct as any).buy_url ||
        (checkoutProduct.details as { buy_url?: string } | undefined)?.buy_url;
      const checkoutUrl = buyUrl || `https://whop.com/checkout/${checkoutProduct.slug}`;
      window.open(checkoutUrl, '_blank');
      setCheckoutOpen(false);
      return;
    }

    if (paymentMethod === 'skrill') {
      try {
        const response = await fetch('/api/skrill/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: checkoutProduct.id,
            variantId: variant?.id,
            name: checkoutProduct.name,
            description: checkoutProduct.description,
            price: checkoutProduct.base_price + (variant?.price_adjustment ?? 0),
            quantity: 1,
            image: checkoutProduct.primary_image,
          }),
        });
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      } catch (err) {
        console.error('Skrill checkout error:', err);
      }
    }
  }, [addItem, checkoutProduct, isVipProduct, paymentMethod]);

  // ── Desktop quick-add panel payment buttons ───────────────────────────
  const handleExpandedBuy = useCallback(
    async (method: PaymentMethod) => {
      if (!expandedProduct) return;
      const variant = expandedProduct.variants?.[0];
      const vip = isVipProduct(expandedProduct);
      if (!vip && (!variant || variant.inventory_count <= 0)) return;

      if (method === 'cart') {
        if (vip) {
          const syntheticVariant = {
            id: `vip-${expandedProduct.id}`,
            name: (variant as any)?.name || 'Default',
            price_adjustment: (variant as any)?.price_adjustment || 0,
            inventory_count: 999,
            sort_order: 0,
          };
          addItem(expandedProduct, syntheticVariant as any, 1);
          setExpandedProduct(null);
          return;
        }
        confirmExpandedAdd();
        return;
      }

      if (method === 'whop') {
        const buyUrl =
          (expandedProduct as any).buy_url ||
          (expandedProduct.details as { buy_url?: string } | undefined)?.buy_url;
        const checkoutUrl = buyUrl || `https://whop.com/checkout/${expandedProduct.slug}`;
        window.open(checkoutUrl, '_blank');
        setExpandedProduct(null);
        return;
      }

      if (method === 'skrill') {
        try {
          const response = await fetch('/api/skrill/create-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: expandedProduct.id,
              variantId: variant?.id,
              name: expandedProduct.name,
              description: expandedProduct.description,
              price: expandedProduct.base_price + (variant?.price_adjustment ?? 0),
              quantity: 1,
              image: expandedProduct.primary_image,
            }),
          });
          const data = await response.json();
          if (data.url) {
            window.location.href = data.url;
            return;
          }
        } catch (err) {
          console.error('Skrill checkout error:', err);
        }
      }
    },
    [addItem, confirmExpandedAdd, expandedProduct, isVipProduct]
  );

  // ── Telegram gate unlock ───────────────────────────────────────────────
  const handleStoreTelegramUnlock = useCallback(() => {
    localStorage.setItem('bullmoney_telegram_confirmed', 'true');

    const alreadyRedirected = localStorage.getItem('bullmoney_xm_redirect_done');
    if (alreadyRedirected !== 'true') {
      try {
        navigator.clipboard.writeText('X3R7P').catch(() => {});
      } catch {}
      const xmTab = window.open('https://affs.click/t5wni', '_blank');
      try {
        xmTab?.blur();
        window.focus();
      } catch {}
      setTimeout(() => {
        const vTab = window.open('https://vigco.co/iQbe2u', '_blank');
        try {
          vTab?.blur();
          window.focus();
        } catch {}
      }, 600);
      localStorage.setItem('bullmoney_xm_redirect_done', 'true');
    }
  }, []);

  return {
    // Cart
    cartCount,
    // Expanded panel
    expandedProduct,
    setExpandedProduct,
    // Checkout modal
    checkoutOpen,
    setCheckoutOpen,
    checkoutProduct,
    setCheckoutProduct,
    paymentMethod,
    setPaymentMethod,
    // Viewer
    viewerProduct,
    setViewerProduct,
    viewerMounted,
    setViewerMounted,
    // Helpers
    isVipProduct,
    canAddToCart,
    handleAddToCart,
    handleAddClick,
    confirmExpandedAdd,
    handleCheckoutAction,
    handleExpandedBuy,
    handleStoreTelegramUnlock,
  };
}
