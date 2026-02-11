"use client";

import dynamic from "next/dynamic";

const StorePageClient = dynamic(
  () => import("./StorePageClient").then(m => ({ default: m.StorePageClient })),
  { ssr: false, loading: () => <div className="min-h-screen bg-white" /> }
);

export default function StorePage() {
  return <StorePageClient />;
}
