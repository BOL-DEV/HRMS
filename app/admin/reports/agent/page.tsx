"use client";

import AdminPaginationFooter from "@/components/admin/AdminPaginationFooter";
import AdminScopedReportWorkspace from "@/components/admin/AdminScopedReportWorkspace";
import { ApiError } from "@/libs/api";
import {
  exportAdminHospitalAgentReportCsv,
  getAdminHospitalAgentReport,
  getAdminHospitalAgents,
  getAdminReportsOptions,
  printAdminHospitalAgentReport,
} from "@/libs/admin-auth";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

const REPORTS_PER_PAGE = 15;

export default function Page() {
  const router = useRouter();
  const accessToken = getAccessToken();
  const today = getTodayDate();
  const [hospitalId, setHospitalId] = useState("");
  const [agentId, setAgentId] = useState("All");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [page, setPage] = useState(1);

  const optionsQuery = useQuery({
    queryKey: ["admin-agent-report-options"],
    queryFn: getAdminReportsOptions,
    enabled: Boolean(accessToken),
  });

  const hospitals = optionsQuery.data?.data.hospitals ?? [];
  const selectedHospitalId = hospitalId || hospitals[0]?.hospital_id || "";

  const agentsQuery = useQuery({
    queryKey: ["admin-agent-report-agents", selectedHospitalId],
    queryFn: () => getAdminHospitalAgents(selectedHospitalId),
    enabled: Boolean(accessToken && selectedHospitalId),
  });

  const dateRangeIsInvalid =
    Boolean(startDate && endDate && startDate > endDate);
  const applied =
    !selectedHospitalId || dateRangeIsInvalid
      ? null
      : {
          hospitalId: selectedHospitalId,
          agentId,
          startDate,
          endDate,
          page,
        };

  const reportQuery = useQuery({
    queryKey: ["admin-agent-report", applied],
    queryFn: () => {
      const current = applied;

      if (!current?.hospitalId) {
        throw new Error("Select a hospital to view reports.");
      }

      return getAdminHospitalAgentReport(current.hospitalId, {
        agentId: current.agentId === "All" ? undefined : current.agentId,
        startDate: current.startDate,
        endDate: current.endDate,
        page: current.agentId === "All" ? undefined : current.page,
        limit: current.agentId === "All" ? undefined : REPORTS_PER_PAGE,
      });
    },
    enabled: Boolean(accessToken && applied?.hospitalId),
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
          : optionsQuery.error instanceof ApiError
            ? optionsQuery.error
            : null;

    if (!error) {
      return;
    }

    if (error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
    }
  }, [agentsQuery.error, optionsQuery.error, reportQuery.error, router]);

  const agentOptions = useMemo(
    () =>
      (agentsQuery.data?.data.agent_name_list ?? []).map((item) => ({
        id: item.agent_id,
        name: item.agent_name,
      })),
    [agentsQuery.data?.data.agent_name_list],
  );

  const pagination = reportQuery.data?.data.pagination;

  return (
    <>
      <AdminScopedReportWorkspace
        mode="agent"
        title="Agent Report"
        subtitle="Track grouped agent totals or drill into one agent inside a hospital"
        hospitalId={selectedHospitalId}
        onHospitalChange={(value) => {
          setHospitalId(value);
          setAgentId("All");
          setPage(1);
        }}
        hospitalOptions={hospitals}
        filterLabel="Agent"
        filterType="select"
        filterValue={agentId}
        onFilterChange={(value) => {
          setAgentId(value);
          setPage(1);
        }}
        filterOptions={agentOptions}
        isFilterLoading={agentsQuery.isLoading}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={(value) => {
          setStartDate(value);
          setPage(1);
        }}
        onEndDateChange={(value) => {
          setEndDate(value);
          setPage(1);
        }}
        onExport={() => {
          const current = applied;

          if (!current?.hospitalId) {
            return Promise.resolve(
              toast.error("Select a hospital to export reports."),
            );
          }

          return exportAdminHospitalAgentReportCsv(current.hospitalId, {
            agentId: current.agentId === "All" ? undefined : current.agentId,
            startDate: current.startDate,
            endDate: current.endDate,
          }).catch((error) =>
            toast.error(
              error instanceof Error ? error.message : "Unable to export report.",
            ),
          );
        }}
        onPrint={() => {
          const current = applied;

          if (!current?.hospitalId) {
            return Promise.resolve(
              toast.error("Select a hospital to print reports."),
            );
          }

          return printAdminHospitalAgentReport(current.hospitalId, {
            agentId: current.agentId === "All" ? undefined : current.agentId,
            startDate: current.startDate,
            endDate: current.endDate,
          }).catch((error) =>
            toast.error(
              error instanceof Error ? error.message : "Unable to print report.",
            ),
          );
        }}
        errorMessage={
          reportQuery.error instanceof Error
            ? reportQuery.error.message
            : agentsQuery.error instanceof Error
              ? agentsQuery.error.message
              : optionsQuery.error instanceof Error
                ? optionsQuery.error.message
                : null
        }
        isLoading={reportQuery.isLoading}
        data={reportQuery.data?.data}
      />

      {applied && applied.agentId !== "All" && pagination ? (
        <div className="-mt-6 px-6 pb-6">
          <div className="rounded-xl border border-line-subtle bg-panel">
            <AdminPaginationFooter
              currentPage={pagination.current_page}
              totalPages={pagination.total_pages}
              hasPrevious={pagination.has_previous}
              hasNext={pagination.has_next}
              onPrevious={() => setPage((current) => Math.max(current - 1, 1))}
              onNext={() =>
                setPage((current) => Math.min(current + 1, pagination.total_pages))
              }
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
