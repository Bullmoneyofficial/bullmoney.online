"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";

const PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
];

type NetworkAccount = {
  id: string;
  platform: string;
  handle: string | null;
  label: string | null;
  color: string | null;
  profile_url: string | null;
  sort_order: number | null;
  is_active: boolean | null;
};

type NetworkPost = {
  id: string;
  account_id: string;
  post_url: string;
  sort_order: number | null;
  is_active: boolean | null;
};

const emptyAccountForm = {
  id: "",
  platform: "instagram",
  handle: "",
  label: "",
  color: "#111111",
  profile_url: "",
  sort_order: 0,
  is_active: true,
};

const emptyPostForm = {
  id: "",
  account_id: "",
  post_url: "",
  sort_order: 0,
  is_active: true,
};

export default function NetworkAdminPanel() {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [busy, setBusy] = useState(false);
  const [accounts, setAccounts] = useState<NetworkAccount[]>([]);
  const [posts, setPosts] = useState<NetworkPost[]>([]);
  const [accountForm, setAccountForm] = useState({ ...emptyAccountForm });
  const [postForm, setPostForm] = useState({ ...emptyPostForm });
  const [activeAccountId, setActiveAccountId] = useState<string>("");

  const refreshNetwork = useCallback(async () => {
    setBusy(true);
    const { data: accountsData, error: accountsError } = await supabase
      .from("network_accounts")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    const { data: postsData, error: postsError } = await supabase
      .from("network_posts")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (!accountsError) setAccounts((accountsData || []) as NetworkAccount[]);
    if (!postsError) setPosts((postsData || []) as NetworkPost[]);
    setBusy(false);
  }, [supabase]);

  useEffect(() => {
    refreshNetwork();
  }, [refreshNetwork]);

  useEffect(() => {
    if (activeAccountId) return;
    if (accounts.length > 0) {
      setActiveAccountId(accounts[0].id);
      setPostForm((prev) => ({ ...prev, account_id: accounts[0].id }));
    }
  }, [accounts, activeAccountId]);

  const activeAccount = accounts.find((acc) => acc.id === activeAccountId) || null;
  const filteredPosts = posts.filter((post) => post.account_id === activeAccountId);

  const resetAccountForm = useCallback(() => {
    setAccountForm({ ...emptyAccountForm });
  }, []);

  const resetPostForm = useCallback((accountId?: string) => {
    setPostForm({ ...emptyPostForm, account_id: accountId || activeAccountId || "" });
  }, [activeAccountId]);

  const upsertAccount = useCallback(async () => {
    const payload = {
      platform: accountForm.platform,
      handle: accountForm.handle || null,
      label: accountForm.label || null,
      color: accountForm.color || "#111111",
      profile_url: accountForm.profile_url || null,
      sort_order: Number(accountForm.sort_order || 0),
      is_active: !!accountForm.is_active,
    };

    const query = accountForm.id
      ? supabase.from("network_accounts").update(payload).eq("id", accountForm.id)
      : supabase.from("network_accounts").insert(payload);

    const { error } = await query;
    if (!error) {
      resetAccountForm();
      await refreshNetwork();
    }
  }, [accountForm, refreshNetwork, resetAccountForm, supabase]);

  const removeAccount = useCallback(
    async (id: string) => {
      await supabase.from("network_accounts").delete().eq("id", id);
      if (activeAccountId === id) {
        setActiveAccountId("");
        resetPostForm("");
      }
      refreshNetwork();
    },
    [activeAccountId, refreshNetwork, resetPostForm, supabase]
  );

  const upsertPost = useCallback(async () => {
    if (!postForm.account_id) return;
    const payload = {
      account_id: postForm.account_id,
      post_url: postForm.post_url,
      sort_order: Number(postForm.sort_order || 0),
      is_active: !!postForm.is_active,
    };

    const query = postForm.id
      ? supabase.from("network_posts").update(payload).eq("id", postForm.id)
      : supabase.from("network_posts").insert(payload);

    const { error } = await query;
    if (!error) {
      resetPostForm(postForm.account_id);
      refreshNetwork();
    }
  }, [postForm, refreshNetwork, resetPostForm, supabase]);

  const removePost = useCallback(
    async (id: string) => {
      await supabase.from("network_posts").delete().eq("id", id);
      refreshNetwork();
    },
    [refreshNetwork, supabase]
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-white font-semibold text-sm">Network media</h3>
          <p className="text-slate-400 text-xs">Manage Instagram, TikTok, and YouTube embeds.</p>
        </div>
        <button
          type="button"
          onClick={refreshNetwork}
          className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-200"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs uppercase tracking-[0.24em] text-slate-400">Accounts</h4>
            <button
              type="button"
              onClick={resetAccountForm}
              className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-xs text-slate-200"
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </button>
          </div>

          <div className="space-y-2">
            {accounts.map((account) => (
              <button
                key={account.id}
                type="button"
                onClick={() => {
                  setActiveAccountId(account.id);
                  setAccountForm({
                    id: account.id,
                    platform: account.platform || "instagram",
                    handle: account.handle || "",
                    label: account.label || "",
                    color: account.color || "#111111",
                    profile_url: account.profile_url || "",
                    sort_order: account.sort_order || 0,
                    is_active: account.is_active ?? true,
                  });
                }}
                className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                  activeAccountId === account.id
                    ? "border-blue-500/50 bg-blue-950/40"
                    : "border-slate-800 bg-slate-900/70"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm text-white font-semibold">
                      {account.label || account.handle || "Untitled"}
                    </div>
                    <div className="text-xs text-slate-400">
                      {account.platform} {account.handle ? `· @${account.handle}` : ""}
                    </div>
                  </div>
                  <span className={`text-[11px] ${account.is_active ? "text-emerald-400" : "text-slate-500"}`}>
                    {account.is_active ? "Active" : "Hidden"}
                  </span>
                </div>
              </button>
            ))}
            {!accounts.length && (
              <div className="rounded-lg border border-dashed border-slate-800 px-3 py-4 text-xs text-slate-400">
                No accounts yet. Add your first network account.
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-sm text-white font-semibold">Account editor</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-slate-300">
                Platform
                <select
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-200"
                  value={accountForm.platform}
                  onChange={(e) => setAccountForm((prev) => ({ ...prev, platform: e.target.value }))}
                >
                  {PLATFORM_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-slate-300">
                Handle
                <input
                  value={accountForm.handle}
                  onChange={(e) => setAccountForm((prev) => ({ ...prev, handle: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-200"
                  placeholder="bullmoney.shop"
                />
              </label>
              <label className="text-xs text-slate-300">
                Label
                <input
                  value={accountForm.label}
                  onChange={(e) => setAccountForm((prev) => ({ ...prev, label: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-200"
                  placeholder="BullMoney Shop"
                />
              </label>
              <label className="text-xs text-slate-300">
                Accent color
                <input
                  value={accountForm.color}
                  onChange={(e) => setAccountForm((prev) => ({ ...prev, color: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-200"
                  placeholder="#111111"
                />
              </label>
              <label className="text-xs text-slate-300 sm:col-span-2">
                Profile URL
                <input
                  value={accountForm.profile_url}
                  onChange={(e) => setAccountForm((prev) => ({ ...prev, profile_url: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-200"
                  placeholder="https://instagram.com/bullmoney.shop"
                />
              </label>
              <label className="text-xs text-slate-300">
                Sort order
                <input
                  type="number"
                  value={accountForm.sort_order}
                  onChange={(e) => setAccountForm((prev) => ({ ...prev, sort_order: Number(e.target.value) }))}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-200"
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 mt-6">
                <input
                  type="checkbox"
                  checked={!!accountForm.is_active}
                  onChange={(e) => setAccountForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                />
                Visible
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={upsertAccount}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/20 px-3 py-1.5 text-xs text-emerald-100"
              >
                <Save className="h-3.5 w-3.5" />
                Save account
              </button>
              {accountForm.id ? (
                <button
                  type="button"
                  onClick={() => removeAccount(accountForm.id)}
                  className="inline-flex items-center gap-2 rounded-md border border-red-500/40 bg-red-500/20 px-3 py-1.5 text-xs text-red-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete account
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs uppercase tracking-[0.24em] text-slate-400">Posts</h4>
              <p className="text-xs text-slate-500">Add embed URLs for the selected account.</p>
            </div>
            <button
              type="button"
              onClick={() => resetPostForm(activeAccountId)}
              className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-xs text-slate-200"
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </button>
          </div>

          <div className="space-y-2">
            {filteredPosts.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() =>
                  setPostForm({
                    id: post.id,
                    account_id: post.account_id,
                    post_url: post.post_url || "",
                    sort_order: post.sort_order || 0,
                    is_active: post.is_active ?? true,
                  })
                }
                className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                  postForm.id === post.id
                    ? "border-blue-500/50 bg-blue-950/40"
                    : "border-slate-800 bg-slate-900/70"
                }`}
              >
                <div className="text-xs text-white font-semibold truncate">{post.post_url}</div>
                <div className="text-[11px] text-slate-400">Order {post.sort_order || 0}</div>
              </button>
            ))}
            {!filteredPosts.length && (
              <div className="rounded-lg border border-dashed border-slate-800 px-3 py-4 text-xs text-slate-400">
                No posts for {activeAccount?.label || activeAccount?.handle || "this account"} yet.
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-sm text-white font-semibold">Post editor</div>
            <div className="grid gap-3">
              <label className="text-xs text-slate-300">
                Account
                <select
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-200"
                  value={postForm.account_id}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, account_id: e.target.value }))}
                >
                  <option value="">Select an account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.label || account.handle || account.platform}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-slate-300">
                Post URL
                <input
                  value={postForm.post_url}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, post_url: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-200"
                  placeholder="https://www.instagram.com/p/..."
                />
              </label>
              <label className="text-xs text-slate-300">
                Sort order
                <input
                  type="number"
                  value={postForm.sort_order}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, sort_order: Number(e.target.value) }))}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-200"
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={!!postForm.is_active}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                />
                Visible
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={upsertPost}
                disabled={busy || !postForm.account_id || !postForm.post_url}
                className="inline-flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/20 px-3 py-1.5 text-xs text-emerald-100"
              >
                <Save className="h-3.5 w-3.5" />
                Save post
              </button>
              {postForm.id ? (
                <button
                  type="button"
                  onClick={() => removePost(postForm.id)}
                  className="inline-flex items-center gap-2 rounded-md border border-red-500/40 bg-red-500/20 px-3 py-1.5 text-xs text-red-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete post
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
