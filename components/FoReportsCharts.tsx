"use client";

import ChartWatermark from "@/components/ChartWatermark";
import { BRAND_CHART_PALETTE, BRAND_PRIMARY_CHART_COLOR } from "@/libs/brand";
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
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-300 px-6 text-center text-sm text-gray-500 dark:border-line-subtle dark:text-slate-400">
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
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] dark:border-line-subtle dark:bg-panel">
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
          <div className="relative h-64">
            <ChartWatermark />
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
                    stroke={BRAND_PRIMARY_CHART_COLOR}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Payment Method Breakdown">
          <div className="relative h-64">
            <ChartWatermark />
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
                  <Bar dataKey="value" fill={BRAND_CHART_PALETTE[0]} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="Department Revenue">
          <div className="relative h-72">
            <ChartWatermark />
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
                          BRAND_CHART_PALETTE[idx % BRAND_CHART_PALETTE.length]
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
          <div className="relative h-72">
            <ChartWatermark />
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
                  <Bar dataKey="value" fill={BRAND_CHART_PALETTE[2]} radius={[6, 6, 0, 0]} />
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
