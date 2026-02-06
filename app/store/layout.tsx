import type { Metadata } from 'next';
import { StoreLayoutClient } from './StoreLayoutClient';
import { StoreMemoryProvider } from './StoreMemoryContext';
import { makeAlternatesMetadata, ALL_OG_LOCALES } from '@/lib/seo-languages';

// ============================================================================
// STORE SEO — Completely separate from the main trading community SEO.
// Google indexes /store as a standalone e-commerce section.
// Store sitemap lives at /store/sitemap.xml
// ============================================================================
export const metadata: Metadata = {
  title: {
    default: 'BullMoney Store | Premium Trading Lifestyle Apparel & Gear',
    template: '%s | BullMoney Store',
  },
  description:
    'Shop the official BullMoney Store — premium trading lifestyle apparel, accessories, tech gear & drinkware. Worldwide shipping. Limited editions. Curated for serious traders.',

  keywords: [
    // Store-specific e-commerce keywords
    'BullMoney store', 'BullMoney shop', 'BullMoney merch',
    'trading apparel', 'trading clothing', 'trading t-shirt',
    'trader lifestyle', 'trader merch', 'trader clothing brand',
    'trading accessories', 'trading gear', 'trading tech gear',
    'forex trader shirt', 'crypto trader hoodie', 'stock trader hat',
    'trading lifestyle brand', 'day trader apparel', 'swing trader merch',
    'gold trader clothing', 'bull market merch', 'trading community merch',
    'premium trading apparel', 'limited edition trading gear',
    'trading drinkware', 'trading home office', 'trading desk accessories',
    'BullMoney gift card', 'trading gift', 'trader gift ideas',
    'trading stickers', 'crypto merch', 'forex merch', 'stock market merch',
    'Wall Street apparel', 'finance clothing', 'investor merch',
    'trading hoodie', 'trading cap', 'trading mug', 'trading mousepad',
  ],

  openGraph: {
    title: 'BullMoney Store | Premium Trading Lifestyle Apparel & Gear',
    description:
      'Shop premium trading lifestyle apparel, accessories, and tech gear. Worldwide shipping. Curated for serious traders.',
    type: 'website',
    url: 'https://www.bullmoney.shop/store',
    siteName: 'BullMoney Store',
    images: [
      {
        url: '/ONcc2l601.svg',
        width: 1200,
        height: 630,
        alt: 'BullMoney Store - Premium Trading Lifestyle',
      },
    ],
    locale: 'en_US',
    alternateLocale: ALL_OG_LOCALES.filter(l => l !== 'en_US'),
  },

  twitter: {
    card: 'summary_large_image',
    title: 'BullMoney Store | Trading Lifestyle Apparel & Gear',
    description: 'Premium trading apparel, accessories & tech gear. Worldwide shipping. Shop now!',
    images: ['/ONcc2l601.svg'],
    creator: '@BullMoney',
    site: '@BullMoney',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  alternates: makeAlternatesMetadata('/store'),
};

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StoreMemoryProvider>
      <StoreLayoutClient>{children}</StoreLayoutClient>
    </StoreMemoryProvider>
  );
}
