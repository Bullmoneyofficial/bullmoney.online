"use client";

import React, { useState, useEffect } from 'react';
import {
  Loader2, Check, Mail, Hash,
  ArrowRight, ChevronLeft, ExternalLink, AlertCircle,
  Copy, Plus
} from 'lucide-react';
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

// Mock Supabase Client
const supabase = {
  from: (table: string) => ({
    insert: async (values: any) => {
      console.log(`[Mock Supabase] Inserting into ${table}:`, values);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { error: null };
    }
  })
};

interface RegisterPageProps {
  onUnlock: () => void;
}

export default function RegisterPage({ onUnlock }: RegisterPageProps) {
  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("ESTABLISHING CONNECTION");
  
  // Steps: 1=Broker, 2=MT5, 3=Email, 4=Submitting, 5=Success
  // WE START AT STEP 1 (Broker) - No "Full Name" step 0
  const [step, setStep] = useState(1);
  const [activeBroker, setActiveBroker] = useState<'Vantage' | 'XM'>('Vantage');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    recruiterName: '', // Auto-filled from URL
    email: '',
    mt5Number: ''
  });

  // --- INITIAL LOAD & URL PARSING ---
  useEffect(() => {
    // 1. Start Loader
    setLoading(true);
    setLoadingText("ESTABLISHING CONNECTION");
    
    // 2. Grab "ref" or "recruit" from URL automatically
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref') || params.get('recruit') || '';
      if (ref) {
        setFormData(prev => ({ ...prev, recruiterName: ref }));
        console.log("Recruiter detected from URL:", ref);
      }
    }

    // 3. Stop Loader after delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // --- HANDLER: BROKER SWITCHING (Triggers Loader) ---
  const handleBrokerSwitch = (newBroker: 'Vantage' | 'XM') => {
    if (activeBroker === newBroker) return;

    setLoading(true);
    setLoadingText(newBroker === 'Vantage' ? "CONNECTING TO VANTAGE SERVER" : "CONNECTING TO XM GLOBAL");

    setTimeout(() => {
      setActiveBroker(newBroker);
      setLoading(false);
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setSubmitError(null);
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1100);
    } catch {}
  };

  const handleBrokerClick = () => {
    const link = activeBroker === 'Vantage'
      ? "https://vigco.co/iQbe2u"
      : "https://affs.click/t5wni";
    window.open(link, '_blank');
  };

  const handleSubmit = async () => {
    setStep(4);
    setSubmitError(null);

    try {
      const insertPayload = {
        email: formData.email,
        mt5_id: formData.mt5Number,
        recruiter_name: formData.recruiterName || 'organic', // Fallback if no URL param
        used_code: true,
      };

      const { error } = await supabase.from("recruits").insert([insertPayload]);
      if (error) throw error;

      setTimeout(() => {
        setStep(5);
      }, 1000);

    } catch (err: any) {
      console.error("Submission Error:", err);
      setSubmitError(err.message || "Connection failed. Please try again.");
      setStep(3);
    }
  };

  const handleReset = () => {
    setFormData(prev => ({ ...prev, email: '', mt5Number: '' }));
    setStep(1);
    setSubmitError(null);
    setLoading(true);
    setLoadingText("RESETTING SESSION");
    setTimeout(() => setLoading(false), 1000);
  };

  // --- HELPERS ---
  const isVantage = activeBroker === 'Vantage';
  const brokerCode = isVantage ? "BULLMONEY" : "X3R7P";
  
  const getStepProps = (currentStep: number) => {
    return isVantage ? { number2: currentStep } : { number: currentStep };
  };

  // --- RENDER: LOADING SCREEN ---
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
        {/* Blue shimmer background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <span className="absolute -inset-full animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#ffffff_50%,#00000000_100%)] opacity-10" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/10 rounded-full blur-[60px] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 border-t-2 border-l-2 rounded-full animate-spin mb-8 shadow-[0_0_15px_rgba(255, 255, 255,0.5)] border-white shadow-white/50"></div>
          <h1 className="text-3xl font-black text-white tracking-tighter mb-2">
            BULLMONEY<span className="text-white">FX</span>
          </h1>
          <p className="text-white/50 font-mono text-sm tracking-widest animate-pulse uppercase">
            {loadingText}
          </p>
        </div>
      </div>
    );
  }

  // --- RENDER: SUCCESS SCREEN ---
  if (step === 5) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative">
        {/* Blue shimmer background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <span className="absolute -inset-full animate-[spin_8s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#ffffff_50%,#00000000_100%)] opacity-10" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-black to-black" />
        
        <div className="bg-black/80 border-2 border-white/40 backdrop-blur-xl p-6 md:p-8 rounded-2xl shadow-[0_0_50px_rgba(255, 255, 255,0.3)] text-center max-w-md w-full relative z-10 animate-in fade-in zoom-in duration-500">
          <div className="mx-auto w-24 h-24 relative mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-white/50 animate-[spin_3s_linear_infinite]" />
            <div className="absolute inset-0 bg-white rounded-full scale-0 animate-[scale-up_0.5s_ease-out_forwards_0.2s] flex items-center justify-center">
              <Check className="w-12 h-12 text-white stroke-[3] opacity-0 animate-[fade-in_0.3s_ease-out_forwards_0.6s]" />
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Registration Complete</h2>
          <p className="text-white/70 mb-8 text-sm md:text-base">
            Welcome aboard, <span className="text-white font-semibold">{formData.email}</span>.
            <br/>Your MT5 account has been recorded.
          </p>
          <button
            onClick={onUnlock}
            className="w-full py-4 bg-black border-2 border-white/60 hover:border-white text-white rounded-xl font-bold tracking-wide transition-all shadow-[0_0_25px_rgba(255, 255, 255,0.4)] hover:shadow-[0_0_35px_rgba(255, 255, 255,0.6)] group flex items-center justify-center relative overflow-hidden"
          >
            {/* Blue shimmer on button */}
            <span className="absolute -inset-full animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#ffffff_50%,#00000000_100%)] opacity-30 z-0" />
            <span className="relative z-10 flex items-center">
              ACCESS PLATFORM
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </div>
        <style jsx global>{`
          @keyframes scale-up { 0% { transform: scale(0); } 80% { transform: scale(1.1); } 100% { transform: scale(1); } }
          @keyframes fade-in { 0% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1); } }
        `}</style>
      </div>
    );
  }

  // --- RENDER: SUBMITTING SCREEN ---
  if (step === 4) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center relative">
        {/* Blue shimmer background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <span className="absolute -inset-full animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#ffffff_50%,#00000000_100%)] opacity-10" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/10 rounded-full blur-[60px] pointer-events-none" />
        <Loader2 className="w-16 h-16 text-white animate-spin mb-4" />
        <h2 className="text-xl font-bold text-white">Verifying Account...</h2>
      </div>
    );
  }

  // --- RENDER: WIZARD ---
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Blue shimmer background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <span className="absolute -inset-full animate-[spin_10s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#ffffff_50%,#00000000_100%)] opacity-5" />
      </div>
      <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-white to-transparent opacity-50" />
      <div className="absolute bottom-0 right-0 w-125 h-125 rounded-full blur-[80px] pointer-events-none bg-white/10" />

      <div className="w-full max-w-xl relative z-10">
        <div className="mb-6 md:mb-8 text-center">
           <h1 className="text-xl md:text-2xl font-black text-white/50 tracking-tight">
            BULLMONEY<span className="text-white">FREE</span>
          </h1>
        </div>

        {/* --- TAB SWITCHER (Always visible on Step 1) --- */}
        {step === 1 && (
          <div className="flex justify-center gap-3 mb-8">
            {(["Vantage", "XM"] as const).map((partner) => {
              const isActive = activeBroker === partner;
              return (
                <button
                  key={partner}
                  onClick={() => handleBrokerSwitch(partner)}
                  className={cn(
                    "relative px-6 py-2 rounded-full font-semibold transition-all duration-300 z-20 text-sm md:text-base",
                    isActive ? "text-white" : "bg-black/60 border-2 border-white/20 text-white/60 hover:border-white/40"
                  )}
                >
                  {partner}
                  {isActive && (
                    <motion.span
                      layoutId="tab-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-black border-2 border-white/60 shadow-[0_0_25px_rgba(255, 255, 255,0.4)]"
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* --- STEP 1: BROKER (Start Here) --- */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StepCard
                {...getStepProps(1)}
                title={`Open Your ${activeBroker} Account`}
                className="bg-black/80"
                actions={
                  <div className="flex flex-col gap-3 md:gap-4">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <button
                        onClick={() => copyCode(brokerCode)}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold ring-2 ring-inset transition w-full justify-center text-white ring-white/40 hover:bg-white/10"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? "Copied" : `Copy Code: ${brokerCode}`}
                      </button>

                      <button
                        onClick={handleBrokerClick}
                        className="w-full py-3.5 rounded-xl font-bold text-white shadow transition flex items-center justify-center gap-2 text-base bg-black border-2 border-white/60 hover:border-white shadow-[0_0_20px_rgba(255, 255, 255,0.3)] hover:shadow-[0_0_30px_rgba(255, 255, 255,0.5)] relative overflow-hidden"
                      >
                        <span className="absolute -inset-full animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#ffffff_50%,#00000000_100%)] opacity-30 z-0" />
                        <span className="relative z-10 flex items-center gap-2">
                          Open {activeBroker} Account
                          <ExternalLink className="h-4 w-4" />
                        </span>
                      </button>
                    </div>
                  </div>
                }
              >
                <p className="text-sm md:text-[15px] leading-relaxed text-white/70 mb-4 text-center">
                  To unlock Free Access, open a real account using code <strong className="text-white">{brokerCode}</strong>.
                </p>
                <div className="relative mx-auto w-full max-w-80 h-44 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                  <IconPlusCorners />
                  <div className="absolute inset-0 p-2">
                    {isVantage ? (
                      <EvervaultCardRed text="BULLMONEY" />
                    ) : (
                      <EvervaultCard text="X3R7P" />
                    )}
                  </div>
                </div>
                <div className="mt-6 flex justify-center">
                  <button onClick={handleNext} className="text-xs text-white/50 hover:text-white transition-colors underline underline-offset-4">
                    I already have an account, skip to verification
                  </button>
                </div>
              </StepCard>
            </motion.div>
          )}

          {/* --- STEP 2: MT5 ID --- */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StepCard
                {...getStepProps(2)}
                title="Verify Account"
                actions={
                  <button
                    onClick={handleNext}
                    disabled={!formData?.mt5Number}
                    className={cn(
                      "w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg text-base relative overflow-hidden",
                      !formData?.mt5Number
                        ? "opacity-50 cursor-not-allowed bg-black/60 border-2 border-white/20 text-white/50"
                        : "bg-black border-2 border-white/60 text-white shadow-[0_0_20px_rgba(255, 255, 255,0.3)] hover:border-white hover:shadow-[0_0_30px_rgba(255, 255, 255,0.5)]"
                    )}
                  >
                    {formData.mt5Number && <span className="absolute -inset-full animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#ffffff_50%,#00000000_100%)] opacity-30 z-0" />}
                    <span className="relative z-10 flex items-center gap-2">
                      Next Step
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </button>
                }
              >
                <div className="space-y-4 pt-2">
                  <p className="text-white/70 text-sm">
                    Enter the MT5 ID you received after signing up with {activeBroker}.
                  </p>
                  <div className="relative group">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5 group-focus-within:text-white transition-colors" />
                    <input
                      autoFocus
                      type="tel"
                      name="mt5Number"
                      value={formData.mt5Number}
                      onChange={handleChange}
                      placeholder="e.g. 8839201"
                      className="w-full bg-black/60 border-2 border-white/30 rounded-lg pl-10 pr-4 py-4 text-white placeholder-blue-300/30 focus:outline-none focus:border-white/60 focus:shadow-[0_0_15px_rgba(255, 255, 255,0.3)] transition-all"
                    />
                  </div>
                </div>
              </StepCard>
              <button onClick={handleBack} className="mt-4 flex items-center text-white/50 hover:text-white text-sm mx-auto transition-colors">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </button>
            </motion.div>
          )}

          {/* --- STEP 3: EMAIL (Final Step) --- */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StepCard
                {...getStepProps(3)}
                title="Final Step"
                actions={
                  <button
                    onClick={handleNext}
                    disabled={!formData?.email}
                    className={cn(
                      "w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg text-base relative overflow-hidden",
                      !formData?.email
                        ? "opacity-50 cursor-not-allowed bg-black/60 border-2 border-white/20 text-white/50"
                        : "bg-black border-2 border-white/60 text-white shadow-[0_0_20px_rgba(255, 255, 255,0.3)] hover:border-white hover:shadow-[0_0_30px_rgba(255, 255, 255,0.5)]"
                    )}
                  >
                    {formData.email && <span className="absolute -inset-full animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#ffffff_50%,#00000000_100%)] opacity-30 z-0" />}
                    <span className="relative z-10 flex items-center gap-2">
                      Finish Registration
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </button>
                }
              >
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-xs text-white/60 uppercase font-bold mb-1.5 block ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5 group-focus-within:text-white transition-colors" />
                      <input
                        autoFocus
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        className="w-full bg-black/60 border-2 border-white/30 rounded-lg pl-10 pr-4 py-3.5 text-white placeholder-blue-300/30 focus:outline-none focus:border-white/60 focus:shadow-[0_0_15px_rgba(255, 255, 255,0.3)] transition-all"
                      />
                    </div>
                  </div>
                  {/* Note: Recruiter name is handled in background */}
                </div>

                {submitError && (
                  <div className="flex items-center gap-2 text-red-400 bg-red-950/20 p-3 rounded-lg border border-red-900/50 mt-4">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">{submitError}</span>
                  </div>
                )}
              </StepCard>

              <button onClick={handleBack} className="mt-4 flex items-center text-white/50 hover:text-white text-sm mx-auto transition-colors">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS (Same as before) ---

function StepCard({ number, number2, title, children, actions, className }: any) {
  const n = typeof number2 === "number" ? number2 : number;
  return (
    <div className={cn(
      "group relative overflow-hidden rounded-2xl p-6 md:p-8",
      "bg-black/80 ring-2 ring-white/30 backdrop-blur-xl",
      "shadow-[0_0_40px_rgba(255, 255, 255,0.2)]",
      className
    )}>
      {/* Blue shimmer overlay */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <span className="absolute -inset-full animate-[spin_8s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#ffffff_50%,#00000000_100%)] opacity-10" />
      </div>
      
      <div className="pointer-events-none absolute -top-12 right-0 h-24 w-2/3 bg-linear-to-l blur-2xl from-white/20 via-white/10 to-transparent" />
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <span className="inline-flex items-center gap-2 text-[10px] md:text-[11px] uppercase tracking-[0.18em] px-2 py-1 rounded-md ring-2 text-white/90 ring-white/30 bg-black/60">
          Step {n} of 3
        </span>
      </div>
      <h3 className="text-xl md:text-2xl font-extrabold text-white mb-4">{title}</h3>
      <div className="flex-1">{children}</div>
      {actions && <div className="mt-6 md:mt-8 pt-6 border-t border-white/20">{actions}</div>}
    </div>
  );
}

function IconPlusCorners() {
  return (
    <>
      <Plus className="absolute h-4 w-4 -top-2 -left-2 text-white/70" />
      <Plus className="absolute h-4 w-4 -bottom-2 -left-2 text-white/70" />
      <Plus className="absolute h-4 w-4 -top-2 -right-2 text-white/70" />
      <Plus className="absolute h-4 w-4 -bottom-2 -right-2 text-white/70" />
    </>
  );
}

const characters = "BULLMONEY";
const generateRandomString = (length: number) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// XM Card
export const EvervaultCard = ({ text }: { text?: string }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [randomString, setRandomString] = useState("");
  useEffect(() => { setRandomString(generateRandomString(1500)); }, []);
  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
    setRandomString(generateRandomString(1500));
  }
  return (
    <div className="w-full h-full flex items-center justify-center bg-transparent" onMouseMove={onMouseMove}>
      <div className="group/card rounded-3xl w-full h-full relative overflow-hidden bg-transparent flex items-center justify-center">
        <CardPattern mouseX={mouseX} mouseY={mouseY} randomString={randomString} />
        <div className="relative z-10">
          <div className="relative h-32 w-32 rounded-full flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-white/10 blur-md" />
            <span className="relative z-20 font-extrabold text-3xl text-white select-none">{text}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

function CardPattern({ mouseX, mouseY, randomString }: any) {
  const maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage as unknown as string };
  return (
    <div className="pointer-events-none absolute inset-0">
      <motion.div className="absolute inset-0 bg-linear-to-r from-white to-white opacity-0 group-hover/card:opacity-100 backdrop-blur-xl transition duration-500" style={style} />
      <motion.div className="absolute inset-0 opacity-0 mix-blend-overlay group-hover/card:opacity-100" style={style}>
        <p className="absolute inset-x-0 p-2 text-[10px] leading-4 h-full whitespace-pre-wrap wrap-break-word text-white/90 font-mono font-bold transition duration-500">{randomString}</p>
      </motion.div>
    </div>
  );
}

// Vantage Card
export const EvervaultCardRed = ({ text }: { text?: string }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [randomString, setRandomString] = useState("");
  useEffect(() => { setRandomString(generateRandomString(1500)); }, []);
  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
    setRandomString(generateRandomString(1500));
  }
  return (
    <div className="w-full h-full flex items-center justify-center bg-transparent" onMouseMove={onMouseMove}>
      <div className="group/card rounded-3xl w-full h-full relative overflow-hidden bg-transparent flex items-center justify-center">
        <CardPatternRed mouseX={mouseX} mouseY={mouseY} randomString={randomString} />
        <div className="relative z-10">
          <div className="relative h-32 w-32 rounded-full flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-white/10 blur-md" />
            <span className="relative z-20 font-extrabold text-3xl text-white select-none">{text}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

function CardPatternRed({ mouseX, mouseY, randomString }: any) {
  const maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage as unknown as string };
  return (
    <div className="pointer-events-none absolute inset-0">
      <motion.div className="absolute inset-0 bg-linear-to-r from-white to-white opacity-0 group-hover/card:opacity-100 backdrop-blur-xl transition duration-500" style={style} />
      <motion.div className="absolute inset-0 opacity-0 mix-blend-overlay group-hover/card:opacity-100" style={style}>
        <p className="absolute inset-x-0 p-2 text-[10px] leading-4 h-full whitespace-pre-wrap wrap-break-word text-white/90 font-mono font-bold transition duration-500">{randomString}</p>
      </motion.div>
    </div>
  );
}
