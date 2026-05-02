"use client";

import FoPatientReportTable from "@/components/FoPatientReportTable";
import FoReportsRevenueBreakdownTable from "@/components/FoReportsRevenueBreakdownTable";
import FoReportsSummaryCards from "@/components/FoReportsSummaryCards";
import FoReportsTransactionsTable from "@/components/FoReportsTransactionsTable";
import Header from "@/components/Header";
import { FiDownload, FiPrinter } from "react-icons/fi";
import type {
  AdminHospitalAgentReportGroupedItem,
  AdminHospitalAgentReportResponse,
  AdminHospitalDepartmentReportGroupedItem,
  AdminHospitalDepartmentReportResponse,
  AdminHospitalPatientReportResponse,
  AdminReportPaymentType,
  AdminReportTransactionItem,
} from "@/libs/type";

type Option = {
  id: string;
  name: string;
};

type HospitalOption = {
  hospital_id: string;
  hospital_name: string;
};

type WorkspaceMode = "patient" | "department" | "agent";

type Props = {
  mode: WorkspaceMode;
  title: string;
  subtitle: string;
  hospitalId: string;
  onHospitalChange: (value: string) => void;
  hospitalOptions: HospitalOption[];
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
  onViewAllReports?: () => void;
  onExport?: () => void;
  onPrint?: () => void;
  errorMessage?: string | null;
  isLoading?: boolean;
  data?:
    | AdminHospitalPatientReportResponse["data"]
    | AdminHospitalDepartmentReportResponse["data"]
    | AdminHospitalAgentReportResponse["data"];
};

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getTodayRange() {
  const today = formatDate(new Date());
  return { start: today, end: today };
}

function getLastSevenDaysRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);

  return {
    start: formatDate(start),
    end: formatDate(end),
  };
}

function getThisMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    start: formatDate(start),
    end: formatDate(now),
  };
}

function toMethodLabel(value: AdminReportPaymentType): "Cash" | "Transfer" | "POS" {
  if (value === "cash") return "Cash";
  if (value === "transfer") return "Transfer";
  return "POS";
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

function buildGroupedRows(
  mode: "department" | "agent",
  data?: AdminHospitalDepartmentReportResponse["data"] | AdminHospitalAgentReportResponse["data"],
) {
  if (!data || data.transactions?.length) {
    return [];
  }

  if (mode === "department") {
    return ((data.report as AdminHospitalDepartmentReportGroupedItem[] | undefined) ?? []).map(
      (item) => ({
        revenueHead: item.department,
        department: item.department,
        transactions: item.count,
        totalRevenue: item.amount,
      }),
    );
  }

  return ((data.report as AdminHospitalAgentReportGroupedItem[] | undefined) ?? []).map(
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
  rows: AdminReportTransactionItem[],
) {
  if (!data) {
    return {
      totalRevenue: 0,
      totalTransactions: 0,
    };
  }

  if (mode === "patient") {
    const summary = (data as AdminHospitalPatientReportResponse["data"]).summary;
    return {
      totalRevenue: summary.total_bill_amount,
      totalTransactions: summary.transaction_count,
    };
  }

  const summary = data.summary as Record<string, unknown>;
  return {
    totalRevenue: Number(summary.total_amount ?? summary.amount ?? 0),
    totalTransactions: Number(summary.total_count ?? summary.count ?? rows.length),
  };
}

function extractTransactions(
  mode: WorkspaceMode,
  data?: Props["data"],
): AdminReportTransactionItem[] {
  if (!data) {
    return [];
  }

  if (mode === "patient") {
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

  return (
    (data as AdminHospitalDepartmentReportResponse["data"] | AdminHospitalAgentReportResponse["data"])
      .transactions ?? []
  );
}

function AdminScopedReportWorkspace({
  mode,
  title,
  subtitle,
  hospitalId,
  onHospitalChange,
  hospitalOptions,
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
  onViewAllReports,
  onExport,
  onPrint,
  errorMessage,
  isLoading = false,
  data,
}: Props) {
  const rows = extractTransactions(mode, data);
  const patientRows =
    mode === "patient"
      ? (data as AdminHospitalPatientReportResponse["data"] | undefined)?.report ?? []
      : [];
  const stats = buildWorkspaceStats(mode, data, rows);
  const groupedRows =
    mode === "patient"
      ? []
      : buildGroupedRows(
          mode,
          data as AdminHospitalDepartmentReportResponse["data"] | AdminHospitalAgentReportResponse["data"],
        );
  const revenueBreakdownRows =
    rows.length > 0 ? buildRevenueBreakdownTable(rows) : groupedRows;
  const dateRangeIsInvalid =
    Boolean(startDate && endDate && startDate > endDate);

  const applyRange = (range: { start: string; end: string }) => {
    onStartDateChange(range.start);
    onEndDateChange(range.end);
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-slate-950">
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

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="grid min-w-70 flex-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  Hospital
                </p>
                <select
                  value={hospitalId}
                  onChange={(event) => onHospitalChange(event.target.value)}
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
                  {filterLabel}
                </p>
                {filterType === "select" ? (
                  <select
                    value={filterValue}
                    onChange={(event) => onFilterChange(event.target.value)}
                    disabled={isFilterLoading || !hospitalId}
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
                    disabled={!hospitalId}
                    inputMode={mode === "patient" ? "numeric" : undefined}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => applyRange(getTodayRange())}
                className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-500/50 dark:hover:bg-slate-800 dark:hover:text-blue-200"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => applyRange(getLastSevenDaysRange())}
                className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-500/50 dark:hover:bg-slate-800 dark:hover:text-blue-200"
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => applyRange(getThisMonthRange())}
                className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-500/50 dark:hover:bg-slate-800 dark:hover:text-blue-200"
              >
                This Month
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="flex items-end">
              <div className="flex w-full flex-col gap-2 sm:flex-row">
                {onViewAllReports ? (
                  <button
                    type="button"
                    onClick={onViewAllReports}
                    disabled={!hospitalId}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    View All
                  </button>
                ) : null}
              </div>
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
          </div>

          {dateRangeIsInvalid ? (
            <p className="mt-3 text-sm text-red-600 dark:text-red-300">
              Start date and end date must be provided together, and the start date cannot be after the end date.
            </p>
          ) : null}
        </div>

        <FoReportsSummaryCards
          isLoading={isLoading}
          totalRevenue={stats.totalRevenue}
          totalTransactions={stats.totalTransactions}
        />

        <FoReportsRevenueBreakdownTable rows={revenueBreakdownRows} />

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

export default AdminScopedReportWorkspace;
