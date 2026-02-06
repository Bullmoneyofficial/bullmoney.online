import { MetadataRoute } from 'next';

/**
 * STORE SITEMAP — Separate sitemap for BullMoney Store (e-commerce)
 * 
 * This covers ALL store-specific pages:
 * - Store Home (/store)
 * - Store Products (/products)
 * - Product Detail Pages (/store/product/[slug]) — dynamically fetched
 * - Gift Cards (/store/gift-cards)
 * - Checkout (/store/checkout)
 * - Account (/store/account)
 * - Order Success (/store/success)
 * 
 * MULTILINGUAL: Every page has 36 language alternates for global SEO.
 * DOMAINS: Primary (bullmoney.shop) + Secondary (bullmoney.online)
 * 
 * Google sees this at: /store/sitemap.xml
 */

// All 36 supported languages
const ALL_LANGUAGES = [
  'en', 'es', 'fr', 'de', 'pt', 'it', 'ja', 'ko', 'zh', 'ar',
  'hi', 'ru', 'tr', 'nl', 'pl', 'sv', 'no', 'da', 'fi', 'th',
  'vi', 'id', 'ms', 'tl', 'uk', 'cs', 'ro', 'el', 'he', 'hu',
  'bg', 'sw', 'af', 'zu', 'bn', 'ur',
];

function makeLanguages(baseUrl: string, path: string): Record<string, string> {
  const separator = path.includes('?') ? '&' : '?';
  const languages: Record<string, string> = {};
  ALL_LANGUAGES.forEach(lang => {
    languages[lang] = `${baseUrl}${path}${separator}lang=${lang}`;
  });
  return languages;
}

// ============================================================================
// STATIC STORE PAGES
// ============================================================================
const STORE_PAGES = [
  // Store Home
  { path: '/store',              changeFrequency: 'daily' as const,   priority: 1.0 },
  // Products browsing page
  { path: '/products',           changeFrequency: 'daily' as const,   priority: 0.95 },
  // Gift Cards
  { path: '/store/gift-cards',   changeFrequency: 'weekly' as const,  priority: 0.8 },
  // Checkout
  { path: '/store/checkout',     changeFrequency: 'weekly' as const,  priority: 0.7 },
  // Customer Account
  { path: '/store/account',      changeFrequency: 'weekly' as const,  priority: 0.6 },
  // Order Success
  { path: '/store/success',      changeFrequency: 'weekly' as const,  priority: 0.5 },
  // Socials / social links
  { path: '/socials',            changeFrequency: 'weekly' as const,  priority: 0.75 },
];

// ============================================================================
// DYNAMIC PRODUCT PAGES — Fetched from API
// ============================================================================
async function getProductSlugs(): Promise<string[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://www.bullmoney.shop';
    const res = await fetch(`${baseUrl}/api/store/products`, {
      next: { revalidate: 3600 }, // re-fetch product list every hour
    });
    if (!res.ok) return [];
    const products = await res.json();
    if (Array.isArray(products)) {
      return products
        .filter((p: any) => p.slug && p.is_active !== false)
        .map((p: any) => p.slug);
    }
    return [];
  } catch {
    return [];
  }
}

export default async function storeSitemap(): Promise<MetadataRoute.Sitemap> {
  const primaryDomain = 'https://www.bullmoney.shop';
  const secondaryDomain = 'https://www.bullmoney.online';
  const currentDate = new Date().toISOString();

  const entries: MetadataRoute.Sitemap = [];

  // ── Static store pages on both domains ──
  for (const page of STORE_PAGES) {
    entries.push({
      url: `${primaryDomain}${page.path}`,
      lastModified: currentDate,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: {
        languages: makeLanguages(primaryDomain, page.path),
      },
    });
    entries.push({
      url: `${secondaryDomain}${page.path}`,
      lastModified: currentDate,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: {
        languages: makeLanguages(secondaryDomain, page.path),
      },
    });
  }

  // ── Dynamic product detail pages ──
  const slugs = await getProductSlugs();
  for (const slug of slugs) {
    const path = `/store/product/${slug}`;
    entries.push({
      url: `${primaryDomain}${path}`,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 0.85,
      alternates: {
        languages: makeLanguages(primaryDomain, path),
      },
    });
    entries.push({
      url: `${secondaryDomain}${path}`,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 0.85,
      alternates: {
        languages: makeLanguages(secondaryDomain, path),
      },
    });
  }

  return entries;
}
