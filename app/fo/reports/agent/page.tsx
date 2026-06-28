"use client";

import FoScopedReportWorkspace from "@/components/fo/FoScopedReportWorkspace";
import { ApiError } from "@/libs/api";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import {
  exportFoAgentReportCsv,
  getFoAgentReport,
  getFoAgents,
  printFoAgentReport,
} from "@/libs/fo-auth";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

const REPORTS_PER_PAGE = 15;

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function Page() {
  const router = useRouter();
  const accessToken = getAccessToken();
  const today = getTodayDate();
  const [agent, setAgent] = useState("All");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [page, setPage] = useState(1);

  const dateRangeIsInvalid = Boolean(
    startDate && endDate && startDate > endDate,
  );

  const agentsQuery = useQuery({
    queryKey: ["fo-report-agents"],
    queryFn: () => getFoAgents(),
    enabled: Boolean(accessToken),
  });

  const reportQuery = useQuery({
    queryKey: ["fo-agent-report", agent, startDate, endDate, page],
    queryFn: () =>
      getFoAgentReport({
        agentId: agent === "All" ? undefined : agent,
        startDate,
        endDate,
        page: agent === "All" ? undefined : page,
        limit: agent === "All" ? undefined : REPORTS_PER_PAGE,
      }),
    enabled: Boolean(accessToken) && !dateRangeIsInvalid,
  });

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    const error =
      reportQuery.error instanceof ApiError
        ? reportQuery.error
        : agentsQuery.error instanceof ApiError
          ? agentsQuery.error
          : null;

    if (!error) {
      return;
    }

    if (error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
    }
  }, [agentsQuery.error, reportQuery.error, router]);

  const options = useMemo(
    () =>
      (agentsQuery.data?.data.agents ?? []).map((item) => ({
        id: item.agent_id,
        name: item.agent_name,
      })),
    [agentsQuery.data?.data.agents],
  );

  const pagination =
    agent === "All" ? null : reportQuery.data?.data.pagination ?? null;

  const handleAgentChange = (value: string) => {
    setAgent(value);
    setPage(1);
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    setPage(1);
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    setPage(1);
  };

  return (
    <FoScopedReportWorkspace
      mode="agent"
      title="Agent Report"
      subtitle="Track revenue and transaction activity for one agent or all agents"
      filterLabel="Agent"
      filterType="select"
      filterValue={agent}
      onFilterChange={handleAgentChange}
      filterOptions={options}
      isFilterLoading={agentsQuery.isLoading}
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={handleStartDateChange}
      onEndDateChange={handleEndDateChange}
      onExport={() =>
        exportFoAgentReportCsv({
          agentId: agent === "All" ? undefined : agent,
          startDate,
          endDate,
          page: agent === "All" ? undefined : page,
          limit: agent === "All" ? undefined : REPORTS_PER_PAGE,
        }).catch((error) =>
          toast.error(
            error instanceof Error ? error.message : "Unable to export report.",
          ),
        )
      }
      onPrint={() =>
        printFoAgentReport({
          agentId: agent === "All" ? undefined : agent,
          startDate,
          endDate,
          page: agent === "All" ? undefined : page,
          limit: agent === "All" ? undefined : REPORTS_PER_PAGE,
        }).catch((error) =>
          toast.error(
            error instanceof Error ? error.message : "Unable to print report.",
          ),
        )
      }
      errorMessage={
        reportQuery.error instanceof Error
          ? reportQuery.error.message
          : agentsQuery.error instanceof Error
            ? agentsQuery.error.message
            : null
      }
      dateRangeErrorMessage={
        dateRangeIsInvalid ? "Start date cannot be after the end date." : null
      }
      isLoading={reportQuery.isLoading}
      data={reportQuery.data?.data}
      pagination={pagination}
      onPreviousPage={() => setPage((current) => Math.max(current - 1, 1))}
      onNextPage={() =>
        setPage((current) =>
          Math.min(
            current + 1,
            reportQuery.data?.data.pagination?.total_pages ?? current,
          ),
        )
      }
    />
  );
}

export default Page;
