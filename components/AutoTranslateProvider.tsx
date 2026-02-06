'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';

// ============================================================================
// AUTO-TRANSLATE PROVIDER
// Uses Google Translate Element API to translate the entire page
// when the user changes language via the custom selector.
// Auto-detects user location on FIRST visit and applies language instantly.
// Hides the default Google Translate toolbar UI.
// ============================================================================

// Google Translate language code mapping from our store codes
const LANG_MAP: Record<string, string> = {
  en: 'en',
  es: 'es',
  fr: 'fr',
  de: 'de',
  pt: 'pt',
  it: 'it',
  ja: 'ja',
  ko: 'ko',
  zh: 'zh-CN',
  ar: 'ar',
  hi: 'hi',
  ru: 'ru',
  tr: 'tr',
  nl: 'nl',
  pl: 'pl',
  sv: 'sv',
  no: 'no',
  da: 'da',
  fi: 'fi',
  th: 'th',
  vi: 'vi',
  id: 'id',
  ms: 'ms',
  tl: 'tl',
  uk: 'uk',
  cs: 'cs',
  ro: 'ro',
  el: 'el',
  he: 'iw', // Google uses 'iw' for Hebrew
  hu: 'hu',
  bg: 'bg',
  sw: 'sw',
  af: 'af',
  zu: 'zu',
  bn: 'bn',
  ur: 'ur',
};

// Supported language codes for validation
const SUPPORTED_LANGS = new Set(Object.keys(LANG_MAP));

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement: {
          new (opts: Record<string, unknown>, elementId: string): unknown;
          InlineLayout: { SIMPLE: number };
        };
      };
    };
    googleTranslateElementInit?: () => void;
    _googleTranslateReady?: boolean;
  }
}

function setGoogleTranslateCookie(lang: string) {
  const googleLang = LANG_MAP[lang] || lang;
  if (lang === 'en') {
    // Remove translation cookie
    document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
    document.cookie = 'googtrans=; path=/; domain=' + window.location.hostname + '; expires=Thu, 01 Jan 1970 00:00:00 UTC';
  } else {
    document.cookie = `googtrans=/en/${googleLang}; path=/`;
    document.cookie = `googtrans=/en/${googleLang}; path=/; domain=${window.location.hostname}`;
  }
}

function triggerGoogleTranslate(lang: string) {
  const googleLang = LANG_MAP[lang] || lang;

  // Method 1: Use the hidden select element Google Translate creates
  const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
  if (combo) {
    if (lang === 'en') {
      // Restore original
      combo.value = '';
      combo.dispatchEvent(new Event('change'));
      // Also try clicking the "Show original" link
      const banner = document.querySelector('.goog-te-banner-frame') as HTMLIFrameElement;
      if (banner?.contentDocument) {
        const restoreBtn = banner.contentDocument.querySelector('.goog-te-button button');
        if (restoreBtn) (restoreBtn as HTMLElement).click();
      }
    } else {
      combo.value = googleLang;
      combo.dispatchEvent(new Event('change'));
    }
    return true;
  }
  return false;
}

export function AutoTranslateProvider() {
  const language = useCurrencyLocaleStore((s) => s.language);
  const setLanguage = useCurrencyLocaleStore((s) => s.setLanguage);
  const setCurrency = useCurrencyLocaleStore((s) => s.setCurrency);
  const prevLangRef = useRef(language);
  const scriptLoadedRef = useRef(false);
  const initAttemptRef = useRef(0);
  const geoDetectDoneRef = useRef(false);

  // Load Google Translate script once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;

    // Create the hidden container for Google Translate
    if (!document.getElementById('google_translate_element')) {
      const div = document.createElement('div');
      div.id = 'google_translate_element';
      div.style.position = 'absolute';
      div.style.top = '-9999px';
      div.style.left = '-9999px';
      div.style.width = '0';
      div.style.height = '0';
      div.style.overflow = 'hidden';
      document.body.appendChild(div);
    }

    // Define the callback
    window.googleTranslateElementInit = () => {
      if (!window.google?.translate) return;
      try {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: Object.values(LANG_MAP).filter(l => l !== 'en').join(','),
            layout: window.google.translate.TranslateElement.InlineLayout?.SIMPLE,
            autoDisplay: false,
          },
          'google_translate_element'
        );
        window._googleTranslateReady = true;
      } catch {
        // Ignore double-init errors
      }
    };

    // Load the script
    if (!document.querySelector('script[src*="translate.google.com"]')) {
      const script = document.createElement('script');
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.head.appendChild(script);
    }

    // Add CSS to hide Google Translate UI artifacts
    if (!document.getElementById('gt-hide-styles')) {
      const style = document.createElement('style');
      style.id = 'gt-hide-styles';
      style.textContent = `
        /* Hide Google Translate toolbar */
        .goog-te-banner-frame, .goog-te-balloon-frame,
        #goog-gt-tt, .goog-te-balloon, .goog-tooltip,
        .goog-te-banner-frame.skiptranslate,
        .goog-text-highlight { display: none !important; }
        
        /* Remove the top padding Google adds */
        body { top: 0 !important; }
        
        /* Hide the translate element */
        #google_translate_element { display: none !important; }
        
        /* Ensure translated text inherits styles properly */
        .goog-te-combo { display: none !important; }
        
        /* Remove Google's font styling overrides */
        font[style] > font[style] { background: inherit !important; }
        
        /* Fix body shift from iframe */
        .skiptranslate { display: none !important; }
        body > .skiptranslate { display: none !important; }
        body { top: 0px !important; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // ============================================================================
  // AUTO-DETECT: On first visit, detect user location and set language+currency
  // Only runs once if user has never manually chosen a language
  // ============================================================================
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (geoDetectDoneRef.current) return;
    geoDetectDoneRef.current = true;

    // Check if user has already been geo-detected or manually set a language
    const hasBeenDetected = localStorage.getItem('bullmoney-geo-detected');
    if (hasBeenDetected) return;

    // Check if a ?lang= query param is in the URL (for SEO crawlers & shared links)
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    if (urlLang && SUPPORTED_LANGS.has(urlLang)) {
      setLanguage(urlLang);
      localStorage.setItem('bullmoney-geo-detected', '1');
      return;
    }

    // FAST PATH: Check proxy cookie first (set at the edge, available instantly)
    // Only read cookies if user has given functional cookie consent
    let cookiesAllowed = false;
    try {
      const { isConsentGiven } = require('@/lib/cookieConsent');
      cookiesAllowed = isConsentGiven('functional');
    } catch {
      // Fallback: check legacy key
      const cookieConsent = localStorage.getItem('bullmoney-cookie-consent');
      cookiesAllowed = cookieConsent !== 'declined';
    }
    
    if (cookiesAllowed) {
      try {
        const cookieMatch = document.cookie.match(/bm_detected_locale=([^;]+)/);
        if (cookieMatch) {
          const localeData = JSON.parse(decodeURIComponent(cookieMatch[1]));
          if (localeData.language && SUPPORTED_LANGS.has(localeData.language) && localeData.language !== 'en') {
            setLanguage(localeData.language);
          }
          localStorage.setItem('bullmoney-geo-detected', '1');
          return; // Cookie had data, no need for API call
        }
      } catch { /* cookie parse failed, fall through to API */ }
    }

    // Auto-detect via our geo API (uses Vercel/CF headers - instant, no external API)
    const controller = new AbortController();
    fetch('/api/geo-detect', { signal: controller.signal, cache: 'default' })
      .then(res => res.json())
      .then(data => {
        if (data.language && SUPPORTED_LANGS.has(data.language) && data.language !== 'en') {
          setLanguage(data.language);
        }
        if (data.currency) {
          setCurrency(data.currency);
        }
        localStorage.setItem('bullmoney-geo-detected', '1');
      })
      .catch(() => {
        // Fallback: use browser language
        const browserLang = (navigator.language || '').split('-')[0].toLowerCase();
        if (browserLang && SUPPORTED_LANGS.has(browserLang) && browserLang !== 'en') {
          setLanguage(browserLang);
        }
        localStorage.setItem('bullmoney-geo-detected', '1');
      });

    return () => controller.abort();
  }, [setLanguage, setCurrency]);

  // Apply translation when language changes
  const applyTranslation = useCallback((lang: string) => {
    setGoogleTranslateCookie(lang);

    // Try to trigger immediately
    if (triggerGoogleTranslate(lang)) return;

    // Retry rapidly if Google Translate hasn't loaded yet
    let attempts = 0;
    const interval = setInterval(() => {
      if (triggerGoogleTranslate(lang) || attempts > 30) {
        clearInterval(interval);
      }
      attempts++;
    }, 150);

    // Cleanup after timeout
    setTimeout(() => clearInterval(interval), 5000);
  }, []);

  // Watch for language changes — apply INSTANTLY (no skip, no delay)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Always apply translation for non-English, even on first mount
    // This ensures auto-detected language gets translated immediately
    if (language === 'en') {
      // English — restore original if previously translated
      if (initAttemptRef.current > 0) {
        applyTranslation('en');
      }
      initAttemptRef.current++;
      prevLangRef.current = language;
      return;
    }
    
    // Skip if same language and already applied
    if (prevLangRef.current === language && initAttemptRef.current > 1) return;
    prevLangRef.current = language;
    initAttemptRef.current++;

    // Apply immediately — zero delay for instant feel
    applyTranslation(language);
  }, [language, applyTranslation]);

  return null; // This is a side-effect-only provider
}
