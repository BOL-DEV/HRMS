"use client";

import { FiDownload, FiPlus, FiRefreshCw } from "react-icons/fi";

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
  onExport?: () => void;
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
  onExport,
}: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 dark:bg-slate-900 dark:border-slate-800">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2 dark:text-slate-200">
            Department
          </p>
          <select
            value={selectedDepartment}
            onChange={(event) => onDepartmentChange(event.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
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
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
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
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
          </select>
        </div>

        <div>
          <button
            className="w-full md:w-auto bg-blue-700 hover:bg-blue-800 text-white font-medium px-5 py-3 rounded-xl flex items-center justify-center gap-2"
            onClick={onNewTransaction}
            type="button"
          >
            <FiPlus className="text-lg" /> Process Payment
          </button>
        </div>

        <div>
          <button
            className="w-full bg-white hover:bg-gray-50 text-gray-900 font-medium px-5 py-3 rounded-xl flex items-center justify-center gap-2 border border-gray-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-100 dark:border-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onRefresh}
            type="button"
            disabled={!onRefresh || isRefreshing}
          >
            <FiRefreshCw
              className={`text-lg ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

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
