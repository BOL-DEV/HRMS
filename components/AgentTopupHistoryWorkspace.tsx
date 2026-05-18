"use client";

import AdminPaginationFooter from "@/components/AdminPaginationFooter";
import StatusPill from "@/components/StatusPill";
import { formatDateTime, formatNaira } from "@/libs/helper";
import type {
  AgentTopupHistoryAgentItem,
  AgentTopupHistoryPagination,
  AgentTopupHistoryRecord,
} from "@/libs/type";

type Props = {
  title: string;
  subtitle: string;
  agents: AgentTopupHistoryAgentItem[];
  selectedAgentId: string;
  topups: AgentTopupHistoryRecord[];
  pagination: AgentTopupHistoryPagination | null;
  isLoading: boolean;
  onAgentChange: (value: string) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
};

function AgentTopupHistoryWorkspace({
  title,
  subtitle,
  agents,
  selectedAgentId,
  topups,
  pagination,
  isLoading,
  onAgentChange,
  onPreviousPage,
  onNextPage,
}: Props) {
  const selectedAgent =
    agents.find((agent) => agent.agent_id === selectedAgentId) ?? null;
  const recordCount = pagination?.total ?? topups.length;

  return (
    <div className="overflow-hidden rounded-xl border border-line-subtle bg-panel">
      <div className="flex flex-col gap-4 border-b border-line-subtle p-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
            {title}
          </h2>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            {subtitle}
          </p>
        </div>

        <div className="w-full lg:max-w-sm">
          <label
            htmlFor="agent-topup-history-select"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-200"
          >
            Agent
          </label>
          <select
            id="agent-topup-history-select"
            value={selectedAgentId}
            onChange={(event) => onAgentChange(event.target.value)}
            className="w-full rounded-xl border border-line-subtle bg-canvas-alt px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
          >
            <option value="">All agents</option>
            {agents.map((agent) => (
              <option key={agent.agent_id} value={agent.agent_id}>
                {agent.agent_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedAgent || !selectedAgentId ? (
        <div className="flex flex-col gap-3 border-b border-line-subtle bg-panel-muted/40 p-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-gray-900 dark:text-slate-100">
              {selectedAgent?.agent_name ?? "All hospital agents"}
            </p>
            <p className="truncate text-sm text-gray-600 dark:text-slate-400">
              {selectedAgent?.email ?? "Showing wallet funding activity across all agents"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {selectedAgent ? (
              <StatusPill
                status={
                  selectedAgent.status === "suspended" ? "Suspended" : "Active"
                }
              />
            ) : null}
            <p className="text-sm text-gray-600 dark:text-slate-400">
              {recordCount} top-up record
              {recordCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-panel-muted text-left text-gray-600 dark:text-slate-300">
              <th className="p-3 font-semibold">Agent Name</th>
              <th className="p-3 font-semibold">Initial Top-Up</th>
              <th className="p-3 font-semibold">Top Up Amount</th>
              <th className="p-3 font-semibold">Balance After Top Up</th>
              <th className="p-3 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <tr key={index} className="border-b border-line-subtle">
                  <td colSpan={5} className="p-3">
                    <div className="h-10 animate-pulse rounded-lg bg-panel-muted" />
                  </td>
                </tr>
              ))
            ) : agents.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-sm text-gray-500 dark:text-slate-400"
                >
                  No agents are available for this hospital yet.
                </td>
              </tr>
            ) : topups.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-sm text-gray-500 dark:text-slate-400"
                >
                  {selectedAgentId
                    ? "No top-up history was found for the selected agent."
                    : "No top-up history was found for this hospital yet."}
                </td>
              </tr>
            ) : (
              topups.map((topup) => (
                <tr key={topup.id} className="border-b border-line-subtle">
                  <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                    {topup.agent_name}
                  </td>
                  <td className="p-3 text-gray-700 dark:text-slate-300">
                    {formatNaira(topup.before_top_up_amount)}
                  </td>
                  <td className="p-3 font-semibold text-brand-700 dark:text-brand-300">
                    {formatNaira(topup.top_up_amount)}
                  </td>
                  <td className="p-3 text-gray-700 dark:text-slate-300">
                    {formatNaira(topup.balance_after_topup)}
                  </td>
                  <td className="whitespace-nowrap p-3 text-gray-700 dark:text-slate-300">
                    {formatDateTime(topup.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.total_pages > 1 ? (
        <AdminPaginationFooter
          currentPage={pagination.page}
          totalPages={pagination.total_pages}
          hasPrevious={pagination.page > 1}
          hasNext={pagination.page < pagination.total_pages}
          onPrevious={onPreviousPage}
          onNext={onNextPage}
        />
      ) : null}
    </div>
  );
}

export default AgentTopupHistoryWorkspace;
