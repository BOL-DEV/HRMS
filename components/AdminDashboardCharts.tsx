"use client";

import { formatNaira } from "@/libs/helper";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type RevenuePoint = {
  month: string;
  revenue: number;
};

type PaymentMethodPoint = {
  name: string;
  transactions: number;
};

type HospitalRevenuePoint = {
  name: string;
  revenue: number;
};

type Props = {
  monthlyRevenue: RevenuePoint[];
  paymentMethods: PaymentMethodPoint[];
  hospitalsByRevenue: HospitalRevenuePoint[];
};

function AdminDashboardCharts({
  monthlyRevenue,
  paymentMethods,
  hospitalsByRevenue,
}: Props) {
  return (
    <>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-gray-200 p-5 dark:border-slate-700">
            <h2 className="text-xl font-bold">Revenue Trend</h2>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Monthly revenue across platform
            </p>
          </div>

          <div className="h-80 w-full p-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyRevenue}
                margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  strokeOpacity={0.15}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "currentColor" }}
                  axisLine={{ stroke: "currentColor" }}
                  tickLine={{ stroke: "currentColor" }}
                />
                <YAxis
                  tickFormatter={(value) => value.toString()}
                  tick={{ fill: "currentColor" }}
                  axisLine={{ stroke: "currentColor" }}
                  tickLine={{ stroke: "currentColor" }}
                />
                <Tooltip
                  formatter={(value) => [formatNaira(Number(value)), "revenue"]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="revenue"
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-gray-200 p-5 dark:border-slate-700">
            <h2 className="text-xl font-bold">
              Transactions by Payment Method
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Distribution of payment methods
            </p>
          </div>

          <div className="h-80 w-full p-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={paymentMethods}
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
                  tickFormatter={(value) => value.toString()}
                  tick={{ fill: "currentColor" }}
                  axisLine={{ stroke: "currentColor" }}
                  tickLine={{ stroke: "currentColor" }}
                />
                <Tooltip
                  formatter={(value) => [
                    new Intl.NumberFormat("en-NG").format(Number(value)),
                    "transactions",
                  ]}
                />
                <Legend />
                <Bar
                  dataKey="transactions"
                  name="transactions"
                  fill="#2563EB"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-gray-200 p-5 dark:border-slate-700">
          <h2 className="text-xl font-bold">Top Hospitals by Revenue</h2>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Hospitals ranked by revenue generated
          </p>
        </div>

        <div className="h-80 w-full p-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[...hospitalsByRevenue].reverse()}
              layout="vertical"
              margin={{ top: 10, right: 20, left: 30, bottom: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                strokeOpacity={0.15}
              />
              <XAxis
                type="number"
                tickFormatter={(value) => value.toString()}
                tick={{ fill: "currentColor" }}
                axisLine={{ stroke: "currentColor" }}
                tickLine={{ stroke: "currentColor" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={150}
                tick={{ fill: "currentColor" }}
                axisLine={{ stroke: "currentColor" }}
                tickLine={{ stroke: "currentColor" }}
              />
              <Tooltip
                formatter={(value) => [formatNaira(Number(value)), "revenue"]}
              />
              <Bar
                dataKey="revenue"
                fill="#2563EB"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

export default AdminDashboardCharts;
