"use client";
import { useEffect } from "react";
import { motion, useAnimate } from 'framer-motion';
import { cn } from "@/lib/utils";

type Props = {
  words: string;
  className?: string;
  filter?: boolean;   // blur-in
  duration?: number;  // per word
  perWord?: number;   // gap between words
  start?: number;     // initial delay
};

export const TextGenerateEffect = ({
  words,
  className,
  filter = true,
  duration = 0.5,
  perWord = 0.06,
  start = 0,
}: Props) => {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    const keyframes: any = { opacity: 1, filter: filter ? "blur(0px)" : "none" };
    const controls = animate("span", keyframes, {
      duration,
      delay: (i: number) => start + i * perWord, // <- no stagger, no type errors
      
    });
    return () => (controls as any)?.cancel?.();
  }, [animate, words, filter, duration, perWord, start]);

  return (
    <span ref={scope} className={cn("inline", className)}>
      {words.split(" ").map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          className="opacity-0"
          style={{ filter: filter ? "blur(10px)" : "none" }}
        >
          {w}&nbsp;
        </motion.span>
      ))}
    </span>
  );
};
