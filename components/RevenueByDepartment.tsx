"use client";

import RevenueBarChart from "./RevenueBarChart";
import { RevenueChartDatum } from "@/libs/type";

type Props = {
  data?: RevenueChartDatum[];
};

function RevenueByDepartment({ data = [] }: Props) {
  return (
    <RevenueBarChart
      title="Revenue by Department"
      subtitle="Top performing departments"
      data={data}
      emptyMessage="Department revenue data is not available from the current FO dashboard endpoint."
    />
  );
}

export default RevenueByDepartment;
