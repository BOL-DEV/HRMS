"use client";

import Header from "@/components/Header";
import AgentsTable from "@/components/AgentsTable";
import AgentProfileModal, {
  AgentProfile,
} from "@/components/AgentProfileModal";
import CreateAgentModal from "@/components/CreateAgentModal";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AgentStatsCards from "@/components/AgentStatsCards";
import FoAgentAct from "@/components/FoAgentAct";
import { toast } from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/libs/api";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import {
  createFoAgent,
  getFoAgents,
  updateFoAgentStatus,
} from "@/libs/fo-auth";
import {
  AgentRow,
  CreateFoAgentPayload,
  FoAgentStatus,
  SortOption,
} from "@/libs/type";
import { FiUserPlus } from "react-icons/fi";

function Page() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = getAccessToken();
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<FoAgentStatus | "all">("all");
  const [sort, setSort] = useState<SortOption>("newest");

  const agentsQuery = useQuery({
    queryKey: ["fo-agents", search, status],
    queryFn: () => getFoAgents({ search, status }),
    enabled: Boolean(accessToken),
  });

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    if (!(agentsQuery.error instanceof ApiError)) {
      return;
    }

    if (agentsQuery.error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
    }
  }, [agentsQuery.error, router]);

  const rows = useMemo<AgentRow[]>(() => {
    const agents = agentsQuery.data?.data.agents ?? [];

    const mapped = agents.map((agent) => ({
      id: agent.agent_id,
      name: agent.agent_name,
      email: agent.email,
      phone: agent.phone_number,
      transactions: agent.transaction_count,
      revenue: agent.revenue_made,
      pending: 0,
      refunds: 0,
      lastActive: agent.last_active,
      status: agent.status === "suspended" ? "Suspended" : "Active",
    }));

    return [...mapped].sort((a, b) => {
      if (sort === "revenue") return b.revenue - a.revenue;
      const dateA = new Date(a.lastActive).getTime();
      const dateB = new Date(b.lastActive).getTime();
      return sort === "newest" ? dateB - dateA : dateA - dateB;
    });
  }, [agentsQuery.data?.data.agents, sort]);

  const statusMutation = useMutation({
    mutationFn: (agent: AgentRow) =>
      updateFoAgentStatus(
        agent.id,
        agent.status === "Suspended" ? "active" : "suspended",
      ),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["fo-agents"] });
      setSelectedAgent((current) =>
        current?.id === response.data.agent_id
          ? {
              ...current,
              status:
                response.data.status === "suspended" ? "Suspended" : "Active",
            }
          : current,
      );
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Unable to update agent status.";
      toast.error(message);
    },
  });

  const createAgentMutation = useMutation({
    mutationFn: (payload: CreateFoAgentPayload) => createFoAgent(payload),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["fo-agents"] });
      setIsCreateModalOpen(false);
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Unable to create agent.";
      toast.error(message);
    },
  });

  const summary = agentsQuery.data?.data.summary;

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-slate-950">
      <Header
        title="Agents"
        Subtitle="Manage agents and monitor performance"
      />

      <div className="p-6 space-y-6">
        {agentsQuery.error instanceof Error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {agentsQuery.error.message}
          </div>
        ) : null}

        <AgentStatsCards
          summary={summary}
          isLoading={agentsQuery.isLoading && !summary}
        />

        <FoAgentAct
          search={search}
          sort={sort}
          status={status}
          onStatus={setStatus}
          onSearch={setSearch}
          onSort={setSort}
        />

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold dark:text-slate-100">Agents</h2>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                {rows.length} agents found
              </p>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <FiUserPlus className="text-lg" /> Create Agent
            </button>
          </div>

          <AgentsTable
            rows={rows}
            onViewProfile={(agent) => setSelectedAgent(agent)}
            onRequestSuspension={(agent) =>
              statusMutation.mutate(agent)
            }
          />
        </div>
      </div>

      {isCreateModalOpen ? (
        <CreateAgentModal
          isSubmitting={createAgentMutation.isPending}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={(payload) => createAgentMutation.mutate(payload)}
        />
      ) : null}

      {selectedAgent ? (
        <AgentProfileModal
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
        />
      ) : null}
    </div>
  );
}

export default Page;
