import type { Metadata } from 'next';
import { makeAlternatesMetadata, ALL_OG_LOCALES } from '@/lib/seo-languages';

export const metadata: Metadata = {
  title: 'Trading Journal | Track Your Trades | BullMoney',
  description:
    'Track and analyze your trades with the BullMoney Trading Journal. Log entries, review performance, identify patterns, and become a more profitable trader. Free journaling tool.',
  keywords: [
    'trading journal', 'trade journal', 'trading journal app',
    'free trading journal', 'trading log', 'track trades',
    'trading diary', 'trade tracker', 'trading performance',
    'analyze trades', 'trading review', 'trading journal 2026',
    'best trading journal', 'online trading journal',
  ],
  openGraph: {
    title: 'Trading Journal | Track Your Trades | BullMoney',
    description: 'Log trades, analyze performance, and become more profitable with BullMoney Journal.',
    url: 'https://www.bullmoney.shop/journal',
    type: 'website',
    siteName: 'BullMoney Trading Community',
    locale: 'en_US',
    alternateLocale: ALL_OG_LOCALES.filter(l => l !== 'en_US'),
    images: [{ url: '/ONcc2l601.svg', width: 1200, height: 630, alt: 'BullMoney Trading Journal' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trading Journal | BullMoney',
    description: 'Track and analyze your trades. Become a more profitable trader.',
    images: ['/ONcc2l601.svg'],
  },
  alternates: makeAlternatesMetadata('/journal'),
};

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
