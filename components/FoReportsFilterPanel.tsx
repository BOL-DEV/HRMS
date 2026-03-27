"use client";

import { FiTrendingUp } from "react-icons/fi";

type PaymentMethod = "Cash" | "Transfer" | "POS";

type Option = {
  id: string;
  name: string;
};

type Props = {
  startDate: string;
  endDate: string;
  department: string;
  paymentMethod: PaymentMethod | "All";
  agent: string;
  billDescription: string;
  departmentOptions: Option[];
  agentOptions: Option[];
  billDescriptionOptions: string[];
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onPaymentMethodChange: (value: PaymentMethod | "All") => void;
  onAgentChange: (value: string) => void;
  onBillDescriptionChange: (value: string) => void;
  onGenerateReport: () => void;
};

function FoReportsFilterPanel({
  startDate,
  endDate,
  department,
  paymentMethod,
  agent,
  billDescription,
  departmentOptions,
  agentOptions,
  billDescriptionOptions,
  onStartDateChange,
  onEndDateChange,
  onDepartmentChange,
  onPaymentMethodChange,
  onAgentChange,
  onBillDescriptionChange,
  onGenerateReport,
}: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 dark:border-slate-700 dark:bg-slate-900">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Start Date
          </p>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
            End Date
          </p>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Department
          </p>
          <select
            value={department}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="All">All</option>
            {departmentOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Payment Method
          </p>
          <select
            value={paymentMethod}
            onChange={(e) =>
              onPaymentMethodChange(e.target.value as PaymentMethod | "All")
            }
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="All">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="Transfer">Transfer</option>
            <option value="POS">POS</option>
          </select>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Agent
          </p>
          <select
            value={agent}
            onChange={(e) => onAgentChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="All">All</option>
            {agentOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Bill Description
          </p>
          <select
            value={billDescription}
            onChange={(e) => onBillDescriptionChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="All">All</option>
            {billDescriptionOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={onGenerateReport}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        <FiTrendingUp />
        Generate Report
      </button>
    </div>
  );
}

export default FoReportsFilterPanel;
