// ============================================================================
// SEO LANGUAGE HELPERS
// Shared constants and utilities for multilingual SEO across all layouts.
// Used by sitemap.ts, layout.tsx metadata, and all sub-layouts.
// ============================================================================

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.bullmoney.shop';

/** All 36 supported language codes */
export const ALL_LANG_CODES = [
  'en', 'es', 'fr', 'de', 'pt', 'it', 'ja', 'ko', 'zh', 'ar',
  'hi', 'ru', 'tr', 'nl', 'pl', 'sv', 'no', 'da', 'fi', 'th',
  'vi', 'id', 'ms', 'tl', 'uk', 'cs', 'ro', 'el', 'he', 'hu',
  'bg', 'sw', 'af', 'zu', 'bn', 'ur',
] as const;

/** Full language names for Schema.org availableLanguage */
export const ALL_LANG_NAMES = [
  'English', 'Spanish', 'French', 'German', 'Portuguese', 'Italian',
  'Japanese', 'Korean', 'Chinese', 'Arabic', 'Hindi', 'Russian',
  'Turkish', 'Dutch', 'Polish', 'Swedish', 'Norwegian', 'Danish',
  'Finnish', 'Thai', 'Vietnamese', 'Indonesian', 'Malay', 'Filipino',
  'Ukrainian', 'Czech', 'Romanian', 'Greek', 'Hebrew', 'Hungarian',
  'Bulgarian', 'Swahili', 'Afrikaans', 'Zulu', 'Bengali', 'Urdu',
];

/** All OG locale codes for alternateLocale */
export const ALL_OG_LOCALES = [
  'en_US', 'es_ES', 'fr_FR', 'de_DE', 'pt_BR', 'it_IT',
  'ja_JP', 'ko_KR', 'zh_CN', 'ar_SA', 'hi_IN', 'ru_RU',
  'tr_TR', 'nl_NL', 'pl_PL', 'sv_SE', 'nb_NO', 'da_DK',
  'fi_FI', 'th_TH', 'vi_VN', 'id_ID', 'ms_MY', 'tl_PH',
  'uk_UA', 'cs_CZ', 'ro_RO', 'el_GR', 'he_IL', 'hu_HU',
  'bg_BG', 'sw_KE', 'af_ZA', 'zu_ZA', 'bn_BD', 'ur_PK',
];

/**
 * Generate Next.js metadata `alternates.languages` object for a given path.
 * Returns { 'x-default': url, en: url?lang=en, es: url?lang=es, ... }
 */
export function makeLanguageAlternates(path: string, baseUrl = BASE_URL): Record<string, string> {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const sep = cleanPath.includes('?') ? '&' : '?';
  const result: Record<string, string> = {
    'x-default': `${baseUrl}${cleanPath}`,
  };
  for (const lang of ALL_LANG_CODES) {
    result[lang] = `${baseUrl}${cleanPath}${sep}lang=${lang}`;
  }
  return result;
}

/**
 * Generate a complete `alternates` object for Next.js Metadata.
 */
export function makeAlternatesMetadata(path: string, baseUrl = BASE_URL) {
  return {
    canonical: `${baseUrl}${path}`,
    languages: makeLanguageAlternates(path, baseUrl),
  };
}
