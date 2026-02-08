'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown, Search, Check } from 'lucide-react';
import { useCurrencyLocaleStore, CURRENCIES, LANGUAGES, FOREX_CURRENCIES, CRYPTO_CURRENCIES } from '@/stores/currency-locale-store';

// ============================================================================
// COINGECKO LOGO URLs — official high-quality crypto logos (primary option)
// Falls back to inline SVG → Unicode symbol → styled badge if image fails
// ============================================================================
const COINGECKO_LOGOS: Record<string, string> = {
  BTC:   'https://coin-images.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH:   'https://coin-images.coingecko.com/coins/images/279/small/ethereum.png',
  SOL:   'https://coin-images.coingecko.com/coins/images/4128/small/solana.png',
  XRP:   'https://coin-images.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  BNB:   'https://coin-images.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  ADA:   'https://coin-images.coingecko.com/coins/images/975/small/cardano.png',
  DOGE:  'https://coin-images.coingecko.com/coins/images/5/small/dogecoin.png',
  AVAX:  'https://coin-images.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  DOT:   'https://coin-images.coingecko.com/coins/images/12171/small/polkadot.png',
  MATIC: 'https://coin-images.coingecko.com/coins/images/4713/small/polygon.png',
  LINK:  'https://coin-images.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  LTC:   'https://coin-images.coingecko.com/coins/images/2/small/litecoin.png',
};

// ============================================================================
// FALLBACK SVG ICONS — brand-colored inline SVGs (secondary option)
// ============================================================================
const CRYPTO_ICON_MAP: Record<string, { svg?: React.ReactNode; unicode?: string; color: string }> = {
  BTC: {
    svg: (
      <svg viewBox="0 0 32 32" className="w-4 h-4" fill="none">
        <circle cx="16" cy="16" r="16" fill="#F7931A" />
        <path d="M22.5 14.2c.3-2-1.2-3.1-3.3-3.8l.7-2.8-1.7-.4-.7 2.7c-.4-.1-.9-.2-1.4-.3l.7-2.7-1.7-.4-.7 2.8c-.4-.1-.7-.2-1-.2l-2.3-.6-.4 1.8s1.2.3 1.2.3c.7.2.8.6.8 1l-.8 3.3c0 0 .1 0 .1 0l-.1 0-1.2 4.7c-.1.2-.3.6-.8.4 0 0-1.2-.3-1.2-.3l-.8 1.9 2.2.5c.4.1.8.2 1.2.3l-.7 2.8 1.7.4.7-2.8c.5.1.9.2 1.4.3l-.7 2.8 1.7.4.7-2.8c3 .6 5.2.3 6.2-2.4.7-2.2 0-3.4-1.6-4.2 1.1-.3 2-.1 2.2-1.8zm-4 5.5c-.5 2.1-4.1 1-5.2.7l.9-3.7c1.2.3 4.9.9 4.3 3zm.5-5.6c-.5 1.9-3.4.9-4.4.7l.8-3.4c1 .3 4.1.7 3.6 2.7z" fill="white"/>
      </svg>
    ),
    unicode: '₿',
    color: '#F7931A',
  },
  ETH: {
    svg: (
      <svg viewBox="0 0 32 32" className="w-4 h-4" fill="none">
        <circle cx="16" cy="16" r="16" fill="#627EEA" />
        <path d="M16.5 4v8.9l7.5 3.3L16.5 4z" fill="white" fillOpacity="0.6"/>
        <path d="M16.5 4L9 16.2l7.5-3.3V4z" fill="white"/>
        <path d="M16.5 21.9v6.1l7.5-10.4-7.5 4.3z" fill="white" fillOpacity="0.6"/>
        <path d="M16.5 28v-6.1L9 17.6l7.5 10.4z" fill="white"/>
        <path d="M16.5 20.6l7.5-4.4-7.5-3.3v7.7z" fill="white" fillOpacity="0.2"/>
        <path d="M9 16.2l7.5 4.4v-7.7L9 16.2z" fill="white" fillOpacity="0.5"/>
      </svg>
    ),
    unicode: 'Ξ',
    color: '#627EEA',
  },
  SOL: {
    svg: (
      <svg viewBox="0 0 32 32" className="w-4 h-4" fill="none">
        <circle cx="16" cy="16" r="16" fill="url(#sol-grad)" />
        <defs><linearGradient id="sol-grad" x1="0" y1="0" x2="32" y2="32"><stop stopColor="#9945FF"/><stop offset="1" stopColor="#14F195"/></linearGradient></defs>
        <path d="M10 20.3h10.5l2.5-2.5H12.5L10 20.3zm0-6.1h10.5l2.5-2.5H12.5L10 14.2zm13 1.5H12.5L10 18.2h10.5l2.5-2.5z" fill="white"/>
      </svg>
    ),
    unicode: '◎',
    color: '#9945FF',
  },
  XRP: {
    svg: (
      <svg viewBox="0 0 32 32" className="w-4 h-4" fill="none">
        <circle cx="16" cy="16" r="16" fill="#23292F" />
        <path d="M11 9h2.4l4.6 4.8L22.6 9H25l-5.8 6 5.8 6h-2.4L18 16.2 13.4 21H11l5.8-6L11 9z" fill="white"/>
      </svg>
    ),
    unicode: '✕',
    color: '#23292F',
  },
  BNB: {
    svg: (
      <svg viewBox="0 0 32 32" className="w-4 h-4" fill="none">
        <circle cx="16" cy="16" r="16" fill="#F3BA2F" />
        <path d="M16 8l2.5 2.5-4.6 4.6L11.4 12.6 16 8zm-4.6 4.6L16 17.2l4.6-4.6 2.5 2.5L16 22.2l-7.1-7.1 2.5-2.5zm9.2 0L23.1 15.1 16 22.2l-7.1-7.1 2.5-2.5" fill="white" fillOpacity="0.9"/>
        <path d="M16 8l2.5 2.5L16 13l-2.5-2.5L16 8zM9 15l2.5 2.5L9 20l-2.5-2.5L9 15zm14 0l2.5 2.5L23 20l-2.5-2.5L23 15zm-7 7l2.5 2.5L16 27l-2.5-2.5L16 22z" fill="white"/>
      </svg>
    ),
    unicode: '◆',
    color: '#F3BA2F',
  },
  ADA: {
    svg: (
      <svg viewBox="0 0 32 32" className="w-4 h-4" fill="none">
        <circle cx="16" cy="16" r="16" fill="#0033AD" />
        <circle cx="16" cy="10" r="1.5" fill="white"/>
        <circle cx="16" cy="22" r="1.5" fill="white"/>
        <circle cx="10.8" cy="13" r="1.5" fill="white"/>
        <circle cx="21.2" cy="13" r="1.5" fill="white"/>
        <circle cx="10.8" cy="19" r="1.5" fill="white"/>
        <circle cx="21.2" cy="19" r="1.5" fill="white"/>
        <circle cx="16" cy="16" r="2" fill="white"/>
      </svg>
    ),
    unicode: '₳',
    color: '#0033AD',
  },
  DOGE: {
    svg: (
      <svg viewBox="0 0 32 32" className="w-4 h-4" fill="none">
        <circle cx="16" cy="16" r="16" fill="#C2A633" />
        <text x="16" y="21" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white" fontFamily="serif">Ð</text>
      </svg>
    ),
    unicode: 'Ð',
    color: '#C2A633',
  },
  AVAX: {
    svg: (
      <svg viewBox="0 0 32 32" className="w-4 h-4" fill="none">
        <circle cx="16" cy="16" r="16" fill="#E84142" />
        <path d="M21.5 21H24l-8-14-2.8 4.9L18 21h-5.2l3.2-5.6-2.8-4.9L7.5 21H10l3.2-5.6" fill="white"/>
      </svg>
    ),
    unicode: '▲',
    color: '#E84142',
  },
  DOT: {
    svg: (
      <svg viewBox="0 0 32 32" className="w-4 h-4" fill="none">
        <circle cx="16" cy="16" r="16" fill="#E6007A" />
        <circle cx="16" cy="9" r="3" fill="white"/>
        <circle cx="16" cy="23" r="3" fill="white"/>
        <circle cx="16" cy="16" r="2.5" fill="white"/>
        <rect x="14.5" y="11" width="3" height="4" rx="1.5" fill="white"/>
        <rect x="14.5" y="17" width="3" height="4" rx="1.5" fill="white"/>
      </svg>
    ),
    unicode: '●',
    color: '#E6007A',
  },
  MATIC: {
    svg: (
      <svg viewBox="0 0 32 32" className="w-4 h-4" fill="none">
        <circle cx="16" cy="16" r="16" fill="#8247E5" />
        <path d="M20.4 13.2c-.4-.2-.8-.2-1.1 0l-2.6 1.5-1.8 1-2.6 1.5c-.4.2-.8.2-1.1 0l-2-1.2c-.4-.2-.6-.6-.6-1v-2.3c0-.4.2-.8.6-1l2-1.1c.3-.2.7-.2 1.1 0l2 1.2c.3.2.6.6.6 1v1.5l1.8-1v-1.5c0-.4-.2-.8-.6-1l-3.7-2.2c-.4-.2-.8-.2-1.1 0l-3.8 2.2c-.4.2-.6.6-.6 1V15c0 .4.2.8.6 1l3.8 2.2c.3.2.7.2 1.1 0l2.6-1.5 1.8-1 2.6-1.5c.3-.2.7-.2 1.1 0l2 1.2c.3.2.6.6.6 1v2.3c0 .4-.2.8-.6 1l-2 1.2c-.4.2-.8.2-1.1 0l-2-1.2c-.3-.2-.6-.6-.6-1v-1.5l-1.8 1V19c0 .4.2.8.6 1l3.8 2.2c.3.2.7.2 1.1 0l3.7-2.2c.4-.2.6-.6.6-1v-4.5c0-.4-.2-.8-.6-1l-3.7-2.3z" fill="white"/>
      </svg>
    ),
    unicode: '⬡',
    color: '#8247E5',
  },
  LINK: {
    svg: (
      <svg viewBox="0 0 32 32" className="w-4 h-4" fill="none">
        <circle cx="16" cy="16" r="16" fill="#2A5ADA" />
        <path d="M16 6l-2 1.2-6 3.4L6 11.8v8.4l2 1.2 6 3.4 2 1.2 2-1.2 6-3.4 2-1.2v-8.4l-2-1.2-6-3.4L16 6zm-6 14.6v-5.2l6-3.4 6 3.4v5.2l-6 3.4-6-3.4z" fill="white"/>
      </svg>
    ),
    unicode: '⬡',
    color: '#2A5ADA',
  },
  LTC: {
    svg: (
      <svg viewBox="0 0 32 32" className="w-4 h-4" fill="none">
        <circle cx="16" cy="16" r="16" fill="#345D9D" />
        <path d="M16 7l-1 4.5-3 1.2.5-1.5-1.5.6L13 5h-3l-3 12.5h5l-1 4.5h12l1-3H14.5l1-4.5 3-1.2-.5 1.5 1.5-.6L17 21h3l3-14h-7z" fill="white"/>
      </svg>
    ),
    unicode: 'Ł',
    color: '#345D9D',
  },
};

/**
 * Renders a crypto icon with multi-layer fallback:
 * 1. CoinGecko logo image (official, high-quality)
 * 2. Inline SVG icon (brand-colored)
 * 3. Unicode symbol on colored circle
 * 4. Styled text badge (ultimate fallback)
 */
function CryptoIcon({ code, symbol }: { code: string; symbol: string }) {
  const [imgFailed, setImgFailed] = useState(false);
  const logoUrl = COINGECKO_LOGOS[code];
  const entry = CRYPTO_ICON_MAP[code];

  const handleError = useCallback(() => setImgFailed(true), []);

  // Layer 1: CoinGecko logo image
  if (logoUrl && !imgFailed) {
    return (
      <span className="inline-flex items-center justify-center shrink-0 w-4 h-4 rounded-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={code}
          width={16}
          height={16}
          decoding="async"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          className="w-4 h-4 rounded-full object-cover"
          onError={handleError}
        />
      </span>
    );
  }

  // Layer 2: Inline SVG icon
  if (entry?.svg) {
    return <span className="inline-flex items-center justify-center shrink-0">{entry.svg}</span>;
  }

  // Layer 3: Unicode symbol with brand color circle
  if (entry?.unicode) {
    return (
      <span
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold text-white shrink-0"
        style={{ backgroundColor: entry.color }}
      >
        {entry.unicode}
      </span>
    );
  }

  // Layer 4: Known Unicode symbols from the data
  if (symbol && symbol !== code && symbol.length <= 2) {
    return (
      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/80 text-[9px] font-bold text-white shrink-0">
        {symbol}
      </span>
    );
  }

  // Layer 5: First-letter styled badge as ultimate fallback
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-linear-to-br from-amber-400 to-orange-600 text-[8px] font-bold text-white shrink-0">
      {code.slice(0, 2)}
    </span>
  );
}

// ============================================================================
// CURRENCY & LANGUAGE SELECTOR - Dropdown for Store
// ============================================================================

export function CurrencyLanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'currency' | 'language'>('currency');
  const [currencyCategory, setCurrencyCategory] = useState<'forex' | 'crypto'>('forex');
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const { currency, language, setCurrency, setLanguage, getCurrency, getLanguage } = useCurrencyLocaleStore();

  const currentCurrency = getCurrency();
  const currentLanguage = getLanguage();

  // Outside-click is handled by the backdrop's onClick — no need for a document listener
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

  const currencySource = currencyCategory === 'forex' ? FOREX_CURRENCIES : CRYPTO_CURRENCIES;
  const filteredCurrencies = currencySource.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLanguages = LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setIsOpen(!isOpen); setSearch(''); }}
        className="flex items-center gap-1 h-7 px-2 bg-white/5 border border-white/10 rounded-md
                   text-white/70 text-[10px] hover:bg-white/10 transition-colors sm:h-8 sm:px-2.5 sm:text-xs sm:gap-1.5 sm:rounded-lg"
      >
        <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        <span className="text-[10px] sm:text-xs">{currentLanguage.flag}</span>
        <span className="text-[10px] sm:text-xs">{currentCurrency.code}</span>
        <ChevronDown className={`w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0"
              style={{ background: 'rgba(0,0,0,0.5)', zIndex: 2147483646 }}
              onClick={() => setIsOpen(false)}
            />
            {/* Centered panel */}
            <div
              id="currency-lang-popup"
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
            {/* Tabs */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => { setTab('currency'); setSearch(''); }}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                  tab === 'currency' ? 'text-white bg-white/5' : 'text-white/50'
                }`}
              >
                💰 Currency
              </button>
              <button
                onClick={() => { setTab('language'); setSearch(''); }}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                  tab === 'language' ? 'text-white bg-white/5' : 'text-white/50'
                }`}
              >
                🌐 Language
              </button>
            </div>

            {/* Search */}
            <div className="p-2 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                <input
                  type="text"
                  placeholder={`Search ${tab === 'currency' ? 'currencies' : 'languages'}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 bg-white/5 border border-white/10 rounded-lg text-xs
                           text-white placeholder:text-white/40 focus:outline-none focus:border-white/20"
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div className="max-h-60 overflow-y-auto p-1">
              {tab === 'currency' ? (
                <>
                  {/* Forex / Crypto sub-tabs */}
                  <div className="flex gap-1 px-2 pb-1.5">
                    <button
                      onClick={() => { setCurrencyCategory('forex'); setSearch(''); }}
                      className={`flex-1 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide transition-colors
                        ${currencyCategory === 'forex'
                          ? 'bg-green-400/15 text-green-400 border border-green-400/30'
                          : 'text-white/40 border border-white/10'}`}
                    >
                      💱 Forex
                    </button>
                    <button
                      onClick={() => { setCurrencyCategory('crypto'); setSearch(''); }}
                      className={`flex-1 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide transition-colors
                        ${currencyCategory === 'crypto'
                          ? 'bg-amber-400/15 text-amber-400 border border-amber-400/30'
                          : 'text-white/40 border border-white/10'}`}
                    >
                      ₿ Crypto
                    </button>
                  </div>

                  {filteredCurrencies.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => { setCurrency(c.code); setIsOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors
                        ${currency === c.code ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'}`}
                    >
                      <span className="flex items-center gap-2">
                        {currencyCategory === 'crypto' ? (
                          <CryptoIcon code={c.code} symbol={c.symbol} />
                        ) : (
                          <span className="text-white/50 font-mono w-8">{c.symbol}</span>
                        )}
                        <span>{c.name}</span>
                        <span className="text-white/40">({c.code})</span>
                      </span>
                      {currency === c.code && <Check className="w-3.5 h-3.5 text-green-400" />}
                    </button>
                  ))}

                  {filteredCurrencies.length === 0 && (
                    <div className="text-center py-3 text-xs text-white/30">
                      No {currencyCategory === 'forex' ? 'currencies' : 'cryptocurrencies'} found
                    </div>
                  )}
                </>
              ) : (
                filteredLanguages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setLanguage(l.code); setIsOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors
                      ${language === l.code ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'}`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{l.flag}</span>
                      <span>{l.name}</span>
                      <span className="text-white/40">({l.nativeName})</span>
                    </span>
                    {language === l.code && <Check className="w-3.5 h-3.5 text-green-400" />}
                  </button>
                ))
              )}
            </div>
          </div>
          </>,
          document.body
        )}
    </div>
  );
}
