"use client";

import React, { useEffect, useRef, useState, forwardRef } from 'react';
import {
  Activity, Lock, AlertTriangle,
  CheckCircle2, ShieldAlert, Terminal, Database, Server,
  Users, Key, Eye, EyeOff
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- 1. SETUP ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN;

const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

interface AdminPanelProps {
  className?: string;
  style?: React.CSSProperties;
}

const AdminReflectiveCard = forwardRef<HTMLDivElement, AdminPanelProps>(({
  className = '',
  style = {},
}, ref) => {
  const turbulenceRef = useRef<SVGFETurbulenceElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  
  // States: AUTH_CHECK -> PIN_ENTRY -> DASHBOARD -> ACCESS_DENIED
  const [status, setStatus] = useState<'AUTH_CHECK' | 'PIN_ENTRY' | 'DASHBOARD' | 'ACCESS_DENIED'>('AUTH_CHECK');
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [scanProgress, setScanProgress] = useState(0);

  // Animation Loop
  const animateLiquid = () => {
    if (turbulenceRef.current) {
      const time = Date.now() / 3000;
      const val = 0.02 + Math.sin(time) * 0.03; 
      turbulenceRef.current.setAttribute('baseFrequency', `${val} ${val}`);
    }
    requestRef.current = requestAnimationFrame(animateLiquid);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animateLiquid);
    verifyAdminIdentity();
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // --- 2. SECURITY CHECK ---
  const verifyAdminIdentity = async () => {
    if (!supabase) return;

    // 1. Check Session
    const { data: { user } } = await supabase.auth.getUser();
    
    // Logic: If no user, or user email doesn't match admin email
    if (!user || user.email !== ADMIN_EMAIL) {
      // Allow manual override for testing if local storage exists (Optional)
      const localSession = typeof window !== 'undefined' ? localStorage.getItem("bullmoney_session") : null;
      if (localSession) {
        const parsed = JSON.parse(localSession);
        if (parsed.email === ADMIN_EMAIL) {
          setAdminUser(parsed);
          setStatus('PIN_ENTRY');
          return;
        }
      }
      setStatus('ACCESS_DENIED');
    } else {
      setAdminUser(user);
      setStatus('PIN_ENTRY');
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      startAdminScan();
    } else {
      alert("INVALID PIN. INCIDENT LOGGED.");
      setPinInput('');
    }
  };

  const startAdminScan = () => {
    setStatus('PIN_ENTRY'); // Visual state
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setStatus('DASHBOARD');
      }
    }, 20);
  };

  // --- RENDER HELPERS ---
  const activeColor = 
    status === 'ACCESS_DENIED' ? '#ff003c' : 
    status === 'DASHBOARD' ? '#00ff9d' : '#2997FF';

  return (
    <div className={`relative ${className}`} style={style} ref={ref}>
      <style jsx>{`
        .admin-card {
          position: relative; width: 95vw; max-width: 450px; height: 650px;
          border-radius: 20px; overflow: hidden; background: #000;
          box-shadow: 0 0 0 1px ${activeColor}33, 0 0 40px ${activeColor}1A;
          font-family: 'Courier New', monospace; transition: all 0.5s ease;
        }
        .noise-overlay {
          position: absolute; inset: 0; opacity: 0.05; pointer-events: none; z-index: 10;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
        .scan-line {
          position: absolute; width: 100%; height: 2px; background: ${activeColor};
          box-shadow: 0 0 10px ${activeColor}; z-index: 5;
          animation: scan 2s linear infinite; opacity: 0.5;
        }
        @keyframes scan { 0% { top: 0% } 100% { top: 100% } }
        
        .admin-input {
          background: rgba(255,255,255,0.05); border: 1px solid ${activeColor}44;
          color: ${activeColor}; font-family: 'Courier New', monospace;
          padding: 12px; width: 100%; outline: none; text-align: center;
          letter-spacing: 4px; font-weight: bold; border-radius: 8px;
        }
        .admin-input:focus { border-color: ${activeColor}; box-shadow: 0 0 15px ${activeColor}33; }
        
        .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px; }
        .stat-box {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);
          padding: 10px; display: flex; flex-direction: column; gap: 5px;
        }
        .stat-label { font-size: 9px; color: rgba(255,255,255,0.5); }
        .stat-val { font-size: 14px; font-weight: bold; color: white; }
      `}</style>

      {/* SVG Filter for background effects */}
      <svg className="absolute w-0 h-0">
        <defs>
          <filter id="liquid-distortion">
            <feTurbulence ref={turbulenceRef} type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="warp" />
            <feDisplacementMap xChannelSelector="R" yChannelSelector="G" scale="35" in="SourceGraphic" in2="warp" />
          </filter>
        </defs>
      </svg>

      <div className="admin-card">
        <div className="noise-overlay" />
        {status !== 'DASHBOARD' && <div className="scan-line" />}

        <div className="relative z-20 h-full flex flex-col p-6 text-white">
          
          {/* HEADER */}
          <div className="flex justify-between items-start border-b border-white/10 pb-4 mb-6">
            <div>
              <h1 className="text-xl font-bold tracking-tighter flex items-center gap-2">
                <ShieldAlert size={20} color={activeColor} />
                ADMIN PANEL
              </h1>
              <p className="text-[10px] opacity-50 tracking-widest mt-1">BULLMONEY SECURE SYSTEM</p>
            </div>
            <div className={`px-2 py-1 text-[9px] border rounded ${status === 'DASHBOARD' ? 'border-[#00ff9d] text-[#00ff9d]' : 'border-red-500 text-red-500'}`}>
              {status === 'DASHBOARD' ? 'UNLOCKED' : 'LOCKED'}
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <div>
              
              {/* STATE: ACCESS DENIED */}
              {status === 'ACCESS_DENIED' && (
                <div
                  className="text-center space-y-4"
                >
                  <AlertTriangle size={64} className="text-[#ff003c] mx-auto animate-pulse" />
                  <h2 className="text-2xl font-bold text-[#ff003c]">ACCESS DENIED</h2>
                  <p className="text-xs text-white/50">
                    Your identity ({adminUser?.email || 'UNKNOWN'}) is not authorized for this terminal.
                  </p>
                  <div className="mt-8 p-3 bg-[#ff003c]/10 border border-[#ff003c]/30 rounded text-[10px]">
                    INCIDENT REPORTED TO ADMIN
                  </div>
                </div>
              )}

              {/* STATE: PIN ENTRY */}
              {status === 'PIN_ENTRY' && scanProgress === 0 && (
                <div
                  className="w-full max-w-xs mx-auto text-center"
                >
                  <Lock size={48} className="text-[#2997FF] mx-auto mb-6" />
                  <p className="text-xs mb-4 text-[#2997FF]">AUTHENTICATED: {adminUser?.email}</p>
                  
                  <form onSubmit={handlePinSubmit} className="space-y-4">
                    <div className="relative">
                      <input 
                        type={showPin ? "text" : "password"}
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value)}
                        placeholder="ENTER ADMIN PIN"
                        className="admin-input"
                        autoFocus
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                      >
                        {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    
                    <button 
                      type="submit"
                      className="w-full py-3 bg-[#2997FF] hover:bg-white hover:text-black text-white font-bold text-xs tracking-widest rounded transition-colors"
                    >
                      DECRYPT DATA
                    </button>
                  </form>
                </div>
              )}

              {/* STATE: LOADING DASHBOARD */}
              {scanProgress > 0 && scanProgress < 100 && (
                <div className="text-center w-full">
                  <Activity size={48} className="text-[#00ff9d] mx-auto mb-4" />
                  <p className="text-xs tracking-widest text-[#00ff9d] mb-2">DECRYPTING DATABASE...</p>
                  <div className="w-full h-1 bg-white/10 rounded overflow-hidden">
                    <div className="h-full bg-[#00ff9d]" style={{ width: `${scanProgress}%` }} />
                  </div>
                </div>
              )}

              {/* STATE: ADMIN DASHBOARD */}
              {status === 'DASHBOARD' && (
                <div
                  className="h-full overflow-y-auto pb-10"
                >
                  {/* Server Status */}
                  <div className="bg-[#00ff9d]/5 border border-[#00ff9d]/20 p-3 rounded mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] text-[#00ff9d]">SYSTEM STATUS</span>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-[#00ff9d] rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold">ONLINE</span>
                      </div>
                    </div>
                    <div className="flex gap-4 text-[10px] text-white/60">
                      <span className="flex items-center gap-1"><Database size={10} /> DB: CONNECTED</span>
                      <span className="flex items-center gap-1"><Server size={10} /> SMTP: READY</span>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <h3 className="text-[10px] font-bold text-white/40 mb-2 uppercase">Command Center</h3>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <button className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded flex flex-col items-center gap-2 transition-colors">
                      <Users size={16} className="text-[#2997FF]" />
                      <span className="text-[9px]">MANAGE USERS</span>
                    </button>
                    <button className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded flex flex-col items-center gap-2 transition-colors">
                      <Terminal size={16} className="text-yellow-400" />
                      <span className="text-[9px]">VIEW LOGS</span>
                    </button>
                  </div>

                  {/* Environment Config View (Safe display) */}
                  <h3 className="text-[10px] font-bold text-white/40 mb-2 uppercase">Configuration</h3>
                  <div className="space-y-2">
                    <div className="bg-black/40 p-2 rounded border border-white/10 flex justify-between items-center">
                      <span className="text-[9px] text-white/50">SUPABASE URL</span>
                      <CheckCircle2 size={10} className="text-[#00ff9d]" />
                    </div>
                    <div className="bg-black/40 p-2 rounded border border-white/10 flex justify-between items-center">
                      <span className="text-[9px] text-white/50">SMTP RELAY</span>
                      <CheckCircle2 size={10} className="text-[#00ff9d]" />
                    </div>
                    <div className="bg-black/40 p-2 rounded border border-white/10 flex justify-between items-center">
                      <span className="text-[9px] text-white/50">MONGODB CLUSTER</span>
                      <CheckCircle2 size={10} className="text-[#00ff9d]" />
                    </div>
                  </div>

                  {/* Footer Stats */}
                  <div className="stat-grid">
                    <div className="stat-box">
                        <span className="stat-label">TOTAL USERS</span>
                        <span className="stat-val">1,240</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-label">PENDING KYC</span>
                        <span className="stat-val text-yellow-400">43</span>
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>

          {/* FOOTER */}
          <div className="border-t border-white/10 pt-3 flex justify-between items-center">
            <div className="flex items-center gap-2 text-[9px] text-white/30">
              <Key size={10} />
              <span>ENCRYPTED CONNECTION</span>
            </div>
            <div className="text-[9px] text-white/30">v2.0.4-ADMIN</div>
          </div>

        </div>
      </div>
    </div>
  );
});

AdminReflectiveCard.displayName = "AdminReflectiveCard";
export default AdminReflectiveCard;