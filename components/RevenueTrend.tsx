import RevenueBarChart from "./RevenueBarChart";
import { RevenueChartDatum } from "@/libs/type";

type Props = {
  data?: RevenueChartDatum[];
};

function RevenueTrend({ data = [] }: Props) {
  return (
    <RevenueBarChart
      title="Revenue Trend"
      subtitle="Revenue performance by available FO dashboard periods"
      data={data}
      emptyMessage="Revenue trend data is not available from the current FO dashboard endpoint."
    />
  );
}

export default RevenueTrend;
