"use client";

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Fingerprint, Activity, Radio, ScanFace, UserX, AlertTriangle, 
  CheckCircle2, ShieldCheck, Image as ImageIcon, MoreHorizontal, 
  Wallet, Users, Link as LinkIcon, Lock, Save, AtSign, Mail, ShieldAlert, X
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- IMPORT ADMIN PANEL ---
// Ensure the previous Admin component is saved as 'AdminReflectiveCard.tsx' in the same folder
import AdminReflectiveCard from '@/components/Mainpage/AdminReflectiveCard'

// --- 1. SUPABASE SETUP ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// --- 2. TYPES ---
export interface ReflectiveCardHandle {
  triggerVerify: () => Promise<void>;
}

interface ReflectiveCardProps {
  blurStrength?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  onVerificationComplete?: (userData: UserData | null) => void;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  mt5: string;
  affiliate_code: string;
  referred_by: string;
  social: string;
  status: string;
  balance: string;
  image_url?: string | null;
}

// --- 3. COMPONENT ---
const ReflectiveCard = forwardRef<ReflectiveCardHandle, ReflectiveCardProps>(({
  blurStrength = 8,
  color = '#2997FF', // Cyber Blue
  className = '',
  style = {},
  onVerificationComplete
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const turbulenceRef = useRef<SVGFETurbulenceElement>(null);
  const requestRef = useRef<number | null>(null);
  
  const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'VERIFIED' | 'DASHBOARD' | 'ERROR' | 'UNAUTHORIZED'>('IDLE');
  const [scanProgress, setScanProgress] = useState(0);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isProfileView, setIsProfileView] = useState(false);
  
  // --- ADMIN STATE ---
  const [showAdmin, setShowAdmin] = useState(false);

  // Profile Management State
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS' | 'ERROR'>('IDLE');

  // --- ANIMATION LOOP ---
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
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // --- FETCH IDENTITY ---
  const fetchUserIdentity = async (): Promise<UserData | null> => {
    if (!supabase) return null;

    try {
      const localSession = typeof window !== 'undefined' ? localStorage.getItem("bullmoney_session") : null;
      let userId = null;
      let userEmail = null;

      if (localSession) {
        const parsed = JSON.parse(localSession);
        userId = parsed.id;
        userEmail = parsed.email;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
          userEmail = user.email;
        }
      }

      if (!userId && !userEmail) return null;

      let dbUser = null;
      if (userId) {
        const { data } = await supabase.from('recruits').select('*').eq('id', userId).maybeSingle();
        dbUser = data;
      } 
      if (!dbUser && userEmail) {
         const { data } = await supabase.from('recruits').select('*').eq('email', userEmail).maybeSingle();
         dbUser = data;
      }

      const finalId = dbUser?.id || userId;
      if (!finalId) return null;

      const displayEmail = userEmail || dbUser?.email || "UNKNOWN";
      
      let finalImageUrl = dbUser?.image_url;
      if (finalImageUrl) finalImageUrl = `${finalImageUrl}?t=${new Date().getTime()}`;

      return {
        id: finalId,
        name: displayEmail.split('@')[0].toUpperCase(),
        email: displayEmail,
        mt5: dbUser?.mt5_id || "N/A",
        affiliate_code: dbUser?.affiliate_code || "N/A",
        referred_by: dbUser?.referred_by_code || "None",
        social: dbUser?.social_handle || "N/A",
        status: dbUser?.status || "Pending",
        balance: dbUser?.commission_balance || "0.00",
        image_url: finalImageUrl
      };

    } catch (e) {
      console.error("Fetch Error:", e);
      return null;
    }
  };

  // --- UPDATE PROFILE (EMAIL & PASSWORD) ---
  const handleUpdateProfile = async () => {
    if (!userData || !supabase) return;
    
    // Check if there is anything to update
    if (!editPassword && editEmail === userData.email) return;

    setSaveStatus('SAVING');
    
    try {
      const updates: any = {};
      if (editPassword) updates.password = editPassword;
      if (editEmail && editEmail !== userData.email) updates.email = editEmail;

      const { error } = await supabase
        .from('recruits')
        .update(updates)
        .eq('id', userData.id);

      if (error) throw error;

      // Update local state
      setUserData(prev => prev ? { ...prev, email: editEmail } : null);
      setSaveStatus('SUCCESS');
      
      // Reset after delay
      setTimeout(() => {
        setSaveStatus('IDLE');
        setEditPassword('');
      }, 2000);

    } catch (err) {
      console.error("Profile update failed", err);
      setSaveStatus('ERROR');
    }
  };

  // --- VIEW PROFILE / DASHBOARD ---
  const toggleProfileView = async () => {
    if (isProfileView) {
      setIsProfileView(false);
      setStatus('IDLE');
      setUserData(null);
      setEditPassword('');
      setEditEmail('');
      return;
    }

    setUploadStatus('LOADING...');
    const user = await fetchUserIdentity();
    setUploadStatus('');

    if (user) {
      setUserData(user);
      setEditEmail(user.email); // Pre-fill email
      if (user.image_url) {
        setStatus('DASHBOARD');
        setIsProfileView(true);
      } else {
        setStatus('VERIFIED');
        setIsProfileView(false);
        alert("Account found, but no profile picture. Please Scan Face to upload.");
      }
    } else {
      setStatus('UNAUTHORIZED');
    }
  };

  // --- SNAPSHOT & UPLOAD ---
  const captureAndUploadSnapshot = async (userId: string) => {
    if (!videoRef.current || !canvasRef.current || !supabase) return;

    try {
      setUploadStatus('UPLOADING...');
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(async (blob) => {
        if (!blob) {
            setUploadStatus('FAILED');
            return;
        }
        const fileName = `${userId}_${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('face-scans')
          .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });

        if (uploadError) { setUploadStatus('ERR'); return; }
        
        const { data: { publicUrl } } = supabase.storage.from('face-scans').getPublicUrl(fileName);

        const { error: dbError } = await supabase.from('recruits').update({ image_url: publicUrl }).eq('id', userId);

        if (!dbError) {
             setUploadStatus('SAVED');
             const newUrl = `${publicUrl}?t=${Date.now()}`;
             setUserData(prev => prev ? { ...prev, image_url: newUrl } : null);
        }
      }, 'image/jpeg', 0.8);
      
    } catch (e: any) {
      setUploadStatus('FAILED');
    }
  };

  // --- CAMERA LOGIC ---
  const startWebcam = async () => {
    setIsProfileView(false);
    setStatus('SCANNING');
    setScanProgress(0);
    setUploadStatus('');
    
    const userPromise = fetchUserIdentity();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error("Play error:", e));
          
          let progress = 0;
          const interval = setInterval(async () => {
            progress += 1.5; 
            setScanProgress(progress);

            if (progress >= 100) {
              clearInterval(interval);
              const user = await userPromise;
              if (user && user.id) {
                captureAndUploadSnapshot(user.id);
                setUserData(user);
                setStatus('VERIFIED');
                if (onVerificationComplete) onVerificationComplete(user);
              } else {
                setStatus('UNAUTHORIZED');
              }
            }
          }, 30);
        };
      }
    } catch (err) {
      setStatus('ERROR');
    }
  };

  useImperativeHandle(ref, () => ({ triggerVerify: startWebcam }));

  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // --- ADMIN MODE RENDER ---
  if (showAdmin) {
    return (
      <div className={`relative ${className}`} style={style}>
        {/* Close Admin Button */}
        <button 
          onClick={() => setShowAdmin(false)}
          className="absolute -top-12 right-0 z-50 flex items-center gap-2 px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-bold hover:bg-red-500 hover:text-white transition-colors"
        >
          <X size={14} /> EXIT ADMIN
        </button>
        <AdminReflectiveCard />
      </div>
    );
  }

  // --- STANDARD RENDER ---
  const activeColor = 
    status === 'UNAUTHORIZED' || status === 'ERROR' ? '#ff003c' : 
    status === 'VERIFIED' || status === 'DASHBOARD' ? '#2997FF' : color;

  return (
    <div className={`relative ${className}`} style={style}>
      <style jsx>{`
        .reflective-card-container {
          position: relative;
          width: 95vw;
          max-width: 400px;
          height: 600px;
          border-radius: 20px;
          overflow: hidden;
          background: #000;
          box-shadow: 0 0 0 1px rgba(41, 151, 255, 0.2), 0 0 30px rgba(41, 151, 255, 0.1);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          transition: all 0.5s ease;
          transform: translateZ(0);
        }
        .video-layer { position: absolute; inset: 0; z-index: 0; background: #111; }
        .cam-feed {
          width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); opacity: 0;
          transition: opacity 0.8s ease;
          filter: url(#liquid-distortion) grayscale(100%) contrast(1.1) brightness(0.9) sepia(20%) hue-rotate(180deg);
        }
        .cam-feed.active { opacity: 0.7; }
        
        .content-layer {
          position: relative; z-index: 2; height: 100%; display: flex; flex-direction: column;
          background: linear-gradient(180deg, rgba(0, 10, 30, 0.6) 0%, rgba(0,0,0,0.1) 40%, rgba(0, 10, 30, 0.9) 100%);
          transition: background 0.3s ease;
          color: white;
        }

        .content-layer.insta-mode {
           background: #020617;
           padding: 0;
           justify-content: flex-start;
        }

        .info-scroll::-webkit-scrollbar { width: 4px; }
        .info-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }

        .scan-laser-bar {
          position: absolute; left: 0; right: 0; height: 2px; background: ${activeColor};
          box-shadow: 0 0 15px ${activeColor}, 0 0 30px ${activeColor};
          z-index: 1; pointer-events: none; top: ${scanProgress}%;
        }
        .scan-grid-overlay {
          position: absolute; inset: 0; z-index: 1;
          background-image: linear-gradient(${activeColor}1A 1px, transparent 1px), linear-gradient(90deg, ${activeColor}1A 1px, transparent 1px);
          background-size: 40px 40px; mask-image: linear-gradient(to bottom, black, transparent); pointer-events: none;
        }
        
        .scifi-text { font-family: 'Courier New', monospace; }
        .glitch-name {
          font-size: 24px; font-weight: 800; text-shadow: 2px 0 rgba(41, 151, 255, 0.5), -2px 0 rgba(255, 0, 100, 0.5);
          text-transform: uppercase; line-height: 1.2; letter-spacing: -1px;
        }
        .bm-badge {
            font-size: 9px; letter-spacing: 2px; background: rgba(41, 151, 255, 0.1);
            border: 1px solid rgba(41, 151, 255, 0.3); padding: 4px 8px; border-radius: 4px; color: #2997FF; font-weight: bold;
        }
        .info-row {
            display: flex; justify-content: space-between; align-items: center;
            padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
            font-size: 11px;
        }
        .info-label { color: rgba(255,255,255,0.4); display: flex; items-center: center; gap: 6px; }
        .info-val { font-weight: 600; color: white; text-align: right; }
      `}</style>

      {/* Hidden Canvas for Snapshot */}
      <canvas ref={canvasRef} className="hidden" />

      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <filter id="liquid-distortion">
            <feTurbulence ref={turbulenceRef} type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="warp" />
            <feDisplacementMap xChannelSelector="R" yChannelSelector="G" scale="35" in="SourceGraphic" in2="warp" />
          </filter>
        </defs>
      </svg>

      <div className="reflective-card-container group">
        
        {!isProfileView && (
            <div className="video-layer">
            <video 
                ref={videoRef} 
                playsInline muted autoPlay 
                className={`cam-feed ${status === 'SCANNING' || status === 'VERIFIED' ? 'active' : ''}`} 
            />
            </div>
        )}

        {status === 'SCANNING' && ( <><div className="scan-laser-bar" /><div className="scan-grid-overlay" /></> )}

        <div 
          className={`content-layer ${status === 'DASHBOARD' ? 'insta-mode' : 'p-6 justify-between'}`} 
          style={{ backdropFilter: `blur(${status === 'VERIFIED' || status === 'DASHBOARD' ? 0 : blurStrength}px)` }}
        >
          
          {/* --- A. DASHBOARD MODE (FULL INFO) --- */}
          {status === 'DASHBOARD' && userData && (
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
               className="flex flex-col h-full w-full bg-[#020617] text-white"
             >
                {/* 1. Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#020617] z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2997FF] to-white p-[2px]">
                           <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[10px] font-bold">
                             {userData.name.slice(0,2)}
                           </div>
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold leading-none truncate w-32">{userData.name.toLowerCase()}</p>
                            <p className="text-[10px] text-white/50">BullMoney ID</p>
                        </div>
                    </div>
                    <MoreHorizontal size={20} className="text-white/60" />
                </div>

                {/* 2. Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto info-scroll pb-20">
                    
                    {/* Image Area */}
                    <div className="w-full aspect-square bg-white/5 relative">
                        {userData.image_url ? (
                            <img src={userData.image_url} className="w-full h-full object-cover" alt="User Face Scan" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">NO IMAGE</div>
                        )}
                        <div className={`absolute top-3 right-3 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider backdrop-blur-md ${userData.status === 'Active' ? 'bg-white/20 text-white border border-white/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                            {userData.status}
                        </div>
                    </div>

                    {/* Detailed Info List */}
                    <div className="px-4 py-4 space-y-1">
                        <h3 className="text-xs font-bold text-[#2997FF] mb-3 uppercase tracking-wider">Account Details</h3>
                        
                        <div className="info-row">
                            <span className="info-label"><Activity size={12} /> MT5 ID</span>
                            <span className="info-val">{userData.mt5}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label"><Wallet size={12} /> Commission</span>
                            <span className="info-val text-white">${userData.balance}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label"><LinkIcon size={12} /> Affiliate Code</span>
                            <span className="info-val text-white/80">{userData.affiliate_code}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label"><Users size={12} /> Referred By</span>
                            <span className="info-val text-white/60">{userData.referred_by}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label"><AtSign size={12} /> Social Handle</span>
                            <span className="info-val text-white/60">{userData.social}</span>
                        </div>

                        {/* Profile Management Section (Email & Password) */}
                        <div className="mt-6 pt-4 border-t border-white/10">
                            <h3 className="text-xs font-bold text-white/40 mb-3 uppercase tracking-wider flex items-center gap-2">
                                <Lock size={12} /> Profile Management
                            </h3>
                            
                            <div className="space-y-3">
                                {/* Email Input */}
                                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                                    <Mail size={12} className="text-white/40" />
                                    <input 
                                        type="email" 
                                        placeholder="Update Email" 
                                        value={editEmail}
                                        onChange={(e) => setEditEmail(e.target.value)}
                                        className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/20"
                                    />
                                </div>

                                {/* Password Input & Save Button */}
                                <div className="flex gap-2">
                                    <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                                        <Lock size={12} className="text-white/40" />
                                        <input 
                                            type="text" 
                                            placeholder="New Password" 
                                            value={editPassword}
                                            onChange={(e) => setEditPassword(e.target.value)}
                                            className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/20"
                                        />
                                    </div>
                                    <button 
                                        onClick={handleUpdateProfile}
                                        disabled={saveStatus === 'SAVING' || (!editPassword && editEmail === userData.email)}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                                            saveStatus === 'SUCCESS' ? 'bg-white text-black' : 
                                            saveStatus === 'ERROR' ? 'bg-red-500 text-white' :
                                            'bg-[#2997FF] text-white hover:bg-white hover:text-black'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {saveStatus === 'SAVING' ? <Activity size={14} className="animate-spin" /> : 
                                         saveStatus === 'SUCCESS' ? <CheckCircle2 size={14} /> : 
                                         <Save size={14} />}
                                        <span>{saveStatus === 'SUCCESS' ? 'SAVED' : 'SAVE'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
             </motion.div>
          )}

          {/* --- B. SCANNER MODE (DEFAULT) --- */}
          {status !== 'DASHBOARD' && (
            <>
                <div className="flex justify-between items-start z-20">
                    <div className="flex flex-col gap-1">
                        <span className="bm-badge scifi-text">BULLMONEY ID</span>
                        <div className="flex items-center gap-2 text-[9px] tracking-[1px] text-white/50 mt-1 scifi-text">
                            <div className="status-dot shrink-0" />
                            <span>
                                {status === 'IDLE' ? 'SYSTEM IDLE' : 
                                status === 'SCANNING' ? 'SCANNING...' : 
                                status === 'VERIFIED' ? 'VERIFIED' : 
                                status === 'UNAUTHORIZED' ? 'RESTRICTED' : 'OFFLINE'}
                            </span>
                        </div>
                    </div>
                    <Radio size={16} className={`text-[#2997FF]/50 shrink-0 ${status === 'SCANNING' ? 'animate-pulse' : ''}`} />
                </div>

                <div className="flex-1 flex flex-col justify-center items-center text-center">
                    <AnimatePresence mode='wait'>
                        {status === 'IDLE' && (
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex flex-col items-center gap-2">
                            <ShieldCheck size={40} className="text-[#2997FF]/20" strokeWidth={1} />
                            <p className="scifi-text text-[9px] tracking-widest text-[#2997FF]/40">SECURE TERMINAL</p>
                        </motion.div>
                        )}
                        
                        {status === 'SCANNING' && (
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="relative flex items-center justify-center">
                            <ScanFace size={64} className="text-[#2997FF]/80 animate-pulse" strokeWidth={1} />
                            <div className="absolute scifi-text font-bold text-2xl text-white mt-32">{Math.floor(scanProgress)}%</div>
                        </motion.div>
                        )}
                        
                        {status === 'VERIFIED' && userData && (
                        <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="w-full">
                            <CheckCircle2 size={32} className="text-[#2997FF] mx-auto mb-4" />
                            <h2 className="glitch-name mb-1 truncate text-xl">{userData.name}</h2>
                            <p className="text-[10px] text-white/50 mb-4 tracking-widest truncate">{userData.email}</p>
                            
                            <div className="grid grid-cols-2 gap-4 border-t border-[#2997FF]/20 pt-4 scifi-text text-[10px] text-white/60">
                                <div className="text-left flex flex-col">
                                    <span className="text-[#2997FF]/50 mb-1">STATUS</span>
                                    <span className="text-white font-bold">{userData.status}</span>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <span className="text-[#2997FF]/50 mb-1">MT5 ID</span>
                                    <span className="text-white font-bold">{userData.mt5}</span>
                                </div>
                            </div>
                        </motion.div>
                        )}

                        {status === 'UNAUTHORIZED' && (
                            <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="text-[#ff003c]">
                                <UserX size={48} className="mx-auto mb-2" />
                                <h2 className="glitch-name">UNKNOWN</h2>
                                <p className="scifi-text text-[10px] mt-2 tracking-widest opacity-80">NO VALID SESSION</p>
                            </motion.div>
                        )}
                        
                        {status === 'ERROR' && (
                            <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="text-[#ff003c]">
                                <AlertTriangle size={48} className="mx-auto mb-2" />
                                <p className="scifi-text text-[10px] mt-2 tracking-widest">CAMERA BLOCKED</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex justify-between items-center border-t border-white/5 pt-3">
                    <div className="flex items-center gap-2">
                        <Activity size={14} className="text-[#2997FF]/50" />
                        <span className="scifi-text text-[9px] text-white/30 truncate max-w-[150px]">
                            {uploadStatus || 'WAITING...'}
                        </span>
                    </div>
                    <div style={{ color: activeColor }}>
                        <Fingerprint size={20} className="opacity-30" />
                    </div>
                </div>
            </>
          )}

        </div>
      </div>

      {/* --- BUTTONS --- */}
      <AnimatePresence>
        {(status === 'IDLE' || status === 'UNAUTHORIZED' || status === 'ERROR' || status === 'DASHBOARD') && (
          <motion.div 
             initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
             className="absolute -bottom-20 sm:-bottom-24 left-1/2 -translate-x-1/2 w-full px-2 z-50 max-w-[420px]"
          >
              <div className="flex w-full gap-2">
                <button 
                    onClick={startWebcam} 
                    className="flex-[2] flex items-center justify-center gap-2 px-2 py-3 bg-[#2997FF] text-white rounded-xl font-bold shadow-[0_0_20px_rgba(41,151,255,0.4)] hover:bg-white hover:text-black transition-colors transform active:scale-95 text-xs sm:text-sm"
                >
                  <ScanFace size={16} className="shrink-0" /> 
                  <span className="whitespace-nowrap">{status === 'DASHBOARD' ? 'UPDATE FACE' : 'SCAN FACE'}</span>
                </button>

                <button 
                    onClick={toggleProfileView} 
                    className={`flex-[2] flex items-center justify-center gap-2 px-2 py-3 border rounded-xl font-bold transition-colors transform active:scale-95 text-xs sm:text-sm ${isProfileView ? 'bg-white text-black border-white' : 'bg-white/5 backdrop-blur-md border-white/10 text-white hover:bg-white/10'}`}
                >
                  <ImageIcon size={16} className="shrink-0" /> 
                  <span className="whitespace-nowrap">{isProfileView ? 'CLOSE VIEW' : 'VIEW ACCOUNT'}</span>
                </button>

                {/* NEW ADMIN BUTTON */}
                <button 
                    onClick={() => setShowAdmin(true)} 
                    className="flex-none flex items-center justify-center gap-2 px-3 py-3 border border-red-500/30 bg-red-500/10 rounded-xl font-bold transition-colors transform active:scale-95 text-xs hover:bg-red-500 hover:text-white"
                    title="Admin Access"
                >
                  <ShieldAlert size={16} className="shrink-0 text-red-500/80" /> 
                </button>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-[9px] text-white/40 mt-2 px-2 pb-2">
                 <ShieldCheck size={10} className="shrink-0" />
                 <p className="truncate">Identity verification protocol.</p>
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

ReflectiveCard.displayName = "ReflectiveCard";
export default ReflectiveCard;
