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
  Eye,
  EyeOff,
  Edit2,
  MessageCircle,
  ArrowLeft,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Twitch as TwitchIcon,
} from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";
import Image from "next/image";
import { useRouter } from "next/navigation";

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
  id: number;
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
  instagram_username?: string;
  facebook_username?: string;
  twitter_username?: string;
  youtube_username?: string;
  twitch_username?: string;
  tiktok_username?: string;
  // Contact Information
  cell_number?: string;
  country?: string;
  city?: string;
  timezone?: string;
  birth_date?: string;
  preferred_contact_method?: string;
  // Trading Profile
  trading_experience_years?: number;
  trading_style?: string; // scalper, day trader, swing trader, position trader
  risk_tolerance?: string; // conservative, moderate, aggressive
  preferred_instruments?: string; // forex, stocks, crypto, commodities
  trading_timezone?: string;
  account_balance_range?: string;
  preferred_leverage?: string;
  favorite_pairs?: string;
  trading_strategy?: string;
  win_rate_target?: number;
  monthly_profit_target?: string;
  // Personality & Interests
  hobbies?: string;
  personality_traits?: string;
  trading_goals?: string;
  learning_style?: string; // visual, auditory, reading, kinesthetic
  // Advanced Preferences
  notification_preferences?: string;
  preferred_chart_timeframe?: string; // M1, M5, M15, M30, H1, H4, D1, W1
  uses_automated_trading?: boolean;
  attends_live_sessions?: boolean;
  bio?: string;
}

interface AccountManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SessionPayload {
  id: number;
  email: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AccountManagerModal: React.FC<AccountManagerModalProps> = ({ isOpen, onClose }) => {
  const supabase = createSupabaseClient();
  const router = useRouter();
  
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accountData, setAccountData] = useState<UserAccountData | null>(null);
  const [recruitId, setRecruitId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form states
  const [newMT5Id, setNewMT5Id] = useState("");
  const [newBrokerName, setNewBrokerName] = useState<"XM" | "Vantage" | "">("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit mode states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingMT5Id, setEditingMT5Id] = useState<string | null>(null);

  // Editable field states
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editTelegram, setEditTelegram] = useState("");
  const [editDiscord, setEditDiscord] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editNewPassword, setEditNewPassword] = useState("");
  const [editConfirmPassword, setEditConfirmPassword] = useState("");
  
  // Social media edit states
  const [editInstagram, setEditInstagram] = useState("");
  const [editFacebook, setEditFacebook] = useState("");
  const [editTwitter, setEditTwitter] = useState("");
  const [editYoutube, setEditYoutube] = useState("");
  const [editTwitch, setEditTwitch] = useState("");
  const [editTiktok, setEditTiktok] = useState("");
  
  // Contact info edit states
  const [editCellNumber, setEditCellNumber] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editTimezone, setEditTimezone] = useState("");
  const [editBirthDate, setEditBirthDate] = useState("");
  const [editPreferredContact, setEditPreferredContact] = useState("");
  
  // Trading profile edit states
  const [editTradingYears, setEditTradingYears] = useState("");
  const [editTradingStyle, setEditTradingStyle] = useState("");
  const [editRiskTolerance, setEditRiskTolerance] = useState("");
  const [editPreferredInstruments, setEditPreferredInstruments] = useState("");
  const [editTradingTimezone, setEditTradingTimezone] = useState("");
  const [editAccountBalance, setEditAccountBalance] = useState("");
  const [editPreferredLeverage, setEditPreferredLeverage] = useState("");
  const [editFavoritePairs, setEditFavoritePairs] = useState("");
  const [editTradingStrategy, setEditTradingStrategy] = useState("");
  const [editWinRateTarget, setEditWinRateTarget] = useState("");
  const [editMonthlyTarget, setEditMonthlyTarget] = useState("");
  
  // Personality & interests edit states
  const [editHobbies, setEditHobbies] = useState("");
  const [editPersonalityTraits, setEditPersonalityTraits] = useState("");
  const [editTradingGoals, setEditTradingGoals] = useState("");
  const [editLearningStyle, setEditLearningStyle] = useState("");
  
  // Advanced preferences edit states
  const [editNotificationPrefs, setEditNotificationPrefs] = useState("");
  const [editChartTimeframe, setEditChartTimeframe] = useState("");
  const [editUsesAutomated, setEditUsesAutomated] = useState(false);
  const [editAttendsLive, setEditAttendsLive] = useState(false);
  const [editBio, setEditBio] = useState("");

  // MT5 edit states
  const [editMT5AccountId, setEditMT5AccountId] = useState("");
  const [editMT5Broker, setEditMT5Broker] = useState<"XM" | "Vantage" | "">("");

  // ESC close support (UI state compatible)
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

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

  const getLocalSession = useCallback((): SessionPayload | null => {
    if (typeof window === 'undefined') return null;
    try {
      const rawSession = localStorage.getItem('bullmoney_session');
      if (!rawSession) return null;
      const parsed = JSON.parse(rawSession);
      if (parsed?.id && parsed?.email) {
        return { id: parsed.id, email: parsed.email };
      }
    } catch (err) {
      console.error('[AccountManager] Error parsing local session:', err);
    }
    return null;
  }, []);

  const getSessionPayload = useCallback((): SessionPayload | null => {
    const localSession = getLocalSession();
    if (localSession) {
      return localSession;
    }

    if (accountData?.email && recruitId) {
      return { id: recruitId, email: accountData.email };
    }

    return null;
  }, [accountData?.email, recruitId, getLocalSession]);

  const updateRecruitRecord = useCallback(async (updates: Record<string, unknown>) => {
    const session = getSessionPayload();

    if (!session) {
      throw new Error("Not authenticated");
    }

    const response = await fetch('/api/account/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session, updates }),
    });

    let result: any = null;
    try {
      result = await response.json();
    } catch {
      result = null;
    }

    if (!response.ok || !result?.success) {
      throw new Error(result?.error || 'Failed to update account');
    }
  }, [getSessionPayload]);

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
        .select('id, email, full_name, image_url, is_vip, vip_updated_at, mt5_id, broker_name, status, created_at, affiliate_code, commission_balance, total_referred_manual, telegram_username, discord_username, instagram_username, facebook_username, twitter_username, youtube_username, twitch_username, tiktok_username, cell_number, country, city, timezone, birth_date, preferred_contact_method, trading_experience_years, trading_style, risk_tolerance, preferred_instruments, trading_timezone, account_balance_range, preferred_leverage, favorite_pairs, trading_strategy, win_rate_target, monthly_profit_target, hobbies, personality_traits, trading_goals, learning_style, notification_preferences, preferred_chart_timeframe, uses_automated_trading, attends_live_sessions, bio')
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

      setRecruitId(recruitData.id);

      setAccountData({
        id: recruitData.id,
        email: recruitData.email,
        full_name: recruitData.full_name,
        image_url: recruitData.image_url,
        is_vip: recruitData.is_vip || false,
        vip_updated_at: recruitData.vip_updated_at,
        mt5_accounts: mt5Accounts,
        affiliate_code: recruitData.affiliate_code,
        commission_balance: recruitData.commission_balance ?? 0,
        total_referred_manual: recruitData.total_referred_manual ?? 0,
        telegram_username: recruitData.telegram_username,
        discord_username: recruitData.discord_username,
        instagram_username: recruitData.instagram_username,
        facebook_username: recruitData.facebook_username,
        twitter_username: recruitData.twitter_username,
        youtube_username: recruitData.youtube_username,
        twitch_username: recruitData.twitch_username,
        tiktok_username: recruitData.tiktok_username,
        cell_number: recruitData.cell_number,
        country: recruitData.country,
        city: recruitData.city,
        timezone: recruitData.timezone,
        birth_date: recruitData.birth_date,
        preferred_contact_method: recruitData.preferred_contact_method,
        trading_experience_years: recruitData.trading_experience_years,
        trading_style: recruitData.trading_style,
        risk_tolerance: recruitData.risk_tolerance,
        preferred_instruments: recruitData.preferred_instruments,
        trading_timezone: recruitData.trading_timezone,
        account_balance_range: recruitData.account_balance_range,
        preferred_leverage: recruitData.preferred_leverage,
        favorite_pairs: recruitData.favorite_pairs,
        trading_strategy: recruitData.trading_strategy,
        win_rate_target: recruitData.win_rate_target,
        monthly_profit_target: recruitData.monthly_profit_target,
        hobbies: recruitData.hobbies,
        personality_traits: recruitData.personality_traits,
        trading_goals: recruitData.trading_goals,
        learning_style: recruitData.learning_style,
        notification_preferences: recruitData.notification_preferences,
        preferred_chart_timeframe: recruitData.preferred_chart_timeframe,
        uses_automated_trading: recruitData.uses_automated_trading,
        attends_live_sessions: recruitData.attends_live_sessions,
        bio: recruitData.bio,
      });

      // Initialize edit fields
      setEditFullName(recruitData.full_name || "");
      setEditEmail(recruitData.email || "");
      setEditTelegram(recruitData.telegram_username || "");
      setEditDiscord(recruitData.discord_username || "");
      setEditInstagram(recruitData.instagram_username || "");
      setEditFacebook(recruitData.facebook_username || "");
      setEditTwitter(recruitData.twitter_username || "");
      setEditYoutube(recruitData.youtube_username || "");
      setEditTwitch(recruitData.twitch_username || "");
      setEditTiktok(recruitData.tiktok_username || "");
      setEditCellNumber(recruitData.cell_number || "");
      setEditCountry(recruitData.country || "");
      setEditCity(recruitData.city || "");
      setEditTimezone(recruitData.timezone || "");
      setEditBirthDate(recruitData.birth_date || "");
      setEditPreferredContact(recruitData.preferred_contact_method || "");
      setEditTradingYears(recruitData.trading_experience_years?.toString() || "");
      setEditTradingStyle(recruitData.trading_style || "");
      setEditRiskTolerance(recruitData.risk_tolerance || "");
      setEditPreferredInstruments(recruitData.preferred_instruments || "");
      setEditTradingTimezone(recruitData.trading_timezone || "");
      setEditAccountBalance(recruitData.account_balance_range || "");
      setEditPreferredLeverage(recruitData.preferred_leverage || "");
      setEditFavoritePairs(recruitData.favorite_pairs || "");
      setEditTradingStrategy(recruitData.trading_strategy || "");
      setEditWinRateTarget(recruitData.win_rate_target?.toString() || "");
      setEditMonthlyTarget(recruitData.monthly_profit_target || "");
      setEditHobbies(recruitData.hobbies || "");
      setEditPersonalityTraits(recruitData.personality_traits || "");
      setEditTradingGoals(recruitData.trading_goals || "");
      setEditLearningStyle(recruitData.learning_style || "");
      setEditNotificationPrefs(recruitData.notification_preferences || "");
      setEditChartTimeframe(recruitData.preferred_chart_timeframe || "");
      setEditUsesAutomated(recruitData.uses_automated_trading || false);
      setEditAttendsLive(recruitData.attends_live_sessions || false);
      setEditBio(recruitData.bio || "");
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

    const session = getSessionPayload();
    if (!session) {
      setError("Not authenticated");
      return;
    }

    try {
      setUploadingImage(true);
      setError(null);
      const userEmail = session.email;

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

      // Update recruit record via secure API route
      await updateRecruitRecord({ image_url: publicUrl });

      // Update local state
      setAccountData(prev => prev ? { ...prev, image_url: publicUrl } : null);
      setSuccess("Profile picture updated!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Image upload error:', err);
      setError(err instanceof Error ? err.message : "Failed to upload image");
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

      // Get current MT5 IDs
      const currentIds = accountData?.mt5_accounts.map(acc => acc.mt5_id) || [];
      
      // Check if MT5 ID already exists
      if (currentIds.includes(newMT5Id.trim())) {
        setError("This MT5 ID is already registered");
        return;
      }

      // Add new MT5 ID
      const updatedIds = [...currentIds, newMT5Id.trim()].join(',');

      await updateRecruitRecord({ 
        mt5_id: updatedIds,
        broker_name: newBrokerName.trim() || accountData?.mt5_accounts[0]?.broker_name || 'Unknown'
      });

      // Refresh data
      await fetchAccountData();
      setNewMT5Id("");
      setNewBrokerName("");
      setSuccess("MT5 account added successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Add MT5 error:', err);
      setError(err instanceof Error ? err.message : "Failed to add MT5 account");
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

      // Get current MT5 IDs and remove the specified one
      const currentIds = accountData?.mt5_accounts.map(acc => acc.mt5_id) || [];
      const updatedIds = currentIds.filter(id => id !== mt5Id).join(',');

      await updateRecruitRecord({ mt5_id: updatedIds || null });

      // Refresh data
      await fetchAccountData();
      setSuccess("MT5 account removed successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Remove MT5 error:', err);
      setError(err instanceof Error ? err.message : "Failed to remove MT5 account");
    } finally {
      setSaving(false);
    }
  };

  // Copy affiliate code with fallback for production environments
  const copyAffiliateCode = async () => {
    if (accountData?.affiliate_code) {
      const code = accountData.affiliate_code;
      
      try {
        // Method 1: Try modern Clipboard API (works in HTTPS)
        if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
          try {
            await navigator.clipboard.writeText(code);
            setSuccess("Affiliate code copied!");
            setTimeout(() => setSuccess(null), 2000);
            return;
          } catch (clipboardErr) {
            console.warn('Clipboard API failed, trying fallback:', clipboardErr);
          }
        }

        // Method 2: Fallback using textarea (works in most environments)
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.setAttribute('readonly', '');
        textarea.style.cssText = 'position:fixed;top:0;left:0;width:2em;height:2em;padding:0;border:none;outline:none;box-shadow:none;background:transparent;z-index:-1;';
        document.body.appendChild(textarea);
        
        // iOS Safari specific handling
        const range = document.createRange();
        range.selectNodeContents(textarea);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
        textarea.setSelectionRange(0, textarea.value.length);
        
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (success) {
          setSuccess("Affiliate code copied!");
          setTimeout(() => setSuccess(null), 2000);
        } else {
          setError(`Failed to copy. Your code is: ${code}`);
          setTimeout(() => setError(null), 5000);
        }
      } catch (err) {
        console.error('Copy failed:', err);
        setError(`Failed to copy. Your code is: ${code}`);
        setTimeout(() => setError(null), 5000);
      }
    }
  };

  // Save profile updates
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);

      const updates: any = {
        full_name: editFullName.trim(),
        telegram_username: editTelegram.trim(),
        discord_username: editDiscord.trim(),
        instagram_username: editInstagram.trim(),
        facebook_username: editFacebook.trim(),
        twitter_username: editTwitter.trim(),
        youtube_username: editYoutube.trim(),
        twitch_username: editTwitch.trim(),
        tiktok_username: editTiktok.trim(),
        cell_number: editCellNumber.trim(),
        country: editCountry.trim(),
        city: editCity.trim(),
        timezone: editTimezone.trim(),
        birth_date: editBirthDate.trim(),
        preferred_contact_method: editPreferredContact.trim(),
        trading_experience_years: editTradingYears ? parseInt(editTradingYears) : null,
        trading_style: editTradingStyle.trim(),
        risk_tolerance: editRiskTolerance.trim(),
        preferred_instruments: editPreferredInstruments.trim(),
        trading_timezone: editTradingTimezone.trim(),
        account_balance_range: editAccountBalance.trim(),
        preferred_leverage: editPreferredLeverage.trim(),
        favorite_pairs: editFavoritePairs.trim(),
        trading_strategy: editTradingStrategy.trim(),
        win_rate_target: editWinRateTarget ? parseFloat(editWinRateTarget) : null,
        monthly_profit_target: editMonthlyTarget.trim(),
        hobbies: editHobbies.trim(),
        personality_traits: editPersonalityTraits.trim(),
        trading_goals: editTradingGoals.trim(),
        learning_style: editLearningStyle.trim(),
        notification_preferences: editNotificationPrefs.trim(),
        preferred_chart_timeframe: editChartTimeframe.trim(),
        uses_automated_trading: editUsesAutomated,
        attends_live_sessions: editAttendsLive,
        bio: editBio.trim(),
      };

      // Only update email if changed and not empty
      if (editEmail.trim() && editEmail.trim() !== accountData?.email) {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(editEmail.trim())) {
          setError("Please enter a valid email address");
          return;
        }
        updates.email = editEmail.trim();
      }

      const nextEmail = updates.email;

      await updateRecruitRecord(updates);

      if (nextEmail && typeof window !== 'undefined') {
        const session = getLocalSession();
        if (session) {
          localStorage.setItem('bullmoney_session', JSON.stringify({ ...session, email: nextEmail }));
        }
      }

      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
      setIsEditingProfile(false);
      
      // Refresh data
      await fetchAccountData();
    } catch (err) {
      console.error('Save profile error:', err);
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // Update password
  const handleUpdatePassword = async () => {
    if (!editNewPassword || !editConfirmPassword) {
      setError("Please fill in all password fields");
      return;
    }

    if (editNewPassword !== editConfirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (editNewPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await updateRecruitRecord({ password: editNewPassword });

      setSuccess("Password updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
      setIsEditingPassword(false);
      setEditPassword("");
      setEditNewPassword("");
      setEditConfirmPassword("");
      
      await fetchAccountData();
    } catch (err) {
      console.error('Update password error:', err);
      setError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  // Edit MT5 account
  const handleEditMT5Account = async (oldMT5Id: string) => {
    if (!editMT5AccountId.trim()) {
      setError("Please enter MT5 Account ID");
      return;
    }

    if (!editMT5Broker) {
      setError("Please select a broker");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Get current MT5 IDs and replace the old one with new one
      const currentIds = accountData?.mt5_accounts.map(acc => acc.mt5_id) || [];
      const updatedIds = currentIds.map(id => id === oldMT5Id ? editMT5AccountId.trim() : id).join(',');

      await updateRecruitRecord({ 
        mt5_id: updatedIds,
        broker_name: editMT5Broker
      });

      setSuccess("MT5 account updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
      setEditingMT5Id(null);
      setEditMT5AccountId("");
      setEditMT5Broker("");
      
      await fetchAccountData();
    } catch (err) {
      console.error('Edit MT5 error:', err);
      setError(err instanceof Error ? err.message : "Failed to update MT5 account");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2147483647] bg-black/80 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-[100vw] max-w-[100vw] h-[100dvh] max-h-[100dvh] overflow-y-auto bg-linear-to-b from-slate-950 via-slate-900 to-black shadow-2xl border border-white/10"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/10 px-4 sm:px-6 py-3 sm:py-4 border-b border-white/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 sm:h-6 sm:w-6 text-white drop-shadow-[0_0_8px_rgba(255, 255, 255,0.8)]" />
                  <h2 className="text-xl sm:text-2xl font-bold text-white neon-text-blue">Account Manager</h2>
                  {accountData?.is_vip && (
                    <Crown className="h-5 w-5 text-yellow-400 animate-pulse" />
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2.5 sm:p-2 rounded-full transition-colors"
                  aria-label="Close modal"
                  data-modal-close="true"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(92vh-72px)] sm:max-h-[calc(90vh-80px)] p-4 sm:p-6 space-y-5 sm:space-y-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-12 w-12 text-white animate-spin mb-4" />
                  <p className="text-slate-400">Loading your account...</p>
                </div>
              ) : error && !accountData ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                  <p className="text-red-300 mb-4">{error}</p>
                  <button
                    onClick={fetchAccountData}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white border border-white/40 rounded-lg transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : accountData ? (
                <>
                  {/* Logged-in User Indicator */}
                  <div className="bg-white/10 border border-white/40 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-white" />
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
                          ? 'bg-white/10 border-white/40 text-white' 
                          : 'bg-red-500/10 border-red-500/40 text-red-300'
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
                  <div className="bg-slate-900/70 rounded-xl p-6 border border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg sm:text-xl font-bold text-white neon-text-cyan flex items-center gap-2">
                        <User className="h-5 w-5 text-white drop-shadow-[0_0_6px_rgba(255, 255, 255,0.7)]" />
                        Profile Information
                      </h3>
                      {!isEditingProfile ? (
                        <button
                          onClick={() => setIsEditingProfile(true)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white border border-white/40 rounded-lg transition-colors text-sm"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit Profile
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 disabled:bg-slate-800 text-white border border-white/40 rounded-lg transition-colors text-sm"
                          >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingProfile(false);
                              setEditFullName(accountData?.full_name || "");
                              setEditEmail(accountData?.email || "");
                              setEditTelegram(accountData?.telegram_username || "");
                              setEditDiscord(accountData?.discord_username || "");
                            }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg transition-colors text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Profile Picture */}
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white/40 bg-slate-900/60">
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
                              <Loader2 className="h-8 w-8 text-white animate-spin" />
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 disabled:bg-slate-800 disabled:cursor-not-allowed text-white border border-white/40 rounded-lg transition-colors text-sm"
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
                        {/* Email Field */}
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                          {isEditingProfile ? (
                            <input
                              type="email"
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                              className="w-full px-4 py-2 bg-slate-900/70 border border-white/40 rounded-lg !text-white placeholder-slate-500 focus:outline-none focus:border-white focus:bg-white/5"
                              style={{ color: '#ffffff' }}
                            />
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                              <Mail className="h-4 w-4 text-white" />
                              <span className="text-white">{accountData.email}</span>
                            </div>
                          )}
                        </div>

                        {/* Full Name Field */}
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                          {isEditingProfile ? (
                            <input
                              type="text"
                              value={editFullName}
                              onChange={(e) => setEditFullName(e.target.value)}
                              placeholder="Enter your full name"
                              className="w-full px-4 py-2 bg-slate-900/70 border border-white/40 rounded-lg !text-white placeholder-slate-500 focus:outline-none focus:border-white focus:bg-white/5"
                              style={{ color: '#ffffff' }}
                            />
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                              <User className="h-4 w-4 text-white" />
                              <span className="text-white">{accountData.full_name || 'Not set'}</span>
                            </div>
                          )}
                        </div>

                        {/* Social Usernames */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-white" />
                            Social Media Accounts
                          </h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Telegram */}
                            <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1">
                                Telegram
                              </label>
                              {isEditingProfile ? (
                                <input
                                  type="text"
                                  value={editTelegram}
                                  onChange={(e) => setEditTelegram(e.target.value)}
                                  placeholder="@username"
                                  className="w-full px-3 py-2 bg-slate-900/70 border border-white/40 rounded-lg !text-white text-sm placeholder-slate-500 focus:outline-none focus:border-white focus:bg-white/5"
                                  style={{ color: '#ffffff' }}
                                />
                              ) : (
                                <div className="px-3 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                                  <span className="text-white text-sm">{accountData.telegram_username || 'Not set'}</span>
                                </div>
                              )}
                            </div>

                            {/* Discord */}
                            <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1">
                                Discord
                              </label>
                              {isEditingProfile ? (
                                <input
                                  type="text"
                                  value={editDiscord}
                                  onChange={(e) => setEditDiscord(e.target.value)}
                                  placeholder="username#0000"
                                  className="w-full px-3 py-2 bg-slate-900/70 border border-white/40 rounded-lg !text-white text-sm placeholder-slate-500 focus:outline-none focus:border-white focus:bg-white/5"
                                  style={{ color: '#ffffff' }}
                                />
                              ) : (
                                <div className="px-3 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                                  <span className="text-white text-sm">{accountData.discord_username || 'Not set'}</span>
                                </div>
                              )}
                            </div>

                            {/* Instagram */}
                            <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                                <Instagram className="h-3 w-3" />
                                Instagram
                              </label>
                              {isEditingProfile ? (
                                <input
                                  type="text"
                                  value={editInstagram}
                                  onChange={(e) => setEditInstagram(e.target.value)}
                                  placeholder="@username"
                                  className="w-full px-3 py-2 bg-slate-900/70 border border-white/40 rounded-lg !text-white text-sm placeholder-slate-500 focus:outline-none focus:border-white focus:bg-white/5"
                                  style={{ color: '#ffffff' }}
                                />
                              ) : (
                                <div className="px-3 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                                  <span className="text-white text-sm">{accountData.instagram_username || 'Not set'}</span>
                                </div>
                              )}
                            </div>

                            {/* Facebook */}
                            <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                                <Facebook className="h-3 w-3" />
                                Facebook
                              </label>
                              {isEditingProfile ? (
                                <input
                                  type="text"
                                  value={editFacebook}
                                  onChange={(e) => setEditFacebook(e.target.value)}
                                  placeholder="username"
                                  className="w-full px-3 py-2 bg-slate-900/70 border border-white/40 rounded-lg !text-white text-sm placeholder-slate-500 focus:outline-none focus:border-white focus:bg-white/5"
                                  style={{ color: '#ffffff' }}
                                />
                              ) : (
                                <div className="px-3 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                                  <span className="text-white text-sm">{accountData.facebook_username || 'Not set'}</span>
                                </div>
                              )}
                            </div>

                            {/* Twitter/X */}
                            <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                                <Twitter className="h-3 w-3" />
                                Twitter/X
                              </label>
                              {isEditingProfile ? (
                                <input
                                  type="text"
                                  value={editTwitter}
                                  onChange={(e) => setEditTwitter(e.target.value)}
                                  placeholder="@username"
                                  className="w-full px-3 py-2 bg-slate-900/70 border border-white/40 rounded-lg !text-white text-sm placeholder-slate-500 focus:outline-none focus:border-white focus:bg-white/5"
                                  style={{ color: '#ffffff' }}
                                />
                              ) : (
                                <div className="px-3 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                                  <span className="text-white text-sm">{accountData.twitter_username || 'Not set'}</span>
                                </div>
                              )}
                            </div>

                            {/* YouTube */}
                            <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                                <Youtube className="h-3 w-3" />
                                YouTube
                              </label>
                              {isEditingProfile ? (
                                <input
                                  type="text"
                                  value={editYoutube}
                                  onChange={(e) => setEditYoutube(e.target.value)}
                                  placeholder="@channel"
                                  className="w-full px-3 py-2 bg-slate-900/70 border border-white/40 rounded-lg !text-white text-sm placeholder-slate-500 focus:outline-none focus:border-white focus:bg-white/5"
                                  style={{ color: '#ffffff' }}
                                />
                              ) : (
                                <div className="px-3 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                                  <span className="text-white text-sm">{accountData.youtube_username || 'Not set'}</span>
                                </div>
                              )}
                            </div>

                            {/* Twitch */}
                            <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                                <TwitchIcon className="h-3 w-3" />
                                Twitch
                              </label>
                              {isEditingProfile ? (
                                <input
                                  type="text"
                                  value={editTwitch}
                                  onChange={(e) => setEditTwitch(e.target.value)}
                                  placeholder="username"
                                  className="w-full px-3 py-2 bg-slate-900/70 border border-white/40 rounded-lg !text-white text-sm placeholder-slate-500 focus:outline-none focus:border-white focus:bg-white/5"
                                  style={{ color: '#ffffff' }}
                                />
                              ) : (
                                <div className="px-3 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                                  <span className="text-white text-sm">{accountData.twitch_username || 'Not set'}</span>
                                </div>
                              )}
                            </div>

                            {/* TikTok */}
                            <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1">
                                TikTok
                              </label>
                              {isEditingProfile ? (
                                <input
                                  type="text"
                                  value={editTiktok}
                                  onChange={(e) => setEditTiktok(e.target.value)}
                                  placeholder="@username"
                                  className="w-full px-3 py-2 bg-slate-900/70 border border-white/40 rounded-lg !text-white text-sm placeholder-slate-500 focus:outline-none focus:border-white focus:bg-white/5"
                                  style={{ color: '#ffffff' }}
                                />
                              ) : (
                                <div className="px-3 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                                  <span className="text-white text-sm">{accountData.tiktok_username || 'Not set'}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Password Section */}
                  <div className="bg-slate-900/70 rounded-xl p-6 border border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Shield className="h-5 w-5 text-white" />
                        Password & Security
                      </h3>
                      {!isEditingPassword && (
                        <button
                          onClick={() => setIsEditingPassword(true)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white border border-white/40 rounded-lg transition-colors text-sm"
                        >
                          <Edit2 className="h-4 w-4" />
                          Change Password
                        </button>
                      )}
                    </div>

                    {!isEditingPassword ? (
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Current Password</label>
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                          <Shield className="h-4 w-4 text-white" />
                          <span className="text-white font-mono flex-1">Hidden for security</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-1">New Password</label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              value={editNewPassword}
                              onChange={(e) => setEditNewPassword(e.target.value)}
                              placeholder="Enter new password"
                              className="w-full px-4 py-2 pr-10 bg-slate-900/70 border border-white/40 rounded-lg !text-white placeholder-slate-500 focus:outline-none focus:border-white focus:bg-white/5"
                              style={{ color: '#ffffff' }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-1">Confirm New Password</label>
                          <input
                            type={showPassword ? "text" : "password"}
                            value={editConfirmPassword}
                            onChange={(e) => setEditConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="w-full px-4 py-2 bg-slate-900/70 border border-white/40 rounded-lg !text-white placeholder-slate-500 focus:outline-none focus:border-white focus:bg-white/5"
                            style={{ color: '#ffffff' }}
                          />
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={handleUpdatePassword}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 disabled:bg-slate-800 text-white border border-white/40 rounded-lg transition-colors"
                          >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Update Password
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingPassword(false);
                              setEditNewPassword("");
                              setEditConfirmPassword("");
                              setShowPassword(false);
                            }}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Contact Information & Location */}
                  <div className="bg-slate-900/70 rounded-xl p-6 border border-slate-800">
                    <h3 className="text-lg sm:text-xl font-bold text-white neon-text-cyan mb-4 flex items-center gap-2">
                      <Mail className="h-5 w-5 text-white drop-shadow-[0_0_6px_rgba(255, 255, 255,0.7)]" />
                      Contact & Location
                    </h3>
                    
                    {isEditingProfile ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Cell Number</label>
                          <input
                            type="tel"
                            value={editCellNumber}
                            onChange={(e) => setEditCellNumber(e.target.value)}
                            placeholder="+1 234 567 8900"
                            className="w-full px-3 py-2 bg-slate-900/70 border border-white/40 rounded-lg !text-white text-sm placeholder-slate-500 focus:outline-none focus:border-white focus:bg-white/5"
                            style={{ color: '#ffffff' }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Preferred Contact</label>
                          <select
                            value={editPreferredContact}
                            onChange={(e) => setEditPreferredContact(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900/70 border border-white/40 rounded-lg text-white text-sm focus:outline-none focus:border-white focus:bg-white/5"
                          >
                            <option value="">Select method</option>
                            <option value="Email">Email</option>
                            <option value="Telegram">Telegram</option>
                            <option value="Discord">Discord</option>
                            <option value="WhatsApp">WhatsApp</option>
                            <option value="Phone">Phone</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Country</label>
                          <input
                            type="text"
                            value={editCountry}
                            onChange={(e) => setEditCountry(e.target.value)}
                            placeholder="United States"
                            className="w-full px-3 py-2 bg-slate-900/70 border border-white/40 rounded-lg !text-white text-sm placeholder-slate-500 focus:outline-none focus:border-white focus:bg-white/5"
                            style={{ color: '#ffffff' }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">City</label>
                          <input
                            type="text"
                            value={editCity}
                            onChange={(e) => setEditCity(e.target.value)}
                            placeholder="New York"
                            className="w-full px-3 py-2 bg-slate-900/70 border border-white/40 rounded-lg !text-white text-sm placeholder-slate-500 focus:outline-none focus:border-white focus:bg-white/5"
                            style={{ color: '#ffffff' }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Timezone</label>
                          <input
                            type="text"
                            value={editTimezone}
                            onChange={(e) => setEditTimezone(e.target.value)}
                            placeholder="EST, PST, UTC+3"
                            className="w-full px-3 py-2 bg-slate-900/70 border border-white/40 rounded-lg !text-white text-sm placeholder-slate-500 focus:outline-none focus:border-white focus:bg-white/5"
                            style={{ color: '#ffffff' }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Birth Date</label>
                          <input
                            type="date"
                            value={editBirthDate}
                            onChange={(e) => setEditBirthDate(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900/70 border border-white/40 rounded-lg !text-white text-sm focus:outline-none focus:border-white focus:bg-white/5"
                            style={{ color: '#ffffff' }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="px-3 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                          <p className="text-xs text-slate-400 mb-1">Cell Number</p>
                          <span className="text-white text-sm">{accountData.cell_number || 'Not set'}</span>
                        </div>
                        <div className="px-3 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                          <p className="text-xs text-slate-400 mb-1">Preferred Contact</p>
                          <span className="text-white text-sm">{accountData.preferred_contact_method || 'Not set'}</span>
                        </div>
                        <div className="px-3 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                          <p className="text-xs text-slate-400 mb-1">Country</p>
                          <span className="text-white text-sm">{accountData.country || 'Not set'}</span>
                        </div>
                        <div className="px-3 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                          <p className="text-xs text-slate-400 mb-1">City</p>
                          <span className="text-white text-sm">{accountData.city || 'Not set'}</span>
                        </div>
                        <div className="px-3 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                          <p className="text-xs text-slate-400 mb-1">Timezone</p>
                          <span className="text-white text-sm">{accountData.timezone || 'Not set'}</span>
                        </div>
                        <div className="px-3 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                          <p className="text-xs text-slate-400 mb-1">Birth Date</p>
                          <span className="text-white text-sm">{accountData.birth_date || 'Not set'}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Trading Profile */}
                  <div className="bg-slate-900/70 rounded-xl p-6 border border-slate-800">
                    <h3 className="text-lg sm:text-xl font-bold text-white neon-text-cyan mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-white drop-shadow-[0_0_6px_rgba(255, 255, 255,0.7)]" />
                      Trading Profile
                    </h3>
                    
                    {isEditingProfile ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Experience (Years)</label>
                            <input
                              type="number"
                              value={editTradingYears}
                              onChange={(e) => setEditTradingYears(e.target.value)}
                              placeholder="3"
                              min="0"
                              className="w-full px-3 py-2 bg-slate-900/70 border border-white/40 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-white focus:bg-white/5"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Trading Style</label>
                            <select
                              value={editTradingStyle}
                              onChange={(e) => setEditTradingStyle(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-900/70 border border-white/40 rounded-lg text-white text-sm focus:outline-none focus:border-white focus:bg-white/5"
                            >
                              <option value="">Select style</option>
                              <option value="Scalper">Scalper</option>
                              <option value="Day Trader">Day Trader</option>
                              <option value="Swing Trader">Swing Trader</option>
                              <option value="Position Trader">Position Trader</option>
                              <option value="Mixed">Mixed</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Risk Tolerance</label>
                            <select
                              value={editRiskTolerance}
                              onChange={(e) => setEditRiskTolerance(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-900/70 border border-white/40 rounded-lg text-white text-sm focus:outline-none focus:border-white focus:bg-white/5"
                            >
                              <option value="">Select tolerance</option>
                              <option value="Conservative">Conservative (1-2%)</option>
                              <option value="Moderate">Moderate (2-5%)</option>
                              <option value="Aggressive">Aggressive (5%+)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Preferred Instruments</label>
                            <input
                              type="text"
                              value={editPreferredInstruments}
                              onChange={(e) => setEditPreferredInstruments(e.target.value)}
                              placeholder="Forex, Stocks, Crypto"
                              className="w-full px-3 py-2 bg-slate-900/70 border border-white/40 rounded-lg !text-white text-sm placeholder-slate-500 focus:outline-none focus:border-white focus:bg-white/5"
                              style={{ color: '#ffffff' }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Account Balance</label>
                            <select
                              value={editAccountBalance}
                              onChange={(e) => setEditAccountBalance(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-900/70 border border-white/40 rounded-lg text-white text-sm focus:outline-none focus:border-white focus:bg-white/5"
                            >
                              <option value="">Select range</option>
                              <option value="$0-$500">$0-$500</option>
                              <option value="$500-$2K">$500-$2K</option>
                              <option value="$2K-$10K">$2K-$10K</option>
                              <option value="$10K-$50K">$10K-$50K</option>
                              <option value="$50K+">$50K+</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Preferred Leverage</label>
                            <select
                              value={editPreferredLeverage}
                              onChange={(e) => setEditPreferredLeverage(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-900/70 border border-white/40 rounded-lg text-white text-sm focus:outline-none focus:border-white focus:bg-white/5"
                            >
                              <option value="">Select leverage</option>
                              <option value="1:50">1:50</option>
                              <option value="1:100">1:100</option>
                              <option value="1:200">1:200</option>
                              <option value="1:500">1:500</option>
                              <option value="1:1000">1:1000</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Favorite Trading Pairs</label>
                          <input
                            type="text"
                            value={editFavoritePairs}
                            onChange={(e) => setEditFavoritePairs(e.target.value)}
                            placeholder="EURUSD, GBPUSD, GOLD, BTC/USD"
                            className="w-full px-3 py-2 bg-slate-900/70 border border-white/40 rounded-lg !text-white text-sm placeholder-slate-500 focus:outline-none focus:border-white focus:bg-white/5"
                            style={{ color: '#ffffff' }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Trading Strategy</label>
                          <textarea
                            value={editTradingStrategy}
                            onChange={(e) => setEditTradingStrategy(e.target.value)}
                            placeholder="Describe your primary trading strategy..."
                            rows={3}
                            className="w-full px-3 py-2 bg-slate-900/70 border border-white/40 rounded-lg !text-white text-sm placeholder-slate-500 focus:outline-none focus:border-white focus:bg-white/5"
                            style={{ color: '#ffffff' }}
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Win Rate Target (%)</label>
                            <input
                              type="number"
                              value={editWinRateTarget}
                              onChange={(e) => setEditWinRateTarget(e.target.value)}
                              placeholder="65"
                              min="0"
                              max="100"
                              step="0.1"
                              className="w-full px-3 py-2 bg-slate-900/70 border border-white/40 rounded-lg !text-white text-sm placeholder-slate-500 focus:outline-none focus:border-white focus:bg-white/5"
                              style={{ color: '#ffffff' }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Monthly Profit Target</label>
                            <input
                              type="text"
                              value={editMonthlyTarget}
                              onChange={(e) => setEditMonthlyTarget(e.target.value)}
                              placeholder="$500, 10%, etc."
                              className="w-full px-3 py-2 bg-slate-900/70 border border-white/40 rounded-lg !text-white text-sm placeholder-slate-500 focus:outline-none focus:border-white focus:bg-white/5"
                              style={{ color: '#ffffff' }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Preferred Timeframe</label>
                            <select
                              value={editChartTimeframe}
                              onChange={(e) => setEditChartTimeframe(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-900/70 border border-white/40 rounded-lg text-white text-sm focus:outline-none focus:border-white focus:bg-white/5"
                            >
                              <option value="">Select timeframe</option>
                              <option value="M1">M1 (1 Minute)</option>
                              <option value="M5">M5 (5 Minutes)</option>
                              <option value="M15">M15 (15 Minutes)</option>
                              <option value="M30">M30 (30 Minutes)</option>
                              <option value="H1">H1 (1 Hour)</option>
                              <option value="H4">H4 (4 Hours)</option>
                              <option value="D1">D1 (Daily)</option>
                              <option value="W1">W1 (Weekly)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Trading Timezone</label>
                            <input
                              type="text"
                              value={editTradingTimezone}
                              onChange={(e) => setEditTradingTimezone(e.target.value)}
                              placeholder="London, New York, Asian"
                              className="w-full px-3 py-2 bg-slate-900/70 border border-white/40 rounded-lg !text-white text-sm placeholder-slate-500 focus:outline-none focus:border-white focus:bg-white/5"
                              style={{ color: '#ffffff' }}
                            />
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editUsesAutomated}
                              onChange={(e) => setEditUsesAutomated(e.target.checked)}
                              className="w-4 h-4 rounded border-white/40 bg-slate-900/70 text-white focus:ring-white focus:ring-offset-0"
                            />
                            <span className="text-sm text-slate-300">Uses Automated Trading</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editAttendsLive}
                              onChange={(e) => setEditAttendsLive(e.target.checked)}
                              className="w-4 h-4 rounded border-white/40 bg-slate-900/70 text-white focus:ring-white focus:ring-offset-0"
                            />
                            <span className="text-sm text-slate-300">Attends Live Sessions</span>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="px-3 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                            <p className="text-xs text-slate-400 mb-1">Experience</p>
                            <span className="text-white text-sm">{accountData.trading_experience_years != null ? `${accountData.trading_experience_years} years` : 'Not set'}</span>
                          </div>
                          <div className="px-3 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                            <p className="text-xs text-slate-400 mb-1">Style</p>
                            <span className="text-white text-sm">{accountData.trading_style || 'Not set'}</span>
                          </div>
                          <div className="px-3 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                            <p className="text-xs text-slate-400 mb-1">Risk Tolerance</p>
                            <span className="text-white text-sm">{accountData.risk_tolerance || 'Not set'}</span>
                          </div>
                          <div className="px-3 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                            <p className="text-xs text-slate-400 mb-1">Instruments</p>
                            <span className="text-white text-sm">{accountData.preferred_instruments || 'Not set'}</span>
                          </div>
                          <div className="px-3 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                            <p className="text-xs text-slate-400 mb-1">Account Balance</p>
                            <span className="text-white text-sm">{accountData.account_balance_range || 'Not set'}</span>
                          </div>
                          <div className="px-3 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                            <p className="text-xs text-slate-400 mb-1">Leverage</p>
                            <span className="text-white text-sm">{accountData.preferred_leverage || 'Not set'}</span>
                          </div>
                        </div>
                        <div className="px-3 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                          <p className="text-xs text-slate-400 mb-1">Favorite Pairs</p>
                          <span className="text-white text-sm">{accountData.favorite_pairs || 'Not set'}</span>
                        </div>
                        {accountData.trading_strategy && (
                          <div className="px-3 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                            <p className="text-xs text-slate-400 mb-1">Strategy</p>
                            <span className="text-white text-sm">{accountData.trading_strategy}</span>
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="px-3 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                            <p className="text-xs text-slate-400 mb-1">Win Rate Target</p>
                            <span className="text-white text-sm">{accountData.win_rate_target != null ? `${accountData.win_rate_target}%` : 'Not set'}</span>
                          </div>
                          <div className="px-3 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                            <p className="text-xs text-slate-400 mb-1">Monthly Target</p>
                            <span className="text-white text-sm">{accountData.monthly_profit_target || 'Not set'}</span>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          {accountData.uses_automated_trading && (
                            <span className="px-3 py-1 bg-white/20 border border-white/40 rounded-full text-white text-xs">
                              Automated Trading
                            </span>
                          )}
                          {accountData.attends_live_sessions && (
                            <span className="px-3 py-1 bg-white/20 border border-white/40 rounded-full text-white text-xs">
                              Attends Live Sessions
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Personality & Interests */}
                  <div className="bg-slate-900/70 rounded-xl p-6 border border-slate-800">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <User className="h-5 w-5 text-white" />
                      Personality & Interests
                    </h3>
                    
                    {isEditingProfile ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Hobbies & Interests</label>
                          <textarea
                            value={editHobbies}
                            onChange={(e) => setEditHobbies(e.target.value)}
                            placeholder="Gaming, fitness, reading, travel, etc."
                            rows={2}
                            className="w-full px-3 py-2 bg-slate-900/70 border border-white/40 rounded-lg !text-white text-sm placeholder-slate-500 focus:outline-none focus:border-white focus:bg-white/5"
                            style={{ color: '#ffffff' }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Personality Traits</label>
                          <textarea
                            value={editPersonalityTraits}
                            onChange={(e) => setEditPersonalityTraits(e.target.value)}
                            placeholder="Analytical, patient, risk-taker, disciplined, etc."
                            rows={2}
                            className="w-full px-3 py-2 bg-slate-900/70 border border-white/40 rounded-lg !text-white text-sm placeholder-slate-500 focus:outline-none focus:border-white focus:bg-white/5"
                            style={{ color: '#ffffff' }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Trading Goals</label>
                          <textarea
                            value={editTradingGoals}
                            onChange={(e) => setEditTradingGoals(e.target.value)}
                            placeholder="What are your short-term and long-term trading goals?"
                            rows={3}
                            className="w-full px-3 py-2 bg-slate-900/70 border border-white/40 rounded-lg !text-white text-sm placeholder-slate-500 focus:outline-none focus:border-white focus:bg-white/5"
                            style={{ color: '#ffffff' }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Learning Style</label>
                          <select
                            value={editLearningStyle}
                            onChange={(e) => setEditLearningStyle(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900/70 border border-white/40 rounded-lg text-white text-sm focus:outline-none focus:border-white focus:bg-white/5"
                          >
                            <option value="">Select learning style</option>
                            <option value="Visual">Visual (Charts, Videos)</option>
                            <option value="Auditory">Auditory (Podcasts, Calls)</option>
                            <option value="Reading">Reading (Articles, PDFs)</option>
                            <option value="Kinesthetic">Kinesthetic (Hands-on Practice)</option>
                            <option value="Mixed">Mixed</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Bio</label>
                          <textarea
                            value={editBio}
                            onChange={(e) => setEditBio(e.target.value)}
                            placeholder="Tell us about yourself and your trading journey..."
                            rows={4}
                            className="w-full px-3 py-2 bg-slate-900/70 border border-white/40 rounded-lg !text-white text-sm placeholder-slate-500 focus:outline-none focus:border-white focus:bg-white/5"
                            style={{ color: '#ffffff' }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {accountData.hobbies && (
                          <div className="px-3 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                            <p className="text-xs text-slate-400 mb-1">Hobbies</p>
                            <span className="text-white text-sm">{accountData.hobbies}</span>
                          </div>
                        )}
                        {accountData.personality_traits && (
                          <div className="px-3 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                            <p className="text-xs text-slate-400 mb-1">Personality Traits</p>
                            <span className="text-white text-sm">{accountData.personality_traits}</span>
                          </div>
                        )}
                        {accountData.trading_goals && (
                          <div className="px-3 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                            <p className="text-xs text-slate-400 mb-1">Trading Goals</p>
                            <span className="text-white text-sm">{accountData.trading_goals}</span>
                          </div>
                        )}
                        {accountData.learning_style && (
                          <div className="px-3 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                            <p className="text-xs text-slate-400 mb-1">Learning Style</p>
                            <span className="text-white text-sm">{accountData.learning_style}</span>
                          </div>
                        )}
                        {accountData.bio && (
                          <div className="px-3 py-2 bg-slate-900/70 rounded-lg border border-slate-800">
                            <p className="text-xs text-slate-400 mb-1">Bio</p>
                            <span className="text-white text-sm whitespace-pre-wrap">{accountData.bio}</span>
                          </div>
                        )}
                        {!accountData.hobbies && !accountData.personality_traits && !accountData.trading_goals && !accountData.learning_style && !accountData.bio && (
                          <p className="text-center text-slate-500 py-4">No information added yet</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* VIP Status */}
                  <div className="bg-slate-900/70 rounded-xl p-6 border border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Crown className="h-5 w-5 text-yellow-400" />
                        VIP Status
                      </h3>
                      {accountData.is_vip ? (
                        <span className="px-3 py-1 bg-white/20 border border-white/40 rounded-full text-white text-sm font-semibold">
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
                    <div className="bg-slate-900/70 rounded-xl p-6 border border-slate-800">
                      <h3 className="text-lg sm:text-xl font-bold text-white neon-text-cyan mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-white drop-shadow-[0_0_6px_rgba(255, 255, 255,0.7)]" />
                        Affiliate Dashboard
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-slate-900/70 rounded-lg p-4 border border-slate-800">
                          <p className="text-sm text-slate-400 mb-1">Affiliate Code</p>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-white">{accountData.affiliate_code}</span>
                            <button
                              onClick={copyAffiliateCode}
                              className="p-2 hover:bg-white/20 rounded border border-transparent hover:border-white/40 transition-colors"
                            >
                              <Copy className="h-4 w-4 text-white" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                          <p className="text-sm text-slate-400 mb-1">Total Referrals</p>
                          <span className="text-lg font-bold text-white">{accountData.total_referred_manual ?? 0}</span>
                        </div>
                        
                        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                          <p className="text-sm text-slate-400 mb-1">Commission Balance</p>
                          <span className="text-lg font-bold text-white">${(accountData.commission_balance ?? 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MT5 Accounts Section */}
                  <div className="bg-slate-900/70 rounded-xl p-6 border border-slate-800">
                    <h3 className="text-lg sm:text-xl font-bold text-white neon-text-cyan mb-4 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-white drop-shadow-[0_0_6px_rgba(255, 255, 255,0.7)]" />
                      MT5 Trading Accounts
                    </h3>

                    {/* Add New MT5 Account */}
                    <div className="mb-6 p-4 bg-slate-900/70 rounded-lg border border-slate-800">
                      <p className="text-sm text-slate-400 mb-3">Add New MT5 Account</p>
                      <div className="flex flex-col gap-3">
                        <input
                          type="text"
                          placeholder="MT5 Account ID"
                          value={newMT5Id}
                          onChange={(e) => setNewMT5Id(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-900/70 border border-slate-800 rounded-lg !text-white placeholder-slate-500 focus:outline-none focus:border-white/70 focus:bg-white/5"
                          style={{ color: '#ffffff' }}
                        />
                        <div className="flex flex-col sm:flex-row gap-3">
                          <select
                            value={newBrokerName}
                            onChange={(e) => setNewBrokerName(e.target.value as "XM" | "Vantage" | "")}
                            className="flex-1 px-4 py-2 bg-slate-900/70 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-white/70 focus:bg-white/5"
                          >
                            <option value="">Select Broker</option>
                            <option value="XM">XM</option>
                            <option value="Vantage">Vantage</option>
                          </select>
                          <button
                            onClick={handleAddMT5Account}
                            disabled={saving || !newMT5Id.trim() || !newBrokerName}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 disabled:bg-slate-800 disabled:cursor-not-allowed text-white border border-white/40 rounded-lg transition-colors whitespace-nowrap"
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
                    </div>

                    {/* MT5 Accounts List */}
                    {accountData.mt5_accounts.length > 0 ? (
                      <div className="space-y-3">
                        {accountData.mt5_accounts.map((account) => (
                          <div
                            key={account.id}
                            className="p-4 bg-slate-900/70 rounded-lg border border-slate-800 hover:border-white/40 transition-colors"
                          >
                            {editingMT5Id === account.mt5_id ? (
                              // Edit Mode
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  value={editMT5AccountId}
                                  onChange={(e) => setEditMT5AccountId(e.target.value)}
                                  placeholder="MT5 Account ID"
                                  className="w-full px-4 py-2 bg-slate-900/70 border border-white/40 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-white focus:bg-white/5"
                                />
                                <select
                                  value={editMT5Broker}
                                  onChange={(e) => setEditMT5Broker(e.target.value as "XM" | "Vantage")}
                                  className="w-full px-4 py-2 bg-slate-900/70 border border-white/40 rounded-lg text-white focus:outline-none focus:border-white focus:bg-white/5"
                                >
                                  <option value="">Select Broker</option>
                                  <option value="XM">XM</option>
                                  <option value="Vantage">Vantage</option>
                                </select>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditMT5Account(account.mt5_id)}
                                    disabled={saving || !editMT5AccountId.trim() || !editMT5Broker}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 disabled:bg-slate-800 text-white border border-white/40 rounded-lg transition-colors"
                                  >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Save Changes
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingMT5Id(null);
                                      setEditMT5AccountId("");
                                      setEditMT5Broker("");
                                    }}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // View Mode
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-mono text-white font-semibold">{account.mt5_id}</span>
                                    {account.is_primary && (
                                      <span className="px-2 py-0.5 bg-white/20 border border-white/40 rounded text-white text-xs">
                                        Primary
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-slate-400">
                                    <span>Broker: {account.broker_name || 'Unknown'}</span>
                                    <span className={`px-2 py-0.5 rounded ${
                                      account.status === 'Verified' 
                                        ? 'bg-white/20 border border-white/40 text-white' 
                                        : 'bg-white/20 border border-white/40 text-white'
                                    }`}>
                                      {account.status}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingMT5Id(account.mt5_id);
                                      setEditMT5AccountId(account.mt5_id);
                                      setEditMT5Broker((account.broker_name === "XM" || account.broker_name === "Vantage" ? account.broker_name : "") as "XM" | "Vantage" | "");
                                    }}
                                    disabled={saving}
                                    className="p-2 hover:bg-white/20 rounded border border-transparent hover:border-white/40 transition-colors disabled:opacity-50"
                                  >
                                    <Edit2 className="h-4 w-4 text-white" />
                                  </button>
                                  {!account.is_primary && (
                                    <button
                                      onClick={() => handleRemoveMT5Account(account.mt5_id)}
                                      disabled={saving}
                                      className="p-2 hover:bg-red-600/20 rounded border border-transparent hover:border-red-500/40 transition-colors disabled:opacity-50"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-300" />
                                    </button>
                                  )}
                                </div>
                              </div>
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
                  <div className="bg-white/10 rounded-xl p-6 border border-white/40">
                    <h3 className="text-lg font-bold text-white neon-text-blue mb-2">Need a Broker Account?</h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Register with our partner brokers to start trading and unlock exclusive benefits.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          // Store return flag to AccountManager
                          localStorage.setItem('return_to_account_manager', 'true');
                          onClose(); // Close modal
                          router.push('/recruit'); // Navigate to recruit page
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white border border-white/40 rounded-lg transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Register with Brokers
                      </button>
                    </div>
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
