'use client';

import React, { 
  useState, 
  useEffect, 
  useRef, 
  createContext, 
  useContext, 
  ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, QrCode, X, ArrowRight, User, Lock, LogOut, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { gsap } from 'gsap';

// Import the Context Hook
import { useStudio } from '@/context/StudioContext'; 

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- CONFIG ---
const ADMIN_EMAIL = "samaraalexaa18@gmail.com";

// ==========================================
// 1. MODAL ARCHITECTURE (Mobile Optimized)
// ==========================================

interface ModalContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useModal must be used within a ModalProvider');
  return context;
};

export function Modal({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Prevent scrolling when modal is open
    document.body.style.overflow = open ? 'hidden' : 'auto';
  }, [open]);

  return (
    <ModalContext.Provider value={{ open, setOpen }}>
      {children}
    </ModalContext.Provider>
  );
}

export const ModalTrigger = ({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string 
}) => {
  const { setOpen } = useModal();
  return (
    <button
      onClick={() => setOpen(true)}
      className={cn(
        "group relative flex items-center justify-center gap-2 overflow-hidden px-8 py-4 transition-all active:scale-95",
        className
      )}
    >
      {children}
    </button>
  );
};

export const ModalBody = ({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string 
}) => {
  const { open, setOpen } = useModal();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    if (open) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
                className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md cursor-pointer"
            />
            
            {/* Modal Container */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 24, stiffness: 300 }}
                className={cn(
                  "relative w-full max-w-md z-10 pointer-events-none mx-auto",
                  // Mobile Scroll Safety
                  "max-h-[90vh] overflow-y-auto overflow-x-hidden no-scrollbar rounded-xl",
                  className
                )}
            >
               {/* Close Button - Optimized for Mobile touch targets */}
               <div className="sticky top-0 right-0 z-50 flex justify-end pb-2 sm:absolute sm:-top-12 sm:right-0 sm:pb-0 pointer-events-auto">
                 <button 
                   onClick={() => setOpen(false)}
                   className="p-2 bg-zinc-800/80 text-white hover:bg-zinc-700 rounded-full transition-colors border border-zinc-700/50 backdrop-blur-sm shadow-lg"
                 >
                   <X size={20} strokeWidth={1.5} />
                 </button>
               </div>
               
               <div className="pointer-events-auto w-full">
                 {children}
               </div>
            </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

// ==========================================
// 2. FEATURE: UNIFIED AUTH FORM (Auto Account)
// ==========================================

const AuthForm = () => {
    const { login, signup } = useStudio();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Unified Logic: Try Login -> Fail -> Try Signup
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const emailToSubmit = email.toLowerCase().trim();

        try {
            // 1. Attempt Login
            const loginRes = await login(emailToSubmit, password);
            
            if (loginRes.success) {
                // Success - Context will update automatically
                setLoading(false);
                return;
            }

            // 2. If Login fails (assuming user doesn't exist), Attempt Signup
            // Note: In a real app, you might want to check the specific error message
            // to ensure it's "User not found" before creating a new account.
            const signupRes = await signup(emailToSubmit, password);

            if (!signupRes.success) {
                // If both fail, show the error (likely password too weak or generic error)
                setError("Erro ao acessar. Verifique seus dados.");
            }
        } catch (err) {
            setError("Ocorreu um erro inesperado.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-zinc-950 border border-zinc-800 w-full rounded-xl flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden py-10 px-6 sm:px-10">
             <div className="absolute inset-0 opacity-[0.08] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none mix-blend-overlay" />

            <div className="z-10 w-full space-y-6">
                <div>
                    <h3 className="font-serif italic text-3xl text-white mb-2">Bem-vindo(a)</h3>
                    <p className="text-zinc-500 text-xs uppercase tracking-widest">Acompanhe seus pontos e recompensas</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 w-full">
                    <div className="relative group">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                        <input 
                            type="email" 
                            placeholder="Seu E-mail" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            // text-base prevents iOS zoom
                            className="w-full bg-zinc-900/50 border border-zinc-800 text-white text-base sm:text-sm px-10 py-3 rounded-lg focus:outline-none focus:border-white/40 transition-colors placeholder:text-zinc-600"
                            required
                        />
                    </div>
                    <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                        <input 
                            type="password" 
                            placeholder="Sua Senha" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            // text-base prevents iOS zoom
                            className="w-full bg-zinc-900/50 border border-zinc-800 text-white text-base sm:text-sm px-10 py-3 rounded-lg focus:outline-none focus:border-white/40 transition-colors placeholder:text-zinc-600"
                            required
                        />
                    </div>
                    
                    {error && <p className="text-red-400 text-xs bg-red-950/30 p-2 rounded border border-red-900/50">{error}</p>}

                    <div className="space-y-3">
                        <button 
                            disabled={loading}
                            className="w-full bg-white text-black font-semibold text-xs uppercase tracking-widest py-4 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="w-3 h-3 animate-spin"/>}
                            {loading ? "Processando..." : "Entrar / Criar Conta"}
                        </button>
                        <p className="text-zinc-600 text-[10px] uppercase">
                           Se não tiver conta, criaremos uma automaticamente.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ==========================================
// 3. FEATURE: ALEXA LOYALTY CARD (Portuguese)
// ==========================================

const TEAR_AMPLITUDE = 6;
const CENTER_X = 50;

const generateJaggedPath = (side: 'left' | 'right') => {
  let path = side === 'left' ? 'polygon(0% 0%, ' : 'polygon(100% 0%, ';
  const steps = 25; 
  for (let i = 0; i <= steps; i++) {
    const y = (i / steps) * 100;
    const randomOffset = Math.sin(i * 10) * 0.5; 
    const xOffset = i % 2 === 0 ? 0 : (side === 'left' ? TEAR_AMPLITUDE + randomOffset : -TEAR_AMPLITUDE - randomOffset);
    const x = CENTER_X + xOffset;
    path += `${x}% ${y}%, `;
  }
  path += side === 'left' ? '0% 100%)' : '100% 100%)';
  return path;
};

const LEFT_CLIP = generateJaggedPath('left');
const RIGHT_CLIP = generateJaggedPath('right');

const CardDesign = ({ stamps, userEmail }: { stamps: number, userEmail?: string }) => {
  const circles = [1, 2, 3, 4, 5];

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-8 bg-zinc-950 border border-zinc-800 overflow-hidden rounded-xl">
      {/* Texture & Effects */}
      <div className="absolute inset-0 opacity-[0.12] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none mix-blend-soft-light" />
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-zinc-800 rounded-full blur-[80px] opacity-40 pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-900/20 rounded-full blur-[80px] opacity-40 pointer-events-none" />

      {/* HEADER */}
      <div className="flex justify-between items-start z-10">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
             <Sparkles className="w-4 h-4 text-white" />
             <span className="font-serif italic text-white text-lg tracking-wide">Alexa Studio</span>
          </div>
          <span className="text-[9px] text-zinc-500 uppercase tracking-[0.2em]">Membro Fidelidade</span>
        </div>
        <div className="flex flex-col items-end">
             <div className="px-3 py-1 bg-linear-to-r from-zinc-200 to-zinc-400 text-black border border-white/20 rounded-full text-[9px] font-bold uppercase tracking-widest mb-1 shadow-lg shadow-white/10">
                VIP
             </div>
        </div>
      </div>

      {/* STAMP CIRCLES */}
      <div className="z-10 flex items-center justify-between px-1 my-auto w-full">
        {circles.map((num) => {
            const isFilled = stamps >= num;
            
            return (
                <div key={num} className="relative flex flex-col items-center flex-1">
                    <div className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full border flex items-center justify-center transition-all duration-500 z-10 relative",
                        isFilled 
                            ? "bg-white border-white shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-110" 
                            : "bg-zinc-900/50 border-zinc-700"
                    )}>
                         {isFilled ? (
                             <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-black animate-pulse" />
                         ) : (
                             <span className="text-zinc-600 text-[10px] sm:text-xs font-mono">{num}</span>
                         )}
                    </div>
                    
                    {/* Progress Line */}
                    {num !== 5 && (
                        <div className="absolute top-1/2 left-[50%] w-full h-[1px] -translate-y-1/2 z-0">
                            <div className={cn(
                                "h-full transition-all duration-700 ease-in-out",
                                stamps > num ? "bg-white shadow-[0_0_8px_white]" : "bg-zinc-800"
                            )} />
                        </div>
                    )}
                </div>
            );
        })}
      </div>

      {/* FOOTER */}
      <div className="z-10 mt-auto">
        <div className="flex justify-between items-end mb-3">
          <div className="text-zinc-500 text-[9px] uppercase tracking-widest">Saldo</div>
          <div className="text-2xl sm:text-3xl font-light text-white tracking-tight">{stamps} <span className="text-sm text-zinc-600">/ 5</span></div>
        </div>
        
        <div className="w-full h-[2px] bg-zinc-800 mt-2 relative overflow-hidden rounded-full">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" 
            initial={{ width: '0%' }}
            animate={{ width: `${(stamps / 5) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between mt-3 opacity-60">
           <span className="text-[8px] sm:text-[9px] text-zinc-400 font-mono truncate max-w-[120px]">{userEmail}</span>
           <span className="text-[8px] sm:text-[9px] text-zinc-400 font-mono">NÍVEL: {stamps === 5 ? "PLATINA" : "PADRÃO"}</span>
        </div>
      </div>
    </div>
  );
};

const AlexaLoyaltyCard = () => {
  const { state, logout, updateUserLoyalty } = useStudio();
  const { userProfile, isAuthenticated } = state;
  const [isTorn, setIsTorn] = useState(false);
  const [adminInput, setAdminInput] = useState("");

  const isActualAdmin = userProfile?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  useEffect(() => { setIsTorn(false); }, []);

  // --- AUTOMATIC TEAR LOGIC ---
  useEffect(() => {
    if (isAuthenticated && userProfile && userProfile.stamps >= 5 && !isTorn) {
        const timer = setTimeout(() => {
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([50, 50, 50]);
            setIsTorn(true);
        }, 1200); 
        return () => clearTimeout(timer);
    }
  }, [isAuthenticated, userProfile, isTorn]);

  const handleAdminUpdate = async () => {
      if(isActualAdmin && userProfile && adminInput) {
          const num = parseInt(adminInput);
          if(!isNaN(num)) {
              await updateUserLoyalty(userProfile.id, num);
              setIsTorn(false); 
              setAdminInput("");
          }
      }
  };

  if (!isAuthenticated) {
      return <AuthForm />;
  }

  const stamps = userProfile?.stamps || 0;
  
  return (
    <div className="flex flex-col items-center gap-6 w-full px-2">
        {/* CARD CONTAINER - Responsive */}
        <div className="relative w-full max-w-[420px] aspect-[1.58/1] perspective-1000 group select-none">
            
            {/* 1. REWARD LAYER */}
            <div className={cn(
                "absolute inset-0 bg-white rounded-xl border border-zinc-200 flex flex-col items-center justify-center text-center p-6 transition-all duration-700",
                isTorn ? "opacity-100 z-10 scale-100" : "opacity-0 -z-10 scale-95"
            )}>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-multiply" />
                <div className="bg-zinc-950 p-4 mb-4 shadow-xl rounded-lg relative z-10">
                    <QrCode className="w-16 h-16 sm:w-20 sm:h-20 text-white" strokeWidth={1} />
                </div>
                <h3 className="text-zinc-950 font-serif italic text-2xl sm:text-3xl mb-1 relative z-10">Recompensa</h3>
                <p className="text-zinc-500 text-[10px] sm:text-xs uppercase tracking-widest relative z-10">10% OFF - Escaneie no caixa</p>
            </div>

            {/* 2. CARD WRAPPER */}
            <AnimatePresence>
            {!isTorn && (
                <motion.div
                    className="absolute inset-0 z-20"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                >
                    <div className="w-full h-full overflow-hidden shadow-2xl shadow-black/50 relative bg-zinc-950 rounded-xl">
                        <CardDesign stamps={stamps} userEmail={userProfile?.email} />
                    </div>
                </motion.div>
            )}
            </AnimatePresence>

            {/* 3. TEAR PIECES */}
            {isTorn && (
            <div className="absolute inset-0 z-30 pointer-events-none overflow-visible"> 
                <motion.div
                    className="absolute inset-0 drop-shadow-2xl"
                    initial={{ x: 0, y: 0, rotate: 0 }}
                    animate={{ x: -100, y: 150, rotate: -15, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 60, damping: 12, opacity: { duration: 0.8, delay: 0.3 } }}
                    style={{ clipPath: LEFT_CLIP }}
                >
                    <div className="w-full h-full rounded-xl overflow-hidden bg-zinc-950">
                        <CardDesign stamps={stamps} userEmail={userProfile?.email} />
                        <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/50 shadow-[0_0_15px_white]" style={{ left: '50.5%' }} />
                    </div>
                </motion.div>

                <motion.div
                    className="absolute inset-0 drop-shadow-2xl"
                    initial={{ x: 0, y: 0, rotate: 0 }}
                    animate={{ x: 100, y: 200, rotate: 15, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 60, damping: 12, opacity: { duration: 0.8, delay: 0.3 } }}
                    style={{ clipPath: RIGHT_CLIP }}
                >
                    <div className="w-full h-full rounded-xl overflow-hidden bg-zinc-950">
                        <CardDesign stamps={stamps} userEmail={userProfile?.email} />
                        <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/50 shadow-[0_0_15px_white]" style={{ left: '49.5%' }} />
                    </div>
                </motion.div>
            </div>
            )}
        </div>

        {/* CONTROLS */}
        <div className="w-full max-w-[420px] flex justify-between items-center px-2">
            <button onClick={logout} className="flex items-center gap-2 text-zinc-500 hover:text-white text-[10px] uppercase tracking-widest transition-colors py-2">
                <LogOut size={12} /> Sair
            </button>

            {isActualAdmin && (
                <div className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-sm p-1.5 rounded-lg border border-zinc-800 shadow-lg">
                    <span className="text-[9px] text-zinc-400 ml-1 uppercase font-bold">Admin</span>
                    <input 
                        type="number" 
                        placeholder="0-5" 
                        className="bg-black/50 border border-zinc-700 rounded text-white text-xs w-10 text-center py-1 outline-none focus:border-white/50 transition-colors"
                        min="0" max="5"
                        value={adminInput}
                        onChange={(e) => setAdminInput(e.target.value)}
                    />
                    <button 
                        onClick={handleAdminUpdate} 
                        className="text-[9px] bg-white text-black px-3 py-1 rounded-md uppercase font-bold hover:bg-zinc-200 transition-colors"
                    >
                        Ok
                    </button>
                </div>
            )}
        </div>
    </div>
  );
}

// ==========================================
// 4. FEATURE: DECAY CARD (Portuguese)
// ==========================================

interface DecayCardProps {
  image?: string;
  children?: ReactNode;
  className?: string;
}

const DecayCard: React.FC<DecayCardProps> = ({
  image = 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=1000&auto=format&fit=crop',
  children,
  className
}) => {
  const svgRef = useRef<HTMLDivElement>(null);
  const displacementMapRef = useRef<SVGFEDisplacementMapElement>(null);
  const cursor = useRef({ x: 0, y: 0 });
  const cachedCursor = useRef({ x: 0, y: 0 });
  const winsize = useRef({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    winsize.current = { width: window.innerWidth, height: window.innerHeight };
    cursor.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    cachedCursor.current = { ...cursor.current };

    const handleResize = () => {
      winsize.current = { width: window.innerWidth, height: window.innerHeight };
    };
    const handleMouseMove = (ev: MouseEvent) => {
      cursor.current = { x: ev.clientX, y: ev.clientY };
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    const lerp = (a: number, b: number, n: number) => (1 - n) * a + n * b;
    const map = (x: number, a: number, b: number, c: number, d: number) => ((x - a) * (d - c)) / (b - a) + c;
    const distance = (x1: number, x2: number, y1: number, y2: number) => Math.hypot(x1 - x2, y1 - y2);

    const imgValues = { imgTransforms: { x: 0, y: 0, rz: 0 }, displacementScale: 0 };

    const render = () => {
      if (!svgRef.current) return;
      
      let targetX = lerp(imgValues.imgTransforms.x, map(cursor.current.x, 0, winsize.current.width, -15, 15), 0.1);
      let targetY = lerp(imgValues.imgTransforms.y, map(cursor.current.y, 0, winsize.current.height, -15, 15), 0.1);
      let targetRz = lerp(imgValues.imgTransforms.rz, map(cursor.current.x, 0, winsize.current.width, -2, 2), 0.1);

      imgValues.imgTransforms.x = targetX;
      imgValues.imgTransforms.y = targetY;
      imgValues.imgTransforms.rz = targetRz;

      gsap.set(svgRef.current, {
        x: imgValues.imgTransforms.x,
        y: imgValues.imgTransforms.y,
        rotateZ: imgValues.imgTransforms.rz
      });

      const cursorTravelledDistance = distance(cachedCursor.current.x, cursor.current.x, cachedCursor.current.y, cursor.current.y);
      imgValues.displacementScale = lerp(imgValues.displacementScale, map(cursorTravelledDistance, 0, 200, 0, 400), 0.06);

      if (displacementMapRef.current) {
        gsap.set(displacementMapRef.current, { attr: { scale: imgValues.displacementScale } });
      }

      cachedCursor.current = { ...cursor.current };
      requestAnimationFrame(render);
    };

    const loop = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(loop);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div 
        ref={svgRef}
        className={cn("relative select-none shadow-2xl shadow-zinc-950/50 w-full aspect-[3/4] max-w-[350px] mx-auto overflow-hidden rounded-lg", className)} 
    >
      <svg viewBox="0 0 600 750" preserveAspectRatio="xMidYMid slice" className="block w-full h-full will-change-transform bg-zinc-900">
        <filter id="imgFilter">
          <feTurbulence type="turbulence" baseFrequency="0.015" numOctaves="5" seed="4" stitchTiles="stitch" result="turbulence1" />
          <feDisplacementMap ref={displacementMapRef} in="SourceGraphic" in2="turbulence1" scale="0" xChannelSelector="R" yChannelSelector="B" />
        </filter>
        <image href={image} x="0" y="0" width="100%" height="100%" filter="url(#imgFilter)" preserveAspectRatio="xMidYMid slice" />
      </svg>
      <div className="absolute inset-0 border border-white/20 pointer-events-none mix-blend-overlay rounded-lg"></div>
      <div className="absolute bottom-10 left-8 right-8 text-center text-white mix-blend-overlay pointer-events-none">
        {children}
      </div>
    </div>
  );
};

// ==========================================
// 5. EXPORTS (Portuguese Triggers)
// ==========================================

export function LoyaltyModal() {
  return (
    <Modal>
      <ModalTrigger className="bg-zinc-950 text-white shadow-xl shadow-zinc-900/20 border border-zinc-800 rounded-lg">
        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
        <span className="relative flex items-center gap-3 font-medium tracking-widest text-xs uppercase z-10">
          Cartão Fidelidade <Sparkles className="w-3 h-3 text-yellow-300" />
        </span>
      </ModalTrigger>

      <ModalBody>
         <AlexaLoyaltyCard />
      </ModalBody>
    </Modal>
  );
}

export function DecayPromoModal() {
  return (
    <Modal>
      <ModalTrigger className="bg-white text-zinc-950 border border-zinc-200 shadow-xl shadow-zinc-200/50 rounded-lg">
        <div className="absolute inset-0 bg-zinc-100 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
        <span className="relative flex items-center gap-3 font-medium tracking-widest text-xs uppercase z-10">
            Revelar Promo <ArrowRight className="w-3 h-3" />
        </span>
      </ModalTrigger>

      <ModalBody>
        <div className="flex justify-center w-full px-4">
            <DecayCard>
                <h2 className="font-serif italic text-4xl sm:text-6xl tracking-tighter">Nova<br/>Coleção</h2>
                <p className="font-sans text-[10px] sm:text-xs font-bold uppercase tracking-[0.5em] mt-4 text-white/90">Temporada</p>
            </DecayCard>
        </div>
      </ModalBody>
    </Modal>
  );
}

// ==========================================
// 6. DEMO PAGE
// ==========================================

export default function ModalDemo() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center gap-12 p-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl md:text-5xl font-serif italic text-zinc-900 tracking-tight">
          Alexa Studio
        </h1>
        <p className="text-zinc-500 text-xs uppercase tracking-[0.3em]">Recompensas Interativas</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        <LoyaltyModal />
        <DecayPromoModal />
      </div>
    </div>
  );
}