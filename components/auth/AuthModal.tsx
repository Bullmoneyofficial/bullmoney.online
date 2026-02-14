"use client";

import React, { useState, useCallback, memo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, type TargetAndTransition } from 'framer-motion';
import { X, Mail, Lock, User, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { ShimmerLine, ShimmerBorder } from '@/components/ui/UnifiedShimmer';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { useAuth } from '@/contexts/AuthContext';
import { useRecruitAuth } from '@/contexts/RecruitAuthContext';
import { useAuthModalUI } from '@/contexts/UIStateContext';
import { useMobilePerformance } from '@/hooks/useMobilePerformance';
import { useRouter } from 'next/navigation';

type AuthView = 'login' | 'signup' | 'forgot-password';

export const AuthModal = memo(() => {
  const { isOpen, setIsOpen } = useAuthModalUI();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && <AuthContent onClose={() => setIsOpen(false)} />}
    </AnimatePresence>,
    document.body
  );
});
AuthModal.displayName = 'AuthModal';

interface AuthContentProps {
  onClose: () => void;
}

const AuthContent = memo(({ onClose }: AuthContentProps) => {
  const router = useRouter();
  const { signIn, signUp, isLoading: authLoading } = useAuth();
  const { signIn: recruitSignIn, isAuthenticated: isRecruitAuthenticated, recruit } = useRecruitAuth();
  const { isMobile, animations, shouldDisableBackdropBlur, shouldSkipHeavyEffects } = useMobilePerformance();
  const [view, setView] = useState<AuthView>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Auto-close if already authenticated
  useEffect(() => {
    if (isRecruitAuthenticated && recruit) {
      onClose();
    }
  }, [isRecruitAuthenticated, recruit, onClose]);

  const resetForm = useCallback(() => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
    setError(null);
    setSuccess(null);
  }, []);

  const handleClose = useCallback(() => {
    SoundEffects.click();
    onClose();
  }, [onClose]);

  const handleViewChange = useCallback((newView: AuthView) => {
    SoundEffects.click();
    setView(newView);
    resetForm();
  }, [resetForm]);

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateUsername = (username: string): boolean => {
    const re = /^[a-zA-Z0-9_]{3,20}$/;
    return re.test(username);
  };

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      // First try recruit auth (from recruits table)
      const recruitResult = await recruitSignIn(email, password);
      if (recruitResult.success) {
        SoundEffects.click();
        onClose();
        router.push('/store/account');
        return;
      }
      
      // Fallback to standard Supabase auth
      const result = await signIn(email, password);
      if (result.success) {
        SoundEffects.click();
        onClose();
        router.push('/store/account');
      } else {
        setError(recruitResult.error || result.error || 'Invalid email or password');
      }
    } finally {
      setIsLoading(false);
    }
  }, [email, password, signIn, recruitSignIn, onClose, router]);

  const handleSignUp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || !confirmPassword || !username) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!validateUsername(username)) {
      setError('Username must be 3-20 characters, letters, numbers, and underscores only');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signUp(email, password, username);
      if (result.success) {
        setSuccess('Account created! Please check your email to verify your account.');
        resetForm();
      } else {
        setError(result.error || 'Failed to create account');
      }
    } finally {
      setIsLoading(false);
    }
  }, [email, password, confirmPassword, username, signUp, resetForm]);

  return (
    <motion.div
      initial={animations.modalBackdrop.initial}
      animate={animations.modalBackdrop.animate as TargetAndTransition}
      exit={animations.modalBackdrop.exit}
      transition={animations.modalBackdrop.transition}
      className={`fixed inset-0 z-2147483647 flex items-center justify-center p-4 bg-black/95 ${
        shouldDisableBackdropBlur ? '' : 'backdrop-blur-md'
      }`}
    >
      {/* Click overlay - transparent, just for click handling */}
      <div className="absolute inset-0 bg-transparent" onClick={handleClose} />

      {/* Modal */}
      <motion.div
        initial={animations.modalContent.initial}
        animate={animations.modalContent.animate as TargetAndTransition}
        exit={animations.modalContent.exit}
        transition={animations.modalContent.transition}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-2xl"
      >
        {/* Shimmer Border - skip on mobile */}
        {!shouldSkipHeavyEffects && (
          <div className="absolute -inset-0.5 overflow-hidden rounded-2xl pointer-events-none z-0">
            <ShimmerBorder color="blue" intensity="low" />
          </div>
        )}

        {/* Inner Container */}
        <div className="relative z-10 bg-linear-to-b from-neutral-900 to-black rounded-2xl border border-white/30 overflow-hidden">
          {!shouldSkipHeavyEffects && <ShimmerLine color="blue" />}

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/20">
            <div className="flex items-center gap-3">
              {view !== 'login' && (
                <motion.button
                  whileHover={isMobile ? {} : { scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleViewChange('login')}
                  className="p-1 rounded-full text-neutral-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </motion.button>
              )}
              <div>
                <h2 className="text-xl font-bold text-white">
                  {view === 'login' && 'Welcome Back'}
                  {view === 'signup' && 'Create Account'}
                  {view === 'forgot-password' && 'Reset Password'}
                </h2>
                <p className="text-sm text-white/70">
                  {view === 'login' && 'Sign in to your account'}
                  {view === 'signup' && 'Join the Bull community'}
                  {view === 'forgot-password' && 'Enter your email to reset'}
                </p>
              </div>
            </div>

            <motion.button
              whileHover={isMobile ? {} : { scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClose}
              className="p-2 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30"
                >
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Message */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3 rounded-lg bg-white/10 border border-white/30"
                >
                  <p className="text-sm text-white">{success}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            {view === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:border-white transition-colors"
                      placeholder="your@email.com"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-neutral-400 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-black/50 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:border-white transition-colors"
                      placeholder="Enter your password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleViewChange('forgot-password')}
                    className="text-sm text-white hover:text-white transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-white hover:bg-white/90 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </motion.button>

                <p className="text-center text-sm text-neutral-400">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleViewChange('signup')}
                    className="text-white hover:text-white transition-colors font-medium"
                  >
                    Sign up
                  </button>
                </p>
              </form>
            )}

            {/* Sign Up Form */}
            {view === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1.5">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:border-white transition-colors"
                      placeholder="trader_name"
                      maxLength={20}
                      disabled={isLoading}
                    />
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">3-20 characters, letters, numbers, underscores</p>
                </div>

                <div>
                  <label className="block text-sm text-neutral-400 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:border-white transition-colors"
                      placeholder="your@email.com"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-neutral-400 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-black/50 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:border-white transition-colors"
                      placeholder="Create a password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">Minimum 8 characters</p>
                </div>

                <div>
                  <label className="block text-sm text-neutral-400 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:border-white transition-colors"
                      placeholder="Confirm your password"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-white hover:bg-white/90 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </motion.button>

                <p className="text-center text-sm text-neutral-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleViewChange('login')}
                    className="text-white hover:text-white transition-colors font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            )}

            {/* Forgot Password Form */}
            {view === 'forgot-password' && (
              <form className="space-y-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:border-white transition-colors"
                      placeholder="your@email.com"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-white hover:bg-white/90 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </motion.button>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});
AuthContent.displayName = 'AuthContent';

export default AuthModal;
