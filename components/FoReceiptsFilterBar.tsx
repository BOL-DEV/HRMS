"use client";

import type { FoReceiptFilter } from "@/libs/type";
import { FiRefreshCcw, FiSearch } from "react-icons/fi";

const tabs: { key: FoReceiptFilter; label: string }[] = [
  { key: "pending", label: "Pending Requests" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

type Props = {
  activeTab: FoReceiptFilter;
  query: string;
  onTabChange: (value: FoReceiptFilter) => void;
  onQueryChange: (value: string) => void;
  onRefresh: () => void;
};

function FoReceiptsFilterBar({
  activeTab,
  query,
  onTabChange,
  onQueryChange,
  onRefresh,
}: Props) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab.key
                ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-stretch gap-4 xl:flex-row">
        <div className="flex-1">
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <FiSearch className="text-gray-500 dark:text-slate-400" />
            <input
              className="w-full bg-transparent text-sm outline-none dark:text-slate-100"
              placeholder="Search by patient name, receipt ID, or reason"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onRefresh}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold shadow-sm hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FiRefreshCcw className="text-lg" /> Refresh
          </button>
        </div>
      </div>
    </>
  );
}

export default FoReceiptsFilterBar;
