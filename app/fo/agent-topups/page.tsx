"use client";

import AgentTopupHistoryWorkspace from "@/components/AgentTopupHistoryWorkspace";
import Header from "@/components/Header";
import { ApiError } from "@/libs/api";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import { getFoAgentTopupHistory } from "@/libs/fo-auth";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const PAGE_LIMIT = 15;

export default function FoAgentTopupsPage() {
  const router = useRouter();
  const accessToken = getAccessToken();
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [page, setPage] = useState(1);

  const topupsQuery = useQuery({
    queryKey: ["fo-agent-topup-history", selectedAgentId, page],
    queryFn: () =>
      getFoAgentTopupHistory({
        agentId: selectedAgentId || undefined,
        page,
        limit: PAGE_LIMIT,
      }),
    enabled: Boolean(accessToken),
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
    }
  }, [router, topupsQuery.error]);

  return (
    <div className="min-h-screen w-full bg-canvas">
      <Header
        title="Agent Top-Up History"
        Subtitle="Review wallet funding records for agents in your hospital"
      />

      <div className="space-y-6 p-6">
        {topupsQuery.error instanceof Error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {topupsQuery.error.message}
          </div>
        ) : null}

        <AgentTopupHistoryWorkspace
          title="Hospital Agent Top-Ups"
          subtitle="Select an agent and review wallet funding records"
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
    </div>
  );
}
