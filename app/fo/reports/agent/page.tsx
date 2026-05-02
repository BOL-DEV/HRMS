"use client";

import FoScopedReportWorkspace from "@/components/FoScopedReportWorkspace";
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
  const [applied, setApplied] = useState({
    agent: "All",
    startDate: today,
    endDate: today,
  });

  const dateRangeIsInvalid =
    Boolean(startDate || endDate) &&
    (!startDate || !endDate || startDate > endDate);

  const agentsQuery = useQuery({
    queryKey: ["fo-report-agents"],
    queryFn: () => getFoAgents(),
    enabled: Boolean(accessToken),
  });

  const reportQuery = useQuery({
    queryKey: ["fo-agent-report", applied],
    queryFn: () =>
      getFoAgentReport({
        agentId: applied.agent === "All" ? undefined : applied.agent,
        startDate: applied.startDate,
        endDate: applied.endDate,
      }),
    enabled: Boolean(accessToken),
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

  useEffect(() => {
    if (dateRangeIsInvalid) {
      return;
    }

    setApplied((current) => {
      const next = { agent, startDate, endDate };
      const isSame =
        current.agent === next.agent &&
        current.startDate === next.startDate &&
        current.endDate === next.endDate;
      return isSame ? current : next;
    });
  }, [agent, dateRangeIsInvalid, endDate, startDate]);

  const options = useMemo(
    () =>
      (agentsQuery.data?.data.agents ?? []).map((item) => ({
        id: item.agent_id,
        name: item.agent_name,
      })),
    [agentsQuery.data?.data.agents],
  );

  return (
    <FoScopedReportWorkspace
      mode="agent"
      title="Agent Report"
      subtitle="Track revenue and transaction activity for one agent or all agents"
      filterLabel="Agent"
      filterType="select"
      filterValue={agent}
      onFilterChange={setAgent}
      filterOptions={options}
      isFilterLoading={agentsQuery.isLoading}
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      onGenerate={() => {}}
      onViewAllReports={() => {
        setStartDate("");
        setEndDate("");
        setApplied({
          agent,
          startDate: "",
          endDate: "",
        });
      }}
      onExport={() =>
        exportFoAgentReportCsv({
          agentId: applied.agent === "All" ? undefined : applied.agent,
          startDate: applied.startDate,
          endDate: applied.endDate,
        }).catch((error) =>
          toast.error(
            error instanceof Error ? error.message : "Unable to export report.",
          ),
        )
      }
      onPrint={() =>
        printFoAgentReport({
          agentId: applied.agent === "All" ? undefined : applied.agent,
          startDate: applied.startDate,
          endDate: applied.endDate,
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
      isLoading={reportQuery.isLoading}
      data={reportQuery.data?.data}
    />
  );
}

export default Page;
