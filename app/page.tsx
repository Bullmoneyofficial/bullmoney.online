"use client";

import dynamic from "next/dynamic";

const HomePageClient = dynamic(
  () => import("./HomePageClient").then(m => ({ default: m.HomePageClient })),
  { ssr: false, loading: () => <div className="min-h-screen bg-black" /> }
);

export default function Page() {
  return <HomePageClient />;
}
