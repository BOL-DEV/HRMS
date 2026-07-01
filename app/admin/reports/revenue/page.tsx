"use client";

import AdminPaginationFooter from "@/components/admin/AdminPaginationFooter";
import FoReportsRevenueBreakdownTable from "@/components/fo/FoReportsRevenueBreakdownTable";
import FoReportsSummaryCards from "@/components/fo/FoReportsSummaryCards";
import FoReportsTransactionsTable from "@/components/fo/FoReportsTransactionsTable";
import Header from "@/components/shared/Header";
import { ApiError } from "@/libs/api";
import {
  exportAdminHospitalRevenueReportCsv,
  getAdminHospitalAgents,
  getAdminHospitalDepartments,
  getAdminHospitalIncomeHeads,
  getAdminHospitalRevenueReport,
  getAdminReportsOptions,
  printAdminHospitalRevenueReport,
} from "@/libs/admin-auth";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import type {
  AdminReportPaymentType,
  AdminReportTransactionItem,
} from "@/libs/type";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { FiDownload, FiPrinter } from "react-icons/fi";

const REPORTS_PER_PAGE = 15;

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function toMethodLabel(value: AdminReportPaymentType) {
  if (value === "cash") return "Cash" as const;
  if (value === "transfer") return "Transfer" as const;
  return "POS" as const;
}

function buildRevenueBreakdownTable(rows: AdminReportTransactionItem[]) {
  const grouped = new Map<
    string,
    {
      revenueHead: string;
      department: string;
      transactions: number;
      totalRevenue: number;
    }
  >();

  rows.forEach((item) => {
    const key = `${item.income_head}::${item.department}`;
    const current = grouped.get(key);

    if (current) {
      current.transactions += 1;
      current.totalRevenue += item.amount;
      return;
    }

    grouped.set(key, {
      revenueHead: item.income_head,
      department: item.department,
      transactions: 1,
      totalRevenue: item.amount,
    });
  });

  return [...grouped.values()].sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export default function Page() {
  const router = useRouter();
  const accessToken = getAccessToken();
  const today = getTodayDate();
  const [hospitalId, setHospitalId] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [departmentId, setDepartmentId] = useState("All");
  const [incomeHeadId, setIncomeHeadId] = useState("All");
  const [agentId, setAgentId] = useState("All");
  const [paymentMethod, setPaymentMethod] = useState<AdminReportPaymentType | "all">(
    "all",
  );
  const [showAll, setShowAll] = useState(false);
  const [page, setPage] = useState(1);

  const optionsQuery = useQuery({
    queryKey: ["admin-revenue-report-options"],
    queryFn: getAdminReportsOptions,
    enabled: Boolean(accessToken),
  });

  const hospitals = optionsQuery.data?.data.hospitals ?? [];
  const selectedHospitalId = hospitalId || hospitals[0]?.hospital_id || "";

  const departmentsQuery = useQuery({
    queryKey: ["admin-revenue-report-departments", selectedHospitalId],
    queryFn: () => getAdminHospitalDepartments(selectedHospitalId),
    enabled: Boolean(accessToken && selectedHospitalId),
  });

  const agentsQuery = useQuery({
    queryKey: ["admin-revenue-report-agents", selectedHospitalId],
    queryFn: () => getAdminHospitalAgents(selectedHospitalId),
    enabled: Boolean(accessToken && selectedHospitalId),
  });

  const incomeHeadsQuery = useQuery({
    queryKey: ["admin-revenue-report-income-heads", selectedHospitalId, departmentId],
    queryFn: () =>
      getAdminHospitalIncomeHeads(selectedHospitalId, {
        departmentId: departmentId === "All" ? undefined : departmentId,
      }),
    enabled: Boolean(accessToken && selectedHospitalId),
  });

  const dateRangeIsInvalid =
    !showAll && Boolean(startDate && endDate && startDate > endDate);
  const applied =
    !selectedHospitalId || dateRangeIsInvalid
      ? null
      : {
          hospitalId: selectedHospitalId,
          startDate: showAll ? "" : startDate,
          endDate: showAll ? "" : endDate,
          showAll,
          departmentId,
          incomeHeadId,
          agentId,
          paymentMethod,
          page,
        };

  const reportQuery = useQuery({
    queryKey: ["admin-revenue-report", applied],
    queryFn: () => {
      const current = applied;

      if (!current?.hospitalId) {
        throw new Error("Select a hospital to view reports.");
      }

      return getAdminHospitalRevenueReport(current.hospitalId, {
        startDate: current.startDate,
        endDate: current.endDate,
        showAll: current.showAll,
        departments:
          current.departmentId === "All" ? undefined : [current.departmentId],
        incomeHeads:
          current.incomeHeadId === "All" ? undefined : [current.incomeHeadId],
        agents: current.agentId === "All" ? undefined : [current.agentId],
        paymentMethod:
          current.paymentMethod === "all" ? undefined : current.paymentMethod,
        page: current.page,
        limit: REPORTS_PER_PAGE,
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
        : departmentsQuery.error instanceof ApiError
          ? departmentsQuery.error
          : agentsQuery.error instanceof ApiError
            ? agentsQuery.error
            : incomeHeadsQuery.error instanceof ApiError
              ? incomeHeadsQuery.error
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
  }, [
    agentsQuery.error,
    departmentsQuery.error,
    incomeHeadsQuery.error,
    optionsQuery.error,
    reportQuery.error,
    router,
  ]);

  const departmentOptions = useMemo(
    () =>
      (departmentsQuery.data?.data.departments ?? []).map((item) =>
        typeof item === "string"
          ? { id: item, name: item }
          : { id: item.department_id ?? item.id ?? item.name, name: item.name },
      ),
    [departmentsQuery.data?.data.departments],
  );

  const agentOptions = useMemo(
    () =>
      (agentsQuery.data?.data.agent_name_list ?? []).map((item) => ({
        id: item.agent_id,
        name: item.agent_name,
      })),
    [agentsQuery.data?.data.agent_name_list],
  );

  const incomeHeadOptions = useMemo(
    () =>
      (incomeHeadsQuery.data?.data.income_heads ?? []).map((item) => ({
        id: item.income_head_id,
        name: item.name,
      })),
    [incomeHeadsQuery.data?.data.income_heads],
  );

  const rows = reportQuery.data?.data.transactions ?? [];
  const summary = reportQuery.data?.data.summary;
  const pagination = reportQuery.data?.data.pagination;

  return (
    <div className="min-h-screen w-full bg-canvas">
      <Header
        title="Revenue Report"
        Subtitle="Review transaction-level revenue activity for the selected hospital"
        actions={
          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={() => {
                const current = applied;

                if (!current?.hospitalId) {
                  toast.error("Select a hospital to print reports.");
                  return;
                }

                printAdminHospitalRevenueReport(current.hospitalId, {
                  startDate: current.startDate,
                  endDate: current.endDate,
                  showAll: current.showAll,
                  departments:
                    current.departmentId === "All"
                      ? undefined
                      : [current.departmentId],
                  incomeHeads:
                    current.incomeHeadId === "All"
                      ? undefined
                      : [current.incomeHeadId],
                  agents: current.agentId === "All" ? undefined : [current.agentId],
                  paymentMethod:
                    current.paymentMethod === "all"
                      ? undefined
                      : current.paymentMethod,
                }).catch((error) =>
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Unable to print report.",
                  ),
                );
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-line-subtle px-4 py-2 text-sm font-medium text-gray-800 hover:bg-panel-muted dark:text-slate-200"
            >
              <FiPrinter />
              Print
            </button>
            <button
              type="button"
              onClick={() => {
                const current = applied;

                if (!current?.hospitalId) {
                  toast.error("Select a hospital to export reports.");
                  return;
                }

                exportAdminHospitalRevenueReportCsv(current.hospitalId, {
                  startDate: current.startDate,
                  endDate: current.endDate,
                  showAll: current.showAll,
                  departments:
                    current.departmentId === "All"
                      ? undefined
                      : [current.departmentId],
                  incomeHeads:
                    current.incomeHeadId === "All"
                      ? undefined
                      : [current.incomeHeadId],
                  agents: current.agentId === "All" ? undefined : [current.agentId],
                  paymentMethod:
                    current.paymentMethod === "all"
                      ? undefined
                      : current.paymentMethod,
                }).catch((error) =>
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Unable to export report.",
                  ),
                );
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-line-subtle px-4 py-2 text-sm font-medium text-gray-800 hover:bg-panel-muted dark:text-slate-200"
            >
              <FiDownload />
              Export CSV
            </button>
          </div>
        }
      />

      <div className="space-y-6 p-6">
        {reportQuery.error instanceof Error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {reportQuery.error.message}
          </div>
        ) : null}

        <div className="rounded-xl border border-line-subtle bg-panel p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Hospital
              </p>
              <select
                value={selectedHospitalId}
                onChange={(event) => {
                  setHospitalId(event.target.value);
                  setDepartmentId("All");
                  setIncomeHeadId("All");
                  setAgentId("All");
                  setShowAll(false);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-line-subtle bg-canvas-alt px-3 py-2 text-sm dark:text-slate-100"
              >
                <option value="">Select hospital</option>
                {hospitals.map((item) => (
                  <option key={item.hospital_id} value={item.hospital_id}>
                    {item.hospital_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Department
              </p>
              <select
                value={departmentId}
                onChange={(event) => {
                  setDepartmentId(event.target.value);
                  setIncomeHeadId("All");
                  setShowAll(false);
                  setPage(1);
                }}
                disabled={!selectedHospitalId || departmentsQuery.isLoading}
                className="w-full rounded-lg border border-line-subtle bg-canvas-alt px-3 py-2 text-sm dark:text-slate-100"
              >
                <option value="All">All departments</option>
                {departmentOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Income Head
              </p>
              <select
                value={incomeHeadId}
                onChange={(event) => {
                  setIncomeHeadId(event.target.value);
                  setShowAll(false);
                  setPage(1);
                }}
                disabled={!selectedHospitalId || incomeHeadsQuery.isLoading}
                className="w-full rounded-lg border border-line-subtle bg-canvas-alt px-3 py-2 text-sm dark:text-slate-100"
              >
                <option value="All">All income heads</option>
                {incomeHeadOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Agent
              </p>
              <select
                value={agentId}
                onChange={(event) => {
                  setAgentId(event.target.value);
                  setShowAll(false);
                  setPage(1);
                }}
                disabled={!selectedHospitalId || agentsQuery.isLoading}
                className="w-full rounded-lg border border-line-subtle bg-canvas-alt px-3 py-2 text-sm dark:text-slate-100"
              >
                <option value="All">All agents</option>
                {agentOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Payment Method
              </p>
              <select
                value={paymentMethod}
                onChange={(event) =>
                  {
                    setPaymentMethod(event.target.value as AdminReportPaymentType | "all");
                    setShowAll(false);
                    setPage(1);
                  }
                }
                className="w-full rounded-lg border border-line-subtle bg-canvas-alt px-3 py-2 text-sm dark:text-slate-100"
              >
                <option value="all">All methods</option>
                <option value="cash">Cash</option>
                <option value="transfer">Transfer</option>
                <option value="pos">POS</option>
              </select>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Start Date
              </p>
              <input
                type="date"
                value={startDate}
                onChange={(event) => {
                  setStartDate(event.target.value);
                  setShowAll(false);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-line-subtle bg-canvas-alt px-3 py-2 text-sm dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                End Date
              </p>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(event) => {
                  setEndDate(event.target.value);
                  setShowAll(false);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-line-subtle bg-canvas-alt px-3 py-2 text-sm dark:text-slate-100"
              />
            </div>
          </div>

          {dateRangeIsInvalid ? (
            <p className="mt-3 text-sm text-red-600 dark:text-red-300">
              Start date and end date must be provided together, and the start date cannot be after the end date.
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                if (!selectedHospitalId) {
                  toast.error("Select a hospital to view reports.");
                  return;
                }

                setShowAll(true);
                setPage(1);
                setStartDate("");
                setEndDate("");
              }}
              disabled={!selectedHospitalId}
              className="rounded-lg border border-line-subtle px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-panel-muted disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-200"
            >
              View All Reports
            </button>
          </div>
        </div>

        <FoReportsSummaryCards
          isLoading={reportQuery.isLoading}
          totalRevenue={summary?.total_amount ?? 0}
          totalTransactions={summary?.total_transactions ?? 0}
        />

        <FoReportsRevenueBreakdownTable
          rows={buildRevenueBreakdownTable(rows)}
          title="Detailed Revenue Breakdown"
          emptyMessage="No revenue breakdown available for the current filters."
        />

        <FoReportsTransactionsTable rows={rows} toMethodLabel={toMethodLabel} />

        {pagination ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-line-subtle bg-panel px-5 py-4 text-sm text-gray-600 dark:text-slate-300">
              Showing {rows.length} transaction{rows.length === 1 ? "" : "s"} on
              this page. Total matching transactions:{" "}
              {summary?.total_transactions ?? pagination.total_transactions}.
            </div>
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
      </div>
    </div>
  );
}
