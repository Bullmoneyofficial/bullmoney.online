"use client";

import { useState, useEffect } from 'react';

interface BrowserInfo {
  name: string;
  version: string;
  engine: string; // Chromium, WebKit, Gecko, Trident, etc.
  platform: string; // Windows, macOS, iOS, Android, Linux
  locale: string;
  onLine: boolean;
}

/**
 * Hook for detecting detailed browser and rendering engine information
 */
export function useBrowserInfo(): BrowserInfo {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo>({
    name: 'Detecting...',
    version: '',
    engine: 'Unknown',
    platform: 'Unknown',
    locale: navigator.language || 'en-US',
    onLine: navigator.onLine,
  });

  useEffect(() => {
    const ua = navigator.userAgent;
    const nav = navigator as any;

    // Detect browser name and version
    let name = 'Unknown';
    let version = '';

    if (/OPR\/([\d.]+)/.test(ua)) {
      name = 'Opera';
      version = RegExp.$1;
    } else if (/Edg\/([\d.]+)/.test(ua)) {
      name = 'Edge';
      version = RegExp.$1;
    } else if (/Chrome\/([\d.]+)/.test(ua) && !/Edge|OPR|UCWEB/.test(ua)) {
      name = 'Chrome';
      version = RegExp.$1;
    } else if (/Version\/([\d.]+).*Safari/.test(ua) && !/Chrome|CriOS|OPR|Edg/.test(ua)) {
      name = 'Safari';
      version = RegExp.$1;
    } else if (/Firefox\/([\d.]+)/.test(ua)) {
      name = 'Firefox';
      version = RegExp.$1;
    } else if (/MSIE ([\d.]+)|Trident.*rv:([\d.]+)/.test(ua)) {
      name = 'Internet Explorer';
      version = RegExp.$1 || RegExp.$2;
    }

    // Detect rendering engine
    let engine = 'Unknown';
    if (/Trident/.test(ua)) {
      engine = 'Trident';
    } else if (/like Gecko/.test(ua) && !/WebKit/.test(ua)) {
      engine = 'Gecko (Firefox)';
    } else if (/WebKit/.test(ua)) {
      if (/Chrome|Edge|Opera/.test(ua)) {
        engine = 'Blink';
      } else {
        engine = 'WebKit (Safari)';
      }
    }

    // Detect platform
    let platform = 'Unknown';
    const platformUA = (nav.userAgentData?.platform || nav.platform || '').toLowerCase();

    if (/win/.test(platformUA) || /windows/.test(ua.toLowerCase())) {
      platform = 'Windows';
    } else if (/mac/.test(platformUA) || /macintosh|macintel|macosx|darwin/.test(ua.toLowerCase())) {
      if (/iphone|ios|ipad/.test(ua.toLowerCase())) {
        platform = 'iOS';
      } else {
        platform = 'macOS';
      }
    } else if (/linux/.test(platformUA) || /linux|x11/.test(ua.toLowerCase())) {
      if (/android/.test(ua.toLowerCase())) {
        platform = 'Android';
      } else {
        platform = 'Linux';
      }
    } else if (/iphone|ios/.test(ua.toLowerCase())) {
      platform = 'iOS';
    } else if (/ipad/.test(ua.toLowerCase())) {
      platform = 'iPadOS';
    } else if (/android/.test(ua.toLowerCase())) {
      platform = 'Android';
    }

    setBrowserInfo({
      name,
      version,
      engine,
      platform,
      locale: navigator.language || 'en-US',
      onLine: navigator.onLine,
    });

    // Listen for online/offline changes
    const handleOnline = () => {
      setBrowserInfo(prev => ({ ...prev, onLine: true }));
    };

    const handleOffline = () => {
      setBrowserInfo(prev => ({ ...prev, onLine: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return browserInfo;
}
