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
      <div className="bg-white border border-black/10 rounded-2xl overflow-hidden h-full flex flex-col min-h-0">
        {/* Header */}
        <div className="p-5 border-b border-black/10 bg-white">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-black/50">Affiliate Dashboard</p>
              <h3 className="text-lg font-bold text-black mt-1">Desktop View</h3>
              <p className="text-sm text-black/60">Showing {total} result{total === 1 ? "" : "s"}</p>
            </div>
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search email, ID, MT5, affiliate code"
                className="w-full bg-white border border-black/15 rounded-lg pl-10 pr-4 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1 min-h-0">
          <table className="w-full table-auto">
            <thead className="border-b border-black/10 bg-white sticky top-0 z-10">
              <tr className="text-left text-[11px] font-semibold text-black/50 uppercase tracking-wider">
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
            <tbody className="divide-y divide-black/10">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-black/50">
                    Loading recruits...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-black/50">
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
                          zebra && "bg-black/[0.02]",
                          isOpen ? "bg-black/[0.04]" : "hover:bg-black/[0.03]"
                        )}
                      >
                        <td className="px-6 py-4 align-middle">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-lg bg-white border border-black/15 overflow-hidden flex items-center justify-center text-black/50 shrink-0">
                              {r.image_url ? (
                                <img src={r.image_url} alt={r.email} className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-[10px]">—</span>
                              )}
                            </div>
                            <div className="min-w-0 max-w-[220px]">
                              <div className="text-sm text-black font-medium truncate">{r.email}</div>
                              <div className="text-[11px] text-black/50 truncate">ID: {r.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-black/70 whitespace-nowrap">{r.id}</td>
                        <td className="px-6 py-4 text-sm text-black/70 font-mono whitespace-nowrap">{r.mt5_id || "—"}</td>
                        <td className="px-6 py-4 text-sm text-black/80 font-mono whitespace-nowrap">{r.affiliate_code || "—"}</td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          <span
                            className={cn(
                              "px-2 py-1 rounded text-xs font-semibold inline-block",
                              r.status === "active" ? "bg-black/10 text-black" : "bg-white border border-black/15 text-black/60"
                            )}
                          >
                            {r.status || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-black font-mono whitespace-nowrap">
                          {Number(r.total_lots_traded || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-black font-mono whitespace-nowrap">
                          ${Number(r.total_earnings || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => onOpenEditor(r)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-black/5 border border-black/20 text-black text-sm transition-colors"
                          >
                            <Edit3 className="w-4 h-4" /> Edit
                          </button>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr>
                          <td colSpan={8} className="px-6 py-6 bg-white border-t-2 border-black/10">
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
        <div className="border-t border-black/10 p-4 text-right text-xs text-black/50 bg-white">
          End of results
        </div>
      </div>
    </div>
  );
}
