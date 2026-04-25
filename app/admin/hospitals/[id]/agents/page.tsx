"use client";

import AdminAgentTopupModal from "@/components/AdminAgentTopupModal";
import AdminHospitalAgentFormModal from "@/components/AdminHospitalAgentFormModal";
import AdminHospitalAgentsListSection from "@/components/AdminHospitalAgentsListSection";
import AdminHospitalAgentsSummaryCards from "@/components/AdminHospitalAgentsSummaryCards";
import AdminPageError from "@/components/AdminPageError";
import JsonModal from "@/components/JsonModal";
import { ApiError } from "@/libs/api";
import {
  createAdminHospitalAgent,
  getAdminHospitalAgents,
  topupAdminAgent,
  updateAdminHospitalAgent,
} from "@/libs/admin-auth";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import type {
  AdminHospitalAgentListItem,
  CreateAdminHospitalAgentPayload,
  UpdateAdminHospitalAgentPayload,
} from "@/libs/type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

export default function HospitalAgentsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = getAccessToken();
  const hospitalId = params?.id ?? "";
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAgent, setEditingAgent] =
    useState<AdminHospitalAgentListItem | null>(null);
  const [topupAgent, setTopupAgent] = useState<AdminHospitalAgentListItem | null>(
    null,
  );
  const [viewingAgent, setViewingAgent] =
    useState<AdminHospitalAgentListItem | null>(null);

  const agentsQuery = useQuery({
    queryKey: ["admin-hospital-agents", hospitalId, search],
    queryFn: () => getAdminHospitalAgents(hospitalId, { search }),
    enabled: Boolean(accessToken && hospitalId),
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
      return;
    }

    if (agentsQuery.error.status === 404) {
      router.replace("/admin/hospitals");
    }
  }, [agentsQuery.error, router]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateAdminHospitalAgentPayload) =>
      createAdminHospitalAgent(hospitalId, payload),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({
        queryKey: ["admin-hospital-agents", hospitalId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-hospital-overview", hospitalId],
      });
      setIsCreateOpen(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to create agent.",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      agentId,
      payload,
    }: {
      agentId: string;
      payload: UpdateAdminHospitalAgentPayload;
    }) => updateAdminHospitalAgent(hospitalId, agentId, payload),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({
        queryKey: ["admin-hospital-agents", hospitalId],
      });
      setEditingAgent(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to update agent.",
      );
    },
  });

  const topupMutation = useMutation({
    mutationFn: ({
      agentId,
      amount,
    }: {
      agentId: string;
      amount: number;
    }) =>
      topupAdminAgent({
        agent_id: agentId,
        hospital_id: hospitalId,
        amount,
      }),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({
        queryKey: ["admin-hospital-agents", hospitalId],
      });
      setTopupAgent(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to top up agent.",
      );
    },
  });

  const agents = useMemo(
    () => agentsQuery.data?.data.agents ?? [],
    [agentsQuery.data?.data.agents],
  );
  const totalAgents = agentsQuery.data?.data.total_agents ?? 0;

  const totalBalance = useMemo(
    () => agents.reduce((sum, agent) => sum + agent.balance, 0),
    [agents],
  );

  const totalRevenue = useMemo(
    () => agents.reduce((sum, agent) => sum + agent.total_revenue_made, 0),
    [agents],
  );

  const handleUpdate = (payload: UpdateAdminHospitalAgentPayload) => {
    if (!editingAgent) {
      return;
    }

    if (Object.keys(payload).length === 0) {
      toast("No changes to save.");
      setEditingAgent(null);
      return;
    }

    updateMutation.mutate({
      agentId: editingAgent.agent_id,
      payload,
    });
  };

  return (
    <div className="space-y-6">
      {agentsQuery.error instanceof Error ? (
        <AdminPageError message={agentsQuery.error.message} />
      ) : null}

      <AdminHospitalAgentsSummaryCards
        totalAgents={totalAgents}
        totalBalance={totalBalance}
        totalRevenue={totalRevenue}
      />

      <AdminHospitalAgentsListSection
        rows={agents}
        search={search}
        isLoading={agentsQuery.isLoading && !agentsQuery.data}
        onSearchChange={setSearch}
        onOpenCreateModal={() => setIsCreateOpen(true)}
        onEdit={setEditingAgent}
        onTopUp={setTopupAgent}
        onToggleStatus={(agent) =>
          updateMutation.mutate({
            agentId: agent.agent_id,
            payload: {
              status: agent.status === "suspended" ? "active" : "suspended",
            },
          })}
        onView={setViewingAgent}
      />

      {isCreateOpen ? (
        <AdminHospitalAgentFormModal
          isSubmitting={createMutation.isPending}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={(payload) =>
            createMutation.mutate(payload as CreateAdminHospitalAgentPayload)
          }
        />
      ) : null}

      {editingAgent ? (
        <AdminHospitalAgentFormModal
          agent={editingAgent}
          isSubmitting={updateMutation.isPending}
          onClose={() => setEditingAgent(null)}
          onSubmit={handleUpdate}
        />
      ) : null}

      {topupAgent ? (
        <AdminAgentTopupModal
          agentName={topupAgent.agent_name}
          isSubmitting={topupMutation.isPending}
          onClose={() => setTopupAgent(null)}
          onSubmit={(amount) => {
            if (!Number.isFinite(amount) || amount <= 0) {
              toast.error("Enter a valid amount greater than zero.");
              return;
            }

            topupMutation.mutate({
              agentId: topupAgent.agent_id,
              amount,
            });
          }}
        />
      ) : null}

      {viewingAgent ? (
        <JsonModal
          title={`Agent Payload: ${viewingAgent.agent_name}`}
          payload={viewingAgent}
          onClose={() => setViewingAgent(null)}
        />
      ) : null}
    </div>
  );
}
