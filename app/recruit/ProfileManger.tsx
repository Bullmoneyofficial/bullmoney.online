"use client";

import React from 'react';
import { CheckCircle2, Save } from 'lucide-react';

export interface AffiliateProfileForm {
  email: string;
  full_name: string;
  telegram_username: string;
  discord_username: string;
  instagram_username: string;
  facebook_username: string;
  twitter_username: string;
  youtube_username: string;
  twitch_username: string;
  tiktok_username: string;
  cell_number: string;
  preferred_contact_method: string;
  country: string;
  city: string;
  timezone: string;
  birth_date: string;
  trading_experience_years: string;
  trading_style: string;
  risk_tolerance: string;
  preferred_instruments: string;
  trading_timezone: string;
  account_balance_range: string;
  preferred_leverage: string;
  favorite_pairs: string;
  trading_strategy: string;
  win_rate_target: string;
  monthly_profit_target: string;
  hobbies: string;
  personality_traits: string;
  trading_goals: string;
  learning_style: string;
  notification_preferences: string;
  preferred_chart_timeframe: string;
  uses_automated_trading: boolean;
  attends_live_sessions: boolean;
  bio: string;
}

interface ProfileMangerProps {
  value: AffiliateProfileForm;
  onChange: (field: keyof AffiliateProfileForm, next: string | boolean) => void;
  onSave: () => void;
  saving: boolean;
  completionPercent: number;
}

export default function ProfileManger({
  value,
  onChange,
  onSave,
  saving,
  completionPercent,
}: ProfileMangerProps) {
  const textInputClass = "w-full rounded-lg border border-black/20 bg-white px-3 py-2 text-sm text-black placeholder:text-black/35 focus:outline-none focus:ring-1 focus:ring-black/25";

  return (
    <div className="rounded-2xl border border-black/15 bg-white p-4 md:p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h4 className="text-sm md:text-base font-bold text-black">Profile Manager</h4>
          <p className="text-xs text-black/60 mt-1">Fill this once so recruits trust you faster.</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold text-black/70">Profile Completion</p>
          <p className="text-sm font-bold text-black">{completionPercent}%</p>
        </div>
      </div>

      <div className="h-2 bg-black/5 rounded-full overflow-hidden mb-4">
        <div className="h-full bg-black rounded-full transition-all" style={{ width: `${completionPercent}%` }} />
      </div>

      <div className="space-y-5">
        <div>
          <p className="text-xs font-bold text-black mb-2">Core Profile</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-black/55 mb-1.5">Email</label>
              <input value={value.email} onChange={(e) => onChange('email', e.target.value)} placeholder="name@email.com" className={textInputClass} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-black/55 mb-1.5">Full Name</label>
              <input value={value.full_name} onChange={(e) => onChange('full_name', e.target.value)} placeholder="Your real name" className={textInputClass} />
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-black mb-2">Social & Community</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={value.telegram_username} onChange={(e) => onChange('telegram_username', e.target.value)} placeholder="Telegram" className={textInputClass} />
            <input value={value.discord_username} onChange={(e) => onChange('discord_username', e.target.value)} placeholder="Discord" className={textInputClass} />
            <input value={value.instagram_username} onChange={(e) => onChange('instagram_username', e.target.value)} placeholder="Instagram" className={textInputClass} />
            <input value={value.facebook_username} onChange={(e) => onChange('facebook_username', e.target.value)} placeholder="Facebook" className={textInputClass} />
            <input value={value.twitter_username} onChange={(e) => onChange('twitter_username', e.target.value)} placeholder="Twitter/X" className={textInputClass} />
            <input value={value.youtube_username} onChange={(e) => onChange('youtube_username', e.target.value)} placeholder="YouTube" className={textInputClass} />
            <input value={value.twitch_username} onChange={(e) => onChange('twitch_username', e.target.value)} placeholder="Twitch" className={textInputClass} />
            <input value={value.tiktok_username} onChange={(e) => onChange('tiktok_username', e.target.value)} placeholder="TikTok" className={textInputClass} />
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-black mb-2">Contact Info</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={value.cell_number} onChange={(e) => onChange('cell_number', e.target.value)} placeholder="Cell Number" className={textInputClass} />
            <input value={value.preferred_contact_method} onChange={(e) => onChange('preferred_contact_method', e.target.value)} placeholder="Preferred Contact Method" className={textInputClass} />
            <input value={value.country} onChange={(e) => onChange('country', e.target.value)} placeholder="Country" className={textInputClass} />
            <input value={value.city} onChange={(e) => onChange('city', e.target.value)} placeholder="City" className={textInputClass} />
            <input value={value.timezone} onChange={(e) => onChange('timezone', e.target.value)} placeholder="Timezone" className={textInputClass} />
            <input value={value.birth_date} onChange={(e) => onChange('birth_date', e.target.value)} placeholder="Birth Date (YYYY-MM-DD)" className={textInputClass} />
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-black mb-2">Trading Profile</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={value.trading_experience_years} onChange={(e) => onChange('trading_experience_years', e.target.value)} placeholder="Experience (years)" className={textInputClass} />
            <input value={value.trading_style} onChange={(e) => onChange('trading_style', e.target.value)} placeholder="Trading Style" className={textInputClass} />
            <input value={value.risk_tolerance} onChange={(e) => onChange('risk_tolerance', e.target.value)} placeholder="Risk Tolerance" className={textInputClass} />
            <input value={value.preferred_instruments} onChange={(e) => onChange('preferred_instruments', e.target.value)} placeholder="Preferred Instruments" className={textInputClass} />
            <input value={value.trading_timezone} onChange={(e) => onChange('trading_timezone', e.target.value)} placeholder="Trading Timezone" className={textInputClass} />
            <input value={value.account_balance_range} onChange={(e) => onChange('account_balance_range', e.target.value)} placeholder="Account Balance Range" className={textInputClass} />
            <input value={value.preferred_leverage} onChange={(e) => onChange('preferred_leverage', e.target.value)} placeholder="Preferred Leverage" className={textInputClass} />
            <input value={value.favorite_pairs} onChange={(e) => onChange('favorite_pairs', e.target.value)} placeholder="Favorite Pairs" className={textInputClass} />
            <input value={value.trading_strategy} onChange={(e) => onChange('trading_strategy', e.target.value)} placeholder="Trading Strategy" className={textInputClass} />
            <input value={value.win_rate_target} onChange={(e) => onChange('win_rate_target', e.target.value)} placeholder="Win Rate Target (%)" className={textInputClass} />
            <input value={value.monthly_profit_target} onChange={(e) => onChange('monthly_profit_target', e.target.value)} placeholder="Monthly Profit Target" className={textInputClass} />
            <input value={value.preferred_chart_timeframe} onChange={(e) => onChange('preferred_chart_timeframe', e.target.value)} placeholder="Preferred Chart Timeframe" className={textInputClass} />
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <label className="inline-flex items-center gap-2 text-xs text-black/75">
              <input type="checkbox" checked={value.uses_automated_trading} onChange={(e) => onChange('uses_automated_trading', e.target.checked)} className="w-4 h-4" />
              Uses Automated Trading
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-black/75">
              <input type="checkbox" checked={value.attends_live_sessions} onChange={(e) => onChange('attends_live_sessions', e.target.checked)} className="w-4 h-4" />
              Attends Live Sessions
            </label>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-black mb-2">Personality & Preferences</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={value.hobbies} onChange={(e) => onChange('hobbies', e.target.value)} placeholder="Hobbies" className={textInputClass} />
            <input value={value.personality_traits} onChange={(e) => onChange('personality_traits', e.target.value)} placeholder="Personality Traits" className={textInputClass} />
            <input value={value.trading_goals} onChange={(e) => onChange('trading_goals', e.target.value)} placeholder="Trading Goals" className={textInputClass} />
            <input value={value.learning_style} onChange={(e) => onChange('learning_style', e.target.value)} placeholder="Learning Style" className={textInputClass} />
            <input value={value.notification_preferences} onChange={(e) => onChange('notification_preferences', e.target.value)} placeholder="Notification Preferences" className={textInputClass} />
          </div>
          <div className="mt-3">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-black/55 mb-1.5">Bio</label>
            <textarea value={value.bio} onChange={(e) => onChange('bio', e.target.value)} rows={3} placeholder="What do you do and who do you help?" className={textInputClass} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[11px] text-black/55">Tip: Keep your bio simple, real, and helpful.</p>
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border border-black/20 bg-white hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
