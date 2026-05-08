"use client";

import AdminPaginationFooter from "@/components/AdminPaginationFooter";
import AdminScopedReportWorkspace from "@/components/AdminScopedReportWorkspace";
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
  const [applied, setApplied] = useState({
    hospitalId: "",
    agentId: "All",
    startDate: today,
    endDate: today,
    page: 1,
  });

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

  const reportQuery = useQuery({
    queryKey: ["admin-agent-report", applied],
    queryFn: () =>
      getAdminHospitalAgentReport(applied.hospitalId, {
        agentId: applied.agentId === "All" ? undefined : applied.agentId,
        startDate: applied.startDate,
        endDate: applied.endDate,
        page: applied.agentId === "All" ? undefined : applied.page,
        limit: applied.agentId === "All" ? undefined : REPORTS_PER_PAGE,
      }),
    enabled: Boolean(accessToken && applied.hospitalId),
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
  const dateRangeIsInvalid =
    Boolean(startDate && endDate && startDate > endDate);

  useEffect(() => {
    if (!selectedHospitalId || dateRangeIsInvalid) {
      return;
    }

    setApplied((current) => {
      const next = {
        hospitalId: selectedHospitalId,
        agentId,
        startDate,
        endDate,
        page: 1,
      };

      return current.hospitalId === next.hospitalId &&
        current.agentId === next.agentId &&
        current.startDate === next.startDate &&
        current.endDate === next.endDate &&
        current.page === next.page
        ? current
        : next;
    });
  }, [agentId, dateRangeIsInvalid, endDate, selectedHospitalId, startDate]);

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
          setApplied((current) => ({
            ...current,
            hospitalId: "",
            page: 1,
          }));
        }}
        hospitalOptions={hospitals}
        filterLabel="Agent"
        filterType="select"
        filterValue={agentId}
        onFilterChange={setAgentId}
        filterOptions={agentOptions}
        isFilterLoading={agentsQuery.isLoading}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onExport={() =>
          !applied.hospitalId
            ? Promise.resolve(toast.error("Select a hospital to export reports."))
            : exportAdminHospitalAgentReportCsv(applied.hospitalId, {
                agentId: applied.agentId === "All" ? undefined : applied.agentId,
                startDate: applied.startDate,
                endDate: applied.endDate,
              }).catch((error) =>
                toast.error(
                  error instanceof Error ? error.message : "Unable to export report.",
                ),
              )
        }
        onPrint={() =>
          !applied.hospitalId
            ? Promise.resolve(toast.error("Select a hospital to print reports."))
            : printAdminHospitalAgentReport(applied.hospitalId, {
                agentId: applied.agentId === "All" ? undefined : applied.agentId,
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
              : optionsQuery.error instanceof Error
                ? optionsQuery.error.message
                : null
        }
        isLoading={reportQuery.isLoading}
        data={reportQuery.data?.data}
      />

      {applied.agentId !== "All" && pagination ? (
        <div className="-mt-6 px-6 pb-6">
          <div className="rounded-xl border border-line-subtle bg-panel">
            <AdminPaginationFooter
              currentPage={pagination.current_page}
              totalPages={pagination.total_pages}
              hasPrevious={pagination.has_previous}
              hasNext={pagination.has_next}
              onPrevious={() =>
                setApplied((current) => ({
                  ...current,
                  page: Math.max(current.page - 1, 1),
                }))
              }
              onNext={() =>
                setApplied((current) => ({
                  ...current,
                  page: Math.min(current.page + 1, pagination.total_pages),
                }))
              }
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
