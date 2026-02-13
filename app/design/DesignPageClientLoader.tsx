"use client";

import dynamic from "next/dynamic";

const DesignPageClient = dynamic(() => import("./DesignPageClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[60vh] flex items-center justify-center bg-black/5">
      <div className="inline-block w-8 h-8 border-[3px] border-black/10 border-t-black/60 rounded-full animate-spin" />
    </div>
  ),
});

export default function DesignPageClientLoader() {
  return <DesignPageClient />;
}
