"use client";

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// NOTIFICATION SYSTEM HOOK
// Full push notification management with channel-specific subscriptions
// ============================================================================

const NOTIFICATION_STORAGE_KEY = 'bullmoney_notification_settings';
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

export interface NotificationChannel {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  icon: string;
}

export interface NotificationSettings {
  enabled: boolean;
  permission: NotificationPermission | 'unsupported';
  channels: {
    trades: boolean;
    main: boolean;
    shop: boolean;
    vip: boolean;
  };
  sound: boolean;
  vibrate: boolean;
  lastUpdated: number;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  permission: 'default',
  channels: {
    trades: true,
    main: true,
    shop: true,
    vip: true,
  },
  sound: true,
  vibrate: true,
  lastUpdated: 0,
};

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

export function useNotifications() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (e) {
        console.error('[Notifications] Failed to parse settings:', e);
      }
    }

    // Check current permission and subscription status
    if ('Notification' in window) {
      setSettings(prev => ({ ...prev, permission: Notification.permission }));
      
      // Check if already subscribed - with timeout to prevent hanging
      if ('serviceWorker' in navigator) {
        const checkSubscription = async () => {
          try {
            // Wait for service worker with timeout
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Service worker timeout')), 5000)
            );
            
            const registration = await Promise.race([
              navigator.serviceWorker.ready,
              timeoutPromise
            ]) as ServiceWorkerRegistration;
            
            const sub = await registration.pushManager.getSubscription();
            console.log('[Notifications] Existing subscription:', !!sub);
            setIsSubscribed(!!sub);
            setSubscription(sub);
            if (sub) {
              setSettings(prev => ({ ...prev, enabled: true }));
            }
          } catch (error) {
            console.warn('[Notifications] Could not check subscription:', error);
          }
        };
        
        checkSubscription();
      }
    } else {
      setSettings(prev => ({ ...prev, permission: 'unsupported' }));
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings, lastUpdated: Date.now() };
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    console.log('[Notifications] Subscribe called');
    
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.error('[Notifications] Push not supported');
      return false;
    }

    if (!VAPID_PUBLIC_KEY) {
      console.error('[Notifications] VAPID_PUBLIC_KEY not configured - check .env.local');
      alert('Push notifications are not configured. Please contact support.');
      return false;
    }

    setIsLoading(true);
    console.log('[Notifications] Loading started');

    try {
      // First, register the service worker if not already registered
      console.log('[Notifications] Registering service worker...');
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        
        // Wait with timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Service worker ready timeout')), 10000)
        );
        
        await Promise.race([navigator.serviceWorker.ready, timeoutPromise]);
        console.log('[Notifications] Service Worker ready');
      } catch (swError) {
        console.error('[Notifications] Service Worker registration failed:', swError);
        setIsLoading(false);
        return false;
      }

      // Request permission
      console.log('[Notifications] Requesting permission...');
      const permission = await Notification.requestPermission();
      console.log('[Notifications] Permission result:', permission);
      saveSettings({ permission });

      if (permission !== 'granted') {
        console.log('[Notifications] Permission denied');
        setIsLoading(false);
        return false;
      }

      // Get service worker registration for push subscription
      const registration = await navigator.serviceWorker.ready;
      console.log('[Notifications] Got registration, subscribing to push...');

      // Subscribe to push
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      console.log('[Notifications] Push subscription created');

      // Send subscription to server with channel preferences
      console.log('[Notifications] Saving to server...');
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub,
          channels: settings.channels,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        }),
      });
      
      const data = await response.json();
      console.log('[Notifications] Server response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save subscription');
      }

      setSubscription(sub);
      setIsSubscribed(true);
      saveSettings({ enabled: true });

      console.log('[Notifications] Successfully subscribed');
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('[Notifications] Subscribe error:', error);
      setIsLoading(false);
      return false;
    }
  }, [settings.channels, saveSettings]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);

    try {
      if (subscription) {
        // Notify server
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        // Unsubscribe locally
        await subscription.unsubscribe();
      }

      setSubscription(null);
      setIsSubscribed(false);
      saveSettings({ enabled: false });

      console.log('[Notifications] Successfully unsubscribed');
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('[Notifications] Unsubscribe error:', error);
      setIsLoading(false);
      return false;
    }
  }, [subscription, saveSettings]);

  // Toggle notifications on/off
  const toggle = useCallback(async (): Promise<boolean> => {
    if (isSubscribed) {
      return unsubscribe();
    } else {
      return subscribe();
    }
  }, [isSubscribed, subscribe, unsubscribe]);

  // Update channel preferences
  const setChannelEnabled = useCallback(async (channel: keyof NotificationSettings['channels'], enabled: boolean) => {
    const newChannels = { ...settings.channels, [channel]: enabled };
    saveSettings({ channels: newChannels });

    // Update server if subscribed
    if (isSubscribed && subscription) {
      try {
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription,
            channels: newChannels,
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
          }),
        });
      } catch (error) {
        console.error('[Notifications] Failed to update channel preferences:', error);
      }
    }
  }, [settings.channels, isSubscribed, subscription, saveSettings]);

  // Toggle sound
  const toggleSound = useCallback(() => {
    saveSettings({ sound: !settings.sound });
  }, [settings.sound, saveSettings]);

  // Toggle vibration
  const toggleVibrate = useCallback(() => {
    saveSettings({ vibrate: !settings.vibrate });
  }, [settings.vibrate, saveSettings]);

  return {
    settings,
    isSubscribed,
    isLoading,
    isSupported: settings.permission !== 'unsupported',
    isPermissionDenied: settings.permission === 'denied',
    subscribe,
    unsubscribe,
    toggle,
    setChannelEnabled,
    toggleSound,
    toggleVibrate,
  };
}

export default useNotifications;
