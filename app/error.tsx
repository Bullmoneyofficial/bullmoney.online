'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.error('Global Error:', error);
  }, [error]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 25;
      const y = (e.clientY / window.innerHeight - 0.5) * 25;
      setMousePosition({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      {/* Subtle Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 20% 30%, rgba(255,255,255,0.02) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 70%, rgba(255,255,255,0.02) 0%, transparent 50%)
            `,
          }}
        />

        {mounted && [...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              rotate: Math.random() * 360,
              opacity: 0,
            }}
            animate={{
              y: [null, Math.random() * -200 - 100],
              rotate: [null, Math.random() * 360],
              opacity: [0, 0.2, 0],
            }}
            transition={{
              duration: 8 + Math.random() * 6,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          >
            {i % 3 === 0 ? (
              <div className="w-3 h-3 border border-white/20 rotate-45" />
            ) : i % 3 === 1 ? (
              <div className="w-2 h-2 bg-white/15 rounded-full" />
            ) : (
              <div className="w-4 h-1 bg-linear-to-r from-white/20 to-transparent rounded-full" />
            )}
          </motion.div>
        ))}

        <motion.div
          className="absolute -top-1/4 -left-1/4 w-150 h-150 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 text-center px-6 max-w-xl"
      >
        <motion.div
          className="relative w-40 h-40 mx-auto mb-10"
          style={{ perspective: '1200px' }}
        >
          <motion.div
            className="relative w-full h-full"
            animate={{
              rotateY: mousePosition.x,
              rotateX: -mousePosition.y,
            }}
            transition={{ type: 'spring', stiffness: 80, damping: 25 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div 
              className="absolute inset-2 rounded-3xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(128,128,128,0.1) 100%)',
                transform: 'translateZ(-30px)',
                filter: 'blur(30px)',
              }}
            />
            
            <motion.div
              className="relative w-full h-full rounded-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(10,10,10,0.95) 100%)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 0 40px rgba(255,255,255,0.05), 0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              <div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(255,255,255,0.02) 100%)',
                }}
              />
              
              <div className="w-full h-full flex items-center justify-center">
                <Image
                  src="/ONcc2l601.svg"
                  alt="BullMoney"
                  width={100}
                  height={100}
                  className="relative z-10 drop-shadow-2xl"
                />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-4"
        >
          <h1 className="text-6xl font-black tracking-tight text-white">
            Oops!
          </h1>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-semibold text-white/90 mb-4"
        >
          Something Unexpected Happened
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-gray-400 text-lg mb-10 leading-relaxed max-w-md mx-auto"
        >
          We encountered an error. Our team has been notified and is working on it. Please try again.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
        >
          <motion.button
            onClick={reset}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-4 rounded-2xl font-semibold text-black bg-white relative overflow-hidden group"
            style={{
              boxShadow: '0 0 40px rgba(255,255,255,0.15), 0 10px 40px -10px rgba(255,255,255,0.2)',
            }}
          >
            <span className="relative z-10 flex items-center gap-2 justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </span>
          </motion.button>

          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-4 rounded-2xl font-semibold text-white relative overflow-hidden group border border-white/10 bg-white/5 backdrop-blur-sm"
            >
              <span className="relative z-10 flex items-center gap-2 justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Go Home
              </span>
            </motion.button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap gap-4 justify-center text-sm"
        >
          <Link href="/store" className="text-gray-500 hover:text-white transition-colors">Store</Link>
          <span className="text-gray-700">•</span>
          <Link href="/VIP" className="text-gray-500 hover:text-white transition-colors">VIP</Link>
          <span className="text-gray-700">•</span>
          <Link href="/community" className="text-gray-500 hover:text-white transition-colors">Community</Link>
          <span className="text-gray-700">•</span>
          <Link href="/about" className="text-gray-500 hover:text-white transition-colors">Contact Us</Link>
        </motion.div>

        {error.digest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-10 text-xs text-gray-600 font-mono"
          >
            Error Reference: {error.digest}
          </motion.div>
        )}
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-40 bg-linear-to-t from-black via-black/50 to-transparent pointer-events-none" />
    </div>
  );
}
