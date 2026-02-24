import type { ProductWithDetails } from '@/types/store';

export type StoreDisplayMode = 'global' | 'vip' | 'timer';

export type StorePageProps = {
  routeBase?: string;
  syncUrl?: boolean;
  showProductSections?: boolean;
};

export type StudioOpts = {
  tab?: 'browse' | 'product' | 'upload' | 'create' | 'orders' | 'designs';
  productId?: string;
  artId?: string;
  productType?: string;
};

export type StudioState = { open: boolean } & StudioOpts;

export type PaymentMethod = 'cart' | 'stripe' | 'whop' | 'skrill';

export type DesktopMarketIntelState = {
  community: boolean;
  quotes: boolean;
  news: boolean;
};

/** A product with resolved primary image for the quick-add panel */
export type ExpandedProductState = ProductWithDetails | null;
