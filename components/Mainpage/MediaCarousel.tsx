"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Slide {
  type: "image" | "video" | "youtube";
  src: string;
  title?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
}

interface MediaCarouselProps {
  slides: Slide[];
  height?: number;
  autoSlideInterval?: number; // in ms
}

export const MediaCarousel: React.FC<MediaCarouselProps> = ({
  slides,
  height = 560,
  autoSlideInterval = 7000,
}) => {
  const [current, setCurrent] = useState(0);

  // Auto-slide every few seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, autoSlideInterval);
    return () => clearInterval(timer);
  }, [slides.length, autoSlideInterval]);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prevSlide = () =>
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  const slide = slides[current];

  return (
    <div
      className="relative w-full overflow-hidden rounded-[32px] border border-neutral-700/60 bg-neutral-900/30"
      style={{ height }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {/* Media rendering */}
          {slide.type === "image" && (
            <Image
              src={slide.src}
              alt={slide.title || "Slide image"}
              fill
              className="object-cover"
              priority
            />
          )}
          {slide.type === "video" && (
            <video
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            >
              <source src={slide.src} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
          {slide.type === "youtube" && (
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${
                slide.src.includes("youtube.com") || slide.src.includes("youtu.be")
                  ? new URL(slide.src).searchParams.get("v") ||
                    slide.src.split("/").pop()?.split("?")[0]
                  : slide.src
              }?autoplay=1&mute=1&loop=1&playlist=${
                new URL(slide.src).searchParams.get("v") ||
                slide.src.split("/").pop()?.split("?")[0]
              }`}
              title="YouTube video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}

          {/* Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white text-center px-4">
            {slide.title && (
              <h2 className="text-3xl md:text-5xl font-bold mb-4">{slide.title}</h2>
            )}
            {slide.description && (
              <p className="text-lg mb-6 max-w-2xl">{slide.description}</p>
            )}
            {slide.buttonText && slide.buttonLink && (
              <Button as="a" href={slide.buttonLink} variant="primary">
                {slide.buttonText}
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-full hover:bg-black/60"
      >
        <ChevronLeft className="text-white w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-full hover:bg-black/60"
      >
        <ChevronRight className="text-white w-6 h-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-2 w-2 rounded-full transition-all ${
              index === current ? "bg-blue-400 w-4" : "bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
