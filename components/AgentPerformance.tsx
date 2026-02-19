import React from "react";
import StatusPill from "@/components/StatusPill";
import { FiMoreVertical } from "react-icons/fi";
import { formatUsd as usd } from "@/libs/helper";
import { AgentPerformanceRow } from "@/libs/helper";

type Props = {
  rows?: AgentPerformanceRow[];
};

const agentPerformance: AgentPerformanceRow[] = [
  {
    id: "a1",
    name: "Agent James",
    totalTransactions: 156,
    totalRevenue: 28450,
    pending: 8,
    refunds: 2,
    lastActive: "2024-02-15 02:30 PM",
    status: "Active",
  },
  {
    id: "a2",
    name: "Agent Lisa",
    totalTransactions: 142,
    totalRevenue: 25800,
    pending: 5,
    refunds: 1,
    lastActive: "2024-02-15 01:15 PM",
    status: "Active",
  },
  {
    id: "a3",
    name: "Agent Marcus",
    totalTransactions: 138,
    totalRevenue: 24600,
    pending: 12,
    refunds: 3,
    lastActive: "2024-02-14 11:20 AM",
    status: "Active",
  },
  {
    id: "a4",
    name: "Agent Patricia",
    totalTransactions: 125,
    totalRevenue: 22350,
    pending: 3,
    refunds: 0,
    lastActive: "2024-02-15 03:45 PM",
    status: "Active",
  },
  {
    id: "a5",
    name: "Agent David",
    totalTransactions: 98,
    totalRevenue: 17800,
    pending: 6,
    refunds: 2,
    lastActive: "2024-02-13 09:30 AM",
    status: "Inactive",
  },
];

function AgentPerformance({ rows = agentPerformance }: Props) {
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
                <td className="p-3 font-semibold text-gray-900">
                  {usd(row.totalRevenue)}
                </td>
                <td className="p-3 text-gray-700">{row.pending}</td>
                <td className="p-3 text-gray-700">{row.refunds}</td>
                <td className="p-3 text-gray-700 whitespace-nowrap">
                  {row.lastActive}
                </td>
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
