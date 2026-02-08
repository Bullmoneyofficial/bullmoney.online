'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { Globe, Check, ChevronDown, Search } from 'lucide-react';
import { useCurrencyLocaleStore, LANGUAGES, CURRENCIES, FOREX_CURRENCIES, CRYPTO_CURRENCIES, type LocaleInfo, type CurrencyInfo } from '@/stores/currency-locale-store';

// ============================================================================
// LANGUAGE & CURRENCY TOGGLE - Compact switcher for navbars
// Shows current flag + currency code, dropdown with tabs for both
// Designed to fit in pill navs, mobile menus, store headers, etc.
// ============================================================================

// Popular languages shown first
const POPULAR_LANG_CODES = ['en', 'es', 'fr', 'de', 'pt', 'ja', 'ko', 'zh', 'ar', 'hi', 'ru', 'tr'];

interface LanguageToggleProps {
  /** Render as a pill button (for navbars) vs full-width row (for mobile menus) */
  variant?: 'pill' | 'row' | 'icon';
  /** Dropdown opens up or down */
  dropDirection?: 'up' | 'down';
  /** Dropdown aligns to left or right of trigger */
  dropAlign?: 'left' | 'right';
  /** Color tone for light or dark backgrounds */
  tone?: 'dark' | 'light';
  /** Row dropdown behavior: inline below toggle or modal */
  rowDropdown?: 'inline' | 'modal';
  /** Additional className */
  className?: string;
}

export const LanguageToggle = memo(({ 
  variant = 'pill', 
  dropDirection = 'down',
  dropAlign = 'right',
  tone = 'dark',
  rowDropdown = 'modal',
  className = '' 
}: LanguageToggleProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'language' | 'currency'>('language');
  const [currencyCategory, setCurrencyCategory] = useState<'forex' | 'crypto'>('forex');
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { language, currency, setLanguage, setCurrency } = useCurrencyLocaleStore();
  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];
  const currentCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  // Close on outside click (account for portaled popup)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        ref.current && !ref.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Keep dropdown on-screen (only for old absolute-positioned dropdowns, skip for centered portals)
  useEffect(() => {
    if (!isOpen || !dropdownRef.current || variant === 'row') return;
    // Portal popups are centered with fixed positioning — no repositioning needed
  }, [isOpen, variant]);

  const handleSelectLang = (lang: LocaleInfo) => {
    setLanguage(lang.code);
    setIsOpen(false);
    setSearch('');
  };

  const handleSelectCurrency = (curr: CurrencyInfo) => {
    setCurrency(curr.code);
    setIsOpen(false);
    setSearch('');
  };

  // Sort languages: popular first, then alphabetical
  const sortedLangs = [...LANGUAGES].sort((a, b) => {
    const aIdx = POPULAR_LANG_CODES.indexOf(a.code);
    const bIdx = POPULAR_LANG_CODES.indexOf(b.code);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.name.localeCompare(b.name);
  });

  const filteredLangs = sortedLangs.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase())
  );

  const currencySource = currencyCategory === 'forex' ? FOREX_CURRENCIES : CRYPTO_CURRENCIES;
  const filteredCurrencies = currencySource.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  // Position classes for dropdown
  const dropdownPos = dropDirection === 'up' 
    ? 'bottom-full mb-2' 
    : 'top-full mt-2';
  const dropdownAlign = dropAlign === 'left' ? 'left-0' : 'right-0';
  const isLight = tone === 'light';
  const isRowInline = variant === 'row' && rowDropdown === 'inline';

  return (
    <div className={`relative ${variant === 'row' ? 'flex flex-col items-center w-full' : ''} ${className}`} ref={ref}>
      {/* Trigger Button */}
      {variant === 'icon' ? (
        <button
          onClick={() => { setIsOpen(!isOpen); setSearch(''); }}
          className="h-10 px-2.5 flex items-center gap-1.5 rounded-xl transition-colors"
          style={{ background: 'rgba(255,255,255,0.1)', color: 'rgb(255,255,255)' }}
          aria-label={`${currentLang.name} · ${currentCurrency.code}`}
          title={`${currentLang.name} · ${currentCurrency.code}`}
        >
          <span className="text-base">{currentLang.flag}</span>
          <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{currentCurrency.code}</span>
        </button>
      ) : variant === 'row' ? (
        <button
          onClick={() => { setIsOpen(!isOpen); setSearch(''); }}
          className="w-full flex items-center justify-between px-2.5 py-1.5 min-h-[32px] rounded-xl text-xs font-medium transition-all duration-200 whitespace-nowrap sm:px-3 sm:py-2 sm:min-h-[36px] sm:text-sm"
          style={{ 
            color: isLight ? '#111111' : '#ffffff',
            backgroundColor: isLight ? 'rgb(255, 255, 255)' : 'rgba(255, 255, 255, 0.05)',
            border: isLight ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" strokeWidth={2} />
            <span>Language & Currency</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base">{currentLang.flag}</span>
            <span className="text-xs" style={{ color: isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)' }}>{currentCurrency.code}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ color: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)' }} />
          </div>
        </button>
      ) : (
        <button
          onClick={() => { setIsOpen(!isOpen); setSearch(''); }}
          className="flex items-center gap-1.5 h-8 px-2.5 rounded-full text-xs transition-colors"
          style={{
            background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.1)',
            border: isLight ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.15)',
            color: isLight ? 'rgb(0,0,0)' : 'rgb(255,255,255)'
          }}
          aria-label={`${currentLang.name} · ${currentCurrency.code}`}
        >
          <span className="text-sm">{currentLang.flag}</span>
          <span className="text-[10px] uppercase tracking-wide">{currentCurrency.code}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* Dropdown - row variant: inline below toggle */}
      {isOpen && isRowInline && (
        <div
          ref={dropdownRef}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className={`absolute ${dropdownPos} ${dropdownAlign} rounded-xl overflow-hidden`}
          style={{
            zIndex: 60,
            width: 'min(240px, 78vw)',
            background: 'rgb(255,255,255)',
            border: '1px solid rgba(0,0,0,0.12)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
          }}
        >
          <div className="flex" style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            <button
              onClick={() => { setTab('language'); setSearch(''); }}
              className="flex-1 py-2 text-[11px] font-medium transition-colors"
              style={tab === 'language'
                ? { color: 'rgb(0,0,0)', background: 'rgba(0,0,0,0.04)' }
                : { color: 'rgba(0,0,0,0.5)' }
              }
            >
              🌐 Language
            </button>
            <button
              onClick={() => { setTab('currency'); setSearch(''); }}
              className="flex-1 py-2 text-[11px] font-medium transition-colors"
              style={tab === 'currency'
                ? { color: 'rgb(0,0,0)', background: 'rgba(0,0,0,0.04)' }
                : { color: 'rgba(0,0,0,0.5)' }
              }
            >
              💰 Currency
            </button>
          </div>

          <div className="p-2" style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'rgba(0,0,0,0.4)' }} />
              <input
                type="text"
                placeholder={`Search ${tab === 'language' ? 'languages' : 'currencies'}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-6.5 pl-7 pr-2.5 rounded-lg text-[11px] focus:outline-none"
                style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.12)', color: 'rgb(0,0,0)' }}
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto p-1">
            {tab === 'language' ? (
              <>
                {!search && (
                  <div className="px-3 py-1">
                    <span className="text-[9px] uppercase tracking-widest font-medium" style={{ color: 'rgba(0,0,0,0.35)' }}>Popular</span>
                  </div>
                )}
                {filteredLangs.map((lang, i) => {
                  const showAllSeparator = !search && i === POPULAR_LANG_CODES.length && POPULAR_LANG_CODES.includes(filteredLangs[i - 1]?.code);
                  return (
                    <div key={lang.code}>
                      {showAllSeparator && (
                        <div className="px-3 py-1 mt-1">
                          <span className="text-[9px] uppercase tracking-widest font-medium" style={{ color: 'rgba(0,0,0,0.35)' }}>All Languages</span>
                        </div>
                      )}
                      <button
                        onClick={() => handleSelectLang(lang)}
                        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors"
                        style={language === lang.code
                          ? { background: 'rgba(0,0,0,0.06)', color: 'rgb(0,0,0)' }
                          : { color: 'rgba(0,0,0,0.75)' }
                        }
                      >
                        <span className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                          <span style={{ color: 'rgba(0,0,0,0.35)' }}>({lang.nativeName})</span>
                        </span>
                        {language === lang.code && <Check className="w-3 h-3" style={{ color: 'rgb(16,185,129)' }} />}
                      </button>
                    </div>
                  );
                })}
              </>
            ) : (
              <>
                <div className="flex gap-1 px-2 pb-1.5">
                  <button
                    onClick={() => { setCurrencyCategory('forex'); setSearch(''); }}
                    className="flex-1 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide transition-colors"
                    style={currencyCategory === 'forex'
                      ? { background: 'rgba(16,185,129,0.12)', color: 'rgb(16,185,129)', border: '1px solid rgba(16,185,129,0.25)' }
                      : { color: 'rgba(0,0,0,0.45)', border: '1px solid rgba(0,0,0,0.08)' }
                    }
                  >
                    💱 Forex
                  </button>
                  <button
                    onClick={() => { setCurrencyCategory('crypto'); setSearch(''); }}
                    className="flex-1 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide transition-colors"
                    style={currencyCategory === 'crypto'
                      ? { background: 'rgba(245,158,11,0.12)', color: 'rgb(245,158,11)', border: '1px solid rgba(245,158,11,0.25)' }
                      : { color: 'rgba(0,0,0,0.45)', border: '1px solid rgba(0,0,0,0.08)' }
                    }
                  >
                    ₿ Crypto
                  </button>
                </div>
                {filteredCurrencies.map((curr) => (
                  <button
                    key={curr.code}
                    onClick={() => handleSelectCurrency(curr)}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors"
                    style={currency === curr.code
                      ? { background: 'rgba(0,0,0,0.06)', color: 'rgb(0,0,0)' }
                      : { color: 'rgba(0,0,0,0.75)' }
                    }
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-mono w-6" style={{ color: 'rgba(0,0,0,0.5)' }}>{curr.symbol}</span>
                      <span>{curr.name}</span>
                      <span style={{ color: 'rgba(0,0,0,0.35)' }}>({curr.code})</span>
                    </span>
                    {currency === curr.code && <Check className="w-3 h-3" style={{ color: 'rgb(16,185,129)' }} />}
                  </button>
                ))}
                {filteredCurrencies.length === 0 && (
                  <div className="text-center py-3 text-xs" style={{ color: 'rgba(0,0,0,0.35)' }}>
                    No {currencyCategory === 'forex' ? 'currencies' : 'cryptocurrencies'} found
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Dropdown - row variant: portal to body so it escapes sidebar overflow */}
      {isOpen && variant === 'row' && !isRowInline && typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0"
            style={{ background: 'rgba(0,0,0,0.5)', zIndex: 2147483646 }}
            onClick={() => setIsOpen(false)}
          />
          {/* Centered panel */}
          <div
            ref={dropdownRef}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="fixed rounded-xl overflow-hidden"
            style={{
              zIndex: 2147483647,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'calc(100vw - 2rem)',
              maxWidth: '340px',
              background: 'rgba(0,0,0,0.97)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
            }}
          >
            <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                onClick={() => { setTab('language'); setSearch(''); }}
                className="flex-1 py-2.5 text-xs font-medium transition-colors"
                style={tab === 'language' 
                  ? { color: 'rgb(255,255,255)', background: 'rgba(255,255,255,0.05)' }
                  : { color: 'rgba(255,255,255,0.5)' }
                }
              >
                🌐 Language
              </button>
              <button
                onClick={() => { setTab('currency'); setSearch(''); }}
                className="flex-1 py-2.5 text-xs font-medium transition-colors"
                style={tab === 'currency' 
                  ? { color: 'rgb(255,255,255)', background: 'rgba(255,255,255,0.05)' }
                  : { color: 'rgba(255,255,255,0.5)' }
                }
              >
                💰 Currency
              </button>
            </div>

            <div className="p-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
                <input
                  type="text"
                  placeholder={`Search ${tab === 'language' ? 'languages' : 'currencies'}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-7 pl-8 pr-3 rounded-lg text-xs focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgb(255,255,255)' }}
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div className="max-h-[50vh] overflow-y-auto p-1">
              {tab === 'language' ? (
                <>
                  {!search && (
                    <div className="px-3 py-1">
                      <span className="text-[9px] uppercase tracking-widest font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>Popular</span>
                    </div>
                  )}
                  {filteredLangs.map((lang, i) => {
                    const showAllSeparator = !search && i === POPULAR_LANG_CODES.length && POPULAR_LANG_CODES.includes(filteredLangs[i - 1]?.code);
                    return (
                      <div key={lang.code}>
                        {showAllSeparator && (
                          <div className="px-3 py-1 mt-1">
                            <span className="text-[9px] uppercase tracking-widest font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>All Languages</span>
                          </div>
                        )}
                        <button
                          onClick={() => handleSelectLang(lang)}
                          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors"
                          style={language === lang.code 
                            ? { background: 'rgba(255,255,255,0.1)', color: 'rgb(255,255,255)' }
                            : { color: 'rgba(255,255,255,0.7)' }
                          }
                        >
                          <span className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            <span>{lang.name}</span>
                            <span style={{ color: 'rgba(255,255,255,0.3)' }}>({lang.nativeName})</span>
                          </span>
                          {language === lang.code && <Check className="w-3 h-3" style={{ color: 'rgb(74,222,128)' }} />}
                        </button>
                      </div>
                    );
                  })}
                </>
              ) : (
                <>
                  <div className="flex gap-1 px-2 pb-1.5">
                    <button
                      onClick={() => { setCurrencyCategory('forex'); setSearch(''); }}
                      className="flex-1 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide transition-colors"
                      style={currencyCategory === 'forex'
                        ? { background: 'rgba(74,222,128,0.15)', color: 'rgb(74,222,128)', border: '1px solid rgba(74,222,128,0.3)' }
                        : { color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }
                      }
                    >
                      💱 Forex
                    </button>
                    <button
                      onClick={() => { setCurrencyCategory('crypto'); setSearch(''); }}
                      className="flex-1 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide transition-colors"
                      style={currencyCategory === 'crypto'
                        ? { background: 'rgba(251,191,36,0.15)', color: 'rgb(251,191,36)', border: '1px solid rgba(251,191,36,0.3)' }
                        : { color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }
                      }
                    >
                      ₿ Crypto
                    </button>
                  </div>
                  {filteredCurrencies.map((curr) => (
                    <button
                      key={curr.code}
                      onClick={() => handleSelectCurrency(curr)}
                      className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors"
                      style={currency === curr.code 
                        ? { background: 'rgba(255,255,255,0.1)', color: 'rgb(255,255,255)' }
                        : { color: 'rgba(255,255,255,0.7)' }
                      }
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-mono w-6" style={{ color: 'rgba(255,255,255,0.5)' }}>{curr.symbol}</span>
                        <span>{curr.name}</span>
                        <span style={{ color: 'rgba(255,255,255,0.3)' }}>({curr.code})</span>
                      </span>
                      {currency === curr.code && <Check className="w-3 h-3" style={{ color: 'rgb(74,222,128)' }} />}
                    </button>
                  ))}
                  {filteredCurrencies.length === 0 && (
                    <div className="text-center py-3 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      No {currencyCategory === 'forex' ? 'currencies' : 'cryptocurrencies'} found
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Dropdown - non-row variants: centered portal popup */}
      {isOpen && variant !== 'row' && typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0"
            style={{ background: 'rgba(0,0,0,0.5)', zIndex: 2147483646 }}
            onClick={() => setIsOpen(false)}
          />
          {/* Centered panel */}
          <div
            ref={dropdownRef}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="fixed rounded-xl overflow-hidden"
            style={{ 
              zIndex: 2147483647,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'calc(100vw - 2rem)',
              maxWidth: '340px',
              background: 'rgba(0,0,0,0.97)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
            }}
          >
          <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => { setTab('language'); setSearch(''); }}
              className="flex-1 py-2.5 text-xs font-medium transition-colors"
              style={tab === 'language' 
                ? { color: 'rgb(255,255,255)', background: 'rgba(255,255,255,0.05)' }
                : { color: 'rgba(255,255,255,0.5)' }
              }
            >
              🌐 Language
            </button>
            <button
              onClick={() => { setTab('currency'); setSearch(''); }}
              className="flex-1 py-2.5 text-xs font-medium transition-colors"
              style={tab === 'currency' 
                ? { color: 'rgb(255,255,255)', background: 'rgba(255,255,255,0.05)' }
                : { color: 'rgba(255,255,255,0.5)' }
              }
            >
              💰 Currency
            </button>
          </div>

          <div className="p-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
              <input
                type="text"
                placeholder={`Search ${tab === 'language' ? 'languages' : 'currencies'}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-7 pl-8 pr-3 rounded-lg text-xs focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgb(255,255,255)' }}
                autoFocus
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-56 overflow-y-auto p-1">
            {tab === 'language' ? (
              <>
                {/* Popular separator */}
                {!search && (
                  <div className="px-3 py-1">
                    <span className="text-[9px] uppercase tracking-widest font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>Popular</span>
                  </div>
                )}

                {filteredLangs.map((lang, i) => {
                  const showAllSeparator = !search && i === POPULAR_LANG_CODES.length && POPULAR_LANG_CODES.includes(filteredLangs[i - 1]?.code);

                  return (
                    <div key={lang.code}>
                      {showAllSeparator && (
                        <div className="px-3 py-1 mt-1">
                          <span className="text-[9px] uppercase tracking-widest font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>All Languages</span>
                        </div>
                      )}
                      <button
                        onClick={() => handleSelectLang(lang)}
                        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors"
                        style={language === lang.code 
                          ? { background: 'rgba(255,255,255,0.1)', color: 'rgb(255,255,255)' }
                          : { color: 'rgba(255,255,255,0.7)' }
                        }
                      >
                        <span className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                          <span style={{ color: 'rgba(255,255,255,0.3)' }}>({lang.nativeName})</span>
                        </span>
                        {language === lang.code && <Check className="w-3 h-3" style={{ color: 'rgb(74,222,128)' }} />}
                      </button>
                    </div>
                  );
                })}
              </>
            ) : (
              <>
                {/* Forex / Crypto sub-tabs */}
                <div className="flex gap-1 px-2 pb-1.5">
                  <button
                    onClick={() => { setCurrencyCategory('forex'); setSearch(''); }}
                    className="flex-1 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide transition-colors"
                    style={currencyCategory === 'forex'
                      ? { background: 'rgba(74,222,128,0.15)', color: 'rgb(74,222,128)', border: '1px solid rgba(74,222,128,0.3)' }
                      : { color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }
                    }
                  >
                    💱 Forex
                  </button>
                  <button
                    onClick={() => { setCurrencyCategory('crypto'); setSearch(''); }}
                    className="flex-1 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide transition-colors"
                    style={currencyCategory === 'crypto'
                      ? { background: 'rgba(251,191,36,0.15)', color: 'rgb(251,191,36)', border: '1px solid rgba(251,191,36,0.3)' }
                      : { color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }
                    }
                  >
                    ₿ Crypto
                  </button>
                </div>

                {filteredCurrencies.map((curr) => (
                  <button
                    key={curr.code}
                    onClick={() => handleSelectCurrency(curr)}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors"
                    style={currency === curr.code 
                      ? { background: 'rgba(255,255,255,0.1)', color: 'rgb(255,255,255)' }
                      : { color: 'rgba(255,255,255,0.7)' }
                    }
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-mono w-6" style={{ color: 'rgba(255,255,255,0.5)' }}>{curr.symbol}</span>
                      <span>{curr.name}</span>
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>({curr.code})</span>
                    </span>
                    {currency === curr.code && <Check className="w-3 h-3" style={{ color: 'rgb(74,222,128)' }} />}
                  </button>
                ))}

                {filteredCurrencies.length === 0 && (
                  <div className="text-center py-3 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    No {currencyCategory === 'forex' ? 'currencies' : 'cryptocurrencies'} found
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        </>,
        document.body
      )}
    </div>
  );
});

LanguageToggle.displayName = 'LanguageToggle';

export default LanguageToggle;
