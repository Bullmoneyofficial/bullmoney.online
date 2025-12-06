"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils"; // Adjust path if your utils are elsewhere

interface EncryptedTextProps {
  text: string;
  interval?: number;
  revealDelayMs?: number; // Time between revealing each character
  className?: string;
  encryptedClassName?: string;
  revealedClassName?: string;
}

const CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?/~0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const EncryptedText = ({
  text,
  interval = 50,
  revealDelayMs = 50, // Default delay per character reveal
  className,
  encryptedClassName,
  revealedClassName,
}: EncryptedTextProps) => {
  const [displayText, setDisplayText] = useState<string>(text);
  const [isHovered, setIsHovered] = useState(false);
  const [revealedIndex, setRevealedIndex] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    // Scramble effect
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

    // Progressive reveal logic
    const revealTimer = setInterval(() => {
        setRevealedIndex((prev) => {
            if (prev < text.length) return prev + 1;
            clearInterval(revealTimer);
            return prev;
        });
    }, revealDelayMs);

    // Cleanup
    return () => {
      clearInterval(timer);
      clearInterval(revealTimer);
    };
  }, [text, interval, revealedIndex, revealDelayMs]);

  // Re-run animation on hover (optional interaction)
  const handleMouseEnter = () => {
    setIsHovered(true);
    setRevealedIndex(0); // Reset to scramble again
  };

  return (
    <motion.span
      className={cn("inline-block whitespace-nowrap cursor-default", className)}
      onMouseEnter={handleMouseEnter}
      aria-label={text}
    >
      {displayText.split("").map((char, index) => {
        const isRevealed = index < revealedIndex;
        return (
          <span
            key={index}
            className={cn(
              isRevealed ? revealedClassName : encryptedClassName
            )}
          >
            {char}
          </span>
        );
      })}
    </motion.span>
  );
};