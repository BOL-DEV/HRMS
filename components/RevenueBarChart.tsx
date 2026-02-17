"use client";

import React from "react";
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
  data: { day: string; value: number }[];
}

function RevenueBarChart({ data }: Props) {
  return (
    <div className="w-full h-65">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis tickFormatter={(v) => v.toString()} />
          <Tooltip
            formatter={(value) => [value, "Revenue"]}
            labelFormatter={(label) => `${label}`}
          />
          <Bar dataKey="value" fill="#1f2937" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default RevenueBarChart;
