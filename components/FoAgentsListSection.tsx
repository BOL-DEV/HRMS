import AgentsTable from "@/components/AgentsTable";
import type { AgentProfile } from "@/components/AgentProfileModal";
import type { AgentRow } from "@/libs/type";
import { FiUserPlus } from "react-icons/fi";

type Props = {
  rows: AgentRow[];
  onOpenCreateModal: () => void;
  onViewProfile: (agent: AgentProfile) => void;
  onToggleStatus: (agent: AgentRow) => void;
};

function FoAgentsListSection({
  rows,
  onOpenCreateModal,
  onViewProfile,
  onToggleStatus,
}: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold dark:text-slate-100">Agents</h2>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            {rows.length} agents found
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <FiUserPlus className="text-lg" /> Create Agent
        </button>
      </div>

      <AgentsTable
        rows={rows}
        onViewProfile={onViewProfile}
        onRequestSuspension={onToggleStatus}
      />
    </div>
  );
}

export default FoAgentsListSection;
