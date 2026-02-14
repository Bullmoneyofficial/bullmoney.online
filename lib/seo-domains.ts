export const PRIMARY_DOMAIN = 'https://www.bullmoney.shop';

// Domains that mirror or serve the same content.
// Keep PRIMARY_DOMAIN first (preferred canonical host).
export const SEO_DOMAINS = [
  PRIMARY_DOMAIN,
  'https://www.bullmoney.online',
  'https://www.bullmoney.live',
  'https://www.bullmoney.co.za',
  'https://www.bullmoney.site',
] as const;

export type SeoDomain = (typeof SEO_DOMAINS)[number];
