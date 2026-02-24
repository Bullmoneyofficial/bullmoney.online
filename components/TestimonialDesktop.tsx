"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import Image from "next/image";

type DesktopTestimonial = {
  name: string;
  role: string;
  quote: string;
  result: string;
  focus: string;
  rating: 1 | 2 | 3 | 4 | 5;
  image: string;
  icon?: string;
};

const desktopTestimonials: DesktopTestimonial[] = [
  {
    name: "Justin P.",
    role: "Funded Challenge Pass",
    quote:
      "BullMoney gave me structure and accountability. I stopped random entries, followed a plan, and passed my first funded challenge.",
    result: "Passed first funded",
    focus: "Risk + psychology",
    rating: 5,
    image: "/justinftmo.jpg",
    icon: "/bullmoney-logo.png",
  },
  {
    name: "Damian R.",
    role: "Intraday Trader",
    quote:
      "The daily markups and live discussions feel like a real desk. My execution improved and my overtrading dropped hard.",
    result: "Cleaner execution",
    focus: "Structure + journaling",
    rating: 5,
    image: "/DamianRudolph.png",
    icon: "/eqlogo.png",
  },
  {
    name: "Litha S.",
    role: "Swing Trader",
    quote:
      "Simple playbooks, clear levels, and consistent feedback. The community keeps me disciplined even on emotional days.",
    result: "Consistent process",
    focus: "Top-down analysis",
    rating: 5,
    image: "/LithaSilo.png",
    icon: "/eqlogo.png",
  },
  {
    name: "Aya R.",
    role: "Community Member",
    quote:
      "I finally trade with confidence because I know exactly what to look for and what to ignore.",
    result: "Confidence restored",
    focus: "Execution",
    rating: 5,
    image: "/AyaRungqu.png",
    icon: "/eqlogo.png",
  },
  {
    name: "Ntlakanipho B.",
    role: "Beginner → Consistent",
    quote:
      "I stopped gambling trades and started following rules. The community keeps you disciplined when motivation drops.",
    result: "Stopped gambling",
    focus: "Rules + discipline",
    rating: 5,
    image: "/NtlakaniphoBlouw.png",
    icon: "/eqlogo.png",
  },
];

export const DesktopTestimonialsCarousel = memo(function DesktopTestimonialsCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (desktopTestimonials.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % desktopTestimonials.length);
    }, 7000);

    return () => window.clearInterval(timer);
  }, []);

  const active = useMemo(() => desktopTestimonials[index] ?? desktopTestimonials[0], [index]);

  return (
    <div
      data-desktop-testimonials="true"
      style={{
        width: "100%",
        maxWidth: 1280,
        margin: "0 auto",
        padding: "30px 36px",
        contentVisibility: "visible",
        contain: "none",
        overflow: "visible",
        opacity: 1,
        visibility: "visible",
        position: "relative",
        zIndex: 5,
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 30, opacity: 1, visibility: "visible" }}>
        <div style={{ fontSize: 12, letterSpacing: "0.28em", textTransform: "uppercase", fontWeight: 700, color: "rgba(255,255,255,0.56)" }}>
          Trading Community
        </div>
        <div style={{ marginTop: 10, fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 1.04, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.02em" }}>
          Real testimonials from real traders
        </div>
        <div style={{ marginTop: 10, fontSize: "clamp(16px, 2vw, 20px)", color: "rgba(255,255,255,0.58)" }}>
          Auto-rotating highlights from the BullMoney community
        </div>
      </div>

        <div
        style={{
          minHeight: 390,
          background:
            "radial-gradient(120% 140% at 0% 0%, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 35%, rgba(5,5,5,0.92) 80%), #070707",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 28,
          padding: "34px 38px",
          display: "flex",
          gap: 40,
          alignItems: "stretch",
          justifyContent: "space-between",
          contentVisibility: "visible",
          contain: "none",
          overflow: "visible",
          opacity: 1,
          visibility: "visible",
          boxShadow:
            "0 16px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ width: "34%", minWidth: 300, color: "#fff", opacity: 1, visibility: "visible", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div
            style={{
              width: 132,
              height: 132,
              borderRadius: 999,
              border: "2px solid rgba(255,255,255,0.38)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 700,
              color: "#fff",
              background: "rgba(255,255,255,0.09)",
              position: "relative",
              overflow: "hidden",
              boxShadow:
                "0 16px 34px rgba(0,0,0,0.5), 0 0 0 8px rgba(255,255,255,0.03)",
            }}
          >
            <Image
              src={active.image}
              alt={active.name}
              fill
              sizes="132px"
              style={{ objectFit: "cover", filter: "saturate(1.08) contrast(1.1)" }}
              priority={index === 0}
            />
          </div>

          <div style={{ marginTop: 18, fontSize: 42, fontWeight: 700, lineHeight: 1.05, color: "#fff", display: "flex", alignItems: "center", gap: 10, letterSpacing: "-0.02em" }}>
            <span>{active.name}</span>
            {active.icon ? (
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.28)",
                  background: "rgba(255,255,255,0.09)",
                  position: "relative",
                  display: "inline-block",
                  overflow: "hidden",
                }}
              >
                <Image
                  src={active.icon}
                  alt=""
                  fill
                  sizes="30px"
                  style={{ objectFit: "contain", padding: 4 }}
                />
              </span>
            ) : null}
          </div>
          <div style={{ marginTop: 8, fontSize: 20, color: "rgba(255,255,255,0.7)" }}>{active.role}</div>

          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 7 }} aria-label={`${active.rating} out of 5 stars`}>
            {Array.from({ length: 5 }).map((_, i) => {
              const filled = i < active.rating;
              return (
                <Star
                  key={i}
                  style={{ width: 20, height: 20, color: filled ? "#ffffff" : "rgba(255,255,255,0.3)" }}
                  fill={filled ? "currentColor" : "none"}
                  strokeWidth={2}
                />
              );
            })}
          </div>

          <div
            style={{
              marginTop: 16,
              display: "inline-flex",
              alignItems: "center",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.26)",
              background: "rgba(255,255,255,0.08)",
              padding: "8px 13px",
              fontSize: 14,
              fontWeight: 700,
              color: "rgba(255,255,255,0.92)",
            }}
          >
            {active.result}
          </div>

          <div style={{ marginTop: 12, fontSize: 15, color: "rgba(255,255,255,0.66)" }}>Focus: {active.focus}</div>
        </div>

        <div
          style={{
            width: "66%",
            color: "#fff",
            opacity: 1,
            visibility: "visible",
            display: "flex",
            alignItems: "center",
            borderLeft: "1px solid rgba(255,255,255,0.12)",
            paddingLeft: 34,
          }}
        >
          <div style={{ width: "100%" }}>
            <div
              style={{
                fontSize: 64,
                lineHeight: 0.85,
                color: "rgba(255,255,255,0.2)",
                marginBottom: 8,
              }}
              aria-hidden="true"
            >
              “
            </div>
            <div style={{ fontSize: "clamp(33px, 3vw, 46px)", lineHeight: 1.24, color: "rgba(255,255,255,0.95)", fontWeight: 500, letterSpacing: "-0.01em" }}>
            “{active.quote}”
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 9 }} aria-label="Active testimonial">
        {desktopTestimonials.map((item, i) => (
          <div
            key={item.name}
            style={{
              width: i === index ? 38 : 8,
              height: 6,
              borderRadius: 99,
              background: i === index ? "#ffffff" : "rgba(255,255,255,0.3)",
              transition: "all 220ms ease",
            }}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
});

export default DesktopTestimonialsCarousel;
