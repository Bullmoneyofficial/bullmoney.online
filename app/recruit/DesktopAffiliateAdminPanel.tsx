"use client";

import React from "react";
import { Edit3, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { RecruitAdminRecord } from "@/app/recruit/types";

type Props = {
  search: string;
  setSearch: (value: string) => void;
  filtered: RecruitAdminRecord[];
  loading: boolean;
  expandedId: string | number | null;
  onOpenEditor: (record: RecruitAdminRecord) => void;
  renderEditForm: (record: RecruitAdminRecord) => React.ReactNode;
};

export default function DesktopAffiliateAdminPanel({
  search,
  setSearch,
  filtered,
  loading,
  expandedId,
  onOpenEditor,
  renderEditForm,
}: Props) {
  const total = filtered.length;

  return (
    <div className="hidden lg:block h-full min-h-0">
      <div className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden h-full flex flex-col min-h-0">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Affiliate Dashboard</p>
              <h3 className="text-lg font-bold text-white mt-1">Desktop View</h3>
              <p className="text-sm text-slate-400">Showing {total} result{total === 1 ? "" : "s"}</p>
            </div>
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search email, ID, MT5, affiliate code"
                className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/40"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1 min-h-0">
          <table className="w-full table-auto">
            <thead className="border-b border-slate-800 bg-slate-900/70 sticky top-0 z-10">
              <tr className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4 whitespace-nowrap">Email</th>
                <th className="px-6 py-4 whitespace-nowrap">ID</th>
                <th className="px-6 py-4 whitespace-nowrap">MT5</th>
                <th className="px-6 py-4 whitespace-nowrap">Affiliate Code</th>
                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Lots</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Earnings</th>
                <th className="px-6 py-4 whitespace-nowrap text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                    Loading recruits...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                    No recruits found.
                  </td>
                </tr>
              ) : (
                filtered.map((r, idx) => {
                  const isOpen = expandedId === r.id;
                  const zebra = idx % 2 === 1 && !isOpen;
                  return (
                    <React.Fragment key={String(r.id)}>
                      <tr
                        className={cn(
                          "transition-colors",
                          zebra && "bg-slate-900/40",
                          isOpen ? "bg-slate-900/70" : "hover:bg-slate-900/50"
                        )}
                      >
                        <td className="px-6 py-4 align-middle">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center text-slate-400 shrink-0">
                              {r.image_url ? (
                                <img src={r.image_url} alt={r.email} className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-[10px]">—</span>
                              )}
                            </div>
                            <div className="min-w-0 max-w-[220px]">
                              <div className="text-sm text-white font-medium truncate">{r.email}</div>
                              <div className="text-[11px] text-slate-500 truncate">ID: {r.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400 whitespace-nowrap">{r.id}</td>
                        <td className="px-6 py-4 text-sm text-slate-400 font-mono whitespace-nowrap">{r.mt5_id || "—"}</td>
                        <td className="px-6 py-4 text-sm text-slate-300 font-mono whitespace-nowrap">{r.affiliate_code || "—"}</td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          <span
                            className={cn(
                              "px-2 py-1 rounded text-xs font-semibold inline-block",
                              r.status === "active" ? "bg-white/20 text-white" : "bg-slate-700/50 text-slate-400"
                            )}
                          >
                            {r.status || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-slate-300 font-mono whitespace-nowrap">
                          {Number(r.total_lots_traded || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-white font-mono whitespace-nowrap">
                          ${Number(r.total_earnings || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => onOpenEditor(r)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/30 text-white text-sm transition-colors"
                          >
                            <Edit3 className="w-4 h-4" /> Edit
                          </button>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr>
                          <td colSpan={8} className="px-6 py-6 bg-slate-900/30 border-t-2 border-slate-800">
                            {renderEditForm(r)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 p-4 text-right text-xs text-slate-500 bg-slate-950/60">
          End of results
        </div>
      </div>
    </div>
  );
}
