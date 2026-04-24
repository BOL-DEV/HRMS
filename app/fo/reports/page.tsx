"use client";

import FoReportsCharts from "@/components/FoReportsCharts";
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
import { FoReportPaymentType } from "@/libs/type";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FiDownload, FiPrinter } from "react-icons/fi";
import { toast } from "react-hot-toast";

type PaymentMethod = "Cash" | "Transfer" | "POS";

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getRelativeDate(daysFromToday: number) {
  const today = new Date();
  today.setDate(today.getDate() + daysFromToday);
  return formatDateOnly(today);
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

function Page() {
  const router = useRouter();
  const accessToken = getAccessToken();

  const [startDate, setStartDate] = useState(() => getRelativeDate(-6));
  const [endDate, setEndDate] = useState(() => getRelativeDate(0));
  const [department, setDepartment] = useState("All");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "All">(
    "All",
  );
  const [agent, setAgent] = useState("All");
  const [incomeHead, setIncomeHead] = useState("All");
  const [appliedFilters, setAppliedFilters] = useState({
    startDate: getRelativeDate(-6),
    endDate: getRelativeDate(0),
    department: "All",
    paymentMethod: "All" as PaymentMethod | "All",
    agent: "All",
    incomeHead: "All",
  });

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
    queryKey: ["fo-reports", appliedFilters],
    queryFn: () =>
      getFoReports({
        startDate: appliedFilters.startDate,
        endDate: appliedFilters.endDate,
        departments:
          appliedFilters.department === "All"
            ? undefined
            : [appliedFilters.department],
        incomeHeads:
          appliedFilters.incomeHead === "All"
            ? undefined
            : [appliedFilters.incomeHead],
        agents:
          appliedFilters.agent === "All" ? undefined : [appliedFilters.agent],
        paymentMethod: toMethodParam(appliedFilters.paymentMethod),
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

  const filteredTransactions = useMemo(
    () =>
      detailedReport.filter((item) => {
        const matchesPayment =
          paymentMethod === "All"
            ? true
            : toMethodLabel(item.payment_method) === paymentMethod;

        return matchesPayment;
      }),
    [detailedReport, paymentMethod],
  );

  const stats = useMemo(() => {
    const totalRevenue = filteredTransactions.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
    const totalTransactions = filteredTransactions.length;
    const avgTransaction = totalTransactions
      ? totalRevenue / totalTransactions
      : 0;

    return {
      totalRevenue,
      totalTransactions,
      avgTransaction,
    };
  }, [filteredTransactions]);

  const revenueTrendData = useMemo(() => {
    const grouped = new Map<string, number>();

    filteredTransactions.forEach((item) => {
      const day = item.date_time.slice(0, 10);
      grouped.set(day, (grouped.get(day) ?? 0) + item.amount);
    });

    return [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, value]) => ({ label, value }));
  }, [filteredTransactions]);

  const paymentMethodSummary = useMemo(() => {
    const grouped = new Map<PaymentMethod, number>();

    filteredTransactions.forEach((item) => {
      const label = toMethodLabel(item.payment_method);
      grouped.set(label, (grouped.get(label) ?? 0) + item.amount);
    });

    return [...grouped.entries()].map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  const departmentRevenue = useMemo(() => {
    const grouped = new Map<string, number>();

    filteredTransactions.forEach((item) => {
      grouped.set(
        item.department,
        (grouped.get(item.department) ?? 0) + item.amount,
      );
    });

    return [...grouped.entries()].map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  const topAgents = useMemo(() => {
    const grouped = new Map<string, number>();

    filteredTransactions.forEach((item) => {
      grouped.set(item.agent, (grouped.get(item.agent) ?? 0) + item.amount);
    });

    return [...grouped.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const breakdownTable = useMemo(() => {
    const grouped = new Map<
      string,
      {
        revenueHead: string;
        department: string;
        transactions: number;
        totalRevenue: number;
      }
    >();

    filteredTransactions.forEach((item) => {
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
  }, [filteredTransactions]);

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

  const handleGenerateReport = () => {
    setAppliedFilters({
      startDate,
      endDate,
      department,
      paymentMethod,
      agent,
      incomeHead,
    });
  };

  const handleExportCsv = () => {
    exportFoReportsCsv({
      startDate: appliedFilters.startDate,
      endDate: appliedFilters.endDate,
      departments:
        appliedFilters.department === "All"
          ? undefined
          : [appliedFilters.department],
      incomeHeads:
        appliedFilters.incomeHead === "All"
          ? undefined
          : [appliedFilters.incomeHead],
      agents:
        appliedFilters.agent === "All" ? undefined : [appliedFilters.agent],
      paymentMethod: toMethodParam(appliedFilters.paymentMethod),
      page: 1,
      limit: 15,
    }).catch((error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to export report.",
      );
    });
  };

  const handlePrintReport = () => {
    printFoReports({
      startDate: appliedFilters.startDate,
      endDate: appliedFilters.endDate,
      departments:
        appliedFilters.department === "All"
          ? undefined
          : [appliedFilters.department],
      incomeHeads:
        appliedFilters.incomeHead === "All"
          ? undefined
          : [appliedFilters.incomeHead],
      agents:
        appliedFilters.agent === "All" ? undefined : [appliedFilters.agent],
      paymentMethod: toMethodParam(appliedFilters.paymentMethod),
      page: 1,
      limit: 15,
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
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onDepartmentChange={(value) => {
            setDepartment(value);
            setIncomeHead("All");
          }}
          onPaymentMethodChange={setPaymentMethod}
          onAgentChange={setAgent}
          onIncomeHeadChange={setIncomeHead}
          onGenerateReport={handleGenerateReport}
        />

        <FoReportsSummaryCards
          isLoading={reportsQuery.isLoading}
          totalRevenue={stats.totalRevenue}
          totalTransactions={stats.totalTransactions}
          averageTransaction={stats.avgTransaction}
        />

        {filteredTransactions.length > 0 ? (
          <FoReportsCharts
            revenueTrendData={revenueTrendData}
            paymentMethodSummary={paymentMethodSummary}
            departmentRevenue={departmentRevenue}
            topAgents={topAgents}
          />
        ) : null}

        <FoReportsRevenueBreakdownTable rows={breakdownTable} />

        <FoReportsTransactionsTable
          rows={filteredTransactions}
          toMethodLabel={toMethodLabel}
        />
      </div>
    </div>
  );
}

export default Page;
