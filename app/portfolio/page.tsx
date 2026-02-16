"use client";

import dynamic from "next/dynamic";
import React, { Suspense } from "react";

// Lazy load the heavy portfolio client component
const PortfolioClient = dynamic(() => import("./PortfolioClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-white/60 text-sm tracking-widest uppercase">Loading Portfolio</p>
      </div>
    </div>
  ),
});

export default function PortfolioPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PortfolioClient />
    </Suspense>
  );
}
