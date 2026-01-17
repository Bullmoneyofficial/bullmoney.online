"use client";

import React, { useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface Product {
  title: string;
  link: string;
  thumbnail: string;
}

interface HeroParallaxProps {
  products: Product[];
  containerRef?: React.RefObject<HTMLDivElement>;
}

export const HeroParallax: React.FC<HeroParallaxProps> = ({ products, containerRef }) => {
  const elementRef = useRef<HTMLDivElement>(null);

  // Use containerRef if provided (for modal scroll), otherwise use window scroll
  const { scrollY } = useScroll({
    target: containerRef || elementRef,
    offset: ["start start", "end end"],
  });

  return (
    <div ref={elementRef} className="relative w-full">
      <div className="hero-parallax-container space-y-8">
        {products.map((product, index) => {
          // Create staggered parallax effect for each product
          const yOffset = useTransform(
            scrollY,
            [0, 500],
            [0, -50 * (index + 1)] // Each item moves up at different speed
          );

          return (
            <motion.div
              key={index}
              className="hero-product-item"
              style={{
                y: yOffset,
                opacity: useTransform(
                  scrollY,
                  [0, 200, 500],
                  [0.3, 1, 0.3]
                ),
              }}
            >
              <a
                href={product.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-lg"
              >
                <div className="relative aspect-video w-full overflow-hidden">
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">
                  {product.title}
                </h3>
              </a>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
