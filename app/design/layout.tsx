'use client';

import dynamic from 'next/dynamic';
import { StoreHeader } from '@/components/store/StoreHeader';

const StoreFooter = dynamic(
  () => import(/* webpackChunkName: "store-footer" */ '@/components/shop/StoreFooter'),
  { ssr: false, loading: () => <div className="h-48 bg-black/50" /> }
);

export default function DesignLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StoreHeader />
      <div style={{ paddingTop: 48 }}>{children}</div>
      <StoreFooter />
    </>
  );
}
