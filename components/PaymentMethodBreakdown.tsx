"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
} from "recharts";

type PaymentSlice = {
  name: string;
  value: number;
  color: string;
};

type Props = {
  title?: string;
  subtitle?: string;
  data: PaymentSlice[];
};

function PaymentMethodBreakdown({
  title = "Payment Method Breakdown",
  subtitle = "Distribution of payment methods",
  data,
}: Props) {
  const total = data.reduce((sum, item) => sum + item.value, 0);



  return (
    <div className="bg-white border border-gray-200 rounded-xl h-full flex flex-col">
      <div className="p-5 border-b border-gray-200">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>

      <div className="p-5 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={2}
              label={({ name, value }) => `${name} ${(value / total * 100).toFixed(0)}%`}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2 text-gray-700">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-medium">{item.name}</span>
              <span className="text-gray-500">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PaymentMethodBreakdown;
