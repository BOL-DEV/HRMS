import StatusPill from "@/components/StatusPill";
import { FiMoreVertical } from "react-icons/fi";
import { formatUsd as usd } from "@/libs/helper";
import { AgentPerformanceRow } from "@/libs/type";

type Props = {
  rows: AgentPerformanceRow[];
  subtitle?: string;
  emptyMessage?: string;
};

function AgentPerformance({
  rows,
  subtitle = "Current month statistics",
  emptyMessage = "Agent performance data is not available from the current FO dashboard endpoint.",
}: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden dark:border-slate-700 dark:bg-slate-900">
      <div className="p-5 border-b border-gray-200 dark:border-slate-700">
        <h2 className="text-xl font-bold">Agent Performance</h2>
        <p className="text-sm text-gray-600 dark:text-slate-400">{subtitle}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 bg-gray-100 dark:bg-slate-800 dark:text-slate-300">
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
            {rows.length === 0 ? (
              <tr>
                <td
                  className="p-4 text-gray-500 dark:text-slate-400"
                  colSpan={8}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-100 dark:border-slate-800"
                >
                  <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                    {row.name}
                  </td>
                  <td className="p-3 text-gray-700 dark:text-slate-300">
                    {row.totalTransactions}
                  </td>
                  <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                    {usd(row.totalRevenue)}
                  </td>
                  <td className="p-3 text-gray-700 dark:text-slate-300">
                    {row.pending}
                  </td>
                  <td className="p-3 text-gray-700 dark:text-slate-300">
                    {row.refunds}
                  </td>
                  <td className="p-3 text-gray-700 dark:text-slate-300 whitespace-nowrap">
                    {row.lastActive}
                  </td>
                  <td className="p-3">
                    <StatusPill status={row.status} />
                  </td>
                  <td className="p-3 text-right">
                    <button className="rounded-lg border border-transparent p-2 hover:border-gray-200 hover:bg-gray-100 dark:hover:border-slate-700 dark:hover:bg-slate-800">
                      <FiMoreVertical className="text-gray-700 dark:text-slate-200" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AgentPerformance;
