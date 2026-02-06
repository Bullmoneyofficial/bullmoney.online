'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Mail, 
  MailX, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Heart,
  Bell,
  BellOff,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// APPLE-STYLE UNSUBSCRIBE PAGE - BLACK & WHITE
// Sleek, modern unsubscribe experience with Bullmoney branding
// ============================================================================

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'pending' | 'confirming' | 'success' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

  const unsubscribeReasons = [
    { id: 'too_many', label: 'Too many emails' },
    { id: 'not_relevant', label: 'Content not relevant' },
    { id: 'never_subscribed', label: 'I never subscribed' },
    { id: 'other', label: 'Other reason' }
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

  const handleUnsubscribe = async () => {
    setIsProcessing(true);
    setStatus('confirming');
    
    try {
      const response = await fetch('/api/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email || undefined,
          token: token || undefined,
          reasons: selectedReasons
        })
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to unsubscribe. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Network error. Please check your connection.');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleReason = (reasonId: string) => {
    setSelectedReasons(prev => 
      prev.includes(reasonId) 
        ? prev.filter(r => r !== reasonId)
        : [...prev, reasonId]
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
        
        {/* Floating particles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 0 }}
            animate={{ 
              opacity: [0, 0.3, 0],
              y: [-20, -100, -150],
            }}
            transition={{ 
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3 
            }}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${60 + Math.random() * 40}%`
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
        {/* 3D Logo with glow */}
        <motion.div
          initial={{ rotateY: -30, scale: 0.5 }}
          animate={{ rotateY: 0, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative mb-8"
        >
          {/* Shadow layers */}
          <div className="absolute inset-0 transform translate-x-3 translate-y-3 opacity-20">
            <div className="w-24 h-24 mx-auto bg-linear-to-br from-gray-600 to-gray-800 rounded-3xl blur-xl" />
          </div>
          
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
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10"
                  >
                    <MailX className="w-8 h-8 text-white/60" />
                  </motion.div>
                  <h1 className="text-2xl font-bold text-white mb-2">Unsubscribe</h1>
                  <p className="text-gray-400 text-sm">
                    We&apos;re sorry to see you go. Tell us why you&apos;re leaving?
                  </p>
                </div>

                {/* Email display */}
                {email && (
                  <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="text-white font-medium">{email}</span>
                    </div>
                  </div>
                )}

                {/* Reason selection */}
                <div className="space-y-3 mb-8">
                  {unsubscribeReasons.map((reason) => (
                    <motion.button
                      key={reason.id}
                      onClick={() => toggleReason(reason.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full p-4 rounded-2xl border transition-all duration-300 flex items-center gap-3 text-left ${
                        selectedReasons.includes(reason.id)
                          ? 'bg-white/10 border-white/30 text-white'
                          : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/20'
                      }`}
                    >
                      <span className="flex-1">{reason.label}</span>
                      {selectedReasons.includes(reason.id) && (
                        <CheckCircle className="w-5 h-5 text-white" />
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                  <motion.button
                    onClick={handleUnsubscribe}
                    disabled={isProcessing}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 px-6 bg-white text-black font-semibold rounded-2xl shadow-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <BellOff className="w-5 h-5" />
                      Unsubscribe from all emails
                    </span>
                  </motion.button>

                  <Link href="/store" className="block">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-4 px-6 bg-white/5 text-white font-medium rounded-2xl border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <ArrowLeft className="w-5 h-5" />
                        Never mind, take me back
                      </span>
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            )}

            {status === 'confirming' && (
              <motion.div
                key="confirming"
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
                <h2 className="text-xl font-bold text-white mb-2">Processing...</h2>
                <p className="text-gray-400">Updating your preferences</p>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                  className="w-20 h-20 mx-auto mb-6 bg-white rounded-full flex items-center justify-center border border-white/30"
                >
                  <CheckCircle className="w-10 h-10 text-black" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-3">You&apos;ve been unsubscribed</h2>
                <p className="text-gray-400 mb-8">
                  You won&apos;t receive any more marketing emails from us. 
                  You can always re-subscribe if you change your mind.
                </p>
                
                <div className="space-y-3">
                  <Link href="/email/resubscribe" className="block">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-4 px-6 bg-white text-black font-semibold rounded-2xl"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Heart className="w-5 h-5" />
                        Changed your mind? Re-subscribe
                      </span>
                    </motion.button>
                  </Link>
                  
                  <Link href="/store" className="block">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-4 px-6 bg-white/5 text-white font-medium rounded-2xl border border-white/10"
                    >
                      Continue shopping
                    </motion.button>
                  </Link>
                </div>
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
                <h2 className="text-2xl font-bold text-white mb-3">Something went wrong</h2>
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

export default function UnsubscribePage() {
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
      <UnsubscribeContent />
    </Suspense>
  );
}
