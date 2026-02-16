'use client';

import { motion, useInView } from 'motion/react';
import React, { useEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Typewriter — types out text character by character on scroll        */
/* ------------------------------------------------------------------ */

export function Typewriter({
  text,
  className,
  style,
  delay = 0,
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { margin: '-40px' });
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (inView) {
      setDisplayed('');
      setStarted(false);
      const t = setTimeout(() => setStarted(true), delay * 1000);
      return () => clearTimeout(t);
    } else {
      setDisplayed('');
      setStarted(false);
    }
  }, [inView, delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 32);
    return () => clearInterval(interval);
  }, [started, text]);

  return (
    <span ref={ref} className={className} style={style}>
      {displayed.split('').map((char, i) => (
        <motion.span
          key={i}
          className="inline-block cursor-default"
          whileHover={{ y: -3, color: '#3b82f6', scale: 1.2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          style={{
            display: char === ' ' ? 'inline' : undefined,
            minWidth: char === ' ' ? '0.25em' : undefined,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
      {started && displayed.length < text.length && (
        <span
          className="inline-block w-[2px] h-[1em] ml-0.5 align-text-bottom animate-pulse"
          style={{ backgroundColor: '#3b82f6' }}
        />
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  FallingWords — each word drops in from above with stagger           */
/* ------------------------------------------------------------------ */

export function FallingWords({
  text,
  className,
  style,
  delay = 0,
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { margin: '-40px' });
  const words = text.split(' ');

  return (
    <span ref={ref} className={className} style={{ ...style, display: 'inline' }}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: -20, rotateX: 60 }}
          animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: -20, rotateX: 60 }}
          whileHover={{ y: -4, color: '#2563eb', scale: 1.08 }}
          transition={{
            delay: inView ? delay + i * 0.045 : 0,
            duration: 0.4,
            ease: [0.23, 1, 0.32, 1],
          }}
          className="inline-block cursor-default"
          style={{ marginRight: '0.3em', transition: 'color 0.2s' }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  FallingTag — pill badge that drops in with scale                    */
/* ------------------------------------------------------------------ */

export function FallingTag({ label, index }: { label: string; index: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: -30, scale: 0.7 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{
        scale: 1.15,
        y: -3,
        backgroundColor: 'rgba(59,130,246,0.18)',
        borderColor: 'rgba(59,130,246,0.5)',
        boxShadow: '0 4px 20px rgba(59,130,246,0.25)',
      }}
      viewport={{ once: false, margin: '-40px' }}
      transition={{
        delay: 0.3 + index * 0.08,
        duration: 0.45,
        ease: [0.23, 1, 0.32, 1],
      }}
      className="px-3 py-1.5 text-xs font-semibold rounded-full inline-block cursor-default"
      style={{
        backgroundColor: 'rgba(59,130,246,0.08)',
        color: '#2563eb',
        border: '1px solid rgba(59,130,246,0.2)',
        transition: 'box-shadow 0.2s',
      }}
    >
      {label}
    </motion.span>
  );
}

/* ------------------------------------------------------------------ */
/*  SlideInLabel — small uppercase label that slides in from left       */
/* ------------------------------------------------------------------ */

export function SlideInLabel({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.p
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: false, margin: '-40px' }}
      transition={{ duration: 0.5 }}
      className={className}
      style={style}
    >
      {children}
    </motion.p>
  );
}
