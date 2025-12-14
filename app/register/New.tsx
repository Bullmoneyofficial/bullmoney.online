"use client";

import React, { useState, useEffect, useCallback, memo } from 'react';
import { createClient } from '@supabase/supabase-js'; 
import { 
  Check, Mail, Hash, Lock, ArrowRight, ChevronLeft, ExternalLink, 
  AlertCircle, Copy, Plus, LogIn, Eye, EyeOff, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils"; 

// --- IMPORTS ---
import {MultiStepLoader} from '@/components/Mainpage/MultiStepLoaderAffiliate';
import SuccessScreen from '@/components/Mainpage/SuccessScreen';

// --- SUPABASE SETUP ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!; 
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- UTILS ---
const loadingStates = [
  { text: "ESTABLISHING CONNECTION" },
  { text: "SYNCING BULLMONEY DATA" },
  { text: "VERIFYING CREDENTIALS" },
  { text: "ENCRYPTING SESSION" },
  { text: "WELCOME TRADER" },
];

const generateRandomString = (length: number) => {
  const chars = "BULLMONEY";
  let result = "";
  for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
};

// --- TYPES ---
interface RegisterPageProps {
  onUnlock: () => void;
}

// --- MAIN COMPONENT ---
export default function RegisterPage({ onUnlock }: RegisterPageProps) {
  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'register' | 'login'>('register');
  const [step, setStep] = useState(1); 
  const [activeBroker, setActiveBroker] = useState<'Vantage' | 'XM'>('Vantage');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
      
  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false); 

  const [formData, setFormData] = useState({ email: '', mt5Number: '', password: '' });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        if (ref) setReferralCode(ref);
    }
  }, []);

  // --- INITIAL SESSION CHECK ---
  useEffect(() => {
    const initSession = async () => {
      setLoading(true);
      const savedSession = localStorage.getItem("bullmoney_session");
      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          const { data } = await supabase.from("recruits").select("id").eq("id", session.id).maybeSingle();
          if (data) {
            setTimeout(() => { setLoading(false); setStep(5); }, 2500); 
            return; 
          } else {
            localStorage.removeItem("bullmoney_session");
          }
        } catch (e) {
          localStorage.removeItem("bullmoney_session");
        }
      }
      setTimeout(() => setLoading(false), 2000);
    };
    initSession();
  }, [onUnlock]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'mt5Number' && !/^\d*$/.test(value)) return;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSubmitError(null);
  };

  const handleNext = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    setSubmitError(null);
    if (step === 1) setStep(2);
    else if (step === 2) {
      if (formData.mt5Number.length < 5) { setSubmitError("Please enter a valid MT5 ID."); return; }
      setStep(3);
    }
    else if (step === 3) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { setSubmitError("Invalid email."); return; }
      if (formData.password.length < 6) { setSubmitError("Password must be 6+ chars."); return; }
      if (!acceptedTerms) { setSubmitError("Accept Terms & Conditions."); return; }
      handleRegisterSubmit();
    }
  };

  const handleRegisterSubmit = async () => {
    setStep(4); // Loading state
    try {
      const { data: existingUser } = await supabase.from("recruits").select("id").eq("email", formData.email).maybeSingle();
      if (existingUser) throw new Error("Email registered. Please Login.");

      let recruitedById = null;
      if (referralCode) {
          const { data: referrer } = await supabase.from("recruits").select("id").eq("affiliate_code", referralCode).maybeSingle();
          if (referrer) recruitedById = referrer.id;
      }

      const { data: newUser, error } = await supabase.from("recruits").insert([{
        email: formData.email, mt5_id: formData.mt5Number, password: formData.password,
        referred_by_code: referralCode || null,
        ...(recruitedById ? { recruited_by: recruitedById } : {})
      }]).select().single();
       
      if (error) throw error;
      if (newUser) {
        localStorage.setItem("bullmoney_session", JSON.stringify({ id: newUser.id, email: formData.email, timestamp: Date.now() }));
      }
      setTimeout(() => setStep(5), 1000);
    } catch (err: any) {
      setSubmitError(err.message || "Error occurred.");
      setStep(3);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.from("recruits").select("id").eq("email", loginEmail).eq("password", loginPassword).maybeSingle();
      if (error || !data) throw new Error("Invalid credentials.");
      
      localStorage.setItem("bullmoney_session", JSON.stringify({ id: data.id, email: loginEmail, timestamp: Date.now() }));
      setTimeout(() => { setLoading(false); setStep(5); }, 1500);
    } catch (err: any) {
      setLoading(false);
      setSubmitError(err.message);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1100);
  };

  const isVantage = activeBroker === 'Vantage';
  const brokerCode = isVantage ? "BULLMONEY" : "X3R7P";
  
  if (loading) return <MultiStepLoader loadingStates={loadingStates} loading={loading} duration={1200} />;
  if (step === 5) return <SuccessScreen onUnlock={onUnlock} />;
  
  if (step === 4) {
    return (
      <div className="min-h-screen bg-[#050B14] flex flex-col items-center justify-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-[60px]" />
        <div className="w-10 h-10 border-t-2 border-l-2 border-blue-500 rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold text-white">Saving Credentials...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050B14] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className={cn("absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent to-transparent opacity-50", isVantage ? "via-purple-600" : "via-blue-600")} />
      <div className={cn("absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none opacity-20", isVantage ? "bg-purple-600" : "bg-blue-600")} />

      <div className="w-full max-w-xl relative z-10">
        <div className="mb-8 text-center">
           <h1 className="text-2xl font-black text-white tracking-tight opacity-50">
            BULLMONEY <span className={cn("transition-colors duration-300", isVantage ? "text-purple-600" : "text-blue-600")}>AFFILIATE</span>
          </h1>
        </div>

        <AnimatePresence mode="wait">
        {viewMode === 'login' ? (
          <motion.div key="login" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full">
             <div className="bg-neutral-900/80 ring-1 ring-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><Lock className="w-32 h-32 text-white" /></div>
                <h2 className="text-2xl font-bold text-white mb-2 relative z-10">Member Login</h2>
                <form onSubmit={handleLoginSubmit} className="space-y-4 relative z-10 mt-6">
                   <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                      <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="Email" className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-4 text-white placeholder-slate-600 focus:border-blue-500/50 outline-none" />
                   </div>
                   <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                      <input type={showPassword ? "text" : "password"} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Password" className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-12 py-4 text-white placeholder-slate-600 focus:border-blue-500/50 outline-none" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                   </div>
                   {submitError && <div className="text-red-400 text-sm bg-red-950/30 p-3 rounded-lg flex gap-2"><AlertCircle className="w-4 h-4" /> {submitError}</div>}
                   <button type="submit" disabled={!loginEmail || !loginPassword} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg disabled:opacity-50">LOGIN</button>
                </form>
                <div className="mt-6 text-center border-t border-white/5 pt-4">
                  <button onClick={() => { setViewMode('register'); setStep(1); }} className="text-sm text-slate-500 hover:text-white">Don't have an account? <span className="underline">Register</span></button>
                </div>
             </div>
          </motion.div>
        ) : (
          <motion.div key="register" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             {/* BROKER SWITCHER */}
             {step === 1 && (
              <div className="flex justify-center gap-3 mb-8">
                {(["Vantage", "XM"] as const).map((partner) => (
                  <button key={partner} onClick={() => setActiveBroker(partner)} className={cn("relative px-6 py-2 rounded-full font-semibold transition-all z-20", activeBroker === partner ? "text-white" : "bg-neutral-800 text-neutral-300")}>
                    {partner}
                    {activeBroker === partner && <motion.span layoutId="tab-pill" className={cn("absolute inset-0 -z-10 rounded-full", partner === "Vantage" ? "bg-gradient-to-r from-purple-500 to-violet-600" : "bg-gradient-to-r from-sky-500 to-blue-600")} />}
                  </button>
                ))}
              </div>
             )}

             <AnimatePresence mode="wait">
               {/* STEP 1 */}
               {step === 1 && (
                 <motion.div key="step1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.3 }}>
                   <StepCard number={1} title={`Open ${activeBroker} Account`} className={isVantage ? "bg-purple-950/10" : "bg-sky-950/10"}>
                     <p className="text-[15px] text-neutral-300 mb-4 text-center">To unlock Free Access, open a real account using code <strong className="text-white">{brokerCode}</strong>.</p>
                     <div className="relative mx-auto w-full max-w-[320px] h-44 rounded-3xl border border-white/10 overflow-hidden shadow-2xl mb-6">
                        <IconPlusCorners />
                        <div className="absolute inset-0 p-2">{isVantage ? <EvervaultCardRed text="BULLMONEY" /> : <EvervaultCard text="X3R7P" />}</div>
                     </div>
                     <div className="flex gap-2 justify-center mb-6">
                        <button onClick={() => copyCode(brokerCode)} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white flex items-center gap-2 hover:bg-white/10">{copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? "Copied" : "Copy Code"}</button>
                        <button onClick={() => window.open(isVantage ? "https://vigco.co/iQbe2u" : "https://affs.click/t5wni", '_blank')} className={cn("px-3 py-2 rounded-lg text-xs text-white flex items-center gap-2", isVantage ? "bg-purple-600" : "bg-blue-600")}>Open Account <ExternalLink className="w-3 h-3" /></button>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <button onClick={handleNext} className="w-full py-3 rounded-full border border-white/20 hover:bg-white/5 text-xs font-bold text-white">NEXT STEP</button>
                        <button onClick={() => setViewMode('login')} className="w-full py-3 rounded-full border border-white/20 hover:bg-white/5 text-xs font-bold text-white flex items-center justify-center gap-1">LOGIN <LogIn className="w-3 h-3" /></button>
                     </div>
                   </StepCard>
                 </motion.div>
               )}

               {/* STEP 2 */}
               {step === 2 && (
                 <motion.div key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.3 }}>
                   <StepCard number={2} title="Verify MT5 ID">
                      <div className="space-y-4 pt-2">
                        <p className="text-slate-300 text-sm flex items-center justify-between">Enter your MT5 ID <HelpCircle className="w-4 h-4" /></p>
                        <div className="relative"><Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" /><input autoFocus type="text" name="mt5Number" value={formData.mt5Number} onChange={handleChange} placeholder="e.g. 8839201" className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-4 text-white outline-none focus:border-white/30" /></div>
                        <button onClick={handleNext} disabled={!formData.mt5Number} className={cn("w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2", formData.mt5Number ? "bg-white text-black" : "bg-slate-800 text-slate-500")}>Next Step <ArrowRight className="w-4 h-4" /></button>
                      </div>
                   </StepCard>
                   <button onClick={() => setStep(1)} className="mt-4 flex items-center text-slate-500 hover:text-white text-sm mx-auto"><ChevronLeft className="w-4 h-4 mr-1" /> Back</button>
                 </motion.div>
               )}

               {/* STEP 3 */}
               {step === 3 && (
                 <motion.div key="step3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.3 }}>
                    <StepCard number={3} title="Create Access">
                       <div className="space-y-4 pt-2">
                          <div><label className="text-xs text-slate-400 font-bold block mb-1">EMAIL</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" /><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 py-3.5 text-white outline-none focus:border-white/30" /></div></div>
                          <div><label className="text-xs text-slate-400 font-bold block mb-1">PASSWORD</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" /><input type={showPassword?"text":"password"} name="password" value={formData.password} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 py-3.5 text-white outline-none focus:border-white/30" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">{showPassword?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button></div></div>
                          <div onClick={() => setAcceptedTerms(!acceptedTerms)} className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-white/5 cursor-pointer">
                              <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", acceptedTerms ? "bg-blue-600 border-blue-600" : "border-slate-500")}>{acceptedTerms && <Check className="w-3.5 h-3.5 text-white" />}</div>
                              <p className="text-xs text-slate-300">I agree to the <span className="text-white font-bold">Terms of Service</span>.</p>
                          </div>
                          {submitError && <div className="text-red-400 text-xs bg-red-950/20 p-2 rounded border border-red-900/50">{submitError}</div>}
                          <button onClick={handleNext} disabled={!formData.email || !formData.password || !acceptedTerms} className={cn("w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2", (!formData.email || !formData.password || !acceptedTerms) ? "bg-slate-800 text-slate-500" : "bg-white text-black")}>Complete Registration <ArrowRight className="w-4 h-4" /></button>
                       </div>
                    </StepCard>
                    <button onClick={() => setStep(2)} className="mt-4 flex items-center text-slate-500 hover:text-white text-sm mx-auto"><ChevronLeft className="w-4 h-4 mr-1" /> Back</button>
                 </motion.div>
               )}
             </AnimatePresence>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---
const StepCard = memo(({ number, title, children, className }: any) => (
  <div className={cn("relative overflow-hidden rounded-2xl p-6 bg-neutral-900/80 ring-1 ring-white/10 backdrop-blur-md shadow-2xl", className)}>
    <div className="flex items-center justify-between mb-6">
      <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded bg-white/5 ring-1 ring-white/10 text-slate-300">Step {number}</span>
      <span className="text-4xl font-black text-white/10">{number}</span>
    </div>
    <h3 className="text-2xl font-extrabold text-white mb-4">{title}</h3>
    <div className="flex-1">{children}</div>
  </div>
));

function IconPlusCorners() {
  return <><Plus className="absolute h-4 w-4 -top-2 -left-2 text-white/70" /><Plus className="absolute h-4 w-4 -bottom-2 -left-2 text-white/70" /><Plus className="absolute h-4 w-4 -top-2 -right-2 text-white/70" /><Plus className="absolute h-4 w-4 -bottom-2 -right-2 text-white/70" /></>;
}

// Simplified Evervault Pattern for Performance
export const EvervaultCard = memo(({ text }: { text?: string }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [str, setStr] = useState("");
  useEffect(() => setStr(generateRandomString(1000)), []);
  const onMouseMove = ({ currentTarget, clientX, clientY }: React.MouseEvent) => {
     const { left, top } = currentTarget.getBoundingClientRect();
     mouseX.set(clientX - left); mouseY.set(clientY - top);
     setStr(generateRandomString(1000));
  }
  return <div className="w-full h-full flex items-center justify-center" onMouseMove={onMouseMove}><div className="group/card w-full h-full relative overflow-hidden flex items-center justify-center"><Pattern mouseX={mouseX} mouseY={mouseY} str={str} color="bg-gradient-to-r from-green-500 to-blue-700" /><span className="relative z-20 font-extrabold text-3xl text-white">{text}</span></div></div>;
});

export const EvervaultCardRed = memo(({ text }: { text?: string }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [str, setStr] = useState("");
  useEffect(() => setStr(generateRandomString(1000)), []);
  const onMouseMove = ({ currentTarget, clientX, clientY }: React.MouseEvent) => {
     const { left, top } = currentTarget.getBoundingClientRect();
     mouseX.set(clientX - left); mouseY.set(clientY - top);
     setStr(generateRandomString(1000));
  }
  return <div className="w-full h-full flex items-center justify-center" onMouseMove={onMouseMove}><div className="group/card w-full h-full relative overflow-hidden flex items-center justify-center"><Pattern mouseX={mouseX} mouseY={mouseY} str={str} color="bg-gradient-to-r from-purple-500 to-violet-600" /><span className="relative z-20 font-extrabold text-3xl text-white">{text}</span></div></div>;
});

function Pattern({ mouseX, mouseY, str, color }: any) {
  const maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage as unknown as string };
  return <div className="pointer-events-none absolute inset-0"><motion.div className={cn("absolute inset-0 opacity-0 group-hover/card:opacity-100 backdrop-blur-xl transition duration-500", color)} style={style} /><motion.div className="absolute inset-0 opacity-0 mix-blend-overlay group-hover/card:opacity-100" style={style}><p className="absolute inset-x-0 p-2 text-[10px] leading-4 h-full break-words text-white font-mono font-bold">{str}</p></motion.div></div>;
}