// app/about/AboutContent.tsx
"use client";
import { memo, useEffect, useMemo, useState } from "react";
import { Quote, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
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
        <div className="my-8 h-px w-full bg-linear-to-r from-sky-500/20 via-white/20 to-indigo-500/20" />
        <TestimonialsCarousel />

        {/* CTA / Footer */}
        <div className="mt-8 h-px w-full bg-linear-to-r from-sky-500/20 via-white/20 to-indigo-500/20" />
        <footer className="mt-6 flex items-center justify-between">
          <Link href="/" className="rounded-full px-3 py-1 text-sm font-semibold text-white bg-neutral-900 ring-1 ring-sky-500/30 hover:ring-sky-400/60">
            Back
          </Link>
          <span className="text-sm bg-linear-to-r from-sky-400 via-white to-indigo-400 bg-clip-text text-transparent font-semibold">
             •  •  •
          </span>
        </footer>

      </section>
    </main>
  );
}
type TestimonialItem = {
  name: string;
  handle?: string;
  role?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  highlight?: string;
  focus?: string;
  image?: string;
  icon?: string;
};

const testimonials: TestimonialItem[] = [
  {
    name: "Justin P.",
    handle: "@justinp",
    role: "Funded Challenge Pass",
    rating: 5,
    highlight: "Passed first funded",
    focus: "Risk + psychology",
    text: "BullMoney changed how I view trading. The mentorship + accountability made me consistent enough to pass my first funded challenge.",
    image: "/justinftmo.jpg",
    icon: "/bullmoney-logo.png",
  },
  {
    name: "Damian R.",
    handle: "@damianr",
    role: "Intraday Trader",
    rating: 5,
    highlight: "Better entries",
    focus: "Structure + journaling",
    text: "The daily breakdowns and community feedback are like having a trading desk behind you. My entries got cleaner and I stopped overtrading.",
    image: "/DamianRudolph.png",
    icon: "/eqlogo.png",
  },
  {
    name: "Litha S.",
    handle: "@lithas",
    role: "Swing Trader",
    rating: 5,
    highlight: "Clear plan",
    focus: "Top-down analysis",
    text: "I’ve tried a lot of groups, but BullMoney’s structure is different. The education is simple, repeatable, and the plan stays the same even when emotions don’t.",
    image: "/LithaSilo.png",
    icon: "/eqlogo.png",
  },
  {
    name: "Aya R.",
    handle: "@ayar",
    role: "Community Member",
    rating: 5,
    highlight: "More confidence",
    focus: "Execution",
    text: "The market breakdowns are on point. I’m finally trading with confidence because I know what I’m looking for and what to ignore.",
    image: "/AyaRungqu.png",
    icon: "/eqlogo.png",
  },
  {
    name: "Ntlakanipho B.",
    handle: "@ntlakaniphob",
    role: "Beginner → Consistent",
    rating: 5,
    highlight: "Stopped gambling",
    focus: "Rules + discipline",
    text: "The biggest change is discipline. I stopped gambling trades and started following rules. The community keeps you locked in when motivation drops.",
    image: "/NtlakaniphoBlouw.png",
    icon: "/eqlogo.png",
  },
];

type TestimonialsCarouselProps = {
  tone?: 'dark' | 'light';
  className?: string;
};

export const TestimonialsCarousel = memo(({ tone = 'dark', className }: TestimonialsCarouselProps) => {
  const [index, setIndex] = useState(0);
  const isLight = tone === 'light';

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 8000);
    return () => window.clearInterval(id);
  }, []);

  const currentTestimonial = useMemo(() => {
    if (testimonials.length === 0) return null;
    return testimonials[index] ?? testimonials[0];
  }, [index]);
  if (!currentTestimonial) return null;

  return (
    <div
      className={cn(
        "testimonials-carousel relative mt-8 md:mt-12 w-full max-w-6xl mx-auto px-4 md:px-0",
        className
      )}
      style={{ contentVisibility: 'visible', containIntrinsicSize: 'none', contain: 'none', overflow: 'visible' }}
    >
      <div className="text-center mb-6 md:mb-8">
        <h2
          className={cn(
            "text-xs font-semibold tracking-[0.24em] uppercase",
            isLight ? "text-black/60" : "text-white/60"
          )}
        >
          Trading Community
        </h2>
        <p className={cn("mt-2 text-xl md:text-2xl font-semibold", isLight ? "text-black" : "text-white")}>
          Real testimonials from real traders
        </p>
        <p className={cn("mt-2 text-sm", isLight ? "text-black/60" : "text-white/60")}>
          Auto-rotating highlights from the BullMoney community
        </p>
      </div>

      <div
        className={cn(
          "relative rounded-2xl md:rounded-3xl border",
          isLight
            ? "bg-white border-black/10 shadow-lg"
            : "bg-neutral-950/60 border-white/10"
        )}
        style={{ contentVisibility: 'visible', overflow: 'visible' }}
      >
        <div className={cn("p-5 md:p-8", isLight ? "" : "backdrop-blur")} style={{ minHeight: 220 }}>
            <div className="grid gap-6 md:grid-cols-[280px_1fr]">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "relative h-16 w-16 rounded-full overflow-hidden border",
                    isLight ? "border-black/10 bg-black/5" : "border-white/10 bg-white/5"
                  )}
                >
                  {currentTestimonial.image ? (
                    <Image
                      src={currentTestimonial.image}
                      alt={currentTestimonial.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                      priority={index === 0}
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        "text-base font-semibold truncate",
                        isLight ? "text-black" : "text-white"
                      )}
                    >
                      {currentTestimonial.name}
                    </p>
                    {currentTestimonial.icon ? (
                      <span
                        className={cn(
                          "relative h-7 w-7 shrink-0 rounded-full overflow-hidden border",
                          isLight ? "border-black/10 bg-white" : "border-white/10 bg-white/5"
                        )}
                        aria-hidden="true"
                      >
                        <Image
                          src={currentTestimonial.icon}
                          alt=""
                          fill
                          sizes="28px"
                          className="object-contain p-1"
                        />
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {currentTestimonial.role ? (
                      <span className={cn("text-xs", isLight ? "text-black/60" : "text-white/60")}>
                        {currentTestimonial.role}
                      </span>
                    ) : null}
                    {currentTestimonial.handle ? (
                      <span className={cn("text-xs", isLight ? "text-black/50" : "text-white/50")}>
                        {currentTestimonial.handle}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 flex items-center gap-1" aria-label={`${currentTestimonial.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }).map((_, i) => {
                      const filled = i < currentTestimonial.rating;
                      return (
                        <Star
                          key={i}
                          className={cn(
                            "h-4 w-4",
                            filled
                              ? isLight
                                ? "text-black"
                                : "text-white"
                              : isLight
                                ? "text-black/20"
                                : "text-white/20"
                          )}
                          strokeWidth={2}
                          fill={filled ? "currentColor" : "none"}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-start gap-3">
                  <Quote className={cn("mt-1 h-5 w-5 shrink-0", isLight ? "text-black/30" : "text-white/30")} />
                  <p className={cn("text-sm md:text-base leading-relaxed", isLight ? "text-black/80" : "text-white/80")}>
                    {currentTestimonial.text}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {currentTestimonial.highlight ? (
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                        isLight
                          ? "border-black/10 bg-black/5 text-black/70"
                          : "border-white/10 bg-white/5 text-white/70"
                      )}
                    >
                      {currentTestimonial.highlight}
                    </span>
                  ) : null}
                  {currentTestimonial.focus ? (
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-3 py-1 text-xs",
                        isLight
                          ? "border-black/10 bg-white text-black/60"
                          : "border-white/10 bg-neutral-950/40 text-white/60"
                      )}
                    >
                      Focus: {currentTestimonial.focus}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
        </div>
      </div>

      <div className="mt-4 flex justify-center gap-2" aria-label="Active testimonial">
        {testimonials.map((item, i) => (
          <span
            key={item.name}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === index
                ? isLight
                  ? "w-8 bg-black"
                  : "w-8 bg-white"
                : isLight
                  ? "w-1.5 bg-black/25"
                  : "w-1.5 bg-white/25"
            )}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
});
