import type { Metadata } from 'next';
import { makeAlternatesMetadata, ALL_OG_LOCALES } from '@/lib/seo-languages';

export const metadata: Metadata = {
  title: 'Trading Community | Connect with 10,000+ Traders | BullMoney',
  description:
    'Join the BullMoney trading community — 10,000+ active traders sharing free setups, analysis, and support. Discuss Crypto, Forex, Gold & Stocks. Free to join worldwide.',
  keywords: [
    'trading community', 'free trading community', 'best trading community',
    'online trading community', 'crypto community', 'forex community',
    'gold trading community', 'stock trading community', 'trader network',
    'trading group', 'trading forum', 'active trading community 2026',
    'profitable trading community', 'day trading community',
  ],
  openGraph: {
    title: 'Trading Community | 10,000+ Traders | BullMoney',
    description: 'Join 10,000+ traders. Free setups, analysis & support. Crypto, Forex, Gold & Stocks.',
    url: 'https://www.bullmoney.shop/community',
    type: 'website',
    siteName: 'BullMoney Trading Community',
    locale: 'en_US',
    alternateLocale: ALL_OG_LOCALES.filter(l => l !== 'en_US'),
    images: [{ url: '/ONcc2l601.svg', width: 1200, height: 630, alt: 'BullMoney Trading Community' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trading Community | BullMoney',
    description: 'Join 10,000+ traders. Free setups & analysis for Crypto, Forex, Gold.',
    images: ['/ONcc2l601.svg'],
  },
  alternates: makeAlternatesMetadata('/community'),
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
