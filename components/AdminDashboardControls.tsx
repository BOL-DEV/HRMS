"use client";

import type { AdminDashboardPeriod } from "@/libs/type";

type Props = {
  months: AdminDashboardPeriod;
  selectedHospitalIds: string[];
  hospitalOptions: Array<{
    hospital_id: string;
    hospital_name: string;
  }>;
  onMonthsChange: (value: AdminDashboardPeriod) => void;
  onHospitalSelectionChange: (value: string[]) => void;
  mobile?: boolean;
};

function AdminDashboardControls({
  months,
  selectedHospitalIds,
  hospitalOptions,
  onMonthsChange,
  onHospitalSelectionChange,
  mobile = false,
}: Props) {
  return (
    <div className={`${mobile ? "flex gap-3 md:hidden" : "hidden items-center gap-3 md:flex"}`}>
      <select
        value={months}
        onChange={(event) => onMonthsChange(event.target.value as AdminDashboardPeriod)}
        className={`${mobile ? "flex-1" : ""} rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100`}
      >
        <option value="this_month">This month</option>
        <option value="last_month">Last month</option>
        <option value="last_two_months">Last 2 months</option>
        <option value="last_three_months">Last 3 months</option>
        <option value="last_6_months">Last 6 months</option>
        <option value="last_12_months">Last 12 months</option>
      </select>

      <select
        multiple
        value={selectedHospitalIds}
        onChange={(event) => {
          const nextSelection = Array.from(event.target.selectedOptions).map(
            (option) => option.value,
          );
          onHospitalSelectionChange(nextSelection);
        }}
        className={`${mobile ? "flex-1" : "min-w-56"} rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100`}
      >
        {hospitalOptions.map((hospital) => (
          <option key={hospital.hospital_id} value={hospital.hospital_id}>
            {hospital.hospital_name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default AdminDashboardControls;
