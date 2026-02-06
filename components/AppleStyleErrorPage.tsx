'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  RefreshCw, 
  Home, 
  Search,
  Sparkles,
  ShoppingBag,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// APPLE-STYLE ERROR PAGE COMPONENT WITH 3D EFFECTS
// Sleek, modern error pages with Bullmoney branding and smooth animations
// ============================================================================

interface ErrorPageProps {
  errorCode?: string;
  title?: string;
  description?: string;
  showStoreActions?: boolean;
  showAppActions?: boolean;
}

export default function AppleStyleErrorPage({
  errorCode = '404',
  title = 'Page Not Found',
  description = 'The page you\'re looking for doesn\'t exist or has been moved.',
  showStoreActions = false,
  showAppActions = false
}: ErrorPageProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements with parallax */}
      <div className="absolute inset-0">
        <motion.div 
          style={{
            x: mousePosition.x,
            y: mousePosition.y
          }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
        />
        <motion.div 
          style={{
            x: -mousePosition.x * 0.5,
            y: -mousePosition.y * 0.5
          }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
        />
        <motion.div 
          style={{
            x: mousePosition.x * 0.3,
            y: mousePosition.y * 0.3
          }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-500/5 rounded-full blur-3xl"
        />
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
              opacity: 0 
            }}
            animate={{ 
              opacity: [0, 1, 0],
              y: [null, -100, -200],
            }}
            transition={{ 
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2 
            }}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 text-center max-w-lg mx-auto"
      >
        {/* 3D Logo with enhanced effects */}
        <motion.div
          initial={{ rotateY: -30, scale: 0.5 }}
          animate={{ rotateY: 0, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative mb-12"
        >
          {/* Multiple shadow layers for depth */}
          <div className="absolute inset-0 transform translate-x-4 translate-y-4 opacity-20">
            <div className="w-32 h-32 mx-auto bg-linear-to-br from-gray-600 to-gray-800 rounded-3xl blur-xl" />
          </div>
          <div className="absolute inset-0 transform translate-x-2 translate-y-2 opacity-40">
            <div className="w-32 h-32 mx-auto bg-linear-to-br from-gray-500 to-gray-700 rounded-3xl blur-lg" />
          </div>
          
          {/* Main logo container with glass morphism */}
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 bg-linear-to-br from-white/20 to-white/5 rounded-3xl backdrop-blur-xl border border-white/30" />
            <div className="absolute inset-0 bg-linear-to-br from-transparent to-black/20 rounded-3xl" />
            
            {/* Logo with hover effects */}
            <motion.div
              whileHover={{ scale: 1.05, rotateY: 10 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              <img
                src="/bullmoney-logo.png"
                alt="Bullmoney"
                className="w-20 h-20 object-contain"
              />
              
              {/* Sparkle effect on hover */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                whileHover={{ opacity: 1, scale: 1 }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-linear-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center"
              >
                <Sparkles className="w-3 h-3 text-white" />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Error content with staggered animations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          {/* Error code with 3D effect */}
          <motion.h1 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-8xl font-bold mb-6 relative"
          >
            <span className="absolute inset-0 bg-linear-to-br from-white/20 to-transparent bg-clip-text text-transparent blur-sm transform translate-x-1 translate-y-1">
              {errorCode}
            </span>
            <span className="relative bg-linear-to-br from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              {errorCode}
            </span>
          </motion.h1>

          {/* Title */}
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="text-3xl font-bold text-white mb-4"
          >
            {title}
          </motion.h2>

          {/* Description */}
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="text-gray-400 text-lg mb-12 leading-relaxed max-w-md mx-auto"
          >
            {description}
          </motion.p>
        </motion.div>

        {/* Action buttons with conditional content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="space-y-4"
        >
          {/* Primary actions based on context */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {showStoreActions && (
              <>
                <Link href="/store">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto px-8 py-4 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-3"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    Back to Store
                  </motion.button>
                </Link>
                
                <Link href="/store/products">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-2xl font-semibold border border-white/20 transition-all duration-200 hover:bg-white/20 flex items-center justify-center gap-3"
                  >
                    <Search className="w-5 h-5" />
                    Browse Products
                  </motion.button>
                </Link>
              </>
            )}

            {showAppActions && (
              <>
                <Link href="/">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto px-8 py-4 bg-linear-to-r from-purple-500 to-purple-600 text-white rounded-2xl font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/30 flex items-center justify-center gap-3"
                  >
                    <Home className="w-5 h-5" />
                    Go Home
                  </motion.button>
                </Link>
                
                <Link href="/community">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-2xl font-semibold border border-white/20 transition-all duration-200 hover:bg-white/20 flex items-center justify-center gap-3"
                  >
                    <TrendingUp className="w-5 h-5" />
                    Join Community
                  </motion.button>
                </Link>
              </>
            )}

            {!showStoreActions && !showAppActions && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.history.back()}
                  className="w-full sm:w-auto px-8 py-4 bg-linear-to-r from-blue-500 to-purple-500 text-white rounded-2xl font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-3"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Go Back
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.reload()}
                  className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-2xl font-semibold border border-white/20 transition-all duration-200 hover:bg-white/20 flex items-center justify-center gap-3"
                >
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </motion.button>
              </>
            )}
          </div>

          {/* Secondary navigation */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            className="flex justify-center space-x-8 text-sm text-gray-400 pt-8"
          >
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/store" className="hover:text-white transition-colors">
              Store
            </Link>
            <Link href="/VIP" className="hover:text-white transition-colors">
              VIP
            </Link>
            <Link href="/community" className="hover:text-white transition-colors">
              Community
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}