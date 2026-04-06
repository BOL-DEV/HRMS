import type { ReactNode } from "react";

type Props = {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onApply: () => void;
  onClear: () => void;
  isInvalid: boolean;
  leadSlot?: ReactNode;
};

function AdminDateRangeFilterBar({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
  onClear,
  isInvalid,
  leadSlot,
}: Props) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 border-b border-gray-200 p-5 dark:border-slate-700 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
        {leadSlot ?? <div className="hidden lg:block" />}

        <input
          type="date"
          value={startDate}
          onChange={(event) => onStartDateChange(event.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          aria-label="Start date"
        />

        <input
          type="date"
          value={endDate}
          onChange={(event) => onEndDateChange(event.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          aria-label="End date"
        />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onApply}
            disabled={isInvalid}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Clear
          </button>
        </div>
      </div>

      {isInvalid ? (
        <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          Start date and end date must be selected together.
        </div>
      ) : null}
    </>
  );
}

export default AdminDateRangeFilterBar;
