import type { Metadata } from 'next';
import { makeAlternatesMetadata, ALL_OG_LOCALES } from '@/lib/seo-languages';

export const metadata: Metadata = {
  title: 'Checkout | BullMoney Store',
  description: 'Complete your BullMoney Store purchase securely. Worldwide shipping. Multiple payment options available.',
  openGraph: {
    title: 'Checkout | BullMoney Store',
    description: 'Secure checkout. Worldwide shipping available.',
    type: 'website',
    url: 'https://www.bullmoney.shop/store/checkout',
    locale: 'en_US',
    alternateLocale: ALL_OG_LOCALES.filter(l => l !== 'en_US'),
  },
  robots: {
    index: false, // checkout should not be indexed
    follow: false,
  },
  alternates: makeAlternatesMetadata('/store/checkout'),
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div 
      className="min-h-screen bg-black text-white"
      style={{
        // No extra padding needed - parent StoreLayout already handles main navbar offset
        // Checkout has its own header inside CheckoutWizard
      }}
    >
      {children}
    </div>
  );
}
