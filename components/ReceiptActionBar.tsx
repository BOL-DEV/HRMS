"use client";

import { FiSearch } from "react-icons/fi";
import type {
  AgentReceiptSearchType,
  AgentTransactionsTimePeriod,
} from "@/libs/type";

type Props = {
  searchType: AgentReceiptSearchType;
  searchValue: string;
  timePeriod: AgentTransactionsTimePeriod;
  onSearchTypeChange: (value: AgentReceiptSearchType) => void;
  onSearchValueChange: (value: string) => void;
  onTimePeriodChange: (value: AgentTransactionsTimePeriod) => void;
};

function ReceiptActionBar({
  searchType,
  searchValue,
  timePeriod,
  onSearchTypeChange,
  onSearchValueChange,
  onTimePeriodChange,
}: Props) {
  return (
    <div className="flex flex-col items-stretch gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] dark:border-line-subtle dark:bg-panel lg:flex-row">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4">
        <select
          value={searchType}
          onChange={(event) =>
            onSearchTypeChange(event.target.value as AgentReceiptSearchType)
          }
          className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium dark:border-line-subtle dark:bg-canvas-alt dark:text-slate-100"
        >
          <option value="receipt_no">Receipt No</option>
          <option value="patient_name">Patient Name</option>
          <option value="patient_phone">Patient Phone</option>
          <option value="patient_id">Patient ID</option>
        </select>

        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 dark:border-line-subtle dark:bg-canvas-alt">
          <FiSearch className="text-gray-500 dark:text-slate-400" />
          <input
            value={searchValue}
            onChange={(event) => onSearchValueChange(event.target.value)}
            className="w-full outline-none text-sm bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-500"
            placeholder="Search receipts..."
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={timePeriod}
          onChange={(event) =>
            onTimePeriodChange(
              event.target.value as AgentTransactionsTimePeriod,
            )
          }
          className="min-w-40 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium dark:border-line-subtle dark:bg-canvas-alt dark:text-slate-100"
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="last_7_days">Last 7 Days</option>
          <option value="last_30_days">Last 30 Days</option>
        </select>

      </div>
    </div>
  );
}

export default ReceiptActionBar;
