"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Users,
  Crown,
  Search,
  Edit3,
  Eye,
  Check,
  AlertCircle,
  Loader,
  Shield,
  Mail,
  Calendar,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  UserCheck,
  UserX,
  Lock,
  DollarSign,
  Hash,
} from 'lucide-react';
import { useUIState } from '@/contexts/UIStateContext';

interface User {
  id: string;
  email: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  is_vip: boolean;
  vip_updated_at?: string;
  created_at: string;
  phone?: string;
  telegram_username?: string;
  discord_username?: string;
  payment_screenshot_url?: string;
  id_document_url?: string;
  notes?: string;
  // Recruit-specific fields
  mt5_id?: string;
  affiliate_code?: string;
  referred_by_code?: string;
  social_handle?: string;
  task_broker_verified?: boolean;
  task_social_verified?: boolean;
  status?: string;
  commission_balance?: string;
  image_url?: string;
}

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [recruits, setRecruits] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'recruits' | 'vip'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [imageModal, setImageModal] = useState<{ url: string; title: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // UIState awareness - sync admin modal state
  const { setAdminModalOpen } = useUIState();
  
  // Sync with UIState when panel opens/closes
  useEffect(() => {
    setAdminModalOpen(isOpen);
    if (isOpen) {
      // Dispatch event so other components know admin panel is open
      window.dispatchEvent(new CustomEvent('adminPanelOpened'));
    } else {
      window.dispatchEvent(new CustomEvent('adminPanelClosed'));
    }
  }, [isOpen, setAdminModalOpen]);

  // Double-tap to close
  const [lastTap, setLastTap] = useState(0);
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      onClose();
    }
    setLastTap(now);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');

    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, action: 'login' }),
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('adminToken', data.token);
        
        // Also set bullmoney_session so CommunityQuickAccess can detect the admin
        // Admin users are always VIP
        localStorage.setItem('bullmoney_session', JSON.stringify({
          id: `admin_${Date.now()}`,
          email: email,
          isAdmin: true,
          is_vip: true, // Admin users have VIP access
          timestamp: Date.now(),
        }));
        
        console.log('✓ Admin authenticated:', email);
        fetchAllData();
      } else {
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch (error) {
      setLoginError('Connection error');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [usersRes, recruitsRes] = await Promise.all([
        fetch('/api/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, action: 'get_users' }),
        }),
        fetch('/api/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, action: 'get_recruits' }),
        }),
      ]);

      const usersData = await usersRes.json();
      const recruitsData = await recruitsRes.json();

      if (usersData.success) setUsers(usersData.users || []);
      if (recruitsData.success) setRecruits(recruitsData.recruits || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [email, password]);

  const toggleVipStatus = async (userId: string, currentStatus: boolean, isRecruit = false) => {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          action: 'toggle_vip',
          userId,
          isVip: !currentStatus,
          table: isRecruit ? 'recruits' : 'profiles',
        }),
      });

      const data = await response.json();
      if (data.success) {
        if (isRecruit) {
          setRecruits(recruits.map(r => r.id === userId ? { ...r, is_vip: !currentStatus } : r));
        } else {
          setUsers(users.map(u => u.id === userId ? { ...u, is_vip: !currentStatus } : u));
        }
        if (selectedUser?.id === userId) {
          setSelectedUser({ ...selectedUser, is_vip: !currentStatus });
        }
      }
    } catch (error) {
      console.error('Error toggling VIP:', error);
    }
  };

  const saveUserEdits = async (isRecruit = false) => {
    if (!selectedUser) return;
    setLoading(true);

    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          action: isRecruit ? 'update_recruit' : 'update_user',
          userId: selectedUser.id,
          updates: editForm,
        }),
      });

      const data = await response.json();
      if (data.success) {
        if (isRecruit) {
          setRecruits(recruits.map(r => r.id === selectedUser.id ? { ...r, ...editForm } : r));
        } else {
          setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...editForm } : u));
        }
        setSelectedUser({ ...selectedUser, ...editForm });
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(query) ||
      user.full_name?.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query)
    );
  });

  const filteredRecruits = recruits.filter(recruit => {
    const query = searchQuery.toLowerCase();
    return (
      recruit.email?.toLowerCase().includes(query) ||
      recruit.full_name?.toLowerCase().includes(query) ||
      (recruit as any).social_handle?.toLowerCase().includes(query) ||
      (recruit as any).mt5_id?.toLowerCase().includes(query)
    );
  });

  const vipUsers = users.filter(u => u.is_vip);
  const vipRecruits = recruits.filter(r => r.is_vip);

  // Check for saved session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken');
    if (savedToken && isOpen) {
      // Token exists, but we still need credentials for API calls
      // This is a simplified approach - in production use proper JWT
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="admin-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999998] bg-black/70 backdrop-blur-2xl"
        onClick={handleDoubleTap}
      />
      {/* Modal Container */}
      <motion.div
        key="admin-modal-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999999] flex items-center justify-center p-2 sm:p-3 md:p-4 pointer-events-none"
      >
        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-4xl md:max-w-5xl lg:max-w-6xl max-h-[93vh] sm:max-h-[92vh] bg-gradient-to-br from-zinc-900/98 via-zinc-800/98 to-zinc-900/98 backdrop-blur-2xl rounded-xl sm:rounded-2xl border border-white/50 shadow-2xl shadow-white/30 overflow-hidden flex flex-col pointer-events-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-2.5 sm:p-3 md:p-4 border-b border-white/30 flex-shrink-0 bg-gradient-to-r from-white/20 via-white/15 to-white/15">
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0 flex-1">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white flex-shrink-0 drop-shadow-[0_0_8px_rgba(255, 255, 255,0.6)]" />
              <h2 className="text-sm sm:text-base md:text-xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] truncate">Admin Panel</h2>
              {isAuthenticated && (
                <span className="text-[9px] sm:text-xs text-white bg-white/25 px-2 py-0.5 rounded-full flex-shrink-0 border border-white/40">
                  ✓ Auth
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-white/20 border border-transparent hover:border-white/30 rounded-lg transition-all flex-shrink-0 ml-2"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-white/60 hover:text-white" />
            </button>
          </div>

          {!isAuthenticated ? (
            /* Login Form */
            <div className="flex-1 flex items-center justify-center p-3 sm:p-6 md:p-8">
              <form onSubmit={handleLogin} className="w-full max-w-xs sm:max-w-sm space-y-4">
                <div className="text-center mb-6">
                  <Lock className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-white mb-3 drop-shadow-[0_0_12px_rgba(255, 255, 255,0.7)]" />
                  <h3 className="text-lg sm:text-xl font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">Admin Login</h3>
                  <p className="text-xs sm:text-sm text-white/90 mt-1">Enter your credentials</p>
                </div>

                {loginError && (
                  <div className="p-2 sm:p-3 bg-slate-700/50 border border-white/40 rounded-lg text-white text-xs sm:text-sm flex items-center gap-2">\n                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-white" />
                    <span className="line-clamp-2">{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="text-[11px] sm:text-xs text-white font-medium mb-1.5 block drop-shadow-[0_0_4px_rgba(255, 255, 255,0.4)]">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-900/80 border border-white/40 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]"
                    placeholder="admin@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] sm:text-xs text-white font-medium mb-1.5 block drop-shadow-[0_0_4px_rgba(255, 255, 255,0.4)]">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-900/80 border border-white/40 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-white to-white hover:from-white hover:to-white text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base shadow-lg shadow-white/20"
                >
                  {loading ? (
                    <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  ) : (
                    <>
                      <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Login</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* Admin Dashboard */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Tabs */}
              <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 border-b border-white/30 flex-shrink-0 overflow-x-auto scrollbar-hide bg-slate-900/50">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                    activeTab === 'users'
                      ? 'bg-white/30 border border-white/60 text-white shadow-lg shadow-white/20'
                      : 'text-slate-300 border border-transparent hover:bg-white/20 hover:border-white/40 hover:text-white'
                  }`}
                >
                  <Users className={`w-4 h-4 ${activeTab === 'users' ? 'text-white drop-shadow-[0_0_6px_rgba(255, 255, 255,0.6)]' : 'text-white'}`} />
                  <span>All Users ({users.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('recruits')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                    activeTab === 'recruits'
                      ? 'bg-white/30 border border-white/60 text-white shadow-lg shadow-white/20'
                      : 'text-slate-300 border border-transparent hover:bg-white/20 hover:border-white/40 hover:text-white'
                  }`}
                >
                  <UserCheck className={`w-4 h-4 ${activeTab === 'recruits' ? 'text-white drop-shadow-[0_0_6px_rgba(255, 255, 255,0.6)]' : 'text-white'}`} />
                  <span>Recruits ({recruits.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('vip')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                    activeTab === 'vip'
                      ? 'bg-indigo-500/30 border border-indigo-400/60 text-white shadow-lg shadow-indigo-500/20'
                      : 'text-slate-300 border border-transparent hover:bg-indigo-500/20 hover:border-indigo-500/40 hover:text-white'
                  }`}
                >
                  <Crown className={`w-4 h-4 ${activeTab === 'vip' ? 'text-indigo-300 drop-shadow-[0_0_6px_rgba(255, 255, 255,0.6)]' : 'text-indigo-400'}`} />
                  <span>VIP ({vipUsers.length + vipRecruits.length})</span>
                </button>

                <div className="flex-1" />

                <button
                  onClick={fetchAllData}
                  disabled={refreshing}
                  className="p-2 hover:bg-white/25 rounded-lg transition-all border border-transparent hover:border-white/40"
                >
                  <RefreshCw className={`w-4 h-4 text-white drop-shadow-[0_0_4px_rgba(255, 255, 255,0.5)] ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Search */}
              <div className="p-2 sm:p-3 border-b border-white/30 flex-shrink-0 bg-slate-900/30">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white drop-shadow-[0_0_4px_rgba(255, 255, 255,0.5)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by email, name, or username..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-white/40 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-h-0 overflow-hidden flex">
                {/* Users List */}
                <div className={`flex-1 overflow-y-auto overscroll-contain p-2 sm:p-3 ${selectedUser ? 'hidden sm:block sm:w-1/2 lg:w-2/5' : ''}`}>
                  <div className="space-y-2">
                    {(activeTab === 'vip' 
                      ? [...vipUsers, ...vipRecruits] 
                      : activeTab === 'recruits' 
                      ? filteredRecruits 
                      : filteredUsers
                    ).map((user) => {
                      const isRecruit = activeTab === 'recruits' || (activeTab === 'vip' && vipRecruits.some(r => r.id === user.id));
                      return (
                      <motion.div
                        key={`${isRecruit ? 'recruit' : 'user'}-${user.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3 bg-gradient-to-br from-white/10 via-white/5 to-zinc-900/30 hover:from-white/20 hover:via-white/10 hover:to-zinc-900/40 border rounded-lg cursor-pointer transition-all ${
                          selectedUser?.id === user.id
                            ? 'border-white/60 shadow-lg shadow-white/10'
                            : 'border-white/20 hover:border-white/40'
                        }`}
                        onClick={() => {
                          setSelectedUser({ ...user, _isRecruit: isRecruit } as any);
                          setEditForm(user);
                          setIsEditing(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${
                            isRecruit 
                              ? 'bg-gradient-to-br from-white to-indigo-500' 
                              : 'bg-gradient-to-br from-white to-white'
                          }`}>
                            {user.avatar_url || user.image_url ? (
                              <img src={user.avatar_url || user.image_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              user.email?.charAt(0).toUpperCase() || 'U'
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-white truncate">
                                {user.full_name || user.username || user.social_handle || 'User'}
                              </p>
                              {user.is_vip && (
                                <Crown className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 drop-shadow-[0_0_4px_rgba(255, 255, 255,0.6)]" />
                              )}
                              {isRecruit && (
                                <span className="text-[9px] bg-white/25 text-white px-1.5 py-0.5 rounded border border-white/30">
                                  Recruit
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-300 truncate">{user.email}</p>
                            {isRecruit && user.mt5_id && (
                              <p className="text-[10px] text-white/80 truncate drop-shadow-[0_0_3px_rgba(255, 255, 255,0.4)]">MT5: {user.mt5_id}</p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-white flex-shrink-0 drop-shadow-[0_0_4px_rgba(255, 255, 255,0.5)]" />
                        </div>
                      </motion.div>
                    )})}

                    {((activeTab === 'users' && filteredUsers.length === 0) || 
                      (activeTab === 'recruits' && filteredRecruits.length === 0) ||
                      (activeTab === 'vip' && vipUsers.length === 0 && vipRecruits.length === 0)) && (
                      <div className="text-center py-12 text-white">
                        <Users className="w-12 h-12 mx-auto mb-3 text-white drop-shadow-[0_0_10px_rgba(255, 255, 255,0.5)]" />
                        <p className="font-medium drop-shadow-[0_0_6px_rgba(255, 255, 255,0.3)]">No {activeTab} found</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* User Details Panel */}
                {selectedUser && (
                  <div className="flex-1 sm:w-1/2 lg:w-3/5 border-l border-white/20 overflow-y-auto overscroll-contain">
                    <div className="p-3 sm:p-4">
                      {/* Back button on mobile */}
                      <button
                        onClick={() => setSelectedUser(null)}
                        className="sm:hidden flex items-center gap-1.5 text-sm text-white hover:text-white mb-4 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back to list
                      </button>

                      {/* User Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-white to-white flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-white/30">
                            {selectedUser.avatar_url ? (
                              <img
                                src={selectedUser.avatar_url || selectedUser.image_url}
                                alt=""
                                className="w-full h-full rounded-full object-cover cursor-pointer ring-2 ring-white/50"
                                onClick={() => setImageModal({ url: (selectedUser.avatar_url || selectedUser.image_url)!, title: 'Profile Photo' })}
                              />
                            ) : (
                              <span className="drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">{selectedUser.email?.charAt(0).toUpperCase() || 'U'}</span>
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                              {selectedUser.full_name || selectedUser.username || selectedUser.social_handle || 'User'}
                            </h3>
                            <p className="text-sm text-slate-300">{selectedUser.email}</p>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {selectedUser.is_vip ? (
                                <span className="text-xs bg-indigo-500/25 text-indigo-300 px-2 py-0.5 rounded-full flex items-center gap-1 border border-indigo-400/40 shadow-sm shadow-indigo-500/20">
                                  <Crown className="w-3 h-3 drop-shadow-[0_0_4px_rgba(255, 255, 255,0.6)]" />
                                  VIP Member
                                </span>
                              ) : (
                                <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/30">
                                  Standard
                                </span>
                              )}
                              {(selectedUser as any)._isRecruit && (
                                <span className="text-xs bg-white/25 text-white px-2 py-0.5 rounded-full border border-white/40">
                                  Recruit
                                </span>
                              )}
                              {selectedUser.status && (
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                                  selectedUser.status === 'Active' 
                                    ? 'bg-white/25 text-white border-white/40'
                                    : selectedUser.status === 'Pending'
                                    ? 'bg-sky-500/25 text-sky-300 border-sky-400/40'
                                    : 'bg-slate-500/20 text-slate-300 border-slate-400/30'
                                }`}>
                                  {selectedUser.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleVipStatus(selectedUser.id, selectedUser.is_vip, (selectedUser as any)._isRecruit)}
                            className={`p-1.5 sm:p-2 rounded-lg transition-all font-semibold flex items-center gap-1.5 px-2.5 sm:px-3 whitespace-nowrap text-xs sm:text-sm ${
                              selectedUser.is_vip
                                ? 'bg-gradient-to-r from-slate-600 to-slate-500 text-white hover:from-slate-500 hover:to-slate-400 shadow-lg shadow-slate-500/30'
                                : 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-500 hover:to-indigo-400 shadow-lg shadow-indigo-500/30'
                            }`}
                            title={selectedUser.is_vip ? 'Remove VIP Status' : 'Make VIP'}
                          >
                            {selectedUser.is_vip ? (
                              <>
                                <UserX className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]" />
                                <span className="drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">Remove VIP</span>
                              </>
                            ) : (
                              <>
                                <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 drop-shadow-[0_0_6px_rgba(255, 255, 255,0.7)]" />
                                <span className="drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">Make VIP</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setIsEditing(!isEditing)}
                            className={`p-1.5 sm:p-2 rounded-lg transition-all flex items-center gap-1.5 px-2.5 sm:px-3 whitespace-nowrap text-xs sm:text-sm font-semibold ${
                              isEditing
                                ? 'bg-gradient-to-r from-white to-white text-white shadow-lg shadow-white/30'
                                : 'bg-slate-800/70 border border-white/40 text-white hover:bg-slate-700/70 hover:border-white/60'
                            }`}
                          >
                            <Edit3 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${isEditing ? 'drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]' : 'text-white drop-shadow-[0_0_4px_rgba(255, 255, 255,0.5)]'}`} />
                            <span>{isEditing ? 'Editing' : 'Edit'}</span>
                          </button>
                        </div>
                      </div>

                      {/* User Details / Edit Form */}
                      <div className="space-y-4">
                        {isEditing ? (
                          /* Edit Mode */
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs text-white font-medium mb-1.5 block drop-shadow-[0_0_3px_rgba(255, 255, 255,0.4)]">Full Name</label>
                                <input
                                  type="text"
                                  value={editForm.full_name || ''}
                                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                  className="w-full px-3 py-2 bg-slate-900/80 border border-white/40 rounded-lg text-white text-sm focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-white font-medium mb-1.5 block drop-shadow-[0_0_3px_rgba(255, 255, 255,0.4)]">{(selectedUser as any)._isRecruit ? 'Social Handle' : 'Username'}</label>
                                <input
                                  type="text"
                                  value={(selectedUser as any)._isRecruit ? (editForm.social_handle || '') : (editForm.username || '')}
                                  onChange={(e) => setEditForm({ 
                                    ...editForm, 
                                    [(selectedUser as any)._isRecruit ? 'social_handle' : 'username']: e.target.value 
                                  })}
                                  className="w-full px-3 py-2 bg-slate-900/80 border border-white/40 rounded-lg text-white text-sm focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30"
                                />
                              </div>
                              {(selectedUser as any)._isRecruit && (
                                <>
                                  <div>
                                    <label className="text-xs text-white font-medium mb-1.5 block drop-shadow-[0_0_3px_rgba(255, 255, 255,0.4)]">MT5 ID</label>
                                    <input
                                      type="text"
                                      value={editForm.mt5_id || ''}
                                      onChange={(e) => setEditForm({ ...editForm, mt5_id: e.target.value })}
                                      className="w-full px-3 py-2 bg-slate-900/80 border border-white/40 rounded-lg text-white text-sm focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-white font-medium mb-1.5 block drop-shadow-[0_0_3px_rgba(255, 255, 255,0.4)]">Status</label>
                                    <select
                                      value={editForm.status || 'Pending'}
                                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                      className="w-full px-3 py-2 bg-slate-900/80 border border-white/40 rounded-lg text-white text-sm focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30"
                                    >
                                      <option value="Pending">Pending</option>
                                      <option value="Active">Active</option>
                                      <option value="Rejected">Rejected</option>
                                      <option value="Suspended">Suspended</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-xs text-white font-medium mb-1.5 block drop-shadow-[0_0_3px_rgba(255, 255, 255,0.4)]">Commission Balance</label>
                                    <input
                                      type="text"
                                      value={editForm.commission_balance || '0.00'}
                                      onChange={(e) => setEditForm({ ...editForm, commission_balance: e.target.value })}
                                      className="w-full px-3 py-2 bg-slate-900/80 border border-white/40 rounded-lg text-white text-sm focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-white font-medium mb-1.5 block drop-shadow-[0_0_3px_rgba(255, 255, 255,0.4)]">Affiliate Code</label>
                                    <input
                                      type="text"
                                      value={editForm.affiliate_code || ''}
                                      onChange={(e) => setEditForm({ ...editForm, affiliate_code: e.target.value })}
                                      className="w-full px-3 py-2 bg-slate-900/80 border border-white/40 rounded-lg text-white text-sm focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30"
                                      placeholder="e.g. bmt_username"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-white font-medium mb-1.5 block drop-shadow-[0_0_3px_rgba(255, 255, 255,0.4)]">Referred By Code</label>
                                    <input
                                      type="text"
                                      value={editForm.referred_by_code || ''}
                                      onChange={(e) => setEditForm({ ...editForm, referred_by_code: e.target.value })}
                                      className="w-full px-3 py-2 bg-slate-900/80 border border-white/40 rounded-lg text-white text-sm focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30"
                                      placeholder="Referral code used"
                                    />
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className="text-xs text-white font-medium mb-2 block drop-shadow-[0_0_3px_rgba(255, 255, 255,0.4)]">Task Verifications</label>
                                    <div className="flex flex-wrap gap-3">
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={editForm.task_broker_verified || false}
                                          onChange={(e) => setEditForm({ ...editForm, task_broker_verified: e.target.checked })}
                                          className="w-4 h-4 rounded bg-slate-800 border-white/40 text-white focus:ring-white/30"
                                        />
                                        <span className="text-sm text-white">Broker Verified</span>
                                      </label>
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={editForm.task_social_verified || false}
                                          onChange={(e) => setEditForm({ ...editForm, task_social_verified: e.target.checked })}
                                          className="w-4 h-4 rounded bg-slate-800 border-white/40 text-white focus:ring-white/30"
                                        />
                                        <span className="text-sm text-white">Social Verified</span>
                                      </label>
                                    </div>
                                  </div>
                                </>
                              )}
                              <div>
                                <label className="text-xs text-white font-medium mb-1.5 block drop-shadow-[0_0_3px_rgba(255, 255, 255,0.4)]">Phone</label>
                                <input
                                  type="text"
                                  value={editForm.phone || ''}
                                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                  className="w-full px-3 py-2 bg-slate-900/80 border border-white/40 rounded-lg text-white text-sm focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-white font-medium mb-1.5 block drop-shadow-[0_0_3px_rgba(255, 255, 255,0.4)]">Telegram</label>
                                <input
                                  type="text"
                                  value={editForm.telegram_username || ''}
                                  onChange={(e) => setEditForm({ ...editForm, telegram_username: e.target.value })}
                                  className="w-full px-3 py-2 bg-slate-900/80 border border-white/40 rounded-lg text-white text-sm focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-white font-medium mb-1.5 block drop-shadow-[0_0_3px_rgba(255, 255, 255,0.4)]">Discord</label>
                                <input
                                  type="text"
                                  value={editForm.discord_username || ''}
                                  onChange={(e) => setEditForm({ ...editForm, discord_username: e.target.value })}
                                  className="w-full px-3 py-2 bg-slate-900/80 border border-white/40 rounded-lg text-white text-sm focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-xs text-white font-medium mb-1.5 block drop-shadow-[0_0_3px_rgba(255, 255, 255,0.4)]">Notes</label>
                              <textarea
                                value={editForm.notes || ''}
                                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2 bg-slate-900/80 border border-white/40 rounded-lg text-white text-sm focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 resize-none"
                              />
                            </div>

                            <div className="flex gap-2 flex-col sm:flex-row">
                              <button
                                onClick={() => saveUserEdits((selectedUser as any)._isRecruit)}
                                disabled={loading}
                                className="flex-1 py-2 sm:py-2.5 bg-gradient-to-r from-white to-white hover:from-white hover:to-white text-white text-xs sm:text-sm font-semibold rounded-lg transition-all shadow-lg shadow-white/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]" />}
                                <span className="drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">Save Changes</span>
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditing(false);
                                  setEditForm(selectedUser);
                                }}
                                className="px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 hover:border-slate-500/60 text-white text-xs sm:text-sm font-medium rounded-lg transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          /* View Mode */
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <InfoItem icon={Mail} label="Email" value={selectedUser.email} />
                              <InfoItem icon={Calendar} label="Joined" value={new Date(selectedUser.created_at).toLocaleDateString()} />
                              {selectedUser.phone && <InfoItem label="Phone" value={selectedUser.phone} />}
                              {selectedUser.telegram_username && <InfoItem label="Telegram" value={`@${selectedUser.telegram_username}`} />}
                              {selectedUser.discord_username && <InfoItem label="Discord" value={selectedUser.discord_username} />}
                              {/* Recruit-specific fields */}
                              {selectedUser.mt5_id && <InfoItem icon={Hash} label="MT5 ID" value={selectedUser.mt5_id} />}
                              {selectedUser.social_handle && <InfoItem label="Social Handle" value={selectedUser.social_handle} />}
                              {selectedUser.affiliate_code && <InfoItem label="Affiliate Code" value={selectedUser.affiliate_code} />}
                              {selectedUser.referred_by_code && <InfoItem label="Referred By" value={selectedUser.referred_by_code} />}
                              {selectedUser.commission_balance && (
                                <InfoItem icon={DollarSign} label="Commission Balance" value={`$${selectedUser.commission_balance}`} />
                              )}
                            </div>

                            {/* Verification Status for Recruits */}
                            {(selectedUser as any)._isRecruit && (
                              <div className="flex gap-3 flex-wrap">
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                                  selectedUser.task_broker_verified 
                                    ? 'bg-white/25 text-white border-white/50 shadow-sm shadow-white/20' 
                                    : 'bg-slate-800/60 text-slate-300 border-slate-600/50'
                                }`}>
                                  {selectedUser.task_broker_verified ? '✓' : '○'} Broker Verified
                                </span>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                                  selectedUser.task_social_verified 
                                    ? 'bg-white/25 text-white border-white/50 shadow-sm shadow-white/20' 
                                    : 'bg-slate-800/60 text-slate-300 border-slate-600/50'
                                }`}>
                                  {selectedUser.task_social_verified ? '✓' : '○'} Social Verified
                                </span>
                              </div>
                            )}

                            {selectedUser.notes && (
                              <div className="p-3.5 bg-slate-800/60 border border-slate-600/50 rounded-lg">
                                <p className="text-xs text-white font-medium mb-1.5 drop-shadow-[0_0_3px_rgba(255, 255, 255,0.3)]">Notes</p>
                                <p className="text-sm text-white leading-relaxed">{selectedUser.notes}</p>
                              </div>
                            )}

                            {/* Documents */}
                            <div className="pt-4 border-t border-white/30">
                              <h4 className="text-sm font-bold text-white mb-3 drop-shadow-[0_0_6px_rgba(255,255,255,0.2)]">Documents & Images</h4>
                              <div className="grid grid-cols-2 gap-3">
                                {selectedUser.payment_screenshot_url && (
                                  <button
                                    onClick={() => setImageModal({ url: selectedUser.payment_screenshot_url!, title: 'Payment Screenshot' })}
                                    className="p-4 bg-slate-800/60 hover:bg-slate-700/60 border border-white/40 hover:border-white/60 rounded-lg transition-all flex flex-col items-center gap-2 group"
                                  >
                                    <ImageIcon className="w-8 h-8 text-white drop-shadow-[0_0_8px_rgba(255, 255, 255,0.5)] group-hover:drop-shadow-[0_0_12px_rgba(255, 255, 255,0.7)]" />
                                    <span className="text-xs text-white font-medium">Payment Screenshot</span>
                                  </button>
                                )}
                                {selectedUser.id_document_url && (
                                  <button
                                    onClick={() => setImageModal({ url: selectedUser.id_document_url!, title: 'ID Document' })}
                                    className="p-4 bg-slate-800/60 hover:bg-slate-700/60 border border-white/40 hover:border-white/60 rounded-lg transition-all flex flex-col items-center gap-2 group"
                                  >
                                    <ImageIcon className="w-8 h-8 text-white drop-shadow-[0_0_8px_rgba(255, 255, 255,0.5)] group-hover:drop-shadow-[0_0_12px_rgba(255, 255, 255,0.7)]" />
                                    <span className="text-xs text-white font-medium">ID Document</span>
                                  </button>
                                )}
                                {selectedUser.image_url && (
                                  <button
                                    onClick={() => setImageModal({ url: selectedUser.image_url!, title: 'Face Scan / ID' })}
                                    className="p-4 bg-slate-800/60 hover:bg-slate-700/60 border border-indigo-500/40 hover:border-indigo-400/60 rounded-lg transition-all flex flex-col items-center gap-2 group"
                                  >
                                    <ImageIcon className="w-8 h-8 text-indigo-400 drop-shadow-[0_0_8px_rgba(255, 255, 255,0.5)] group-hover:drop-shadow-[0_0_12px_rgba(255, 255, 255,0.7)]" />
                                    <span className="text-xs text-white font-medium">Face Scan / ID</span>
                                  </button>
                                )}
                                {!selectedUser.payment_screenshot_url && !selectedUser.id_document_url && !selectedUser.image_url && (
                                  <p className="text-sm text-slate-400 col-span-2 text-center py-4">No documents uploaded</p>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Image Modal */}
        <AnimatePresence>
          {imageModal && (
            <motion.div
              key="image-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/95"
              onClick={() => setImageModal(null)}
            >
              <motion.div
                key="image-modal-content"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="relative max-w-4xl max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setImageModal(null)}
                  className="absolute -top-10 right-0 p-2 text-white hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <h3 className="absolute -top-10 left-0 text-white font-medium">{imageModal.title}</h3>
                <img
                  src={imageModal.url}
                  alt={imageModal.title}
                  className="max-w-full max-h-[85vh] object-contain rounded-lg"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon?: any; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-800/40 border border-slate-700/50">
      {Icon && <Icon className="w-4 h-4 text-white mt-0.5 drop-shadow-[0_0_4px_rgba(255, 255, 255,0.5)]" />}
      <div>
        <p className="text-xs text-white font-medium drop-shadow-[0_0_3px_rgba(255, 255, 255,0.3)]">{label}</p>
        <p className="text-sm text-white font-medium">{value}</p>
      </div>
    </div>
  );
}

export default AdminPanel;
