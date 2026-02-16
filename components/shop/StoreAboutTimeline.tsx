'use client';

import {
  useScroll,
  useTransform,
  motion,
} from 'motion/react';
import React, { useEffect, useRef, useState } from 'react';
import { Typewriter, FallingWords, FallingTag, SlideInLabel } from '@/components/shop/StoreTextEffects';
import { LinkPreview } from '@/components/ui/link-preview';

/* ------------------------------------------------------------------ */
/*  Timeline data                                                      */
/* ------------------------------------------------------------------ */

const ABOUT_TIMELINE_DATA = [
  {
    title: 'Who We Are',
    content: (
      <div>
        <h4 className="text-xl sm:text-2xl font-bold text-black mb-3">
          <Typewriter text="Built by Traders, for Traders" />
        </h4>
        <p className="text-sm sm:text-base leading-relaxed mb-5" style={{ color: 'rgba(0,0,0,0.6)' }}>
          <FallingWords
            text="Bull Money is a complete trading ecosystem that merges cutting-edge technology with real market expertise."
            delay={0.15}
          />{' '}
          <span>Join a community of active traders sharing live setups, real-time analysis, and daily trade ideas at{' '}
            <LinkPreview url="https://www.bullmoney.online" className="!font-bold underline underline-offset-4 decoration-2 hover:no-underline transition-all !text-blue-500 decoration-blue-500/40">
              bullmoney.online
            </LinkPreview>{' '}
            and shop merch &amp; more at{' '}
            <LinkPreview url="https://www.bullmoney.shop" className="!font-bold underline underline-offset-4 decoration-2 hover:no-underline transition-all !text-blue-500 decoration-blue-500/40">
              bullmoney.shop
            </LinkPreview>.
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {['Trading Group', 'Live Setups', 'Daily Alerts', 'Education', 'Global Community'].map((t, i) => (
            <FallingTag key={t} label={t} index={i} />
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'What We Offer',
    content: (
      <div>
        <h4 className="text-xl sm:text-2xl font-bold text-black mb-3">
          <Typewriter text="Everything You Need in One Place" />
        </h4>
        <p className="text-sm sm:text-base leading-relaxed mb-5" style={{ color: 'rgba(0,0,0,0.6)' }}>
          <FallingWords
            text="Get VIP access to our private trading group with real-time setups, exclusive market analysis, and a tight-knit community of serious traders."
            delay={0.15}
          />{' '}
          <span>Plus premium streetwear, digital art, and crypto checkout — all on{' '}
            <LinkPreview url="https://www.bullmoney.shop" className="!font-bold underline underline-offset-4 decoration-2 hover:no-underline transition-all !text-blue-500 decoration-blue-500/40">
              bullmoney.shop
            </LinkPreview>.
            Join the trading community at{' '}
            <LinkPreview url="https://www.bullmoney.online" className="!font-bold underline underline-offset-4 decoration-2 hover:no-underline transition-all !text-blue-500 decoration-blue-500/40">
              bullmoney.online
            </LinkPreview>.
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {['VIP Trading Group', 'Merch & Apparel', 'Digital Art', 'Crypto Payments', 'Prop Trading'].map((t, i) => (
            <FallingTag key={t} label={t} index={i} />
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'Our Mission',
    content: (
      <div>
        <h4 className="text-xl sm:text-2xl font-bold text-black mb-3">
          <Typewriter text="Empowering Financial Independence" />
        </h4>
        <p className="text-sm sm:text-base leading-relaxed mb-5" style={{ color: 'rgba(0,0,0,0.6)' }}>
          <FallingWords
            text="We believe everyone deserves access to institutional-grade tools and insights."
            delay={0.15}
          />{' '}
          <span>
            <LinkPreview url="https://www.bullmoney.online" className="!font-bold underline underline-offset-4 decoration-2 hover:no-underline transition-all !text-blue-500 decoration-blue-500/40">
              Bull Money
            </LinkPreview>{' '}
            bridges the gap between retail and professional trading, making advanced market intelligence, AI-powered analysis, and a world-class trading group accessible to all. Explore everything at{' '}
            <LinkPreview url="https://www.bullmoney.shop" className="!font-bold underline underline-offset-4 decoration-2 hover:no-underline transition-all !text-blue-500 decoration-blue-500/40">
              bullmoney.shop
            </LinkPreview>.
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {['Accessibility', 'Innovation', 'Transparency', 'Group Trading', 'AI-Powered'].map((t, i) => (
            <FallingTag key={t} label={t} index={i} />
          ))}
        </div>
      </div>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Inline Timeline — white bg variant                                 */
/* ------------------------------------------------------------------ */

function StoreTimeline({ data }: { data: typeof ABOUT_TIMELINE_DATA }) {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      setHeight(ref.current.getBoundingClientRect().height);
    }
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 10%', 'end 50%'],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div ref={containerRef} className="w-full font-sans md:px-10" style={{ backgroundColor: '#ffffff' }}>
      <div ref={ref} className="relative max-w-7xl mx-auto pb-20">
        {data.map((item, index) => (
          <div key={index} className="flex justify-start pt-10 md:pt-28 md:gap-10">
            {/* Sticky left column — dot + title */}
            <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
              <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-white flex items-center justify-center">
                <div
                  className="h-4 w-4 rounded-full p-2"
                  style={{
                    backgroundColor: 'rgba(59,130,246,0.12)',
                    border: '1px solid rgba(59,130,246,0.3)',
                  }}
                />
              </div>
              <h3 className="hidden md:block text-xl md:pl-20 md:text-4xl font-bold" style={{ color: 'rgba(0,0,0,0.35)' }}>
                {item.title}
              </h3>
            </div>

            {/* Right column — content */}
            <div className="relative pl-20 pr-4 md:pl-4 w-full">
              <h3 className="md:hidden block text-2xl mb-4 text-left font-bold" style={{ color: 'rgba(0,0,0,0.35)' }}>
                {item.title}
              </h3>
              {item.content}
            </div>
          </div>
        ))}

        {/* Animated vertical line */}
        <div
          style={{
            height: height + 'px',
            background: 'linear-gradient(to bottom, transparent 0%, rgba(59,130,246,0.18) 10%, rgba(59,130,246,0.18) 90%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
          }}
          className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px]"
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
              background: 'linear-gradient(to top, #3b82f6 0%, #60a5fa 50%, transparent 100%)',
            }}
            className="absolute inset-x-0 top-0 w-[2px] rounded-full"
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Exported section wrapper                                           */
/* ------------------------------------------------------------------ */

export function StoreAboutTimeline() {
  return (
    <section
      data-apple-section
      style={{
        backgroundColor: 'rgb(255,255,255)',
        borderBottom: '1px solid rgba(0,0,0,0.04)',
        contentVisibility: 'auto' as any,
        containIntrinsicSize: 'auto 900px' as any,
      }}
    >
      <div
        className="mx-auto w-full max-w-[26rem] sm:max-w-3xl lg:max-w-[90rem] px-4 sm:px-8"
        style={{ paddingTop: 24, paddingBottom: 8 }}
      >
        <div className="flex flex-col gap-3">
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, margin: '-40px' }}
            transition={{ duration: 0.5 }}
            className="text-[11px] uppercase tracking-[0.28em]"
            style={{ color: 'rgba(0,0,0,0.45)' }}
          >
            About us
          </motion.p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-black">
            <Typewriter text="This is Bull Money." />
          </h2>
          <p className="text-sm sm:text-base max-w-2xl" style={{ color: 'rgba(0,0,0,0.6)' }}>
            <FallingWords text="Where trading meets technology. Built from the ground up to give you an edge in the markets." delay={0.3} />
          </p>
        </div>
      </div>

      <StoreTimeline data={ABOUT_TIMELINE_DATA} />
    </section>
  );
}
