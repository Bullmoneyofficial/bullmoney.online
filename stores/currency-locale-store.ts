'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { consentAwareStorage } from '@/lib/consentAwareStorage';

// ============================================================================
// CURRENCY / LOCALE STORE - ZUSTAND WITH LOCAL STORAGE PERSISTENCE
// Supports all major currencies and languages for the store
// ============================================================================

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  rate: number; // rate relative to USD
  category: 'forex' | 'crypto';
}

export interface LocaleInfo {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

// All supported currencies with approximate rates (updated via API in production)
// Crypto codes use ISO-style identifiers; Intl.NumberFormat fallback handles display
const CRYPTO_CODES = new Set(['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'ADA', 'DOGE', 'AVAX', 'DOT', 'MATIC', 'LINK', 'LTC']);

export const CURRENCIES: CurrencyInfo[] = [
  // ── Forex (Fiat) ──────────────────────────────────────────────
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1, category: 'forex' },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92, category: 'forex' },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79, category: 'forex' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 149.5, category: 'forex' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.53, category: 'forex' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1.36, category: 'forex' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', rate: 0.88, category: 'forex' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rate: 7.24, category: 'forex' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 83.1, category: 'forex' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', rate: 17.15, category: 'forex' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', rate: 4.97, category: 'forex' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', rate: 1320, category: 'forex' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', rate: 18.6, category: 'forex' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rate: 1.34, category: 'forex' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', rate: 7.82, category: 'forex' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', rate: 10.5, category: 'forex' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', rate: 10.4, category: 'forex' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone', rate: 6.88, category: 'forex' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', rate: 1.63, category: 'forex' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', rate: 4.02, category: 'forex' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', rate: 35.2, category: 'forex' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', rate: 30.2, category: 'forex' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble', rate: 91.5, category: 'forex' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', rate: 3.67, category: 'forex' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', rate: 3.75, category: 'forex' },
  { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar', rate: 31.5, category: 'forex' },
  { code: 'ARS', symbol: 'AR$', name: 'Argentine Peso', rate: 830, category: 'forex' },
  { code: 'COP', symbol: 'COL$', name: 'Colombian Peso', rate: 3950, category: 'forex' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', rate: 56.2, category: 'forex' },
  { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', rate: 3.68, category: 'forex' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', rate: 4.72, category: 'forex' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', rate: 15600, category: 'forex' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rate: 1550, category: 'forex' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', rate: 30.9, category: 'forex' },
  { code: 'CLP', symbol: 'CL$', name: 'Chilean Peso', rate: 890, category: 'forex' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', rate: 278, category: 'forex' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', rate: 110, category: 'forex' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', rate: 24500, category: 'forex' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', rate: 22.8, category: 'forex' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', rate: 356, category: 'forex' },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu', rate: 4.57, category: 'forex' },
  { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev', rate: 1.8, category: 'forex' },
  { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia', rate: 37.5, category: 'forex' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', rate: 153, category: 'forex' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', rate: 12.5, category: 'forex' },
  // ── Crypto ────────────────────────────────────────────────────
  { code: 'BTC', symbol: '₿', name: 'Bitcoin', rate: 0.0000097, category: 'crypto' },
  { code: 'ETH', symbol: 'Ξ', name: 'Ethereum', rate: 0.00030, category: 'crypto' },
  { code: 'SOL', symbol: '◎', name: 'Solana', rate: 0.0045, category: 'crypto' },
  { code: 'XRP', symbol: '✕', name: 'XRP', rate: 0.40, category: 'crypto' },
  { code: 'BNB', symbol: '◆', name: 'BNB', rate: 0.0015, category: 'crypto' },
  { code: 'ADA', symbol: '₳', name: 'Cardano', rate: 1.25, category: 'crypto' },
  { code: 'DOGE', symbol: 'Ð', name: 'Dogecoin', rate: 5.0, category: 'crypto' },
  { code: 'AVAX', symbol: '▲', name: 'Avalanche', rate: 0.025, category: 'crypto' },
  { code: 'DOT', symbol: '●', name: 'Polkadot', rate: 0.125, category: 'crypto' },
  { code: 'MATIC', symbol: '⬡', name: 'Polygon', rate: 1.1, category: 'crypto' },
  { code: 'LINK', symbol: '⬡', name: 'Chainlink', rate: 0.056, category: 'crypto' },
  { code: 'LTC', symbol: 'Ł', name: 'Litecoin', rate: 0.0095, category: 'crypto' },
];

// Helper exports for filtering
export const FOREX_CURRENCIES = CURRENCIES.filter(c => c.category === 'forex');
export const CRYPTO_CURRENCIES = CURRENCIES.filter(c => c.category === 'crypto');

// All supported languages
export const LANGUAGES: LocaleInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino', flag: '🇵🇭' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', flag: '🇧🇬' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', flag: '🇿🇦' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
];

interface CurrencyLocaleStore {
  currency: string;
  language: string;
  setCurrency: (code: string) => void;
  setLanguage: (code: string) => void;
  formatPrice: (priceUSD: number) => string;
  getCurrency: () => CurrencyInfo;
  getLanguage: () => LocaleInfo;
  // Auto-translate helper: fetches translations on language change
  autoTranslateEnabled: boolean;
  setAutoTranslate: (enabled: boolean) => void;
  // Live exchange rates
  liveRates: Record<string, number>;
  liveRatesFetchedAt: number;
  fetchLiveRates: () => Promise<void>;
}

export const useCurrencyLocaleStore = create<CurrencyLocaleStore>()(
  persist(
    (set, get) => ({
      currency: 'USD',
      language: 'en',
      autoTranslateEnabled: true,
      liveRates: {},
      liveRatesFetchedAt: 0,

      setCurrency: (code) => set({ currency: code }),
      setLanguage: (code) => {
        set({ language: code });
        // Update <html lang> immediately
        if (typeof document !== 'undefined') {
          document.documentElement.lang = code;
          const rtl = ['ar', 'he', 'ur'].includes(code);
          document.documentElement.dir = rtl ? 'rtl' : 'ltr';
        }
      },
      setAutoTranslate: (enabled) => set({ autoTranslateEnabled: enabled }),

      fetchLiveRates: async () => {
        try {
          const res = await fetch('/api/exchange-rates');
          if (!res.ok) return;
          const data = await res.json();
          if (data.rates && Object.keys(data.rates).length > 10) {
            set({ liveRates: data.rates, liveRatesFetchedAt: Date.now() });
          }
        } catch {
          // Silently fail — static rates will be used as fallback
        }
      },

      formatPrice: (priceUSD) => {
        const state = get();
        const curr = CURRENCIES.find((c) => c.code === state.currency) || CURRENCIES[0];
        // Prefer live rate, fall back to static rate
        const rate = state.liveRates[curr.code] ?? curr.rate;
        const converted = priceUSD * rate;
        const isCrypto = curr.category === 'crypto';
        
        // Crypto currencies can't use Intl.NumberFormat with style:'currency'
        // Use the symbol (₿, Ξ, Ð, Ł, ◎, etc.) instead of text code
        if (isCrypto) {
          const decimals = converted < 0.001 ? 8 : converted < 1 ? 6 : converted < 100 ? 4 : 2;
          const formatted = converted.toLocaleString(state.language, {
            minimumFractionDigits: 2,
            maximumFractionDigits: decimals,
          });
          return `${curr.symbol}${formatted}`;
        }
        
        // Fiat currencies use standard Intl formatting
        try {
          return new Intl.NumberFormat(state.language, {
            style: 'currency',
            currency: curr.code,
            minimumFractionDigits: rate > 100 ? 0 : 2,
            maximumFractionDigits: rate > 100 ? 0 : 2,
          }).format(converted);
        } catch {
          return `${curr.symbol}${converted.toFixed(2)}`;
        }
      },

      getCurrency: () => {
        return CURRENCIES.find((c) => c.code === get().currency) || CURRENCIES[0];
      },

      getLanguage: () => {
        return LANGUAGES.find((l) => l.code === get().language) || LANGUAGES[0];
      },
    }),
    {
      name: 'bullmoney-locale',
      storage: createJSONStorage(() => consentAwareStorage),
      partialize: (state) => ({
        currency: state.currency,
        language: state.language,
        autoTranslateEnabled: state.autoTranslateEnabled,
        liveRates: state.liveRates,
        liveRatesFetchedAt: state.liveRatesFetchedAt,
      }),
    }
  )
);
