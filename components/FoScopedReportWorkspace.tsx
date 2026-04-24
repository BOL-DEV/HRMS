"use client";

import FoReportsCharts from "@/components/FoReportsCharts";
import FoPatientReportTable from "@/components/FoPatientReportTable";
import FoReportsRevenueBreakdownTable from "@/components/FoReportsRevenueBreakdownTable";
import FoReportsSummaryCards from "@/components/FoReportsSummaryCards";
import FoReportsTransactionsTable from "@/components/FoReportsTransactionsTable";
import Header from "@/components/Header";
import { FiDownload, FiPrinter } from "react-icons/fi";
import type {
  FoAgentReportGroupedItem,
  FoAgentReportResponse,
  FoDepartmentReportGroupedItem,
  FoDepartmentReportResponse,
  FoPatientReportResponse,
  FoPatientReportTransaction,
  FoReportPaymentType,
  FoTransactionItem,
} from "@/libs/type";

type Option = {
  id: string;
  name: string;
};

type WorkspaceMode = "patient" | "department" | "agent";

type Props = {
  mode: WorkspaceMode;
  title: string;
  subtitle: string;
  filterLabel: string;
  filterValue: string;
  onFilterChange: (value: string) => void;
  filterType?: "input" | "select";
  filterOptions?: Option[];
  filterPlaceholder?: string;
  isFilterLoading?: boolean;
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onGenerate: () => void;
  onExport?: () => void;
  onPrint?: () => void;
  errorMessage?: string | null;
  isLoading?: boolean;
  data?:
    | FoPatientReportResponse["data"]
    | FoDepartmentReportResponse["data"]
    | FoAgentReportResponse["data"];
};

function toMethodLabel(value: FoReportPaymentType): "Cash" | "Transfer" | "POS" {
  if (value === "cash") return "Cash";
  if (value === "transfer") return "Transfer";
  return "POS";
}

function toTransactionItem(
  row: Record<string, unknown>,
  index: number,
): FoTransactionItem {
  return {
    transaction_id: String(
      row.transaction_id ?? row.receipt_id ?? row.date_time ?? `row-${index}`,
    ),
    date_time: String(row.date_time ?? ""),
    receipt_id: String(row.receipt_id ?? row.receipt_no ?? "-"),
    patient_id: String(row.patient_id ?? "-"),
    patient_name: String(row.patient_name ?? "-"),
    department: String(row.department ?? "-"),
    income_head: String(row.income_head ?? "-"),
    bill_name: String(row.bill_name ?? "-"),
    payment_method:
      row.payment_method === "transfer"
        ? "transfer"
        : row.payment_method === "pos"
          ? "pos"
          : "cash",
    amount: Number(row.amount ?? 0),
    agent: String(row.agent ?? row.agent_name ?? "-"),
  };
}

function extractTransactions(
  mode: WorkspaceMode,
  data?: Props["data"],
): FoTransactionItem[] {
  if (!data) {
    return [];
  }

  if (mode === "patient") {
    const patientData = data as FoPatientReportResponse["data"];
    return patientData.report.map((item, index) =>
      toTransactionItem(item as unknown as Record<string, unknown>, index),
    );
  }

  if (Array.isArray((data as FoDepartmentReportResponse["data"]).transactions)) {
    return (data as FoDepartmentReportResponse["data"]).transactions ?? [];
  }

  if (Array.isArray((data as FoAgentReportResponse["data"]).transactions)) {
    return (data as FoAgentReportResponse["data"]).transactions ?? [];
  }

  return [];
}

function extractPatientRows(data?: Props["data"]): FoPatientReportTransaction[] {
  if (!data) {
    return [];
  }

  return (data as FoPatientReportResponse["data"]).report ?? [];
}

function buildGroupedRows(
  mode: "department" | "agent",
  data?: FoDepartmentReportResponse["data"] | FoAgentReportResponse["data"],
) {
  if (!data || data.transactions?.length) {
    return [];
  }

  if (mode === "department") {
    return ((data.report as FoDepartmentReportGroupedItem[] | undefined) ?? []).map(
      (item) => ({
        revenueHead: mode === "department" ? item.department : "Department",
        department: item.department,
        transactions: item.count,
        totalRevenue: item.amount,
      }),
    );
  }

  return ((data.report as FoAgentReportGroupedItem[] | undefined) ?? []).map(
    (item) => ({
      revenueHead: item.agent,
      department: "All Departments",
      transactions: item.count,
      totalRevenue: item.amount,
    }),
  );
}

function buildWorkspaceStats(
  mode: WorkspaceMode,
  data: Props["data"],
  rows: FoTransactionItem[],
) {
  if (!data) {
    return {
      totalRevenue: 0,
      totalTransactions: 0,
      averageTransaction: 0,
    };
  }

  if (mode === "patient") {
    const summary = (data as FoPatientReportResponse["data"]).summary;
    return {
      totalRevenue: summary.total_bill_amount,
      totalTransactions: summary.transaction_count,
      averageTransaction: summary.transaction_count
        ? summary.total_bill_amount / summary.transaction_count
        : 0,
    };
  }

  const summary = data.summary as Record<string, unknown>;
  const totalRevenue = Number(summary.total_amount ?? summary.amount ?? 0);
  const totalTransactions = Number(summary.total_count ?? summary.count ?? rows.length);

  return {
    totalRevenue,
    totalTransactions,
    averageTransaction: totalTransactions ? totalRevenue / totalTransactions : 0,
  };
}

function buildRevenueTrend(rows: FoTransactionItem[]) {
  const grouped = new Map<string, number>();

  rows.forEach((item) => {
    const key = item.date_time.slice(0, 10);
    grouped.set(key, (grouped.get(key) ?? 0) + item.amount);
  });

  return [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, value]) => ({ label, value }));
}

function buildPaymentBreakdown(rows: FoTransactionItem[]) {
  const grouped = new Map<string, number>();

  rows.forEach((item) => {
    const label = toMethodLabel(item.payment_method);
    grouped.set(label, (grouped.get(label) ?? 0) + item.amount);
  });

  return [...grouped.entries()].map(([name, value]) => ({ name, value }));
}

function buildDepartmentBreakdown(rows: FoTransactionItem[]) {
  const grouped = new Map<string, number>();

  rows.forEach((item) => {
    grouped.set(item.department, (grouped.get(item.department) ?? 0) + item.amount);
  });

  return [...grouped.entries()].map(([name, value]) => ({ name, value }));
}

function buildTopAgents(rows: FoTransactionItem[]) {
  const grouped = new Map<string, number>();

  rows.forEach((item) => {
    grouped.set(item.agent, (grouped.get(item.agent) ?? 0) + item.amount);
  });

  return [...grouped.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function buildRevenueBreakdownTable(rows: FoTransactionItem[]) {
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

function FoScopedReportWorkspace({
  mode,
  title,
  subtitle,
  filterLabel,
  filterValue,
  onFilterChange,
  filterType = "input",
  filterOptions = [],
  filterPlaceholder,
  isFilterLoading = false,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onGenerate,
  onExport,
  onPrint,
  errorMessage,
  isLoading = false,
  data,
}: Props) {
  const rows = extractTransactions(mode, data);
  const patientRows = mode === "patient" ? extractPatientRows(data) : [];
  const stats = buildWorkspaceStats(mode, data, rows);
  const revenueTrend = buildRevenueTrend(rows);
  const paymentBreakdown = buildPaymentBreakdown(rows);
  const departmentBreakdown = buildDepartmentBreakdown(rows);
  const topAgents = buildTopAgents(rows);
  const groupedRows =
    mode === "patient"
      ? []
      : buildGroupedRows(mode, data as FoDepartmentReportResponse["data"] | FoAgentReportResponse["data"]);
  const revenueBreakdownTable =
    rows.length > 0 ? buildRevenueBreakdownTable(rows) : groupedRows;

  return (
    <div className="min-h-screen w-full bg-white dark:bg-slate-950">
      <Header
        title={title}
        Subtitle={subtitle}
        actions={
          <div className="hidden items-center gap-2 md:flex">
            {onPrint ? (
              <button
                type="button"
                onClick={onPrint}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <FiPrinter />
                Print
              </button>
            ) : null}
            {onExport ? (
              <button
                type="button"
                onClick={onExport}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <FiDownload />
                Export CSV
              </button>
            ) : null}
          </div>
        }
      />

      <div className="space-y-6 p-6">
        {errorMessage ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {errorMessage}
          </div>
        ) : null}

        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                {filterLabel}
              </p>
              {filterType === "select" ? (
                <select
                  value={filterValue}
                  onChange={(event) => onFilterChange(event.target.value)}
                  disabled={isFilterLoading}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="All">All</option>
                  {filterOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={filterValue}
                  onChange={(event) => onFilterChange(event.target.value)}
                  placeholder={filterPlaceholder}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              )}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Start Date
              </p>
              <input
                type="date"
                value={startDate}
                onChange={(event) => onStartDateChange(event.target.value)}
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
                onChange={(event) => onEndDateChange(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={onGenerate}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>

        <FoReportsSummaryCards
          isLoading={isLoading}
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

        <FoReportsRevenueBreakdownTable rows={revenueBreakdownTable} />

        {mode === "patient" && patientRows.length > 0 ? (
          <FoPatientReportTable rows={patientRows} />
        ) : null}

        {mode !== "patient" && rows.length > 0 ? (
          <FoReportsTransactionsTable rows={rows} toMethodLabel={toMethodLabel} />
        ) : null}
      </div>
    </div>
  );
}

export default FoScopedReportWorkspace;
