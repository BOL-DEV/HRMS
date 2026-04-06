"use client";

type Props = {
  months: number;
  topLimit: number;
  onMonthsChange: (value: number) => void;
  onTopLimitChange: (value: number) => void;
  mobile?: boolean;
};

function AdminDashboardControls({
  months,
  topLimit,
  onMonthsChange,
  onTopLimitChange,
  mobile = false,
}: Props) {
  return (
    <div className={`${mobile ? "flex gap-3 md:hidden" : "hidden items-center gap-3 md:flex"}`}>
      <select
        value={months}
        onChange={(event) => onMonthsChange(Number(event.target.value))}
        className={`${mobile ? "flex-1" : ""} rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100`}
      >
        <option value={3}>Last 3 months</option>
        <option value={6}>Last 6 months</option>
        <option value={12}>Last 12 months</option>
      </select>

      <select
        value={topLimit}
        onChange={(event) => onTopLimitChange(Number(event.target.value))}
        className={`${mobile ? "flex-1" : ""} rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100`}
      >
        <option value={5}>Top 5 hospitals</option>
        <option value={10}>Top 10 hospitals</option>
      </select>
    </div>
  );
}

export default AdminDashboardControls;
