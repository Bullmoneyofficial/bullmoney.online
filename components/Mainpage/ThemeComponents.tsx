"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // REQUIRED for Exit functionality
import { 
  TrendingUp, DollarSign, Zap, Activity, Settings, 
  RefreshCw, Wifi, ArrowRight, SkipForward, MessageCircle, Check, Volume2, VolumeX
} from 'lucide-react'; 
import { motion, AnimatePresence } from 'framer-motion';

// Ensure these imports exist in your project structure
import { ALL_THEMES, ThemeCategory, SoundProfile, TickerData } from '@/constants/theme-data';
import { ShimmerButton, ShimmerCard, ShimmerBorder, GlowText, IllusionLayer, GlobalSvgFilters } from '@/components/ThemeUI';
import { ThemeConfigModal } from '@/components/ThemeConfigModal'; 

// --- CRITICAL RE-EXPORTS ---
export { ALL_THEMES, type Theme, type ThemeCategory, type SoundProfile } from '@/constants/theme-data';

// ------------------------------------------------------------------
// 🛡️ FIX: Safety check for ALL_THEMES to prevent crash on import
// ------------------------------------------------------------------
export const THEME_SOUNDTRACKS: Record<string, string> = (ALL_THEMES || []).reduce((acc, theme) => {
    acc[theme.id] = theme.youtubeId || 'jfKfPfyJRdk'; 
    return acc;
}, {} as Record<string, string>);

const TARGET_PAIRS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT'];
const LOWER_CASE_PAIRS = TARGET_PAIRS.map(p => p.toLowerCase());

// --- HOOKS ---
export const useBinanceTickers = () => {
    const [tickers, setTickers] = useState<Record<string, TickerData>>({});
    const [status, setStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'>('DISCONNECTED');
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        let isMounted = true; 
        const streams = LOWER_CASE_PAIRS.map(p => `${p}@miniTicker`).join('/');
        const wsUrl = `wss://stream.binance.com:9443/ws/${streams}`;
        
        if (isMounted) setStatus('CONNECTING');
        
        wsRef.current = new WebSocket(wsUrl);
        
        wsRef.current.onopen = () => { if (isMounted) setStatus('CONNECTED'); };
        
        wsRef.current.onmessage = (event: MessageEvent) => { 
            try {
                const data = JSON.parse(event.data);
                if (isMounted && data.s) {
                    setTickers(prev => {
                        const symbol = data.s; 
                        const currentPrice = parseFloat(data.c || '0').toFixed(2); 
                        return { 
                            ...prev, 
                            [symbol]: { 
                                symbol: data.s, 
                                price: currentPrice, 
                                percentChange: parseFloat(data.P || '0').toFixed(2), 
                                prevPrice: prev[symbol] ? prev[symbol].price : currentPrice 
                            } 
                        };
                    });
                }
            } catch (err) {
                console.error("Ticker Parse Error", err);
            }
        };

        wsRef.current.onclose = () => { if (isMounted) setStatus('DISCONNECTED'); };
        wsRef.current.onerror = () => { if (isMounted) setStatus('DISCONNECTED'); };
        
        return () => { 
            isMounted = false; 
            if (wsRef.current) wsRef.current.close(); 
        };
    }, []); // Empty dependency array is correct here

    return { tickers, status };
};

export const useBinanceChart = (symbol: string = 'BTCUSDT') => {
    const [chartData, setChartData] = useState<number[]>([]); 
    useEffect(() => {
        let isMounted = true;
        const fetchHistory = async () => {
            try {
                const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=24`);
                if (!res.ok) throw new Error("Binance API fetch failed");
                const data = await res.json();
                if(isMounted) setChartData(data.map((d: any[]) => parseFloat(d[4])));
            } catch (e) { 
                if(isMounted) setChartData([]); 
            }
        };
        fetchHistory();
        const intervalId = setInterval(fetchHistory, 3600000); 
        return () => {
            isMounted = false;
            clearInterval(intervalId);
        }
    }, [symbol]);
    return chartData;
};

// --- SUB-COMPONENTS ---

const LivePriceDisplay = ({ price, prevPrice }: { price: string, prevPrice: string }) => {
    const pCurrent = parseFloat(price || '0');
    const pPrev = parseFloat(prevPrice || '0');
    const direction = pCurrent > pPrev ? 'up' : pCurrent < pPrev ? 'down' : 'neutral';
    return (
        <span className={`transition-colors duration-300 ${direction === 'up' ? 'text-green-400' : direction === 'down' ? 'text-red-400' : 'text-white'}`}>
            ${Number(pCurrent).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
    );
};

const LiveTickerTape = ({ tickers }: { tickers: Record<string, TickerData> }) => {
    const tickerList = TARGET_PAIRS.map(symbol => tickers[symbol]).filter(Boolean);
    const displayList = tickerList.length > 0 ? tickerList : TARGET_PAIRS.map(p => ({ symbol: p, price: '---', percentChange: '0.00', prevPrice: '0' }));
    
    return (
        <div className="relative w-full h-8 md:h-10 shrink-0 z-50 bg-black border-b border-white/10">
            <div className="w-full h-full bg-neutral-950/80 backdrop-blur-sm flex items-center overflow-hidden">
                <motion.div className="flex whitespace-nowrap" animate={{ x: [0, -1000] }} transition={{ repeat: Infinity, duration: 40, ease: "linear" }}>
                    {[...displayList, ...displayList, ...displayList].map((t, i) => (
                        <div key={`${t.symbol}-${i}`} className="flex items-center gap-3 px-6 border-r border-white/10 h-10">
                            <span className="font-bold text-blue-500 text-[10px] md:text-xs">{t.symbol.replace('USDT', '')}</span>
                            <span className="text-white font-mono text-[10px] md:text-xs">{t.price === '---' ? t.price : `$${t.price}`}</span>
                            <span className={`text-[10px] ${parseFloat(t.percentChange) >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{parseFloat(t.percentChange) > 0 ? '+' : ''}{t.percentChange}%</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};

export const WelcomeBackModal = ({ isOpen, onContinue, onSkip }: { isOpen: boolean, onContinue: () => void, onSkip: () => void }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                className="fixed inset-0 z-[100] flex items-start justify-center bg-black/95 backdrop-blur-md p-4 md:p-6 font-sans overflow-y-auto"
            >
                <div className="max-w-lg w-full mt-[10vh] mb-[10vh] flex-shrink-0"> 
                    <ShimmerCard className="p-0">
                        <div className="px-6 md:px-8 py-8 md:py-10 flex flex-col items-center justify-center text-center">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-shimmer-effect uppercase">Welcome Back</h2>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0f172a] border border-blue-900/30 rounded-full mb-10 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"/>
                                <GlowText text="TERMINAL DETECTED" className="text-[10px] font-bold" />
                            </div>
                            <ShimmerButton onClick={onContinue} icon={ArrowRight}>CONTINUE SETUP</ShimmerButton>
                            <button onClick={onSkip} className="mt-6 flex items-center gap-2 group">
                                <GlowText text="Skip to Dashboard" className="text-xs group-hover:text-white transition-colors" />
                                <SkipForward className="w-3 h-3 text-blue-500 group-hover:text-white" />
                            </button>
                        </div>
                    </ShimmerCard>
                </div>
            </motion.div>
        )}
    </AnimatePresence>
);

export const SupportWidget = () => (
    <div className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-[45]">
        <button 
            onClick={() => alert("Connecting to Support Agent... (Simulated)")} 
            className="relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#050505] border border-blue-900/50 shadow-[0_0_30px_rgba(37,99,235,0.4)] overflow-hidden group hover:scale-110 transition-transform"
        >
            <ShimmerBorder active={true} />
            <div className="absolute inset-[2px] rounded-full bg-black flex items-center justify-center z-10">
                <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-blue-500 text-glow" />
            </div>
        </button>
    </div>
);

const SimulatedStatsCard = ({ label, value, icon: Icon }: { label: string, value: string, icon: any }) => (
    <ShimmerCard className="h-16 md:h-20 shrink-0">
        <div className="p-3 flex items-center justify-between h-full">
            <div className="flex flex-col">
                <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-gray-500">{label}</span>
                <span className="text-base md:text-lg font-bold text-white font-mono">{value}</span>
            </div>
            <Icon className="w-4 h-4 md:w-5 md:h-5 text-blue-400/50" />
        </div>
    </ShimmerCard>
);

const ControlPanel = ({ activeThemeId, onAction, onSaveTheme, onOpenConfig }: { activeThemeId: string, onAction: (action: string) => void, onSaveTheme: (themeId: string) => void, onOpenConfig: () => void }) => {
    const simulatedTraders = '18,451';
    const simulatedAssets = '$2.13B';
    return (
        <div className="flex flex-col h-full gap-4 overflow-y-auto custom-scrollbar">
            <ShimmerCard className="h-24 md:h-28 shrink-0 cursor-pointer group" onClick={onOpenConfig}>
                <div className="p-4 md:p-5 flex flex-col justify-center h-full">
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-sm tracking-wider text-blue-400 group-hover:text-blue-200 transition-colors">THEME/AUDIO CONFIG</span>
                        <Settings className="w-5 h-5 text-blue-500 group-hover:rotate-45 transition-transform" />
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                        <GlowText text="Open Full Setup" className="text-[10px] md:text-xs"/>
                        <ArrowRight className="w-3 h-3 text-blue-500"/>
                    </div>
                </div>
            </ShimmerCard>
            <ShimmerCard className="shrink-0">
                <div className="p-4 md:p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-4 h-4 text-yellow-400" /> <span className="font-bold text-xs tracking-wider text-gray-200">QUICK OPS & STATS</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-4 pt-1 border-b border-white/5 pb-4">
                        <SimulatedStatsCard label=" Traders" value={simulatedTraders} icon={Activity} />
                        <SimulatedStatsCard label=" Assets" value={simulatedAssets} icon={DollarSign} />
                    </div>
                    <div className="hidden lg:grid grid-cols-1 gap-3"> 
                        <ShimmerButton icon={Check} onClick={() => onSaveTheme(activeThemeId)} className="h-10 text-xs text-green-500">APPLY CURRENT THEME</ShimmerButton>
                        <ShimmerButton icon={ArrowRight} onClick={() => onAction('exit')} className="h-10 text-xs">EXIT TO DASHBOARD</ShimmerButton>
                    </div>
                </div>
            </ShimmerCard>
        </div>
    );
};

const MobileBottomActionPanel = ({ 
    activeThemeId, onSaveTheme, onExit, isMobileMenuOpen, onRefresh 
}: { 
    activeThemeId: string, onSaveTheme: (themeId: string) => void, onExit: () => void, isMobileMenuOpen: boolean, onRefresh: () => void 
}) => (
    <AnimatePresence>
        {!isMobileMenuOpen && (
            <motion.div initial={{ y: 0, opacity: 1 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="sticky bottom-0 left-0 right-0 z-50 lg:hidden p-4 bg-black/90 backdrop-blur-md border-t border-blue-500/30 shadow-[0_-5px_30px_rgba(37,99,235,0.2)]"
            >
                <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
                    <ShimmerButton icon={RefreshCw} onClick={onRefresh} className="h-10 text-xs text-yellow-500">REFRESH DATA</ShimmerButton>
                    <ShimmerButton icon={ArrowRight} onClick={onExit} className="h-10 text-xs">EXIT</ShimmerButton>
                </div>
            </motion.div>
        )}
    </AnimatePresence>
);

// --- MAIN COMPONENT ---

export default function FixedThemeConfigurator({ initialThemeId, onThemeChange }: { initialThemeId: string, onThemeChange: (themeId: string, sound: SoundProfile, muted: boolean) => void }) {
    const router = useRouter(); // 🟢 FIX: Use Next.js Router for real exit
    const { tickers, status: wsStatus } = useBinanceTickers();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const chartData = useBinanceChart('BTCUSDT'); 
    
    // 🛡️ FIX: Persist state via localStorage initialization
    const [activeThemeId, setActiveThemeId] = useState<string>(initialThemeId);
    const [isMuted, setIsMuted] = useState(true); 
    const [currentSound, setCurrentSound] = useState<SoundProfile>('MECHANICAL');
    
    const [showWelcome, setShowWelcome] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
    const [activeCategory, setActiveCategory] = useState<ThemeCategory>('SENTIMENT'); 
    const [isMobile, setIsMobile] = useState(false); 
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    
    // SAFE ACTIVE THEME RESOLUTION
    const activeTheme = useMemo(() => {
        if (!ALL_THEMES || ALL_THEMES.length === 0) return { id: 'default', name: 'Default', filter: '', mobileFilter: '', illusion: 'grid' } as any;
        return ALL_THEMES.find(t => t.id === activeThemeId) || ALL_THEMES[0];
    }, [activeThemeId]);

    const btcData = tickers['BTCUSDT'] || { price: '0.00', percentChange: '0.00', prevPrice: '0' };
    const ethData = tickers['ETHUSDT'] || { price: '0.00', percentChange: '0.00', prevPrice: '0' };
    
    const portfolioValue = useMemo(() => {
        const btcVal = parseFloat(btcData.price || '0');
        const ethVal = parseFloat(ethData.price || '0');
        return (btcVal * 0.45) + (ethVal * 12.5) + 15240;
    }, [btcData.price, ethData.price]);
    
    // --- EFFECT: LOAD SAVED SETTINGS ---
    useEffect(() => {
        const savedTheme = localStorage.getItem('user_theme_id');
        const savedSound = localStorage.getItem('user_sound_profile');
        const savedMute = localStorage.getItem('user_is_muted');

        if (savedTheme) setActiveThemeId(savedTheme);
        if (savedSound) setCurrentSound(savedSound as SoundProfile);
        if (savedMute) setIsMuted(savedMute === 'true');
    }, []);

    // --- HANDLERS ---

    const handleSaveTheme = useCallback((themeId: string, sound: SoundProfile, muted: boolean) => {
        setActiveThemeId(themeId); 
        setCurrentSound(sound);
        setIsMuted(muted);
        
        // 🟢 FIX: Actually save to storage
        localStorage.setItem('user_theme_id', themeId);
        localStorage.setItem('user_sound_profile', sound);
        localStorage.setItem('user_is_muted', String(muted));

        onThemeChange(themeId, sound, muted); 
        setIsConfigModalOpen(false);
        setIsMobileMenuOpen(false);
    }, [onThemeChange]); 

    // Quick save applies current theme with *current* audio settings
    const handleQuickSaveTheme = useCallback((themeId: string) => {
        handleSaveTheme(themeId, currentSound, isMuted);
    }, [currentSound, isMuted, handleSaveTheme]);

    const handleExit = useCallback(() => { 
        if(confirm("Exit to main Dashboard?")) {
            // 🟢 FIX: Actually Navigate
            router.push('/'); // Or '/dashboard'
        }
    }, [router]);

    const handleRefresh = useCallback(() => {
        // Force refresh logic could go here, for now just reload window or re-init socket
        window.location.reload();
    }, []);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => {
            const newState = !prev;
            localStorage.setItem('user_is_muted', String(newState));
            return newState;
        });
    }, []);

    const handleWelcomeContinue = useCallback(() => {
        setShowWelcome(false);
        setIsMuted(false); // Auto-unmute on welcome (optional)
        setIsConfigModalOpen(true); 
    }, []);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024); 
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <main className="relative w-full h-full bg-black font-sans selection:bg-blue-500/30 text-white flex flex-col overflow-y-auto overflow-x-hidden"
            style={{ filter: isMobile ? activeTheme.mobileFilter : activeTheme.filter, transition: 'filter 0.5s ease-in-out' }}
        >
            <GlobalSvgFilters />
            {/* BACKGROUND OVERLAY */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-50 mix-blend-overlay overflow-hidden"><IllusionLayer type={activeTheme.illusion} /></div>
            
            {/* HEADER */}
            <header className="shrink-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/10">
                <LiveTickerTape tickers={tickers} />
                <div className="h-12 md:h-14 flex items-center px-4 md:px-6 justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-blue-500 font-bold tracking-[0.2em] text-xs md:text-base">SYNTHESIS_OS</span>
                    </div>
                    <div className="hidden lg:flex items-center gap-6">
                        <GlowText text={activeTheme.name.toUpperCase()} className="text-xs tracking-wider" />
                        <div className="flex items-center gap-2 px-3 py-1 rounded bg-white/5 border border-white/10">
                            <Wifi className={`w-3 h-3 ${wsStatus === 'CONNECTED' ? 'text-green-500' : 'text-red-500'}`} />
                            <span className="text-[10px] font-mono text-gray-400">UPLINK: {wsStatus}</span>
                        </div>
                        <button onClick={toggleMute} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            {isMuted ? <VolumeX className="w-4 h-4 text-red-400"/> : <Volume2 className="w-4 h-4 text-blue-400"/>}
                        </button>
                    </div>
                    <button onClick={() => setIsConfigModalOpen(true)} className="lg:hidden p-1 text-white">
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <WelcomeBackModal 
                isOpen={showWelcome} 
                onContinue={handleWelcomeContinue} 
                onSkip={() => setShowWelcome(false)} 
            />

            {/* MAIN DASHBOARD GRID */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 px-4 md:px-6 py-4 flex flex-col z-10 relative max-w-[1600px] mx-auto overflow-y-auto custom-scrollbar" style={{ filter: showWelcome ? 'blur(10px)' : 'none' }}>
                <div className="mb-4 md:mb-6 shrink-0">
                    <h1 className="text-2xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600">COMMAND DECK</h1>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 min-h-0">
                    {/* LEFT SECTION */}
                    <div className="lg:col-span-9 flex flex-col gap-4 md:gap-6 min-h-0">
                        {/* KPI Cards */}
                        <div className="flex overflow-x-auto gap-4 shrink-0 pb-2 md:pb-0 snap-x-mandatory no-scrollbar md:grid md:grid-cols-3 touch-scroll">
                            <div className="snap-center w-[85vw] md:w-auto flex-none">
                                <ShimmerCard className="h-32 md:h-40 w-full">
                                    <div className="p-4 md:p-6 flex flex-col justify-between h-full">
                                        <div className="flex justify-between items-start"><div className="p-1.5 rounded bg-blue-500/10 border border-blue-500/20"><TrendingUp className="w-4 h-4 text-blue-400" /></div><span className="text-green-400 text-xs font-bold">+4.2%</span></div>
                                        <div><div className="text-gray-500 text-[9px] uppercase tracking-widest mb-1">TOTAL TRADED</div><div className="text-2xl md:text-3xl font-bold font-mono tracking-tight text-white"><LivePriceDisplay price={portfolioValue.toFixed(2)} prevPrice={(portfolioValue - 100).toString()} /></div></div>
                                    </div>
                                </ShimmerCard>
                            </div>
                            <div className="snap-center w-[85vw] md:w-auto flex-none">
                                <ShimmerCard className="h-32 md:h-40 w-full">
                                    <div className="p-4 md:p-6 flex flex-col justify-between h-full">
                                        <div className="flex justify-between items-start"><div className="flex items-center gap-2"><div className="p-1.5 rounded bg-[#F7931A]/20 border border-[#F7931A]/30"><DollarSign className="w-4 h-4 text-[#F7931A]" /></div><span className="font-bold text-xs">BTC</span></div><span className={`text-[10px] px-1.5 py-0.5 rounded ${parseFloat(btcData.percentChange) >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{btcData.percentChange}%</span></div>
                                        <div className="text-2xl md:text-3xl font-bold font-mono tracking-tight mt-auto"><LivePriceDisplay price={btcData.price} prevPrice={btcData.prevPrice} /></div>
                                    </div>
                                </ShimmerCard>
                            </div>
                            <div className="snap-center w-[85vw] md:w-auto flex-none">
                                <ShimmerCard className="h-32 md:h-40 w-full">
                                    <div className="p-4 md:p-6 flex flex-col justify-between h-full">
                                        <div className="flex justify-between items-start"><div className="flex items-center gap-2"><div className="p-1.5 rounded bg-blue-500/20 border border-blue-500/30"><Zap className="w-4 h-4 text-blue-400" /></div><span className="font-bold text-xs">ETH</span></div><span className={`text-[10px] px-1.5 py-0.5 rounded ${parseFloat(ethData.percentChange) >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{ethData.percentChange}%</span></div>
                                        <div className="text-2xl md:text-3xl font-bold font-mono tracking-tight mt-auto"><LivePriceDisplay price={ethData.price} prevPrice={ethData.prevPrice} /></div>
                                    </div>
                                </ShimmerCard>
                            </div>
                        </div>

                        {/* BIG THEME CONFIG PLACEHOLDER */}
                        <div className="flex-1 w-full min-h-[300px]">
                            <ShimmerCard className="h-full">
                                <div className="p-5 h-full flex flex-col w-full items-center justify-center">
                                    <h2 className="text-xl font-bold text-blue-500 mb-2">PICKTHEME</h2>
                                    <p className="text-gray-500 text-sm">Theme configuration</p>
                                    <ShimmerButton onClick={() => setIsConfigModalOpen(true)} icon={Settings} className="mt-6 max-w-sm">OPEN FULL CONFIGURATION</ShimmerButton>
                                </div>
                            </ShimmerCard>
                        </div>
                    </div>

                    {/* RIGHT SECTION (Sidebar on Desktop) */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="hidden lg:flex flex-col w-full lg:w-auto lg:col-span-3 h-full min-h-0 gap-4">
                         <ControlPanel 
                            activeThemeId={activeThemeId} 
                            onAction={handleExit} 
                            onSaveTheme={handleQuickSaveTheme} 
                            onOpenConfig={() => setIsConfigModalOpen(true)} 
                         />
                    </motion.div>
                </div>
            </motion.div>
            
            {/* MOBILE SAVE/EXIT BAR */}
            <MobileBottomActionPanel 
                activeThemeId={activeThemeId} 
                onSaveTheme={handleQuickSaveTheme} 
                onExit={handleExit} 
                isMobileMenuOpen={isMobileMenuOpen}
                onRefresh={handleRefresh}
            />
            <SupportWidget />

            {/* --- THEME CONFIGURATOR MODAL --- */}
            <ThemeConfigModal 
                isOpen={isConfigModalOpen} 
                onClose={() => setIsConfigModalOpen(false)} 
                onSave={handleSaveTheme} 
                initialThemeId={activeThemeId} // FIX: Pass current state, not initial prop
                initialCategory={activeCategory} 
                initialSound={currentSound} 
                initialMuted={isMuted} 
                isMobile={isMobile}
            />
        </main>
    );
}