"use client";

import { formatNaira } from "@/libs/helper";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

type SeriesDatum = {
  name: string;
  value: number;
};

type TrendDatum = {
  label: string;
  value: number;
};

type Props = {
  revenueTrendData: TrendDatum[];
  paymentMethodSummary: SeriesDatum[];
  departmentRevenue: SeriesDatum[];
  topAgents: SeriesDatum[];
};

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-300 px-6 text-center text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
      {message}
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <h2 className="mb-2 text-lg font-bold dark:text-slate-100">{title}</h2>
      {children}
    </div>
  );
}

function FoReportsCharts({
  revenueTrendData,
  paymentMethodSummary,
  departmentRevenue,
  topAgents,
}: Props) {
  return (
    <>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="Revenue Trend">
          <div className="h-64">
            {revenueTrendData.length === 0 ? (
              <EmptyState message="No report trend data available for the current filters." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={revenueTrendData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    strokeOpacity={0.15}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "currentColor" }}
                    axisLine={{ stroke: "currentColor" }}
                    tickLine={{ stroke: "currentColor" }}
                  />
                  <YAxis
                    tickFormatter={(v) => formatNaira(Number(v))}
                    width={90}
                    tick={{ fill: "currentColor" }}
                    axisLine={{ stroke: "currentColor" }}
                    tickLine={{ stroke: "currentColor" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#2563EB"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Payment Method Breakdown">
          <div className="h-64">
            {paymentMethodSummary.length === 0 ? (
              <EmptyState message="No payment method data available for the current filters." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={paymentMethodSummary}
                  margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
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
                    tickFormatter={(v) => formatNaira(Number(v))}
                    width={90}
                    tick={{ fill: "currentColor" }}
                    axisLine={{ stroke: "currentColor" }}
                    tickLine={{ stroke: "currentColor" }}
                  />
                  <Bar dataKey="value" fill="#22C55E" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="Department Revenue">
          <div className="h-72">
            {departmentRevenue.length === 0 ? (
              <EmptyState message="No department revenue data available for the current filters." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentRevenue}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={2}
                  >
                    {departmentRevenue.map((entry, idx) => (
                      <Cell
                        key={entry.name}
                        fill={
                          ["#F59E0B", "#22C55E", "#6366F1", "#F97316", "#3B82F6"][
                            idx % 5
                          ]
                        }
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Top Agents by Revenue">
          <div className="h-72">
            {topAgents.length === 0 ? (
              <EmptyState message="No agent revenue data available for the current filters." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topAgents}
                  margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    strokeOpacity={0.15}
                  />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    angle={-10}
                    textAnchor="end"
                    height={50}
                    tick={{ fill: "currentColor" }}
                    axisLine={{ stroke: "currentColor" }}
                    tickLine={{ stroke: "currentColor" }}
                  />
                  <YAxis
                    tickFormatter={(v) => formatNaira(Number(v))}
                    width={90}
                    tick={{ fill: "currentColor" }}
                    axisLine={{ stroke: "currentColor" }}
                    tickLine={{ stroke: "currentColor" }}
                  />
                  <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>
    </>
  );
}

export default FoReportsCharts;
