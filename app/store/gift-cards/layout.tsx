import type { Metadata } from 'next';
import { makeAlternatesMetadata, ALL_OG_LOCALES } from '@/lib/seo-languages';

export const metadata: Metadata = {
  title: 'Gift Cards | BullMoney Store',
  description:
    'Buy BullMoney digital gift cards — the perfect gift for any trader. Send instantly via email. Available in custom amounts. Redeemable on all store products worldwide.',
  keywords: [
    'BullMoney gift card', 'trading gift card', 'trader gift',
    'digital gift card', 'e-gift card trading', 'trader gift ideas',
    'crypto trader gift', 'forex trader gift', 'BullMoney voucher',
  ],
  openGraph: {
    title: 'Gift Cards | BullMoney Store',
    description: 'The perfect gift for any trader. Send a BullMoney gift card instantly.',
    type: 'website',
    url: 'https://www.bullmoney.shop/store/gift-cards',
    locale: 'en_US',
    alternateLocale: ALL_OG_LOCALES.filter(l => l !== 'en_US'),
  },
  alternates: makeAlternatesMetadata('/store/gift-cards'),
};

export default function GiftCardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
