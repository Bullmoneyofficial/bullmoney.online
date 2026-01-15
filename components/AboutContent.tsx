"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { SparklesCore } from "@/components/Mainpage/sparkles"; // Adjust import path if needed (e.g. "../sparkles" or "./sparkles")

const fade = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.5 },
};

export function AboutContent() {
  return (
    <main className="px-4 md:px-6">
      <section
        className={cn(
          "relative mx-auto w-full max-w-5xl overflow-hidden rounded-3xl p-6 md:p-10",
          "bg-neutral-950 ring-1 ring-white/10",
          "shadow-[0_1px_1px_rgba(0,0,0,0.05),0_18px_80px_rgba(2,6,23,0.5)]"
        )}
      >
        {/* SPARKLES BACKGROUND */}
        <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
          <SparklesCore
            id="tsparticlesabout"
            background="transparent"
            minSize={1.6}
            maxSize={2.4}
            particleDensity={100}
            className="w-full h-full"
            particleColor="#FFFFFF"
          />
        </div>

        {/* chrome-blue accent stripe */}
        <div className="pointer-events-none absolute -top-12 right-0 h-24 w-2/3 bg-gradient-to-l from-sky-500/20 via-blue-500/15 to-indigo-500/0 blur-2xl z-0" />

        {/* decorative SVG */}
        <svg
          className="pointer-events-none absolute -left-10 -bottom-10 h-[420px] w-[420px] opacity-[0.08] z-0"
          viewBox="3000 180 900 700"
          aria-hidden="true"
        >
          <path
            d="M3674.28 294.152C3618.3 238.404 3547.62 210.078 3464.17 210.078C3380.58 210.078 3309.89 238.404 3253.91 294.152C3198.08 350.051 3169.71 419.058 3169.71 499.667C3169.71 580.728 3198.08 650.187 3253.91 706.086C3309.74 761.834 3380.58 790.16 3464.17 790.16C3547.77 790.16 3618.45 761.834 3674.28 706.086C3730.11 650.337 3758.48 580.878 3758.48 499.667C3758.48 419.058 3730.11 349.9 3674.28 294.152ZM3594.44 635.27C3559.77 672.637 3516.25 691.47 3465.07 691.47C3413.29 691.47 3369.32 672.486 3334.35 635.27C3299.38 597.904 3281.52 552.251 3281.52 499.516C3281.52 446.932 3299.23 401.43 3334.35 364.214C3369.32 327.149 3413.29 308.315 3465.07 308.315C3516.25 308.315 3559.77 327.149 3594.59 364.063C3629.41 401.128 3646.97 446.631 3646.97 499.366C3646.82 552.251 3629.11 597.904 3594.44 635.27Z"
            fill="#262729"
          />
        </svg>

        {/* Content Wrapper (z-10 to stay above sparkles) */}
        <div className="relative z-10">
          {/* Header */}
          <motion.header {...fade} className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              {/* BullMoney logo */}
              <div className="relative h-9 w-9 overflow-hidden rounded-lg ring-1 ring-white/10 bg-neutral-900">
                <Image
                src="/bullmoney-logo.png"
                  alt="BullMoney logo"
                  fill
                  className="object-contain p-1.5"
                  priority
                />
              </div>
              <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">
                About Us
              </h1>
            </div>
            <span className="text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-sky-300/80 ring-1 ring-sky-500/30 px-2 py-1 rounded-md bg-sky-500/10">
              Since 20XX
            </span>
          </motion.header>

          {/* BullMoney first */}
          <motion.section
            {...fade}
            className="mt-6 grid gap-5 md:grid-cols-[1.1fr,0.9fr] items-center"
          >
            <div className="space-y-4 text-[15px] leading-relaxed text-neutral-300">
              <h2 className="text-xl font-extrabold text-white">BullMoney</h2>
              <p>
                BullMoney is a modern trading education and trading/crypto community built to
                help traders become consistently profitable. We combine professional analysis,
                live market insights, and cutting-edge trading tools to give our members a true
                edge. As an official broker-affiliated brand, we guide traders through every
                step from learning market structure to passing funded challenges and managing
                real capital responsibly with our favorite brokers.
              </p>
              <p>
                Our mission is simple: create confident, disciplined traders who can grow
                sustainably month after month. Whether you’re a beginner or an advanced trader
                refining execution, BullMoney offers mentorship, community, and opportunity all
                in one place.
              </p>
            </div>

            {/* BullMoney hero image */}
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl ring-1 ring-white/10 bg-neutral-900/40">
              <Image
                src="/bullmoney-logo.png"
                alt="BullMoney brand"
                fill
                className="object-contain p-6"
              />
            </div>
          </motion.section>

          {/* Divider */}
          <div className="my-8 h-px w-full bg-gradient-to-r from-sky-500/20 via-blue-500/20 to-indigo-500/20" />

          {/* Our Brokers */}
          <motion.section {...fade}>
            <h2 className="text-xl font-extrabold text-white">Our Brokers</h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {/* Vantage card */}
              <motion.article
                {...fade}
                className="rounded-2xl p-5 ring-1 ring-white/10 bg-gradient-to-br from-neutral-900/60 to-neutral-900/20"
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-lg ring-1 ring-white/10 bg-neutral-900">
                    <Image
                      src="/Vantage-logo.jpg"
                      alt="(placeholder) swap to Vantage logo"
                      fill
                      className="object-contain p-1.5"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-white">Vantage</h3>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-neutral-300">
                  Award-winning multi-asset CFD broker with <strong>15+ years</strong> in the
                  market and access to
                  <strong> 1,000+ CFD products</strong> (forex, indices, commodities, shares,
                  ETFs, bonds). Built for speed, reliability, and a clean mobile/desktop
                  experience plus robust education and support.
                </p>
              </motion.article>

              {/* XM card */}
              <motion.article
                {...fade}
                className="rounded-2xl p-5 ring-1 ring-white/10 bg-gradient-to-br from-neutral-900/60 to-neutral-900/20"
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-lg ring-1 ring-white/10 bg-neutral-900">
                    <Image
                      src="/xm-logo.png"
                      alt="XM logo"
                      fill
                      className="object-contain p-1.5"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-white">XM</h3>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-neutral-300">
                  Global broker with broad platform access and <strong>1,000+ instruments</strong>{" "}
                  (forex and CFDs). South Africa–friendly site, education, and promos to help
                  traders get started confidently.
                </p>
              </motion.article>
            </div>
          </motion.section>

          {/* Divider */}
          <div className="my-8 h-px w-full bg-gradient-to-r from-sky-500/20 via-blue-500/20 to-indigo-500/20" />

          {/* Funded Firms */}
          <motion.section {...fade}>
            <h2 className="text-xl font-extrabold text-white">Funded Firms</h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {/* GOAT Funded Trader */}
              <motion.article
                {...fade}
                className="rounded-2xl p-5 ring-1 ring-white/10 bg-gradient-to-br from-neutral-900/60 to-neutral-900/20"
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-lg ring-1 ring-white/10 bg-neutral-900">
                    <Image
                      src="/GTFLOGO.png"
                      alt="GOAT Funded Trader logo"
                      fill
                      className="object-contain p-1.5"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-white">GOAT Funded Trader</h3>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-neutral-300">
                  Flexible evaluations and competitive profit-split models, multiple account
                  sizes, and fast payouts on supported plans. Always verify the current rules
                  and terms before joining (props update frequently).
                </p>
              </motion.article>

              {/* FTMO */}
              <motion.article
                {...fade}
                className="rounded-2xl p-5 ring-1 ring-white/10 bg-gradient-to-br from-neutral-900/60 to-neutral-900/20"
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-lg ring-1 ring-white/10 bg-neutral-900">
                                      <Image
                                        src="/FTMO_LOGO.png"
                                        alt="FTMO logo"
                                        fill
                                        className="object-contain p-1.5"
                                      />                  </div>
                  <h3 className="text-lg font-bold text-white">FTMO</h3>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-neutral-300">
                  Two-step evaluation (<em>Challenge</em> then <em>Verification</em>) leading to
                  an FTMO Account. Public materials highlight rewards up to{" "}
                  <strong>90% of simulated profits</strong> and funded sizes up to{" "}
                  <strong>$200,000</strong>. Focused on risk discipline and consistency.
                </p>
              </motion.article>
            </div>
          </motion.section>

          <TestimonialsCarousel />

          {/* CTA / Footer */}
          <div className="mt-8 h-px w-full bg-gradient-to-r from-sky-500/20 via-blue-500/20 to-indigo-500/20" />
          <footer className="mt-6 flex items-center justify-between">
            <Link
              href="/"
              className="rounded-full px-3 py-1 text-sm font-semibold text-white bg-neutral-900 ring-1 ring-sky-500/30 hover:ring-sky-400/60"
            >
              Back
            </Link>
            <span className="text-sm bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent font-semibold">
              • • •
            </span>
          </footer>
        </div>
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
  const prevSlide = () =>
    setIndex((index - 1 + testimonials.length) % testimonials.length);

  return (
    <motion.section {...fade} className="relative mt-16 w-full max-w-4xl mx-auto">
      <h2 className="text-xl font-extrabold text-white text-center mb-8">Testimonials</h2>

      <div className="relative h-[320px] overflow-hidden rounded-3xl ring-1 ring-white/10 bg-neutral-900/60 backdrop-blur-md shadow-lg">
        <AnimatePresence mode="wait">
          {testimonials[index] && (
            <motion.div
              key={index}
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, { offset, velocity }) => {
                if (offset.x < -50 || velocity.x < -200) nextSlide();
                if (offset.x > 50 || velocity.x > 200) prevSlide();
              }}
            >
              <Image
                src={testimonials[index].image}
                alt={testimonials[index].name}
                fill
                className="object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
              <div className="absolute bottom-10 left-8 text-white max-w-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden ring-1 ring-white/10 bg-neutral-800">
                    <Image
                      src={testimonials[index].icon}
                    alt={`${testimonials[index].name} icon`}
                    fill
                    className="object-contain p-1.5"
                  />
                </div>
                <p className="text-lg font-semibold">{testimonials[index].name}</p>
              </div>
              <p className="text-sm text-neutral-200 italic leading-relaxed">
                &ldquo;{testimonials[index].text}&rdquo;
              </p>
            </div>
          </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 p-2 rounded-full text-white"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 p-2 rounded-full text-white"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Dots */}
      <div className="flex justify-center mt-4 space-x-2">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-2 w-2 rounded-full transition-all ${
              i === index ? "bg-sky-400 w-4" : "bg-white/30 hover:bg-white/50"
            }`}
          />
        ))}
      </div>
    </motion.section>
  );
}
