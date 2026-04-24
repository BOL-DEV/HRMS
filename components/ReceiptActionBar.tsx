"use client";

import { FiDownload, FiSearch } from "react-icons/fi";
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
  onExport?: () => void;
};

function ReceiptActionBar({
  searchType,
  searchValue,
  timePeriod,
  onSearchTypeChange,
  onSearchValueChange,
  onTimePeriodChange,
  onExport,
}: Props) {
  return (
    <div className="flex flex-col lg:flex-row gap-4 items-stretch">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4">
        <select
          value={searchType}
          onChange={(event) =>
            onSearchTypeChange(event.target.value as AgentReceiptSearchType)
          }
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
        >
          <option value="receipt_no">Receipt No</option>
          <option value="patient_name">Patient Name</option>
          <option value="patient_phone">Patient Phone</option>
          <option value="patient_id">Patient ID</option>
        </select>

        <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 dark:bg-slate-900 dark:border-slate-800">
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
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium min-w-40 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="last_7_days">Last 7 Days</option>
          <option value="last_30_days">Last 30 Days</option>
        </select>

        {/* <button
          className="bg-white border border-gray-200 rounded-xl px-5 py-3 text-sm font-semibold flex items-center justify-center gap-2 min-w-32 hover:bg-gray-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 dark:hover:bg-slate-800"
          onClick={onExport}
          type="button"
        >
          <FiDownload className="text-lg" /> Export
        </button> */}
      </div>
    </div>
  );
}

export default ReceiptActionBar;
