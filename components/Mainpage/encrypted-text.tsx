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
  className?: string;
  encryptedClassName?: string;
  revealedClassName?: string;
}

const CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?/~0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const EncryptedText = ({
  text,
  interval = 50,
  revealDelayMs = 50,
  className,
  encryptedClassName,
  revealedClassName,
}: EncryptedTextProps) => {
  const [displayText, setDisplayText] = useState<string>(text);
  const [revealedIndex, setRevealedIndex] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
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
    const revealTimer = setInterval(() => {
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
  }, [text, interval, revealedIndex, revealDelayMs]);

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