"use client";

import { FiPlus, FiRefreshCw } from "react-icons/fi";

type Props = {
  departments: string[];
  selectedDepartment: string;
  selectedPaymentType: string;
  selectedTimePeriod: string;
  onDepartmentChange: (value: string) => void;
  onPaymentTypeChange: (value: string) => void;
  onTimePeriodChange: (value: string) => void;
  onNewTransaction: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
};

function TransactionActionBar({
  departments,
  selectedDepartment,
  selectedPaymentType,
  selectedTimePeriod,
  onDepartmentChange,
  onPaymentTypeChange,
  onTimePeriodChange,
  onNewTransaction,
  onRefresh,
  isRefreshing = false,
}: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] dark:border-line-subtle dark:bg-panel">
      <div
        className={`grid grid-cols-1 gap-4 items-end ${
          onRefresh
            ? "md:grid-cols-6"
            : "md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
        }`}
      >
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2 dark:text-slate-200">
            Department
          </p>
          <select
            value={selectedDepartment}
            onChange={(event) => onDepartmentChange(event.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium dark:border-line-subtle dark:bg-canvas-alt dark:text-slate-100"
          >
            <option value="all">All</option>
            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2 dark:text-slate-200">
            Payment Method
          </p>
          <select
            value={selectedPaymentType}
            onChange={(event) => onPaymentTypeChange(event.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium dark:border-line-subtle dark:bg-canvas-alt dark:text-slate-100"
          >
            <option value="all">All</option>
            <option value="cash">Cash</option>
            <option value="transfer">Transfer</option>
            <option value="pos">POS</option>
          </select>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2 dark:text-slate-200">
            Date Range
          </p>
          <select
            value={selectedTimePeriod}
            onChange={(event) => onTimePeriodChange(event.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium dark:border-line-subtle dark:bg-canvas-alt dark:text-slate-100"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
          </select>
        </div>

        <div>
          <button
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 py-3 font-medium text-white hover:bg-brand-800 md:w-auto"
            onClick={onNewTransaction}
            type="button"
          >
            <FiPlus className="text-lg" /> Process Payment
          </button>
        </div>

        {onRefresh ? (
          <div>
            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 font-medium text-gray-900 hover:bg-gray-50 dark:border-line-subtle dark:bg-panel dark:text-slate-100 dark:hover:bg-panel-strong disabled:cursor-not-allowed disabled:opacity-60"
              onClick={onRefresh}
              type="button"
              disabled={isRefreshing}
            >
              <FiRefreshCw
                className={`text-lg ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        ) : null}

        {/* <div>
          <button
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium px-5 py-3 rounded-xl flex items-center justify-center gap-2 border border-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 dark:border-slate-700"
            onClick={onExport}
            type="button"
          >
            <FiDownload className="text-lg" /> Export
          </button>
        </div> */}
      </div>
    </div>
  );
}

export default TransactionActionBar;
