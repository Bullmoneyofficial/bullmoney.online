"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Edit3, RefreshCw, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalTheme } from "@/contexts/GlobalThemeProvider";
import { createSupabaseClient } from "@/lib/supabase";
import DesktopAffiliateAdminPanel from "./DesktopAffiliateAdminPanel";
import { RecruitAdminRecord } from "@/app/recruit/types";

const supabase = createSupabaseClient();

const TIERS = ["Starter", "Bronze", "Silver", "Gold", "Elite"];
const BROKERS = ["XM", "Vantage"];
const CONTACT_METHODS = ["email", "phone", "telegram", "discord"];
const TRADING_STYLES = ["scalper", "day trader", "swing trader", "position trader"];
const RISK_TOLERANCE = ["conservative", "moderate", "aggressive"];
const TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1"];

const getBonusMultiplier = (monthlyLots: number) => {
  if (monthlyLots >= 50) return 2;
  if (monthlyLots >= 20) return 1.5;
  return 1;
};

export default function AffiliateAdminPanel() {
  const { isXMUser } = useGlobalTheme();
  const [recruits, setRecruits] = useState<RecruitAdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [drafts, setDrafts] = useState<Record<string | number, RecruitAdminRecord>>({});
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  const fetchRecruits = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("recruits")
        .select(
          "id,created_at,email,mt5_id,affiliate_code,referred_by_code,social_handle,task_broker_verified,task_social_verified,status,commission_balance,total_referred_manual,used_code,image_url,is_vip,vip_updated_at,full_name,phone,telegram_username,discord_username,notes,instagram_username,facebook_username,twitter_username,youtube_username,twitch_username,tiktok_username,cell_number,country,city,timezone,birth_date,preferred_contact_method,trading_experience_years,trading_style,risk_tolerance,preferred_instruments,trading_timezone,account_balance_range,preferred_leverage,favorite_pairs,trading_strategy,win_rate_target,monthly_profit_target,hobbies,personality_traits,trading_goals,learning_style,notification_preferences,preferred_chart_timeframe,uses_automated_trading,attends_live_sessions,bio,notifications_enabled,notify_trades,notify_livestreams,notify_news,notify_vip,notification_sound,affiliate_tier,affiliate_tier_updated_at,total_earnings,pending_earnings,paid_earnings,last_payout_date,last_payout_amount,total_referred_traders,active_traders,total_lots_traded,monthly_lots_traded,social_posts_this_week,social_posts_this_month,social_bonus_multiplier,last_social_post_date,preferred_broker,conversion_rate,avg_trader_volume,best_month_earnings,payment_method,payment_details,payment_verified,custom_referral_link,link_clicks,link_last_clicked"
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRecruits((data || []) as RecruitAdminRecord[]);
    } catch (err: any) {
      console.error("Admin fetch error:", err);
      setError("Unable to load recruits.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecruits();
    try {
      const savedSession = localStorage.getItem("bullmoney_session");
      const email = savedSession ? JSON.parse(savedSession)?.email : null;
      setAdminEmail(email ? String(email).toLowerCase() : null);
    } catch (err) {
      setAdminEmail(null);
    }
  }, []);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return recruits.filter((r) => {
      return (
        r.email?.toLowerCase().includes(s) ||
        String(r.id).includes(s) ||
        String(r.mt5_id || "").includes(s) ||
        String(r.affiliate_code || "").toLowerCase().includes(s) ||
        String(r.referred_by_code || "").toLowerCase().includes(s)
      );
    });
  }, [recruits, search]);

  const openEditor = (record: RecruitAdminRecord) => {
    setExpandedId((prev) => (prev === record.id ? null : record.id));
    setDrafts((prev) => ({
      ...prev,
      [record.id]: {
        ...record,
        payment_details: record.payment_details ? JSON.stringify(record.payment_details, null, 2) : "",
      },
    }));
    setSuccess(null);
  };

  const updateField = (id: string | number, key: keyof RecruitAdminRecord, value: any) => {
    setDrafts((prev) => {
      const current = prev[id];
      if (!current) return prev;
      return { ...prev, [id]: { ...current, [key]: value } };
    });
  };

  const saveChanges = async (recordId: string | number) => {
    const form = drafts[recordId];
    if (!form) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (!adminEmail) {
        setError("Unauthorized: admin email not found in session.");
        setSaving(false);
        return;
      }
      const monthlyLots = Number(form.monthly_lots_traded || 0);
      const bonusMultiplier = getBonusMultiplier(monthlyLots);
      let parsedPaymentDetails: any = null;
      if (typeof form.payment_details === "string" && form.payment_details.trim()) {
        try {
          parsedPaymentDetails = JSON.parse(form.payment_details);
        } catch (jsonError) {
          setError("Invalid JSON in Payment Details.");
          setSaving(false);
          return;
        }
      }

      const payload = {
        email: form.email,
        mt5_id: form.mt5_id || null,
        affiliate_code: form.affiliate_code || null,
        referred_by_code: form.referred_by_code || null,
        social_handle: form.social_handle || null,
        task_broker_verified: Boolean(form.task_broker_verified),
        task_social_verified: Boolean(form.task_social_verified),
        status: form.status || null,
        commission_balance: Number(form.commission_balance || 0),
        total_referred_manual: Number(form.total_referred_manual || 0),
        used_code: Boolean(form.used_code),
        image_url: form.image_url || null,
        is_vip: Boolean(form.is_vip),
        vip_updated_at: form.vip_updated_at || null,
        full_name: form.full_name || null,
        phone: form.phone || null,
        telegram_username: form.telegram_username || null,
        discord_username: form.discord_username || null,
        notes: form.notes || null,
        instagram_username: form.instagram_username || null,
        facebook_username: form.facebook_username || null,
        twitter_username: form.twitter_username || null,
        youtube_username: form.youtube_username || null,
        twitch_username: form.twitch_username || null,
        tiktok_username: form.tiktok_username || null,
        cell_number: form.cell_number || null,
        country: form.country || null,
        city: form.city || null,
        timezone: form.timezone || null,
        birth_date: form.birth_date || null,
        preferred_contact_method: form.preferred_contact_method || null,
        trading_experience_years: Number(form.trading_experience_years || 0),
        trading_style: form.trading_style || null,
        risk_tolerance: form.risk_tolerance || null,
        preferred_instruments: form.preferred_instruments || null,
        trading_timezone: form.trading_timezone || null,
        account_balance_range: form.account_balance_range || null,
        preferred_leverage: form.preferred_leverage || null,
        favorite_pairs: form.favorite_pairs || null,
        trading_strategy: form.trading_strategy || null,
        win_rate_target: Number(form.win_rate_target || 0),
        monthly_profit_target: form.monthly_profit_target || null,
        hobbies: form.hobbies || null,
        personality_traits: form.personality_traits || null,
        trading_goals: form.trading_goals || null,
        learning_style: form.learning_style || null,
        notification_preferences: form.notification_preferences || null,
        preferred_chart_timeframe: form.preferred_chart_timeframe || null,
        uses_automated_trading: Boolean(form.uses_automated_trading),
        attends_live_sessions: Boolean(form.attends_live_sessions),
        bio: form.bio || null,
        notifications_enabled: Boolean(form.notifications_enabled),
        notify_trades: Boolean(form.notify_trades),
        notify_livestreams: Boolean(form.notify_livestreams),
        notify_news: Boolean(form.notify_news),
        notify_vip: Boolean(form.notify_vip),
        notification_sound: Boolean(form.notification_sound),
        affiliate_tier: form.affiliate_tier || null,
        affiliate_tier_updated_at: form.affiliate_tier_updated_at || null,
        total_earnings: Number(form.total_earnings || 0),
        pending_earnings: Number(form.pending_earnings || 0),
        paid_earnings: Number(form.paid_earnings || 0),
        last_payout_date: form.last_payout_date || null,
        last_payout_amount: Number(form.last_payout_amount || 0),
        total_referred_traders: Number(form.total_referred_traders || 0),
        active_traders: Number(form.active_traders || 0),
        total_lots_traded: Number(form.total_lots_traded || 0),
        monthly_lots_traded: monthlyLots,
        social_posts_this_week: Number(form.social_posts_this_week || 0),
        social_posts_this_month: Number(form.social_posts_this_month || 0),
        social_bonus_multiplier: bonusMultiplier,
        last_social_post_date: form.last_social_post_date || null,
        preferred_broker: form.preferred_broker || null,
        conversion_rate: Number(form.conversion_rate || 0),
        avg_trader_volume: Number(form.avg_trader_volume || 0),
        best_month_earnings: Number(form.best_month_earnings || 0),
        payment_method: form.payment_method || null,
        payment_details: parsedPaymentDetails,
        payment_verified: Boolean(form.payment_verified),
        custom_referral_link: form.custom_referral_link || null,
        link_clicks: Number(form.link_clicks || 0),
        link_last_clicked: form.link_last_clicked || null,
      };

      const response = await fetch("/api/affiliate-admin/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: recordId, updates: payload, adminEmail }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = data?.error || "Update failed.";
        const details = [data?.details, data?.hint].filter(Boolean).join(" • ");
        throw new Error(details ? `${message} (${details})` : message);
      }

      setSuccess("Changes saved.");
      await fetchRecruits();
    } catch (err: any) {
      console.error("Admin update error:", err);
      setError(err?.message || "Update failed. Check permissions or data types.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full text-white">
      <div className="max-w-full mx-auto p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black">Affiliate Admin Panel</h2>
            <p className="text-sm text-slate-400">Edit every recruit column (except password).</p>
          </div>
          <button
            onClick={fetchRecruits}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/70 hover:bg-slate-800/70 border border-slate-800 text-sm whitespace-nowrap"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/30 border border-red-500/20 text-red-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-white/10/30 border border-white/20 text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {success}
          </div>
        )}
        {!adminEmail && (
          <div className="mb-4 p-3 rounded-lg bg-amber-950/30 border border-amber-500/20 text-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Admin email not detected. Set a session or add your email to NEXT_PUBLIC_AFFILIATE_ADMIN_EMAILS.
          </div>
        )}

        {/* Mobile Layout */}
        <div className="lg:hidden">
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-800">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by email, ID, MT5, affiliate code"
                    className="w-full bg-slate-900/70 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="divide-y divide-slate-800 max-h-[70vh] overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-slate-500">Loading recruits...</div>
              ) : filtered.length === 0 ? (
                <div className="p-6 text-center text-slate-500">No recruits found.</div>
              ) : (
                filtered.map((r) => {
                  const isOpen = expandedId === r.id;
                  const draft = drafts[r.id] || r;
                  return (
                    <div key={String(r.id)} className="bg-slate-950/70">
                      <button
                        onClick={() => openEditor(r)}
                        className={cn(
                          "w-full text-left p-4 hover:bg-slate-900/70 transition-colors",
                          isOpen && "bg-slate-900/70"
                        )}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center text-slate-400">
                              {r.image_url ? (
                                <img src={r.image_url} alt={r.email} className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-xs">No Img</span>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">{r.email}</p>
                              <p className="text-xs text-slate-500">ID: {r.id} • MT5: {r.mt5_id || "—"}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-400">Lots</p>
                            <p className="text-sm font-mono text-white">{Number(r.total_lots_traded || 0).toFixed(2)}</p>
                          </div>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="p-4 border-t border-slate-800 space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-bold text-white">Edit Recruit</h3>
                              <p className="text-xs text-slate-500">{draft.email}</p>
                              <p className="text-[11px] text-slate-600">ID: {draft.id} • Created: {draft.created_at}</p>
                            </div>
                            <Edit3 className="w-4 h-4 text-slate-400" />
                          </div>

                          <Section title="Core Profile">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <Field label="Email" value={draft.email || ""} onChange={(v) => updateField(r.id, "email", v)} />
                              <Field label="Status" value={draft.status || ""} onChange={(v) => updateField(r.id, "status", v)} />
                              <Field label="MT5 ID" value={draft.mt5_id || ""} onChange={(v) => updateField(r.id, "mt5_id", v)} />
                              <Field label="Affiliate Code" value={draft.affiliate_code || ""} onChange={(v) => updateField(r.id, "affiliate_code", v)} />
                              <Field label="Referred By" value={draft.referred_by_code || ""} onChange={(v) => updateField(r.id, "referred_by_code", v)} />
                              <Field label="Social Handle" value={draft.social_handle || ""} onChange={(v) => updateField(r.id, "social_handle", v)} />
                              <Field label="Image URL" value={draft.image_url || ""} onChange={(v) => updateField(r.id, "image_url", v)} />
                              <Field label="Full Name" value={draft.full_name || ""} onChange={(v) => updateField(r.id, "full_name", v)} />
                              <Field label="Phone" value={draft.phone || ""} onChange={(v) => updateField(r.id, "phone", v)} />
                              <Field label="Telegram" value={draft.telegram_username || ""} onChange={(v) => updateField(r.id, "telegram_username", v)} />
                              <Field label="Discord" value={draft.discord_username || ""} onChange={(v) => updateField(r.id, "discord_username", v)} />
                              <Field label="Commission Balance" value={draft.commission_balance} onChange={(v) => updateField(r.id, "commission_balance", v)} type="number" />
                              <Field label="Total Referred Manual" value={draft.total_referred_manual} onChange={(v) => updateField(r.id, "total_referred_manual", v)} type="number" />
                              <ToggleField label="Broker Verified" value={Boolean(draft.task_broker_verified)} onChange={(v) => updateField(r.id, "task_broker_verified", v)} />
                              <ToggleField label="Social Verified" value={Boolean(draft.task_social_verified)} onChange={(v) => updateField(r.id, "task_social_verified", v)} />
                              <ToggleField label="Used Code" value={Boolean(draft.used_code)} onChange={(v) => updateField(r.id, "used_code", v)} />
                              <ToggleField label="VIP" value={Boolean(draft.is_vip)} onChange={(v) => updateField(r.id, "is_vip", v)} />
                              <Field label="VIP Updated At" value={draft.vip_updated_at || ""} onChange={(v) => updateField(r.id, "vip_updated_at", v)} />
                            </div>
                            <TextAreaField label="Notes" value={draft.notes || ""} onChange={(v) => updateField(r.id, "notes", v)} />
                          </Section>

                          <Section title="Contact & Social">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <Field label="Cell" value={draft.cell_number || ""} onChange={(v) => updateField(r.id, "cell_number", v)} />
                              <Field label="Country" value={draft.country || ""} onChange={(v) => updateField(r.id, "country", v)} />
                              <Field label="City" value={draft.city || ""} onChange={(v) => updateField(r.id, "city", v)} />
                              <Field label="Timezone" value={draft.timezone || ""} onChange={(v) => updateField(r.id, "timezone", v)} />
                              <Field label="Birth Date" value={draft.birth_date || ""} onChange={(v) => updateField(r.id, "birth_date", v)} />
                              <SelectField label="Preferred Contact" value={draft.preferred_contact_method || ""} options={CONTACT_METHODS} onChange={(v) => updateField(r.id, "preferred_contact_method", v)} />
                              <Field label="Instagram" value={draft.instagram_username || ""} onChange={(v) => updateField(r.id, "instagram_username", v)} />
                              <Field label="Facebook" value={draft.facebook_username || ""} onChange={(v) => updateField(r.id, "facebook_username", v)} />
                              <Field label="Twitter" value={draft.twitter_username || ""} onChange={(v) => updateField(r.id, "twitter_username", v)} />
                              <Field label="YouTube" value={draft.youtube_username || ""} onChange={(v) => updateField(r.id, "youtube_username", v)} />
                              <Field label="Twitch" value={draft.twitch_username || ""} onChange={(v) => updateField(r.id, "twitch_username", v)} />
                              <Field label="TikTok" value={draft.tiktok_username || ""} onChange={(v) => updateField(r.id, "tiktok_username", v)} />
                            </div>
                            <TextAreaField label="Notification Preferences" value={draft.notification_preferences || ""} onChange={(v) => updateField(r.id, "notification_preferences", v)} />
                          </Section>

                          <Section title="Trading Profile">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <Field label="Experience (Years)" value={draft.trading_experience_years} onChange={(v) => updateField(r.id, "trading_experience_years", v)} type="number" />
                              <SelectField label="Trading Style" value={draft.trading_style || ""} options={TRADING_STYLES} onChange={(v) => updateField(r.id, "trading_style", v)} />
                              <SelectField label="Risk Tolerance" value={draft.risk_tolerance || ""} options={RISK_TOLERANCE} onChange={(v) => updateField(r.id, "risk_tolerance", v)} />
                              <Field label="Preferred Instruments" value={draft.preferred_instruments || ""} onChange={(v) => updateField(r.id, "preferred_instruments", v)} />
                              <Field label="Trading Timezone" value={draft.trading_timezone || ""} onChange={(v) => updateField(r.id, "trading_timezone", v)} />
                              <Field label="Account Balance Range" value={draft.account_balance_range || ""} onChange={(v) => updateField(r.id, "account_balance_range", v)} />
                              <Field label="Preferred Leverage" value={draft.preferred_leverage || ""} onChange={(v) => updateField(r.id, "preferred_leverage", v)} />
                              <Field label="Favorite Pairs" value={draft.favorite_pairs || ""} onChange={(v) => updateField(r.id, "favorite_pairs", v)} />
                              <Field label="Win Rate Target" value={draft.win_rate_target} onChange={(v) => updateField(r.id, "win_rate_target", v)} type="number" />
                              <Field label="Monthly Profit Target" value={draft.monthly_profit_target || ""} onChange={(v) => updateField(r.id, "monthly_profit_target", v)} />
                              <SelectField label="Chart Timeframe" value={draft.preferred_chart_timeframe || ""} options={TIMEFRAMES} onChange={(v) => updateField(r.id, "preferred_chart_timeframe", v)} />
                              <ToggleField label="Uses Automation" value={Boolean(draft.uses_automated_trading)} onChange={(v) => updateField(r.id, "uses_automated_trading", v)} />
                              <ToggleField label="Attends Live Sessions" value={Boolean(draft.attends_live_sessions)} onChange={(v) => updateField(r.id, "attends_live_sessions", v)} />
                            </div>
                            <TextAreaField label="Trading Strategy" value={draft.trading_strategy || ""} onChange={(v) => updateField(r.id, "trading_strategy", v)} />
                            <TextAreaField label="Bio" value={draft.bio || ""} onChange={(v) => updateField(r.id, "bio", v)} />
                            <TextAreaField label="Hobbies" value={draft.hobbies || ""} onChange={(v) => updateField(r.id, "hobbies", v)} />
                            <TextAreaField label="Personality Traits" value={draft.personality_traits || ""} onChange={(v) => updateField(r.id, "personality_traits", v)} />
                            <TextAreaField label="Trading Goals" value={draft.trading_goals || ""} onChange={(v) => updateField(r.id, "trading_goals", v)} />
                            <TextAreaField label="Learning Style" value={draft.learning_style || ""} onChange={(v) => updateField(r.id, "learning_style", v)} />
                          </Section>

                          <Section title="Affiliate Program Metrics">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <SelectField label="Tier" value={draft.affiliate_tier || "Starter"} options={TIERS} onChange={(v) => updateField(r.id, "affiliate_tier", v)} />
                              <Field label="Tier Updated At" value={draft.affiliate_tier_updated_at || ""} onChange={(v) => updateField(r.id, "affiliate_tier_updated_at", v)} />
                              <Field label="Total Earnings" value={draft.total_earnings} onChange={(v) => updateField(r.id, "total_earnings", v)} type="number" />
                              <Field label="Pending Earnings" value={draft.pending_earnings} onChange={(v) => updateField(r.id, "pending_earnings", v)} type="number" />
                              <Field label="Paid Earnings" value={draft.paid_earnings} onChange={(v) => updateField(r.id, "paid_earnings", v)} type="number" />
                              <Field label="Last Payout Date" value={draft.last_payout_date || ""} onChange={(v) => updateField(r.id, "last_payout_date", v)} />
                              <Field label="Last Payout Amount" value={draft.last_payout_amount} onChange={(v) => updateField(r.id, "last_payout_amount", v)} type="number" />
                              <Field label="Total Referred" value={draft.total_referred_traders} onChange={(v) => updateField(r.id, "total_referred_traders", v)} type="number" />
                              <Field label="Active Traders" value={draft.active_traders} onChange={(v) => updateField(r.id, "active_traders", v)} type="number" />
                              <Field label="Total Lots" value={draft.total_lots_traded} onChange={(v) => updateField(r.id, "total_lots_traded", v)} type="number" />
                              <Field label="Monthly Lots" value={draft.monthly_lots_traded} onChange={(v) => updateField(r.id, "monthly_lots_traded", v)} type="number" />
                              <ReadOnlyField
                                label="Bonus Multiplier (Auto)"
                                value={getBonusMultiplier(Number(draft.monthly_lots_traded || 0))}
                              />
                              <Field label="Last Social Post" value={draft.last_social_post_date || ""} onChange={(v) => updateField(r.id, "last_social_post_date", v)} />
                              <SelectField label="Preferred Broker" value={draft.preferred_broker || "Vantage"} options={BROKERS} onChange={(v) => updateField(r.id, "preferred_broker", v)} />
                              <Field label="Conversion %" value={draft.conversion_rate} onChange={(v) => updateField(r.id, "conversion_rate", v)} type="number" />
                              <Field label="Avg Trader Volume" value={draft.avg_trader_volume} onChange={(v) => updateField(r.id, "avg_trader_volume", v)} type="number" />
                              <Field label="Best Month Earnings" value={draft.best_month_earnings} onChange={(v) => updateField(r.id, "best_month_earnings", v)} type="number" />
                              <Field label="Payment Method" value={draft.payment_method || ""} onChange={(v) => updateField(r.id, "payment_method", v)} />
                              <Field label="Custom Referral Link" value={draft.custom_referral_link || ""} onChange={(v) => updateField(r.id, "custom_referral_link", v)} />
                              <Field label="Link Clicks" value={draft.link_clicks} onChange={(v) => updateField(r.id, "link_clicks", v)} type="number" />
                              <Field label="Link Last Clicked" value={draft.link_last_clicked || ""} onChange={(v) => updateField(r.id, "link_last_clicked", v)} />
                              <ToggleField label="Payment Verified" value={Boolean(draft.payment_verified)} onChange={(v) => updateField(r.id, "payment_verified", v)} />
                              <ToggleField label="Notifications Enabled" value={Boolean(draft.notifications_enabled)} onChange={(v) => updateField(r.id, "notifications_enabled", v)} />
                              <ToggleField label="Notify Trades" value={Boolean(draft.notify_trades)} onChange={(v) => updateField(r.id, "notify_trades", v)} />
                              <ToggleField label="Notify Livestreams" value={Boolean(draft.notify_livestreams)} onChange={(v) => updateField(r.id, "notify_livestreams", v)} />
                              <ToggleField label="Notify News" value={Boolean(draft.notify_news)} onChange={(v) => updateField(r.id, "notify_news", v)} />
                              <ToggleField label="Notify VIP" value={Boolean(draft.notify_vip)} onChange={(v) => updateField(r.id, "notify_vip", v)} />
                              <ToggleField label="Notification Sound" value={Boolean(draft.notification_sound)} onChange={(v) => updateField(r.id, "notification_sound", v)} />
                            </div>
                            <TextAreaField label="Payment Details (JSON)" value={String(draft.payment_details || "")} onChange={(v) => updateField(r.id, "payment_details", v)} />
                          </Section>

                          <button
                            onClick={() => saveChanges(r.id)}
                            disabled={saving}
                            className={cn(
                              "w-full py-2.5 rounded-lg font-semibold text-sm transition-all",
                              isXMUser
                                ? "bg-red-600 hover:bg-red-500"
                                : "bg-white hover:bg-white",
                              saving && "opacity-60 cursor-not-allowed"
                            )}
                          >
                            {saving ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
        </div>

        {/* Desktop Layout - Table View */}
        <DesktopAffiliateAdminPanel
          search={search}
          setSearch={setSearch}
          filtered={filtered}
          loading={loading}
          expandedId={expandedId}
          onOpenEditor={openEditor}
          renderEditForm={renderDesktopEditForm}
        />
      </div>
    </div>
  );

  function renderDesktopEditForm(r: RecruitAdminRecord) {
    const draft = drafts[r.id] || r;
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Edit Recruit</h3>
          <p className="text-xs text-slate-500">{draft.email} • ID: {draft.id}</p>
        </div>

        <Section title="Core Profile">
          <div className="grid grid-cols-4 gap-4">
            <Field label="Email" value={draft.email || ""} onChange={(v) => updateField(r.id, "email", v)} />
            <Field label="Status" value={draft.status || ""} onChange={(v) => updateField(r.id, "status", v)} />
            <Field label="MT5 ID" value={draft.mt5_id || ""} onChange={(v) => updateField(r.id, "mt5_id", v)} />
            <Field label="Affiliate Code" value={draft.affiliate_code || ""} onChange={(v) => updateField(r.id, "affiliate_code", v)} />
            <Field label="Referred By" value={draft.referred_by_code || ""} onChange={(v) => updateField(r.id, "referred_by_code", v)} />
            <Field label="Social Handle" value={draft.social_handle || ""} onChange={(v) => updateField(r.id, "social_handle", v)} />
            <Field label="Image URL" value={draft.image_url || ""} onChange={(v) => updateField(r.id, "image_url", v)} />
            <Field label="Full Name" value={draft.full_name || ""} onChange={(v) => updateField(r.id, "full_name", v)} />
            <Field label="Commission Balance" value={draft.commission_balance} onChange={(v) => updateField(r.id, "commission_balance", v)} type="number" />
            <Field label="Total Referred Manual" value={draft.total_referred_manual} onChange={(v) => updateField(r.id, "total_referred_manual", v)} type="number" />
            <ToggleField label="Broker Verified" value={Boolean(draft.task_broker_verified)} onChange={(v) => updateField(r.id, "task_broker_verified", v)} />
            <ToggleField label="Social Verified" value={Boolean(draft.task_social_verified)} onChange={(v) => updateField(r.id, "task_social_verified", v)} />
          </div>
          <TextAreaField label="Notes" value={draft.notes || ""} onChange={(v) => updateField(r.id, "notes", v)} />
        </Section>

        <Section title="Contact & Social">
          <div className="grid grid-cols-4 gap-4">
            <Field label="Phone" value={draft.phone || ""} onChange={(v) => updateField(r.id, "phone", v)} />
            <Field label="Country" value={draft.country || ""} onChange={(v) => updateField(r.id, "country", v)} />
            <Field label="City" value={draft.city || ""} onChange={(v) => updateField(r.id, "city", v)} />
            <Field label="Telegram" value={draft.telegram_username || ""} onChange={(v) => updateField(r.id, "telegram_username", v)} />
            <Field label="Discord" value={draft.discord_username || ""} onChange={(v) => updateField(r.id, "discord_username", v)} />
            <Field label="Instagram" value={draft.instagram_username || ""} onChange={(v) => updateField(r.id, "instagram_username", v)} />
            <Field label="Twitter" value={draft.twitter_username || ""} onChange={(v) => updateField(r.id, "twitter_username", v)} />
            <Field label="YouTube" value={draft.youtube_username || ""} onChange={(v) => updateField(r.id, "youtube_username", v)} />
          </div>
        </Section>

        <Section title="Affiliate Metrics">
          <div className="grid grid-cols-4 gap-4">
            <SelectField label="Tier" value={draft.affiliate_tier || "Starter"} options={TIERS} onChange={(v) => updateField(r.id, "affiliate_tier", v)} />
            <Field label="Total Earnings" value={draft.total_earnings} onChange={(v) => updateField(r.id, "total_earnings", v)} type="number" />
            <Field label="Total Referred" value={draft.total_referred_traders} onChange={(v) => updateField(r.id, "total_referred_traders", v)} type="number" />
            <Field label="Active Traders" value={draft.active_traders} onChange={(v) => updateField(r.id, "active_traders", v)} type="number" />
            <Field label="Total Lots" value={draft.total_lots_traded} onChange={(v) => updateField(r.id, "total_lots_traded", v)} type="number" />
            <Field label="Monthly Lots" value={draft.monthly_lots_traded} onChange={(v) => updateField(r.id, "monthly_lots_traded", v)} type="number" />
            <Field label="Conversion %" value={draft.conversion_rate} onChange={(v) => updateField(r.id, "conversion_rate", v)} type="number" />
            <SelectField label="Preferred Broker" value={draft.preferred_broker || "Vantage"} options={BROKERS} onChange={(v) => updateField(r.id, "preferred_broker", v)} />
          </div>
        </Section>

        <button
          onClick={() => saveChanges(r.id)}
          disabled={saving}
          className={cn(
            "px-6 py-2.5 rounded-lg font-semibold text-sm transition-all",
            isXMUser ? "bg-red-600 hover:bg-red-500" : "bg-white hover:bg-white",
            saving && "opacity-60 cursor-not-allowed"
          )}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    );
  }
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <div className="text-xs uppercase tracking-widest text-slate-500">{title}</div>
    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-3">
      {children}
    </div>
  </div>
);

const Field = ({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  type?: "text" | "number";
}) => (
  <label className="text-xs text-slate-400">
    {label}
    <input
      type={type}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 w-full bg-slate-900/70 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
    />
  </label>
);

const TextAreaField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) => (
  <label className="text-xs text-slate-400">
    {label}
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 w-full bg-slate-900/70 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none min-h-[90px]"
    />
  </label>
);

const ToggleField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) => (
  <label className="text-xs text-slate-400 flex items-center justify-between gap-2">
    <span>{label}</span>
    <input
      type="checkbox"
      checked={value}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 rounded border border-slate-700 bg-slate-900"
    />
  </label>
);

const ReadOnlyField = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <label className="text-xs text-slate-400">
    {label}
    <div className="mt-1 w-full bg-slate-900/70 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white">
      {value}
    </div>
  </label>
);

const SelectField = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) => (
  <label className="text-xs text-slate-400">
    {label}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 w-full bg-slate-900/70 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
    >
      {options.map((opt) => (
        <option key={opt} value={opt} className="bg-slate-950">
          {opt}
        </option>
      ))}
    </select>
  </label>
);
