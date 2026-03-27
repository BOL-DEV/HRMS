"use client";

import FoReportsCharts from "@/components/FoReportsCharts";
import FoReportsFilterPanel from "@/components/FoReportsFilterPanel";
import FoReportsRevenueBreakdownTable from "@/components/FoReportsRevenueBreakdownTable";
import FoReportsSummaryCards from "@/components/FoReportsSummaryCards";
import FoReportsTransactionsTable from "@/components/FoReportsTransactionsTable";
import Header from "@/components/Header";
import { ApiError } from "@/libs/api";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import { getFoAgents, getFoReports } from "@/libs/fo-auth";
import { formatDateTime } from "@/libs/helper";
import { FoReportPaymentType } from "@/libs/type";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FiDownload } from "react-icons/fi";

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

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
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
  const [billDescription, setBillDescription] = useState("All");
  const [appliedFilters, setAppliedFilters] = useState({
    startDate: getRelativeDate(-6),
    endDate: getRelativeDate(0),
    department: "All",
    agent: "All",
  });

  const agentsQuery = useQuery({
    queryKey: ["fo-agents-options"],
    queryFn: () => getFoAgents(),
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
        agents:
          appliedFilters.agent === "All" ? undefined : [appliedFilters.agent],
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
          : null;

    if (!error) {
      return;
    }

    if (error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
    }
  }, [agentsQuery.error, reportsQuery.error, router]);

  const detailedReport = useMemo(
    () => reportsQuery.data?.data.detailed_report ?? [],
    [reportsQuery.data?.data.detailed_report],
  );

  const filteredTransactions = useMemo(
    () =>
      detailedReport.filter((item) => {
        const matchesPayment =
          paymentMethod === "All"
            ? true
            : toMethodLabel(item.payment_type) === paymentMethod;
        const matchesBill =
          billDescription === "All"
            ? true
            : item.bill_description === billDescription;

        return matchesPayment && matchesBill;
      }),
    [billDescription, detailedReport, paymentMethod],
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
      const day = item.created_at.slice(0, 10);
      grouped.set(day, (grouped.get(day) ?? 0) + item.amount);
    });

    return [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, value]) => ({ label, value }));
  }, [filteredTransactions]);

  const paymentMethodSummary = useMemo(() => {
    const grouped = new Map<PaymentMethod, number>();

    filteredTransactions.forEach((item) => {
      const label = toMethodLabel(item.payment_type);
      grouped.set(label, (grouped.get(label) ?? 0) + item.amount);
    });

    return [...grouped.entries()].map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  const departmentRevenue = useMemo(() => {
    const grouped = new Map<string, number>();

    filteredTransactions.forEach((item) => {
      grouped.set(
        item.department_name,
        (grouped.get(item.department_name) ?? 0) + item.amount,
      );
    });

    return [...grouped.entries()].map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  const topAgents = useMemo(() => {
    const grouped = new Map<string, number>();

    filteredTransactions.forEach((item) => {
      grouped.set(
        item.agent_name,
        (grouped.get(item.agent_name) ?? 0) + item.amount,
      );
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
      const key = `${item.bill_description}::${item.department_name}`;
      const current = grouped.get(key);

      if (current) {
        current.transactions += 1;
        current.totalRevenue += item.amount;
        return;
      }

      grouped.set(key, {
        revenueHead: item.bill_description,
        department: item.department_name,
        transactions: 1,
        totalRevenue: item.amount,
      });
    });

    return [...grouped.values()].sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredTransactions]);

  const departmentOptions = useMemo(
    () =>
      (reportsQuery.data?.data.breakdowns.by_department ?? []).map((item) => ({
        id: item.department_id,
        name: item.department_name,
      })),
    [reportsQuery.data?.data.breakdowns.by_department],
  );

  const agentOptions = useMemo(
    () =>
      (agentsQuery.data?.data.agents ?? []).map((item) => ({
        id: item.agent_id,
        name: item.agent_name,
      })),
    [agentsQuery.data?.data.agents],
  );

  const billDescriptionOptions = useMemo(
    () =>
      Array.from(new Set(detailedReport.map((item) => item.bill_description))).sort(
        (a, b) => a.localeCompare(b),
      ),
    [detailedReport],
  );

  const handleGenerateReport = () => {
    setAppliedFilters({
      startDate,
      endDate,
      department,
      agent,
    });
  };

  const handleExportCsv = () => {
    const rows = [
      [
        "Receipt No",
        "Patient",
        "Phone Number",
        "Amount",
        "Department",
        "Bill Description",
        "Payment Method",
        "Agent",
        "Created At",
      ],
      ...filteredTransactions.map((item) => [
        item.receipt_no,
        item.patient_name,
        item.phone_number,
        item.amount,
        item.department_name,
        item.bill_description,
        toMethodLabel(item.payment_type),
        item.agent_name,
        formatDateTime(item.created_at),
      ]),
    ];

    downloadCsv("fo-report.csv", rows);
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-slate-950">
      <Header
        title="Reports"
        Subtitle="Analyze hospital revenue and transaction performance"
        actions={
          <button
            onClick={handleExportCsv}
            className="hidden md:inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FiDownload />
            Export Report
          </button>
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

        <FoReportsFilterPanel
          startDate={startDate}
          endDate={endDate}
          department={department}
          paymentMethod={paymentMethod}
          agent={agent}
          billDescription={billDescription}
          departmentOptions={departmentOptions}
          agentOptions={agentOptions}
          billDescriptionOptions={billDescriptionOptions}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onDepartmentChange={setDepartment}
          onPaymentMethodChange={setPaymentMethod}
          onAgentChange={setAgent}
          onBillDescriptionChange={setBillDescription}
          onGenerateReport={handleGenerateReport}
        />

        <FoReportsSummaryCards
          isLoading={reportsQuery.isLoading}
          totalRevenue={stats.totalRevenue}
          totalTransactions={stats.totalTransactions}
          averageTransaction={stats.avgTransaction}
        />

        <FoReportsCharts
          revenueTrendData={revenueTrendData}
          paymentMethodSummary={paymentMethodSummary}
          departmentRevenue={departmentRevenue}
          topAgents={topAgents}
        />

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
