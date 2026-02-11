"use client";

import dynamic from "next/dynamic";

const GamesPageClient = dynamic(
  () => import("./GamesPageClient").then(m => ({ default: m.GamesPageClient })),
  { ssr: false, loading: () => <div className="min-h-screen bg-[#0b1120]" /> }
);

export default function GamesPage() {
  return <GamesPageClient />;
}
