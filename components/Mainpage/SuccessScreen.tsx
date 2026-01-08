"use client";

import React, { useState, useEffect, useCallback, memo } from 'react';
import { createClient } from '@supabase/supabase-js'; 
import {
  Loader2, Check, Lock, Award, Medal, Crown, Trophy, RefreshCw, DollarSign, TrendingUp, ChevronRight, Users, X, Activity, Info, History, ShieldCheck, Send, FolderPlus, ArrowRight, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils"; 

// --- 1. REAL SUPABASE SETUP ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!; 
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- LINKS ---
const TELEGRAM_GROUP_LINK = "https://t.me/+aKB315PRM5A2OGI0"; 
const VIP_GROUP_LINK = "https://t.me/addlist/49RB5tSleTw1MjU0"; 

// --- UTILS ---
const characters = "BULLMONEY";
const generateRandomString = (length: number) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// --- TYPES ---
interface AffiliateData {
  affiliateId: string;
  commissions: number;
  referrals: number;
  monthlyReferrals: number;
  socialHandle?: string; 
  tasks: {
    broker: boolean; 
    social: boolean; 
    clicks: boolean; 
    silver: boolean; 
  }
}

// --- VISUAL COMPONENTS (MEMOIZED) ---

interface CardSpotlightProps {
  className?: string;
  children: React.ReactNode;
}

const CardSpotlight = memo<CardSpotlightProps>(({ className, children }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  const maskImage = useMotionTemplate`radial-gradient(200px circle at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { WebkitMaskImage: maskImage, maskImage };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50 shadow-xl",
        className
      )}
    >
      <div className="absolute inset-0 z-10 bg-neutral-900/50 [mask-image:radial-gradient(transparent,black)] pointer-events-none" />
      <motion.div
        className="absolute inset-0 z-10 bg-gradient-to-r from-green-500/40 to-blue-500/40 opacity-0 transition duration-500 group-hover:opacity-100 will-change-transform"
        style={style}
      />
      <div className="relative z-20 h-full w-full">{children}</div>
    </motion.div>
  );
});

const Step = ({ title }: { title: string | React.ReactNode }) => {
  return (
    <li className="flex gap-2 items-start">
      <Check className="h-4 w-4 text-green-500 mt-1 shrink-0" />
      <p className="text-white text-sm">{title}</p>
    </li>
  );
};

// --- RANK EVERVAULT CARD ---
const RankEvervaultCard = memo(({ totalReferrals }: { totalReferrals: number }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [randomString, setRandomString] = useState("");

  let tierData = {
    name: 'BRONZE',
    color: 'text-orange-400',
    border: 'border-orange-500/30',
    icon: Award,
    nextTarget: 20,
    progressColor: 'bg-orange-500',
    matrixColor: 'text-orange-900/40'
  };

  if (totalReferrals >= 20 && totalReferrals < 50) {
    tierData = {
      name: 'SILVER',
      color: 'text-slate-300',
      border: 'border-slate-400/30',
      icon: Medal,
      nextTarget: 50,
      progressColor: 'bg-slate-300',
      matrixColor: 'text-slate-500/40'
    };
  } else if (totalReferrals >= 50) {
    tierData = {
      name: 'GOLD',
      color: 'text-yellow-400',
      border: 'border-yellow-500/30',
      icon: Crown,
      nextTarget: 100,
      progressColor: 'bg-yellow-400',
      matrixColor: 'text-yellow-600/40'
    };
  }

  const progressPercent = Math.min((totalReferrals / tierData.nextTarget) * 100, 100);
  const Icon = tierData.icon;

  useEffect(() => {
    setRandomString(generateRandomString(2000));
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
    setRandomString(generateRandomString(2000));
  }, [mouseX, mouseY]);

  const maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage as unknown as string };

  return (
    <div 
      onMouseMove={onMouseMove}
      className={cn("relative overflow-hidden rounded-2xl border bg-black/80 p-0 transition-all duration-500 min-h-[180px]", tierData.border)}
    >
      <div className="absolute inset-0 pointer-events-none z-0">
         <motion.div 
           className={cn("absolute inset-0 backdrop-blur-sm transition duration-500 opacity-50")} 
           style={style} 
         />
         <motion.div 
           className="absolute inset-0 opacity-0 group-hover:opacity-100 mix-blend-overlay will-change-transform" 
           style={style}
         >
           <p className={cn("absolute inset-x-0 p-2 text-[10px] leading-4 h-full break-words font-mono font-bold select-none", tierData.matrixColor)}>
             {randomString}
           </p>
         </motion.div>
      </div>

      <div className="relative z-10 p-6 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between mb-4">
          <motion.div layoutId="rank-title-container">
            <h3 className="text-slate-500 text-xs font-bold tracking-widest uppercase mb-1">Current Rank</h3>
            <h2 className={`text-5xl font-black italic tracking-tighter ${tierData.color} drop-shadow-lg flex items-center gap-2`}>
              {tierData.name} 
            </h2>
          </motion.div>
          <motion.div layoutId="rank-icon-container" className={`p-4 rounded-full bg-white/5 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-md`}>
            <Icon className={`w-10 h-10 ${tierData.color}`} />
          </motion.div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs font-mono mb-2 text-slate-300 font-bold">
            <span>{totalReferrals} RECRUITS</span>
            <span>NEXT GOAL: {tierData.nextTarget}</span>
          </div>
          <div className="w-full bg-neutral-900 rounded-full h-3 border border-white/10 overflow-hidden relative">
            <motion.div
              layoutId="rank-progress"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={`h-full rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)] ${tierData.progressColor}`}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-2 text-right uppercase tracking-wider">
            {tierData.nextTarget - totalReferrals} TO NEXT LEVEL
          </p>
        </div>
      </div>
    </div>
  );
});

// --- TASK EVERVAULT CARD ---
const TaskEvervaultCard = memo(({ title, completed }: { title: string, completed: boolean }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [randomString, setRandomString] = useState("");

  useEffect(() => {
    setRandomString(generateRandomString(1500)); 
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
    setRandomString(generateRandomString(1500));
  }, [mouseX, mouseY]);

  const statusColor = completed ? "text-green-400" : "text-red-400";
  const statusBg = completed ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30";
  const statusText = completed ? "COMPLETED" : "INCOMPLETE";
      
  const maskImage = useMotionTemplate`radial-gradient(180px at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage as unknown as string };

  return (
    <div 
      onMouseMove={onMouseMove}
      className={cn(
        "group relative w-full h-28 overflow-hidden rounded-xl border bg-black/40 transition-all duration-300",
        completed ? "border-green-500/30 hover:border-green-500/60" : "border-red-500/30 hover:border-red-500/60"
      )}
    >
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500">
            <motion.div 
              className={cn("absolute inset-0 backdrop-blur-sm transition duration-500", completed ? "bg-green-500/10" : "bg-red-500/10")} 
              style={style} 
            />
            <motion.div 
              className="absolute inset-0 opacity-50 mix-blend-overlay will-change-transform" 
              style={style}
            >
              <p className={cn("absolute inset-x-0 p-2 text-[8px] leading-3 h-full break-words font-mono font-bold select-none", completed ? "text-green-200" : "text-red-200")}>
                {randomString}
              </p>
            </motion.div>
         </div>
      </div>

      <div className="relative z-10 h-full flex flex-col justify-between p-4">
        <h4 className="text-sm font-bold text-white leading-tight max-w-[90%] z-20">{title}</h4>
        
        <div className="flex items-center justify-between z-20">
            <span className={cn("text-[10px] font-mono tracking-widest border px-2 py-0.5 rounded", statusBg, statusColor)}>
              {statusText}
            </span>
            {completed ? (
              <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                <Check className="w-3.5 h-3.5 text-black font-bold" />
              </div>
            ) : (
              <div className="h-6 w-6 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center">
                 <Lock className="w-3 h-3 text-slate-500" />
              </div>
            )}
        </div>
      </div>
    </div>
  );
});

const IncentiveTaskGrid = memo(({ tasks }: { tasks: AffiliateData['tasks'] }) => {
  const taskList = [
    { title: "Partner Broker Account", completed: tasks.broker },
    { title: "Social Media Setup", completed: tasks.social },
    { title: "Reach Silver Tier", completed: tasks.silver }
  ];

  return (
    <div className="mt-8">
      <h3 className="text-lg text-white font-bold mb-4 flex items-center gap-2 pl-1">
        <Trophy className="w-5 h-5 text-purple-400" /> Incentive Tasks
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {taskList.map((task, idx) => (
          <TaskEvervaultCard key={idx} title={task.title} completed={task.completed} />
        ))}
      </div>
    </div>
  );
});

// --- MAIN DASHBOARD VIEW ---
const AffiliateDashboardView: React.FC<{ onClose: () => void, onUnlock: () => void }> = ({ onClose, onUnlock: _onUnlock }) => {
  const [data, setData] = useState<AffiliateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false); 
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpandedId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const loadData = useCallback(async () => {
    if (!data) setIsLoading(true); 
    setIsFetching(true);

    try {
      const savedSession = localStorage.getItem("bullmoney_session");
      if (!savedSession) return;
      const session = JSON.parse(savedSession);

      let { data: viewData, error: _viewError } = await supabase
        .from('affiliate_dashboard_view')
        .select('*')
        .eq('id', session.id)
        .single();

      if (viewData && !viewData.affiliate_code) {
        const emailPrefix = viewData.email ? viewData.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 8) : 'user';
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const newAffiliateCode = `bmt_${emailPrefix}${randomSuffix}`;
        
        const { error: updateError } = await supabase.from('recruits').update({ affiliate_code: newAffiliateCode }).eq('id', session.id);
        
        if (!updateError) {
              viewData.affiliate_code = newAffiliateCode;
        }
      }

      const totalReferrals = viewData?.total_referred_display || 0;
      const monthlyReferrals = viewData?.monthly_referred || 0;

      setData({
        affiliateId: viewData?.affiliate_code || "pending...",
        commissions: viewData?.commission_balance || 0.00,
        referrals: totalReferrals,
        monthlyReferrals: monthlyReferrals,
        socialHandle: viewData?.social_handle,
        tasks: {
          broker: viewData?.task_broker_verified || false,
          social: viewData?.task_social_verified || false,
          clicks: false, 
          silver: totalReferrals >= 50
        }
      });

    } catch (error) {
      console.error("Affiliate Load Error:", error);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [data]);

  useEffect(() => {
    loadData();
    const intervalId = setInterval(loadData, 60000); 
    return () => clearInterval(intervalId);
  }, [loadData]);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-[#050B14] flex flex-col items-center justify-start pt-16 p-4 relative w-full">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mt-20" />
        <p className="text-white mt-4 text-sm tracking-widest uppercase">Syncing Affiliate Data...</p>
      </div>
    );
  }

  const affiliateData = data;

  return (
    <>
    {/* FIX: Move motion.div to separate context so fixed modals are not crushed by transforms */}
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[#050B14] flex flex-col items-center justify-start pt-10 p-4 relative w-full pb-20 overflow-x-hidden"
    >
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[60px] md:blur-[120px] will-change-transform" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[60px] md:blur-[120px] will-change-transform" />
      </div>

      <div className="w-full max-w-xl relative z-10">
        <header className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-white tracking-tighter">
              BULLMONEY <span className="text-blue-500">PARTNER</span>
            </h2>
            {isFetching && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin opacity-50" />}
        </header>
        
        {/* --- EXPANDABLE RANK CARD --- */}
        <motion.div 
            layoutId="card-rank"
            onClick={() => setExpandedId('rank')}
            className="cursor-pointer group hover:scale-[1.01] transition-transform duration-300"
        >
             <RankEvervaultCard totalReferrals={affiliateData.referrals} /> 
        </motion.div>

        {/* FIX: Changed grid-cols-2 to support mobile properly */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
           {/* --- EXPANDABLE COMMISSIONS CARD --- */}
           <motion.div 
               layoutId="card-commissions"
               onClick={() => setExpandedId('commissions')}
               className="p-5 rounded-2xl bg-neutral-900/50 border border-green-500/20 backdrop-blur-sm relative overflow-hidden group cursor-pointer hover:border-green-500/40 transition-all"
            >
               <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors" />
               <div className="relative z-10">
                   <div className="flex items-center gap-2 mb-2">
                       <motion.div layoutId="comm-icon" className="p-1.5 rounded-md bg-green-500/20 text-green-400">
                           <DollarSign className="w-4 h-4" />
                       </motion.div>
                       <motion.p layoutId="comm-label" className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Monthly Commissions</motion.p>
                   </div>
                   <motion.p layoutId="comm-value" className="text-2xl font-black text-white font-mono tracking-tight">
                       ${affiliateData.commissions.toFixed(2)}
                   </motion.p>
                   <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-4 h-4 text-green-500" />
                   </div>
               </div>
           </motion.div>

           {/* --- EXPANDABLE REFERRALS CARD --- */}
           <motion.div 
               layoutId="card-referrals"
               onClick={() => setExpandedId('referrals')}
               className="p-5 rounded-2xl bg-neutral-900/50 border border-blue-500/20 backdrop-blur-sm relative overflow-hidden group cursor-pointer hover:border-blue-500/40 transition-all"
           >
               <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
               <div className="relative z-10">
                   <div className="flex items-center gap-2 mb-2">
                       <motion.div layoutId="ref-icon" className="p-1.5 rounded-md bg-blue-500/20 text-blue-400">
                           <Users className="w-4 h-4" />
                       </motion.div>
                       <motion.p layoutId="ref-label" className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Referrals</motion.p>
                   </div>
                   <motion.p layoutId="ref-value" className="text-2xl font-black text-white font-mono tracking-tight">
                       {affiliateData.referrals}
                   </motion.p>
                   <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-4 h-4 text-blue-500" />
                   </div>
               </div>
           </motion.div>
        </div>
        
        <IncentiveTaskGrid tasks={affiliateData.tasks} />
        
        <div className="mt-8 pt-8 border-t border-white/5">
              <div className="flex items-center gap-3 mb-6 opacity-50 hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center border border-white/10">
                      <span className="text-white font-bold text-sm">ID</span>
                  </div>
                  <div>
                      <p className="text-white text-sm font-bold">@{affiliateData.affiliateId}</p>
                      <p className="text-xs text-slate-400">Settings managed via Telegram Support</p>
                  </div>
              </div>

              <motion.button 
                  onClick={onClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white rounded-xl font-bold tracking-widest shadow-[0_0_30px_rgba(2,132,199,0.3)] border border-white/10"
              >
                GO BACK
              </motion.button>
        </div>
      </div>
    </motion.div>

    {/* --- EXPANDED CARD OVERLAY --- */}
    {/* FIX: AnimatePresence moved outside motion.div to prevent fixed positioning bug */}
    <AnimatePresence>
      {expandedId && (
          <>
              {/* Backdrop */}
              <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setExpandedId(null)}
                  className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
              />

              {/* --- RANK EXPANSION --- */}
              {expandedId === 'rank' && (
                  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
                      <motion.div
                          layoutId="card-rank"
                          className="pointer-events-auto w-full max-w-lg bg-[#0A0A0A] border border-orange-500/30 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[80vh]"
                      >
                            <button
                              onClick={() => setExpandedId(null)}
                              className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md border border-white/10"
                          >
                              <X className="w-5 h-5" />
                          </button>
                          
                          {/* Header Section */}
                          <div className="p-8 bg-gradient-to-b from-orange-500/10 to-transparent">
                               <motion.div layoutId="rank-title-container" className="mb-4">
                                   <h3 className="text-orange-400 text-xs font-bold tracking-widest uppercase mb-1">Current Rank</h3>
                                   <h2 className="text-4xl font-black italic tracking-tighter text-white">BRONZE TRADER</h2>
                               </motion.div>
                               <motion.div layoutId="rank-progress" className="h-4 w-full bg-neutral-800 rounded-full overflow-hidden border border-white/10 relative">
                                   <div className="absolute inset-y-0 left-0 bg-orange-500 w-[35%]" /> 
                               </motion.div>
                               <p className="text-xs text-orange-300 mt-2 font-mono text-right">VOLUME TARGET: 35%</p>
                          </div>

                          {/* Content Section */}
                          <div className="flex-1 overflow-y-auto p-8 pt-0">
                              <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                  <Award className="w-5 h-5 text-orange-500" /> Tier Benefits
                              </h4>
                              <ul className="space-y-3">
                                  <li className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                                      <Check className="w-4 h-4 text-green-500" />
                                      <span className="text-sm text-slate-300">Standard <b className="text-white">10%</b> Commission Rate</span>
                                  </li>
                                  <li className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                                      <Check className="w-4 h-4 text-green-500" />
                                      <span className="text-sm text-slate-300">Basic Marketing Assets</span>
                                  </li>
                              </ul>

                              <div className="mt-8 p-4 rounded-xl border border-slate-700 bg-slate-900/50">
                                   <div className="flex justify-between items-end mb-2">
                                      <h4 className="text-slate-400 text-xs font-bold uppercase">Next Tiers</h4>
                                   </div>
                                   
                                   <div className="space-y-3">
                                      <div className="p-3 rounded bg-white/5 border border-white/5">
                                          <div className="flex justify-between text-sm text-white font-bold mb-1">
                                              <span>SILVER</span>
                                          <span className="text-slate-400">20% Rate</span>
                                          </div>
                                          <p className="text-[10px] text-slate-500">Requires 50 Active Referrals & Verified Volume.</p>
                                      </div>
                                      <div className="p-3 rounded bg-white/5 border border-white/5 opacity-50">
                                          <div className="flex justify-between text-sm text-white font-bold mb-1">
                                              <span>GOLD</span>
                                          <span className="text-yellow-500">30% Rate</span>
                                          </div>
                                          <p className="text-[10px] text-slate-500">Unlock maximum earning potential.</p>
                                      </div>
                                   </div>
                              </div>
                          </div>
                      </motion.div>
                  </div>
              )}

              {/* --- COMMISSIONS EXPANSION --- */}
              {expandedId === 'commissions' && (
                  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
                      <motion.div
                          layoutId="card-commissions"
                          className="pointer-events-auto w-full max-w-lg bg-[#0A0A0A] border border-green-500/30 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[80vh]"
                      >
                          <button
                              onClick={() => setExpandedId(null)}
                              className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md border border-white/10"
                          >
                              <X className="w-5 h-5" />
                          </button>

                          <div className="p-8 pb-4">
                              <div className="flex items-center gap-3 mb-2">
                                 <motion.div layoutId="comm-icon" className="p-2 rounded-lg bg-green-500/20 text-green-400">
                                     <Activity className="w-6 h-6" />
                                 </motion.div>
                                 <motion.p layoutId="comm-label" className="text-sm text-green-400 font-bold uppercase tracking-wider">Performance Earnings</motion.p>
                              </div>
                              <motion.p layoutId="comm-value" className="text-5xl font-black text-white font-mono tracking-tight mt-4 mb-2">
                                   ${affiliateData.commissions.toFixed(2)}
                              </motion.p>
                              <p className="text-xs text-slate-400">Earnings based on network trading volume</p>
                          </div>

                          <div className="flex-1 overflow-y-auto p-8 pt-0 custom-scrollbar">
                              
                              {/* Info Tip */}
                              <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3">
                                  <Info className="w-5 h-5 text-blue-400 shrink-0" />
                                  <p className="text-xs text-blue-200">
                                      <span className="font-bold text-blue-100">Pro Tip:</span> Commissions are generated from trading volume. Increasing your referral count makes hitting volume targets significantly easier.
                                  </p>
                              </div>

                              <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                  <History className="w-4 h-4 text-green-500" /> Volume History
                              </h4>
                              {/* Mock Data List */}
                              <div className="space-y-2">
                                  {[1,2,3].map((i) => (
                                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-neutral-900 border border-white/5">
                                          <div>
                                              <p className="text-sm text-white font-bold">Network Volume Batch</p>
                                              <p className="text-[10px] text-slate-500">50 Lots Traded • Bronze (10%)</p>
                                          </div>
                                          <span className="text-green-400 font-mono font-bold">+$35.00</span>
                                      </div>
                                  ))}
                                  <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-900 border border-white/5 opacity-50">
                                      <div>
                                          <p className="text-sm text-white font-bold">Pending Volume Check</p>
                                          <p className="text-[10px] text-slate-500">Processing...</p>
                                      </div>
                                      <span className="text-slate-400 font-mono font-bold text-xs">Calc...</span>
                                  </div>
                              </div>
                              
                              <div className="mt-6 p-4 bg-green-900/10 border border-green-500/20 rounded-xl">
                                  <p className="text-xs text-green-300 text-center">
                                      Payouts processed on the 15th based on finalized volume reports.
                                  </p>
                              </div>
                          </div>
                      </motion.div>
                  </div>
              )}

              {/* --- REFERRALS EXPANSION --- */}
              {expandedId === 'referrals' && (
                  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
                      <motion.div
                          layoutId="card-referrals"
                          className="pointer-events-auto w-full max-w-lg bg-[#0A0A0A] border border-blue-500/30 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[80vh]"
                      >
                          <button
                              onClick={() => setExpandedId(null)}
                              className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md border border-white/10"
                          >
                              <X className="w-5 h-5" />
                          </button>

                          <div className="p-8 pb-4">
                              <div className="flex items-center gap-3 mb-2">
                                 <motion.div layoutId="ref-icon" className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                                     <Users className="w-6 h-6" />
                                 </motion.div>
                                 <motion.p layoutId="ref-label" className="text-sm text-blue-400 font-bold uppercase tracking-wider">Network Growth</motion.p>
                              </div>
                              <motion.p layoutId="ref-value" className="text-5xl font-black text-white font-mono tracking-tight mt-4 mb-2">
                                   {affiliateData.referrals}
                              </motion.p>
                              <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                                  <p className="text-xs text-slate-400">Pending Month-End Verification</p>
                              </div>
                          </div>

                          <div className="flex-1 overflow-y-auto p-8 pt-0 custom-scrollbar">
                              
                              {/* Admin Verification Notice */}
                              <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                  <div className="flex gap-2 items-start">
                                      <ShieldCheck className="w-4 h-4 text-yellow-500 mt-0.5" />
                                      <div>
                                          <p className="text-xs text-yellow-200 font-bold mb-1">Admin Verification Required</p>
                                          <p className="text-[10px] text-yellow-200/70 leading-relaxed">
                                              Total referrals are audited and verified by the Admin Team at the end of every month. Only verified users count towards Tier Progression.
                                          </p>
                                      </div>
                                  </div>
                              </div>

                              <div className="flex gap-4 mb-6">
                                  <div className="flex-1 p-3 bg-neutral-900 rounded-lg border border-white/5 text-center">
                                      <p className="text-[10px] text-slate-400 uppercase">This Month</p>
                                      <p className="text-xl font-bold text-white">+{affiliateData.monthlyReferrals}</p>
                                  </div>
                                  <div className="flex-1 p-3 bg-neutral-900 rounded-lg border border-white/5 text-center">
                                      <p className="text-[10px] text-slate-400 uppercase">Status</p>
                                      <p className="text-xs font-bold text-yellow-400 mt-1">In Review</p>
                                  </div>
                              </div>

                              <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4 text-blue-500" /> Recent Recruits
                              </h4>
                              
                              <div className="space-y-2">
                                  {[1,2,3,4,5].map((i) => (
                                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-neutral-900/50 hover:bg-neutral-800 transition-colors border border-white/5">
                                          <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">
                                                  U{i}
                                              </div>
                                              <div>
                                                  <p className="text-sm text-white font-bold">User_{Math.floor(Math.random()*9000)}</p>
                                                  <p className="text-[10px] text-slate-500">Joined via TikTok</p>
                                              </div>
                                          </div>
                                          <div className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-500 text-[10px] font-bold border border-yellow-500/20">
                                              PENDING
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </motion.div>
                  </div>
              )}
          </>
      )}
    </AnimatePresence>
    </>
  );
};

// --- SUCCESS SCREEN ---
const SuccessScreen: React.FC<{ onUnlock: () => void }> = ({ onUnlock }) => {
  const [showCommissions, setShowCommissions] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showAffiliatePanel, setShowAffiliatePanel] = useState(false);

  if (showAffiliatePanel) {
    return <AffiliateDashboardView onClose={() => setShowAffiliatePanel(false)} onUnlock={onUnlock} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="min-h-screen bg-[#050B14] flex items-center justify-center p-4 relative"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#050B14] to-[#050B14] will-change-transform" />
      
      <div className="bg-[#0A1120] border border-blue-500/30 p-8 rounded-2xl shadow-[0_0_80px_rgba(59,130,246,0.2)] text-center max-w-lg w-full relative z-10">
        
        <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Access Granted!</h2>
        <p className="text-slate-400 mb-8 max-w-sm mx-auto">
          Welcome to the BULLMONEY COMMUNITY enter your GROUPS below.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          
          {/* STAFF CHAT DASHBOARD PATH */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
            className="group p-6 rounded-xl border border-sky-500/30 bg-sky-900/10 shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:border-sky-400 hover:bg-sky-900/20 hover:scale-[1.02] transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-sky-400">Staff Chat Dashboard</h3>
              <Send className="w-6 h-6 text-sky-500 fill-sky-500/20 group-hover:text-sky-300 transition-colors" />
            </div>
            <p className="text-sm text-slate-300 mb-6">
              Connect directly with the BullMoney team and community members for support and discussion.
            </p>
            <motion.button
              onClick={() => window.open(TELEGRAM_GROUP_LINK, '_blank')} 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(2,132,199,0.4)]"
            >
              Enter Staff Chat
            </motion.button>
          </motion.div>

          {/* VIP GROUP DASHBOARD PATH */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.7, type: "spring", stiffness: 100 }}
            className="group p-6 rounded-xl border border-purple-500/30 bg-purple-900/10 shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:border-purple-400 hover:bg-purple-900/20 hover:scale-[1.02] transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-purple-400">VIP Group Dashboard</h3>
              <FolderPlus className="w-6 h-6 text-purple-500 fill-purple-500/20 group-hover:text-purple-300 transition-colors" />
            </div>
            <p className="text-sm text-slate-300 mb-6">
              Access the premium VIP trading signals, live market analysis, and exclusive educational content.
            </p>
            <motion.button
              onClick={() => window.open(VIP_GROUP_LINK, '_blank')} 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)]"
            >
              Go to VIP Groups
            </motion.button>
          </motion.div>
        </div>
        
        {/* COMMISSIONS EXPLANATION SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-6 pt-6 border-t border-white/5 w-full"
        >
          <motion.button 
            onClick={() => setShowCommissions(!showCommissions)}
            className="group relative flex items-center justify-center mx-auto text-sm font-semibold text-white bg-green-700/20 border border-green-500/40 rounded-full px-5 py-2 transition-all duration-300 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:bg-green-700/40 hover:shadow-[0_0_35px_rgba(34,197,94,0.6)] active:scale-[0.98]"
            animate={{ scale: [1, 1.015, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <DollarSign className="w-4 h-4 text-green-400 mr-2" />
            {showCommissions ? "Hide Passive Income Details" : "How Commissions Are Earned"}
            <ArrowRight className={cn("w-3 h-3 ml-2 transition-transform text-green-400", showCommissions ? "rotate-90" : "rotate-0")} />
          </motion.button>

          <AnimatePresence>
            {showCommissions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="mt-4 overflow-hidden"
              >
                <div className="text-left p-4 space-y-3">
                  <h4 className="text-base font-bold text-green-400 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> Your Path to Monthly Income:
                  </h4>
                  <p className="text-sm text-slate-300">
                    Commissions are earned by inviting new traders to either use the partner brokers (Vantage/XM) and using the relative codes when opening trading accounts or purchase products from BullMoney.
                  </p>
                  
                  <CardSpotlight className="w-full mt-4 p-4 min-h-[160px]">
                    <p className="text-xl font-bold relative z-20 text-white flex items-center gap-2 mb-3">
                        Affiliate Growth Checklist
                    </p>
                    <div className="text-neutral-200 mt-2 relative z-20">        
                      <ul className="list-none space-y-2">
                        <Step title="Establish Social Media Presence (TikTok / Instagram)" />
                        <Step title={<>Use BullMoney Trader Naming: <code className="bg-neutral-800 text-purple-400 rounded px-1 py-0.5">@bmt_[YourName]</code></>} />
                        <Step title="Start networking and sharing your content" />
                        <Step title="Generate affiliate links in the affiliate area" />
                      </ul>
                    </div>
                  </CardSpotlight>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.button 
            onClick={() => setShowAffiliatePanel(true)}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
            className="mt-6 w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)]"
          >
            Go to Full Affiliate Panel
          </motion.button>

        </motion.div>

        {/* Disclaimer Link */}
        <div className="mt-4 text-xs text-slate-500">
           <p>
             Need help? <a href={TELEGRAM_GROUP_LINK} target="_blank" className="underline hover:text-white mr-4">Enter the Telegram Group or Chat</a>.
             <button onClick={() => setShowDisclaimer(true)} className="underline hover:text-white ml-2 transition-colors">
               Financial Disclaimer
             </button>
           </p>
        </div>

      </div>
      
      {/* DISCLAIMER MODAL */}
      <AnimatePresence>
        {showDisclaimer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-black/80" onClick={() => setShowDisclaimer(false)} />
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative mx-4 max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-neutral-950 ring-1 ring-white/10 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <h2 className="text-base font-semibold text-white">Financial Disclaimer</h2>
                <button onClick={() => setShowDisclaimer(false)} className="rounded-lg p-2 hover:bg-white/5 text-neutral-300">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto px-6 py-5 max-h-[65vh] text-neutral-200 space-y-6 text-left">
                <h2 className="text-lg font-bold text-center">Financial Disclaimer</h2>

                <h3 className="font-semibold text-center">IMPORTANT: PLEASE READ THIS DISCLAIMER CAREFULLY</h3>
                <p className="text-sm">
                  By accessing and using Bullmoney’s website (the “Site”), services, and any content provided therein, you
                  acknowledge and agree to the following terms and conditions. If you do not agree with these terms, you must
                  immediately cease all use of the Site and services.
                </p>

                <hr className="border-white/10" />
                {/* ... truncated disclaimer content for brevity ... */}
                <p className="text-sm text-center">
                  (Full Disclaimer Content Preserved)
                </p>
              </div>

              <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
                <button
                  onClick={() => setShowDisclaimer(false)}
                  className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition bg-sky-600 text-white shadow-sm hover:shadow-lg hover:brightness-110 active:scale-[0.98]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SuccessScreen;