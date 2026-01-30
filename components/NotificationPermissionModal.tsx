"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, X, Zap, TrendingUp, Shield } from 'lucide-react';

// ============================================================================
// NOTIFICATION PERMISSION MODAL - COMPACT ULTIMATE HUB STYLE
// Smaller, sleek neon white design matching UltimateHub aesthetic
// ============================================================================

const NOTIFICATION_STORAGE_KEY = 'bullmoney_notification_preference';
const NOTIFICATION_ASKED_KEY = 'bullmoney_notification_asked';
const NOTIFICATION_RELOAD_COUNT_KEY = 'bullmoney_notification_reload_count';
const RELOAD_THRESHOLD = 5;

interface NotificationPermissionModalProps {
  onClose?: () => void;
  forceShow?: boolean;
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as Uint8Array<ArrayBuffer>;
}

async function subscribeToPush(): Promise<PushSubscription | null> {
  try {
    console.log('[Notifications] Starting subscription process...');
    
    // Check HTTPS requirement
    if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      console.error('[Notifications] Push notifications require HTTPS');
      alert('Push notifications require a secure connection (HTTPS). Please access the site via HTTPS.');
      return null;
    }
    
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[Notifications] Push notifications not supported in this browser');
      alert('Push notifications are not supported in this browser. Try Chrome, Firefox, Edge, or Safari.');
      return null;
    }

    // Check if VAPID key is configured
    if (!VAPID_PUBLIC_KEY) {
      console.error('[Notifications] VAPID_PUBLIC_KEY not configured');
      alert('Push notifications are not configured on this server. Please contact support.');
      return null;
    }

    console.log('[Notifications] Registering service worker...');
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('[Notifications] Service worker registered');
    
    await navigator.serviceWorker.ready;
    console.log('[Notifications] Service worker ready');

    // Request permission - THIS must be from a user gesture (button click)
    console.log('[Notifications] Requesting permission...');
    const permission = await Notification.requestPermission();
    console.log('[Notifications] Permission result:', permission);
    
    if (permission !== 'granted') {
      console.log('[Notifications] Permission denied by user');
      return null;
    }

    console.log('[Notifications] Subscribing to push...');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    console.log('[Notifications] Push subscription created');

    console.log('[Notifications] Saving to server...');
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      }),
    });
    
    const data = await response.json();
    console.log('[Notifications] Server response:', data);

    if (!response.ok) {
      console.error('[Notifications] Server error:', data);
      alert('Failed to save subscription: ' + (data.error || 'Unknown error'));
      return null;
    }

    console.log('[Notifications] Successfully subscribed!');
    return subscription;
  } catch (error) {
    console.error('[Notifications] Failed to subscribe:', error);
    alert('Failed to enable notifications: ' + (error instanceof Error ? error.message : 'Unknown error'));
    return null;
  }
}

export function NotificationPermissionModal({ onClose, forceShow = false }: NotificationPermissionModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [portalNode, setPortalNode] = useState<Element | null>(null);
  const [step, setStep] = useState<'ask' | 'success' | 'declined' | 'blocked'>('ask');
  const [isReady, setIsReady] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setPortalNode(document.body);
    }
  }, []);

  useEffect(() => {
    const checkShouldShow = () => {
      if (forceShow) {
        setIsReady(true);
        setIsVisible(true);
        return;
      }

      if (typeof window === 'undefined') return;
      
      // Check all requirements for push notifications
      const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      const hasNotificationAPI = 'Notification' in window;
      const hasServiceWorker = 'serviceWorker' in navigator;
      const hasPushManager = 'PushManager' in window;
      
      console.log('[NotificationModal] Support check:', { isSecure, hasNotificationAPI, hasServiceWorker, hasPushManager });
      
      if (!isSecure || !hasNotificationAPI || !hasServiceWorker || !hasPushManager) {
        console.log('[NotificationModal] Not supported, hiding modal');
        setIsVisible(false);
        return;
      }

      const hasAsked = localStorage.getItem(NOTIFICATION_ASKED_KEY);
      
      if (hasAsked === 'enabled') {
        setIsVisible(false);
        return;
      }

      // Check current browser permission
      const currentPermission = Notification.permission;
      setBrowserPermission(currentPermission);
      
      if (currentPermission === 'granted') {
        localStorage.setItem(NOTIFICATION_ASKED_KEY, 'enabled');
        setIsVisible(false);
        return;
      }
      
      // If permission was previously denied, show special blocked UI
      if (currentPermission === 'denied') {
        setStep('blocked');
      }
      
      if (hasAsked === 'true') {
        const currentCount = parseInt(localStorage.getItem(NOTIFICATION_RELOAD_COUNT_KEY) || '0', 10);
        const newCount = currentCount + 1;
        localStorage.setItem(NOTIFICATION_RELOAD_COUNT_KEY, newCount.toString());
        
        if (newCount >= RELOAD_THRESHOLD) {
          localStorage.setItem(NOTIFICATION_RELOAD_COUNT_KEY, '0');
          localStorage.setItem(NOTIFICATION_ASKED_KEY, 'false');
          setIsReady(true);
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
        return;
      }

      setIsReady(true);
      setIsVisible(true);
    };

    const timer = setTimeout(checkShouldShow, 800);
    return () => clearTimeout(timer);
  }, [forceShow]);

  const handleEnable = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const subscription = await subscribeToPush();
      
      if (subscription) {
        localStorage.setItem(NOTIFICATION_STORAGE_KEY, 'enabled');
        localStorage.setItem(NOTIFICATION_ASKED_KEY, 'enabled');
        localStorage.removeItem(NOTIFICATION_RELOAD_COUNT_KEY);
        setStep('success');
        
        setTimeout(() => {
          setIsVisible(false);
          onClose?.();
        }, 2000);
      } else {
        localStorage.setItem(NOTIFICATION_STORAGE_KEY, 'declined');
        localStorage.setItem(NOTIFICATION_ASKED_KEY, 'true');
        localStorage.setItem(NOTIFICATION_RELOAD_COUNT_KEY, '0');
        setStep('declined');
      }
    } catch (error) {
      console.error('[Notifications] Error:', error);
      setStep('declined');
    } finally {
      setIsLoading(false);
    }
  }, [onClose]);

  const handleDecline = useCallback(() => {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, 'declined');
    localStorage.setItem(NOTIFICATION_ASKED_KEY, 'true');
    localStorage.setItem(NOTIFICATION_RELOAD_COUNT_KEY, '0');
    setIsVisible(false);
    onClose?.();
  }, [onClose]);

  const handleClose = useCallback(() => {
    localStorage.setItem(NOTIFICATION_ASKED_KEY, 'true');
    localStorage.setItem(NOTIFICATION_RELOAD_COUNT_KEY, '0');
    setIsVisible(false);
    onClose?.();
  }, [onClose]);

  if (!isVisible || !portalNode || !isReady) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center p-3"
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 2147483647,
          cursor: 'auto',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 400 }}
          className="relative w-full max-w-[280px] overflow-hidden rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 15, 20, 0.98) 0%, rgba(20, 25, 35, 0.98) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 0 30px rgba(255, 255, 255, 0.3), 0 0 60px rgba(255, 255, 255, 0.15), inset 0 0 30px rgba(255, 255, 255, 0.03)',
            cursor: 'auto',
          }}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 z-10 p-1 rounded-lg transition-all hover:bg-white/20"
            style={{ color: 'rgba(255, 255, 255, 0.6)' }}
          >
            <X size={14} />
          </button>

          {/* Glow effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-white/15 blur-[40px]" />
          </div>

          <div className="relative z-10 p-4">
            {step === 'ask' && (
              <>
                {/* Icon */}
                <div className="flex justify-center mb-3">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="relative p-2.5 rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.3) 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.4)',
                      boxShadow: '0 0 15px rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    <Bell size={22} className="text-white" style={{ filter: 'drop-shadow(0 0 6px #ffffff)' }} />
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full"
                      style={{ boxShadow: '0 0 6px rgba(239, 68, 68, 0.8)' }}
                    />
                  </motion.div>
                </div>

                {/* Title */}
                <h2 
                  className="text-sm font-black text-center mb-1 uppercase tracking-wide"
                  style={{ color: '#ffffff', textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}
                >
                  Trade Alerts
                </h2>

                {/* Subtitle */}
                <p className="text-center text-[10px] mb-3 font-medium" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Get instant notifications for trades & signals
                </p>

                {/* Features - compact grid */}
                <div className="grid grid-cols-3 gap-1.5 mb-4">
                  {[
                    { icon: TrendingUp, text: 'Trades' },
                    { icon: Zap, text: 'Alerts' },
                    { icon: Shield, text: 'VIP' },
                  ].map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg"
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.1)', 
                        border: '1px solid rgba(255, 255, 255, 0.2)' 
                      }}
                    >
                      <feature.icon size={14} className="text-white" style={{ filter: 'drop-shadow(0 0 4px #ffffff)' }} />
                      <span className="text-[8px] font-bold uppercase tracking-wide" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        {feature.text}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleEnable}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-lg font-black text-[11px] uppercase tracking-wider text-white transition-all disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #ffffff 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.5)',
                      boxShadow: '0 0 15px rgba(255, 255, 255, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                      textShadow: '0 0 8px rgba(255,255,255,0.5)'
                    }}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full"
                        />
                        Enabling...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        <Bell size={12} />
                        Enable Notifications
                      </span>
                    )}
                  </motion.button>

                  <button
                    onClick={handleDecline}
                    className="w-full py-2 px-4 rounded-lg font-bold text-[10px] uppercase tracking-wide transition-all hover:bg-white/10"
                    style={{ 
                      color: 'rgba(255, 255, 255, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.15)'
                    }}
                  >
                    Maybe Later
                  </button>
                </div>
              </>
            )}

            {step === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12 }}
                  className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-3"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.3) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    boxShadow: '0 0 20px rgba(255, 255, 255, 0.4)',
                  }}
                >
                  <motion.svg
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                    style={{ filter: 'drop-shadow(0 0 6px #ffffff)' }}
                  >
                    <motion.path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </motion.svg>
                </motion.div>

                <h3 
                  className="text-sm font-black mb-1 uppercase tracking-wide" 
                  style={{ color: '#ffffff', textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}
                >
                  All Set!
                </h3>
                <p className="text-[10px] font-medium" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  You&apos;ll receive instant trade alerts
                </p>
              </motion.div>
            )}

            {step === 'declined' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div 
                  className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-3"
                  style={{ 
                    background: 'rgba(239, 68, 68, 0.15)', 
                    border: '1px solid rgba(239, 68, 68, 0.3)' 
                  }}
                >
                  <BellOff size={22} className="text-red-400" style={{ filter: 'drop-shadow(0 0 4px #ef4444)' }} />
                </div>

                <h3 
                  className="text-sm font-black mb-1 uppercase tracking-wide" 
                  style={{ color: '#fca5a5', textShadow: '0 0 8px rgba(239, 68, 68, 0.4)' }}
                >
                  Disabled
                </h3>
                <p className="text-[9px] font-medium mb-3" style={{ color: 'rgba(252, 165, 165, 0.6)' }}>
                  Enable later in browser settings
                </p>
                <button
                  onClick={handleClose}
                  className="px-4 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wide transition-all hover:bg-red-500/15"
                  style={{ 
                    color: 'rgba(252, 165, 165, 0.7)', 
                    border: '1px solid rgba(239, 68, 68, 0.25)' 
                  }}
                >
                  Got it
                </button>
              </motion.div>
            )}

            {step === 'blocked' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-3"
              >
                <div 
                  className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-3"
                  style={{ 
                    background: 'rgba(251, 191, 36, 0.15)', 
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    boxShadow: '0 0 15px rgba(251, 191, 36, 0.2)'
                  }}
                >
                  <BellOff size={22} className="text-amber-400" style={{ filter: 'drop-shadow(0 0 4px #fbbf24)' }} />
                </div>

                <h3 
                  className="text-sm font-black mb-1 uppercase tracking-wide" 
                  style={{ color: '#fcd34d', textShadow: '0 0 8px rgba(251, 191, 36, 0.4)' }}
                >
                  Blocked by Browser
                </h3>
                <p className="text-[9px] font-medium mb-3 px-2" style={{ color: 'rgba(253, 230, 138, 0.7)' }}>
                  Notifications were previously blocked. To enable:
                </p>
                
                {/* Browser-specific instructions */}
                <div 
                  className="text-left p-2.5 rounded-lg mb-3 mx-1 space-y-1.5"
                  style={{ 
                    background: 'rgba(251, 191, 36, 0.1)', 
                    border: '1px solid rgba(251, 191, 36, 0.2)' 
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-[8px] font-black text-amber-400 mt-0.5">1.</span>
                    <span className="text-[8px] font-medium" style={{ color: 'rgba(253, 230, 138, 0.8)' }}>
                      Click the 🔒 lock icon in the address bar
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[8px] font-black text-amber-400 mt-0.5">2.</span>
                    <span className="text-[8px] font-medium" style={{ color: 'rgba(253, 230, 138, 0.8)' }}>
                      Find &ldquo;Notifications&rdquo; and change to &ldquo;Allow&rdquo;
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[8px] font-black text-amber-400 mt-0.5">3.</span>
                    <span className="text-[8px] font-medium" style={{ color: 'rgba(253, 230, 138, 0.8)' }}>
                      Refresh this page
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 px-3 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-wide transition-all"
                    style={{ 
                      background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                      color: '#000',
                      border: '1px solid rgba(251, 191, 36, 0.5)',
                      boxShadow: '0 0 10px rgba(251, 191, 36, 0.3)'
                    }}
                  >
                    Refresh Page
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-3 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-wide transition-all hover:bg-amber-500/15"
                    style={{ 
                      color: 'rgba(253, 211, 77, 0.7)', 
                      border: '1px solid rgba(251, 191, 36, 0.25)' 
                    }}
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    portalNode
  );
}

// Hook to check notification status
export function useNotificationStatus() {
  const [status, setStatus] = useState<'unknown' | 'enabled' | 'disabled' | 'unsupported'>('unknown');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported');
      return;
    }

    const preference = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (preference === 'enabled' && Notification.permission === 'granted') {
      setStatus('enabled');
    } else if (preference === 'disabled' || Notification.permission === 'denied') {
      setStatus('disabled');
    }
  }, []);

  return status;
}

// Function to manually trigger notification permission request
export async function requestNotificationPermission(): Promise<boolean> {
  const subscription = await subscribeToPush();
  if (subscription) {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, 'enabled');
    return true;
  }
  return false;
}

export default NotificationPermissionModal;
