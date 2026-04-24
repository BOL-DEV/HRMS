"use client";

import AdminPaginationFooter from "@/components/AdminPaginationFooter";
import FoReportsCharts from "@/components/FoReportsCharts";
import FoReportsRevenueBreakdownTable from "@/components/FoReportsRevenueBreakdownTable";
import FoReportsSummaryCards from "@/components/FoReportsSummaryCards";
import FoReportsTransactionsTable from "@/components/FoReportsTransactionsTable";
import Header from "@/components/Header";
import { ApiError } from "@/libs/api";
import {
  exportAdminHospitalAgentReportCsv,
  exportAdminHospitalDepartmentReportCsv,
  exportAdminHospitalPatientReportCsv,
  exportAdminHospitalRevenueReportCsv,
  getAdminHospitalAgentReport,
  getAdminHospitalAgents,
  getAdminHospitalDepartmentReport,
  getAdminHospitalDepartments,
  getAdminHospitalIncomeHeads,
  getAdminHospitalPatientReport,
  getAdminHospitalRevenueReport,
  getAdminReportsOptions,
  printAdminHospitalAgentReport,
  printAdminHospitalDepartmentReport,
  printAdminHospitalPatientReport,
  printAdminHospitalRevenueReport,
} from "@/libs/admin-auth";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import type {
  AdminHospitalAgentReportResponse,
  AdminHospitalDepartmentReportResponse,
  AdminHospitalPatientReportResponse,
  AdminHospitalRevenueReportResponse,
  AdminReportPaymentType,
  AdminReportTransactionItem,
  AdminReportTypeKey,
} from "@/libs/type";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { FiDownload, FiPrinter } from "react-icons/fi";

type RevenueBreakdownRow = {
  revenueHead: string;
  department: string;
  transactions: number;
  totalRevenue: number;
};

type ReportData =
  | AdminHospitalRevenueReportResponse["data"]
  | AdminHospitalPatientReportResponse["data"]
  | AdminHospitalDepartmentReportResponse["data"]
  | AdminHospitalAgentReportResponse["data"];

type AppliedFilters = {
  hospitalId: string;
  reportType: AdminReportTypeKey;
  filterValue: string;
  revenueDepartmentIds: string[];
  revenueIncomeHeadIds: string[];
  revenueAgentIds: string[];
  revenuePaymentMethod: AdminReportPaymentType | "all";
  startDate: string;
  endDate: string;
  page: number;
};

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getRelativeDate(daysFromToday: number) {
  const today = new Date();
  today.setDate(today.getDate() + daysFromToday);
  return formatDateOnly(today);
}

function toMethodLabel(value: "cash" | "transfer" | "pos") {
  if (value === "cash") return "Cash" as const;
  if (value === "transfer") return "Transfer" as const;
  return "POS" as const;
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
    const label = toMethodLabel(item.payment_method ?? "cash");
    grouped.set(label, (grouped.get(label) ?? 0) + item.amount);
  });

  return [...grouped.entries()].map(([name, value]) => ({ name, value }));
}

function buildDepartmentBreakdown(rows: AdminReportTransactionItem[]) {
  const grouped = new Map<string, number>();

  rows.forEach((item) => {
    const label = item.department ?? "Unknown";
    grouped.set(label, (grouped.get(label) ?? 0) + item.amount);
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

function buildRevenueBreakdownTable(rows: AdminReportTransactionItem[]) {
  const grouped = new Map<string, RevenueBreakdownRow>();

  rows.forEach((item) => {
    const revenueHead = item.income_head ?? "Unknown";
    const department = item.department ?? "Unknown";
    const key = `${revenueHead}::${department}`;
    const current = grouped.get(key);

    if (current) {
      current.transactions += 1;
      current.totalRevenue += item.amount;
      return;
    }

    grouped.set(key, {
      revenueHead,
      department,
      transactions: 1,
      totalRevenue: item.amount,
    });
  });

  return [...grouped.values()].sort((a, b) => b.totalRevenue - a.totalRevenue);
}

function extractRows(
  reportType: AdminReportTypeKey,
  data?: ReportData,
): AdminReportTransactionItem[] {
  if (!data) {
    return [];
  }

  if (reportType === "revenue") {
    return (data as AdminHospitalRevenueReportResponse["data"]).transactions ?? [];
  }

  if (reportType === "patient") {
    return (data as AdminHospitalPatientReportResponse["data"]).report.map(
      (item, index) => ({
        transaction_id: `${item.patient_id}-${item.date_time}-${index}`,
        date_time: item.date_time,
        receipt_id: "-",
        patient_id: item.patient_id,
        patient_name: item.patient_name,
        department: item.department,
        income_head: item.income_head,
        bill_name: item.bill_name,
        payment_method: "cash",
        amount: item.amount,
        agent: item.agent_name,
      }),
    );
  }

  if (reportType === "department") {
    return (
      (data as AdminHospitalDepartmentReportResponse["data"]).transactions ?? []
    );
  }

  return (data as AdminHospitalAgentReportResponse["data"]).transactions ?? [];
}

function buildGroupedRows(
  reportType: "department" | "agent",
  data?: AdminHospitalDepartmentReportResponse["data"] | AdminHospitalAgentReportResponse["data"],
): RevenueBreakdownRow[] {
  if (!data || data.transactions?.length) {
    return [];
  }

  if (reportType === "department") {
    return (((data as AdminHospitalDepartmentReportResponse["data"]).report ??
      []) as NonNullable<AdminHospitalDepartmentReportResponse["data"]["report"]>).map(
      (item) => ({
        revenueHead: item.department,
        department: item.department,
        transactions: item.count,
        totalRevenue: item.amount,
      }),
    );
  }

  return (((data as AdminHospitalAgentReportResponse["data"]).report ??
    []) as NonNullable<AdminHospitalAgentReportResponse["data"]["report"]>).map(
    (item) => ({
      revenueHead: item.agent,
      department: "All Departments",
      transactions: item.count,
      totalRevenue: item.amount,
    }),
  );
}

function buildWorkspaceStats(
  reportType: AdminReportTypeKey,
  data: ReportData | undefined,
  rows: AdminReportTransactionItem[],
) {
  if (!data) {
    return {
      totalRevenue: 0,
      totalTransactions: 0,
      averageTransaction: 0,
    };
  }

  if (reportType === "patient") {
    const summary = (data as AdminHospitalPatientReportResponse["data"]).summary;
    return {
      totalRevenue: summary.total_bill_amount,
      totalTransactions: summary.transaction_count,
      averageTransaction: summary.transaction_count
        ? summary.total_bill_amount / summary.transaction_count
        : 0,
    };
  }

  if (reportType === "revenue") {
    const revenueData = data as AdminHospitalRevenueReportResponse["data"];
    const totalRevenue = rows.reduce((sum, item) => sum + item.amount, 0);
    const totalTransactions = revenueData.pagination.total_transactions;

    return {
      totalRevenue,
      totalTransactions,
      averageTransaction: totalTransactions ? totalRevenue / totalTransactions : 0,
    };
  }

  const summary = (
    data as
      | AdminHospitalDepartmentReportResponse["data"]
      | AdminHospitalAgentReportResponse["data"]
  ).summary as Record<string, unknown>;
  const totalRevenue = Number(summary.total_amount ?? summary.amount ?? 0);
  const totalTransactions = Number(summary.total_count ?? summary.count ?? rows.length);

  return {
    totalRevenue,
    totalTransactions,
    averageTransaction: totalTransactions ? totalRevenue / totalTransactions : 0,
  };
}

function getReportTypeMeta(reportType: AdminReportTypeKey) {
  if (reportType === "patient") {
    return {
      title: "Patient Report",
      subtitle: "Review billed activity for a specific patient within a hospital.",
      filterLabel: "Patient ID",
      filterPlaceholder: "Enter patient ID",
    };
  }

  if (reportType === "department") {
    return {
      title: "Department Report",
      subtitle: "Compare grouped department performance or drill into one department.",
      filterLabel: "Department",
      filterPlaceholder: "All departments",
    };
  }

  if (reportType === "agent") {
    return {
      title: "Agent Report",
      subtitle: "Track grouped agent totals or inspect one agent's transactions.",
      filterLabel: "Agent",
      filterPlaceholder: "All agents",
    };
  }

  return {
    title: "Revenue Report",
    subtitle: "Review transaction-level revenue activity for the selected hospital.",
    filterLabel: "",
    filterPlaceholder: "",
  };
}

const INITIAL_DATE_START = getRelativeDate(-6);
const INITIAL_DATE_END = getRelativeDate(0);

export default function Page() {
  const router = useRouter();
  const accessToken = getAccessToken();
  const [hospitalId, setHospitalId] = useState("");
  const [reportType, setReportType] = useState<AdminReportTypeKey>("revenue");
  const [filterValue, setFilterValue] = useState("");
  const [revenueDepartmentIds, setRevenueDepartmentIds] = useState<string[]>([]);
  const [revenueIncomeHeadIds, setRevenueIncomeHeadIds] = useState<string[]>([]);
  const [revenueAgentIds, setRevenueAgentIds] = useState<string[]>([]);
  const [revenuePaymentMethod, setRevenuePaymentMethod] = useState<
    AdminReportPaymentType | "all"
  >("all");
  const [startDate, setStartDate] = useState(INITIAL_DATE_START);
  const [endDate, setEndDate] = useState(INITIAL_DATE_END);
  const [applied, setApplied] = useState<AppliedFilters>({
    hospitalId: "",
    reportType: "revenue",
    filterValue: "",
    revenueDepartmentIds: [],
    revenueIncomeHeadIds: [],
    revenueAgentIds: [],
    revenuePaymentMethod: "all",
    startDate: INITIAL_DATE_START,
    endDate: INITIAL_DATE_END,
    page: 1,
  });

  const optionsQuery = useQuery({
    queryKey: ["admin-reports-options"],
    queryFn: getAdminReportsOptions,
    enabled: Boolean(accessToken),
  });

  const departmentsQuery = useQuery({
    queryKey: ["admin-report-departments", hospitalId],
    queryFn: () => getAdminHospitalDepartments(hospitalId),
    enabled: Boolean(
      accessToken &&
        hospitalId &&
        (reportType === "department" || reportType === "revenue"),
    ),
  });

  const agentsQuery = useQuery({
    queryKey: ["admin-report-agents", hospitalId],
    queryFn: () => getAdminHospitalAgents(hospitalId),
    enabled: Boolean(
      accessToken &&
        hospitalId &&
        (reportType === "agent" || reportType === "revenue"),
    ),
  });

  const incomeHeadsQuery = useQuery({
    queryKey: ["admin-report-income-heads", hospitalId, revenueDepartmentIds],
    queryFn: () =>
      getAdminHospitalIncomeHeads(hospitalId, {
        departmentId: revenueDepartmentIds.length === 1 ? revenueDepartmentIds[0] : undefined,
      }),
    enabled: Boolean(accessToken && hospitalId && reportType === "revenue"),
  });

  const reportQuery = useQuery({
    queryKey: ["admin-report", applied],
    queryFn: async () => {
      if (applied.reportType === "patient") {
        return getAdminHospitalPatientReport(applied.hospitalId, {
          patientId: applied.filterValue || undefined,
          startDate: applied.startDate,
          endDate: applied.endDate,
        });
      }

      if (applied.reportType === "department") {
        return getAdminHospitalDepartmentReport(applied.hospitalId, {
          department: applied.filterValue || undefined,
          startDate: applied.startDate,
          endDate: applied.endDate,
        });
      }

      if (applied.reportType === "agent") {
        return getAdminHospitalAgentReport(applied.hospitalId, {
          agentId: applied.filterValue || undefined,
          startDate: applied.startDate,
          endDate: applied.endDate,
        });
      }

      return getAdminHospitalRevenueReport(applied.hospitalId, {
        departments: applied.revenueDepartmentIds,
        incomeHeads: applied.revenueIncomeHeadIds,
        agents: applied.revenueAgentIds,
        paymentMethod:
          applied.revenuePaymentMethod === "all"
            ? undefined
            : applied.revenuePaymentMethod,
        startDate: applied.startDate,
        endDate: applied.endDate,
        page: applied.page,
        limit: 15,
      });
    },
    enabled: Boolean(accessToken && applied.hospitalId),
  });

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    const apiError = [
      optionsQuery.error,
      departmentsQuery.error,
      agentsQuery.error,
      incomeHeadsQuery.error,
      reportQuery.error,
    ].find((error): error is ApiError => error instanceof ApiError);

    if (!apiError) {
      return;
    }

    if (apiError.status === 401) {
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

  const hospitalOptions = useMemo(
    () => optionsQuery.data?.data.hospitals ?? [],
    [optionsQuery.data?.data.hospitals],
  );

  const reportTypeOptions = useMemo(
    () => optionsQuery.data?.data.report_types ?? [],
    [optionsQuery.data?.data.report_types],
  );

  const departmentOptions = useMemo(
    () =>
      (departmentsQuery.data?.data.departments ?? []).map((item) =>
        typeof item === "string"
          ? { id: item, name: item }
          : {
              id: item.department_id ?? item.id ?? item.name,
              name: item.name,
            },
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

  const reportData = reportQuery.data?.data as ReportData | undefined;
  const rows = useMemo(
    () => extractRows(applied.reportType, reportData),
    [applied.reportType, reportData],
  );

  const stats = useMemo(
    () => buildWorkspaceStats(applied.reportType, reportData, rows),
    [applied.reportType, reportData, rows],
  );

  const revenueTrend = useMemo(() => buildRevenueTrend(rows), [rows]);
  const paymentBreakdown = useMemo(() => buildPaymentBreakdown(rows), [rows]);
  const departmentBreakdown = useMemo(() => buildDepartmentBreakdown(rows), [rows]);
  const topAgents = useMemo(() => buildTopAgents(rows), [rows]);

  const groupedBreakdownRows = useMemo(() => {
    if (applied.reportType === "department") {
      return buildGroupedRows(
        "department",
        reportData as AdminHospitalDepartmentReportResponse["data"] | undefined,
      );
    }

    if (applied.reportType === "agent") {
      return buildGroupedRows(
        "agent",
        reportData as AdminHospitalAgentReportResponse["data"] | undefined,
      );
    }

    return [];
  }, [applied.reportType, reportData]);

  const revenueBreakdownRows =
    rows.length > 0 ? buildRevenueBreakdownTable(rows) : groupedBreakdownRows;

  const meta = getReportTypeMeta(reportType);
  const reportError =
    reportQuery.error instanceof Error
      ? reportQuery.error.message
      : optionsQuery.error instanceof Error
        ? optionsQuery.error.message
        : departmentsQuery.error instanceof Error
          ? departmentsQuery.error.message
          : agentsQuery.error instanceof Error
            ? agentsQuery.error.message
            : incomeHeadsQuery.error instanceof Error
              ? incomeHeadsQuery.error.message
              : null;

  const dateRangeIsInvalid =
    Boolean(startDate || endDate) && (!startDate || !endDate);

  const resetRevenueFilters = () => {
    setRevenueDepartmentIds([]);
    setRevenueIncomeHeadIds([]);
    setRevenueAgentIds([]);
    setRevenuePaymentMethod("all");
  };

  const handleGenerate = () => {
    if (!hospitalId || dateRangeIsInvalid) {
      return;
    }

    setApplied({
      hospitalId,
      reportType,
      filterValue:
        reportType === "department" || reportType === "agent"
          ? filterValue === "All"
            ? ""
            : filterValue
          : filterValue.trim(),
      revenueDepartmentIds,
      revenueIncomeHeadIds,
      revenueAgentIds,
      revenuePaymentMethod,
      startDate,
      endDate,
      page: 1,
    });
  };

  const handleExport = async () => {
    if (!applied.hospitalId) {
      return;
    }

    try {
      if (applied.reportType === "patient") {
        await exportAdminHospitalPatientReportCsv(applied.hospitalId, {
          patientId: applied.filterValue || undefined,
          startDate: applied.startDate,
          endDate: applied.endDate,
        });
        return;
      }

      if (applied.reportType === "department") {
        await exportAdminHospitalDepartmentReportCsv(applied.hospitalId, {
          department: applied.filterValue || undefined,
          startDate: applied.startDate,
          endDate: applied.endDate,
        });
        return;
      }

      if (applied.reportType === "agent") {
        await exportAdminHospitalAgentReportCsv(applied.hospitalId, {
          agentId: applied.filterValue || undefined,
          startDate: applied.startDate,
          endDate: applied.endDate,
        });
        return;
      }

      await exportAdminHospitalRevenueReportCsv(applied.hospitalId, {
        departments: applied.revenueDepartmentIds,
        incomeHeads: applied.revenueIncomeHeadIds,
        agents: applied.revenueAgentIds,
        paymentMethod:
          applied.revenuePaymentMethod === "all"
            ? undefined
            : applied.revenuePaymentMethod,
        startDate: applied.startDate,
        endDate: applied.endDate,
        page: applied.page,
        limit: 15,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to export report.",
      );
    }
  };

  const handlePrint = async () => {
    if (!applied.hospitalId) {
      return;
    }

    try {
      if (applied.reportType === "patient") {
        await printAdminHospitalPatientReport(applied.hospitalId, {
          patientId: applied.filterValue || undefined,
          startDate: applied.startDate,
          endDate: applied.endDate,
        });
        return;
      }

      if (applied.reportType === "department") {
        await printAdminHospitalDepartmentReport(applied.hospitalId, {
          department: applied.filterValue || undefined,
          startDate: applied.startDate,
          endDate: applied.endDate,
        });
        return;
      }

      if (applied.reportType === "agent") {
        await printAdminHospitalAgentReport(applied.hospitalId, {
          agentId: applied.filterValue || undefined,
          startDate: applied.startDate,
          endDate: applied.endDate,
        });
        return;
      }

      await printAdminHospitalRevenueReport(applied.hospitalId, {
        departments: applied.revenueDepartmentIds,
        incomeHeads: applied.revenueIncomeHeadIds,
        agents: applied.revenueAgentIds,
        paymentMethod:
          applied.revenuePaymentMethod === "all"
            ? undefined
            : applied.revenuePaymentMethod,
        startDate: applied.startDate,
        endDate: applied.endDate,
        page: applied.page,
        limit: 15,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to print report.",
      );
    }
  };

  const revenuePagination =
    applied.reportType === "revenue" && reportData
      ? (reportData as AdminHospitalRevenueReportResponse["data"]).pagination
      : null;

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-slate-950">
      <Header
        title="Admin Reports"
        Subtitle="Pick a hospital, choose a report type, and run the matching admin report endpoint."
        actions={
          applied.hospitalId ? (
            <div className="hidden items-center gap-2 md:flex">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <FiPrinter />
                Print
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <FiDownload />
                Export CSV
              </button>
            </div>
          ) : null
        }
      />

      <div className="space-y-6 p-6">
        {reportError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {reportError}
          </div>
        ) : null}

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                {meta.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                {meta.subtitle}
              </p>
            </div>

            {applied.hospitalId ? (
              <div className="flex items-center gap-2 md:hidden">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="rounded-lg border border-gray-200 p-2 text-gray-800 dark:border-slate-700 dark:text-slate-200"
                  aria-label="Print report"
                >
                  <FiPrinter />
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  className="rounded-lg border border-gray-200 p-2 text-gray-800 dark:border-slate-700 dark:text-slate-200"
                  aria-label="Export report"
                >
                  <FiDownload />
                </button>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Hospital
              </p>
              <select
                value={hospitalId}
                onChange={(event) => {
                  setHospitalId(event.target.value);
                  setFilterValue("");
                  resetRevenueFilters();
                }}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="">Select hospital</option>
                {hospitalOptions.map((item) => (
                  <option key={item.hospital_id} value={item.hospital_id}>
                    {item.hospital_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Report Type
              </p>
              <select
                value={reportType}
                onChange={(event) => {
                  setReportType(event.target.value as AdminReportTypeKey);
                  setFilterValue("");
                  resetRevenueFilters();
                }}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {reportTypeOptions.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {reportType === "patient" ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  {meta.filterLabel}
                </p>
                <input
                  value={filterValue}
                  onChange={(event) => setFilterValue(event.target.value)}
                  placeholder={meta.filterPlaceholder}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            ) : null}

            {reportType === "department" ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  {meta.filterLabel}
                </p>
                <select
                  value={filterValue || "All"}
                  onChange={(event) => setFilterValue(event.target.value)}
                  disabled={departmentsQuery.isLoading}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="All">All departments</option>
                  {departmentOptions.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {reportType === "agent" ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  {meta.filterLabel}
                </p>
                <select
                  value={filterValue || "All"}
                  onChange={(event) => setFilterValue(event.target.value)}
                  disabled={agentsQuery.isLoading}
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
            ) : null}

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
          </div>

          {reportType === "revenue" ? (
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  Departments
                </p>
                <select
                  multiple
                  value={revenueDepartmentIds}
                  onChange={(event) => {
                    const values = Array.from(event.target.selectedOptions).map(
                      (option) => option.value,
                    );
                    setRevenueDepartmentIds(values);
                    setRevenueIncomeHeadIds([]);
                  }}
                  className="h-28 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  {departmentOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  Income Heads
                </p>
                <select
                  multiple
                  value={revenueIncomeHeadIds}
                  onChange={(event) =>
                    setRevenueIncomeHeadIds(
                      Array.from(event.target.selectedOptions).map(
                        (option) => option.value,
                      ),
                    )
                  }
                  className="h-28 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  {incomeHeadOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  Agents
                </p>
                <select
                  multiple
                  value={revenueAgentIds}
                  onChange={(event) =>
                    setRevenueAgentIds(
                      Array.from(event.target.selectedOptions).map(
                        (option) => option.value,
                      ),
                    )
                  }
                  className="h-28 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
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
                  value={revenuePaymentMethod}
                  onChange={(event) =>
                    setRevenuePaymentMethod(
                      event.target.value as AdminReportPaymentType | "all",
                    )
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="all">All Methods</option>
                  <option value="cash">Cash</option>
                  <option value="transfer">Transfer</option>
                  <option value="pos">POS</option>
                </select>
              </div>
            </div>
          ) : null}

          {dateRangeIsInvalid ? (
            <p className="mt-3 text-sm text-red-600 dark:text-red-300">
              Start date and end date must be provided together.
            </p>
          ) : null}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!hospitalId || dateRangeIsInvalid}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Generate Report
            </button>
          </div>
        </div>

        <FoReportsSummaryCards
          isLoading={reportQuery.isLoading}
          totalRevenue={stats.totalRevenue}
          totalTransactions={stats.totalTransactions}
          averageTransaction={stats.averageTransaction}
        />

        {rows.length > 0 ? (
          <FoReportsCharts
            revenueTrendData={revenueTrend}
            paymentMethodSummary={paymentBreakdown}
            departmentRevenue={departmentBreakdown}
            topAgents={topAgents}
          />
        ) : null}

        <FoReportsRevenueBreakdownTable rows={revenueBreakdownRows} />

        {rows.length > 0 ? (
          <FoReportsTransactionsTable rows={rows} toMethodLabel={toMethodLabel} />
        ) : null}

        {revenuePagination ? (
          <AdminPaginationFooter
            currentPage={revenuePagination.current_page}
            totalPages={revenuePagination.total_pages}
            hasPrevious={revenuePagination.has_previous}
            hasNext={revenuePagination.has_next}
            onPrevious={() =>
              setApplied((current) => ({
                ...current,
                page: Math.max(current.page - 1, 1),
              }))
            }
            onNext={() =>
              setApplied((current) => ({
                ...current,
                page: current.page + 1,
              }))
            }
          />
        ) : null}
      </div>
    </div>
  );
}
