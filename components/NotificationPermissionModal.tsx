"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, X, Zap, TrendingUp, Shield, Check } from 'lucide-react';
import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';

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
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setPortalNode(document.body);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkMobile = () => window.innerWidth < 768;
    setIsMobile(checkMobile());
    const handleResize = () => setIsMobile(checkMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Gentle 3D tilt for desktop
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || isMobile) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / 30;
    const y = (e.clientY - top - height / 2) / 30;
    containerRef.current.style.transform = `perspective(800px) rotateY(${x}deg) rotateX(${-y}deg)`;
  };
  const handleMouseLeave = () => {
    if (containerRef.current) {
      containerRef.current.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg)';
    }
  };

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

  // ── Shared Apple-style content (used by both desktop 3D wrapper and mobile flat) ──
  const popupContent = (
    <div className="relative px-7 pt-10 pb-8 text-black">
      {/* Close button */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleClose(); }}
        className="absolute top-3.5 right-3.5 w-8 h-8 flex items-center justify-center rounded-full
                   border border-black/10 bg-black/[0.03]
                   hover:bg-black/[0.06] hover:border-black/20
                   active:scale-90
                   transition-all duration-200 ease-out z-50 cursor-pointer"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <X className="w-3.5 h-3.5 text-black/60" strokeWidth={2.5} />
      </button>

      {step === 'ask' && (
        <>
          {/* Bell icon */}
          <motion.div
            className="w-14 h-14 mx-auto mb-5 rounded-full border border-black/10 bg-black/[0.03] flex items-center justify-center relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Bell className="w-6 h-6 text-black/70" strokeWidth={1.5} />
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full" />
          </motion.div>

          {/* Title */}
          <motion.h3
            className="text-[22px] font-semibold text-black text-center tracking-tight leading-tight mb-1.5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            Stay in the Loop
          </motion.h3>

          {/* Subtitle */}
          <motion.p
            className="text-[13px] text-black/50 text-center tracking-wide mb-6 font-normal leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18, duration: 0.35 }}
          >
            Get instant alerts for trades, signals & VIP drops
          </motion.p>

          {/* Feature pills */}
          <motion.div
            className="flex justify-center gap-2 mb-6"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {[
              { icon: TrendingUp, text: 'Trades' },
              { icon: Zap, text: 'Alerts' },
              { icon: Shield, text: 'VIP' },
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg
                           border border-black/10 bg-black/[0.03]"
              >
                <feature.icon className="w-3.5 h-3.5 text-black/60" strokeWidth={2} />
                <span className="text-[11px] text-black/60 font-medium tracking-wide">{feature.text}</span>
              </div>
            ))}
          </motion.div>

          {/* Enable button — Apple white */}
          <motion.button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEnable(); }}
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl font-semibold text-[15px] tracking-wide
                       bg-black text-white
                       border border-black/20
                       hover:bg-black/90
                       active:scale-[0.97] active:bg-black/80
                       transition-all duration-200 ease-out
                       cursor-pointer disabled:opacity-50"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
                Enabling...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Bell className="w-4 h-4" strokeWidth={2} />
                Enable Notifications
              </span>
            )}
          </motion.button>

          {/* Decline button */}
          <motion.button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDecline(); }}
            className="w-full py-2.5 mt-2.5 rounded-xl font-medium text-[13px] tracking-wide
                       text-black/60
                       border border-black/15
                       hover:text-black/80 hover:bg-black/[0.04] hover:border-black/25
                       active:scale-[0.97]
                       transition-all duration-200 ease-out
                       cursor-pointer"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.34, duration: 0.3 }}
          >
            Maybe Later
          </motion.button>
        </>
      )}

      {step === 'success' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center pt-2 pb-2">
          <motion.div
            className="w-14 h-14 mx-auto mb-5 rounded-full border border-black/10 bg-black/[0.03] flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <Check className="w-6 h-6 text-black/70" strokeWidth={2} />
          </motion.div>
          <h3 className="text-[22px] font-semibold text-black text-center tracking-tight mb-1.5">All Set</h3>
          <p className="text-[13px] text-black/50 text-center tracking-wide font-normal">You&apos;ll receive instant trade alerts</p>
        </motion.div>
      )}

      {step === 'declined' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center pt-2 pb-2"
        >
          <div className="w-14 h-14 mx-auto mb-5 rounded-full border border-black/10 bg-black/[0.03] flex items-center justify-center">
            <BellOff className="w-6 h-6 text-black/50" strokeWidth={1.5} />
          </div>
          <h3 className="text-[22px] font-semibold text-black text-center tracking-tight mb-1.5">Notifications Off</h3>
          <p className="text-[13px] text-black/50 text-center tracking-wide font-normal mb-5">You can enable them later in settings</p>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleClose(); }}
            className="px-8 py-2.5 rounded-xl font-medium text-[13px] tracking-wide
                       text-black/70 border border-black/20
                       hover:bg-black/[0.04] hover:border-black/30
                       active:scale-[0.97]
                       transition-all duration-200 ease-out cursor-pointer"
          >
            Got It
          </button>
        </motion.div>
      )}

      {step === 'blocked' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center pt-2 pb-2">
          <div className="w-14 h-14 mx-auto mb-5 rounded-full border border-black/10 bg-black/[0.03] flex items-center justify-center">
            <BellOff className="w-6 h-6 text-black/50" strokeWidth={1.5} />
          </div>
          <h3 className="text-[22px] font-semibold text-black text-center tracking-tight mb-1.5">Blocked by Browser</h3>
          <p className="text-[13px] text-black/50 text-center tracking-wide font-normal mb-5">
            Notifications were previously blocked
          </p>
          
          <div className="rounded-xl border border-black/10 bg-black/[0.03] p-4 mb-5 text-left space-y-2.5">
            {[
              'Tap the lock icon in the address bar',
              'Find "Notifications" and change to "Allow"',
              'Refresh this page',
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="text-[11px] text-black/40 font-semibold mt-px">{i + 1}.</span>
                <span className="text-[12px] text-black/60 font-normal leading-relaxed">{text}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-3 rounded-xl font-semibold text-[14px] tracking-wide
                         bg-black text-white border border-black/20
                         hover:bg-black/90 active:scale-[0.97] active:bg-black/80
                         transition-all duration-200 ease-out cursor-pointer"
            >
              Refresh
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleClose(); }}
              className="flex-1 py-3 rounded-xl font-medium text-[14px] tracking-wide
                         text-black/70 border border-black/20
                         hover:bg-black/[0.04] hover:border-black/30
                         active:scale-[0.97]
                         transition-all duration-200 ease-out cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ 
          background: 'transparent',
          zIndex: 2147483647,
        }}
        onClick={handleClose}
      >
        {/* Desktop: subtle 3D wrapper | Mobile: flat */}
        {!isMobile ? (
          <CardContainer className="w-full max-w-sm scale-[0.7] origin-center" containerClassName="py-0">
            <CardBody className="w-full h-auto p-0">
              <CardItem translateZ="40" className="w-full">
                <HoverBorderGradient
                  containerClassName="rounded-2xl w-full"
                  className="p-0 bg-transparent w-full"
                  as="div"
                >
                  <motion.div
                    ref={containerRef}
                    initial={{ opacity: 0, scale: 0.96, y: 24 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 24 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 320, mass: 0.7 }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    className="relative w-full overflow-hidden rounded-2xl bg-white"
                    style={{ transition: 'transform 0.15s ease-out' }}
                  >
                    <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-black/20 to-transparent pointer-events-none" />
                    <div className="absolute inset-0 border border-black/10 rounded-2xl pointer-events-none z-2" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/[0.03] via-transparent to-transparent pointer-events-none rounded-2xl" />
                    {popupContent}
                  </motion.div>
                </HoverBorderGradient>
              </CardItem>
            </CardBody>
          </CardContainer>
        ) : (
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 24 }}
            transition={{ type: 'spring', damping: 30, stiffness: 320, mass: 0.7 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm scale-[0.7] origin-center overflow-hidden rounded-2xl bg-white border border-black/10 shadow-2xl"
          >
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-black/20 to-transparent pointer-events-none" />
            {popupContent}
          </motion.div>
        )}
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
