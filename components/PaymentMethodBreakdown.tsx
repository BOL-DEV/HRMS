"use client";

import {
  Cell,
  Pie,
  PieChart,
  type PieLabelRenderProps,
  ResponsiveContainer,
} from "recharts";
import { paymentMethodProps } from "@/libs/type";
import { formatCurrency } from "@/libs/helper";

function PaymentMethodBreakdown({
  title = "Payment Method Breakdown",
  subtitle = "Distribution of payment methods",
  data = [],
}: paymentMethodProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const renderPieLabel = ({
    name,
    value,
    x,
    y,
    textAnchor,
    dominantBaseline,
  }: PieLabelRenderProps) => {
    if (
      typeof name !== "string" ||
      typeof value !== "number" ||
      typeof x !== "number" ||
      typeof y !== "number"
    ) {
      return null;
    }

    const percent = total > 0 ? ((value / total) * 100).toFixed(0) : "0";

    return (
      <text
        x={x}
        y={y}
        fill="currentColor"
        textAnchor={textAnchor}
        dominantBaseline={dominantBaseline}
        className="text-xs"
      >
        {`${name} ${percent}%`}
      </text>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl min-h-[34rem] overflow-hidden flex flex-col dark:border-slate-700 dark:bg-slate-900">
      <div className="p-5 border-b border-gray-200 dark:border-slate-700">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-sm text-gray-600 dark:text-slate-400">{subtitle}</p>
      </div>

      <div className="flex flex-1 flex-col p-5 text-gray-900 dark:text-slate-100">
        {data.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-gray-300 px-6 text-center text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
            Payment method totals are not available for the current response.
          </div>
        ) : (
          <>
            <div className="h-[24rem] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={100}
                    outerRadius={130}
                    paddingAngle={2}
                    label={renderPieLabel}
                  >
                    {data.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              {data.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-2 text-gray-700 dark:text-slate-200"
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium">{item.name}</span>
                  <span className="text-gray-500 dark:text-slate-400">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PaymentMethodBreakdown;
