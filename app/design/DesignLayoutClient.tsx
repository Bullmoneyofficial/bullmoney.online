'use client';

import dynamic from 'next/dynamic';

const StoreHeader = dynamic(
  () => import('@/components/store/StoreHeader').then(mod => ({ default: mod.StoreHeader })),
  { ssr: false, loading: () => <div className="h-12 w-full bg-black/40" /> }
);

const StoreFooter = dynamic(
  () => import(/* webpackChunkName: "store-footer" */ '@/components/shop/StoreFooter'),
  { ssr: false, loading: () => <div className="h-48 bg-black/50" /> }
);

export function DesignLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StoreHeader />
      <div style={{ paddingTop: 48 }}>{children}</div>
      <StoreFooter />
    </>
  );
}
