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

  // --- HELPERS ---
  const isVantage = activeBroker === 'Vantage';
  const brokerCode = isVantage ? "BULLMONEY" : "X3R7P";
  
  const getStepProps = (currentStep: number) => {
    return isVantage ? { number2: currentStep } : { number: currentStep };
  };

  // --- RENDER: LOADING SCREEN ---
  if (loading) {
    return (
      <div className="min-h-[500px] md:min-h-[600px] bg-[#050B14] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-300">
          <div className={cn(
            "w-20 h-20 border-t-2 border-l-2 rounded-full animate-spin mb-8 shadow-[0_0_15px_rgba(59,130,246,0.5)]",
            activeBroker === 'Vantage' && !loadingText.includes("ESTABLISHING") ? "border-purple-500 shadow-purple-500/50" : "border-blue-500 shadow-blue-500/50"
          )}></div>
          <h1 className="text-3xl font-black text-white tracking-tighter mb-2">
            BULLMONEY<span className={cn(
              activeBroker === 'Vantage' && !loadingText.includes("ESTABLISHING") ? "text-purple-500" : "text-blue-500"
            )}>FX</span>
          </h1>
          <p className="text-white/40 font-mono text-sm tracking-widest animate-pulse uppercase">
            {loadingText}
          </p>
        </div>
      </div>
    );
  }

  // --- RENDER: SUCCESS SCREEN ---
  if (step === 5) {
    return (
      <div className="min-h-[500px] md:min-h-[600px] bg-[#050B14] flex items-center justify-center p-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#050B14] to-[#050B14]" />
        
        <div className="bg-[#0A1120] border border-blue-500/30 p-8 rounded-2xl shadow-[0_0_50px_rgba(59,130,246,0.15)] text-center max-w-md w-full relative z-10 animate-in fade-in zoom-in duration-500">
          <div className="mx-auto w-24 h-24 relative mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-900 animate-[spin_3s_linear_infinite]" />
            <div className="absolute inset-0 bg-green-500 rounded-full scale-0 animate-[scale-up_0.5s_ease-out_forwards_0.2s] flex items-center justify-center">
              <Check className="w-12 h-12 text-white stroke-[3] opacity-0 animate-[fade-in_0.3s_ease-out_forwards_0.6s]" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Registration Complete</h2>
          <p className="text-slate-400 mb-8">
            Welcome aboard, <span className="text-blue-400 font-semibold">{formData.email}</span>. 
            <br/>Your MT5 account has been recorded.
          </p>
          <button 
            onClick={onUnlock}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] group flex items-center justify-center"
          >
            ACCESS PLATFORM
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
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
      <div className="min-h-[500px] md:min-h-[600px] bg-[#050B14] flex flex-col items-center justify-center relative">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-white">Verifying Account...</h2>
      </div>
    );
  }

  // --- RENDER: WIZARD ---
  return (
    <div className="min-h-[500px] md:min-h-[600px] bg-[#050B14] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className={cn(
        "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent to-transparent opacity-50 transition-colors duration-500",
        isVantage ? "via-purple-600" : "via-blue-600"
      )} />
      <div className={cn(
        "absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none transition-colors duration-500",
        isVantage ? "bg-purple-600/5" : "bg-blue-600/5"
      )} />

      <div className="w-full max-w-xl relative z-10">
        <div className="mb-8 text-center">
           <h1 className="text-2xl font-black text-white tracking-tight opacity-50">
            BULLMONEY<span className={cn("transition-colors duration-300", isVantage ? "text-purple-600" : "text-blue-600")}>FREE</span>
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
                    "relative px-6 py-2 rounded-full font-semibold transition-all duration-300 z-20",
                    isActive ? "text-white" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                  )}
                >
                  {partner}
                  {isActive && (
                    <motion.span
                      layoutId="tab-pill"
                      className={cn(
                        "absolute inset-0 -z-10 rounded-full",
                        partner === "Vantage"
                          ? "bg-gradient-to-r from-purple-500 to-violet-600 shadow-[0_0_25px_rgba(168,85,247,0.45)]"
                          : "bg-gradient-to-r from-sky-500 to-blue-600 shadow-[0_0_25px_rgba(56,189,248,0.45)]"
                      )}
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
                className={isVantage 
                  ? "bg-gradient-to-br from-purple-950/40 via-slate-950 to-neutral-950"
                  : "bg-gradient-to-br from-sky-950/40 via-slate-950 to-neutral-950"
                }
                actions={
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => copyCode(brokerCode)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ring-1 ring-inset transition",
                        isVantage 
                          ? "text-purple-300 ring-purple-500/40 hover:bg-purple-500/10" 
                          : "text-sky-300 ring-sky-500/40 hover:bg-sky-500/10"
                      )}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? "Copied" : "Copy Code"}
                    </button>

                    <button
                      onClick={handleBrokerClick}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white shadow transition",
                        isVantage
                          ? "bg-gradient-to-r from-purple-500 to-violet-600 hover:from-violet-600 hover:to-fuchsia-700"
                          : "bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
                      )}
                    >
                      <span>Open {activeBroker} Account</span>
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                }
              >
                <p className="text-[15px] leading-relaxed text-neutral-300 mb-4 text-center">
                  To unlock Free Access, open a real account using code <strong className="text-white">{brokerCode}</strong>.
                </p>
                <div className="relative mx-auto w-full max-w-[320px] h-44 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
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
                  <button onClick={handleNext} className="text-xs text-neutral-500 hover:text-white transition-colors underline underline-offset-4">
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
                    disabled={!formData.mt5Number}
                    className={cn(
                      "w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg",
                      !formData.mt5Number ? "opacity-50 cursor-not-allowed bg-slate-800 text-slate-500" :
                      isVantage 
                        ? "bg-white text-purple-950 hover:bg-purple-50"
                        : "bg-white text-blue-950 hover:bg-blue-50"
                    )}
                  >
                    Next Step
                    <ArrowRight className="w-4 h-4" />
                  </button>
                }
              >
                <div className="space-y-4 pt-2">
                  <p className="text-slate-300 text-sm">
                    Enter the MT5 ID you received after signing up with {activeBroker}.
                  </p>
                  <div className="relative group">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-white transition-colors" />
                    <input
                      autoFocus
                      type="text"
                      name="mt5Number"
                      value={formData.mt5Number}
                      onChange={handleChange}
                      placeholder="e.g. 8839201"
                      className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-white/30 focus:bg-black/40 transition-all"
                    />
                  </div>
                </div>
              </StepCard>
              <button onClick={handleBack} className="mt-4 flex items-center text-slate-500 hover:text-slate-300 text-sm mx-auto transition-colors">
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
                    disabled={!formData.email}
                    className={cn(
                      "w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg",
                      !formData.email ? "opacity-50 cursor-not-allowed bg-slate-800 text-slate-500" :
                      isVantage 
                        ? "bg-white text-purple-950 hover:bg-purple-50"
                        : "bg-white text-blue-950 hover:bg-blue-50"
                    )}
                  >
                    Finish Registration
                    <ArrowRight className="w-4 h-4" />
                  </button>
                }
              >
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold mb-1.5 block ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-white transition-colors" />
                      <input
                        autoFocus
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-white/30 focus:bg-black/40 transition-all"
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

              <button onClick={handleBack} className="mt-4 flex items-center text-slate-500 hover:text-slate-300 text-sm mx-auto transition-colors">
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
  const useRed = typeof number2 === "number";
  const n = useRed ? number2 : number;
  return (
    <div className={cn(
      "group relative overflow-hidden rounded-2xl p-6",
      "bg-neutral-900/80 ring-1 ring-white/10 backdrop-blur-md",
      "shadow-[0_1px_1px_rgba(0,0,0,0.05),0_8px_40px_rgba(2,6,23,0.35)]",
      className
    )}>
      <div className={cn(
        "pointer-events-none absolute -top-12 right-0 h-24 w-2/3 bg-gradient-to-l blur-2xl",
        useRed ? "from-purple-500/15 via-violet-500/10 to-transparent" : "from-sky-500/15 via-blue-500/10 to-transparent"
      )} />
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
      <div className="flex items-center justify-between mb-6">
        <span className={cn(
          "inline-flex items-center gap-2 text-[10px] md:text-[11px] uppercase tracking-[0.18em] px-2 py-1 rounded-md ring-1",
          useRed ? "text-purple-300/90 ring-purple-500/30 bg-purple-500/10" : "text-sky-300/90 ring-sky-500/30 bg-sky-500/10"
        )}>
          Step {n}
        </span>
        <span className="relative text-4xl font-black bg-clip-text text-transparent">
          <span className={cn("bg-gradient-to-br bg-clip-text text-transparent",
            useRed ? "from-purple-400 via-violet-500 to-fuchsia-400" : "from-sky-400 via-blue-500 to-indigo-400"
          )}>
            {n}
          </span>
          <span className={cn("pointer-events-none absolute inset-0 -z-10 blur-2xl bg-gradient-to-br",
            useRed ? "from-purple-500/40 via-violet-600/30 to-fuchsia-500/40" : "from-sky-500/40 via-blue-600/30 to-indigo-500/40"
          )} />
        </span>
      </div>
      <h3 className="text-2xl font-extrabold text-white mb-4">{title}</h3>
      <div className="flex-1">{children}</div>
      {actions && <div className="mt-8 pt-6 border-t border-white/10">{actions}</div>}
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
      <motion.div className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-700 opacity-0 group-hover/card:opacity-100 backdrop-blur-xl transition duration-500" style={style} />
      <motion.div className="absolute inset-0 opacity-0 mix-blend-overlay group-hover/card:opacity-100" style={style}>
        <p className="absolute inset-x-0 p-2 text-[10px] leading-4 h-full whitespace-pre-wrap break-words text-white font-mono font-bold transition duration-500">{randomString}</p>
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
      <motion.div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-violet-600 opacity-0 group-hover/card:opacity-100 backdrop-blur-xl transition duration-500" style={style} />
      <motion.div className="absolute inset-0 opacity-0 mix-blend-overlay group-hover/card:opacity-100" style={style}>
        <p className="absolute inset-x-0 p-2 text-[10px] leading-4 h-full whitespace-pre-wrap break-words text-violet-100/90 font-mono font-bold transition duration-500">{randomString}</p>
      </motion.div>
    </div>
  );
}