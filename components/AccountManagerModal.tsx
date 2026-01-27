"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  User,
  Mail,
  Shield,
  Crown,
  Upload,
  Save,
  X,
  ChevronDown,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  ExternalLink,
  Plus,
  Trash2,
} from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";
import Image from "next/image";

// ============================================================================
// TYPES
// ============================================================================

interface MT5Account {
  id: string;
  mt5_id: string;
  broker_name?: string;
  status: string;
  created_at: string;
  is_primary?: boolean;
}

interface UserAccountData {
  email: string;
  full_name?: string;
  image_url?: string;
  is_vip: boolean;
  vip_updated_at?: string;
  mt5_accounts: MT5Account[];
  affiliate_code?: string;
  commission_balance?: number;
  total_referred_manual?: number;
  telegram_username?: string;
  discord_username?: string;
}

interface AccountManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AccountManagerModal: React.FC<AccountManagerModalProps> = ({ isOpen, onClose }) => {
  const supabase = createSupabaseClient();
  
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accountData, setAccountData] = useState<UserAccountData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form states
  const [newMT5Id, setNewMT5Id] = useState("");
  const [newBrokerName, setNewBrokerName] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to get authenticated user email (pagemode or Supabase)
  const getAuthenticatedEmail = useCallback(async (): Promise<string | null> => {
    // Check pagemode session first (localStorage)
    if (typeof window !== 'undefined') {
      try {
        const pagemodeSession = localStorage.getItem('bullmoney_session');
        if (pagemodeSession) {
          const parsed = JSON.parse(pagemodeSession);
          const email = parsed?.email;
          if (email) {
            console.log('[AccountManager] Using pagemode email:', email);
            return email;
          }
        }
      } catch (err) {
        console.error('[AccountManager] Error parsing pagemode session:', err);
      }
    }
    
    // Fall back to Supabase auth
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        console.log('[AccountManager] Using Supabase auth email:', user.email);
        return user.email;
      }
    } catch (err) {
      console.error('[AccountManager] Error getting Supabase user:', err);
    }
    
    return null;
  }, [supabase]);

  // Fetch account data
  const fetchAccountData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userEmail = await getAuthenticatedEmail();
      
      if (!userEmail) {
        setError("Not authenticated. Please log in.");
        setLoading(false);
        return;
      }

      console.log('[AccountManager] Fetching data for email:', userEmail);

      // Fetch user's recruit data with explicit email filter
      const { data: recruitData, error: recruitError } = await supabase
        .from('recruits')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle(); // Use maybeSingle to handle case where user doesn't exist

      if (recruitError) {
        console.error('Error fetching recruit data:', recruitError);
        setError("Failed to load account data. Please try again.");
        setLoading(false);
        return;
      }

      if (!recruitData) {
        console.warn('[AccountManager] No recruit data found for email:', userEmail);
        setError("No account found. Please register first.");
        setLoading(false);
        return;
      }

      // CRITICAL: Verify the returned data is for the correct user
      if (recruitData.email.toLowerCase() !== userEmail.toLowerCase()) {
        console.error('[AccountManager] Security error: Email mismatch!', {
          expected: userEmail,
          received: recruitData.email
        });
        setError("Security error: Data mismatch. Please log out and log in again.");
        setLoading(false);
        return;
      }

      console.log('[AccountManager] Successfully loaded data for:', userEmail);

      // Parse MT5 accounts from mt5_id field (could be comma-separated or single)
      const mt5Accounts: MT5Account[] = [];
      if (recruitData?.mt5_id) {
        const mt5Ids = recruitData.mt5_id.split(',').map((id: string) => id.trim()).filter(Boolean);
        mt5Ids.forEach((id: string, index: number) => {
          mt5Accounts.push({
            id: `${recruitData.id}-${index}`,
            mt5_id: id,
            broker_name: recruitData.broker_name || 'Unknown',
            status: recruitData.status || 'Pending',
            created_at: recruitData.created_at,
            is_primary: index === 0,
          });
        });
      }

      setAccountData({
        email: recruitData.email,
        full_name: recruitData.full_name,
        image_url: recruitData.image_url,
        is_vip: recruitData.is_vip || false,
        vip_updated_at: recruitData.vip_updated_at,
        mt5_accounts: mt5Accounts,
        affiliate_code: recruitData.affiliate_code,
        commission_balance: recruitData.commission_balance || 0,
        total_referred_manual: recruitData.total_referred_manual || 0,
        telegram_username: recruitData.telegram_username,
        discord_username: recruitData.discord_username,
      });
    } catch (err) {
      console.error('Error in fetchAccountData:', err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [supabase, getAuthenticatedEmail]);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAccountData();
    }
  }, [isOpen, fetchAccountData]);

  // Handle profile picture upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    try {
      setUploadingImage(true);
      setError(null);

      const userEmail = await getAuthenticatedEmail();
      
      if (!userEmail) {
        setError("Not authenticated");
        setUploadingImage(false);
        return;
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('bull-feed')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setError("Failed to upload image");
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('bull-feed')
        .getPublicUrl(filePath);

      // Update recruit record
      const { error: updateError } = await supabase
        .from('recruits')
        .update({ image_url: publicUrl })
        .eq('email', userEmail);

      if (updateError) {
        console.error('Update error:', updateError);
        setError("Failed to update profile");
        return;
      }

      // Update local state
      setAccountData(prev => prev ? { ...prev, image_url: publicUrl } : null);
      setSuccess("Profile picture updated!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Image upload error:', err);
      setError("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  // Add new MT5 account
  const handleAddMT5Account = async () => {
    if (!newMT5Id.trim()) {
      setError("Please enter an MT5 ID");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const userEmail = await getAuthenticatedEmail();
      
      if (!userEmail) {
        setError("Not authenticated");
        setSaving(false);
        return;
      }

      // Get current MT5 IDs
      const currentIds = accountData?.mt5_accounts.map(acc => acc.mt5_id) || [];
      
      // Check if MT5 ID already exists
      if (currentIds.includes(newMT5Id.trim())) {
        setError("This MT5 ID is already registered");
        return;
      }

      // Add new MT5 ID
      const updatedIds = [...currentIds, newMT5Id.trim()].join(',');

      const { error: updateError } = await supabase
        .from('recruits')
        .update({ 
          mt5_id: updatedIds,
          broker_name: newBrokerName.trim() || accountData?.mt5_accounts[0]?.broker_name || 'Unknown'
        })
        .eq('email', userEmail);

      if (updateError) {
        console.error('Update error:', updateError);
        setError("Failed to add MT5 account");
        return;
      }

      // Refresh data
      await fetchAccountData();
      setNewMT5Id("");
      setNewBrokerName("");
      setSuccess("MT5 account added successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Add MT5 error:', err);
      setError("Failed to add MT5 account");
    } finally {
      setSaving(false);
    }
  };

  // Remove MT5 account
  const handleRemoveMT5Account = async (mt5Id: string) => {
    if (!confirm("Are you sure you want to remove this MT5 account?")) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const userEmail = await getAuthenticatedEmail();
      
      if (!userEmail) {
        setError("Not authenticated");
        setSaving(false);
        return;
      }

      // Get current MT5 IDs and remove the specified one
      const currentIds = accountData?.mt5_accounts.map(acc => acc.mt5_id) || [];
      const updatedIds = currentIds.filter(id => id !== mt5Id).join(',');

      const { error: updateError } = await supabase
        .from('recruits')
        .update({ mt5_id: updatedIds || null })
        .eq('email', userEmail);

      if (updateError) {
        console.error('Update error:', updateError);
        setError("Failed to remove MT5 account");
        return;
      }

      // Refresh data
      await fetchAccountData();
      setSuccess("MT5 account removed successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Remove MT5 error:', err);
      setError("Failed to remove MT5 account");
    } finally {
      setSaving(false);
    }
  };

  // Copy affiliate code
  const copyAffiliateCode = () => {
    if (accountData?.affiliate_code) {
      navigator.clipboard.writeText(accountData.affiliate_code);
      setSuccess("Affiliate code copied!");
      setTimeout(() => setSuccess(null), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999999] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl border border-blue-500/30"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 px-6 py-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="h-6 w-6 text-white" />
                  <h2 className="text-2xl font-bold text-white">Account Manager</h2>
                  {accountData?.is_vip && (
                    <Crown className="h-5 w-5 text-yellow-400 animate-pulse" />
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6 space-y-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                  <p className="text-slate-400">Loading your account...</p>
                </div>
              ) : error && !accountData ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                  <p className="text-red-400 mb-4">{error}</p>
                  <button
                    onClick={fetchAccountData}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : accountData ? (
                <>
                  {/* Logged-in User Indicator */}
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-blue-400" />
                      <span className="text-slate-400">Logged in as:</span>
                      <span className="text-white font-semibold">{accountData.email}</span>
                    </div>
                  </div>

                  {/* Success/Error Messages */}
                  {(success || error) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-lg border ${
                        success 
                          ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                          : 'bg-red-500/10 border-red-500/30 text-red-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {success ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <AlertCircle className="h-5 w-5" />
                        )}
                        <span>{success || error}</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Profile Section */}
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-400" />
                      Profile Information
                    </h3>
                    
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Profile Picture */}
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500/30 bg-slate-700">
                          {accountData.image_url ? (
                            <Image
                              src={accountData.image_url}
                              alt="Profile"
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="h-16 w-16 text-slate-500" />
                            </div>
                          )}
                          {uploadingImage && (
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
                        >
                          <Upload className="h-4 w-4" />
                          Upload Photo
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>

                      {/* Profile Details */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-lg border border-slate-700">
                            <Mail className="h-4 w-4 text-slate-400" />
                            <span className="text-white">{accountData.email}</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-lg border border-slate-700">
                            <User className="h-4 w-4 text-slate-400" />
                            <span className="text-white">{accountData.full_name || 'Not set'}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Telegram</label>
                            <div className="px-4 py-2 bg-slate-900/50 rounded-lg border border-slate-700">
                              <span className="text-white text-sm">{accountData.telegram_username || 'Not set'}</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Discord</label>
                            <div className="px-4 py-2 bg-slate-900/50 rounded-lg border border-slate-700">
                              <span className="text-white text-sm">{accountData.discord_username || 'Not set'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* VIP Status */}
                  <div className="bg-gradient-to-r from-yellow-500/10 to-purple-500/10 rounded-xl p-6 border border-yellow-500/30">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Crown className="h-5 w-5 text-yellow-400" />
                        VIP Status
                      </h3>
                      {accountData.is_vip ? (
                        <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-400 text-sm font-semibold">
                          Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-slate-700/50 border border-slate-600 rounded-full text-slate-400 text-sm">
                          Not Active
                        </span>
                      )}
                    </div>
                    {accountData.is_vip && accountData.vip_updated_at && (
                      <p className="text-sm text-slate-400">
                        VIP since: {new Date(accountData.vip_updated_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Affiliate Stats */}
                  {accountData.affiliate_code && (
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-400" />
                        Affiliate Dashboard
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                          <p className="text-sm text-slate-400 mb-1">Affiliate Code</p>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-white">{accountData.affiliate_code}</span>
                            <button
                              onClick={copyAffiliateCode}
                              className="p-2 hover:bg-slate-700 rounded transition-colors"
                            >
                              <Copy className="h-4 w-4 text-blue-400" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                          <p className="text-sm text-slate-400 mb-1">Total Referrals</p>
                          <span className="text-lg font-bold text-white">{accountData.total_referred_manual || 0}</span>
                        </div>
                        
                        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                          <p className="text-sm text-slate-400 mb-1">Commission Balance</p>
                          <span className="text-lg font-bold text-green-400">${(accountData.commission_balance || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MT5 Accounts Section */}
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-400" />
                      MT5 Trading Accounts
                    </h3>

                    {/* Add New MT5 Account */}
                    <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                      <p className="text-sm text-slate-400 mb-3">Add New MT5 Account</p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          placeholder="MT5 Account ID"
                          value={newMT5Id}
                          onChange={(e) => setNewMT5Id(e.target.value)}
                          className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Broker Name (Optional)"
                          value={newBrokerName}
                          onChange={(e) => setNewBrokerName(e.target.value)}
                          className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                        <button
                          onClick={handleAddMT5Account}
                          disabled={saving || !newMT5Id.trim()}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors whitespace-nowrap"
                        >
                          {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                          Add Account
                        </button>
                      </div>
                    </div>

                    {/* MT5 Accounts List */}
                    {accountData.mt5_accounts.length > 0 ? (
                      <div className="space-y-3">
                        {accountData.mt5_accounts.map((account) => (
                          <div
                            key={account.id}
                            className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-blue-500/30 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-white font-semibold">{account.mt5_id}</span>
                                {account.is_primary && (
                                  <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded text-blue-400 text-xs">
                                    Primary
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-slate-400">
                                <span>Broker: {account.broker_name || 'Unknown'}</span>
                                <span className={`px-2 py-0.5 rounded ${
                                  account.status === 'Verified' 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                  {account.status}
                                </span>
                              </div>
                            </div>
                            {!account.is_primary && (
                              <button
                                onClick={() => handleRemoveMT5Account(account.mt5_id)}
                                disabled={saving}
                                className="p-2 hover:bg-red-500/20 rounded transition-colors disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4 text-red-400" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Shield className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400">No MT5 accounts registered</p>
                        <p className="text-sm text-slate-500 mt-1">Add your first trading account above</p>
                      </div>
                    )}
                  </div>

                  {/* Broker Registration Link */}
                  <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/30">
                    <h3 className="text-lg font-bold text-white mb-2">Need a Broker Account?</h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Register with our partner brokers to start trading and unlock exclusive benefits.
                    </p>
                    <a
                      href="/recruit"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Register with Brokers
                    </a>
                  </div>
                </>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
