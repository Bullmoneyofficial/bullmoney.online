import { NextRequest, NextResponse } from 'next/server';

// ✅ EDGE RUNTIME: 0ms cold start - uses only request headers
export const runtime = 'edge';

// ============================================================================
// GEO-DETECT API ROUTE
// Detects user location via Vercel/Cloudflare headers or IP geolocation
// Returns recommended language + currency for auto-detection on page load
// ============================================================================

// Country code → best language code mapping
const COUNTRY_TO_LANGUAGE: Record<string, string> = {
  // English-speaking
  US: 'en', GB: 'en', AU: 'en', CA: 'en', NZ: 'en', IE: 'en', SG: 'en',
  // Spanish-speaking
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es', VE: 'es',
  EC: 'es', GT: 'es', CU: 'es', BO: 'es', DO: 'es', HN: 'es', PY: 'es',
  SV: 'es', NI: 'es', CR: 'es', PA: 'es', UY: 'es', PR: 'es',
  // Portuguese
  BR: 'pt', PT: 'pt', AO: 'pt', MZ: 'pt',
  // French
  FR: 'fr', BE: 'fr', CH: 'fr', LU: 'fr', MC: 'fr', SN: 'fr', CI: 'fr',
  CM: 'fr', ML: 'fr', BF: 'fr', NE: 'fr', TD: 'fr', GN: 'fr', RW: 'fr',
  CD: 'fr', CG: 'fr', GA: 'fr', TG: 'fr', BJ: 'fr', MG: 'fr', HT: 'fr',
  // German
  DE: 'de', AT: 'de', LI: 'de',
  // Italian
  IT: 'it', SM: 'it', VA: 'it',
  // Japanese
  JP: 'ja',
  // Korean
  KR: 'ko',
  // Chinese
  CN: 'zh', TW: 'zh', HK: 'zh', MO: 'zh',
  // Arabic
  SA: 'ar', AE: 'ar', EG: 'ar', IQ: 'ar', MA: 'ar', DZ: 'ar', TN: 'ar',
  LY: 'ar', JO: 'ar', LB: 'ar', KW: 'ar', QA: 'ar', BH: 'ar', OM: 'ar',
  YE: 'ar', SD: 'ar', SY: 'ar', PS: 'ar',
  // Hindi
  IN: 'hi',
  // Russian
  RU: 'ru', BY: 'ru', KZ: 'ru', KG: 'ru',
  // Turkish
  TR: 'tr', CY: 'tr',
  // Dutch
  NL: 'nl',
  // Polish
  PL: 'pl',
  // Swedish
  SE: 'sv',
  // Norwegian
  NO: 'no',
  // Danish
  DK: 'da',
  // Finnish
  FI: 'fi',
  // Thai
  TH: 'th',
  // Vietnamese
  VN: 'vi',
  // Indonesian
  ID: 'id',
  // Malay
  MY: 'ms',
  // Filipino
  PH: 'tl',
  // Ukrainian
  UA: 'uk',
  // Czech
  CZ: 'cs',
  // Romanian
  RO: 'ro',
  // Greek
  GR: 'el',
  // Hebrew
  IL: 'he',
  // Hungarian
  HU: 'hu',
  // Bulgarian
  BG: 'bg',
  // Swahili
  KE: 'sw', TZ: 'sw', UG: 'sw',
  // Afrikaans / Zulu
  ZA: 'af',
  // Bengali
  BD: 'bn',
  // Urdu
  PK: 'ur',
};

// Country code → best currency mapping
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: 'USD', GB: 'GBP', AU: 'AUD', CA: 'CAD', NZ: 'NZD', IE: 'EUR',
  SG: 'SGD', JP: 'JPY', KR: 'KRW', CN: 'CNY', TW: 'TWD', HK: 'HKD',
  IN: 'INR', RU: 'RUB', TR: 'TRY', BR: 'BRL', MX: 'MXN', ZA: 'ZAR',
  SA: 'SAR', AE: 'AED', IL: 'ILS', PH: 'PHP', MY: 'MYR', ID: 'IDR',
  TH: 'THB', VN: 'VND', PK: 'PKR', BD: 'BDT', NG: 'NGN', EG: 'EGP',
  AR: 'ARS', CO: 'COP', CL: 'CLP', PL: 'PLN', CZ: 'CZK', HU: 'HUF',
  RO: 'RON', BG: 'BGN', UA: 'UAH', KE: 'KES', GH: 'GHS', SE: 'SEK',
  NO: 'NOK', DK: 'DKK', CH: 'CHF',
  // Eurozone
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', PT: 'EUR', NL: 'EUR',
  BE: 'EUR', AT: 'EUR', FI: 'EUR', GR: 'EUR', LU: 'EUR', SK: 'EUR',
  SI: 'EUR', EE: 'EUR', LV: 'EUR', LT: 'EUR', MT: 'EUR', CY: 'EUR',
};

export async function GET(request: NextRequest) {
  try {
    // Method 1: Vercel geo headers (free, instant, most reliable on Vercel)
    const vercelCountry = request.headers.get('x-vercel-ip-country');
    // Method 2: Cloudflare geo header
    const cfCountry = request.headers.get('cf-ipcountry');
    // Method 3: Standard geo header
    const geoCountry = request.headers.get('x-country-code');
    
    const countryCode = (vercelCountry || cfCountry || geoCountry || '').toUpperCase();
    
    // Parse Accept-Language header as fallback for language
    const acceptLanguage = request.headers.get('accept-language') || '';
    const browserLang = acceptLanguage.split(',')[0]?.split('-')[0]?.toLowerCase() || 'en';
    
    // Determine language: prefer country-based, fall back to browser language
    const langFromCountry = countryCode ? COUNTRY_TO_LANGUAGE[countryCode] : undefined;
    const detectedLanguage = langFromCountry || (['en','es','fr','de','pt','it','ja','ko','zh','ar','hi','ru','tr','nl','pl','sv','no','da','fi','th','vi','id','ms','tl','uk','cs','ro','el','he','hu','bg','sw','af','zu','bn','ur'].includes(browserLang) ? browserLang : 'en');
    
    // Determine currency
    const detectedCurrency = countryCode ? (COUNTRY_TO_CURRENCY[countryCode] || 'USD') : 'USD';
    
    return NextResponse.json({
      country: countryCode || 'US',
      language: detectedLanguage,
      currency: detectedCurrency,
      source: vercelCountry ? 'vercel' : cfCountry ? 'cloudflare' : geoCountry ? 'geo-header' : 'browser',
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch {
    return NextResponse.json({
      country: 'US',
      language: 'en',
      currency: 'USD',
      source: 'fallback',
    });
  }
}
