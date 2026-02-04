"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { ParallaxScroll } from "./ui/parallax-scroll";

// Dynamically import FluidGlass to avoid SSR issues with Three.js
const FluidGlass = dynamic(() => import("./FluidGlass"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full flex items-center justify-center bg-gradient-to-b from-purple-900/20 to-transparent">
      <div className="text-white text-xl animate-pulse">Loading 3D Experience...</div>
    </div>
  ),
});

export default function TradingShowcase() {
  return (
    <section className="relative w-full min-h-screen bg-black overflow-hidden">
      {/* Hero Section with 3D Glass Effect */}
      <div className="relative w-full">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-black to-black z-0" />
        
        {/* 3D Fluid Glass Component */}
        <div className="relative z-10 h-[600px] md:h-[800px] lg:h-[1000px] w-full">
          <Suspense fallback={<div className="h-full w-full bg-black" />}>
            <FluidGlass 
              mode="lens"
              lensProps={{
                scale: 0.25,
                ior: 1.15,
                thickness: 5,
                chromaticAberration: 0.1,
                anisotropy: 0.01,
                transmission: 1,
                roughness: 0,
              }}
            />
          </Suspense>
        </div>

        {/* Overlay Text */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
          <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold text-white text-center mb-4 drop-shadow-2xl">
            Elite Trading Results
          </h1>
          <p className="text-xl md:text-2xl lg:text-3xl text-purple-300 text-center max-w-3xl px-4 drop-shadow-xl">
            Consistent Profits. Proven Strategies. Real Performance.
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="relative z-30 w-full bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-purple-600/20 backdrop-blur-xl border-y border-purple-500/30 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-5xl font-bold text-white mb-2">95%</div>
              <div className="text-sm md:text-base text-purple-300">Win Rate</div>
            </div>
            <div>
              <div className="text-3xl md:text-5xl font-bold text-white mb-2">$2M+</div>
              <div className="text-sm md:text-base text-purple-300">Total Profits</div>
            </div>
            <div>
              <div className="text-3xl md:text-5xl font-bold text-white mb-2">5000+</div>
              <div className="text-sm md:text-base text-purple-300">Successful Trades</div>
            </div>
            <div>
              <div className="text-3xl md:text-5xl font-bold text-white mb-2">24/7</div>
              <div className="text-sm md:text-base text-purple-300">Market Analysis</div>
            </div>
          </div>
        </div>
      </div>

      {/* Parallax Scroll Section */}
      <div className="relative z-20 w-full py-20 px-4">
        <div className="max-w-7xl mx-auto mb-16 text-center">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Our Winning Trades
          </h2>
          <p className="text-lg md:text-xl text-purple-300 max-w-3xl mx-auto">
            Scroll through our documented trading successes. Every screenshot tells a story of precision, 
            strategy, and exceptional risk management.
          </p>
        </div>

        {/* Parallax Image Grid */}
        <ParallaxScroll images={tradingImages} className="h-[50rem] md:h-[60rem] lg:h-[70rem]" />
      </div>

      {/* Call to Action */}
      <div className="relative z-20 w-full py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Trade Like a Pro?
          </h3>
          <p className="text-lg md:text-xl text-purple-300 mb-8">
            Join thousands of successful traders who trust our signals and strategies.
          </p>
          <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-12 rounded-full text-lg transition-all transform hover:scale-105 shadow-2xl">
            Get Started Today
          </button>
        </div>
      </div>
    </section>
  );
}

// Trading performance images - replace these with your actual trading screenshots
const tradingImages = [
  // Replace with your actual trading screenshots from /public/assets/demo/
  "/assets/demo/cs1.webp",
  "/assets/demo/cs2.webp",
  "/assets/demo/cs3.webp",
  "/dashboard1.jpg",
  "/justinftmo.jpg",
  "/longbull.jpg",
  "/xmd.jpg",
  "/new.jpg",
  "/new1.jpg",
  "/assets/demo/cs1.webp",
  "/assets/demo/cs2.webp",
  "/assets/demo/cs3.webp",
  "/dashboard1.jpg",
  "/justinftmo.jpg",
  "/longbull.jpg",
  "/xmd.jpg",
  "/new.jpg",
  "/new1.jpg",
  "/assets/demo/cs1.webp",
  "/assets/demo/cs2.webp",
  "/assets/demo/cs3.webp",
  "/dashboard1.jpg",
  "/justinftmo.jpg",
  "/longbull.jpg",
  "/xmd.jpg",
  "/new.jpg",
  "/new1.jpg",
  "/assets/demo/cs1.webp",
  "/assets/demo/cs2.webp",
  "/assets/demo/cs3.webp",
];
