"use client";

import AgentTopupHistoryWorkspace from "@/components/AgentTopupHistoryWorkspace";
import AdminPageError from "@/components/AdminPageError";
import { ApiError } from "@/libs/api";
import { getAdminHospitalAgentTopupHistory } from "@/libs/admin-auth";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const PAGE_LIMIT = 15;

export default function HospitalAgentTopupsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const accessToken = getAccessToken();
  const hospitalId = params?.id ?? "";
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [page, setPage] = useState(1);

  const topupsQuery = useQuery({
    queryKey: [
      "admin-hospital-agent-topup-history",
      hospitalId,
      selectedAgentId,
      page,
    ],
    queryFn: () =>
      getAdminHospitalAgentTopupHistory(hospitalId, {
        agentId: selectedAgentId || undefined,
        page,
        limit: PAGE_LIMIT,
      }),
    enabled: Boolean(accessToken && hospitalId),
  });

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    if (!(topupsQuery.error instanceof ApiError)) {
      return;
    }

    if (topupsQuery.error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
      return;
    }

    if (topupsQuery.error.status === 404) {
      router.replace("/admin/hospitals");
    }
  }, [router, topupsQuery.error]);

  return (
    <div className="space-y-6">
      {topupsQuery.error instanceof Error ? (
        <AdminPageError message={topupsQuery.error.message} />
      ) : null}

      <AgentTopupHistoryWorkspace
        title="Agent Top-Up History"
        subtitle="Select an agent and review wallet funding records for this hospital"
        agents={topupsQuery.data?.data.agents ?? []}
        selectedAgentId={
          topupsQuery.data?.data.selected_agent_id ?? selectedAgentId
        }
        topups={topupsQuery.data?.data.topups ?? []}
        pagination={topupsQuery.data?.data.pagination ?? null}
        isLoading={topupsQuery.isLoading}
        onAgentChange={(value) => {
          setSelectedAgentId(value);
          setPage(1);
        }}
        onPreviousPage={() => setPage((current) => Math.max(current - 1, 1))}
        onNextPage={() => setPage((current) => current + 1)}
      />
    </div>
  );
}
