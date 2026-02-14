"use client";

import dynamic from "next/dynamic";
import Image from "next/image";

// ✅ PERF: SSR-rendered static shell for instant FCP/LCP
// Heavy client logic loads progressively after hydration
const HomePageClient = dynamic(
  () => import("./HomePageClient").then(m => ({ default: m.HomePageClient })),
  { 
    ssr: false,
    loading: () => <HomePageShell />
  }
);

// ✅ STATIC SHELL: Immediate content for fast FCP/LCP
// This renders on the server and appears instantly
function HomePageShell() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero section skeleton - matches actual hero dimensions */}
      <div className="relative w-full h-screen flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div 
          className="absolute inset-0 bg-linear-to-b from-black via-[#0a0a0a] to-black"
          style={{ willChange: 'opacity' }}
        />
        
        {/* Logo placeholder for LCP - use actual logo for best LCP */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-6">
          <div className="relative w-50 h-15 md:w-70 md:h-20">
            <Image
              src="/bullmoney-logo.png"
              alt="BullMoney"
              fill
              priority
              sizes="(max-width: 768px) 200px, 280px"
              className="object-contain"
              style={{ willChange: 'opacity' }}
            />
          </div>
          
          {/* Loading indicator */}
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <div 
              className="w-4 h-4 border-2 border-white/20 border-t-white/80 rounded-full"
              style={{ animation: 'spin 0.8s linear infinite' }}
            />
            <span>Loading...</span>
          </div>
        </div>
        
        {/* Subtle radial glow */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(255,255,255,0.02) 0%, transparent 60%)'
          }}
        />
      </div>
      
      {/* CSS for spinner animation */}
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function Page() {
  return <HomePageClient />;
}
