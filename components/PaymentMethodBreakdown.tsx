"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
} from "recharts";
import { paymentMethodProps } from "@/libs/type";

const paymentMethods = [
  { name: "Credit Card", value: 45, color: "#2563EB" },
  { name: "Insurance", value: 28, color: "#10B981" },
  { name: "Bank Transfer", value: 18, color: "#F59E0B" },
  { name: "Cash", value: 9, color: "#EF4444" },
];

function PaymentMethodBreakdown({
  title = "Payment Method Breakdown",
  subtitle = "Distribution of payment methods",
  data = paymentMethods,
}: paymentMethodProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const renderPieLabel = ({
    name,
    value,
    x,
    y,
    textAnchor,
    dominantBaseline,
  }: {
    name: string;
    value: number;
    x: number;
    y: number;
    textAnchor: string;
    dominantBaseline: string;
  }) => (
    <text
      x={x}
      y={y}
      fill="currentColor"
      textAnchor={textAnchor as any}
      dominantBaseline={dominantBaseline as any}
      className="text-xs"
    >
      {`${name} ${((value / total) * 100).toFixed(0)}%`}
    </text>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl h-full flex flex-col dark:border-slate-700 dark:bg-slate-900">
      <div className="p-5 border-b border-gray-200 dark:border-slate-700">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-sm text-gray-600 dark:text-slate-400">{subtitle}</p>
      </div>

      <div className="p-5 h-80 text-gray-900 dark:text-slate-100">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={2}
              label={renderPieLabel as any}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
          {data.map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-2 text-gray-700 dark:text-slate-200"
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-medium">{item.name}</span>
              <span className="text-gray-500 dark:text-slate-400">
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PaymentMethodBreakdown;
