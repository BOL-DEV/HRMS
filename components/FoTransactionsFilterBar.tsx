"use client";

import { FiDownload, FiSearch } from "react-icons/fi";

type MethodFilter = "All" | "Cash" | "Transfer" | "POS";
type DateFilter = "All" | "Today";

type Props = {
  search: string;
  method: MethodFilter;
  dateFilter: DateFilter;
  onSearchChange: (value: string) => void;
  onMethodChange: (value: MethodFilter) => void;
  onDateFilterChange: (value: DateFilter) => void;
  onExport: () => void;
};

function FoTransactionsFilterBar({
  search,
  method,
  dateFilter,
  onSearchChange,
  onMethodChange,
  onDateFilterChange,
  onExport,
}: Props) {
  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex w-full items-center gap-3">
        <div className="relative w-full">
          <FiSearch className="absolute left-3 top-3 text-gray-400 dark:text-slate-500" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by patient name, phone, receipt, or agent..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={method}
            onChange={(e) => onMethodChange(e.target.value as MethodFilter)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="All">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="Transfer">Transfer</option>
            <option value="POS">POS</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => onDateFilterChange(e.target.value as DateFilter)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="All">All Dates</option>
            <option value="Today">Today</option>
          </select>
        </div>

        <button
          onClick={onExport}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 md:self-auto"
        >
          <FiDownload />
          Export
        </button>
      </div>
    </div>
  );
}

export default FoTransactionsFilterBar;
