import type { Metadata } from 'next';
import { makeAlternatesMetadata, ALL_OG_LOCALES } from '@/lib/seo-languages';

export const metadata: Metadata = {
  title: 'My Account | BullMoney Store',
  description:
    'Manage your BullMoney Store account — view orders, track shipments, manage wishlist, update addresses, and account settings.',
  openGraph: {
    title: 'My Account | BullMoney Store',
    description: 'View orders, track shipments, manage your wishlist and account.',
    type: 'website',
    url: 'https://www.bullmoney.shop/store/account',
    locale: 'en_US',
    alternateLocale: ALL_OG_LOCALES.filter(l => l !== 'en_US'),
  },
  robots: {
    index: false, // account pages should not be indexed
    follow: false,
  },
  alternates: makeAlternatesMetadata('/store/account'),
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
