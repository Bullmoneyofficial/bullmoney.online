"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Save,
  RefreshCw,
  Settings,
  FileText,
  List,
  HelpCircle,
  MessageSquare,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Award,
  Star,
  Trophy,
  Target,
  Sparkles,
  Check,
  X,
  Clock,
  DollarSign,
  Users,
  Palette,
} from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";

// Types
interface TierTask {
  title: string;
  timeMinutes: number;
  whyItMatters: string;
}

interface Tier {
  name: string;
  minTraders: number;
  maxTraders: number | null;
  commissionPercent: number;
  xmRatePerLot: number;
  vantageRatePerLot: number;
  bonusMultiplier: number;
  color: string;
  icon: string;
  perks: string[];
}

interface TipItem {
  title: string;
  description: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface DashboardContent {
  id: string;
  tiers: Tier[];
  weekly_tasks: Record<string, TierTask[]>;
  how_to_become_affiliate: string;
  tips_title: string;
  tips: TipItem[];
  faq_items: FaqItem[];
  welcome_message: string;
  welcome_subtitle: string;
  overview_title: string;
  recruits_title: string;
  earnings_title: string;
  analytics_title: string;
  commission_info: string;
  qr_section_title: string;
  qr_section_description: string;
  referral_link_title: string;
  referral_link_description: string;
  payout_info: string;
  support_email: string;
  telegram_group_link: string;
  staff_group_link: string;
  custom_styles: Record<string, string>;
  show_qr_code: boolean;
  show_tasks: boolean;
  show_tips: boolean;
  show_leaderboard: boolean;
  show_telegram_feed: boolean;
}

const DEFAULT_CONTENT: DashboardContent = {
  id: "main",
  tiers: [],
  weekly_tasks: {},
  how_to_become_affiliate: "",
  tips_title: "Tips for Success",
  tips: [],
  faq_items: [],
  welcome_message: "",
  welcome_subtitle: "",
  overview_title: "Overview",
  recruits_title: "Your Recruits",
  earnings_title: "Earnings",
  analytics_title: "Analytics",
  commission_info: "",
  qr_section_title: "",
  qr_section_description: "",
  referral_link_title: "",
  referral_link_description: "",
  payout_info: "",
  support_email: "",
  telegram_group_link: "",
  staff_group_link: "",
  custom_styles: {},
  show_qr_code: true,
  show_tasks: true,
  show_tips: true,
  show_leaderboard: false,
  show_telegram_feed: true,
};

const TIER_ICONS = [
  { value: "target", label: "Target", icon: Target },
  { value: "award", label: "Award", icon: Award },
  { value: "star", label: "Star", icon: Star },
  { value: "trophy", label: "Trophy", icon: Trophy },
  { value: "sparkles", label: "Sparkles", icon: Sparkles },
];

type EditorTab = "content" | "tiers" | "tasks" | "tips" | "faq" | "settings";

export default function AffiliateContentAdminPanel() {
  const [content, setContent] = useState<DashboardContent>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>("content");
  const [expandedTier, setExpandedTier] = useState<string | null>(null);
  const [expandedTaskTier, setExpandedTaskTier] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const supabase = createSupabaseClient();

  // Fetch content from database
  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("affiliate_dashboard_content")
        .select("*")
        .eq("id", "main")
        .single();

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          // No data found, create default
          const { data: newData, error: insertError } = await supabase
            .from("affiliate_dashboard_content")
            .insert([DEFAULT_CONTENT])
            .select()
            .single();

          if (insertError) throw insertError;
          setContent(newData);
        } else {
          throw fetchError;
        }
      } else {
        setContent(data);
      }
    } catch (err) {
      console.error("Error fetching content:", err);
      setError("Failed to load content. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Save content to database
  const saveContent = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: updateError } = await supabase
        .from("affiliate_dashboard_content")
        .upsert({
          ...content,
          updated_at: new Date().toISOString(),
        });

      if (updateError) throw updateError;

      setSuccess("Content saved successfully!");
      setHasChanges(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error saving content:", err);
      setError("Failed to save content. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Update content field
  const updateField = <K extends keyof DashboardContent>(
    field: K,
    value: DashboardContent[K]
  ) => {
    setContent((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // Tab buttons
  const tabs: { id: EditorTab; label: string; icon: LucideIcon }[] = [
    { id: "content", label: "Text Content", icon: FileText },
    { id: "tiers", label: "Tier Settings", icon: Award },
    { id: "tasks", label: "Weekly Tasks", icon: List },
    { id: "tips", label: "Tips", icon: MessageSquare },
    { id: "faq", label: "FAQ", icon: HelpCircle },
    { id: "settings", label: "Feature Toggles", icon: Settings },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">
            Affiliate Dashboard Content Editor
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Edit all text, tasks, tips, tiers, and settings for the affiliate
            dashboard
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-yellow-400 text-sm flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              Unsaved changes
            </span>
          )}
          <button
            onClick={fetchContent}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            disabled={loading}
          >
            <RefreshCw
              className={`w-5 h-5 text-gray-400 ${loading ? "animate-spin" : ""}`}
            />
          </button>
          <button
            onClick={saveContent}
            disabled={saving || !hasChanges}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              hasChanges
                ? "bg-green-600 hover:bg-green-500 text-white"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save All Changes"}
          </button>
        </div>
      </div>

      {/* Status Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400"
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg text-green-400"
          >
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Navigation */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
        {/* TEXT CONTENT TAB */}
        {activeTab === "content" && (
          <ContentTextEditor content={content} updateField={updateField} />
        )}

        {/* TIERS TAB */}
        {activeTab === "tiers" && (
          <TiersEditor
            tiers={content.tiers}
            expandedTier={expandedTier}
            setExpandedTier={setExpandedTier}
            updateField={updateField}
          />
        )}

        {/* TASKS TAB */}
        {activeTab === "tasks" && (
          <TasksEditor
            tasks={content.weekly_tasks}
            tiers={content.tiers}
            expandedTaskTier={expandedTaskTier}
            setExpandedTaskTier={setExpandedTaskTier}
            updateField={updateField}
          />
        )}

        {/* TIPS TAB */}
        {activeTab === "tips" && (
          <TipsEditor
            tipsTitle={content.tips_title}
            tips={content.tips}
            updateField={updateField}
          />
        )}

        {/* FAQ TAB */}
        {activeTab === "faq" && (
          <FaqEditor faqItems={content.faq_items} updateField={updateField} />
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <SettingsEditor content={content} updateField={updateField} />
        )}
      </div>
    </div>
  );
}

// ==========================================
// SUB-COMPONENTS FOR EACH TAB
// ==========================================

// TEXT CONTENT EDITOR
function ContentTextEditor({
  content,
  updateField,
}: {
  content: DashboardContent;
  updateField: <K extends keyof DashboardContent>(
    field: K,
    value: DashboardContent[K]
  ) => void;
}) {
  const textFields: {
    field: keyof DashboardContent;
    label: string;
    multiline?: boolean;
  }[] = [
    { field: "welcome_message", label: "Welcome Message" },
    { field: "welcome_subtitle", label: "Welcome Subtitle" },
    { field: "how_to_become_affiliate", label: "How to Become Affiliate", multiline: true },
    { field: "commission_info", label: "Commission Info", multiline: true },
    { field: "payout_info", label: "Payout Info" },
    { field: "overview_title", label: "Overview Tab Title" },
    { field: "recruits_title", label: "Recruits Tab Title" },
    { field: "earnings_title", label: "Earnings Tab Title" },
    { field: "analytics_title", label: "Analytics Tab Title" },
    { field: "qr_section_title", label: "QR Section Title" },
    { field: "qr_section_description", label: "QR Section Description", multiline: true },
    { field: "referral_link_title", label: "Referral Link Title" },
    { field: "referral_link_description", label: "Referral Link Description", multiline: true },
    { field: "support_email", label: "Support Email" },
    { field: "telegram_group_link", label: "Telegram Group Link" },
    { field: "staff_group_link", label: "Staff Group Link" },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Dashboard Text Content
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {textFields.map(({ field, label, multiline }) => (
          <div key={field} className={multiline ? "md:col-span-2" : ""}>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {label}
            </label>
            {multiline ? (
              <textarea
                value={(content[field] as string) || ""}
                onChange={(e) => updateField(field, e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
            ) : (
              <input
                type="text"
                value={(content[field] as string) || ""}
                onChange={(e) => updateField(field, e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// TIERS EDITOR
function TiersEditor({
  tiers,
  expandedTier,
  setExpandedTier,
  updateField,
}: {
  tiers: Tier[];
  expandedTier: string | null;
  setExpandedTier: (tier: string | null) => void;
  updateField: <K extends keyof DashboardContent>(
    field: K,
    value: DashboardContent[K]
  ) => void;
}) {
  const updateTier = (index: number, updates: Partial<Tier>) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], ...updates };
    updateField("tiers", newTiers);
  };

  const addTier = () => {
    const newTier: Tier = {
      name: "New Tier",
      minTraders: 0,
      maxTraders: 10,
      commissionPercent: 5,
      xmRatePerLot: 11,
      vantageRatePerLot: 5.5,
      bonusMultiplier: 1.0,
      color: "#3b82f6",
      icon: "target",
      perks: ["Basic access"],
    };
    updateField("tiers", [...tiers, newTier]);
    setExpandedTier(newTier.name);
  };

  const removeTier = (index: number) => {
    const newTiers = tiers.filter((_, i) => i !== index);
    updateField("tiers", newTiers);
  };

  const addPerk = (tierIndex: number) => {
    const newTiers = [...tiers];
    newTiers[tierIndex].perks = [...newTiers[tierIndex].perks, "New perk"];
    updateField("tiers", newTiers);
  };

  const updatePerk = (tierIndex: number, perkIndex: number, value: string) => {
    const newTiers = [...tiers];
    newTiers[tierIndex].perks[perkIndex] = value;
    updateField("tiers", newTiers);
  };

  const removePerk = (tierIndex: number, perkIndex: number) => {
    const newTiers = [...tiers];
    newTiers[tierIndex].perks = newTiers[tierIndex].perks.filter(
      (_, i) => i !== perkIndex
    );
    updateField("tiers", newTiers);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          Affiliate Tiers ({tiers.length})
        </h3>
        <button
          onClick={addTier}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Tier
        </button>
      </div>

      <div className="space-y-3">
        {tiers.map((tier, index) => (
          <div
            key={index}
            className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden"
          >
            {/* Tier Header */}
            <button
              onClick={() =>
                setExpandedTier(expandedTier === tier.name ? null : tier.name)
              }
              className="w-full flex items-center justify-between p-4 hover:bg-gray-800/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tier.color }}
                />
                <span className="font-medium text-white">{tier.name}</span>
                <span className="text-sm text-gray-400">
                  ({tier.minTraders}-{tier.maxTraders ?? "∞"} traders •{" "}
                  {tier.commissionPercent}% commission)
                </span>
              </div>
              {expandedTier === tier.name ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {/* Tier Details */}
            <AnimatePresence>
              {expandedTier === tier.name && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-gray-700"
                >
                  <div className="p-4 space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={tier.name}
                          onChange={(e) =>
                            updateTier(index, { name: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          Min Traders
                        </label>
                        <input
                          type="number"
                          value={tier.minTraders}
                          onChange={(e) =>
                            updateTier(index, {
                              minTraders: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          Max Traders
                        </label>
                        <input
                          type="number"
                          value={tier.maxTraders ?? ""}
                          placeholder="∞"
                          onChange={(e) =>
                            updateTier(index, {
                              maxTraders: e.target.value
                                ? parseInt(e.target.value)
                                : null,
                            })
                          }
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          Commission %
                        </label>
                        <input
                          type="number"
                          value={tier.commissionPercent}
                          onChange={(e) =>
                            updateTier(index, {
                              commissionPercent: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                        />
                      </div>
                    </div>

                    {/* Rates */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          XM Rate/Lot ($)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={tier.xmRatePerLot}
                          onChange={(e) =>
                            updateTier(index, {
                              xmRatePerLot: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          Vantage Rate/Lot ($)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={tier.vantageRatePerLot}
                          onChange={(e) =>
                            updateTier(index, {
                              vantageRatePerLot: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          Bonus Multiplier
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          value={tier.bonusMultiplier}
                          onChange={(e) =>
                            updateTier(index, {
                              bonusMultiplier: parseFloat(e.target.value) || 1,
                            })
                          }
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                        />
                      </div>
                    </div>

                    {/* Appearance */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={tier.color}
                            onChange={(e) =>
                              updateTier(index, { color: e.target.value })
                            }
                            className="w-10 h-10 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={tier.color}
                            onChange={(e) =>
                              updateTier(index, { color: e.target.value })
                            }
                            className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          Icon
                        </label>
                        <select
                          value={tier.icon}
                          onChange={(e) =>
                            updateTier(index, { icon: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                        >
                          {TIER_ICONS.map((icon) => (
                            <option key={icon.value} value={icon.value}>
                              {icon.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Perks */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs text-gray-400">Perks</label>
                        <button
                          onClick={() => addPerk(index)}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          + Add Perk
                        </button>
                      </div>
                      <div className="space-y-2">
                        {tier.perks.map((perk, perkIndex) => (
                          <div
                            key={perkIndex}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="text"
                              value={perk}
                              onChange={(e) =>
                                updatePerk(index, perkIndex, e.target.value)
                              }
                              className="flex-1 px-3 py-1.5 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                            />
                            <button
                              onClick={() => removePerk(index, perkIndex)}
                              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delete Tier */}
                    <div className="pt-4 border-t border-gray-700">
                      <button
                        onClick={() => removeTier(index)}
                        className="flex items-center gap-2 px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg text-sm transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Tier
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

// TASKS EDITOR
function TasksEditor({
  tasks,
  tiers,
  expandedTaskTier,
  setExpandedTaskTier,
  updateField,
}: {
  tasks: Record<string, TierTask[]>;
  tiers: Tier[];
  expandedTaskTier: string | null;
  setExpandedTaskTier: (tier: string | null) => void;
  updateField: <K extends keyof DashboardContent>(
    field: K,
    value: DashboardContent[K]
  ) => void;
}) {
  const updateTask = (
    tierName: string,
    taskIndex: number,
    updates: Partial<TierTask>
  ) => {
    const newTasks = { ...tasks };
    if (!newTasks[tierName]) newTasks[tierName] = [];
    newTasks[tierName][taskIndex] = {
      ...newTasks[tierName][taskIndex],
      ...updates,
    };
    updateField("weekly_tasks", newTasks);
  };

  const addTask = (tierName: string) => {
    const newTasks = { ...tasks };
    if (!newTasks[tierName]) newTasks[tierName] = [];
    newTasks[tierName].push({
      title: "New task",
      timeMinutes: 15,
      whyItMatters: "Explain why this task is important",
    });
    updateField("weekly_tasks", newTasks);
  };

  const removeTask = (tierName: string, taskIndex: number) => {
    const newTasks = { ...tasks };
    newTasks[tierName] = newTasks[tierName].filter((_, i) => i !== taskIndex);
    updateField("weekly_tasks", newTasks);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">
        Weekly Tasks by Tier
      </h3>

      <div className="space-y-3">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden"
          >
            {/* Tier Header */}
            <button
              onClick={() =>
                setExpandedTaskTier(
                  expandedTaskTier === tier.name ? null : tier.name
                )
              }
              className="w-full flex items-center justify-between p-4 hover:bg-gray-800/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tier.color }}
                />
                <span className="font-medium text-white">{tier.name}</span>
                <span className="text-sm text-gray-400">
                  ({tasks[tier.name]?.length || 0} tasks)
                </span>
              </div>
              {expandedTaskTier === tier.name ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {/* Tasks List */}
            <AnimatePresence>
              {expandedTaskTier === tier.name && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-gray-700"
                >
                  <div className="p-4 space-y-4">
                    {(tasks[tier.name] || []).map((task, taskIndex) => (
                      <div
                        key={taskIndex}
                        className="bg-gray-900/50 rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-400 mb-1">
                              Task Title
                            </label>
                            <input
                              type="text"
                              value={task.title}
                              onChange={(e) =>
                                updateTask(tier.name, taskIndex, {
                                  title: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                            />
                          </div>
                          <div className="w-24">
                            <label className="block text-xs text-gray-400 mb-1">
                              Minutes
                            </label>
                            <input
                              type="number"
                              value={task.timeMinutes}
                              onChange={(e) =>
                                updateTask(tier.name, taskIndex, {
                                  timeMinutes: parseInt(e.target.value) || 0,
                                })
                              }
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Why It Matters
                          </label>
                          <textarea
                            value={task.whyItMatters}
                            onChange={(e) =>
                              updateTask(tier.name, taskIndex, {
                                whyItMatters: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm resize-none"
                            rows={2}
                          />
                        </div>
                        <button
                          onClick={() => removeTask(tier.name, taskIndex)}
                          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remove Task
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={() => addTask(tier.name)}
                      className="w-full py-2 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors text-sm"
                    >
                      + Add Task for {tier.name}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

// TIPS EDITOR
function TipsEditor({
  tipsTitle,
  tips,
  updateField,
}: {
  tipsTitle: string;
  tips: TipItem[];
  updateField: <K extends keyof DashboardContent>(
    field: K,
    value: DashboardContent[K]
  ) => void;
}) {
  const updateTip = (index: number, updates: Partial<TipItem>) => {
    const newTips = [...tips];
    newTips[index] = { ...newTips[index], ...updates };
    updateField("tips", newTips);
  };

  const addTip = () => {
    updateField("tips", [
      ...tips,
      { title: "New Tip", description: "Tip description" },
    ]);
  };

  const removeTip = (index: number) => {
    updateField(
      "tips",
      tips.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Tips Section</h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Tips Section Title
        </label>
        <input
          type="text"
          value={tipsTitle}
          onChange={(e) => updateField("tips_title", e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
        />
      </div>

      <div className="space-y-3">
        {tips.map((tip, index) => (
          <div
            key={index}
            className="bg-gray-800/50 rounded-lg p-4 space-y-3 border border-gray-700"
          >
            <div className="flex items-center gap-4">
              <GripVertical className="w-5 h-5 text-gray-500 cursor-grab" />
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={tip.title}
                    onChange={(e) => updateTip(index, { title: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={tip.description}
                    onChange={(e) =>
                      updateTip(index, { description: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                  />
                </div>
              </div>
              <button
                onClick={() => removeTip(index)}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addTip}
        className="w-full py-3 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors"
      >
        + Add Tip
      </button>
    </div>
  );
}

// FAQ EDITOR
function FaqEditor({
  faqItems,
  updateField,
}: {
  faqItems: FaqItem[];
  updateField: <K extends keyof DashboardContent>(
    field: K,
    value: DashboardContent[K]
  ) => void;
}) {
  const updateFaq = (index: number, updates: Partial<FaqItem>) => {
    const newFaq = [...faqItems];
    newFaq[index] = { ...newFaq[index], ...updates };
    updateField("faq_items", newFaq);
  };

  const addFaq = () => {
    updateField("faq_items", [
      ...faqItems,
      { question: "New Question?", answer: "Answer here" },
    ]);
  };

  const removeFaq = (index: number) => {
    updateField(
      "faq_items",
      faqItems.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">
        FAQ Items ({faqItems.length})
      </h3>

      <div className="space-y-3">
        {faqItems.map((faq, index) => (
          <div
            key={index}
            className="bg-gray-800/50 rounded-lg p-4 space-y-3 border border-gray-700"
          >
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Question
              </label>
              <input
                type="text"
                value={faq.question}
                onChange={(e) => updateFaq(index, { question: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Answer</label>
              <textarea
                value={faq.answer}
                onChange={(e) => updateFaq(index, { answer: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm resize-none"
                rows={2}
              />
            </div>
            <button
              onClick={() => removeFaq(index)}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-3 h-3" />
              Remove FAQ
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addFaq}
        className="w-full py-3 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors"
      >
        + Add FAQ
      </button>
    </div>
  );
}

// SETTINGS EDITOR
function SettingsEditor({
  content,
  updateField,
}: {
  content: DashboardContent;
  updateField: <K extends keyof DashboardContent>(
    field: K,
    value: DashboardContent[K]
  ) => void;
}) {
  const toggles: { field: keyof DashboardContent; label: string; description: string }[] = [
    {
      field: "show_qr_code",
      label: "Show QR Code Section",
      description: "Display QR code on affiliate dashboard",
    },
    {
      field: "show_tasks",
      label: "Show Weekly Tasks",
      description: "Display tier-specific weekly tasks",
    },
    {
      field: "show_tips",
      label: "Show Tips Section",
      description: "Display tips for affiliate success",
    },
    {
      field: "show_leaderboard",
      label: "Show Leaderboard",
      description: "Display affiliate rankings leaderboard",
    },
    {
      field: "show_telegram_feed",
      label: "Show Telegram Feed",
      description: "Display live Telegram feed on dashboard",
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Feature Toggles</h3>

      <div className="space-y-3">
        {toggles.map(({ field, label, description }) => (
          <div
            key={field}
            className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700"
          >
            <div>
              <div className="font-medium text-white">{label}</div>
              <div className="text-sm text-gray-400">{description}</div>
            </div>
            <button
              onClick={() =>
                updateField(field, !(content[field] as boolean) as any)
              }
              className={`relative w-12 h-6 rounded-full transition-colors ${
                content[field] ? "bg-green-600" : "bg-gray-600"
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  content[field] ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
