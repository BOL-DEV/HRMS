import React from "react";
import StatusPill from "@/components/StatusPill";
import { FiMoreVertical } from "react-icons/fi";

export type AgentPerformanceRow = {
  id: string;
  name: string;
  totalTransactions: number;
  totalRevenue: number;
  pending: number;
  refunds: number;
  lastActive: string;
  status: "Active" | "Inactive";
};

type Props = {
  rows: AgentPerformanceRow[];
};

const usd = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);

function AgentPerformance({ rows }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="p-5 border-b border-gray-200">
        <h2 className="text-xl font-bold">Agent Performance</h2>
        <p className="text-sm text-gray-600">Current month statistics</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 bg-gray-100">
              <th className="p-3 font-semibold">Agent Name</th>
              <th className="p-3 font-semibold">Total Transactions</th>
              <th className="p-3 font-semibold">Total Revenue</th>
              <th className="p-3 font-semibold">Pending</th>
              <th className="p-3 font-semibold">Refunds</th>
              <th className="p-3 font-semibold">Last Active</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-100">
                <td className="p-3 font-semibold text-gray-900">{row.name}</td>
                <td className="p-3 text-gray-700">{row.totalTransactions}</td>
                <td className="p-3 font-semibold text-gray-900">{usd(row.totalRevenue)}</td>
                <td className="p-3 text-gray-700">{row.pending}</td>
                <td className="p-3 text-gray-700">{row.refunds}</td>
                <td className="p-3 text-gray-700 whitespace-nowrap">{row.lastActive}</td>
                <td className="p-3">
                  <StatusPill status={row.status} />
                </td>
                <td className="p-3 text-right">
                  <button className="p-2 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200">
                    <FiMoreVertical className="text-gray-700" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AgentPerformance;
