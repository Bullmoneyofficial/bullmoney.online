"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, RefreshCw, XCircle } from "lucide-react";

const STATUS_OPTIONS = [
  "requested",
  "pending_review",
  "approved",
  "processing",
  "completed",
  "denied",
  "cancelled",
];

type CryptoRefund = {
  id: string;
  order_number: string;
  status: string;
  refund_amount_usd: number;
  original_amount_usd: number;
  coin: string;
  network?: string | null;
  customer_email: string;
  customer_wallet?: string | null;
  reason?: string | null;
  denial_reason?: string | null;
  refund_tx_hash?: string | null;
  requested_at?: string | null;
  reviewed_at?: string | null;
  completed_at?: string | null;
};

export default function CryptoRefundsAdminPanel() {
  const [refunds, setRefunds] = useState<CryptoRefund[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [query, setQuery] = useState("");
  const [adminEmail, setAdminEmail] = useState(
    process.env.NEXT_PUBLIC_ADMIN_EMAIL || ""
  );
  const [adminToken, setAdminToken] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [refundTxHash, setRefundTxHash] = useState<Record<string, string>>({});
  const [refundWallet, setRefundWallet] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedToken = localStorage.getItem("crypto_admin_token");
    if (storedToken) setAdminToken(storedToken);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (adminToken) localStorage.setItem("crypto_admin_token", adminToken);
  }, [adminToken]);

  const filteredRefunds = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return refunds;
    return refunds.filter((r) =>
      [r.order_number, r.customer_email, r.coin, r.status, r.refund_tx_hash]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(q))
    );
  }, [refunds, query]);

  const fetchRefunds = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("limit", "50");
      params.set("offset", "0");
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/crypto-payment/refund/admin?${params.toString()}`, {
        headers: {
          "x-admin-email": adminEmail || "",
          "x-admin-token": adminToken || "",
        },
      });

      if (!res.ok) {
        const msg = res.status === 401 ? "Unauthorized" : "Failed to load refunds";
        throw new Error(msg);
      }

      const data = await res.json();
      setRefunds(data.refunds || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!adminEmail) return;
    fetchRefunds();
     
  }, [adminEmail, statusFilter, refreshTick]);

  const updateRefund = async (refundId: string, action: string) => {
    try {
      const res = await fetch("/api/crypto-payment/refund", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-email": adminEmail || "",
          "x-admin-token": adminToken || "",
        },
        body: JSON.stringify({
          refundId,
          action,
          reviewNotes: reviewNotes[refundId],
          refundTxHash: refundTxHash[refundId],
          refundWallet: refundWallet[refundId],
        }),
      });

      if (!res.ok) throw new Error("Update failed");
      setRefreshTick((v) => v + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Crypto Refunds</h2>
          <p className="text-xs text-slate-400">Manual review and completion flow</p>
        </div>
        <button
          onClick={() => setRefreshTick((v) => v + 1)}
          className="px-3 py-1.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700 text-xs flex items-center gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-2">
          <div className="text-xs text-slate-400">Admin Email</div>
          <input
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-slate-950/80 text-white text-sm border border-slate-800"
            placeholder="admin@domain.com"
          />
          <div className="text-xs text-slate-400">Admin API Token</div>
          <input
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-slate-950/80 text-white text-sm border border-slate-800"
            placeholder="ADMIN_API_TOKEN"
          />
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-2">
          <div className="text-xs text-slate-400">Status Filter</div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-slate-950/80 text-white text-sm border border-slate-800"
          >
            <option value="">All</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <div className="text-xs text-slate-400">Search</div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-slate-950/80 text-white text-sm border border-slate-800"
            placeholder="order, email, status"
          />
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400">Total</div>
          <div className="text-xl text-white font-semibold">{total}</div>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 text-xs text-red-300 bg-red-900/20 border border-red-800 rounded-md px-3 py-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      ) : null}

      <div className="space-y-2">
        {loading ? (
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" /> Loading refunds...
          </div>
        ) : null}

        {filteredRefunds.map((refund) => {
          const statusIcon =
            refund.status === "completed" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : refund.status === "denied" || refund.status === "cancelled" ? (
              <XCircle className="w-4 h-4 text-red-400" />
            ) : (
              <Clock className="w-4 h-4 text-amber-300" />
            );

          return (
            <div
              key={refund.id}
              className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-white font-semibold">
                    {statusIcon}
                    {refund.order_number}
                  </div>
                  <div className="text-xs text-slate-400">
                    {refund.coin} • ${Number(refund.refund_amount_usd).toFixed(2)} refund
                  </div>
                  <div className="text-xs text-slate-500">{refund.customer_email}</div>
                </div>
                <div className="text-xs text-slate-400 text-right">
                  <div>{refund.status}</div>
                  {refund.refund_tx_hash ? (
                    <div className="truncate max-w-[140px]">{refund.refund_tx_hash}</div>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  value={reviewNotes[refund.id] || ""}
                  onChange={(e) =>
                    setReviewNotes((prev) => ({ ...prev, [refund.id]: e.target.value }))
                  }
                  className="px-3 py-2 rounded-md bg-slate-950/80 text-white text-xs border border-slate-800"
                  placeholder="Review notes / denial reason"
                />
                <input
                  value={refundTxHash[refund.id] || ""}
                  onChange={(e) =>
                    setRefundTxHash((prev) => ({ ...prev, [refund.id]: e.target.value }))
                  }
                  className="px-3 py-2 rounded-md bg-slate-950/80 text-white text-xs border border-slate-800"
                  placeholder="Refund TX hash (complete only)"
                />
                <input
                  value={refundWallet[refund.id] || ""}
                  onChange={(e) =>
                    setRefundWallet((prev) => ({ ...prev, [refund.id]: e.target.value }))
                  }
                  className="px-3 py-2 rounded-md bg-slate-950/80 text-white text-xs border border-slate-800"
                  placeholder="Refund wallet used (optional)"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateRefund(refund.id, "approve")}
                  className="px-3 py-2 rounded-md bg-white text-black text-xs font-semibold"
                >
                  Approve
                </button>
                <button
                  onClick={() => updateRefund(refund.id, "deny")}
                  className="px-3 py-2 rounded-md bg-slate-800 text-white text-xs font-semibold"
                >
                  Deny
                </button>
                <button
                  onClick={() => updateRefund(refund.id, "complete")}
                  className="px-3 py-2 rounded-md bg-emerald-500 text-black text-xs font-semibold"
                >
                  Complete
                </button>
                <button
                  onClick={() => updateRefund(refund.id, "cancel")}
                  className="px-3 py-2 rounded-md bg-slate-800 text-white text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          );
        })}

        {!loading && filteredRefunds.length === 0 ? (
          <div className="text-xs text-slate-400">No refunds found.</div>
        ) : null}
      </div>
    </div>
  );
}
