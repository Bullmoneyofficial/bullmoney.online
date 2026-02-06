import { MetadataRoute } from 'next';

/**
 * MAIN APP SITEMAP — BullMoney Trading Community (non-store pages)
 * 
 * Store pages have their own sitemap at /store/sitemap.xml
 * This sitemap covers the trading community, education, and content pages.
 * 
 * DOMAINS:
 * - Primary: https://www.bullmoney.shop
 * - Secondary: https://www.bullmoney.online
 * 
 * MULTILINGUAL SEO:
 * Every page includes hreflang alternates for all 36 supported languages.
 */

// All 36 supported languages
const ALL_LANGUAGES = [
  'en', 'es', 'fr', 'de', 'pt', 'it', 'ja', 'ko', 'zh', 'ar',
  'hi', 'ru', 'tr', 'nl', 'pl', 'sv', 'no', 'da', 'fi', 'th',
  'vi', 'id', 'ms', 'tl', 'uk', 'cs', 'ro', 'el', 'he', 'hu',
  'bg', 'sw', 'af', 'zu', 'bn', 'ur',
];

// Helper: generate language alternates for a URL
function makeLanguages(baseUrl: string, path: string): Record<string, string> {
  const separator = path.includes('?') ? '&' : '?';
  const languages: Record<string, string> = {};
  ALL_LANGUAGES.forEach(lang => {
    languages[lang] = `${baseUrl}${path}${separator}lang=${lang}`;
  });
  return languages;
}

// APP PAGES ONLY — Store pages are in /store/sitemap.ts
const PAGES = [
  { path: '/',         changeFrequency: 'hourly' as const,  priority: 1.0 },
  { path: '/about',    changeFrequency: 'daily' as const,   priority: 0.95 },
  { path: '/Blogs',    changeFrequency: 'hourly' as const,  priority: 1.0 },
  { path: '/Prop',     changeFrequency: 'daily' as const,   priority: 0.9 },
  { path: '/recruit',  changeFrequency: 'weekly' as const,  priority: 0.8 },
  { path: '/course',   changeFrequency: 'daily' as const,   priority: 0.9 },
  { path: '/community',changeFrequency: 'daily' as const,   priority: 0.85 },
  { path: '/journal',  changeFrequency: 'daily' as const,   priority: 0.8 },
  { path: '/VIP',      changeFrequency: 'weekly' as const,  priority: 0.85 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const primaryDomain = 'https://www.bullmoney.shop';
  const secondaryDomain = 'https://www.bullmoney.online';
  const currentDate = new Date().toISOString();

  const entries: MetadataRoute.Sitemap = [];

  // Generate entries for each page on both domains, with language alternates
  for (const page of PAGES) {
    // Primary domain entry with all language alternates
    entries.push({
      url: `${primaryDomain}${page.path}`,
      lastModified: currentDate,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: {
        languages: makeLanguages(primaryDomain, page.path),
      },
    });

    // Secondary domain entry
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

  // Static assets (no language alternates needed)
  entries.push({
    url: `${primaryDomain}/ONcc2l601.svg`,
    lastModified: currentDate,
    changeFrequency: 'yearly',
    priority: 0.5,
  });
  entries.push({
    url: `${secondaryDomain}/ONcc2l601.svg`,
    lastModified: currentDate,
    changeFrequency: 'yearly',
    priority: 0.5,
  });

  return entries;
}
