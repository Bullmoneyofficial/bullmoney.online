"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Save, X, LogOut, Users, DollarSign,
  BarChart3, AtSign, Loader2, Lock, ShieldCheck, ChevronRight, AlertTriangle, RefreshCw
} from "lucide-react";

// --- 1. SUPABASE CONFIGURATION ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);



// =========================================
// 3. TYPES & LOGIC
// =========================================

type AffiliateUser = {
  id: string;
  created_at: string;
  email: string; 
  affiliate_code: string; 
  total_referred_manual: number | null; 
  commission_balance: number;
  social_handle: string;
  task_broker_verified: boolean;
  task_social_verified: boolean;
  referred_by?: string; 
  referrals_calculated: number;
  referrals_display: number;
};

type AffiliateContextType = {
  isAdmin: boolean;
  isLoading: boolean;
  affiliates: AffiliateUser[];
  login: (u: string, p: string) => boolean;
  skipLogin: () => void;
  logout: () => void;
  updateAffiliate: (id: string, data: Partial<AffiliateUser>) => Promise<void>;
  refreshData: () => void;
};

const AffiliateContext = createContext<AffiliateContextType | undefined>(undefined);

export function AffiliateProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [affiliates, setAffiliates] = useState<AffiliateUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    if (!isAdmin || isLoading) return; 
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('recruits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const allRecruits = data as any[];

      const processedData: AffiliateUser[] = allRecruits.map(user => {
        const calculatedCount = allRecruits.filter(r => r.referred_by === user.affiliate_code).length;
        const manualCount = user.total_referred_manual;
        const displayCount = (manualCount !== null && manualCount !== undefined) ? manualCount : calculatedCount;

        return {
          ...user,
          affiliate_code: user.affiliate_code || '',
          referrals_calculated: calculatedCount,
          referrals_display: displayCount, 
          commission_balance: user.commission_balance || 0,
          social_handle: user.social_handle || '',
          email: user.email || '',
          task_broker_verified: user.task_broker_verified || false,
          task_social_verified: user.task_social_verified || false,
        };
      });

      setAffiliates(processedData);
    } catch (error: any) {
      console.error("Error fetching affiliates:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isAdmin) {
      interval = setInterval(() => { fetchData(); }, 1000); 
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isAdmin]); 

  const login = (u: string, p: string) => {
    if (u === "MR.BULLMONEY" && p === "9D6W5D6SD6S7DA6D5D5ADS5A6XVXASXR6723RE627EDGED") {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const skipLogin = () => setIsAdmin(true);
  const logout = () => { setIsAdmin(false); setAffiliates([]); };

  const updateAffiliate = async (id: string, updates: Partial<AffiliateUser>) => {
    const { referrals_calculated, referrals_display, ...dbUpdates } = updates as any;
    const { error } = await supabase.from('recruits').update(dbUpdates).eq('id', id);
    if (error) throw error;
    setAffiliates(prev => prev.map(a => {
      if (a.id === id) {
        const merged = { ...a, ...updates };
        const newManual = updates.total_referred_manual;
        merged.referrals_display = (newManual !== undefined && newManual !== null) ? newManual : a.referrals_calculated;
        return merged;
      }
      return a;
    }));
  };

  return (
    <AffiliateContext.Provider value={{ 
      isAdmin, isLoading, affiliates, login, skipLogin, logout, updateAffiliate, refreshData: fetchData 
    }}>
      {children}
    </AffiliateContext.Provider>
  );
}

const useAffiliate = () => {
  const context = useContext(AffiliateContext);
  if (!context) throw new Error("useAffiliate must be used within AffiliateProvider");
  return context;
};

// =========================================
// 4. COMPONENTS
// =========================================

// --- A. ACCESS PORTAL (Login) ---
function AccessPortal() {
  const { login } = useAffiliate();
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(username.trim(), password.trim());
    if (!success) setError("Access Denied. Invalid credentials.");
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      
      
      <AnimatePresence mode="wait">
        {!showLogin ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.5 }}
            className="relative z-10 flex flex-col items-center"
          >
            <div className="mb-12 text-center space-y-4">
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-700 bg-slate-900/50 backdrop-blur-sm text-slate-300 text-xs tracking-widest uppercase font-semibold"
              >
                <ShieldCheck className="w-3 h-3 text-sky-500" />
                Restricted Area
              </motion.div>
              <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 tracking-tighter">
                HEADQUARTERS
              </h1>
            </div>

            <motion.button
              onClick={() => setShowLogin(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative w-64 h-64 flex items-center justify-center rounded-full bg-slate-950 border border-slate-800 shadow-2xl cursor-pointer outline-none"
            >
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full border border-sky-500/30"
              />
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-slate-900 to-black flex items-center justify-center border border-slate-700 shadow-[0_0_60px_rgba(255, 255, 255,0.15)] group-hover:shadow-[0_0_100px_rgba(255, 255, 255,0.4)] transition-shadow duration-500">
                <div className="text-center space-y-2">
                  <Lock className="w-10 h-10 text-white mx-auto mb-2 group-hover:text-sky-400 transition-colors" />
                  <p className="text-sm font-bold text-white tracking-[0.2em] group-hover:text-sky-300 transition-colors">ACCESS</p>
                </div>
              </div>
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="w-full max-w-md relative z-10"
          >
            <div className="rounded-3xl overflow-hidden border border-slate-800 bg-slate-950/80 backdrop-blur-xl shadow-2xl">
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold text-white">Identify</h3>
                  <button onClick={() => setShowLogin(false)} className="text-slate-500 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Username</label>
                    <input
                      autoFocus
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-black/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-sky-500 focus:bg-slate-900/50 outline-none transition-all"
                      placeholder="Enter ID"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-sky-500 focus:bg-slate-900/50 outline-none transition-all"
                      placeholder="Enter Passkey"
                    />
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg p-3">
                      {error}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-[0_0_30px_rgba(2,132,199,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                  >
                    Authenticate
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>

                  

                  
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- B. EDIT USER MODAL ---
function EditUserModal({ user, onClose }: { user: AffiliateUser | null; onClose: () => void }) {
  const { updateAffiliate } = useAffiliate();
  const [formData, setFormData] = useState<Partial<AffiliateUser>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        commission_balance: user.commission_balance,
        affiliate_code: user.affiliate_code,
        total_referred_manual: user.total_referred_manual, 
        social_handle: user.social_handle,
        task_broker_verified: user.task_broker_verified,
        task_social_verified: user.task_social_verified,
      });
    }
  }, [user]);
const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const payload = {
        ...formData,
        commission_balance: Number(formData.commission_balance),
        // FIXED LOGIC BELOW:
        // 1. Changed = to ===
        // 2. Added (as any) to handle the temporary string value from the form input
        total_referred_manual: 
          (formData.total_referred_manual as any) === '' || formData.total_referred_manual === null 
            ? null 
            : Number(formData.total_referred_manual)
      };
      
      await updateAffiliate(user.id, payload as any);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-[#0A1120] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h3 className="text-lg font-bold text-white">Edit Affiliate</h3>
            <p className="text-xs text-sky-400 font-mono mt-1">{user.email || 'No Email'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Commission ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white" />
                <input
                  name="commission_balance"
                  type="number"
                  step="0.01"
                  value={formData.commission_balance}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white focus:border-white outline-none font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Affiliate Code</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white" />
                <input
                  name="affiliate_code"
                  value={formData.affiliate_code || ''}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 py-2 text-white focus:border-white outline-none"
                />
              </div>
            </div>
            
            <div className="col-span-2 space-y-2 p-3 bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
               <div className="flex justify-between items-center mb-1">
                 <label className="text-xs font-bold text-sky-400 uppercase">Total Referrals</label>
                 <span className="text-[10px] text-slate-500 uppercase">
                    System Calc: {user.referrals_calculated}
                 </span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="relative flex-1">
                    <BarChart3 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-500" />
                    <input
                      name="total_referred_manual"
                      type="number"
                      placeholder={`Auto (${user.referrals_calculated})`}
                      value={formData.total_referred_manual ?? ''} 
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white focus:border-sky-500 outline-none font-mono placeholder-slate-600"
                    />
                 </div>
                 <div className="text-[10px] text-slate-500 w-24 leading-tight">
                   Leave empty to use system calculation.
                 </div>
               </div>
            </div>

            <div className="col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Social Handle</label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  name="social_handle"
                  value={formData.social_handle || ''}
                  onChange={handleChange}
                  placeholder="@username"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white focus:border-slate-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-3">
             <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Verification Status</label>
             <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Broker Verified</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="task_broker_verified" checked={!!formData.task_broker_verified} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
                </label>
             </div>
             <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Social Verified</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="task_social_verified" checked={!!formData.task_social_verified} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
                </label>
             </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800">Cancel</button>
            <button type="submit" disabled={isSaving} className="px-6 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// --- C. MAIN DASHBOARD ---
function AdminDashboard() {
  const { affiliates, logout, isLoading, refreshData } = useAffiliate();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<AffiliateUser | null>(null);

  const filteredAffiliates = affiliates.filter(user => 
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (user.affiliate_code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050B14] text-white p-6 pb-20">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
           <h1 className="text-2xl font-black tracking-tight">AFFILIATE <span className="text-sky-500">ADMIN</span></h1>
           <p className="text-slate-400 text-sm">Manage commissions, referrals, and user data.</p>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={refreshData} disabled={isLoading} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-slate-300 transition-all active:scale-95">
             <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
           </button>
           <button onClick={logout} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-semibold">
             <LogOut className="w-4 h-4" /> Logout
           </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mb-8">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-500 transition-colors" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by email or affiliate code..."
            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:bg-slate-900 transition-all shadow-xl"
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {isLoading && affiliates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-sky-500" />
            <p>Syncing Database...</p>
          </div>
        ) : filteredAffiliates.length === 0 ? (
          <div className="text-center py-20 text-slate-600">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No affiliates found matching &quot;{searchTerm}&quot;</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAffiliates.map((user) => (
              <motion.div 
                key={user.id}
                layoutId={user.id}
                className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 hover:border-sky-500/30 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-slate-300 font-bold border border-slate-700">
                       {(user.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                       <h4 className="font-bold text-white truncate max-w-[150px]" title={user.email}>{user.email || 'No Email'}</h4>
                       <p className="text-xs text-sky-400 font-mono">
                         {user.affiliate_code ? `@${user.affiliate_code}` : 'No Code'}
                       </p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-bold border ${user.task_broker_verified ? 'bg-white/10 text-white border-white/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                    {user.task_broker_verified ? 'VERIFIED' : 'PENDING'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-black/30 rounded-lg p-3 border border-slate-800/50">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Balance</p>
                    <p className="text-lg font-mono text-white">${user.commission_balance?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3 border border-slate-800/50 relative overflow-hidden">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Referrals</p>
                    <p className="text-lg font-mono text-white relative z-10">{user.referrals_display}</p>
                    {user.total_referred_manual !== null && user.total_referred_manual !== undefined && (
                      <div className="absolute top-1 right-2 text-[8px] text-sky-500 bg-sky-500/10 px-1 rounded border border-sky-500/20">MANUAL</div>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => setEditingUser(user)}
                  className="w-full py-2 bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-300 text-sm font-semibold rounded-lg transition-colors border border-slate-700 hover:border-sky-500"
                >
                  Edit Details
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {editingUser && (
          <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- 5. EXPORT WRAPPER ---
export default function AffiliateAdminPage() {
  return (
    <AffiliateProvider>
      <Main />
    </AffiliateProvider>
  );
}

function Main() {
  const { isAdmin } = useAffiliate();
  return isAdmin ? <AdminDashboard /> : <AccessPortal />;
}
