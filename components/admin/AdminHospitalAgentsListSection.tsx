import AdminSearchField from "@/components/admin/AdminSearchField";
import StatusPill from "@/components/shared/StatusPill";
import { formatNaira } from "@/libs/helper";
import type { AdminHospitalAgentListItem } from "@/libs/type";
import { FiCreditCard, FiUserPlus } from "react-icons/fi";

function getStatusLabel(status: AdminHospitalAgentListItem["status"]) {
  return status === "suspended" ? "Suspended" : "Active";
}

type Props = {
  rows: AdminHospitalAgentListItem[];
  search: string;
  isLoading?: boolean;
  onSearchChange: (value: string) => void;
  onOpenCreateModal: () => void;
  onEdit: (agent: AdminHospitalAgentListItem) => void;
  onTopUp: (agent: AdminHospitalAgentListItem) => void;
  onToggleStatus: (agent: AdminHospitalAgentListItem) => void;
};

function AdminHospitalAgentsListSection({
  rows,
  search,
  isLoading = false,
  onSearchChange,
  onOpenCreateModal,
  onEdit,
  onTopUp,
  onToggleStatus,
}: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-line-subtle bg-panel">
      <div className="flex flex-col gap-4 border-b border-line-subtle p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
            Hospital Agents
          </h2>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Create and manage agents for this hospital
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <FiUserPlus />
          Add Agent
        </button>
      </div>

      <div className="border-b border-line-subtle p-5">
        <AdminSearchField
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search agents"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-panel-muted text-left text-gray-600 dark:text-slate-300">
              <th className="p-3 font-semibold">Name</th>
              <th className="p-3 font-semibold">Email</th>
              <th className="p-3 font-semibold">Balance</th>
              <th className="p-3 font-semibold">Total Top-Up</th>
              <th className="p-3 font-semibold">Last Wallet Top-Up</th>
              <th className="p-3 font-semibold">Revenue Made</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <tr
                    key={index}
                    className="border-b border-line-subtle"
                  >
                    <td colSpan={8} className="p-3">
                      <div className="h-10 animate-pulse rounded-lg bg-panel-muted" />
                    </td>
                  </tr>
                ))
              : rows.length === 0
                ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-8 text-center text-sm text-gray-500 dark:text-slate-400"
                      >
                        No agents found for this hospital.
                      </td>
                    </tr>
                  )
                : rows.map((agent) => (
                    <tr
                      key={agent.agent_id}
                      className="border-b border-line-subtle"
                    >
                      <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                        {agent.agent_name}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {agent.email}
                      </td>
                      <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                        {formatNaira(agent.balance)}
                      </td>
                      <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                        {formatNaira(agent.total_topup ?? 0)}
                      </td>
                      <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                        {formatNaira(agent.last_wallet_topup ?? 0)}
                      </td>
                      <td className="p-3 font-semibold text-brand-700 dark:text-brand-300">
                        {formatNaira(agent.total_revenue_made)}
                      </td>
                      <td className="p-3">
                        <StatusPill status={getStatusLabel(agent.status)} />
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onEdit(agent)}
                            className="rounded-lg border border-line-subtle px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-panel-muted dark:text-slate-200"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onTopUp(agent)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50 dark:border-brand-500/30 dark:text-brand-300 dark:hover:bg-brand-500/10"
                          >
                            <FiCreditCard />
                            Top Up
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleStatus(agent)}
                            className="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50 dark:border-brand-500/40 dark:text-brand-300 dark:hover:bg-brand-500/10"
                          >
                            {agent.status === "suspended"
                              ? "Reactivate"
                              : "Suspend"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminHospitalAgentsListSection;
