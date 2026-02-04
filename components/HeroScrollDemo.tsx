"use client";

import React from "react";
import { TestimonialsCarousel } from "@/components/Testimonial";

export function HeroScrollDemo() {
  return (
    <div className="w-full min-h-[100vh] flex items-center justify-center px-4 py-16 overflow-visible">
      <div className="w-full max-w-6xl overflow-visible">
        <TestimonialsCarousel />
      </div>
    </div>
  );
}
