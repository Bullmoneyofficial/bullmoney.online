import type { Metadata } from 'next';
import { StoreLayoutClient } from './StoreLayoutClient';
import { StoreMemoryProvider } from './StoreMemoryContext';

export const metadata: Metadata = {
  title: 'Bullmoney Store | Premium Trading Lifestyle',
  description: 'Shop premium trading lifestyle apparel, accessories, and tech gear. Curated for serious traders.',
  openGraph: {
    title: 'Bullmoney Store | Premium Trading Lifestyle',
    description: 'Shop premium trading lifestyle apparel, accessories, and tech gear.',
    type: 'website',
  },
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
