"use client";

import StatusPill from "@/components/StatusPill";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
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

function AgentProfileModal({ agent, onClose }: { agent: AgentProfile; onClose: () => void }) {
  const trend = agent.revenueTrend ?? [];
  const patients = agent.topPatients ?? [];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-end">
      <div className="bg-white w-full max-w-4xl h-full overflow-y-auto shadow-2xl">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Agent Profile</h2>
            <p className="text-sm text-gray-600">Agent performance, revenue, and patients</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 text-lg"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-gray-200 rounded-xl p-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Name</p>
              <p className="text-base font-semibold text-gray-900">{agent.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-base font-semibold text-gray-900">{agent.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Phone</p>
              <p className="text-base font-semibold text-gray-900">{agent.phone}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Status</p>
              <StatusPill status={agent.status} />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Last Active</p>
              <p className="text-base font-semibold text-gray-900">{agent.lastActive}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[{ label: "Total Revenue", value: usd(agent.revenue) }, { label: "Transactions", value: agent.transactions }, { label: "Pending", value: agent.pending }].map((card) => (
              <div key={card.label} className="border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-600">{card.label}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
            ))}
          </div>

          {trend.length ? (
            <div className="border border-gray-200 rounded-xl p-4">
              <h3 className="text-lg font-semibold">Monthly Revenue Trend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => usd(Number(v)).replace("$", "")} width={60} />
                    <Line type="monotone" dataKey="amount" stroke="#111827" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}

          {patients.length ? (
            <div className="border border-gray-200 rounded-xl p-4">
              <h3 className="text-lg font-semibold mb-3">Top Patients</h3>
              <div className="divide-y divide-gray-100">
                {patients.map((p) => (
                  <div key={p.name} className="py-3 flex items-center justify-between">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <p className="font-semibold text-blue-700">{usd(p.revenue)}</p>
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
