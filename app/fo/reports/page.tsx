"use client";

import AdminPaginationFooter from "@/components/AdminPaginationFooter";
import FoReportsFilterPanel from "@/components/FoReportsFilterPanel";
import FoReportsRevenueBreakdownTable from "@/components/FoReportsRevenueBreakdownTable";
import FoReportsSummaryCards from "@/components/FoReportsSummaryCards";
import FoReportsTransactionsTable from "@/components/FoReportsTransactionsTable";
import Header from "@/components/Header";
import { ApiError } from "@/libs/api";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import {
  exportFoReportsCsv,
  getFoAgents,
  getFoDepartments,
  getFoIncomeHeads,
  getFoReports,
  printFoReports,
} from "@/libs/fo-auth";
import { FoReportPaymentType, FoTransactionItem } from "@/libs/type";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FiDownload, FiPrinter } from "react-icons/fi";
import { toast } from "react-hot-toast";

type PaymentMethod = "Cash" | "Transfer" | "POS";
const REPORTS_PER_PAGE = 15;

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function toMethodLabel(value: FoReportPaymentType): PaymentMethod {
  if (value === "cash") return "Cash";
  if (value === "transfer") return "Transfer";
  return "POS";
}

function toMethodParam(
  value: PaymentMethod | "All",
): FoReportPaymentType | undefined {
  if (value === "Cash") return "cash";
  if (value === "Transfer") return "transfer";
  if (value === "POS") return "pos";
  return undefined;
}

function buildRevenueBreakdownTable(
  rows: FoTransactionItem[],
) {
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

function Page() {
  const router = useRouter();
  const accessToken = getAccessToken();
  const today = getTodayDate();

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [department, setDepartment] = useState("All");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "All">(
    "All",
  );
  const [agent, setAgent] = useState("All");
  const [incomeHead, setIncomeHead] = useState("All");
  const [page, setPage] = useState(1);

  const agentsQuery = useQuery({
    queryKey: ["fo-agents-options"],
    queryFn: () => getFoAgents(),
    enabled: Boolean(accessToken),
  });

  const departmentsQuery = useQuery({
    queryKey: ["fo-departments-options"],
    queryFn: () => getFoDepartments(),
    enabled: Boolean(accessToken),
  });

  const incomeHeadsQuery = useQuery({
    queryKey: ["fo-income-heads-options", department],
    queryFn: () =>
      getFoIncomeHeads({
        departmentId: department === "All" ? undefined : department,
      }),
    enabled: Boolean(accessToken),
  });

  const reportsQuery = useQuery({
    queryKey: [
      "fo-reports",
      startDate,
      endDate,
      !startDate && !endDate,
      department,
      paymentMethod,
      agent,
      incomeHead,
      page,
    ],
    queryFn: () =>
      getFoReports({
        startDate,
        endDate,
        showAll: !startDate && !endDate,
        departments:
          department === "All" ? undefined : [department],
        incomeHeads:
          incomeHead === "All" ? undefined : [incomeHead],
        agents: agent === "All" ? undefined : [agent],
        paymentMethod: toMethodParam(paymentMethod),
        page,
        limit: REPORTS_PER_PAGE,
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
      reportsQuery.error instanceof ApiError
        ? reportsQuery.error
        : agentsQuery.error instanceof ApiError
          ? agentsQuery.error
          : departmentsQuery.error instanceof ApiError
            ? departmentsQuery.error
            : incomeHeadsQuery.error instanceof ApiError
              ? incomeHeadsQuery.error
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
    reportsQuery.error,
    router,
  ]);

  const detailedReport = useMemo(
    () => reportsQuery.data?.data.transactions ?? [],
    [reportsQuery.data?.data.transactions],
  );
  const reportSummary = reportsQuery.data?.data.summary;
  const pagination = reportsQuery.data?.data.pagination;
  const revenueBreakdownRows = useMemo(
    () => buildRevenueBreakdownTable(detailedReport),
    [detailedReport],
  );

  const departmentOptions = useMemo(
    () =>
      (departmentsQuery.data?.data.departments ?? []).map((item) => ({
        id: item.department_id,
        name: item.name,
      })),
    [departmentsQuery.data?.data.departments],
  );

  const agentOptions = useMemo(
    () =>
      (agentsQuery.data?.data.agents ?? []).map((item) => ({
        id: item.agent_id,
        name: item.agent_name,
      })),
    [agentsQuery.data?.data.agents],
  );

  const incomeHeadOptions = useMemo(
    () =>
      (incomeHeadsQuery.data?.data.income_heads ?? []).map((item) => ({
        id: item.income_head_id,
        name: item.name,
      })),
    [incomeHeadsQuery.data?.data.income_heads],
  );

  const dateRangeIsInvalid = Boolean(
    startDate && endDate && startDate > endDate,
  );

  const resetToFirstPage = () => setPage(1);

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    resetToFirstPage();
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    resetToFirstPage();
  };

  const handleDepartmentChange = (value: string) => {
    setDepartment(value);
    setIncomeHead("All");
    resetToFirstPage();
  };

  const handlePaymentMethodChange = (value: PaymentMethod | "All") => {
    setPaymentMethod(value);
    resetToFirstPage();
  };

  const handleAgentChange = (value: string) => {
    setAgent(value);
    resetToFirstPage();
  };

  const handleIncomeHeadChange = (value: string) => {
    setIncomeHead(value);
    resetToFirstPage();
  };

  const handleViewAllReports = () => {
    setStartDate("");
    setEndDate("");
    resetToFirstPage();
  };

  const handleExportCsv = () => {
    exportFoReportsCsv({
      startDate,
      endDate,
      showAll: !startDate && !endDate,
      departments:
        department === "All" ? undefined : [department],
      incomeHeads: incomeHead === "All" ? undefined : [incomeHead],
      agents: agent === "All" ? undefined : [agent],
      paymentMethod: toMethodParam(paymentMethod),
    }).catch((error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to export report.",
      );
    });
  };

  const handlePrintReport = () => {
    printFoReports({
      startDate,
      endDate,
      showAll: !startDate && !endDate,
      departments:
        department === "All" ? undefined : [department],
      incomeHeads: incomeHead === "All" ? undefined : [incomeHead],
      agents: agent === "All" ? undefined : [agent],
      paymentMethod: toMethodParam(paymentMethod),
    }).catch((error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to print report.",
      );
    });
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-slate-950">
      <Header
        title="Reports"
        Subtitle="Analyze hospital revenue and transaction performance"
        actions={
          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={handlePrintReport}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <FiPrinter />
              Print
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <FiDownload />
              Export Report
            </button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {reportsQuery.error instanceof Error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {reportsQuery.error.message}
          </div>
        ) : null}

        {agentsQuery.error instanceof Error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {agentsQuery.error.message}
          </div>
        ) : null}

        {departmentsQuery.error instanceof Error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {departmentsQuery.error.message}
          </div>
        ) : null}

        {incomeHeadsQuery.error instanceof Error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {incomeHeadsQuery.error.message}
          </div>
        ) : null}

        {dateRangeIsInvalid ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
            Start date cannot be after the end date.
          </div>
        ) : null}

        <FoReportsFilterPanel
          startDate={startDate}
          endDate={endDate}
          department={department}
          paymentMethod={paymentMethod}
          agent={agent}
          incomeHead={incomeHead}
          departmentOptions={departmentOptions}
          agentOptions={agentOptions}
          incomeHeadOptions={incomeHeadOptions}
          onStartDateChange={handleStartDateChange}
          onEndDateChange={handleEndDateChange}
          onDepartmentChange={handleDepartmentChange}
          onPaymentMethodChange={handlePaymentMethodChange}
          onAgentChange={handleAgentChange}
          onIncomeHeadChange={handleIncomeHeadChange}
          onViewAllReports={handleViewAllReports}
        />

        <FoReportsSummaryCards
          isLoading={reportsQuery.isLoading}
          totalRevenue={reportSummary?.total_amount ?? 0}
          totalTransactions={reportSummary?.total_transactions ?? 0}
        />

        <FoReportsRevenueBreakdownTable
          rows={revenueBreakdownRows}
          title="Detailed Revenue Breakdown"
          emptyMessage="No revenue breakdown available for the current filters."
        />

        <FoReportsTransactionsTable
          rows={detailedReport}
          toMethodLabel={toMethodLabel}
        />

        {pagination ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              Showing {detailedReport.length} transaction
              {detailedReport.length === 1 ? "" : "s"} on this page. Total
              matching transactions:{" "}
              {reportSummary?.total_transactions ??
                pagination.total_transactions}
              .
            </div>
            <div className="rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
              <AdminPaginationFooter
                currentPage={pagination.current_page}
                totalPages={pagination.total_pages}
                hasPrevious={pagination.has_previous}
                hasNext={pagination.has_next}
                onPrevious={() =>
                  setPage((current) => Math.max(current - 1, 1))
                }
                onNext={() =>
                  setPage((current) =>
                    Math.min(current + 1, pagination.total_pages),
                  )
                }
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default Page;
