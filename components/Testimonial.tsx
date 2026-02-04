// app/about/AboutContent.tsx
"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence  } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

// Neon Blue Sign Style from Chartnews
const NEON_STYLES = `
  @keyframes neon-pulse {
    0%, 100% { 
      text-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff;
      filter: brightness(1);
    }
    50% { 
      text-shadow: 0 0 6px #ffffff, 0 0 12px #ffffff;
      filter: brightness(1.1);
    }
  }

  @keyframes neon-glow {
    0%, 100% { 
      box-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff, inset 0 0 4px #ffffff;
    }
    50% { 
      box-shadow: 0 0 6px #ffffff, 0 0 12px #ffffff, inset 0 0 6px #ffffff;
    }
  }

  .neon-blue-text {
    color: #ffffff;
    text-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff;
    animation: neon-pulse 2s ease-in-out infinite;
  }

  .neon-white-text {
    color: #ffffff;
    text-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff;
  }

  .neon-white-icon {
    filter: drop-shadow(0 0 4px #ffffff) drop-shadow(0 0 8px #ffffff);
  }

  .neon-blue-icon {
    filter: drop-shadow(0 0 4px #ffffff) drop-shadow(0 0 8px #ffffff);
  }

  .neon-blue-border {
    border: 2px solid #ffffff;
    box-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff, inset 0 0 4px #ffffff;
    animation: neon-glow 2s ease-in-out infinite;
  }

  .neon-blue-bg {
    background: #ffffff;
    box-shadow: 0 0 8px #ffffff, 0 0 16px #ffffff;
  }

  .gpu-layer {
    transform: translateZ(0);
    will-change: transform, opacity;
    backface-visibility: hidden;
  }
`;

const fade = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.5 },
};

export function AboutContent() {
  return (
    <main className="px-4 md:px-6">
      <style dangerouslySetInnerHTML={{ __html: NEON_STYLES }} />
      <section
        className={cn(
          "relative mx-auto w-full max-w-5xl overflow-hidden rounded-3xl p-6 md:p-10",
          "bg-neutral-950 ring-1 ring-white/10",
          "shadow-[0_1px_1px_rgba(0,0,0,0.05),0_18px_80px_rgba(2,6,23,0.5)]"
        )}
      >
        
        {/* decorative SVG (your path) */}
        <svg className="pointer-events-none absolute -left-10 -bottom-10 h-[420px] w-[420px] opacity-[0.08]" viewBox="3000 180 900 700" aria-hidden="true">
          <path
            d="M3674.28 294.152C3618.3 238.404 3547.62 210.078 3464.17 210.078C3380.58 210.078 3309.89 238.404 3253.91 294.152C3198.08 350.051 3169.71 419.058 3169.71 499.667C3169.71 580.728 3198.08 650.187 3253.91 706.086C3309.74 761.834 3380.58 790.16 3464.17 790.16C3547.77 790.16 3618.45 761.834 3674.28 706.086C3730.11 650.337 3758.48 580.878 3758.48 499.667C3758.48 419.058 3730.11 349.9 3674.28 294.152ZM3594.44 635.27C3559.77 672.637 3516.25 691.47 3465.07 691.47C3413.29 691.47 3369.32 672.486 3334.35 635.27C3299.38 597.904 3281.52 552.251 3281.52 499.516C3281.52 446.932 3299.23 401.43 3334.35 364.214C3369.32 327.149 3413.29 308.315 3465.07 308.315C3516.25 308.315 3559.77 327.149 3594.59 364.063C3629.41 401.128 3646.97 446.631 3646.97 499.366C3646.82 552.251 3629.11 597.904 3594.44 635.27Z"
            fill="#262729"
          />
        </svg>


        {/* Divider */}
        <motion.section {...fade}>
          
        </motion.section>

        {/* Divider */}
        <div className="my-8 h-px w-full bg-gradient-to-r from-sky-500/20 via-white/20 to-indigo-500/20" />
        <TestimonialsCarousel />

        {/* CTA / Footer */}
        <div className="mt-8 h-px w-full bg-gradient-to-r from-sky-500/20 via-white/20 to-indigo-500/20" />
        <footer className="mt-6 flex items-center justify-between">
          <Link href="/" className="rounded-full px-3 py-1 text-sm font-semibold text-white bg-neutral-900 ring-1 ring-sky-500/30 hover:ring-sky-400/60">
            Back
          </Link>
          <span className="text-sm bg-gradient-to-r from-sky-400 via-white to-indigo-400 bg-clip-text text-transparent font-semibold">
             •  •  •
          </span>
        </footer>

      </section>
    </main>
  );
}
const testimonials = [
  {
    name: "Justin P.",
    text: "BullMoney changed how I view trading I passed my first funded challenge thanks to their mentorship!",
    image: "/justinftmo.jpg",
    icon: "/bullmoney-logo.png",
  },
  {
    name: "Damian R.",
    text: "The community and daily insights make such a difference. It’s like having a pro team behind you every day.",
    image: "/DamianRudolph.png",
    icon: "/eqlogo.png",
  },
  {
    name: "Litha S.",
    text: "I’ve been through countless trading groups, but BullMoney’s structured education actually works.",
    image: "/LithaSilo.png",
    icon: "/eqlogo.png",
  },
  {
    name: "Aya R.",
    text: "Their market breakdowns are spot on. I’m finally trading with confidence and consistency.",
    image: "/AyaRungqu.png",
    icon: "/eqlogo.png",
  },
  {
    name: "Ntlakanipho B.",
    text: "Their market breakdowns are spot on. I’m finally trading with confidence and consistency.",
    image: "/NtlakaniphoBlouw.png",
    icon: "/eqlogo.png",
  },
];

export function TestimonialsCarousel() {
  const [index, setIndex] = useState(0);

  const nextSlide = () => setIndex((index + 1) % testimonials.length);
  const prevSlide = () => setIndex((index - 1 + testimonials.length) % testimonials.length);

  const currentTestimonial = testimonials[index];
  if (!currentTestimonial) return null;

  return (
    <motion.section
      {...fade}
      className="relative mt-8 md:mt-12 w-full max-w-6xl mx-auto px-4 md:px-0"
    >
      {/* Minimalist header */}
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-sm font-semibold tracking-wider text-white/50 uppercase mb-2">
          Real Results
        </h2>
        <p className="text-xl md:text-2xl font-semibold text-white">
          What Our Traders Say About BullMoney
        </p>
      </div>

      {/* Clean card design */}
      <div className="relative h-[320px] md:h-[420px] overflow-hidden rounded-2xl md:rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-white/10">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            className="absolute inset-0 flex items-end justify-center p-6 md:p-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_e, { offset, velocity }) => {
              if (offset.x < -50 || velocity.x < -200) nextSlide();
              if (offset.x > 50 || velocity.x > 200) prevSlide();
            }}
          >
            {/* Subtle background image */}
            <Image
              src={currentTestimonial.image}
              alt={currentTestimonial.name}
              fill
              sizes="(min-width: 1024px) 900px, 100vw"
              className="object-cover opacity-40"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent" />
            
            {/* Content - clean and spacious */}
            <div className="relative text-white max-w-xl space-y-4">
              <p className="text-base md:text-lg leading-relaxed text-white/90">
                &ldquo;{currentTestimonial.text}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-2">
                <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-white/5 border border-white/10">
                  <Image
                    src={currentTestimonial.icon}
                    alt={`${currentTestimonial.name} icon`}
                    fill
                    className="object-contain p-2"
                  />
                </div>
                <div>
                  <p className="text-sm md:text-base font-medium text-white">{currentTestimonial.name}</p>
                  <p className="text-xs text-white/50">BullMoney Member</p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Minimal navigation */}
        <button
          onClick={prevSlide}
          className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all flex items-center justify-center border border-white/10"
          aria-label="Previous"
        >
          <ChevronLeft size={18} className="text-white" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all flex items-center justify-center border border-white/10"
          aria-label="Next"
        >
          <ChevronRight size={18} className="text-white" />
        </button>
      </div>

      {/* Minimal pagination dots */}
      <div className="flex justify-center mt-4 md:mt-6 gap-2">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === index
                ? "w-6 bg-white"
                : "w-1.5 bg-white/30 hover:bg-white/50"
            }`}
            aria-label={`Go to testimonial ${i + 1}`}
          />
        ))}
      </div>
    </motion.section>
  );
}
