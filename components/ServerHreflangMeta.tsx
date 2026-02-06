// ============================================================================
// SERVER-SIDE HREFLANG META
// Renders <link rel="alternate" hreflang="xx"> tags in server-rendered HTML
// so Google/Bing can see all language versions WITHOUT executing JavaScript.
// This is CRITICAL for multilingual SEO.
// ============================================================================

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.bullmoney.shop';

// All supported languages — must match stores/currency-locale-store.ts
const ALL_LANGUAGES = [
  'en', 'es', 'fr', 'de', 'pt', 'it', 'ja', 'ko', 'zh', 'ar',
  'hi', 'ru', 'tr', 'nl', 'pl', 'sv', 'no', 'da', 'fi', 'th',
  'vi', 'id', 'ms', 'tl', 'uk', 'cs', 'ro', 'el', 'he', 'hu',
  'bg', 'sw', 'af', 'zu', 'bn', 'ur',
];

// Map language codes to full locale for og:locale
const LANG_TO_LOCALE: Record<string, string> = {
  en: 'en_US', es: 'es_ES', fr: 'fr_FR', de: 'de_DE', pt: 'pt_BR',
  it: 'it_IT', ja: 'ja_JP', ko: 'ko_KR', zh: 'zh_CN', ar: 'ar_SA',
  hi: 'hi_IN', ru: 'ru_RU', tr: 'tr_TR', nl: 'nl_NL', pl: 'pl_PL',
  sv: 'sv_SE', no: 'nb_NO', da: 'da_DK', fi: 'fi_FI', th: 'th_TH',
  vi: 'vi_VN', id: 'id_ID', ms: 'ms_MY', tl: 'tl_PH', uk: 'uk_UA',
  cs: 'cs_CZ', ro: 'ro_RO', el: 'el_GR', he: 'he_IL', hu: 'hu_HU',
  bg: 'bg_BG', sw: 'sw_KE', af: 'af_ZA', zu: 'zu_ZA', bn: 'bn_BD',
  ur: 'ur_PK',
};

/**
 * Server-rendered hreflang links for a given path.
 * Use in layout.tsx or page.tsx inside <head>.
 * Google can read these without executing JS.
 */
export function ServerHreflangMeta({ pathname = '/' }: { pathname?: string }) {
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  
  return (
    <>
      {/* Hreflang links for every supported language */}
      {ALL_LANGUAGES.map((lang) => (
        <link
          key={lang}
          rel="alternate"
          hrefLang={lang}
          href={`${BASE_URL}${cleanPath}${cleanPath.includes('?') ? '&' : '?'}lang=${lang}`}
        />
      ))}
      {/* x-default points to English (no lang param) */}
      <link rel="alternate" hrefLang="x-default" href={`${BASE_URL}${cleanPath}`} />
      {/* Canonical always points to clean URL */}
      <link rel="canonical" href={`${BASE_URL}${cleanPath}`} />
    </>
  );
}

export { ALL_LANGUAGES, LANG_TO_LOCALE, BASE_URL };
