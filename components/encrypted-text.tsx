"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface EncryptedTextProps {
  text: string;
  interval?: number;
  revealDelayMs?: number;
  loopInterval?: number; // Time in ms before restarting animation
  className?: string;
  encryptedClassName?: string;
  revealedClassName?: string;
}

const CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?/~0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const EncryptedText = ({
  text,
  interval = 50,
  revealDelayMs = 50,
  loopInterval = 15000, // Default 15 seconds
  className,
  encryptedClassName,
  revealedClassName,
}: EncryptedTextProps) => {
  const [displayText, setDisplayText] = useState<string>(text);
  const [revealedIndex, setRevealedIndex] = useState(0);
  const [loopKey, setLoopKey] = useState(0); // Used to restart animation

  // Loop timer - restarts animation every loopInterval
  useEffect(() => {
    const loopTimer = setInterval(() => {
      setRevealedIndex(0); // Reset revealed index to restart animation
      setLoopKey(prev => prev + 1); // Force re-render
    }, loopInterval);

    return () => clearInterval(loopTimer);
  }, [loopInterval]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let revealTimer: NodeJS.Timeout;

    const scramble = () => {
      let output = "";
      for (let i = 0; i < text.length; i++) {
        if (i < revealedIndex) {
          output += text[i];
        } else {
          output += CHARS[Math.floor(Math.random() * CHARS.length)];
        }
      }
      setDisplayText(output);
    };

    timer = setInterval(scramble, interval);
    revealTimer = setInterval(() => {
        setRevealedIndex((prev) => {
            if (prev < text.length) return prev + 1;
            clearInterval(revealTimer);
            return prev;
        });
    }, revealDelayMs);

    return () => {
      clearInterval(timer);
      clearInterval(revealTimer);
    };
  }, [text, interval, revealedIndex, revealDelayMs, loopKey]);

  return (
    <motion.span
      className={cn("inline-block whitespace-nowrap cursor-default", className)}
      aria-label={text}
    >
      {displayText.split("").map((char, index) => {
        const isRevealed = index < revealedIndex;
        return (
          <span key={index} className={cn(isRevealed ? revealedClassName : encryptedClassName)}>
            {char}
          </span>
        );
      })}
    </motion.span>
  );
};