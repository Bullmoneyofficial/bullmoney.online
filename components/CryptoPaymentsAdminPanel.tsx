"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  Search,
  Shield,
  XCircle,
} from "lucide-react";

const STATUS_OPTIONS = [
  "pending",
  "confirming",
  "confirmed",
  "underpaid",
  "overpaid",
  "failed",
  "expired",
  "manual_review",
];

type CryptoPayment = {
  id: string;
  order_number: string;
  tx_hash: string;
  coin: string;
  network: string;
  amount_usd: number;
  amount_crypto?: number | null;
  locked_price?: number | null;
  actual_amount_crypto?: number | null;
  status: string;
  confirmations?: number | null;
  required_confirmations?: number | null;
  guest_email?: string | null;
  wallet_address?: string | null;
  submitted_at?: string | null;
  confirmed_at?: string | null;
  refund_status?: string | null;
};

type RecruitInfo = {
  id: string;
  email: string;
  full_name?: string | null;
  username?: string | null;
  is_vip?: boolean | null;
  status?: string | null;
  affiliate_code?: string | null;
  created_at?: string | null;
};

export default function CryptoPaymentsAdminPanel() {
  const [payments, setPayments] = useState<CryptoPayment[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [query, setQuery] = useState("");
  const [adminEmail, setAdminEmail] = useState(
    process.env.NEXT_PUBLIC_ADMIN_EMAIL || ""
  );
  const [adminToken, setAdminToken] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [statusDraft, setStatusDraft] = useState<Record<string, string>>({});
  const [refreshTick, setRefreshTick] = useState(0);
  const [recruitsByEmail, setRecruitsByEmail] = useState<Record<string, RecruitInfo>>({});
  const [recruitsOnly, setRecruitsOnly] = useState(false);

  // Dev test state
  const [devKey, setDevKey] = useState("");
  const [devCoin, setDevCoin] = useState("USDT");
  const [devNetwork, setDevNetwork] = useState("ethereum");
  const [devAmountUSD, setDevAmountUSD] = useState("25");
  const [devEmail, setDevEmail] = useState("");
  const [devSendEmails, setDevSendEmails] = useState(false);
  const [lastDev, setLastDev] = useState<{ paymentId: string; orderNumber: string; txHash: string } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedToken = localStorage.getItem("crypto_admin_token");
    const storedDevKey = localStorage.getItem("crypto_dev_key");
    if (storedToken) setAdminToken(storedToken);
    if (storedDevKey) setDevKey(storedDevKey);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (adminToken) localStorage.setItem("crypto_admin_token", adminToken);
    if (devKey) localStorage.setItem("crypto_dev_key", devKey);
  }, [adminToken, devKey]);

  const filteredPayments = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = payments;

    if (recruitsOnly) {
      list = list.filter((p) => {
        const email = (p.guest_email || '').toLowerCase();
        return Boolean(recruitsByEmail[email]);
      });
    }

    if (!q) return list;
    return list.filter((p) => {
      const email = (p.guest_email || '').toLowerCase();
      const recruit = recruitsByEmail[email];
      return [
        p.order_number,
        p.tx_hash,
        p.guest_email,
        p.coin,
        p.network,
        p.status,
        recruit?.full_name,
        recruit?.username,
        recruit?.affiliate_code,
        recruit?.status,
      ]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(q));
    });
  }, [payments, query, recruitsByEmail, recruitsOnly]);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("limit", "50");
      params.set("offset", "0");
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/crypto-payment/admin?${params.toString()}`, {
        headers: {
          "x-admin-email": adminEmail || "",
          "x-admin-token": adminToken || "",
        },
      });

      if (!res.ok) {
        const msg = res.status === 401 ? "Unauthorized" : "Failed to load payments";
        throw new Error(msg);
      }

      const data = await res.json();
      setPayments(data.payments || []);
      setStats(data.stats || {});
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecruits = async (emails: string[]) => {
    if (!emails.length) {
      setRecruitsByEmail({});
      return;
    }

    try {
      const res = await fetch('/api/crypto-payment/admin/recruits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail || '',
          'x-admin-token': adminToken || '',
        },
        body: JSON.stringify({ emails }),
      });

      if (!res.ok) return;
      const data = await res.json();
      const map: Record<string, RecruitInfo> = {};
      (data.recruits || []).forEach((rec: RecruitInfo) => {
        if (rec.email) map[rec.email.toLowerCase()] = rec;
      });
      setRecruitsByEmail(map);
    } catch {
      setRecruitsByEmail({});
    }
  };

  useEffect(() => {
    if (!adminEmail) return;
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminEmail, statusFilter, refreshTick]);

  useEffect(() => {
    const emails = Array.from(
      new Set(
        payments
          .map((p) => p.guest_email)
          .filter(Boolean)
          .map((email) => String(email).toLowerCase())
      )
    );
    fetchRecruits(emails);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payments, adminEmail, adminToken]);

  const updatePayment = async (paymentId: string) => {
    const status = statusDraft[paymentId];
    if (!status) return;

    try {
      const res = await fetch("/api/crypto-payment/admin", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-email": adminEmail || "",
          "x-admin-token": adminToken || "",
        },
        body: JSON.stringify({
          paymentId,
          status,
          adminNotes: notes[paymentId],
        }),
      });

      if (!res.ok) {
        throw new Error("Update failed");
      }

      setRefreshTick((v) => v + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update error");
    }
  };

  const runDevCreate = async () => {
    try {
      const res = await fetch("/api/crypto-payment/dev-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dev-key": devKey || "",
        },
        body: JSON.stringify({
          action: "create",
          coin: devCoin,
          network: devNetwork,
          amountUSD: Number(devAmountUSD || 0),
          customerEmail: devEmail,
          productName: "Dev Test Product",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Dev create failed");
      setLastDev({
        paymentId: data.paymentId,
        orderNumber: data.orderNumber,
        txHash: data.txHash,
      });
      setRefreshTick((v) => v + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dev create error");
    }
  };

  const runDevConfirm = async () => {
    if (!lastDev?.paymentId) return;
    try {
      const res = await fetch("/api/crypto-payment/dev-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dev-key": devKey || "",
        },
        body: JSON.stringify({
          action: "confirm",
          paymentId: lastDev.paymentId,
          sendEmails: devSendEmails,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Dev confirm failed");
      setRefreshTick((v) => v + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dev confirm error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Crypto Payments</h2>
          <p className="text-xs text-slate-400">Admin view for on-chain payment tracking</p>
        </div>
        <button
          onClick={() => setRefreshTick((v) => v + 1)}
          className="px-3 py-1.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700 text-xs flex items-center gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400">Total</div>
          <div className="text-xl text-white font-semibold">{total}</div>
        </div>
        {STATUS_OPTIONS.slice(0, 3).map((status) => (
          <div key={status} className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400">{status}</div>
            <div className="text-xl text-white font-semibold">{stats?.[status] || 0}</div>
          </div>
        ))}
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
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-md bg-slate-950/80 text-white text-sm border border-slate-800"
              placeholder="order, tx, email, coin"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={recruitsOnly}
              onChange={(e) => setRecruitsOnly(e.target.checked)}
            />
            Recruits only
          </label>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-2">
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" /> Dev Test
          </div>
          <input
            value={devKey}
            onChange={(e) => setDevKey(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-slate-950/80 text-white text-sm border border-slate-800"
            placeholder="DEV_CRYPTO_TEST_KEY"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={devCoin}
              onChange={(e) => setDevCoin(e.target.value.toUpperCase())}
              className="px-3 py-2 rounded-md bg-slate-950/80 text-white text-sm border border-slate-800"
              placeholder="USDT"
            />
            <input
              value={devNetwork}
              onChange={(e) => setDevNetwork(e.target.value)}
              className="px-3 py-2 rounded-md bg-slate-950/80 text-white text-sm border border-slate-800"
              placeholder="ethereum"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={devAmountUSD}
              onChange={(e) => setDevAmountUSD(e.target.value)}
              className="px-3 py-2 rounded-md bg-slate-950/80 text-white text-sm border border-slate-800"
              placeholder="Amount USD"
            />
            <input
              value={devEmail}
              onChange={(e) => setDevEmail(e.target.value)}
              className="px-3 py-2 rounded-md bg-slate-950/80 text-white text-sm border border-slate-800"
              placeholder="customer@email.com"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={devSendEmails}
              onChange={(e) => setDevSendEmails(e.target.checked)}
            />
            Send dev emails
          </label>
          <div className="flex gap-2">
            <button
              onClick={runDevCreate}
              className="flex-1 px-3 py-2 rounded-md bg-white text-black text-xs font-semibold"
            >
              Create Dev Payment
            </button>
            <button
              onClick={runDevConfirm}
              disabled={!lastDev}
              className="flex-1 px-3 py-2 rounded-md bg-slate-800 text-white text-xs font-semibold disabled:opacity-50"
            >
              Confirm Dev Payment
            </button>
          </div>
          {lastDev ? (
            <div className="text-[11px] text-slate-400">
              Last: {lastDev.orderNumber}
            </div>
          ) : null}
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
            <RefreshCw className="w-4 h-4 animate-spin" /> Loading payments...
          </div>
        ) : null}

        {filteredPayments.map((payment) => {
          const status = payment.status;
          const statusIcon =
            status === "confirmed" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : status === "failed" || status === "expired" ? (
              <XCircle className="w-4 h-4 text-red-400" />
            ) : (
              <Clock className="w-4 h-4 text-amber-300" />
            );

          return (
            <div
              key={payment.id}
              className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-white font-semibold">
                    {statusIcon}
                    {payment.order_number}
                  </div>
                  <div className="text-xs text-slate-400">
                    {payment.coin} on {payment.network} • ${Number(payment.amount_usd).toFixed(2)}
                  </div>
                  {payment.guest_email ? (
                    <div className="text-xs text-slate-500">{payment.guest_email}</div>
                  ) : null}
                  {(() => {
                    const email = (payment.guest_email || '').toLowerCase();
                    const recruit = recruitsByEmail[email];
                    if (!recruit) return null;
                    const label = recruit.full_name || recruit.username || recruit.email;
                    return (
                      <div className="text-[11px] text-emerald-300/80">
                        Recruit: {label}{recruit.status ? ` • ${recruit.status}` : ''}
                      </div>
                    );
                  })()}
                </div>
                <div className="text-xs text-slate-400 text-right">
                  <div>{status}</div>
                  {payment.confirmations != null && payment.required_confirmations ? (
                    <div>
                      {payment.confirmations}/{payment.required_confirmations} conf
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="truncate max-w-[220px]">{payment.tx_hash}</span>
                <a
                  href={`https://blockchair.com/search?q=${payment.tx_hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200"
                >
                  Explorer <ExternalLink className="w-3 h-3" />
                </a>
                {payment.refund_status ? (
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                    refund: {payment.refund_status}
                  </span>
                ) : null}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <select
                  value={statusDraft[payment.id] || ""}
                  onChange={(e) =>
                    setStatusDraft((prev) => ({ ...prev, [payment.id]: e.target.value }))
                  }
                  className="px-3 py-2 rounded-md bg-slate-950/80 text-white text-xs border border-slate-800"
                >
                  <option value="">Update status…</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <input
                  value={notes[payment.id] || ""}
                  onChange={(e) =>
                    setNotes((prev) => ({ ...prev, [payment.id]: e.target.value }))
                  }
                  className="px-3 py-2 rounded-md bg-slate-950/80 text-white text-xs border border-slate-800"
                  placeholder="Admin notes"
                />
                <button
                  onClick={() => updatePayment(payment.id)}
                  className="px-3 py-2 rounded-md bg-white text-black text-xs font-semibold"
                >
                  Update
                </button>
              </div>
            </div>
          );
        })}

        {!loading && filteredPayments.length === 0 ? (
          <div className="text-xs text-slate-400">No payments found.</div>
        ) : null}
      </div>
    </div>
  );
}
