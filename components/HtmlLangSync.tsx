'use client';

import { useEffect } from 'react';
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';

// ============================================================================
// HTML LANG SYNC
// Keeps the <html lang="..."> attribute and dir in sync with the Zustand
// language store on every page. Runs once on hydration and reactively when
// the user changes language via CurrencyLanguageSelector (anywhere in the app).
// ============================================================================

export function HtmlLangSync() {
  const language = useCurrencyLocaleStore((s) => s.language);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Update <html lang>
    document.documentElement.lang = language;

    // RTL support
    const rtlLanguages = ['ar', 'he', 'ur'];
    document.documentElement.dir = rtlLanguages.includes(language) ? 'rtl' : 'ltr';
  }, [language]);

  return null; // side-effect only
}
