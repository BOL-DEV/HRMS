"use client";

import DashboardSegmentedControl from "@/components/dashboard/DashboardSegmentedControl";
import type { AdminDashboardPeriod } from "@/libs/type";

type Props = {
  months: AdminDashboardPeriod;
  onMonthsChange: (value: AdminDashboardPeriod) => void;
  mobile?: boolean;
};

function AdminDashboardControls({
  months,
  onMonthsChange,
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
    </div>
  );
}

export default AdminDashboardControls;
