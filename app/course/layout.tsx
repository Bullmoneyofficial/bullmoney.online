import type { Metadata } from 'next';
import { makeAlternatesMetadata, ALL_OG_LOCALES } from '@/lib/seo-languages';

export const metadata: Metadata = {
  title: 'Trading Course | Free Trading Education | BullMoney',
  description:
    'Learn to trade for FREE with BullMoney. Comprehensive trading courses covering Crypto, Forex, Gold, Stocks, technical analysis, risk management & more. From beginner to professional trader.',
  keywords: [
    'free trading course', 'trading course', 'learn to trade',
    'trading education', 'trading for beginners', 'crypto course',
    'forex course', 'gold trading course', 'stock trading course',
    'technical analysis course', 'trading academy', 'free trading school',
    'trading lessons', 'trading tutorial', 'day trading course',
    'swing trading course', 'learn trading free 2026',
  ],
  openGraph: {
    title: 'Trading Course | Free Trading Education | BullMoney',
    description: 'Learn to trade for FREE. Crypto, Forex, Gold, Stocks courses from beginner to pro.',
    url: 'https://www.bullmoney.shop/course',
    type: 'website',
    siteName: 'BullMoney Trading Community',
    locale: 'en_US',
    alternateLocale: ALL_OG_LOCALES.filter(l => l !== 'en_US'),
    images: [{ url: '/ONcc2l601.svg', width: 1200, height: 630, alt: 'BullMoney Trading Course' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Trading Course | BullMoney',
    description: 'Learn to trade Crypto, Forex, Gold & Stocks for FREE. Start now!',
    images: ['/ONcc2l601.svg'],
  },
  alternates: makeAlternatesMetadata('/course'),
};

export default function CourseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
