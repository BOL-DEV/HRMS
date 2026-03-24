"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  title?: string;
  subtitle?: string;
  data: { name: string; value: number }[];
}

function RevenueBarChart({ title, subtitle, data }: Props) {
  return (
    <div className=" bg-white border border-gray-200 rounded-xl dark:border-slate-700 dark:bg-slate-900">
      <div className="p-5 border-b border-gray-200 dark:border-slate-700">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-sm text-gray-600 dark:text-slate-400">{subtitle}</p>
      </div>

      <div className="w-full h-120 lg:p-10 p-5">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
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
            <Bar dataKey="value" fill="#2563EB" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default RevenueBarChart;
