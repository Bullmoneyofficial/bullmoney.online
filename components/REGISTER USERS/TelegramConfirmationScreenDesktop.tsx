"use client";

import React, { useState, useEffect } from 'react';
import { Send, Loader2, Check, Gift, TrendingUp, Video, Bell, Newspaper, Lock, Unlock, Sparkles } from 'lucide-react';
import { cn } from "@/lib/utils";

const TELEGRAM_GROUP_LINK = "https://t.me/addlist/uswKuwT2JUQ4YWI8";
const MINIMUM_WAIT_TIME = 3000;

// What users unlock by joining
const UNLOCK_BENEFITS = [
  { icon: TrendingUp, label: "Free Trades", color: "text-white" },
  { icon: Video, label: "Live Streams", color: "text-white" },
  { icon: Bell, label: "Real-time Updates", color: "text-white" },
  { icon: Newspaper, label: "Market News", color: "text-white" },
  { icon: Gift, label: "Exclusive Groups", color: "text-white" },
];

interface TelegramConfirmationScreenDesktopProps {
  onUnlock: () => void;
  onConfirmationClicked: () => void;
  isXM: boolean;
  neonIconClass: string;
}

export const TelegramConfirmationScreenDesktop: React.FC<TelegramConfirmationScreenDesktopProps> = ({
  onUnlock,
  onConfirmationClicked,
  isXM,
  neonIconClass,
}) => {
  const [joinedTelegram, setJoinedTelegram] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(MINIMUM_WAIT_TIME / 1000);
  const [canUnlock, setCanUnlock] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

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
    window.open(TELEGRAM_GROUP_LINK, '_blank');
    setJoinedTelegram(true);
  };

  return (
    <>
      <style jsx global>{`
        .desktop-telegram-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100vh;
          background: black;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          z-index: 9999;
        }
        
        .desktop-telegram-content {
          position: relative;
          width: 100%;
          max-width: 320px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding: 16px;
          z-index: 10;
        }
        
        .desktop-telegram-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 400px;
          height: 400px;
          border-radius: 50%;
          filter: blur(60px);
          pointer-events: none;
          z-index: 1;
        }
        
        .desktop-shimmer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.3;
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
          0%, 100% { filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 6px rgba(255, 255, 255, 0.6)); }
          50% { filter: drop-shadow(0 0 6px rgba(255, 255, 255, 1)) drop-shadow(0 0 12px rgba(255, 255, 255, 0.8)); }
        }
        
        @keyframes textGlow {
          0%, 100% { text-shadow: 0 0 4px rgba(255, 255, 255, 0.8), 0 0 8px rgba(255, 255, 255, 0.6), 0 0 12px rgba(255, 255, 255, 0.4); }
          50% { text-shadow: 0 0 6px rgba(255, 255, 255, 1), 0 0 12px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.6); }
        }
        
        .dt-celebrate-pulse { animation: celebrate 0.6s ease-in-out; }
        .dt-float-animation { animation: float 3s ease-in-out infinite; }
        .dt-checkmark-pop { animation: checkmark 0.4s ease-out forwards; }
        .dt-neon-icon { filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 8px rgba(255, 255, 255, 0.7)) drop-shadow(0 0 12px rgba(255, 255, 255, 0.5)); }
        .dt-neon-icon-pulse { animation: neonPulse 2s ease-in-out infinite; }
        .dt-neon-text { text-shadow: 0 0 4px rgba(255, 255, 255, 0.8), 0 0 8px rgba(255, 255, 255, 0.6), 0 0 12px rgba(255, 255, 255, 0.4); }
        .dt-neon-text-pulse { animation: textGlow 2s ease-in-out infinite; }
        .dt-neon-border { box-shadow: 0 0 5px rgba(255, 255, 255, 0.5), 0 0 10px rgba(255, 255, 255, 0.3), 0 0 20px rgba(255, 255, 255, 0.2), inset 0 0 5px rgba(255, 255, 255, 0.1); }
        .dt-neon-border-strong { box-shadow: 0 0 8px rgba(255, 255, 255, 0.7), 0 0 16px rgba(255, 255, 255, 0.5), 0 0 24px rgba(255, 255, 255, 0.3), inset 0 0 8px rgba(255, 255, 255, 0.15); }
        .dt-neon-container { border-color: rgba(255, 255, 255, 0.5); box-shadow: 0 0 10px rgba(255, 255, 255, 0.3), 0 0 20px rgba(255, 255, 255, 0.2), 0 0 30px rgba(255, 255, 255, 0.1), inset 0 0 15px rgba(255, 255, 255, 0.05); }
      `}</style>
      
      <div className="desktop-telegram-container">
        {/* Background glow */}
        <div 
          className="desktop-telegram-glow"
          style={{ background: isXM ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.1)' }}
        />
        
        {/* Shimmer */}
        <div className="desktop-shimmer shimmer-ltr" />
        
        {/* Content */}
        <div className="desktop-telegram-content">
          
          {/* Progress indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffffff', boxShadow: '0 0 8px rgba(255, 255, 255,0.8), 0 0 16px rgba(255, 255, 255,0.5)' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffffff', boxShadow: '0 0 8px rgba(255, 255, 255,0.8), 0 0 16px rgba(255, 255, 255,0.5)' }} />
              <div style={{ 
                width: '10px', 
                height: '10px', 
                borderRadius: '50%', 
                background: joinedTelegram ? '#ffffff' : 'rgba(255, 255, 255,0.5)',
                boxShadow: joinedTelegram ? '0 0 8px rgba(255, 255, 255,0.8), 0 0 16px rgba(255, 255, 255,0.5)' : '0 0 6px rgba(255, 255, 255,0.4)'
              }} />
            </div>
            <span className="dt-neon-text" style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500 }}>Final Step!</span>
          </div>

          {/* Main heading */}
          <div style={{ textAlign: 'center' }}>
            <h2 
              className="dt-neon-text-pulse"
              style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: isXM ? '#ef4444' : '#ffffff',
                marginBottom: '4px'
              }}
            >
              You&apos;re Almost In!
            </h2>
            <p className="dt-neon-text" style={{ fontSize: '14px', color: 'rgba(191, 219, 254, 0.7)' }}>
              One tap unlocks <span style={{ color: '#ffffff', fontWeight: 600 }}>everything</span> completely FREE
            </p>
          </div>
          
          {/* Benefits grid */}
          <div 
            className="dt-neon-container"
            style={{ 
              width: '100%',
              background: 'rgba(23, 23, 23, 0.6)',
              backdropFilter: 'blur(8px)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
              <Gift className="dt-neon-icon" style={{ width: '16px', height: '16px', color: '#ffffff' }} />
              <span className="dt-neon-text" style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>What You&apos;re Unlocking:</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {UNLOCK_BENEFITS.map((benefit) => (
                <div 
                  key={benefit.label}
                  className={joinedTelegram ? 'dt-neon-border-strong' : 'dt-neon-border'}
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px',
                    borderRadius: '8px',
                    background: joinedTelegram ? 'rgba(255, 255, 255, 0.1)' : 'rgba(23, 37, 84, 0.3)',
                    border: `1px solid ${joinedTelegram ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.3)'}`,
                  }}
                >
                  <benefit.icon className="dt-neon-icon" style={{ width: '16px', height: '16px', color: '#ffffff', flexShrink: 0 }} />
                  <span className="dt-neon-text" style={{ fontSize: '12px', color: '#ffffff', fontWeight: 500 }}>{benefit.label}</span>
                  {joinedTelegram && (
                    <Check className="dt-neon-icon dt-checkmark-pop" style={{ width: '12px', height: '12px', color: '#ffffff', marginLeft: 'auto' }} />
                  )}
                </div>
              ))}
            </div>
            
            {/* Website access highlight */}
            <div 
              className={joinedTelegram ? 'dt-neon-border-strong' : 'dt-neon-border'}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: '8px',
                marginTop: '12px',
                background: joinedTelegram 
                  ? 'linear-gradient(to right, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2))'
                  : 'linear-gradient(to right, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1))',
                border: `1px solid ${joinedTelegram ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.4)'}`,
              }}
            >
              {joinedTelegram ? (
                <Unlock className="dt-neon-icon" style={{ width: '16px', height: '16px', color: '#ffffff' }} />
              ) : (
                <Lock className="dt-neon-icon-pulse" style={{ width: '16px', height: '16px', color: '#ffffff' }} />
              )}
              <span className="dt-neon-text" style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff' }}>
                {joinedTelegram ? "Website Access Unlocked!" : "+ Full Website Access"}
              </span>
              {joinedTelegram && <Sparkles className="dt-neon-icon" style={{ width: '16px', height: '16px', color: '#ffffff' }} />}
            </div>
          </div>
          
          {/* Action area */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
            
            {/* Telegram button */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <span 
                className={!joinedTelegram ? 'dt-neon-text-pulse' : 'dt-neon-text'}
                style={{ fontSize: '12px', fontWeight: 500, color: '#ffffff' }}
              >
                {joinedTelegram ? "Telegram Opened" : "Click to join our free community"}
              </span>
              
              <button
                onClick={handleTelegramClick}
                disabled={joinedTelegram}
                className={joinedTelegram ? 'dt-celebrate-pulse' : ''}
                style={{ 
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  border: `2px solid ${joinedTelegram ? '#ffffff' : '#ffffff'}`,
                  background: joinedTelegram ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: joinedTelegram ? 'default' : 'pointer',
                  boxShadow: joinedTelegram 
                    ? '0 0 20px rgba(255, 255, 255,0.8), 0 0 40px rgba(255, 255, 255,0.5), 0 0 60px rgba(255, 255, 255,0.3), inset 0 0 20px rgba(255, 255, 255,0.2)'
                    : '0 0 15px rgba(255, 255, 255,0.7), 0 0 30px rgba(255, 255, 255,0.5), 0 0 45px rgba(255, 255, 255,0.3), inset 0 0 15px rgba(255, 255, 255,0.15)',
                  transition: 'all 0.3s ease',
                }}
              >
                {joinedTelegram ? (
                  <Check className="dt-neon-icon dt-checkmark-pop" style={{ width: '48px', height: '48px', color: '#ffffff' }} />
                ) : (
                  <Send className="dt-neon-icon-pulse" style={{ width: '48px', height: '48px', color: '#ffffff' }} />
                )}
              </button>
            </div>
            
            {/* Confirmation button */}
            <button
              onClick={() => {
                // Mark telegram as confirmed so it never shows again on reloads
                localStorage.setItem("bullmoney_telegram_confirmed", "true");
                onConfirmationClicked();
                onUnlock();
              }}
              disabled={!canUnlock}
              className={canUnlock ? 'dt-neon-text dt-celebrate-pulse' : ''}
              style={{ 
                width: '100%',
                maxWidth: '320px',
                padding: '16px 32px',
                border: `2px solid ${canUnlock ? '#ffffff' : 'rgba(255, 255, 255, 0.3)'}`,
                borderRadius: '12px',
                background: canUnlock ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                color: canUnlock ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: canUnlock ? 'pointer' : 'not-allowed',
                boxShadow: canUnlock 
                  ? '0 0 15px rgba(255, 255, 255,0.6), 0 0 30px rgba(255, 255, 255,0.4), 0 0 45px rgba(255, 255, 255,0.2)'
                  : '0 0 8px rgba(255, 255, 255,0.2)',
                transition: 'all 0.3s ease',
              }}
            >
              {canUnlock ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Unlock className="dt-neon-icon" style={{ width: '20px', height: '20px' }} />
                  Enter Bull Money
                </span>
              ) : joinedTelegram ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Loader2 className="dt-neon-icon" style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                  Unlocking in {timeRemaining}s...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Lock className="dt-neon-icon" style={{ width: '16px', height: '16px' }} />
                  Join Telegram First
                </span>
              )}
            </button>
            
            {/* Success message */}
            {showCelebration && (
              <p className="dt-neon-text-pulse" style={{ fontSize: '14px', color: '#ffffff', textAlign: 'center' }}>
                Congratulations! You&apos;ve unlocked full access!
              </p>
            )}
          </div>
          
          {/* Trust indicator */}
          <p className="dt-neon-text" style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center' }}>
            Join traders already in our community • 100% Free Forever
          </p>
        </div>
      </div>
    </>
  );
};
