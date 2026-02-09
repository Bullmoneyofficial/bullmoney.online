"use client";

import React, { useState, useEffect, useCallback } from "react";
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import X from 'lucide-react/dist/esm/icons/x';
import Check from 'lucide-react/dist/esm/icons/check';
import Tag from 'lucide-react/dist/esm/icons/tag';
import Gift from 'lucide-react/dist/esm/icons/gift';
import Percent from 'lucide-react/dist/esm/icons/percent';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Hash from 'lucide-react/dist/esm/icons/hash';
import ToggleLeft from 'lucide-react/dist/esm/icons/toggle-left';
import ToggleRight from 'lucide-react/dist/esm/icons/toggle-right';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import Copy from 'lucide-react/dist/esm/icons/copy';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import Search from 'lucide-react/dist/esm/icons/search';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import Truck from 'lucide-react/dist/esm/icons/truck';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Shield from 'lucide-react/dist/esm/icons/shield';

// ============================================================================
// STORE PROMO MANAGER — CRUD for Discount Codes & Gift Cards
// Renders as a sub-panel inside the admin hub "store" tab
// ============================================================================

// ─── Types ──────────────────────────────────────────────────────────────────
interface DiscountCode {
  id: string;
  created_at: string;
  updated_at: string;
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  max_uses: number | null;
  use_count: number;
  max_uses_per_user: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  applies_to: "all" | "specific_products" | "specific_categories";
  first_order_only: boolean;
  free_shipping: boolean;
}

interface GiftCard {
  id: string;
  created_at: string;
  code: string;
  amount: number;
  balance: number;
  recipient_email: string;
  recipient_name: string | null;
  sender_name: string | null;
  message: string | null;
  is_active: boolean;
  redeemed_at: string | null;
  redeemed_by: string | null;
  expires_at: string | null;
}

type TabType = "discounts" | "gift_cards";

// ─── Formatters ────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 2 }).format(n);

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "—";

// ─── Toast ──────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed bottom-4 right-4 z-9999 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium shadow-xl backdrop-blur-md border ${
      type === "success" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300" : "bg-red-500/20 border-red-500/30 text-red-300"
    }`}>
      {type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {message}
    </div>
  );
}

// ─── Discount Form ──────────────────────────────────────────────────────────
function DiscountForm({ discount, onSave, onCancel }: {
  discount: Partial<DiscountCode> | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    code: discount?.code || "",
    description: discount?.description || "",
    discount_type: discount?.discount_type || "percent" as "percent" | "fixed",
    discount_value: discount?.discount_value ?? 10,
    min_order_amount: discount?.min_order_amount ?? 0,
    max_discount_amount: discount?.max_discount_amount ?? null as number | null,
    max_uses: discount?.max_uses ?? null as number | null,
    max_uses_per_user: discount?.max_uses_per_user ?? 1,
    is_active: discount?.is_active !== false,
    starts_at: discount?.starts_at ? discount.starts_at.slice(0, 10) : "",
    expires_at: discount?.expires_at ? discount.expires_at.slice(0, 10) : "",
    first_order_only: discount?.first_order_only || false,
    free_shipping: discount?.free_shipping || false,
  });

  const isEdit = !!discount?.id;

  return (
    <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <Tag className="w-4 h-4 text-emerald-400" />
          {isEdit ? "Edit Discount Code" : "Create Discount Code"}
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Code */}
        <div>
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1 block">Code *</label>
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            placeholder="e.g. SUMMER25"
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 font-mono" />
        </div>

        {/* Type */}
        <div>
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1 block">Type</label>
          <div className="flex gap-1 p-0.5 bg-slate-800/60 border border-slate-700/50 rounded-lg">
            <button onClick={() => setForm({ ...form, discount_type: "percent" })}
              className={`flex-1 px-3 py-1.5 text-xs rounded-md font-medium transition-all ${form.discount_type === "percent" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400"}`}>
              <Percent className="w-3 h-3 inline mr-1" /> Percent
            </button>
            <button onClick={() => setForm({ ...form, discount_type: "fixed" })}
              className={`flex-1 px-3 py-1.5 text-xs rounded-md font-medium transition-all ${form.discount_type === "fixed" ? "bg-blue-500/20 text-blue-400" : "text-slate-400"}`}>
              <DollarSign className="w-3 h-3 inline mr-1" /> Fixed
            </button>
          </div>
        </div>

        {/* Value */}
        <div>
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1 block">
            Discount Value {form.discount_type === "percent" ? "(%)" : "(R)"}
          </label>
          <input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
        </div>

        {/* Min Order */}
        <div>
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1 block">Min Order (R)</label>
          <input type="number" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: Number(e.target.value) })}
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
        </div>

        {/* Max Uses */}
        <div>
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1 block">Max Uses (blank = unlimited)</label>
          <input type="number" value={form.max_uses ?? ""} onChange={(e) => setForm({ ...form, max_uses: e.target.value ? Number(e.target.value) : null })}
            placeholder="Unlimited"
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
        </div>

        {/* Max Uses Per User */}
        <div>
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1 block">Per User Limit</label>
          <input type="number" value={form.max_uses_per_user} onChange={(e) => setForm({ ...form, max_uses_per_user: Number(e.target.value) })}
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
        </div>

        {/* Starts At */}
        <div>
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1 block">Starts</label>
          <input type="date" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 scheme-dark" />
        </div>

        {/* Expires At */}
        <div>
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1 block">Expires</label>
          <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 scheme-dark" />
        </div>

        {/* Description */}
        <div className="col-span-2">
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1 block">Description</label>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="e.g. Summer sale 25% off"
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
        </div>
      </div>

      {/* Toggles */}
      <div className="flex flex-wrap gap-3">
        {[
          { key: "is_active", label: "Active", icon: <Shield className="w-3 h-3" /> },
          { key: "first_order_only", label: "First Order Only", icon: <Hash className="w-3 h-3" /> },
          { key: "free_shipping", label: "Free Shipping", icon: <Truck className="w-3 h-3" /> },
        ].map(({ key, label, icon }) => (
          <button key={key}
            onClick={() => setForm({ ...form, [key]: !(form as any)[key] })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              (form as any)[key]
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                : "bg-slate-800/60 border-slate-700/50 text-slate-400"
            }`}>
            {(form as any)[key] ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t border-slate-700/30">
        <button onClick={onCancel} className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors rounded-lg">Cancel</button>
        <button
          onClick={() => {
            if (!form.code) return;
            onSave({
              ...form,
              starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
              expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
            });
          }}
          disabled={!form.code}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-all flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5" /> {isEdit ? "Update" : "Create"}
        </button>
      </div>
    </div>
  );
}

// ─── Gift Card Form ─────────────────────────────────────────────────────────
function GiftCardForm({ giftCard, onSave, onCancel }: {
  giftCard: Partial<GiftCard> | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    code: giftCard?.code || "",
    amount: giftCard?.amount ?? 50,
    balance: giftCard?.balance ?? giftCard?.amount ?? 50,
    recipient_email: giftCard?.recipient_email || "",
    recipient_name: giftCard?.recipient_name || "",
    sender_name: giftCard?.sender_name || "",
    message: giftCard?.message || "",
    is_active: giftCard?.is_active !== false,
    expires_at: giftCard?.expires_at ? giftCard.expires_at.slice(0, 10) : "",
  });

  const isEdit = !!giftCard?.id;

  return (
    <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <Gift className="w-4 h-4 text-pink-400" />
          {isEdit ? "Edit Gift Card" : "Create Gift Card"}
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Code */}
        <div>
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1 block">Code (auto-gen if blank)</label>
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            placeholder="BULL-XXXX-XXXX-XXXX"
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-pink-500/50 font-mono" />
        </div>

        {/* Amount */}
        <div>
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1 block">Amount (R)</label>
          <input type="number" value={form.amount} onChange={(e) => {
            const amt = Number(e.target.value);
            setForm({ ...form, amount: amt, balance: isEdit ? form.balance : amt });
          }}
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-pink-500/50" />
        </div>

        {/* Balance (edit only) */}
        {isEdit && (
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1 block">Balance (R)</label>
            <input type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: Number(e.target.value) })}
              className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-pink-500/50" />
          </div>
        )}

        {/* Recipient Email */}
        <div>
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1 block">Recipient Email</label>
          <input value={form.recipient_email} onChange={(e) => setForm({ ...form, recipient_email: e.target.value })}
            placeholder="recipient@email.com"
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-pink-500/50" />
        </div>

        {/* Recipient Name */}
        <div>
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1 block">Recipient Name</label>
          <input value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-pink-500/50" />
        </div>

        {/* Sender Name */}
        <div>
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1 block">Sender Name</label>
          <input value={form.sender_name} onChange={(e) => setForm({ ...form, sender_name: e.target.value })}
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-pink-500/50" />
        </div>

        {/* Expires */}
        <div>
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1 block">Expires</label>
          <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-pink-500/50 scheme-dark" />
        </div>

        {/* Message */}
        <div className="col-span-2">
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1 block">Message</label>
          <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Optional personal message"
            rows={2}
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-pink-500/50 resize-none" />
        </div>
      </div>

      {/* Active toggle */}
      <button onClick={() => setForm({ ...form, is_active: !form.is_active })}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
          form.is_active
            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
            : "bg-red-500/15 border-red-500/30 text-red-400"
        }`}>
        {form.is_active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
        {form.is_active ? "Active" : "Inactive"}
      </button>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t border-slate-700/30">
        <button onClick={onCancel} className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors rounded-lg">Cancel</button>
        <button
          onClick={() => {
            onSave({
              ...form,
              expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
            });
          }}
          className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white text-xs font-medium rounded-lg transition-all flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5" /> {isEdit ? "Update" : "Create"}
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════

export default function StorePromoManager() {
  const [tab, setTab] = useState<TabType>("discounts");
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);
  const [editingGiftCard, setEditingGiftCard] = useState<GiftCard | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/store/admin/promos");
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setDiscounts(json.discounts || []);
      setGiftCards(json.gift_cards || []);
    } catch (err: any) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveDiscount = async (data: any) => {
    try {
      const isEdit = !!editingDiscount?.id;
      const res = await fetch("/api/store/admin/promos", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "discount",
          ...(isEdit ? { id: editingDiscount!.id } : {}),
          ...data,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setToast({ message: isEdit ? "Discount updated" : "Discount created", type: "success" });
      setShowForm(false);
      setEditingDiscount(null);
      fetchData();
    } catch (err: any) {
      setToast({ message: err.message, type: "error" });
    }
  };

  const handleSaveGiftCard = async (data: any) => {
    try {
      const isEdit = !!editingGiftCard?.id;
      const res = await fetch("/api/store/admin/promos", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "gift_card",
          ...(isEdit ? { id: editingGiftCard!.id } : {}),
          ...data,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setToast({ message: isEdit ? "Gift card updated" : "Gift card created", type: "success" });
      setShowForm(false);
      setEditingGiftCard(null);
      fetchData();
    } catch (err: any) {
      setToast({ message: err.message, type: "error" });
    }
  };

  const handleDelete = async (type: "discount" | "gift_card", id: string) => {
    if (!confirm(`Delete this ${type === "discount" ? "discount code" : "gift card"}?`)) return;
    try {
      const res = await fetch(`/api/store/admin/promos?type=${type}&id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setToast({ message: "Deleted successfully", type: "success" });
      fetchData();
    } catch (err: any) {
      setToast({ message: err.message, type: "error" });
    }
  };

  const handleToggleActive = async (type: "discount" | "gift_card", id: string, currentState: boolean) => {
    try {
      const res = await fetch("/api/store/admin/promos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, is_active: !currentState }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setToast({ message: `${!currentState ? "Activated" : "Deactivated"}`, type: "success" });
      fetchData();
    } catch (err: any) {
      setToast({ message: err.message, type: "error" });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setToast({ message: `Copied: ${code}`, type: "success" });
  };

  // Filter
  const filteredDiscounts = discounts.filter(d =>
    d.code.toLowerCase().includes(search.toLowerCase()) ||
    d.description?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredGiftCards = giftCards.filter(g =>
    g.code.toLowerCase().includes(search.toLowerCase()) ||
    g.recipient_email?.toLowerCase().includes(search.toLowerCase()) ||
    g.recipient_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Tag className="w-5 h-5 text-emerald-400" />
          Promo & Gift Card Manager
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-600 hover:bg-slate-700 hover:text-white transition-colors">
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button onClick={() => {
            setShowForm(true);
            setEditingDiscount(null);
            setEditingGiftCard(null);
          }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg font-medium transition-all">
            <Plus className="w-3.5 h-3.5" /> New {tab === "discounts" ? "Discount" : "Gift Card"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-0.5 bg-slate-900/60 border border-slate-700/40 rounded-lg w-fit">
        <button onClick={() => { setTab("discounts"); setShowForm(false); }}
          className={`px-4 py-2 text-xs rounded-md font-medium transition-all flex items-center gap-1.5 ${
            tab === "discounts" ? "bg-emerald-500/20 text-emerald-400 shadow-sm" : "text-slate-400 hover:text-white"
          }`}>
          <Tag className="w-3.5 h-3.5" /> Discount Codes
          <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">{discounts.length}</span>
        </button>
        <button onClick={() => { setTab("gift_cards"); setShowForm(false); }}
          className={`px-4 py-2 text-xs rounded-md font-medium transition-all flex items-center gap-1.5 ${
            tab === "gift_cards" ? "bg-pink-500/20 text-pink-400 shadow-sm" : "text-slate-400 hover:text-white"
          }`}>
          <Gift className="w-3.5 h-3.5" /> Gift Cards
          <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">{giftCards.length}</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${tab === "discounts" ? "codes..." : "gift cards..."}`}
          className="w-full bg-slate-900/50 border border-slate-700/40 rounded-lg pl-9 pr-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40" />
      </div>

      {/* Form */}
      {showForm && tab === "discounts" && (
        <DiscountForm discount={editingDiscount} onSave={handleSaveDiscount} onCancel={() => { setShowForm(false); setEditingDiscount(null); }} />
      )}
      {showForm && tab === "gift_cards" && (
        <GiftCardForm giftCard={editingGiftCard} onSave={handleSaveGiftCard} onCancel={() => { setShowForm(false); setEditingGiftCard(null); }} />
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-slate-400 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading...
        </div>
      ) : tab === "discounts" ? (
        /* ═══ DISCOUNT CODES TABLE ═══ */
        filteredDiscounts.length > 0 ? (
          <div className="space-y-2">
            {filteredDiscounts.map((d) => {
              const isExpired = d.expires_at && new Date(d.expires_at) < new Date();
              const usedUp = d.max_uses !== null && d.use_count >= d.max_uses;
              return (
                <div key={d.id} className={`bg-slate-900/60 border rounded-xl p-3 transition-all hover:border-slate-600/60 ${
                  !d.is_active || isExpired || usedUp ? "border-slate-800/40 opacity-60" : "border-slate-700/40"
                }`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center gap-2">
                        <button onClick={() => copyCode(d.code)} title="Copy code"
                          className="text-white font-mono text-sm font-bold bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors">
                          {d.code} <Copy className="w-3 h-3 text-slate-400" />
                        </button>
                      </div>
                      <div className="min-w-0">
                        {d.description && <div className="text-xs text-slate-400 truncate">{d.description}</div>}
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            d.discount_type === "percent" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                          }`}>
                            {d.discount_type === "percent" ? <Percent className="w-2.5 h-2.5" /> : <DollarSign className="w-2.5 h-2.5" />}
                            {d.discount_value}{d.discount_type === "percent" ? "%" : "R"} off
                          </span>
                          {d.min_order_amount > 0 && (
                            <span className="text-[10px] text-slate-500">Min: {fmt(d.min_order_amount)}</span>
                          )}
                          <span className="text-[10px] text-slate-500">
                            Used: {d.use_count}{d.max_uses ? `/${d.max_uses}` : ""}
                          </span>
                          {d.free_shipping && <span className="text-[10px] text-blue-400 flex items-center gap-0.5"><Truck className="w-2.5 h-2.5" /> Free Ship</span>}
                          {d.first_order_only && <span className="text-[10px] text-amber-400">1st Order</span>}
                          {isExpired && <span className="text-[10px] text-red-400">Expired</span>}
                          {usedUp && <span className="text-[10px] text-red-400">Used Up</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => handleToggleActive("discount", d.id, d.is_active)}
                        className={`p-1.5 rounded-lg transition-colors ${d.is_active ? "text-emerald-400 hover:bg-emerald-500/10" : "text-slate-500 hover:bg-slate-700"}`}
                        title={d.is_active ? "Deactivate" : "Activate"}>
                        {d.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <button onClick={() => { setEditingDiscount(d); setShowForm(true); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete("discount", d.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5" /> Created: {fmtDate(d.created_at)}</span>
                    {d.starts_at && <span>Starts: {fmtDate(d.starts_at)}</span>}
                    {d.expires_at && <span>Expires: {fmtDate(d.expires_at)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 text-sm">
            No discount codes found. Click &quot;New Discount&quot; to create one.
          </div>
        )
      ) : (
        /* ═══ GIFT CARDS TABLE ═══ */
        filteredGiftCards.length > 0 ? (
          <div className="space-y-2">
            {filteredGiftCards.map((g) => {
              const isExpired = g.expires_at && new Date(g.expires_at) < new Date();
              const isRedeemed = g.balance <= 0;
              return (
                <div key={g.id} className={`bg-slate-900/60 border rounded-xl p-3 transition-all hover:border-slate-600/60 ${
                  !g.is_active || isExpired || isRedeemed ? "border-slate-800/40 opacity-60" : "border-slate-700/40"
                }`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <button onClick={() => copyCode(g.code)} title="Copy code"
                        className="text-white font-mono text-sm font-bold bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors shrink-0">
                        {g.code} <Copy className="w-3 h-3 text-slate-400" />
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-pink-400 font-bold text-sm">{fmt(g.balance)}</span>
                          <span className="text-[10px] text-slate-500">of {fmt(g.amount)}</span>
                          <div className="h-1.5 w-16 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-pink-500 rounded-full" style={{ width: `${g.amount > 0 ? (g.balance / g.amount) * 100 : 0}%` }} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[10px] text-slate-500">
                          {g.recipient_email && <span>To: {g.recipient_name || g.recipient_email}</span>}
                          {g.sender_name && <span>From: {g.sender_name}</span>}
                          {isExpired && <span className="text-red-400">Expired</span>}
                          {isRedeemed && <span className="text-amber-400">Fully Redeemed</span>}
                          {g.redeemed_by && <span>Redeemed by: {g.redeemed_by}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => handleToggleActive("gift_card", g.id, g.is_active)}
                        className={`p-1.5 rounded-lg transition-colors ${g.is_active ? "text-emerald-400 hover:bg-emerald-500/10" : "text-slate-500 hover:bg-slate-700"}`}
                        title={g.is_active ? "Deactivate" : "Activate"}>
                        {g.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <button onClick={() => { setEditingGiftCard(g); setShowForm(true); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete("gift_card", g.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5" /> Created: {fmtDate(g.created_at)}</span>
                    {g.expires_at && <span>Expires: {fmtDate(g.expires_at)}</span>}
                    {g.redeemed_at && <span>Redeemed: {fmtDate(g.redeemed_at)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 text-sm">
            No gift cards found. Click &quot;New Gift Card&quot; to create one.
          </div>
        )
      )}
    </div>
  );
}
