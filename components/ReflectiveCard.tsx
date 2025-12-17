"use client";

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Activity, Radio, Zap, ScanFace, UserX, AlertTriangle, CheckCircle2, ShieldCheck, Info, X, Globe, Scale } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

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
  name: string;
  id: string;
  clearance: string;
  email?: string;
  mt5?: string;
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
  const requestRef = useRef<number>();
  
  const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'VERIFIED' | 'ERROR' | 'UNAUTHORIZED'>('IDLE');
  const [scanProgress, setScanProgress] = useState(0);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [showManualModal, setShowManualModal] = useState(false);

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

      // Fallback ID if none found (prevents crash, but upload will fail without valid ID)
      const finalId = dbUser?.id || userId;
      if (!finalId) return null;

      const displayEmail = userEmail || dbUser?.email || "UNKNOWN";
      const displayName = displayEmail.split('@')[0].toUpperCase(); 

      return {
        name: displayName,
        id: finalId, 
        clearance: dbUser?.status === 'Active' ? 'LEVEL 1' : 'LEVEL 0',
        email: displayEmail,
        mt5: dbUser?.mt5_id || "N/A"
      };

    } catch (e) {
      console.error("Fetch Error:", e);
      return null;
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
            setUploadStatus('CAPTURE FAILED');
            return;
        }

        const fileName = `${userId}_${Date.now()}.jpg`;

        // 1. UPLOAD
        const { error: uploadError } = await supabase.storage
          .from('face-scans')
          .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });

        if (uploadError) {
            console.error("Supabase Storage Error:", uploadError.message);
            setUploadStatus('UPLOAD ERR');
            return;
        }

        // 2. GET URL
        const { data: { publicUrl } } = supabase.storage
          .from('face-scans')
          .getPublicUrl(fileName);

        // 3. UPDATE DB
        const { error: dbError } = await supabase
          .from('recruits')
          .update({ image_url: publicUrl })
          .eq('id', userId);

        if (dbError) {
             console.error("DB Update Error:", dbError.message);
             setUploadStatus('DB ERROR');
        } else {
             setUploadStatus('ARCHIVED');
        }

      }, 'image/jpeg', 0.8);
      
    } catch (e: any) {
      console.error("Snapshot Exception:", e.message);
      setUploadStatus('FAILED');
    }
  };

  // --- CAMERA LOGIC ---
  const startWebcam = async () => {
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
                // Auto-save logic
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
      console.error('Camera Access Denied:', err);
      setStatus('ERROR');
    }
  };

  useImperativeHandle(ref, () => ({
    triggerVerify: startWebcam
  }));

  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const activeColor = 
    status === 'UNAUTHORIZED' || status === 'ERROR' ? '#ff003c' : 
    status === 'VERIFIED' ? '#2997FF' : color;

  return (
    <div className={`relative ${className}`} style={style}>
      <style jsx>{`
        .reflective-card-container {
          position: relative;
          width: 90vw;
          max-width: 400px;
          height: 520px;
          border-radius: 20px;
          overflow: hidden;
          background: #020617;
          box-shadow: 0 0 0 1px rgba(41, 151, 255, 0.2), 0 0 30px rgba(41, 151, 255, 0.1);
          font-family: 'Courier New', monospace;
          transition: all 0.5s ease;
          transform: translateZ(0);
        }
        .video-layer { position: absolute; inset: 0; z-index: 0; background: #02040a; }
        .cam-feed {
          width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); opacity: 0;
          transition: opacity 0.8s ease;
          filter: url(#liquid-distortion) grayscale(100%) contrast(1.1) brightness(0.9) sepia(20%) hue-rotate(180deg);
        }
        .cam-feed.active { opacity: 0.7; }
        .content-layer {
          position: relative; z-index: 2; height: 100%; display: flex; flex-direction: column;
          justify-content: space-between; padding: 24px;
          background: linear-gradient(180deg, rgba(0, 10, 30, 0.6) 0%, rgba(0,0,0,0.1) 40%, rgba(0, 10, 30, 0.8) 100%);
          color: white;
        }
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
        .glitch-name {
          font-size: 24px; font-weight: 800; text-shadow: 2px 0 rgba(41, 151, 255, 0.5), -2px 0 rgba(255, 0, 100, 0.5);
          text-transform: uppercase; line-height: 1.2; letter-spacing: -1px;
        }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; background: ${activeColor}; box-shadow: 0 0 8px ${activeColor}; }
        .bm-badge {
            font-size: 9px; letter-spacing: 2px; background: rgba(41, 151, 255, 0.1);
            border: 1px solid rgba(41, 151, 255, 0.3); padding: 4px 8px; border-radius: 4px; color: #2997FF; font-weight: bold;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(41,151,255,0.3); border-radius: 4px; }
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
        <div className="video-layer">
          <video ref={videoRef} playsInline muted autoPlay className={`cam-feed ${status !== 'IDLE' ? 'active' : ''}`} />
        </div>

        {status === 'SCANNING' && ( <><div className="scan-laser-bar" /><div className="scan-grid-overlay" /></> )}

        <div className="content-layer" style={{ backdropFilter: `blur(${status === 'VERIFIED' ? 2 : blurStrength}px)` }}>
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
                <span className="bm-badge">BULLMONEY ID</span>
                <div className="flex items-center gap-2 text-[9px] tracking-[1px] text-white/50 mt-1">
                    <div className="status-dot" />
                    <span>{status === 'IDLE' ? 'SYSTEM IDLE' : status === 'SCANNING' ? 'SCANNING FACE...' : status === 'VERIFIED' ? 'ACCESS GRANTED' : status === 'UNAUTHORIZED' ? 'RESTRICTED' : 'OFFLINE'}</span>
                </div>
            </div>
            <Radio size={16} className={`text-[#2997FF]/50 ${status === 'SCANNING' ? 'animate-pulse' : ''}`} />
          </div>

          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <AnimatePresence mode='wait'>
                {status === 'IDLE' && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex flex-col items-center gap-2">
                    <ShieldCheck size={40} className="text-[#2997FF]/20" strokeWidth={1} />
                    <p className="font-mono text-[9px] tracking-widest text-[#2997FF]/40">SECURE TERMINAL</p>
                </motion.div>
                )}
                {status === 'SCANNING' && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="relative flex items-center justify-center">
                    <ScanFace size={64} className="text-[#2997FF]/80 animate-pulse" strokeWidth={1} />
                    <div className="absolute font-mono font-bold text-2xl text-white mt-32">{Math.floor(scanProgress)}%</div>
                </motion.div>
                )}
                {status === 'VERIFIED' && userData && (
                <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="w-full">
                    <CheckCircle2 size={32} className="text-[#2997FF] mx-auto mb-4" />
                    <h2 className="glitch-name mb-1">{userData.name}</h2>
                    <p className="text-[10px] text-white/50 mb-4 tracking-widest">{userData.email}</p>
                    <div className="grid grid-cols-2 gap-2 border-t border-[#2997FF]/20 pt-4 font-mono text-[10px] text-white/60">
                        <div className="text-left"><span className="block text-[#2997FF]/50">CLEARANCE</span><span className="text-white font-bold">{userData.clearance}</span></div>
                        <div className="text-right"><span className="block text-[#2997FF]/50">MT5 ID</span><span className="text-white font-bold">{userData.mt5}</span></div>
                    </div>
                </motion.div>
                )}
                {status === 'UNAUTHORIZED' && (<motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="text-[#ff003c]"><UserX size={48} className="mx-auto mb-2" /><h2 className="glitch-name">UNKNOWN USER</h2><p className="font-mono text-[10px] mt-2 tracking-widest opacity-80">NO VALID SESSION</p></motion.div>)}
                {status === 'ERROR' && (<motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="text-[#ff003c]"><AlertTriangle size={48} className="mx-auto mb-2" /><p className="font-mono text-[10px] mt-2 tracking-widest">CAMERA BLOCKED</p></motion.div>)}
            </AnimatePresence>
          </div>

          <div className="flex justify-between items-center border-t border-white/5 pt-3">
            <div className="flex items-center gap-2"><Activity size={14} className="text-[#2997FF]/50" /><span className="font-mono text-[9px] text-white/30">{uploadStatus ? uploadStatus : status === 'VERIFIED' ? 'ENCRYPTED' : 'WAITING...'}</span></div>
            <div style={{ color: activeColor }}>{status === 'VERIFIED' ? <Zap size={18} /> : <Fingerprint size={20} className="opacity-30" />}</div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {(status === 'IDLE' || status === 'UNAUTHORIZED' || status === 'ERROR') && !showManualModal && (
          <motion.div 
             initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
             className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-full flex flex-col items-center gap-3 px-4 z-50"
          >
              <div className="flex w-full gap-3">
                <button onClick={startWebcam} className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#2997FF] text-white rounded-xl font-bold shadow-[0_0_20px_rgba(41,151,255,0.4)] whitespace-nowrap hover:bg-white hover:text-black transition-colors transform active:scale-95">
                  <ScanFace size={18} /> <span>SCAN FACE</span>
                </button>

                <button onClick={() => setShowManualModal(true)} className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white/5 backdrop-blur-md border border-white/10 text-white rounded-xl font-bold whitespace-nowrap hover:bg-white/10 transition-colors transform active:scale-95">
                  <Info size={18} /> <span>MANUAL</span>
                </button>
              </div>

              <div className="flex items-start gap-2 text-[10px] text-white/40 max-w-sm text-center leading-tight mt-1">
                 <ShieldCheck size={12} className="shrink-0 mt-0.5" />
                 <p>Secure identity verification protocol. By proceeding, you agree to the terms below.</p>
              </div>
          </motion.div>
        )}

        {/* --- DISCLAIMER MODAL --- */}
        {showManualModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-[60] bg-[#020617] flex flex-col p-6 rounded-20 overflow-hidden"
            style={{ borderRadius: '20px' }}
          >
             <button 
               onClick={() => setShowManualModal(false)}
               className="absolute top-4 right-4 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-white"
             >
               <X size={20} />
             </button>

             <div className="mt-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#2997FF]/10 flex items-center justify-center mb-4 border border-[#2997FF]/20">
                  <Scale size={24} className="text-[#2997FF]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Manual Verification</h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  You are viewing the manual verification protocol disclaimer.
                </p>
             </div>

             <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                   <h4 className="flex items-center gap-2 text-xs font-bold text-[#2997FF] mb-3">
                     <Globe size={14} /> GLOBAL COMPLIANCE NOTICE
                   </h4>
                   <p className="text-[10px] text-white/50 leading-relaxed text-justify">
                      1. <strong>Strictly Identity Verification:</strong> Facial data captured here is used <em>exclusively</em> to verify that the person currently accessing this account matches the registered user profile. We do not use this data for marketing, surveillance, or 3rd-party training. <br/><br/>
                      
                      2. <strong>One-Time Snapshot:</strong> Unlike continuous surveillance, this system takes a single snapshot at the moment of verification. This snapshot is encrypted and stored in a secure, private bucket for security audit trails only. <br/><br/>

                      3. <strong>Fraud & Liability:</strong> By using this tool, you certify that you are the owner of this account. Attempting to spoof this system using photos, videos, or masks of other individuals is a violation of the Computer Fraud and Abuse Act (CFAA) and similar international cyber-crime laws. We reserve the right to ban accounts and report fraudulent activity to local authorities. <br/><br/>

                      4. <strong>Data Rights:</strong> You retain the right to request deletion of your biometric data at any time by contacting support. This system is designed to be compliant with GDPR (Article 9) and CCPA security exceptions.
                   </p>
                </div>
             </div>

             <button 
               onClick={() => setShowManualModal(false)}
               className="mt-4 w-full py-4 bg-[#2997FF] text-white font-bold rounded-xl text-sm tracking-wide shadow-[0_0_20px_rgba(41,151,255,0.3)] hover:bg-white hover:text-[#020617] transition-colors"
             >
               I UNDERSTAND & AGREE
             </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

ReflectiveCard.displayName = "ReflectiveCard";
export default ReflectiveCard;