"use client";

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

const chartPalette = [
  "#dc2626",
  "#ec4899",
  "#14b8a6",
  "#6366f1",
  "#f59e0b",
  "#0ea5e9",
  "#8b5cf6",
];

const labelColorMap: Record<string, string> = {
  today: "#dc2626",
  yesterday: "#ec4899",
  "this week": "#14b8a6",
  "current week": "#14b8a6",
  "this month": "#6366f1",
  "this year": "#f59e0b",
  mon: "#2563eb",
  tue: "#7c3aed",
  wed: "#ec4899",
  thu: "#f97316",
  fri: "#14b8a6",
  sat: "#eab308",
  sun: "#ef4444",
};

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
      labelColorMap[item.name.trim().toLowerCase()] ??
      chartPalette[index % chartPalette.length],
  }));

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900">
      <div className="p-5 border-b border-gray-200 dark:border-slate-700">
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
