'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown, Search, Check } from 'lucide-react';
import { useCurrencyLocaleStore, CURRENCIES, LANGUAGES } from '@/stores/currency-locale-store';

// ============================================================================
// CURRENCY & LANGUAGE SELECTOR - Dropdown for Store
// ============================================================================

export function CurrencyLanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'currency' | 'language'>('currency');
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const { currency, language, setCurrency, setLanguage, getCurrency, getLanguage } = useCurrencyLocaleStore();

  const currentCurrency = getCurrency();
  const currentLanguage = getLanguage();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCurrencies = CURRENCIES.filter(
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
        className="flex items-center gap-1.5 h-8 px-2.5 bg-white/5 border border-white/10 rounded-lg
                   text-white/70 text-xs hover:bg-white/10 transition-colors"
      >
        <Globe className="w-3.5 h-3.5" />
        <span>{currentLanguage.flag}</span>
        <span>{currentCurrency.code}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 right-0 w-72 bg-black border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100]"
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
                filteredCurrencies.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => { setCurrency(c.code); setIsOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors
                      ${currency === c.code ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'}`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-white/50 font-mono w-8">{c.symbol}</span>
                      <span>{c.name}</span>
                      <span className="text-white/40">({c.code})</span>
                    </span>
                    {currency === c.code && <Check className="w-3.5 h-3.5 text-green-400" />}
                  </button>
                ))
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
