"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search, RefreshCw, Users, CreditCard, Star, Crown, Gift, Check, X,
  ChevronDown, TrendingUp, Award, Zap, Edit2, Save, Trash2, Plus, Minus
} from "lucide-react";
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';

// ============================================================================
// REWARDS ADMIN PANEL — Manage Punch Cards & Reward Points
// Admin interface for editing punches, syncing from orders, viewing tiers
// ============================================================================

interface RecruitRewards {
  id: string;
  email: string;
  rewards_punches: number;
  rewards_total_spent: number;
  rewards_cards_completed: number;
  rewards_tier: string;
  rewards_lifetime_points: number;
  rewards_available_points: number;
  rewards_last_punch_at: string | null;
  rewards_free_item_claimed: boolean;
  store_total_spent?: number;
}

const TIER_COLORS: Record<string, { bg: string; text: string; border: string; style?: React.CSSProperties }> = {
  bronze: { bg: "bg-slate-500/20", text: "text-slate-400", border: "border-slate-500/30" },
  silver: { bg: "bg-slate-400/20", text: "text-slate-300", border: "border-slate-500/30" },
  gold: { bg: "", text: "", border: "", style: { background: "rgba(59, 130, 246, 0.2)", color: "rgb(96, 165, 250)", borderColor: "rgba(59, 130, 246, 0.3)" } },
  platinum: { bg: "", text: "", border: "", style: { background: "rgba(96, 165, 250, 0.2)", color: "rgb(147, 197, 253)", borderColor: "rgba(96, 165, 250, 0.3)" } },
};

export default function RewardsAdminPanel() {
  const [recruits, setRecruits] = useState<RecruitRewards[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<RecruitRewards>>({});
  const [saving, setSaving] = useState(false);
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [punchModalUser, setPunchModalUser] = useState<RecruitRewards | null>(null);
  const [punchAmount, setPunchAmount] = useState(1);

  // Fetch all recruits with rewards data
  const fetchRecruits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/recruits?include_rewards=true");
      if (res.ok) {
        const data = await res.json();
        setRecruits(data.recruits || []);
      }
    } catch (err) {
      console.error("Failed to fetch recruits:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecruits();
  }, [fetchRecruits]);

  // Sync a single recruit's rewards from store orders
  const syncRecruit = async (email: string) => {
    setSyncing(email);
    try {
      const res = await fetch(`/api/rewards?email=${encodeURIComponent(email)}&sync=true`);
      if (res.ok) {
        const updated = await res.json();
        setRecruits(prev =>
          prev.map(r =>
            r.email === email
              ? {
                  ...r,
                  rewards_punches: updated.punches,
                  rewards_total_spent: updated.total_spent,
                  rewards_cards_completed: updated.cards_completed,
                  rewards_tier: updated.tier,
                  rewards_lifetime_points: updated.lifetime_points,
                  rewards_available_points: updated.available_points,
                }
              : r
          )
        );
      }
    } catch (err) {
      console.error("Failed to sync recruit:", err);
    } finally {
      setSyncing(null);
    }
  };

  // Sync all recruits
  const syncAll = async () => {
    setSyncingAll(true);
    for (const recruit of recruits) {
      await syncRecruit(recruit.email);
    }
    setSyncingAll(false);
  };

  // Start editing a recruit
  const startEdit = (recruit: RecruitRewards) => {
    setEditingId(recruit.id);
    setEditValues({
      rewards_punches: recruit.rewards_punches,
      rewards_available_points: recruit.rewards_available_points,
      rewards_tier: recruit.rewards_tier,
    });
  };

  // Save edits
  const saveEdit = async (email: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/rewards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          ...editValues,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setRecruits(prev =>
          prev.map(r =>
            r.email === email
              ? {
                  ...r,
                  rewards_punches: updated.punches ?? r.rewards_punches,
                  rewards_available_points: updated.available_points ?? r.rewards_available_points,
                  rewards_tier: updated.tier ?? r.rewards_tier,
                }
              : r
          )
        );
        setEditingId(null);
        setEditValues({});
      }
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  // Add punch manually
  const addPunch = async (email: string, amount: number) => {
    try {
      const res = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          action: "add_punch",
          punches: amount,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setRecruits(prev =>
          prev.map(r =>
            r.email === email
              ? {
                  ...r,
                  rewards_punches: updated.punches,
                  rewards_cards_completed: updated.cards_completed,
                }
              : r
          )
        );
        setPunchModalUser(null);
        setPunchAmount(1);
      }
    } catch (err) {
      console.error("Failed to add punch:", err);
    }
  };

  // Filter recruits
  const filteredRecruits = recruits.filter(r => {
    const matchesSearch = r.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = tierFilter === "all" || r.rewards_tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  // Stats
  const stats = {
    totalMembers: recruits.length,
    totalPunches: recruits.reduce((sum, r) => sum + (r.rewards_punches || 0), 0),
    totalCardsCompleted: recruits.reduce((sum, r) => sum + (r.rewards_cards_completed || 0), 0),
    totalSpent: recruits.reduce((sum, r) => sum + (r.rewards_total_spent || 0), 0),
    tierBreakdown: {
      bronze: recruits.filter(r => r.rewards_tier === "bronze").length,
      silver: recruits.filter(r => r.rewards_tier === "silver").length,
      gold: recruits.filter(r => r.rewards_tier === "gold").length,
      platinum: recruits.filter(r => r.rewards_tier === "platinum").length,
    },
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Users className="w-3.5 h-3.5" />
            Members
          </div>
          <p className="text-white font-bold text-xl">{stats.totalMembers}</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Check className="w-3.5 h-3.5" />
            Total Punches
          </div>
          <p className="text-white font-bold text-xl">{stats.totalPunches}</p>
        </div>
        <div className="rounded-xl p-4 border" style={{ background: "rgba(59, 130, 246, 0.1)", borderColor: "rgba(59, 130, 246, 0.2)" }}>
          <div className="flex items-center gap-2 text-xs mb-1" style={{ color: "rgba(147, 197, 253, 0.7)" }}>
            <CreditCard className="w-3.5 h-3.5" />
            Cards Completed
          </div>
          <p className="font-bold text-xl" style={{ color: "rgb(96, 165, 250)" }}>{stats.totalCardsCompleted}</p>
        </div>
        <div className="rounded-xl p-4 border" style={{ background: "rgba(59, 130, 246, 0.1)", borderColor: "rgba(59, 130, 246, 0.2)" }}>
          <div className="flex items-center gap-2 text-xs mb-1" style={{ color: "rgba(147, 197, 253, 0.7)" }}>
            <TrendingUp className="w-3.5 h-3.5" />
            Total Spent
          </div>
          <p className="font-bold text-xl" style={{ color: "rgb(96, 165, 250)" }}>${stats.totalSpent.toFixed(2)}</p>
        </div>
      </div>

      {/* Tier Breakdown */}
      <div className="flex gap-2 flex-wrap">
        {(["bronze", "silver", "gold", "platinum"] as const).map(tier => {
          const colors = TIER_COLORS[tier];
          return (
            <button
              key={tier}
              onClick={() => setTierFilter(tierFilter === tier ? "all" : tier)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                tierFilter === tier
                  ? `${colors.bg} ${colors.text} ${colors.border}`
                  : "bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600"
              }`}
              style={tierFilter === tier ? colors.style : undefined}
            >
              {tier.charAt(0).toUpperCase() + tier.slice(1)}: {stats.tierBreakdown[tier]}
            </button>
          );
        })}
        {tierFilter !== "all" && (
          <button
            onClick={() => setTierFilter("all")}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-slate-600"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-slate-600"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={syncAll}
            disabled={syncingAll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            style={{ background: "rgba(59, 130, 246, 0.2)", color: "rgb(96, 165, 250)" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(59, 130, 246, 0.3)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(59, 130, 246, 0.2)"}
          >
            <RefreshCw className={`w-4 h-4 ${syncingAll ? "animate-spin" : ""}`} />
            {syncingAll ? "Syncing..." : "Sync All from Orders"}
          </button>
          <button
            onClick={fetchRecruits}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Recruits Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin" style={{ color: "rgb(96, 165, 250)" }} />
        </div>
      ) : filteredRecruits.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          {searchQuery ? "No members match your search" : "No members with rewards data"}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Email</th>
                <th className="text-center py-3 px-2 text-slate-400 font-medium">Tier</th>
                <th className="text-center py-3 px-2 text-slate-400 font-medium">Punches</th>
                <th className="text-center py-3 px-2 text-slate-400 font-medium">Cards</th>
                <th className="text-right py-3 px-2 text-slate-400 font-medium">Spent</th>
                <th className="text-center py-3 px-2 text-slate-400 font-medium">Points</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredRecruits.map(recruit => {
                const isEditing = editingId === recruit.id;
                const tierColors = TIER_COLORS[recruit.rewards_tier || "bronze"];

                return (
                  <tr
                    key={recruit.id}
                    className="group hover:bg-slate-900/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <p className="text-white font-medium truncate max-w-50">{recruit.email}</p>
                    </td>
                    <td className="py-3 px-2 text-center">
                      {isEditing ? (
                        <select
                          value={editValues.rewards_tier || recruit.rewards_tier}
                          onChange={e => setEditValues(v => ({ ...v, rewards_tier: e.target.value }))}
                          className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                        >
                          <option value="bronze">Bronze</option>
                          <option value="silver">Silver</option>
                          <option value="gold">Gold</option>
                          <option value="platinum">Platinum</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${tierColors.bg} ${tierColors.text} ${tierColors.border}`}
                          style={tierColors.style}
                        >
                          {recruit.rewards_tier === "platinum" && <Crown className="w-3 h-3" />}
                          {recruit.rewards_tier === "gold" && <Star className="w-3 h-3" />}
                          {recruit.rewards_tier === "silver" && <Award className="w-3 h-3" />}
                          {recruit.rewards_tier?.charAt(0).toUpperCase() + recruit.rewards_tier?.slice(1)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          max={20}
                          value={editValues.rewards_punches ?? recruit.rewards_punches}
                          onChange={e => setEditValues(v => ({ ...v, rewards_punches: parseInt(e.target.value) || 0 }))}
                          className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-center text-sm"
                        />
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => addPunch(recruit.email, -1)}
                            disabled={(recruit.rewards_punches || 0) <= 0}
                            className="p-1 bg-slate-700/50 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Remove punch"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-white font-medium min-w-[3ch] text-center">{recruit.rewards_punches || 0}</span>
                          <span className="text-slate-500">/20</span>
                          <button
                            onClick={() => addPunch(recruit.email, 1)}
                            disabled={(recruit.rewards_punches || 0) >= 20}
                            className="p-1 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            style={{ background: "rgba(59, 130, 246, 0.2)", color: "rgb(96, 165, 250)" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(59, 130, 246, 0.3)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(59, 130, 246, 0.2)"}
                            title="Add punch"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => { setPunchModalUser(recruit); setPunchAmount(1); }}
                            className="ml-1 p-1 bg-slate-700/50 hover:bg-slate-700 rounded text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Add multiple punches"
                          >
                            <Gift className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="font-medium" style={{ color: "rgb(96, 165, 250)" }}>{recruit.rewards_cards_completed || 0}</span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="text-white">${(recruit.rewards_total_spent || 0).toFixed(2)}</span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          value={editValues.rewards_available_points ?? recruit.rewards_available_points}
                          onChange={e => setEditValues(v => ({ ...v, rewards_available_points: parseInt(e.target.value) || 0 }))}
                          className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-center text-sm"
                        />
                      ) : (
                        <span className="font-medium" style={{ color: "rgb(96, 165, 250)" }}>{recruit.rewards_available_points || 0}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEdit(recruit.email)}
                              disabled={saving}
                              className="p-1.5 rounded-lg transition-colors"
                              style={{ background: "rgba(59, 130, 246, 0.2)", color: "rgb(96, 165, 250)" }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(59, 130, 246, 0.3)"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(59, 130, 246, 0.2)"}
                            >
                              <Save className={`w-4 h-4 ${saving ? "animate-pulse" : ""}`} />
                            </button>
                            <button
                              onClick={() => { setEditingId(null); setEditValues({}); }}
                              className="p-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(recruit)}
                              className="p-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => syncRecruit(recruit.email)}
                              disabled={syncing === recruit.email}
                              className="p-1.5 rounded-lg transition-colors"
                              style={{ background: "rgba(59, 130, 246, 0.2)", color: "rgb(96, 165, 250)" }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(59, 130, 246, 0.3)"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(59, 130, 246, 0.2)"}
                              title="Sync from orders"
                            >
                              <RefreshCw className={`w-4 h-4 ${syncing === recruit.email ? "animate-spin" : ""}`} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="text-xs text-slate-500 border-t border-slate-800 pt-4 mt-4">
        <p className="flex items-center gap-2">
          <Gift className="w-3.5 h-3.5" style={{ color: "rgb(96, 165, 250)" }} />
          <span>20 punches = 1 free reward | {useCurrencyLocaleStore.getState().formatPrice(25)} = 1 punch | Sync pulls from store_orders table</span>
        </p>
        <p className="flex items-center gap-2 mt-2 text-slate-600">
          <Plus className="w-3.5 h-3.5" />
          <Minus className="w-3.5 h-3.5" />
          <span>Use +/- buttons to quickly add or remove punches for any user</span>
        </p>
      </div>

      {/* Add Punches Modal */}
      {punchModalUser && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">Add Punches</h3>
              <button
                onClick={() => setPunchModalUser(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-slate-400 text-sm mb-4 truncate">
              For: <span className="text-white font-medium">{punchModalUser.email}</span>
            </p>
            
            <div className="mb-4">
              <p className="text-slate-500 text-xs mb-2">Current punches: {punchModalUser.rewards_punches || 0}/20</p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setPunchAmount(Math.max(1, punchAmount - 1))}
                  className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white transition-colors"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="text-center">
                  <span className="text-white font-bold text-4xl">{punchAmount}</span>
                  <p className="text-slate-500 text-xs">punches</p>
                </div>
                <button
                  onClick={() => setPunchAmount(Math.min(20 - (punchModalUser.rewards_punches || 0), punchAmount + 1))}
                  className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex gap-2 mb-4">
              {[1, 5, 10, 20].map(val => (
                <button
                  key={val}
                  onClick={() => setPunchAmount(Math.min(20 - (punchModalUser.rewards_punches || 0), val))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    punchAmount === val
                      ? "text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                  style={punchAmount === val ? { background: "rgb(59, 130, 246)" } : undefined}
                >
                  +{val}
                </button>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setPunchModalUser(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => addPunch(punchModalUser.email, punchAmount)}
                className="flex-1 py-3 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                style={{ background: "rgb(59, 130, 246)" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgb(96, 165, 250)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgb(59, 130, 246)"}
              >
                <Check className="w-4 h-4" />
                Add {punchAmount} Punch{punchAmount > 1 ? "es" : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
