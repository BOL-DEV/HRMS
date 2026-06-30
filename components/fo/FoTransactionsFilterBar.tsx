"use client";

import { FiDownload, FiSearch } from "react-icons/fi";

type MethodFilter = "All" | "Cash" | "Transfer" | "POS";

type Props = {
  search: string;
  method: MethodFilter;
  startDate: string;
  endDate: string;
  onSearchChange: (value: string) => void;
  onMethodChange: (value: MethodFilter) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onExport: () => void;
};

function FoTransactionsFilterBar({
  search,
  method,
  startDate,
  endDate,
  onSearchChange,
  onMethodChange,
  onStartDateChange,
  onEndDateChange,
  onExport,
}: Props) {
  return (
    <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.05)] dark:border-line-subtle dark:bg-panel">
      <div className="flex w-full items-center gap-3">
        <div className="relative w-full">
          <FiSearch className="absolute left-3 top-3 text-gray-400 dark:text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by patient name, phone, receipt, or agent..."
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-line-subtle dark:bg-canvas-alt dark:text-slate-100"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={method}
            onChange={(e) => onMethodChange(e.target.value as MethodFilter)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-line-subtle dark:bg-canvas-alt dark:text-slate-100"
          >
            <option value="All">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="Transfer">Transfer</option>
            <option value="POS">POS</option>
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-line-subtle dark:bg-canvas-alt dark:text-slate-100"
          />

          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-line-subtle dark:bg-canvas-alt dark:text-slate-100"
          />
        </div>

        <button
          onClick={onExport}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-line-subtle dark:bg-panel dark:text-slate-200 dark:hover:bg-panel-strong md:self-auto"
        >
          <FiDownload />
          Export
        </button>
      </div>
    </div>
  );
}

export default FoTransactionsFilterBar;
