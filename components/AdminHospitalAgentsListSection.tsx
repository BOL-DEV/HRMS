import AdminSearchField from "@/components/AdminSearchField";
import StatusPill from "@/components/StatusPill";
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
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-col gap-4 border-b border-gray-200 p-5 dark:border-slate-700 md:flex-row md:items-center md:justify-between">
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
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <FiUserPlus />
          Add Agent
        </button>
      </div>

      <div className="border-b border-gray-200 p-5 dark:border-slate-700">
        <AdminSearchField
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search agents"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left text-gray-600 dark:bg-slate-800 dark:text-slate-300">
              <th className="p-3 font-semibold">Name</th>
              <th className="p-3 font-semibold">Email</th>
              <th className="p-3 font-semibold">Balance</th>
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
                    className="border-b border-gray-100 dark:border-slate-800"
                  >
                    <td colSpan={6} className="p-3">
                      <div className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800" />
                    </td>
                  </tr>
                ))
              : rows.length === 0
                ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-sm text-gray-500 dark:text-slate-400"
                      >
                        No agents found for this hospital.
                      </td>
                    </tr>
                  )
                : rows.map((agent) => (
                    <tr
                      key={agent.agent_id}
                      className="border-b border-gray-100 dark:border-slate-800"
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
                      <td className="p-3 font-semibold text-blue-700 dark:text-sky-300">
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
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onTopUp(agent)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                          >
                            <FiCreditCard />
                            Top Up
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleStatus(agent)}
                            className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 dark:border-sky-500/40 dark:text-sky-300 dark:hover:bg-sky-500/10"
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
