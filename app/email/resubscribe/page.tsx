'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Mail, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Heart,
  Bell,
  Gift,
  Zap,
  TrendingUp,
  ShoppingBag,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// APPLE-STYLE RE-SUBSCRIBE PAGE - BLACK & WHITE
// Beautiful, modern re-subscribe experience with Bullmoney branding
// ============================================================================

function ResubscribeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'pending' | 'processing' | 'success' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>(['marketing', 'updates']);

  const emailPreferences = [
    { id: 'marketing', label: 'Marketing & Promotions', description: 'Exclusive deals and new arrivals', icon: Gift },
    { id: 'updates', label: 'Product Updates', description: 'New features and improvements', icon: Zap },
    { id: 'trading', label: 'Trading Alerts', description: 'Market insights and trading tips', icon: TrendingUp },
    { id: 'vip', label: 'VIP Announcements', description: 'First access to limited drops', icon: Bell }
  ];

  useEffect(() => {
    const emailParam = searchParams.get('email') || '';
    const tokenParam = searchParams.get('token') || '';
    setEmail(emailParam);
    setToken(tokenParam);
  }, [searchParams]);

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

  const handleResubscribe = async () => {
    if (!email && !token) {
      setStatus('error');
      setErrorMessage('Please enter your email address to continue.');
      return;
    }

    setIsProcessing(true);
    setStatus('processing');
    
    try {
      const response = await fetch('/api/email/resubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email || undefined,
          token: token || undefined,
          preferences: selectedPreferences
        })
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to re-subscribe. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Network error. Please check your connection.');
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePreference = (prefId: string) => {
    setSelectedPreferences(prev => 
      prev.includes(prefId) 
        ? prev.filter(p => p !== prefId)
        : [...prev, prefId]
    );
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background with parallax */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          style={{ x: mousePosition.x, y: mousePosition.y }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl"
        />
        <motion.div 
          style={{ x: -mousePosition.x * 0.5, y: -mousePosition.y * 0.5 }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-3xl"
        />
        <motion.div 
          style={{ x: mousePosition.x * 0.3, y: mousePosition.y * 0.3 }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/3 rounded-full blur-3xl"
        />
        
        {/* Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 0, rotate: 0 }}
            animate={{ 
              opacity: [0, 0.5, 0],
              y: [-20, -150, -200],
              rotate: [0, 360],
            }}
            transition={{ 
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3 
            }}
            className="absolute w-2 h-2 rounded-full bg-white/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${70 + Math.random() * 30}%`
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md mx-auto"
      >
        {/* 3D Logo */}
        <motion.div
          initial={{ rotateY: -30, scale: 0.5 }}
          animate={{ rotateY: 0, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative mb-8"
        >
          {/* Glow effect */}
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 mx-auto w-24 h-24 bg-white/10 rounded-3xl blur-xl"
          />
          
          {/* Main logo container */}
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 bg-linear-to-br from-white/20 to-white/5 rounded-3xl backdrop-blur-xl border border-white/30" />
            <div className="absolute inset-0 bg-linear-to-br from-transparent to-black/20 rounded-3xl" />
            
            <motion.div
              whileHover={{ scale: 1.05, rotateY: 10 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              <img
                src="/ONcc2l601.svg"
                alt="Bullmoney"
                className="w-16 h-16 object-contain"
              />
              
              {/* Heart badge */}
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"
              >
                <Heart className="w-4 h-4 text-black" fill="black" />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Glass card container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {status === 'pending' && (
              <motion.div
                key="pending"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-8"
              >
                {/* Header */}
                <div className="text-center mb-8">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                    className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10"
                  >
                    <Bell className="w-8 h-8 text-white/60" />
                  </motion.div>
                  <h1 className="text-2xl font-bold text-white mb-2">Welcome Back!</h1>
                  <p className="text-gray-400 text-sm">
                    We missed you! Choose what you'd like to hear about.
                  </p>
                </div>

                {/* Email input if not provided */}
                {!email && !token && (
                  <div className="mb-6">
                    <label className="block text-gray-400 text-sm mb-2">Your email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full pl-12 pr-4 py-4 bg-white/5 rounded-2xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Email display if provided */}
                {email && (
                  <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-white/60" />
                      <span className="text-white font-medium">{email}</span>
                    </div>
                  </div>
                )}

                {/* Preference selection */}
                <div className="space-y-3 mb-8">
                  <p className="text-gray-400 text-sm mb-4">Choose your preferences:</p>
                  {emailPreferences.map((pref) => {
                    const Icon = pref.icon;
                    return (
                      <motion.button
                        key={pref.id}
                        onClick={() => togglePreference(pref.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full p-4 rounded-2xl border transition-all duration-300 flex items-center gap-4 text-left ${
                          selectedPreferences.includes(pref.id)
                            ? 'bg-white/10 border-white/30'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          selectedPreferences.includes(pref.id)
                            ? 'bg-white/20'
                            : 'bg-white/10'
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            selectedPreferences.includes(pref.id)
                              ? 'text-white'
                              : 'text-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium">{pref.label}</div>
                          <div className="text-gray-500 text-sm">{pref.description}</div>
                        </div>
                        {selectedPreferences.includes(pref.id) && (
                          <CheckCircle className="w-5 h-5 text-white" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                  <motion.button
                    onClick={handleResubscribe}
                    disabled={isProcessing || selectedPreferences.length === 0}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 px-6 bg-white text-black font-semibold rounded-2xl shadow-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Heart className="w-5 h-5" />
                      Subscribe to selected
                    </span>
                  </motion.button>

                  <Link href="/store" className="block">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-4 px-6 bg-white/5 text-white font-medium rounded-2xl border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <ShoppingBag className="w-5 h-5" />
                        Continue shopping instead
                      </span>
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            )}

            {status === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 text-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 mx-auto mb-6"
                >
                  <Loader2 className="w-16 h-16 text-white/60" />
                </motion.div>
                <h2 className="text-xl font-bold text-white mb-2">Setting up your preferences...</h2>
                <p className="text-gray-400">This won't take long</p>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 text-center relative overflow-hidden"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                  className="w-20 h-20 mx-auto mb-6 bg-white rounded-full flex items-center justify-center border border-white/30"
                >
                  <CheckCircle className="w-10 h-10 text-black" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-3">You're back!</h2>
                <p className="text-gray-400 mb-8">
                  We're thrilled to have you back. You'll start receiving emails based on your preferences.
                </p>
                
                <Link href="/store" className="block">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 px-6 bg-white text-black font-semibold rounded-2xl"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <ShoppingBag className="w-5 h-5" />
                      Explore the store
                    </span>
                  </motion.button>
                </Link>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 text-center"
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="w-20 h-20 mx-auto mb-6 bg-white/5 rounded-full flex items-center justify-center border border-white/10"
                >
                  <AlertCircle className="w-10 h-10 text-white/60" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-3">Oops!</h2>
                <p className="text-gray-400 mb-8">{errorMessage}</p>
                
                <motion.button
                  onClick={() => setStatus('pending')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 px-6 bg-white/5 text-white font-medium rounded-2xl border border-white/10"
                >
                  Try again
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center text-gray-600 text-sm"
        >
          <p>&copy; 2026 Bullmoney. All rights reserved.</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function ResubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-8 h-8 text-white/60" />
        </motion.div>
      </div>
    }>
      <ResubscribeContent />
    </Suspense>
  );
}
