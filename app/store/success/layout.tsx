import type { Metadata } from 'next';
import { makeAlternatesMetadata } from '@/lib/seo-languages';

export const metadata: Metadata = {
  title: 'Order Confirmed | BullMoney Store',
  description: 'Your BullMoney Store order has been confirmed. Thank you for your purchase!',
  robots: {
    index: false, // success pages should not be indexed
    follow: false,
  },
  alternates: makeAlternatesMetadata('/store/success'),
};

export default function SuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
