"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js'; 
import {
  Users, Search, Calendar, CheckCircle2,
  ArrowLeft, RefreshCw, Download,
  Shield, TrendingUp, Lock, AlertTriangle, Tag, AtSign,
  X, Copy, Activity, DollarSign, CreditCard
} from 'lucide-react';
import { cn } from "@/lib/utils"; 
import { motion, AnimatePresence } from "framer-motion";

// --- SUPABASE SETUP ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!; 
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- TYPES ---
interface Recruit {
  id: string | number;
  email: string;
  created_at: string;
  mt5_id: string | null;
  affiliate_code: string | null; 
  referred_by_code: string | null; 
  task_broker_verified?: boolean; 
  status?: 'Active' | 'Pending'; 
}

interface DashboardStats {
  total: number;
  active: number;
  pending: number;
  conversionRate: string;
}

// --- HELPERS ---
const maskEmail = (email: string) => {
  if (!email) return 'Unknown';
  const [name, domain] = email.split('@');
  if (!name || !domain) return 'Unknown';
  if (name.length <= 3) return `${name}***@${domain}`;
  return `${name.slice(0, 3)}***${name.slice(-1)}@${domain}`;
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
};

const formatTime = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit'
    });
};

const formatId = (id: string | number) => {
  if (!id) return '---';
  const strId = String(id);
  return strId.length > 8 ? strId.slice(0, 8) : strId;
};

// --- MAIN COMPONENT ---
export default function AffiliateRecruitsDashboard({ onBack }: { onBack: () => void }) {
  const [recruits, setRecruits] = useState<Recruit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false); 
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'All' | 'Active' | 'Pending'>('All');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedRecruit, setSelectedRecruit] = useState<Recruit | null>(null); // FOR EXPANSION
  
  const [myTrackingCode, setMyTrackingCode] = useState<string>('Loading...');

  const [stats, setStats] = useState<DashboardStats>({
    total: 0, active: 0, pending: 0, conversionRate: '0%'
  });

  // --- CHECK AUTH & FETCH DATA ---
  const checkAuthAndLoad = async (isPolling = false) => {
    if (!isPolling) setLoading(true);
    setErrorMsg(null);
    
    try {
      const savedSession = localStorage.getItem("bullmoney_session");
      if (!savedSession) {
        setIsAuthorized(false);
        if (!isPolling) setLoading(false);
        return;
      }

      setIsAuthorized(true);
      const session = JSON.parse(savedSession);
      const userId = session.id;

      let codeToSearch = myTrackingCode;
      
      if (!isPolling || myTrackingCode === 'Loading...') {
        const { data: userData, error: userError } = await supabase
          .from('recruits')
          .select('affiliate_code')
          .eq('id', userId)
          .single();

        if (userError || !userData?.affiliate_code) {
          setMyTrackingCode('No Code Found');
          setRecruits([]);
          if (!isPolling) setLoading(false);
          return;
        }

        codeToSearch = userData.affiliate_code;
        setMyTrackingCode(codeToSearch);
      }

      const { data, error } = await supabase
        .from('recruits')
        .select('*')
        .eq('referred_by_code', codeToSearch) 
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const processed: Recruit[] = data.map((item: any) => {
           const isActive = item.task_broker_verified || (item.mt5_id && String(item.mt5_id).length > 3);
           return {
                ...item,
                id: item.id, 
                affiliate_code: item.affiliate_code, 
                referred_by_code: item.referred_by_code,
                status: isActive ? 'Active' : 'Pending',
            };
        });

        setRecruits(processed);

        const total = processed.length;
        const active = processed.filter(r => r.status === 'Active').length;
        setStats({
          total,
          active,
          pending: total - active,
          conversionRate: total > 0 ? `${((active / total) * 100).toFixed(1)}%` : '0%'
        });
      }
    } catch (err: any) {
      console.error("Error loading recruits:", err);
      if (!isPolling) setErrorMsg("Could not load affiliate data.");
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthAndLoad(false);
    const intervalId = setInterval(() => checkAuthAndLoad(true), 10000); 
    return () => clearInterval(intervalId);
  }, []);

  // --- FILTER LOGIC ---
  const filteredRecruits = recruits.filter(recruit => {
    const sTerm = searchTerm.toLowerCase();
    const emailMatch = recruit.email.toLowerCase().includes(sTerm);
    const idMatch = String(recruit.mt5_id || '').includes(sTerm); 
    const codeMatch = String(recruit.affiliate_code || '').toLowerCase().includes(sTerm);
    const matchesSearch = emailMatch || idMatch || codeMatch;
    const matchesFilter = filter === 'All' || recruit.status === filter;
    return matchesSearch && matchesFilter;
  });

  // --- UNAUTHORIZED STATE ---
  if (!loading && !isAuthorized) {
    return (
      <div className="min-h-screen bg-[#050B14] flex flex-col items-center justify-center p-4">
        <div className="bg-neutral-900 border border-red-900/50 p-8 rounded-2xl max-w-md w-full text-center">
          <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
          <button onClick={onBack} className="w-full py-3 bg-white text-black font-bold rounded mt-4">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050B14] text-white font-sans selection:bg-blue-500/30">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8 relative z-10">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <button onClick={onBack} className="flex items-center text-slate-400 hover:text-white mb-2 transition-colors text-sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Overview
            </button>
            <h1 className="text-3xl font-black tracking-tighter text-white">
              MY <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">RECRUITS</span>
            </h1>
            
            <div className="flex items-center gap-3 mt-3">
              <p className="text-slate-400 text-sm">Tracking data for Code:</p>
              <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded text-blue-300 text-sm font-bold font-mono shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                <Tag className="w-3.5 h-3.5" />
                {myTrackingCode}
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button onClick={() => checkAuthAndLoad(false)} className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition-all">
              <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-900/20">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </header>

        {/* ERROR MSG */}
        {errorMsg && (
            <div className="mb-8 p-4 rounded-xl bg-red-950/20 border border-red-500/20 flex items-center gap-3 text-red-200">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{errorMsg}</p>
            </div>
        )}

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Recruits" value={stats.total} icon={Users} trend="Lifetime Total" color="blue" />
          <StatCard title="Active Traders" value={stats.active} icon={CheckCircle2} trend="Verified / Linked" color="green" />
          <StatCard title="Pending" value={stats.pending} icon={ClockIcon} trend="Awaiting Action" color="orange" />
          <StatCard title="Conversion" value={stats.conversionRate} icon={TrendingUp} trend="Active Rate" color="purple" />
        </div>

        {/* LIST SECTION */}
        <div className="bg-neutral-900/60 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          
          {/* Controls */}
          <div className="p-4 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Search recruits..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
               {(['All', 'Active', 'Pending'] as const).map((f) => (
                 <button
                   key={f}
                   onClick={() => setFilter(f)}
                   className={cn(
                     "px-4 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap",
                     filter === f ? "bg-white text-black border-white" : "text-slate-400 border-white/10 hover:text-white"
                   )}
                 >
                   {f}
                 </button>
               ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-xs uppercase text-slate-400 font-medium">
                  <th className="p-4 pl-6">Recruit</th>
                  <th className="p-4">Referred By</th>
                  <th className="p-4">Date Joined</th>
                  <th className="p-4">MT5 ID</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading && recruits.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading affiliate data...</td></tr>
                ) : filteredRecruits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center opacity-50">
                        <Users className="w-12 h-12 text-slate-500 mb-4" />
                        <h3 className="text-lg font-bold text-white">No Recruits Found</h3>
                        <p className="text-sm text-slate-400">
                          {myTrackingCode === 'Loading...' ? 'Checking...' : `No one has used code "${myTrackingCode}" yet.`}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecruits.map((recruit) => (
                    <motion.tr 
                        key={recruit.id} 
                        layoutId={`recruit-row-${recruit.id}`}
                        onClick={() => setSelectedRecruit(recruit)}
                        className="group hover:bg-white/[0.05] transition-colors cursor-pointer active:bg-white/[0.08]"
                    >
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <motion.div layoutId={`avatar-${recruit.id}`} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 text-xs font-bold text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            {recruit.email.charAt(0).toUpperCase()}
                          </motion.div>
                          <div>
                            <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                              {maskEmail(recruit.email)}
                            </p>
                            <p className="text-[10px] text-slate-500">ID: {formatId(recruit.id)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="flex items-center gap-1 text-xs text-blue-300 bg-blue-500/10 w-fit px-2 py-0.5 rounded border border-blue-500/20">
                          <AtSign className="w-3 h-3" />
                          {recruit.referred_by_code || 'Unknown'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-400">{formatDate(recruit.created_at)}</td>
                      <td className="p-4">
                        <span className={cn(
                          "font-mono text-xs px-2 py-1 rounded border",
                          recruit.mt5_id ? "bg-blue-500/10 text-blue-300 border-blue-500/20" : "bg-white/5 text-slate-600 border-white/5"
                        )}>
                           {recruit.mt5_id || 'Unlinked'}
                        </span>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={recruit.status || 'Pending'} />
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- EXPANDED OVERLAY --- */}
      <AnimatePresence>
        {selectedRecruit && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             {/* Backdrop */}
             <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedRecruit(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
             />

            {/* Card */}
            <motion.div 
              layoutId={`recruit-row-${selectedRecruit.id}`}
              className="relative w-full max-w-2xl bg-[#0F0F0F] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Close Button */}
                <button 
                  onClick={() => setSelectedRecruit(null)}
                  className="absolute top-4 right-4 z-20 p-2 bg-black/40 hover:bg-black/80 rounded-full text-white border border-white/10 transition-colors"
                >
                   <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="p-8 pb-6 bg-gradient-to-b from-neutral-800/50 to-transparent border-b border-white/5">
                    <div className="flex items-start gap-5">
                         <motion.div layoutId={`avatar-${selectedRecruit.id}`} className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-blue-900/40">
                            {selectedRecruit.email.charAt(0).toUpperCase()}
                         </motion.div>
                         <div className="flex-1 pt-1">
                             <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-2xl font-bold text-white">{maskEmail(selectedRecruit.email)}</h2>
                                <StatusBadge status={selectedRecruit.status || 'Pending'} />
                             </div>
                             <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                                 <span className="flex items-center gap-1"><Tag className="w-3 h-3"/> ID: {selectedRecruit.id}</span>
                                 <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> Joined: {formatDate(selectedRecruit.created_at)}</span>
                             </div>
                             
                             <div className="flex gap-2">
                                <button className="px-3 py-1.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-white font-medium flex items-center gap-2">
                                    <Copy className="w-3 h-3" /> Copy ID
                                </button>
                                <button className="px-3 py-1.5 rounded bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-xs text-blue-300 font-medium flex items-center gap-2">
                                    <Activity className="w-3 h-3" /> View Activity
                                </button>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-8 pt-6">
                    
                    {/* Journey Timeline */}
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Recruit Journey</h3>
                        

[Image of affiliate marketing customer journey map]

                        <div className="relative pl-4 space-y-8 border-l border-white/10 ml-2">
                            {/* Step 1: Registered */}
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                <h4 className="text-white font-bold text-sm">Account Registered</h4>
                                <p className="text-xs text-slate-500 mt-1">
                                    User signed up using code <span className="text-blue-400">{selectedRecruit.referred_by_code}</span> on {formatDate(selectedRecruit.created_at)} at {formatTime(selectedRecruit.created_at)}.
                                </p>
                            </div>

                            {/* Step 2: Broker Connection */}
                            <div className="relative">
                                <div className={cn(
                                    "absolute -left-[21px] top-1 w-3 h-3 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]",
                                    selectedRecruit.mt5_id ? "bg-green-500" : "bg-neutral-700 border border-white/20"
                                )} />
                                <h4 className={cn("font-bold text-sm", selectedRecruit.mt5_id ? "text-white" : "text-slate-500")}>
                                    Broker Account Linked
                                </h4>
                                {selectedRecruit.mt5_id ? (
                                    <p className="text-xs text-slate-500 mt-1">
                                        MT5 ID <span className="text-green-400 font-mono">{selectedRecruit.mt5_id}</span> verified.
                                    </p>
                                ) : (
                                    <p className="text-xs text-orange-400/80 mt-1 italic">
                                        Pending MT5 ID submission. User cannot trade yet.
                                    </p>
                                )}
                            </div>

                            {/* Step 3: Trading Active */}
                            <div className="relative">
                                <div className={cn(
                                    "absolute -left-[21px] top-1 w-3 h-3 rounded-full",
                                    selectedRecruit.status === 'Active' ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-neutral-700 border border-white/20"
                                )} />
                                <h4 className={cn("font-bold text-sm", selectedRecruit.status === 'Active' ? "text-white" : "text-slate-500")}>
                                    Active Trading
                                </h4>
                                <p className="text-xs text-slate-500 mt-1">
                                    {selectedRecruit.status === 'Active' 
                                      ? "User is actively trading. Commissions are generating."
                                      : "Waiting for first deposit and trade execution."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Financial Estimates (Mock Data) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-neutral-900 border border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 rounded bg-green-500/10 text-green-400">
                                    <CreditCard className="w-4 h-4" />
                                </div>
                                <span className="text-xs text-slate-400 font-bold uppercase">BULLMONEY RANDOM LOTS BEING TRADED </span>
                            </div>
                            <p className="text-2xl font-mono text-white">
                                {selectedRecruit.status === 'Active' ? (Math.random() * 50).toFixed(2) : "0.00"} <span className="text-sm text-slate-500">Lots</span>
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-neutral-900 border border-white/5">
                             <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 rounded bg-blue-500/10 text-blue-400">
                                    <DollarSign className="w-4 h-4" />
                                </div>
                                <span className="text-xs text-slate-400 font-bold uppercase">DOLLARS RANDOMLY BEING TRADED IN BULLMONEY</span>
                            </div>
                            <p className="text-2xl font-mono text-white">
                                ${selectedRecruit.status === 'Active' ? (Math.random() * 15).toFixed(2) : "0.00"}
                            </p>
                        </div>
                    </div>

                    {/* Footer Warning */}
                    <div className="mt-6 p-3 rounded-lg bg-orange-500/5 border border-orange-500/10 flex gap-3 items-start">
                        <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-orange-200/70 leading-relaxed">
                            Financial data is estimated based on lot size. Final payouts are calculated on the 15th of every month. Ensure this recruit maintains active status to qualify for tiers.
                        </p>
                    </div>

                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// --- SUB COMPONENTS ---
const ClockIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => {
  const colors: any = {
    blue: "text-blue-400 bg-blue-500/10", green: "text-green-400 bg-green-500/10",
    orange: "text-orange-400 bg-orange-500/10", purple: "text-purple-400 bg-purple-500/10",
  };
  return (
    <div className="bg-neutral-900/40 border border-white/5 p-5 rounded-xl">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-2xl font-black text-white">{value}</h3>
        </div>
        <div className={cn("p-2 rounded-lg", colors[color])}><Icon className="w-5 h-5" /></div>
      </div>
      <p className="text-xs text-slate-500">{trend}</p>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const isActive = status === 'Active';
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border",
      isActive ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
    )}>
      {isActive ? <Shield className="w-3 h-3" /> : <ClockIcon className="w-3 h-3" />}
      {status}
    </div>
  );
};