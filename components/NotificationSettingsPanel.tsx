"use client";

import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, BellOff, BellRing, Settings, ChevronUp,
  TrendingUp, MessageCircle, ShoppingBag, Crown, Volume2, VolumeX,
  Check, X, Loader2, AlertCircle, Zap
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

// ============================================================================
// NOTIFICATION SETTINGS PANEL - ULTIMATE HUB STYLE
// Neon blue aesthetic matching UltimateHub design system
// ============================================================================

interface NotificationToggleProps {
  compact?: boolean;
  showChannelSettings?: boolean;
}

const CHANNEL_CONFIG = {
  trades: { name: 'FREE TRADES', icon: TrendingUp, color: 'cyan', description: 'Free trade signals & setups' },
  main: { name: 'LIVESTREAMS', icon: MessageCircle, color: 'blue', description: 'Live stream notifications' },
  shop: { name: 'NEWS', icon: ShoppingBag, color: 'emerald', description: 'Market news & updates' },
  vip: { name: 'VIP TRADES', icon: Crown, color: 'amber', description: 'Premium VIP trade alerts' },
} as const;

type ChannelKey = keyof typeof CHANNEL_CONFIG;

export const NotificationToggle = memo(({ compact = false, showChannelSettings = true }: NotificationToggleProps) => {
  const {
    settings,
    isSubscribed,
    isLoading,
    isSupported,
    isCheckingSupport,
    isPermissionDenied,
    toggle,
    setChannelEnabled,
    toggleSound,
  } = useNotifications();

  const [isExpanded, setIsExpanded] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  // Combined loading state
  const showLoading = isLoading || localLoading || isCheckingSupport;

  // Handle toggle with proper async handling
  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('[NotificationToggle] 🔔 Toggle clicked!');
    console.log('[NotificationToggle] State:', { isSubscribed, isLoading, localLoading, showLoading, isPermissionDenied, isSupported });
    
    if (showLoading) {
      console.log('[NotificationToggle] ⏳ Already loading, ignoring click');
      return;
    }
    
    if (isPermissionDenied) {
      console.log('[NotificationToggle] 🚫 Permission denied, showing instructions');
      // Show browser-specific instructions
      const instructions = `Notifications are blocked by your browser.

To enable notifications:
1. Click the 🔒 lock icon in the address bar
2. Find "Notifications" setting
3. Change it from "Block" to "Allow"
4. Refresh this page

On mobile Safari: Go to Settings > Notifications > Safari`;
      alert(instructions);
      return;
    }
    
    setLocalLoading(true);
    console.log('[NotificationToggle] 📤 Calling toggle...');
    
    try {
      const result = await toggle();
      console.log('[NotificationToggle] ✅ Toggle result:', result);
    } catch (error) {
      console.error('[NotificationToggle] ❌ Toggle error:', error);
    } finally {
      setLocalLoading(false);
      console.log('[NotificationToggle] 🏁 Loading complete');
    }
  };

  if (!isSupported && !isCheckingSupport) {
    return (
      <div 
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] cursor-pointer"
        onClick={() => {
          const info = `Push notifications are not available.

This could be because:
• You're not on HTTPS (secure connection required)
• Your browser doesn't support push notifications
• You're in Private/Incognito mode
• Service Workers are disabled

Supported browsers:
✅ Chrome (desktop & Android)
✅ Firefox (desktop & Android)
✅ Edge (desktop)
✅ Safari 16+ (macOS & iOS 16.4+)
✅ Opera

Current URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}
Protocol: ${typeof window !== 'undefined' ? window.location.protocol : 'N/A'}`;
          alert(info);
        }}
      >
        <AlertCircle className="w-3.5 h-3.5" />
        <span className="font-medium">Tap for info</span>
      </div>
    );
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={showLoading}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all cursor-pointer ${
          isSubscribed
            ? 'bg-blue-500/20 text-blue-300 border border-blue-400/60'
            : isPermissionDenied
            ? 'bg-red-500/20 text-red-400 border border-red-500/30 cursor-not-allowed'
            : 'bg-black/40 text-blue-400 border border-blue-500/30 hover:bg-blue-500/15 hover:border-blue-400/50'
        }`}
        style={{
          boxShadow: isSubscribed ? '0 0 8px rgba(59, 130, 246, 0.4), inset 0 0 8px rgba(59, 130, 246, 0.1)' : 'none',
          textShadow: isSubscribed ? '0 0 4px #3b82f6' : 'none'
        }}
      >
        {showLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isSubscribed ? (
          <BellRing className="w-3.5 h-3.5" style={{ filter: 'drop-shadow(0 0 4px #3b82f6)' }} />
        ) : isPermissionDenied ? (
          <AlertCircle className="w-3.5 h-3.5" />
        ) : (
          <Bell className="w-3.5 h-3.5" />
        )}
        <span>{isSubscribed ? 'ON' : isPermissionDenied ? 'BLOCKED' : 'OFF'}</span>
      </button>
    );
  }

  return (
    <div className="space-y-1.5">
      {/* Main Toggle Row - Ultimate Hub Neon Style */}
      <div 
        className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-black/60 border transition-all"
        style={{
          borderColor: isSubscribed ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.2)',
          boxShadow: isSubscribed 
            ? '0 0 12px rgba(59, 130, 246, 0.3), inset 0 0 12px rgba(59, 130, 246, 0.05)' 
            : '0 0 4px rgba(59, 130, 246, 0.1)'
        }}
      >
        <div className="flex items-center gap-2.5">
          {/* Icon with neon glow */}
          <div 
            className={`p-2 rounded-lg transition-all ${
              isSubscribed 
                ? 'bg-blue-500/20 border border-blue-400/40' 
                : 'bg-black/40 border border-blue-500/20'
            }`}
            style={{
              boxShadow: isSubscribed ? '0 0 8px rgba(59, 130, 246, 0.4), inset 0 0 8px rgba(59, 130, 246, 0.1)' : 'none'
            }}
          >
            {isSubscribed ? (
              <BellRing 
                className="w-4 h-4 text-blue-400" 
                style={{ filter: 'drop-shadow(0 0 4px #3b82f6) drop-shadow(0 0 8px #3b82f6)' }}
              />
            ) : (
              <Bell className="w-4 h-4 text-blue-400/60" />
            )}
          </div>
          
          {/* Labels */}
          <div>
            <div className="flex items-center gap-2">
              <span 
                className="text-[11px] font-bold uppercase tracking-wide"
                style={{ 
                  color: isSubscribed ? '#93c5fd' : '#60a5fa',
                  textShadow: isSubscribed ? '0 0 4px #3b82f6, 0 0 8px #3b82f6' : 'none'
                }}
              >
                Push Notifications
              </span>
              {isSubscribed && (
                <span 
                  className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider bg-blue-500/30 text-blue-300 border border-blue-400/50"
                  style={{ 
                    boxShadow: '0 0 6px rgba(59, 130, 246, 0.5)',
                    textShadow: '0 0 4px #3b82f6'
                  }}
                >
                  ACTIVE
                </span>
              )}
            </div>
            <div className="text-[9px] text-blue-300/50 font-medium mt-0.5">
              {isPermissionDenied 
                ? 'Blocked in browser settings' 
                : isSubscribed 
                ? 'Receiving trade alerts on this device'
                : 'Tap to enable trade alerts'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Settings button */}
          {showChannelSettings && isSubscribed && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="p-1.5 rounded-lg bg-black/40 hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-400/50 text-blue-400 transition-all"
              style={{ boxShadow: '0 0 4px rgba(59, 130, 246, 0.2)' }}
            >
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <Settings className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {/* Toggle Switch - Neon Blue Style */}
          <button
            type="button"
            onClick={handleToggle}
            disabled={showLoading}
            className={`relative w-12 h-7 rounded-full transition-all cursor-pointer ${
              showLoading ? 'opacity-70' : ''
            }`}
            style={{
              background: isSubscribed 
                ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
                : isPermissionDenied 
                ? 'rgba(239, 68, 68, 0.3)' 
                : 'rgba(39, 39, 42, 0.8)',
              border: isSubscribed 
                ? '2px solid #60a5fa' 
                : '2px solid rgba(59, 130, 246, 0.3)',
              boxShadow: isSubscribed 
                ? '0 0 12px rgba(59, 130, 246, 0.6), 0 0 24px rgba(59, 130, 246, 0.3), inset 0 0 8px rgba(59, 130, 246, 0.3)' 
                : '0 0 4px rgba(59, 130, 246, 0.1)',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ease-out ${
                isSubscribed ? 'translate-x-[22px]' : 'translate-x-[2px]'
              }`}
              style={{
                background: isSubscribed 
                  ? 'linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)' 
                  : 'linear-gradient(135deg, #a1a1aa 0%, #71717a 100%)',
                boxShadow: isSubscribed 
                  ? '0 0 8px rgba(255, 255, 255, 0.8), 0 2px 4px rgba(0,0,0,0.2)' 
                  : '0 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              {showLoading && (
                <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Expanded Settings Panel */}
      <AnimatePresence>
        {isExpanded && isSubscribed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div 
              className="p-2.5 rounded-xl bg-black/40 border border-blue-500/20 space-y-2.5"
              style={{ boxShadow: 'inset 0 0 12px rgba(59, 130, 246, 0.05)' }}
            >
              {/* Channel Toggles Header */}
              <div 
                className="text-[9px] font-black uppercase tracking-widest px-1"
                style={{ color: '#60a5fa', textShadow: '0 0 4px rgba(59, 130, 246, 0.5)' }}
              >
                Notification Channels
              </div>
              
              {/* Channel Grid */}
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(CHANNEL_CONFIG) as ChannelKey[]).map(channelKey => {
                  const channel = CHANNEL_CONFIG[channelKey];
                  const Icon = channel.icon;
                  const isEnabled = settings.channels[channelKey];
                  
                  const colorStyles = {
                    cyan: { bg: 'rgba(6, 182, 212, 0.2)', border: 'rgba(6, 182, 212, 0.4)', text: '#22d3ee', shadow: '0 0 8px rgba(6, 182, 212, 0.4)' },
                    blue: { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.4)', text: '#60a5fa', shadow: '0 0 8px rgba(59, 130, 246, 0.4)' },
                    emerald: { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.4)', text: '#34d399', shadow: '0 0 8px rgba(16, 185, 129, 0.4)' },
                    amber: { bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.4)', text: '#fbbf24', shadow: '0 0 8px rgba(245, 158, 11, 0.4)' },
                  };
                  
                  const colors = colorStyles[channel.color as keyof typeof colorStyles];
                  
                  return (
                    <button
                      key={channelKey}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setChannelEnabled(channelKey, !isEnabled); }}
                      className="flex items-center gap-1.5 p-2 rounded-lg text-left transition-all"
                      style={{
                        background: isEnabled ? colors.bg : 'rgba(0, 0, 0, 0.4)',
                        border: `1px solid ${isEnabled ? colors.border : 'rgba(59, 130, 246, 0.15)'}`,
                        boxShadow: isEnabled ? colors.shadow : 'none'
                      }}
                    >
                      <Icon 
                        className="w-3.5 h-3.5 flex-shrink-0"
                        style={{ 
                          color: isEnabled ? colors.text : '#71717a',
                          filter: isEnabled ? `drop-shadow(0 0 4px ${colors.text})` : 'none'
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div 
                          className="text-[9px] font-bold truncate uppercase tracking-wide"
                          style={{ 
                            color: isEnabled ? colors.text : '#a1a1aa',
                            textShadow: isEnabled ? `0 0 4px ${colors.text}` : 'none'
                          }}
                        >
                          {channel.name}
                        </div>
                      </div>
                      <div 
                        className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: isEnabled ? colors.text : 'rgba(63, 63, 70, 0.8)',
                          boxShadow: isEnabled ? `0 0 6px ${colors.text}` : 'none'
                        }}
                      >
                        {isEnabled ? (
                          <Check className="w-2.5 h-2.5 text-black" />
                        ) : (
                          <X className="w-2.5 h-2.5 text-zinc-500" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Sound Toggle */}
              <div 
                className="flex items-center justify-between p-2 rounded-lg"
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(59, 130, 246, 0.15)'
                }}
              >
                <div className="flex items-center gap-2">
                  {settings.sound ? (
                    <Volume2 
                      className="w-3.5 h-3.5 text-blue-400" 
                      style={{ filter: 'drop-shadow(0 0 4px #3b82f6)' }}
                    />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
                  )}
                  <span 
                    className="text-[10px] font-bold uppercase tracking-wide"
                    style={{ 
                      color: settings.sound ? '#93c5fd' : '#a1a1aa',
                      textShadow: settings.sound ? '0 0 4px rgba(59, 130, 246, 0.5)' : 'none'
                    }}
                  >
                    Sound
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleSound(); }}
                  className="relative w-9 h-5 rounded-full transition-all"
                  style={{
                    background: settings.sound 
                      ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
                      : 'rgba(63, 63, 70, 0.8)',
                    border: settings.sound ? '1px solid #60a5fa' : '1px solid rgba(59, 130, 246, 0.2)',
                    boxShadow: settings.sound ? '0 0 8px rgba(59, 130, 246, 0.5)' : 'none'
                  }}
                >
                  <div
                    className="absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200"
                    style={{
                      transform: settings.sound ? 'translateX(18px)' : 'translateX(2px)',
                      boxShadow: settings.sound ? '0 0 6px rgba(255,255,255,0.8)' : '0 1px 2px rgba(0,0,0,0.3)'
                    }}
                  />
                </button>
              </div>

              {/* Info Box */}
              <div 
                className="flex items-start gap-2 p-2 rounded-lg"
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  boxShadow: 'inset 0 0 12px rgba(59, 130, 246, 0.05)'
                }}
              >
                <Zap 
                  className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" 
                  style={{ filter: 'drop-shadow(0 0 4px #3b82f6)' }}
                />
                <p 
                  className="text-[8px] leading-relaxed font-medium"
                  style={{ color: 'rgba(147, 197, 253, 0.9)' }}
                >
                  Notifications work even when the app is closed. Your device will alert you when new trades are posted.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
NotificationToggle.displayName = 'NotificationToggle';

// Inline notification badge for showing in headers/tabs - Neon Blue Style
export const NotificationBadge = memo(({ onClick }: { onClick?: () => void }) => {
  const { isSubscribed, isLoading, toggle } = useNotifications();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else {
      await toggle();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className="relative p-1.5 rounded-lg transition-all"
      style={{
        background: isSubscribed ? 'rgba(59, 130, 246, 0.2)' : 'rgba(39, 39, 42, 0.6)',
        border: isSubscribed ? '1px solid rgba(96, 165, 250, 0.5)' : '1px solid rgba(59, 130, 246, 0.2)',
        boxShadow: isSubscribed ? '0 0 8px rgba(59, 130, 246, 0.4)' : 'none'
      }}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
      ) : isSubscribed ? (
        <BellRing 
          className="w-3.5 h-3.5 text-blue-400" 
          style={{ filter: 'drop-shadow(0 0 4px #3b82f6)' }}
        />
      ) : (
        <Bell className="w-3.5 h-3.5 text-blue-400/60" />
      )}
      
      {/* Active indicator with pulse */}
      {isSubscribed && (
        <div 
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
          style={{
            background: '#3b82f6',
            boxShadow: '0 0 6px #3b82f6, 0 0 12px #3b82f6'
          }}
        >
          <div 
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: '#3b82f6', opacity: 0.75 }}
          />
        </div>
      )}
    </button>
  );
});
NotificationBadge.displayName = 'NotificationBadge';

export default NotificationToggle;
