import type { Metadata } from 'next';
import { makeAlternatesMetadata, ALL_OG_LOCALES } from '@/lib/seo-languages';

// ============================================================================
// PRODUCTS PAGE SEO — Browse all BullMoney Store products
// Connected to store sitemap at /store/sitemap.xml
// ============================================================================
export const metadata: Metadata = {
  title: 'All Products | BullMoney Store',
  description:
    'Browse all BullMoney Store products — premium trading apparel, accessories, tech gear, drinkware, and limited editions. Worldwide shipping. Curated for traders.',
  keywords: [
    'BullMoney products', 'trading products', 'trading apparel',
    'trader clothing', 'trading accessories', 'trading merch',
    'bull money shop products', 'trading lifestyle products',
    'trading gear', 'crypto merch', 'forex merch', 'stock market merch',
    'trading hoodie', 'trading t-shirt', 'trading cap', 'trading mug',
  ],
  openGraph: {
    title: 'All Products | BullMoney Store',
    description: 'Browse premium trading apparel, accessories, tech gear & more. Worldwide shipping.',
    type: 'website',
    url: 'https://www.bullmoney.shop/products',
    siteName: 'BullMoney Store',
    images: [
      {
        url: '/ONcc2l601.svg',
        width: 1200,
        height: 630,
        alt: 'BullMoney Store Products',
      },
    ],
    locale: 'en_US',
    alternateLocale: ALL_OG_LOCALES.filter(l => l !== 'en_US'),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'All Products | BullMoney Store',
    description: 'Premium trading apparel, accessories & gear. Shop now!',
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
  alternates: makeAlternatesMetadata('/products'),
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
