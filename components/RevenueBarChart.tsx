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
    <div className=" bg-white border border-gray-200 rounded-xl">
      <div className="p-5 border-b border-gray-200">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>

      <div className="w-full h-80 p-10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(v) => v.toString()} />
            <Tooltip
              formatter={(value) => [value, "Revenue"]}
              labelFormatter={(label) => `${label}`}
            />
            <Bar dataKey="value" fill="#1f2937" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default RevenueBarChart;
