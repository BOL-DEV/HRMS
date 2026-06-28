"use client";

type PaymentMethod = "Cash" | "Transfer" | "POS";

type Option = {
  id: string;
  name: string;
};

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getTodayRange() {
  const today = formatDate(new Date());
  return { start: today, end: today };
}

function getLastSevenDaysRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);

  return {
    start: formatDate(start),
    end: formatDate(end),
  };
}

function getThisMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    start: formatDate(start),
    end: formatDate(now),
  };
}

type Props = {
  startDate: string;
  endDate: string;
  department: string;
  paymentMethod: PaymentMethod | "All";
  agent: string;
  incomeHead: string;
  departmentOptions: Option[];
  agentOptions: Option[];
  incomeHeadOptions: Option[];
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onPaymentMethodChange: (value: PaymentMethod | "All") => void;
  onAgentChange: (value: string) => void;
  onIncomeHeadChange: (value: string) => void;
  onViewAllReports?: () => void;
  isViewAllDisabled?: boolean;
};

function FoReportsFilterPanel({
  startDate,
  endDate,
  department,
  paymentMethod,
  agent,
  incomeHead,
  departmentOptions,
  agentOptions,
  incomeHeadOptions,
  onStartDateChange,
  onEndDateChange,
  onDepartmentChange,
  onPaymentMethodChange,
  onAgentChange,
  onIncomeHeadChange,
  onViewAllReports,
  isViewAllDisabled = false,
}: Props) {
  const applyRange = (range: { start: string; end: string }) => {
    onStartDateChange(range.start);
    onEndDateChange(range.end);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.05)] dark:border-line-subtle dark:bg-panel">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => applyRange(getTodayRange())}
          className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 dark:border-line-subtle dark:text-slate-300 dark:hover:border-brand-500/50 dark:hover:bg-panel-strong dark:hover:text-brand-200"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => applyRange(getLastSevenDaysRange())}
          className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 dark:border-line-subtle dark:text-slate-300 dark:hover:border-brand-500/50 dark:hover:bg-panel-strong dark:hover:text-brand-200"
        >
          Last 7 Days
        </button>
        <button
          type="button"
          onClick={() => applyRange(getThisMonthRange())}
          className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 dark:border-line-subtle dark:text-slate-300 dark:hover:border-brand-500/50 dark:hover:bg-panel-strong dark:hover:text-brand-200"
        >
          This Month
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Department
          </p>
          <select
            value={department}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-line-subtle dark:bg-canvas-alt dark:text-slate-100"
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
            Income Head
          </p>
          <select
            value={incomeHead}
            onChange={(e) => onIncomeHeadChange(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-line-subtle dark:bg-canvas-alt dark:text-slate-100"
          >
            <option value="All">All</option>
            {incomeHeadOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Agent
          </p>
          <select
            value={agent}
            onChange={(e) => onAgentChange(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-line-subtle dark:bg-canvas-alt dark:text-slate-100"
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
            Payment Method
          </p>
          <select
            value={paymentMethod}
            onChange={(e) =>
              onPaymentMethodChange(e.target.value as PaymentMethod | "All")
            }
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-line-subtle dark:bg-canvas-alt dark:text-slate-100"
          >
            <option value="All">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="Transfer">Transfer</option>
            <option value="POS">POS</option>
          </select>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Start Date
          </p>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-line-subtle dark:bg-canvas-alt dark:text-slate-100"
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
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-line-subtle dark:bg-canvas-alt dark:text-slate-100"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {onViewAllReports ? (
          <button
            type="button"
            onClick={onViewAllReports}
            disabled={isViewAllDisabled}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-line-subtle dark:bg-panel dark:text-slate-200 dark:hover:bg-panel-strong"
          >
            View All Reports
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default FoReportsFilterPanel;
