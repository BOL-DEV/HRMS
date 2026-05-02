"use client";

import AdminPaginationFooter from "@/components/AdminPaginationFooter";
import FoReportsCharts from "@/components/FoReportsCharts";
import FoReportsRevenueBreakdownTable from "@/components/FoReportsRevenueBreakdownTable";
import FoReportsSummaryCards from "@/components/FoReportsSummaryCards";
import FoReportsTransactionsTable from "@/components/FoReportsTransactionsTable";
import Header from "@/components/Header";
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

function buildRevenueTrend(rows: AdminReportTransactionItem[]) {
  const grouped = new Map<string, number>();

  rows.forEach((item) => {
    const key = item.date_time.slice(0, 10);
    grouped.set(key, (grouped.get(key) ?? 0) + item.amount);
  });

  return [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, value]) => ({ label, value }));
}

function buildPaymentBreakdown(rows: AdminReportTransactionItem[]) {
  const grouped = new Map<string, number>();

  rows.forEach((item) => {
    const label = toMethodLabel(item.payment_method);
    grouped.set(label, (grouped.get(label) ?? 0) + item.amount);
  });

  return [...grouped.entries()].map(([name, value]) => ({ name, value }));
}

function buildDepartmentBreakdown(rows: AdminReportTransactionItem[]) {
  const grouped = new Map<string, number>();

  rows.forEach((item) => {
    grouped.set(item.department, (grouped.get(item.department) ?? 0) + item.amount);
  });

  return [...grouped.entries()].map(([name, value]) => ({ name, value }));
}

function buildTopAgents(rows: AdminReportTransactionItem[]) {
  const grouped = new Map<string, number>();

  rows.forEach((item) => {
    grouped.set(item.agent, (grouped.get(item.agent) ?? 0) + item.amount);
  });

  return [...grouped.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
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
  const [applied, setApplied] = useState({
    hospitalId: "",
    startDate: today,
    endDate: today,
    showAll: false,
    departmentId: "All",
    incomeHeadId: "All",
    agentId: "All",
    paymentMethod: "all" as AdminReportPaymentType | "all",
    page: 1,
  });

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

  const reportQuery = useQuery({
    queryKey: ["admin-revenue-report", applied],
    queryFn: () =>
      getAdminHospitalRevenueReport(applied.hospitalId, {
        startDate: applied.startDate,
        endDate: applied.endDate,
        showAll: applied.showAll,
        departments:
          applied.departmentId === "All" ? undefined : [applied.departmentId],
        incomeHeads:
          applied.incomeHeadId === "All" ? undefined : [applied.incomeHeadId],
        agents: applied.agentId === "All" ? undefined : [applied.agentId],
        paymentMethod:
          applied.paymentMethod === "all" ? undefined : applied.paymentMethod,
        page: applied.page,
        limit: REPORTS_PER_PAGE,
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
  const dateRangeIsInvalid =
    Boolean(startDate && endDate && startDate > endDate);

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-slate-950">
      <Header
        title="Revenue Report"
        Subtitle="Review transaction-level revenue activity for the selected hospital"
        actions={
          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={() =>
                !applied.hospitalId
                  ? toast.error("Generate a revenue report before printing.")
                  : printAdminHospitalRevenueReport(applied.hospitalId, {
                      startDate: applied.startDate,
                      endDate: applied.endDate,
                      showAll: applied.showAll,
                      departments:
                        applied.departmentId === "All"
                          ? undefined
                          : [applied.departmentId],
                      incomeHeads:
                        applied.incomeHeadId === "All"
                          ? undefined
                          : [applied.incomeHeadId],
                      agents:
                        applied.agentId === "All" ? undefined : [applied.agentId],
                      paymentMethod:
                        applied.paymentMethod === "all"
                          ? undefined
                          : applied.paymentMethod,
                    }).catch((error) =>
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "Unable to print report.",
                      ),
                    )
              }
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <FiPrinter />
              Print
            </button>
            <button
              type="button"
              onClick={() =>
                !applied.hospitalId
                  ? toast.error("Generate a revenue report before exporting.")
                  : exportAdminHospitalRevenueReportCsv(applied.hospitalId, {
                      startDate: applied.startDate,
                      endDate: applied.endDate,
                      showAll: applied.showAll,
                      departments:
                        applied.departmentId === "All"
                          ? undefined
                          : [applied.departmentId],
                      incomeHeads:
                        applied.incomeHeadId === "All"
                          ? undefined
                          : [applied.incomeHeadId],
                      agents:
                        applied.agentId === "All" ? undefined : [applied.agentId],
                      paymentMethod:
                        applied.paymentMethod === "all"
                          ? undefined
                          : applied.paymentMethod,
                    }).catch((error) =>
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "Unable to export report.",
                      ),
                    )
              }
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
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

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
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
                }}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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
                Start Date
              </p>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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
                onChange={(event) => setEndDate(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
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
                }}
                disabled={!selectedHospitalId || departmentsQuery.isLoading}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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
                onChange={(event) => setIncomeHeadId(event.target.value)}
                disabled={!selectedHospitalId || incomeHeadsQuery.isLoading}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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
                onChange={(event) => setAgentId(event.target.value)}
                disabled={!selectedHospitalId || agentsQuery.isLoading}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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
                  setPaymentMethod(event.target.value as AdminReportPaymentType | "all")
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="all">All methods</option>
                <option value="cash">Cash</option>
                <option value="transfer">Transfer</option>
                <option value="pos">POS</option>
              </select>
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

                setStartDate("");
                setEndDate("");
                setApplied({
                  hospitalId: selectedHospitalId,
                  startDate: "",
                  endDate: "",
                  showAll: true,
                  departmentId,
                  incomeHeadId,
                  agentId,
                  paymentMethod,
                  page: 1,
                });
              }}
              disabled={!selectedHospitalId}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              View All Reports
            </button>
            <button
              type="button"
              onClick={() => {
                if (!selectedHospitalId) {
                  toast.error("Select a hospital to generate the report.");
                  return;
                }

                if (dateRangeIsInvalid) {
                  return;
                }

                setApplied({
                  hospitalId: selectedHospitalId,
                  startDate,
                  endDate,
                  showAll: false,
                  departmentId,
                  incomeHeadId,
                  agentId,
                  paymentMethod,
                  page: 1,
                });
              }}
              disabled={!selectedHospitalId || dateRangeIsInvalid}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Generate Report
            </button>
          </div>
        </div>

        <FoReportsSummaryCards
          isLoading={reportQuery.isLoading}
          totalRevenue={summary?.total_amount ?? 0}
          totalTransactions={summary?.total_transactions ?? 0}
        />

        {rows.length > 0 ? (
          <FoReportsCharts
            revenueTrendData={buildRevenueTrend(rows)}
            paymentMethodSummary={buildPaymentBreakdown(rows)}
            departmentRevenue={buildDepartmentBreakdown(rows)}
            topAgents={buildTopAgents(rows)}
          />
        ) : null}

        <FoReportsRevenueBreakdownTable
          rows={buildRevenueBreakdownTable(rows)}
          title="Detailed Revenue Breakdown"
          emptyMessage="No revenue breakdown available for the current filters."
        />

        <FoReportsTransactionsTable rows={rows} toMethodLabel={toMethodLabel} />

        {pagination ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              Showing {rows.length} transaction{rows.length === 1 ? "" : "s"} on
              this page. Total matching transactions:{" "}
              {summary?.total_transactions ?? pagination.total_transactions}.
            </div>
            <div className="rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
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
      </div>
    </div>
  );
}
