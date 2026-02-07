"use client";
import React, { useMemo } from "react";
import { Timeline } from "@/components/ui/timeline";
import Link from "next/link";
import Image from "next/image";

// --- Types ---
interface VipProduct {
  title: string;
  src: string;
  price: number;
  description: string;
  comingSoon: boolean;
  buyUrl: string;
}

interface FeaturedProductsTimelineProps {
  products: VipProduct[];
}

// --- 1. THE ANIMATION ENGINE (Injecting Apple-style Keyframes) ---
const AnimationStyles = () => (
  <style jsx global>{`
    /* 1. Blur Reveal (Apple's signature headline effect) */
    @keyframes blur-in {
      0% { opacity: 0; filter: blur(12px); transform: translateY(10px); }
      100% { opacity: 1; filter: blur(0); transform: translateY(0); }
    }
    
    /* 2. Tracking Expand (Cinematic letter spacing) */
    @keyframes tracking-expand {
      0% { letter-spacing: -0.05em; opacity: 0; }
      100% { letter-spacing: 0.05em; opacity: 1; }
    }

    /* 3. Text Shimmer (Gradient flowing across text) */
    @keyframes shimmer-text {
      0% { background-position: 200% center; }
      100% { background-position: -200% center; }
    }

    /* 4. Mask Wipe (Reveals text from left to right) */
    @keyframes mask-wipe {
      0% { clip-path: inset(0 100% 0 0); opacity: 0; }
      100% { clip-path: inset(0 0 0 0); opacity: 1; }
    }

    /* 5. 3D Flip Up (Words rotating into view) */
    @keyframes flip-up {
      0% { transform: rotateX(90deg); opacity: 0; }
      100% { transform: rotateX(0); opacity: 1; }
    }

    /* 6. Elastic Slide (Physics-based slide) */
    @keyframes elastic-slide {
      0% { transform: translateX(-30px); opacity: 0; }
      60% { transform: translateX(5px); }
      100% { transform: translateX(0); opacity: 1; }
    }

    /* 7. Soft Scale (Breathing effect) */
    @keyframes soft-scale {
      0% { transform: scale(0.95); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }

    /* 8. Fade Up Stagger (Standard but clean) */
    @keyframes fade-up {
      0% { transform: translateY(20px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }

    /* 9. Glow Pulse (Subtle text neon) */
    @keyframes glow-pulse {
      0%, 100% { text-shadow: 0 0 10px rgba(255,255,255,0.1); }
      50% { text-shadow: 0 0 20px rgba(255,255,255,0.3); }
    }

    /* 10. Typewriter Cursor (Blinking cursor effect) */
    @keyframes cursor-blink {
      50% { border-color: transparent; }
    }

    /* Utilities */
    .anim-blur-in { animation: blur-in 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
    .anim-tracking { animation: tracking-expand 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
    .anim-shimmer { background-size: 200% auto; animation: shimmer-text 4s linear infinite; }
    .anim-mask { animation: mask-wipe 1s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
    .anim-flip { animation: flip-up 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
    .anim-elastic { animation: elastic-slide 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
    .anim-scale { animation: soft-scale 0.8s ease-out forwards; }
    .anim-fade-up { animation: fade-up 0.6s ease-out forwards; }
    .anim-glow { animation: glow-pulse 3s infinite; }
    
    /* Delay Utilities */
    .delay-100 { animation-delay: 100ms; }
    .delay-200 { animation-delay: 200ms; }
    .delay-300 { animation-delay: 300ms; }
    .delay-500 { animation-delay: 500ms; }
  `}</style>
);

// --- 2. SUB-COMPONENTS ---

const SectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="mb-8 pl-1">
    {/* Animation 3: Shimmer Text on Title */}
    <h3 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-neutral-200 to-neutral-500 anim-shimmer mb-3">
      {title}
    </h3>
    {/* Animation 4: Mask Wipe on Subtitle */}
    <p className="text-sm md:text-base text-neutral-400 font-medium leading-relaxed max-w-md anim-mask delay-200">
      {subtitle}
    </p>
  </div>
);

const StoryCard = ({
  period,
  title,
  description,
  idx
}: {
  period: string;
  title: string;
  description: string;
  idx: number
}) => {
  return (
    <div className="relative pl-6 md:pl-8 border-l border-white/10 py-2 group">
      {/* Animation 9: Glow Pulse on the Dot */}
      <span className="absolute -left-[5px] top-3 h-2.5 w-2.5 rounded-full bg-white ring-4 ring-neutral-950 anim-glow" />
      
      <div className="flex flex-col space-y-2">
        {/* Animation 2: Tracking Expand on Date */}
        <span className="text-xs font-mono text-neutral-500 uppercase anim-tracking" style={{ animationDelay: `${idx * 200}ms` }}>
          {period}
        </span>
        
        {/* Animation 1: Blur In on Title */}
        <h4 
          className="text-xl md:text-2xl font-semibold text-white anim-blur-in"
          style={{ animationDelay: `${idx * 200 + 100}ms` }}
        >
          {title}
        </h4>
        
        {/* Animation 8: Fade Up on Body */}
        <p 
          className="text-sm md:text-base text-neutral-400 leading-relaxed max-w-lg anim-fade-up"
          style={{ animationDelay: `${idx * 200 + 200}ms` }}
        >
          {description}
        </p>
      </div>
    </div>
  );
};

const ProductCard = ({ product, idx }: { product: VipProduct; idx: number }) => (
  <Link
    href={product.buyUrl || "#"}
    className="group relative block w-full perspective-1000"
  >
    {/* Animation 5: 3D Flip Up entry for the card itself */}
    <div 
      className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-neutral-900 border border-white/5 shadow-2xl transition-all duration-500 group-hover:border-white/20 anim-flip origin-bottom"
      style={{ animationDelay: `${idx * 150}ms` }}
    >
      <Image
        src={product.src}
        alt={product.title}
        fill
        className={`object-cover transition-transform duration-700 ease-out group-hover:scale-110 ${
          product.comingSoon ? "grayscale opacity-50" : ""
        }`}
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

      {product.comingSoon && (
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1 text-[10px] font-bold tracking-widest text-black bg-white/90 backdrop-blur-md rounded-full uppercase shadow-lg">
            Soon
          </span>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
        {/* Animation 6: Elastic Slide for text on hover (simulated here with delay on load) */}
        <h4 className="text-sm font-medium text-white line-clamp-1 mb-1 anim-elastic delay-300">
          {product.title}
        </h4>
        <p className="text-sm font-bold text-neutral-300 anim-elastic delay-500">
          ${product.price?.toFixed(2) || "0.00"}
        </p>
      </div>
    </div>
  </Link>
);

// --- 3. MAIN COMPONENT ---

export function FeaturedProductsTimeline({ products }: FeaturedProductsTimelineProps) {
  // Memoize sorted data
  const { featured, newArrivals, comingSoon } = useMemo(() => ({
    featured: products.filter((p) => !p.comingSoon).slice(0, 4),
    newArrivals: products.filter((p) => !p.comingSoon).slice(4, 8),
    comingSoon: products.filter((p) => p.comingSoon),
  }), [products]);

  // Construct Timeline Data
  const timelineData = [
    {
      title: "Vision",
      content: (
        <div className="mb-12">
          {/* Animation 7: Soft Scale */}
          <p className="text-neutral-300 italic text-lg md:text-xl font-light border-l-2 border-white/20 pl-6 anim-scale">
            "We didn't just build a brand. We built a standard."
          </p>
        </div>
      ),
    },
    {
      title: "2023",
      content: (
        <div className="space-y-12">
          <StoryCard
            idx={1}
            period="Jan - Jun '23"
            title="The Origin"
            description="One laptop. One trader. Zero marketing budget. Just raw chart analysis posted at 3AM."
          />
          <StoryCard
            idx={2}
            period="Jul - Dec '23"
            title="The Signal"
            description="Viral growth purely through word of mouth. The inner circle began to form."
          />
        </div>
      ),
    },
    {
      title: "2024",
      content: (
        <div className="space-y-12">
          <StoryCard
            idx={3}
            period="Expansion"
            title="The Ecosystem"
            description="Discord launch. Live mentorship. Real-time execution. We turned followers into profitable traders."
          />
        </div>
      ),
    },
    {
      title: "2025",
      content: (
        <div className="space-y-12">
          <StoryCard
            idx={4}
            period="Current Era"
            title="Store Launch"
            description="Premium tools and physical goods for the 1%."
          />
          {/* Animation 10: Cursor Blink Effect */}
          <div className="inline-block border-r-2 border-white pr-2 animate-[cursor-blink_1s_step-end_infinite]">
             <p className="text-white text-sm font-mono mt-4">10,000+ Members. Loading next chapter...</p>
          </div>
        </div>
      ),
    },
  ];

  // Logic to push Product Grids
  if (featured.length > 0) {
    timelineData.push({
      title: "Shop",
      content: (
        <div>
          <SectionHeader 
            title="Featured Collection" 
            subtitle="High-demand items curated for our top traders." 
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featured.map((p, i) => <ProductCard key={i} product={p} idx={i} />)}
          </div>
        </div>
      ),
    });
  }

  if (newArrivals.length > 0) {
    timelineData.push({
      title: "Fresh",
      content: (
        <div>
          <SectionHeader 
            title="Just Arrived" 
            subtitle="The latest drops. Limited stock available." 
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {newArrivals.map((p, i) => <ProductCard key={i} product={p} idx={i + 4} />)}
          </div>
        </div>
      ),
    });
  }

  if (comingSoon.length > 0) {
    timelineData.push({
      title: "Soon",
      content: (
        <div>
          <SectionHeader 
            title="In Development" 
            subtitle="A sneak peek at what's coming next to the store." 
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {comingSoon.slice(0, 4).map((p, i) => <ProductCard key={i} product={p} idx={i + 8} />)}
          </div>
        </div>
      ),
    });
  }

  return (
    <div className="w-full bg-neutral-950 font-sans antialiased text-neutral-200">
      <AnimationStyles />
      <div className="w-full px-2 md:px-6 lg:px-10">
        <Timeline data={timelineData} />
      </div>
    </div>
  );
}