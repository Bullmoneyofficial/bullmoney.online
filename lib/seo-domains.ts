// Canonical hosts.
// Community/content pages should canonicalize to COMMUNITY_DOMAIN.
// Store pages should canonicalize to STORE_DOMAIN.
export const COMMUNITY_DOMAIN = 'https://bullmoney.online';
export const STORE_DOMAIN = 'https://www.bullmoney.shop';

// Aliases / legacy domains that should redirect to the canonical host.
export const ALIAS_HOSTS = [
  'bullmoney.online',
  'www.bullmoney.online',
  'bullmoney.shop',
  'www.bullmoney.shop',
  'bullmoney.live',
  'www.bullmoney.live',
  'bullmoney.co.za',
  'www.bullmoney.co.za',
  'bullmoney.site',
  'www.bullmoney.site',
] as const;

export type AliasHost = (typeof ALIAS_HOSTS)[number];

export function isStorePath(pathname: string) {
  return (
    pathname === '/store' ||
    pathname.startsWith('/store/') ||
    pathname === '/products' ||
    pathname.startsWith('/products/')
  );
}

export function canonicalBaseForPath(pathname: string) {
  return isStorePath(pathname) ? STORE_DOMAIN : COMMUNITY_DOMAIN;
}
