/**
 * SEED TRANSLATIONS SCRIPT
 * 
 * Generates translations for all supported languages using free Google Translate API
 * and stores them in the Supabase site_translations table.
 * 
 * Usage: npx tsx scripts/seed-translations.ts
 * 
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// All default English strings (copy from hooks/useTranslation.ts DEFAULT_STRINGS)
const DEFAULT_STRINGS: Record<string, string> = {
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
  'product.material': 'Material',
  'product.dimensions': 'Dimensions',
  'product.care': 'Care',
  'cart.title': 'Cart',
  'cart.empty': 'Your cart is empty',
  'cart.emptyMessage': "Looks like you haven't added any items to your cart yet.",
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
  'shipping.title': 'Shipping Policy',
  'shipping.returns': 'Returns',
  'shipping.warranty': 'Warranty',
  'shipping.freeOver': 'Free shipping on orders over $150',
  'shipping.processing': 'Orders processed within 1-2 business days',
  'shipping.returnPolicy': '30-day return policy',
  'footer.stayUpdated': 'Stay Updated',
  'footer.subscribe': 'Subscribe',
  'footer.terms': 'Terms & Privacy',
  'footer.securePayments': 'Secure payments via',
  'nav.home': 'Home',
  'nav.shop': 'Shop',
  'nav.menu': 'Menu',
  'nav.account': 'Account',
  'nav.backToHome': 'Back to Home',
  'hero.tagline': 'The trading community that levelled the game',
  'hero.premiumGear': 'Premium trading lifestyle apparel and accessories.',
  'hero.designedForTraders': 'Designed for traders who move markets.',
};

const TARGET_LANGUAGES = [
  'es', 'fr', 'de', 'pt', 'it', 'ja', 'ko', 'zh', 'ar', 'hi',
  'ru', 'tr', 'nl', 'pl', 'sv', 'no', 'da', 'fi', 'th', 'vi',
  'id', 'ms', 'tl', 'uk', 'cs', 'ro', 'el', 'he', 'hu', 'bg',
  'sw', 'af', 'zu', 'bn', 'ur',
];

// Free Google Translate API (no key needed, limited usage)
async function translateText(text: string, targetLang: string): Promise<string> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();
    // Response is nested arrays: [[["translated text","original text",...]]]
    if (data?.[0]) {
      return data[0].map((segment: any[]) => segment[0]).join('');
    }
    return text;
  } catch {
    return text;
  }
}

async function seedLanguage(lang: string) {
  console.log(`\n🌐 Translating to ${lang}...`);
  const entries = Object.entries(DEFAULT_STRINGS);
  const rows: any[] = [];

  for (let i = 0; i < entries.length; i++) {
    const [key, englishValue] = entries[i];
    
    // Skip template variables — translate the text parts only
    const translated = await translateText(englishValue, lang);
    rows.push({
      language_code: lang,
      translation_key: key,
      translation_value: translated,
      is_verified: false,
      updated_at: new Date().toISOString(),
    });

    // Rate limit: small delay between requests
    if (i % 10 === 0) {
      process.stdout.write(`  ${i + 1}/${entries.length} `);
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  // Upsert all at once
  const { error } = await supabase
    .from('site_translations')
    .upsert(rows, { onConflict: 'language_code,translation_key' });

  if (error) {
    console.error(`  ❌ Error for ${lang}:`, error.message);
  } else {
    console.log(`  ✅ ${lang}: ${rows.length} translations saved`);
  }
}

async function main() {
  console.log('🚀 Seeding translations for', TARGET_LANGUAGES.length, 'languages...');
  console.log('   Total strings:', Object.keys(DEFAULT_STRINGS).length);

  for (const lang of TARGET_LANGUAGES) {
    await seedLanguage(lang);
    // Delay between languages to avoid rate limiting
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log('\n✅ All translations seeded!');
  process.exit(0);
}

main().catch(console.error);
