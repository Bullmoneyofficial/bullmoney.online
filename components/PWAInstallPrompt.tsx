"use client";

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

function InlineShieldIcon({ color }: { color: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      style={{
        width: 14,
        height: 14,
        display: 'block',
        flexShrink: 0,
        opacity: 0.98,
      }}
    >
      <path
        d="M12 2L20 6V12C20 16.97 16.87 21.5 12 22C7.13 21.5 4 16.97 4 12V6L12 2Z"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9 12L11 14L15 10"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
  autoShow?: boolean;
  delay?: number;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  onInstall,
  onDismiss,
  autoShow = true,
  delay = 3000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [showOpenInBrowserHelp, setShowOpenInBrowserHelp] = useState(false);
  const [showAndroidHelp, setShowAndroidHelp] = useState(false);
  const [showDesktopHelp, setShowDesktopHelp] = useState(false);
  const [desktopHelpText, setDesktopHelpText] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  const platform = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        isIOS: false,
        isSafari: false,
        isAndroid: false,
        isInAppBrowser: false,
        isMac: false,
        isWindows: false,
        isEdge: false,
        isChrome: false,
        isSafariDesktop: false,
      };
    }
    const ua = String(window.navigator.userAgent || '').toLowerCase();
    const maxTouchPoints = Number((window.navigator as any).maxTouchPoints || 0);
    const isIOS = /iphone|ipad|ipod/.test(ua) || (/macintosh/.test(ua) && maxTouchPoints > 1);
    const isSafari = /safari/.test(ua) && !/crios|fxios|edgios|opios|chrome|android/.test(ua);
    const isAndroid = /android/.test(ua);
    const isWindows = /windows/.test(ua);
    const isMac = /macintosh|mac os x/.test(ua) && !isIOS;
    const isEdge = /edg\//.test(ua);
    const isChrome = /chrome\//.test(ua) && !isEdge && !/crios/.test(ua);
    const isSafariDesktop = isMac && /safari/.test(ua) && !isChrome && !isEdge;
    const isInAppBrowser =
      /instagram|fban|fbav|fb_iab|facebook|tiktok|bytedance|musical_ly|snapchat|twitter|linkedinapp|line\//.test(ua) ||
      /wv\b|\bwebview\b|gsa\//.test(ua);

    return {
      isIOS,
      isSafari,
      isAndroid,
      isInAppBrowser,
      isMac,
      isWindows,
      isEdge,
      isChrome,
      isSafariDesktop,
    };
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isStandalone = useMemo(() => {
    if (typeof window === 'undefined') return false;
    try {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://')
      );
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    // Check if already installed
    if (typeof window !== 'undefined') {
      if (isStandalone) {
        return; // Already installed, don't show
      }

      // Check if dismissed before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (dismissed) {
        const dismissedTime = parseInt(dismissed, 10);
        const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 7) {
          // Don't show again for 7 days
          return;
        }
      }

      // Android/Chromium: install prompt availability (forwarded by perf-monitor.js)
      const handleInstallAvailable = () => {
        setIsInstallable(true);
        if (autoShow && !hasBeenDismissed) {
          setTimeout(() => setIsVisible(true), delay);
        }
      };

      // Mobile fallback: some browsers don't emit beforeinstallprompt reliably.
      // Keep this conservative: only on touch/mobile and only if not standalone.
      const fallbackTimer = window.setTimeout(() => {
        if (isStandalone) return;
        const isTouch =
          (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
          (navigator.maxTouchPoints || 0) > 0;
        const isSmall = (window.innerWidth || 0) > 0 && (window.innerWidth || 0) < 768;
        if (!platform.isInAppBrowser && (platform.isIOS || platform.isAndroid || isTouch || isSmall)) {
          setIsInstallable(true);
          if (autoShow && !hasBeenDismissed) {
            setIsVisible(true);
          }
        }
      }, Math.max(1800, delay));

      // iOS Safari: no beforeinstallprompt. Still allow A2HS instructions.
      if (platform.isIOS && platform.isSafari) {
        setIsInstallable(true);
        if (autoShow && !hasBeenDismissed) {
          setTimeout(() => setIsVisible(true), delay);
        }
      }

      // In-app browsers: can't reliably trigger PWA install. Show "Open in browser" instead.
      if (platform.isInAppBrowser) {
        setIsInstallable(true);
        if (autoShow && !hasBeenDismissed) {
          setTimeout(() => setIsVisible(true), delay);
        }
      }

      window.addEventListener('pwa-install-available', handleInstallAvailable);

      return () => {
        window.removeEventListener('pwa-install-available', handleInstallAvailable);
        window.clearTimeout(fallbackTimer);
      };
    }
    return () => {};
  }, [autoShow, delay, hasBeenDismissed, isStandalone, platform.isIOS, platform.isSafari, platform.isInAppBrowser]);

  const tryOpenInBrowser = useCallback(() => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;

    // Android: try an intent URL that opens Chrome.
    if (platform.isAndroid) {
      try {
        const withoutScheme = url.replace(/^https?:\/\//i, '');
        const intentUrl = `intent://${withoutScheme}#Intent;scheme=https;package=com.android.chrome;end`;
        window.location.href = intentUrl;
        return;
      } catch {
        // fall through
      }
    }

    // Generic fallback: open a new tab/window.
    try {
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      if (opened) return;
    } catch {
      // ignore
    }

    // If we can't open a new tab, show help text.
    setShowOpenInBrowserHelp(true);
  }, [platform.isAndroid]);

  const handleInstall = useCallback(async () => {
    // In-app browser: the "install" action should route users to a real browser.
    if (platform.isInAppBrowser) {
      tryOpenInBrowser();
      return;
    }

    if (typeof window !== 'undefined' && typeof (window as any).showInstallPrompt === 'function') {
      const didPrompt = Boolean((window as any).showInstallPrompt());
      if (didPrompt) {
        setIsVisible(false);
        setShowIOSHelp(false);
        setShowOpenInBrowserHelp(false);
        setShowAndroidHelp(false);
        setShowDesktopHelp(false);
        setDesktopHelpText('');
        onInstall?.();
        return;
      }
      // If the browser refuses to show the native install prompt (common), fall through to help.
    }

    // iOS fallback: show A2HS instructions (native install prompt API isn't available on iOS)
    if (platform.isIOS) {
      setShowIOSHelp(true);
      return;
    }

    // Android fallback: show A2HS instructions
    if (platform.isAndroid) {
      setShowAndroidHelp(true);
      return;
    }

    // Desktop fallback: show platform/browser-specific instructions
    if (platform.isWindows) {
      setDesktopHelpText('Windows: in Chrome/Edge open the menu (⋯) and choose “Install app” (or “Apps → Install this site as an app”).');
      setShowDesktopHelp(true);
      return;
    }

    if (platform.isMac) {
      if (platform.isSafariDesktop) {
        setDesktopHelpText('Mac: in Safari use Share (or File) → “Add to Dock”.');
      } else {
        setDesktopHelpText('Mac: in Chrome/Edge open the menu (⋯) and choose “Install” (or “Create shortcut”).');
      }
      setShowDesktopHelp(true);
      return;
    }

    // Generic fallback for any other/unknown platform or browser.
    setDesktopHelpText('If you don’t see an install option, this browser may not support installation. Try Chrome/Edge, or on iPhone/iPad use Share → “Add to Home Screen”.');
    setShowDesktopHelp(true);
    return;
  }, [
    onInstall,
    platform.isAndroid,
    platform.isIOS,
    platform.isSafari,
    platform.isInAppBrowser,
    platform.isWindows,
    platform.isMac,
    platform.isSafariDesktop,
    tryOpenInBrowser,
  ]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setHasBeenDismissed(true);
    setShowIOSHelp(false);
    setShowOpenInBrowserHelp(false);
    setShowAndroidHelp(false);
    setShowDesktopHelp(false);
    setDesktopHelpText('');
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    onDismiss?.();
  }, [onDismiss]);

  if (!mounted || !isInstallable || !isVisible) {
    return null;
  }

  const primaryLabel = platform.isInAppBrowser
    ? 'Open'
    : (platform.isIOS ? 'Add' : 'Install');

  const showOfflineInstallerBadge = !platform.isInAppBrowser;

  const titleText = platform.isInAppBrowser
    ? 'Open in browser'
    : 'Install BullMoney';

  const bodyText = platform.isInAppBrowser
    ? 'To install, open this site in Safari or Chrome.'
    : 'Add to your home screen for the full app experience.';

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: '-100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 2147483646,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
            padding: '0 8px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              background: 'rgba(255,255,255,0.98)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              borderRadius: '0 0 16px 16px',
              border: '1px solid rgba(0,0,0,0.08)',
              borderTop: 'none',
              pointerEvents: 'auto',
              overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ padding: '14px 14px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <img
                    src="/IMG_2921.PNG"
                    width={18}
                    height={18}
                    alt="BullMoney"
                    style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
                    loading="eager"
                    decoding="async"
                  />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#1d1d1f',
                      letterSpacing: '-0.01em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {titleText}
                  </span>
                </div>

                <button
                  onClick={handleDismiss}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(0,0,0,0.35)',
                    cursor: 'pointer',
                    padding: 6,
                    lineHeight: 1,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Dismiss"
                >
                  <X size={16} />
                </button>
              </div>

              <p
                style={{
                  fontSize: 11,
                  color: 'rgba(0,0,0,0.45)',
                  marginTop: 4,
                  lineHeight: 1.45,
                  margin: '4px 0 0',
                }}
              >
                {bodyText}
              </p>

              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <button
                    onClick={handleDismiss}
                    style={{
                      width: '100%',
                      padding: '8px 0',
                      borderRadius: 8,
                      border: '1px solid rgba(0,0,0,0.18)',
                      background: 'transparent',
                      color: '#1d1d1f',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Not now
                  </button>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <button
                    onClick={handleInstall}
                    style={{
                      width: '100%',
                      padding: '8px 0',
                      borderRadius: 8,
                      border: 'none',
                      background: '#000000',
                      color: '#ffffff',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      letterSpacing: '-0.01em',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-label={showOfflineInstallerBadge ? `${primaryLabel} (Offline installer)` : primaryLabel}
                  >
                    {showOfflineInstallerBadge ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <InlineShieldIcon color="#ffffff" />
                        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '-0.01em' }}>{primaryLabel}</span>
                        <span
                          style={{
                            marginLeft: 2,
                            padding: '2px 7px',
                            borderRadius: 9999,
                            border: '1px solid rgba(255,255,255,0.35)',
                            background: 'rgba(255,255,255,0.08)',
                            fontSize: 9,
                            fontWeight: 800,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            lineHeight: 1.1,
                          }}
                        >
                          Offline
                        </span>
                      </span>
                    ) : (
                      primaryLabel
                    )}
                  </button>
                </div>
              </div>

              {platform.isIOS && showIOSHelp && (
                <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.35)', marginTop: 8, lineHeight: 1.35 }}>
                  iPhone/iPad: tap Share, then “Add to Home Screen”.
                </div>
              )}

              {platform.isAndroid && showAndroidHelp && (
                <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.35)', marginTop: 8, lineHeight: 1.35 }}>
                  Android: tap the menu (⋮), then “Add to Home screen”.
                </div>
              )}

              {showDesktopHelp && desktopHelpText && (
                <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.35)', marginTop: 8, lineHeight: 1.35 }}>
                  {desktopHelpText}
                </div>
              )}

              {platform.isInAppBrowser && showOpenInBrowserHelp && (
                <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.35)', marginTop: 8, lineHeight: 1.35 }}>
                  If “Open” doesn’t work, use the app’s menu (⋯) and choose “Open in Browser”.
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default PWAInstallPrompt;
