"use client";

import DashboardSegmentedControl from "@/components/dashboard/DashboardSegmentedControl";
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
  const periodOptions: Array<{
    label: string;
    value: AdminDashboardPeriod;
  }> = [
    { label: "Last Month", value: "last_month" },
    { label: "3 Months", value: "last_three_months" },
    { label: "6 Months", value: "last_6_months" },
    { label: "12 Months", value: "last_12_months" },
  ];

  return (
    <div
      className={`${mobile ? "flex flex-col gap-3 md:hidden" : "hidden items-center gap-3 md:flex"}`}
    >
      <DashboardSegmentedControl
        value={
          periodOptions.some((option) => option.value === months)
            ? months
            : "last_6_months"
        }
        options={periodOptions}
        onChange={onMonthsChange}
        accent="admin"
      />

      <select
        multiple
        value={selectedHospitalIds}
        onChange={(event) => {
          const nextSelection = Array.from(event.target.selectedOptions).map(
            (option) => option.value,
          );
          onHospitalSelectionChange(nextSelection);
        }}
        className={`${mobile ? "w-full" : "min-w-64"} rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100`}
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
