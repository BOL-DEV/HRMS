"use client";

import { BRAND_CHART_PALETTE, BRAND_PERIOD_COLORS, BRAND_WEEKDAY_COLORS } from "@/libs/brand";
import { RevenueChartDatum } from "@/libs/type";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  title?: string;
  subtitle?: string;
  data: RevenueChartDatum[];
  emptyMessage?: string;
}

function RevenueBarChart({
  title,
  subtitle,
  data,
  emptyMessage = "No chart data available.",
}: Props) {
  const chartData = data.map((item, index) => ({
    ...item,
    fill:
      item.color ??
      BRAND_PERIOD_COLORS[item.name.trim().toLowerCase()] ??
      BRAND_WEEKDAY_COLORS[item.name.trim().toLowerCase()] ??
      BRAND_CHART_PALETTE[index % BRAND_CHART_PALETTE.length],
  }));

  return (
    <div className="overflow-hidden rounded-xl border border-line-subtle bg-panel shadow-[0_16px_45px_rgba(15,23,42,0.05)] dark:border-line-subtle dark:bg-panel">
      <div className="border-b border-line-subtle p-5 dark:border-line-subtle">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-sm text-gray-600 dark:text-slate-400">{subtitle}</p>
      </div>

      <div className="w-full h-120 lg:p-10 p-5">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-300 px-6 text-center text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
            {emptyMessage}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                strokeOpacity={0.15}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "currentColor" }}
                axisLine={{ stroke: "currentColor" }}
                tickLine={{ stroke: "currentColor" }}
              />
              <YAxis
                tickFormatter={(v) => v.toString()}
                tick={{ fill: "currentColor" }}
                axisLine={{ stroke: "currentColor" }}
                tickLine={{ stroke: "currentColor" }}
              />
              <Tooltip
                formatter={(value) => [value, "Revenue"]}
                labelFormatter={(label) => `${label}`}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default RevenueBarChart;
