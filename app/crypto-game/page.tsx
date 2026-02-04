"use client";

import dynamic from "next/dynamic";

// Dynamically import the game to avoid SSR issues with Three.js
const SolarSystemGame = dynamic(
  () => import("@/components/SolarSystemGame"),
  { 
    ssr: false, 
    loading: () => (
      <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: "#000000" }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-blue-400 text-lg font-bold">Loading Crypto Chaos...</p>
        </div>
      </div>
    ),
  }
);

export default function CryptoGamePage() {
  return (
    <main className="w-full min-h-screen" style={{ backgroundColor: "#000000" }}>
      <SolarSystemGame />
    </main>
  );
}
