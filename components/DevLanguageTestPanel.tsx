'use client';

import { useState, useEffect } from 'react';
import { useCurrencyLocaleStore, LANGUAGES, CURRENCIES } from '@/stores/currency-locale-store';

// ============================================================================
// DEV LANGUAGE TEST PANEL
// Floating panel for developers to test language/geo detection.
// Only rendered in development mode (process.env.NODE_ENV === 'development').
// 
// Features:
// - Quick switch between all 36 languages
// - Simulate geo-detection from any country
// - See current detected locale state
// - Reset geo-detection to test first-visit flow
// - Test ?lang= URL params
// ============================================================================

const COUNTRY_PRESETS = [
  { country: 'US', lang: 'en', currency: 'USD', label: '🇺🇸 USA' },
  { country: 'ES', lang: 'es', currency: 'EUR', label: '🇪🇸 Spain' },
  { country: 'FR', lang: 'fr', currency: 'EUR', label: '🇫🇷 France' },
  { country: 'DE', lang: 'de', currency: 'EUR', label: '🇩🇪 Germany' },
  { country: 'BR', lang: 'pt', currency: 'BRL', label: '🇧🇷 Brazil' },
  { country: 'JP', lang: 'ja', currency: 'JPY', label: '🇯🇵 Japan' },
  { country: 'KR', lang: 'ko', currency: 'KRW', label: '🇰🇷 Korea' },
  { country: 'CN', lang: 'zh', currency: 'CNY', label: '🇨🇳 China' },
  { country: 'SA', lang: 'ar', currency: 'SAR', label: '🇸🇦 Saudi' },
  { country: 'IN', lang: 'hi', currency: 'INR', label: '🇮🇳 India' },
  { country: 'RU', lang: 'ru', currency: 'RUB', label: '🇷🇺 Russia' },
  { country: 'TR', lang: 'tr', currency: 'TRY', label: '🇹🇷 Turkey' },
  { country: 'TH', lang: 'th', currency: 'THB', label: '🇹🇭 Thailand' },
  { country: 'VN', lang: 'vi', currency: 'VND', label: '🇻🇳 Vietnam' },
  { country: 'PK', lang: 'ur', currency: 'PKR', label: '🇵🇰 Pakistan' },
  { country: 'ZA', lang: 'af', currency: 'ZAR', label: '🇿🇦 S.Africa' },
];

export function DevLanguageTestPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [geoStatus, setGeoStatus] = useState<string>('unknown');
  const language = useCurrencyLocaleStore((s) => s.language);
  const currency = useCurrencyLocaleStore((s) => s.currency);
  const setLanguage = useCurrencyLocaleStore((s) => s.setLanguage);
  const setCurrency = useCurrencyLocaleStore((s) => s.setCurrency);

  useEffect(() => {
    const detected = localStorage.getItem('bullmoney-geo-detected');
    setGeoStatus(detected ? 'detected' : 'not-detected');
  }, [language]);

  const simulateCountry = (lang: string, curr: string) => {
    setLanguage(lang);
    setCurrency(curr);
  };

  const resetGeoDetection = () => {
    localStorage.removeItem('bullmoney-geo-detected');
    localStorage.removeItem('bullmoney-locale');
    // Remove middleware cookie
    document.cookie = 'bm_detected_locale=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
    setGeoStatus('not-detected');
    window.location.reload();
  };

  const testLangParam = (lang: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.location.href = url.toString();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-99999997 w-10 h-10 rounded-full flex items-center justify-center text-sm cursor-pointer"
        style={{
          background: 'rgba(255, 255, 0, 0.15)',
          border: '1px solid rgba(255, 255, 0, 0.3)',
          color: '#ff0',
          backdropFilter: 'blur(8px)',
        }}
        title="Dev: Language Test Panel"
      >
        🌐
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-4 left-4 z-99999997 w-80 max-h-[80vh] overflow-y-auto rounded-xl p-4 text-xs"
      style={{
        background: 'rgba(0, 0, 0, 0.95)',
        border: '1px solid rgba(255, 255, 0, 0.2)',
        color: '#fff',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-yellow-400 font-bold text-sm">🌐 Dev: i18n Test</span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white/50 hover:text-white cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Current State */}
      <div
        className="rounded-lg p-2.5 mb-3"
        style={{ background: 'rgba(255, 255, 255, 0.05)' }}
      >
        <div className="text-white/40 mb-1">Current State</div>
        <div className="grid grid-cols-2 gap-1">
          <div>Language: <span className="text-green-400">{language}</span></div>
          <div>Currency: <span className="text-blue-400">{currency}</span></div>
          <div>Geo: <span className={geoStatus === 'detected' ? 'text-green-400' : 'text-red-400'}>{geoStatus}</span></div>
          <div>Dir: <span className="text-purple-400">{typeof document !== 'undefined' ? document.dir : 'ltr'}</span></div>
        </div>
      </div>

      {/* Simulate Country */}
      <div className="mb-3">
        <div className="text-white/40 mb-1.5">Simulate Country</div>
        <div className="grid grid-cols-4 gap-1">
          {COUNTRY_PRESETS.map((c) => (
            <button
              key={c.country}
              onClick={() => simulateCountry(c.lang, c.currency)}
              className={`py-1 px-1.5 rounded text-[10px] cursor-pointer transition-all ${
                language === c.lang
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-white/5 text-white/60 border border-transparent hover:bg-white/10'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* All Languages */}
      <div className="mb-3">
        <div className="text-white/40 mb-1.5">All Languages ({LANGUAGES.length})</div>
        <div className="grid grid-cols-6 gap-1">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={`py-1 rounded text-[10px] cursor-pointer ${
                language === l.code
                  ? 'bg-yellow-500/30 text-yellow-300'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
              title={l.name}
            >
              {l.flag}
            </button>
          ))}
        </div>
      </div>

      {/* Test ?lang= param */}
      <div className="mb-3">
        <div className="text-white/40 mb-1.5">Test ?lang= URL param</div>
        <div className="flex gap-1 flex-wrap">
          {['es', 'fr', 'ja', 'ar', 'zh', 'hi', 'ru'].map((l) => (
            <button
              key={l}
              onClick={() => testLangParam(l)}
              className="py-1 px-2 rounded bg-blue-500/20 text-blue-300 text-[10px] cursor-pointer hover:bg-blue-500/30"
            >
              ?lang={l}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={resetGeoDetection}
          className="flex-1 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-[10px] cursor-pointer hover:bg-red-500/30"
        >
          Reset Geo Detection
        </button>
        <button
          onClick={() => {
            setLanguage('en');
            setCurrency('USD');
          }}
          className="flex-1 py-1.5 rounded-lg bg-white/10 text-white/70 text-[10px] cursor-pointer hover:bg-white/20"
        >
          Reset to English
        </button>
      </div>

      {/* SEO Check Links */}
      <div className="mt-3 pt-2 border-t border-white/10">
        <div className="text-white/40 mb-1.5">SEO Verification</div>
        <div className="space-y-1 text-[10px]">
          <a href="/sitemap.xml" target="_blank" className="text-blue-400 hover:underline block">→ /sitemap.xml</a>
          <a href="/robots.txt" target="_blank" className="text-blue-400 hover:underline block">→ /robots.txt</a>
          <a href="/api/geo-detect" target="_blank" className="text-blue-400 hover:underline block">→ /api/geo-detect</a>
        </div>
      </div>
    </div>
  );
}
