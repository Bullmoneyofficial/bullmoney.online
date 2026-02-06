'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useCurrencyLocaleStore, LANGUAGES } from '@/stores/currency-locale-store';

// ============================================================================
// HREFLANG SEO COMPONENT
// Injects <link rel="alternate" hreflang="xx"> tags into <head>
// so Google indexes every language version of every page.
// Also sets <html lang="xx"> and dir="rtl" for Arabic/Hebrew/Urdu.
// ============================================================================

const RTL_LANGUAGES = ['ar', 'he', 'ur'];

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.bullmoney.shop';

export function HreflangMeta() {
  const language = useCurrencyLocaleStore((s) => s.language);
  const pathname = usePathname();

  useEffect(() => {
    // Set <html lang="xx"> and dir attribute
    document.documentElement.lang = language;
    document.documentElement.dir = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';
  }, [language]);

  useEffect(() => {
    // Remove any previous hreflang links we injected
    document.querySelectorAll('link[data-hreflang]').forEach((el) => el.remove());

    const currentPath = pathname || '/';

    // Add hreflang for each supported language
    LANGUAGES.forEach((lang) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = lang.code;
      link.href = `${BASE_URL}${currentPath}${currentPath.includes('?') ? '&' : '?'}lang=${lang.code}`;
      link.setAttribute('data-hreflang', 'true');
      document.head.appendChild(link);
    });

    // x-default (English)
    const defaultLink = document.createElement('link');
    defaultLink.rel = 'alternate';
    defaultLink.hreflang = 'x-default';
    defaultLink.href = `${BASE_URL}${currentPath}`;
    defaultLink.setAttribute('data-hreflang', 'true');
    document.head.appendChild(defaultLink);

    // Also add a canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `${BASE_URL}${currentPath}`);

    return () => {
      document.querySelectorAll('link[data-hreflang]').forEach((el) => el.remove());
    };
  }, [pathname, language]);

  // Also update the og:locale meta tag
  useEffect(() => {
    let ogLocale = document.querySelector('meta[property="og:locale"]');
    if (!ogLocale) {
      ogLocale = document.createElement('meta');
      ogLocale.setAttribute('property', 'og:locale');
      document.head.appendChild(ogLocale);
    }
    ogLocale.setAttribute('content', language.replace('-', '_'));

    // Add alternate locales for Open Graph
    document.querySelectorAll('meta[property="og:locale:alternate"][data-dynamic]').forEach((el) => el.remove());
    LANGUAGES.filter((l) => l.code !== language).forEach((lang) => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:locale:alternate');
      meta.setAttribute('content', lang.code.replace('-', '_'));
      meta.setAttribute('data-dynamic', 'true');
      document.head.appendChild(meta);
    });
  }, [language]);

  return null; // This component only does side-effects in <head>
}
