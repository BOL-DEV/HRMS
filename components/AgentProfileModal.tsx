"use client";

import StatusPill from "@/components/StatusPill";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

export type AgentProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "Active" | "Inactive" | "Suspended";
  transactions: number;
  revenue: number;
  pending: number;
  refunds: number;
  lastActive: string;
  topPatients?: { name: string; revenue: number }[];
  revenueTrend?: { month: string; amount: number }[];
};

const usd = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);

function AgentProfileModal({
  agent,
  onClose,
}: {
  agent: AgentProfile;
  onClose: () => void;
}) {
  const trend = agent.revenueTrend ?? [];
  const patients = agent.topPatients ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40">
      <div className="h-full w-full max-w-4xl overflow-y-auto bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-gray-200 p-5 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold dark:text-slate-100">
              Agent Profile
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Agent performance, revenue, and patients
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-lg text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="space-y-6 p-5">
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 p-4 dark:border-slate-700 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-slate-400">Name</p>
              <p className="text-base font-semibold text-gray-900 dark:text-slate-100">
                {agent.name}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-slate-400">Email</p>
              <p className="text-base font-semibold text-gray-900 dark:text-slate-100">
                {agent.email}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-slate-400">Phone</p>
              <p className="text-base font-semibold text-gray-900 dark:text-slate-100">
                {agent.phone}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Status
              </p>
              <StatusPill status={agent.status} />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Last Active
              </p>
              <p className="text-base font-semibold text-gray-900 dark:text-slate-100">
                {agent.lastActive}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { label: "Total Revenue", value: usd(agent.revenue) },
              { label: "Transactions", value: agent.transactions },
              { label: "Pending", value: agent.pending },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-gray-200 p-4 dark:border-slate-700"
              >
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  {card.label}
                </p>
                <p className="mt-1 text-2xl font-bold dark:text-slate-100">
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          {trend.length ? (
            <div className="rounded-xl border border-gray-200 p-4 dark:border-slate-700">
              <h3 className="text-lg font-semibold dark:text-slate-100">
                Monthly Revenue Trend
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trend}
                    margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
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
                      tickFormatter={(v) => usd(Number(v)).replace("$", "")}
                      width={60}
                      tick={{ fill: "currentColor" }}
                      axisLine={{ stroke: "currentColor" }}
                      tickLine={{ stroke: "currentColor" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#2563EB"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}

          {patients.length ? (
            <div className="rounded-xl border border-gray-200 p-4 dark:border-slate-700">
              <h3 className="mb-3 text-lg font-semibold dark:text-slate-100">
                Top Patients
              </h3>
              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {patients.map((patient) => (
                  <div
                    key={patient.name}
                    className="flex items-center justify-between py-3"
                  >
                    <p className="font-medium text-gray-900 dark:text-slate-100">
                      {patient.name}
                    </p>
                    <p className="font-semibold text-blue-700 dark:text-blue-300">
                      {usd(patient.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default AgentProfileModal;
