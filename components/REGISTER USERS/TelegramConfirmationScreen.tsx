"use client";

import React, { useState, useEffect } from 'react';
import { Send, Loader2, Check, Gift, TrendingUp, Video, Bell, Newspaper, Lock, Unlock, Sparkles, Copy, Link2, Share2, ExternalLink, AlertTriangle } from 'lucide-react';
import { cn } from "@/lib/utils";

const TELEGRAM_GROUP_LINK = "https://t.me/addlist/uswKuwT2JUQ4YWI8";
const MINIMUM_WAIT_TIME = 3000; // 3 seconds minimum before unlock button is enabled

const GlobalStyles = () => (
  <style jsx global>{`
    /* Input autofill styling override */
    input:-webkit-autofill,
    input:-webkit-autofill:hover, 
    input:-webkit-autofill:focus, 
    input:-webkit-autofill:active{
        -webkit-box-shadow: 0 0 0 30px #171717 inset !important;
        -webkit-text-fill-color: white !important;
        transition: background-color 5000s ease-in-out 0s;
    }
    
    @keyframes celebrate {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-5px); }
    }
    
    @keyframes checkmark {
      0% { transform: scale(0) rotate(-45deg); opacity: 0; }
      50% { transform: scale(1.2) rotate(0deg); }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
    
    @keyframes neonPulse {
      0%, 100% { 
        filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 6px rgba(255, 255, 255, 0.6));
      }
      50% { 
        filter: drop-shadow(0 0 6px rgba(255, 255, 255, 1)) drop-shadow(0 0 12px rgba(255, 255, 255, 0.8));
      }
    }
    
    @keyframes textGlow {
      0%, 100% { 
        text-shadow: 0 0 4px rgba(255, 255, 255, 0.8), 0 0 8px rgba(255, 255, 255, 0.6), 0 0 12px rgba(255, 255, 255, 0.4);
      }
      50% { 
        text-shadow: 0 0 6px rgba(255, 255, 255, 1), 0 0 12px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.6);
      }
    }
    
    .celebrate-pulse {
      animation: celebrate 0.6s ease-in-out;
    }
    
    .float-animation {
      animation: float 3s ease-in-out infinite;
    }
    
    .checkmark-pop {
      animation: checkmark 0.4s ease-out forwards;
    }
    
    .neon-icon {
      filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 8px rgba(255, 255, 255, 0.7)) drop-shadow(0 0 12px rgba(255, 255, 255, 0.5));
    }
    
    .neon-icon-pulse {
      animation: neonPulse 2s ease-in-out infinite;
    }
    
    .neon-text {
      text-shadow: 0 0 4px rgba(255, 255, 255, 0.8), 0 0 8px rgba(255, 255, 255, 0.6), 0 0 12px rgba(255, 255, 255, 0.4);
    }
    
    .neon-text-pulse {
      animation: textGlow 2s ease-in-out infinite;
    }
    
    .neon-border {
      box-shadow: 0 0 5px rgba(255, 255, 255, 0.5), 0 0 10px rgba(255, 255, 255, 0.3), 0 0 20px rgba(255, 255, 255, 0.2), inset 0 0 5px rgba(255, 255, 255, 0.1);
    }
    
    .neon-border-strong {
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.7), 0 0 16px rgba(255, 255, 255, 0.5), 0 0 24px rgba(255, 255, 255, 0.3), inset 0 0 8px rgba(255, 255, 255, 0.15);
    }
    
    .neon-container {
      border-color: rgba(255, 255, 255, 0.5);
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.3), 0 0 20px rgba(255, 255, 255, 0.2), 0 0 30px rgba(255, 255, 255, 0.1), inset 0 0 15px rgba(255, 255, 255, 0.05);
    }
  `}</style>
);

// What users unlock by joining
const UNLOCK_BENEFITS = [
  { icon: TrendingUp, label: "Free Trades", color: "text-white" },
  { icon: Video, label: "Live Streams", color: "text-white" },
  { icon: Bell, label: "Real-time Updates", color: "text-white" },
  { icon: Newspaper, label: "Market News", color: "text-white" },
  { icon: Gift, label: "Exclusive Groups", color: "text-white" },
];

interface TelegramConfirmationScreenProps {
  onUnlock: () => void;
  onConfirmationClicked: () => void;
  isXM: boolean;
  neonIconClass: string;
}

// Robust clipboard copy with fallback for Telegram in-app browser & WebViews
// Same approach as pagemode copyCode
const robustCopy = async (text: string): Promise<boolean> => {
  if (!text) return false;
  try {
    if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {}
    }
    // Fallback: textarea method (works in Telegram browser, iOS Safari, etc.)
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.cssText = 'position:fixed;top:0;left:0;width:2em;height:2em;padding:0;border:none;outline:none;box-shadow:none;background:transparent;z-index:-1;';
    document.body.appendChild(textarea);
    const range = document.createRange();
    range.selectNodeContents(textarea);
    const selection = window.getSelection();
    if (selection) { selection.removeAllRanges(); selection.addRange(range); }
    textarea.setSelectionRange(0, textarea.value.length);
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
};

export const TelegramConfirmationScreen: React.FC<TelegramConfirmationScreenProps> = ({
  onUnlock,
  onConfirmationClicked,
  isXM,
  neonIconClass,
}) => {
  const [joinedTelegram, setJoinedTelegram] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(MINIMUM_WAIT_TIME / 1000);
  const [canUnlock, setCanUnlock] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  // Detect in-app browsers (Instagram, Telegram, TikTok, etc.) where tabs don't work
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || '';
      const inApp = /Instagram|FBAN|FBAV|TikTok|musical_ly|Line\/|GSA|Twitter|Snapchat|LinkedInApp|wv\)|Telegram/i.test(ua);
      setIsInAppBrowser(inApp);
    }
  }, []);

  const handleCopy = async (text: string, label: string) => {
    const ok = await robustCopy(text);
    if (ok) {
      setCopiedItem(label);
      setTimeout(() => setCopiedItem(null), 1500);
    }
  };

  useEffect(() => {
    if (!joinedTelegram) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, MINIMUM_WAIT_TIME - elapsed);
      const secondsLeft = Math.ceil(remaining / 1000);
      
      setTimeRemaining(secondsLeft);

      if (remaining <= 0) {
        clearInterval(interval);
        setCanUnlock(true);
        setShowCelebration(true);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [joinedTelegram]);

  const handleTelegramClick = () => {
    // Mark as joined first before navigating (in case navigation causes issues)
    setJoinedTelegram(true);
    
    // Use a safer approach for mobile apps/WebViews
    // Create a temporary link element to handle the navigation
    try {
      const link = document.createElement('a');
      link.href = TELEGRAM_GROUP_LINK;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Try to open in new tab/window first
      const newWindow = window.open(TELEGRAM_GROUP_LINK, '_blank', 'noopener,noreferrer');
      
      // If popup was blocked or we're in a WebView, fall back to link click
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Fallback: programmatically click the link
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      // Final fallback: direct navigation (will navigate current page in worst case)
      // This ensures the user can always access the Telegram group
      window.location.href = TELEGRAM_GROUP_LINK;
    }
  };

  return (
    <div className="register-container bg-black flex flex-col items-center justify-center relative px-4 py-6 md:p-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
      <GlobalStyles />
      {/* Blue shimmer background - left to right */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 shimmer-ltr opacity-30" />
      </div>
      
      {/* Content wrapper */}
      <div className="w-full max-w-xs flex flex-col items-center justify-center gap-5" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 md:w-96 h-72 md:h-96 rounded-full blur-[60px] pointer-events-none", isXM ? "bg-red-500/10" : "bg-white/10")} />
        
        {/* Progress indicator - Almost there! */}
        <div className="relative z-10 flex items-center gap-2 mb-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255, 255, 255,0.8),0_0_16px_rgba(255, 255, 255,0.5)]" />
            <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255, 255, 255,0.8),0_0_16px_rgba(255, 255, 255,0.5)]" />
            <div className={cn("w-2.5 h-2.5 rounded-full transition-all duration-500", 
              joinedTelegram 
                ? "bg-white shadow-[0_0_8px_rgba(255, 255, 255,0.8),0_0_16px_rgba(255, 255, 255,0.5)]" 
                : "bg-white/50 animate-pulse shadow-[0_0_6px_rgba(255, 255, 255,0.4)]"
            )} />
          </div>
          <span className="text-xs text-white/80 font-medium neon-text">Final Step!</span>
        </div>

        {/* Main heading */}
        <div className="text-center relative z-10 space-y-1">
          <h2 className={cn("text-xl md:text-2xl font-bold shimmer-text neon-text-pulse", isXM ? "neon-red-text" : "text-white")}>
            You're Almost In!
          </h2>
          <p className="text-white/70 text-sm md:text-base neon-text">
            One tap unlocks <span className="text-white font-semibold">everything</span> completely FREE
          </p>
        </div>
        
        {/* Benefits grid → swaps to broker setup info after joining Telegram */}
        <div className="relative z-10 w-full bg-neutral-900/60 backdrop-blur-sm rounded-xl border border-white/40 p-4 space-y-3 neon-container">
          {canUnlock ? (
            <>
              <div className="flex items-center gap-2 text-center justify-center">
                <Sparkles className="w-4 h-4 text-white neon-icon" />
                <span className="text-xs md:text-sm font-semibold text-white neon-text">Broker Setup</span>
              </div>
              {isInAppBrowser && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-500/20 border border-amber-400/40 px-3 py-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <p className="text-[10px] leading-relaxed text-amber-200">
                    You're in an in-app browser. Copy the links below and open them in <span className="font-bold text-white">Chrome</span> or <span className="font-bold text-white">Safari</span> to sign up.
                  </p>
                </div>
              )}
              <p className="text-[11px] leading-relaxed text-white/80 text-center">
                {isInAppBrowser ? (
                  <>Copy each broker link & code below, then open them in your <span className="font-semibold text-white">real browser</span> (Chrome/Safari) to sign up. Click <span className="font-semibold text-white">"Enter Bull Money"</span> when done.</>
                ) : (
                  <>When you click <span className="font-semibold text-white">"Enter Bull Money"</span>, your broker accounts will open in background tabs. This gets everyone set up with MT5 accounts (demo or real) so trading is easy and ready to go.</>
                )}
              </p>
              <div className="space-y-1.5">
                {/* XM */}
                <div className="rounded-lg bg-white/10 border border-white/20 px-3 py-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/70">XM Partner Code</span>
                    <span className="text-xs font-bold text-white neon-text">X3R7P</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => handleCopy('X3R7P', 'xm-code')} className={cn("flex-1 flex items-center justify-center gap-1 rounded-md border border-white/15 py-1 transition-all", copiedItem === 'xm-code' ? 'bg-green-500/30' : 'bg-white/10 hover:bg-white/20')}>
                      {copiedItem === 'xm-code' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-white/70" />}
                      <span className="text-[10px] text-white/70">{copiedItem === 'xm-code' ? 'Copied!' : 'Copy Code'}</span>
                    </button>
                    <button onClick={() => handleCopy('https://affs.click/t5wni', 'xm-link')} className={cn("flex-1 flex items-center justify-center gap-1 rounded-md border border-white/15 py-1 transition-all", copiedItem === 'xm-link' ? 'bg-green-500/30' : 'bg-white/10 hover:bg-white/20')}>
                      {copiedItem === 'xm-link' ? <Check className="w-3 h-3 text-green-400" /> : <Link2 className="w-3 h-3 text-white/70" />}
                      <span className="text-[10px] text-white/70">{copiedItem === 'xm-link' ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                    <button onClick={() => { if (navigator.share) { navigator.share({ title: 'XM Broker Signup', text: 'Sign up with XM using partner code: X3R7P', url: 'https://affs.click/t5wni' }).catch(() => {}); } else { handleCopy('Sign up with XM using partner code: X3R7P — https://affs.click/t5wni', 'xm-share'); } }} className="flex items-center justify-center rounded-md bg-white/10 hover:bg-white/20 border border-white/15 px-2 py-1 transition-all">
                      {copiedItem === 'xm-share' ? <Check className="w-3 h-3 text-green-400" /> : <Share2 className="w-3 h-3 text-white/70" />}
                    </button>
                  </div>
                </div>
                {/* Vantage */}
                <div className="rounded-lg bg-white/10 border border-white/20 px-3 py-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/70">Vantage Partner Code</span>
                    <span className="text-xs font-bold text-white neon-text">BULLMONEY</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => handleCopy('BULLMONEY', 'v-code')} className={cn("flex-1 flex items-center justify-center gap-1 rounded-md border border-white/15 py-1 transition-all", copiedItem === 'v-code' ? 'bg-green-500/30' : 'bg-white/10 hover:bg-white/20')}>
                      {copiedItem === 'v-code' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-white/70" />}
                      <span className="text-[10px] text-white/70">{copiedItem === 'v-code' ? 'Copied!' : 'Copy Code'}</span>
                    </button>
                    <button onClick={() => handleCopy('https://vigco.co/iQbe2u', 'v-link')} className={cn("flex-1 flex items-center justify-center gap-1 rounded-md border border-white/15 py-1 transition-all", copiedItem === 'v-link' ? 'bg-green-500/30' : 'bg-white/10 hover:bg-white/20')}>
                      {copiedItem === 'v-link' ? <Check className="w-3 h-3 text-green-400" /> : <Link2 className="w-3 h-3 text-white/70" />}
                      <span className="text-[10px] text-white/70">{copiedItem === 'v-link' ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                    <button onClick={() => { if (navigator.share) { navigator.share({ title: 'Vantage Broker Signup', text: 'Sign up with Vantage using partner code: BULLMONEY', url: 'https://vigco.co/iQbe2u' }).catch(() => {}); } else { handleCopy('Sign up with Vantage using partner code: BULLMONEY — https://vigco.co/iQbe2u', 'v-share'); } }} className="flex items-center justify-center rounded-md bg-white/10 hover:bg-white/20 border border-white/15 px-2 py-1 transition-all">
                      {copiedItem === 'v-share' ? <Check className="w-3 h-3 text-green-400" /> : <Share2 className="w-3 h-3 text-white/70" />}
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-white/50 text-center">
                Use these codes when signing up so your trading is linked and ready to go.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-center justify-center">
                <Gift className="w-4 h-4 text-white neon-icon" />
                <span className="text-xs md:text-sm font-semibold text-white neon-text">What You're Unlocking:</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {UNLOCK_BENEFITS.map((benefit, index) => (
                  <div 
                    key={benefit.label}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg bg-white/10/30 border border-white/30 transition-all duration-300 neon-border",
                      joinedTelegram && "border-white/50 bg-white/10 neon-border-strong"
                    )}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <benefit.icon className={cn("w-4 h-4 shrink-0 neon-icon", benefit.color)} />
                    <span className="text-xs text-white font-medium neon-text">{benefit.label}</span>
                    {joinedTelegram && (
                      <Check className="w-3 h-3 text-white ml-auto checkmark-pop neon-icon" />
                    )}
                  </div>
                ))}
              </div>
              
              {/* Website access highlight */}
              <div className={cn(
                "flex items-center justify-center gap-2 p-2.5 rounded-lg border transition-all duration-500",
                joinedTelegram 
                  ? "bg-linear-to-r from-white/20 to-white/20 border-white/60 neon-border-strong" 
                  : "bg-linear-to-r from-white/10 to-white/10 border-white/40 neon-border"
              )}>
                {joinedTelegram ? (
                  <Unlock className="w-4 h-4 text-white neon-icon" />
                ) : (
                  <Lock className="w-4 h-4 text-white animate-pulse neon-icon-pulse" />
                )}
                <span className="text-xs md:text-sm font-bold text-white neon-text">
                  {joinedTelegram ? "Website Access Unlocked!" : "+ Full Website Access"}
                </span>
                {joinedTelegram && <Sparkles className="w-4 h-4 text-white neon-icon" />}
              </div>
            </>
          )}
        </div>
        
        {/* Action area */}
        <div className="flex flex-col gap-4 items-center relative z-10 w-full">
          {/* Telegram button with instruction */}
          <div className="flex flex-col items-center gap-2">
            <span className={cn(
              "text-xs font-medium transition-all text-white neon-text",
              !joinedTelegram && "neon-text-pulse"
            )}>
              {joinedTelegram ? "Telegram Opened" : "Tap to join our free community"}
            </span>
            
            {/* Circle button with Telegram icon - opens group */}
            <button
              onClick={handleTelegramClick}
              disabled={joinedTelegram}
              className={cn(
                "w-20 h-20 md:w-24 md:h-24 rounded-full border-2 flex items-center justify-center transition-all group cursor-target", 
                joinedTelegram 
                  ? "border-white bg-white/20 shadow-[0_0_20px_rgba(0,200,255,0.8),0_0_40px_rgba(0,200,255,0.6),0_0_60px_rgba(0,200,255,0.4),0_0_80px_rgba(0,200,255,0.2)] celebrate-pulse" 
                  : "border-white bg-linear-to-br from-white/30 to-white/30 shadow-[0_0_20px_rgba(0,200,255,0.7),0_0_40px_rgba(0,200,255,0.5),0_0_60px_rgba(0,200,255,0.3),0_0_80px_rgba(0,200,255,0.15)] hover:shadow-[0_0_30px_rgba(0,200,255,0.9),0_0_60px_rgba(0,200,255,0.7),0_0_90px_rgba(0,200,255,0.5),0_0_120px_rgba(0,200,255,0.3)] hover:scale-105 animate-pulse"
              )}
            >
              {joinedTelegram ? (
                <Check className="w-10 h-10 md:w-12 md:h-12 text-white checkmark-pop drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              ) : (
                <Send className="w-10 h-10 md:w-12 md:h-12 text-white group-hover:text-white transition-colors drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
              )}
            </button>
          </div>
          
          {/* Confirmation button */}
          <button
            onClick={() => {
              // Mark telegram as confirmed so it never shows again on reloads
              localStorage.setItem("bullmoney_telegram_confirmed", "true");
              // Auto-copy partner codes
              robustCopy('X3R7P');
              // Only open broker tabs in real browsers — in-app browsers can't handle multiple tabs
              if (!isInAppBrowser) {
                const xmTab = window.open('https://affs.click/t5wni', '_blank');
                try { xmTab?.blur(); window.focus(); } catch {}
                setTimeout(() => {
                  const vTab = window.open('https://vigco.co/iQbe2u', '_blank');
                  try { vTab?.blur(); window.focus(); } catch {}
                }, 600);
              }
              localStorage.setItem('bullmoney_xm_redirect_done', 'true');
              // Unlock and show the real Bull Money home page
              onConfirmationClicked();
              onUnlock();
            }}
            disabled={!canUnlock}
            className={cn(
              "w-full max-w-xs px-6 py-3 md:px-8 md:py-4 border-2 rounded-xl font-bold transition-all text-sm md:text-base", 
              canUnlock 
                ? "border-white text-white shadow-[0_0_15px_rgba(255, 255, 255,0.6),0_0_30px_rgba(255, 255, 255,0.4),0_0_45px_rgba(255, 255, 255,0.2)] hover:shadow-[0_0_20px_rgba(255, 255, 255,0.8),0_0_40px_rgba(255, 255, 255,0.6),0_0_60px_rgba(255, 255, 255,0.4)] cursor-pointer bg-white/20 hover:bg-white/30 celebrate-pulse neon-text" 
                : "border-white/30 text-white/50 cursor-not-allowed shadow-[0_0_8px_rgba(255, 255, 255,0.2)] bg-transparent"
            )}
          >
            {canUnlock ? (
              <span className="flex items-center justify-center gap-2">
                <Unlock className="w-5 h-5 neon-icon" />
                Enter Bull Money
              </span>
            ) : joinedTelegram ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin neon-icon" />
                Unlocking in {timeRemaining}s...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Lock className="w-4 h-4 neon-icon" />
                Join Telegram First
              </span>
            )}
          </button>
          
          {/* Success message */}
          {showCelebration && (
            <p className="text-white text-xs md:text-sm text-center neon-text-pulse">
              Congratulations! You've unlocked full access!
            </p>
          )}
        </div>
        
        {/* Trust indicator */}
        <p className="text-white/60 text-[10px] md:text-xs text-center relative z-10 mt-2 neon-text">
          Join traders already in our community • 100% Free Forever
        </p>
      </div>
    </div>
  );
};
