'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';

// ============================================================================
// GLOBAL TRANSLATION HOOK
// Fetches translations from Supabase for the selected language.
// Falls back to English. Caches in memory + localStorage.
// When language changes, ALL text on the site updates reactively.
// ============================================================================

// In-memory cache shared across all hook instances
const translationCache: Record<string, Record<string, string>> = {};
const fetchPromises: Record<string, Promise<Record<string, string>>> = {};

async function loadTranslations(lang: string): Promise<Record<string, string>> {
  // Already cached
  if (translationCache[lang]) return translationCache[lang];

  // Already fetching
  if (lang in fetchPromises) return fetchPromises[lang];

  fetchPromises[lang] = (async () => {
    // Try localStorage first
    const cacheKey = `bullmoney-i18n-${lang}`;
    const cached = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null;
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed._ts && Date.now() - parsed._ts < 1000 * 60 * 60) { // 1 hour cache
          delete parsed._ts;
          translationCache[lang] = parsed;
          return parsed;
        }
      } catch {}
    }

    // Fetch from API
    try {
      const res = await fetch(`/api/i18n/${lang}`);
      if (res.ok) {
        const data = await res.json();
        translationCache[lang] = data.translations || {};
        // Persist to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(cacheKey, JSON.stringify({ ...translationCache[lang], _ts: Date.now() }));
        }
        return translationCache[lang];
      }
    } catch {}

    translationCache[lang] = {};
    return {};
  })();

  return fetchPromises[lang];
}

/**
 * Global translation hook.
 * 
 * Usage:
 *   const { t } = useTranslation();
 *   t('store.addToCart')  // => "Add to Cart" (en) or "Agregar al carrito" (es)
 *   t('store.addToCart', 'Add to Cart')  // with fallback
 */
export function useTranslation() {
  const language = useCurrencyLocaleStore((s) => s.language);
  const [translations, setTranslations] = useState<Record<string, string>>(
    translationCache[language] || {}
  );
  const [loading, setLoading] = useState(false);
  const prevLang = useRef(language);

  useEffect(() => {
    if (language === 'en') {
      setTranslations({});
      return;
    }

    let cancelled = false;
    setLoading(true);
    
    loadTranslations(language).then((t) => {
      if (!cancelled) {
        setTranslations(t);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [language]);

  const t = useCallback((key: string, fallback?: string): string => {
    // English is the default — just return fallback
    if (language === 'en') return fallback || key;
    
    // Check translations
    if (translations[key]) return translations[key];
    
    // Return fallback or the key itself
    return fallback || key;
  }, [language, translations]);

  return { t, language, loading, isTranslated: language !== 'en' };
}

// ============================================================================
// DEFAULT ENGLISH STRINGS (source of truth for translation keys)
// These are used as fallbacks and as the keys to translate from.
// ============================================================================
export const DEFAULT_STRINGS: Record<string, string> = {
  // Common
  'common.addToCart': 'Add to Cart',
  'common.buyNow': 'Buy Now',
  'common.shopNow': 'Shop Now',
  'common.viewAll': 'View All',
  'common.backToStore': 'Back to Store',
  'common.search': 'Search',
  'common.filter': 'Filters',
  'common.sort': 'Sort',
  'common.close': 'Close',
  'common.apply': 'Apply',
  'common.clear': 'Clear',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.loading': 'Loading...',
  'common.noResults': 'No results found',
  'common.seeMore': 'See More',
  'common.inStock': 'In stock',
  'common.outOfStock': 'Out of stock',
  'common.soldOut': 'Sold out',
  'common.freeShipping': 'Free Shipping',
  'common.featured': 'Featured',
  'common.new': 'New',
  'common.sale': 'Sale',

  // Store
  'store.title': 'Store',
  'store.searchProducts': 'Search products...',
  'store.allProducts': 'All Products',
  'store.categories': 'Categories',
  'store.apparel': 'Apparel',
  'store.accessories': 'Accessories',
  'store.tech': 'Tech & Gear',
  'store.homeOffice': 'Home Office',
  'store.drinkware': 'Drinkware',
  'store.limitedEdition': 'Limited Edition',
  'store.giftCards': 'Gift Cards',
  'store.newest': 'Newest',
  'store.priceLowHigh': 'Price: Low to High',
  'store.priceHighLow': 'Price: High to Low',
  'store.mostPopular': 'Most Popular',
  'store.bestSelling': 'Best Selling',

  // Product
  'product.addedToCart': 'Added to cart',
  'product.addedToWishlist': 'Added to wishlist',
  'product.removedFromWishlist': 'Removed from wishlist',
  'product.sizeGuide': 'Size Guide',
  'product.shippingReturns': 'Shipping & Returns',
  'product.share': 'Share',
  'product.details': 'Details',
  'product.reviews': 'Reviews',
  'product.relatedProducts': 'Related Products',
  'product.recentlyViewed': 'Recently Viewed',
  'product.backInStock': 'Notify Me When Available',
  'product.onlyLeft': 'Only {{count}} left',
  'product.material': 'Material',
  'product.dimensions': 'Dimensions',
  'product.care': 'Care',

  // Cart
  'cart.title': 'Cart',
  'cart.empty': 'Your cart is empty',
  'cart.emptyMessage': 'Looks like you haven\'t added any items to your cart yet.',
  'cart.browseProducts': 'Browse Products',
  'cart.subtotal': 'Subtotal',
  'cart.shipping': 'Shipping',
  'cart.tax': 'Tax',
  'cart.total': 'Total',
  'cart.checkout': 'Checkout',
  'cart.continueShopping': 'Continue Shopping',
  'cart.couponCode': 'Coupon code',
  'cart.applyCoupon': 'Apply',
  'cart.removeCoupon': 'Remove',
  'cart.freeShippingAt': 'Free shipping on orders over $150',
  'cart.items': '{{count}} items',

  // Account
  'account.title': 'My Account',
  'account.overview': 'Overview',
  'account.orders': 'Orders',
  'account.wishlist': 'Wishlist',
  'account.addresses': 'Addresses',
  'account.settings': 'Settings',
  'account.signIn': 'Sign In',
  'account.signOut': 'Sign Out',
  'account.noOrders': 'No orders yet',
  'account.orderHistory': 'Order History',
  'account.savedAddresses': 'Saved Addresses',

  // Shipping
  'shipping.title': 'Shipping Policy',
  'shipping.returns': 'Returns',
  'shipping.warranty': 'Warranty',
  'shipping.freeOver': 'Free shipping on orders over $150',
  'shipping.processing': 'Orders processed within 1-2 business days',
  'shipping.returnPolicy': '30-day return policy',

  // Footer
  'footer.stayUpdated': 'Stay Updated',
  'footer.subscribe': 'Subscribe',
  'footer.terms': 'Terms & Privacy',
  'footer.copyright': '© {{year}} Bullmoney. All rights reserved.',
  'footer.securePayments': 'Secure payments via',

  // Navigation
  'nav.home': 'Home',
  'nav.shop': 'Shop',
  'nav.menu': 'Menu',
  'nav.account': 'Account',
  'nav.backToHome': 'Back to Home',

  // Hero / Marketing
  'hero.tagline': 'The trading community that levelled the game',
  'hero.premiumGear': 'Premium trading lifestyle apparel and accessories.',
  'hero.designedForTraders': 'Designed for traders who move markets.',
};
