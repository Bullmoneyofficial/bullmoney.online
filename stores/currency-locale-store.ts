'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================================================
// CURRENCY / LOCALE STORE - ZUSTAND WITH LOCAL STORAGE PERSISTENCE
// Supports all major currencies and languages for the store
// ============================================================================

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  rate: number; // rate relative to USD
}

export interface LocaleInfo {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

// All supported currencies with approximate rates (updated via API in production)
export const CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 149.5 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.53 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1.36 },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', rate: 0.88 },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rate: 7.24 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 83.1 },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', rate: 17.15 },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', rate: 4.97 },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', rate: 1320 },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', rate: 18.6 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rate: 1.34 },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', rate: 7.82 },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', rate: 10.5 },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', rate: 10.4 },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone', rate: 6.88 },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', rate: 1.63 },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', rate: 4.02 },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', rate: 35.2 },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', rate: 30.2 },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble', rate: 91.5 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', rate: 3.67 },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', rate: 3.75 },
  { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar', rate: 31.5 },
  { code: 'ARS', symbol: 'AR$', name: 'Argentine Peso', rate: 830 },
  { code: 'COP', symbol: 'COL$', name: 'Colombian Peso', rate: 3950 },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', rate: 56.2 },
  { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', rate: 3.68 },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', rate: 4.72 },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', rate: 15600 },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rate: 1550 },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', rate: 30.9 },
  { code: 'CLP', symbol: 'CL$', name: 'Chilean Peso', rate: 890 },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', rate: 278 },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', rate: 110 },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', rate: 24500 },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', rate: 22.8 },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', rate: 356 },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu', rate: 4.57 },
  { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev', rate: 1.8 },
  { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia', rate: 37.5 },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', rate: 153 },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', rate: 12.5 },
  { code: 'BTC', symbol: '₿', name: 'Bitcoin', rate: 0.0000097 },
];

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
}

export const useCurrencyLocaleStore = create<CurrencyLocaleStore>()(
  persist(
    (set, get) => ({
      currency: 'USD',
      language: 'en',
      autoTranslateEnabled: true,

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

      formatPrice: (priceUSD) => {
        const curr = CURRENCIES.find((c) => c.code === get().currency) || CURRENCIES[0];
        const converted = priceUSD * curr.rate;
        
        // Format based on currency
        try {
          return new Intl.NumberFormat(get().language, {
            style: 'currency',
            currency: curr.code === 'BTC' ? 'USD' : curr.code,
            minimumFractionDigits: curr.code === 'BTC' ? 8 : (curr.rate > 100 ? 0 : 2),
            maximumFractionDigits: curr.code === 'BTC' ? 8 : (curr.rate > 100 ? 0 : 2),
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
      storage: createJSONStorage(() => localStorage),
    }
  )
);
