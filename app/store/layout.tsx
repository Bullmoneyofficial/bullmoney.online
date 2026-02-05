import type { Metadata } from 'next';
import { StoreLayoutClient } from './StoreLayoutClient';

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
  return <StoreLayoutClient>{children}</StoreLayoutClient>;
}
