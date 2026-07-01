"use client";
import FoPatientReportTable from "@/components/fo/FoPatientReportTable";
import FoReportsRevenueBreakdownTable from "@/components/fo/FoReportsRevenueBreakdownTable";
import FoReportsSummaryCards from "@/components/fo/FoReportsSummaryCards";
import FoReportsTransactionsTable from "@/components/fo/FoReportsTransactionsTable";
import Header from "@/components/shared/Header";
import AdminPaginationFooter from "@/components/admin/AdminPaginationFooter";
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

type SearchSelectOption = {
  id: string;
  name: string;
  description?: string;
};

type WorkspaceMode = "patient" | "department" | "agent";

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

type Props = {
  mode: WorkspaceMode;
  title: string;
  subtitle: string;
  filterLabel: string;
  filterValue: string;
  onFilterChange: (value: string) => void;
  filterType?: "input" | "select" | "search-select";
  filterOptions?: Option[];
  filterSearchOptions?: SearchSelectOption[];
  filterPlaceholder?: string;
  isFilterLoading?: boolean;
  onFilterOptionSelect?: (value: SearchSelectOption) => void;
  emptyFilterSearchMessage?: string;
  isFilterSearchLoading?: boolean;
  isFilterOptionSelected?: boolean;
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onViewAllReports?: () => void;
  onExport?: () => void;
  onPrint?: () => void;
  errorMessage?: string | null;
  dateRangeErrorMessage?: string | null;
  isLoading?: boolean;
  data?:
    | FoPatientReportResponse["data"]
    | FoDepartmentReportResponse["data"]
    | FoAgentReportResponse["data"];
  pagination?: {
    current_page: number;
    total_pages: number;
    total_transactions: number;
    has_next: boolean;
    has_previous: boolean;
  } | null;
  onPreviousPage?: () => void;
  onNextPage?: () => void;
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
  filterSearchOptions = [],
  filterPlaceholder,
  isFilterLoading = false,
  onFilterOptionSelect,
  emptyFilterSearchMessage = "No matches found.",
  isFilterSearchLoading = false,
  isFilterOptionSelected = false,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onViewAllReports,
  onExport,
  onPrint,
  errorMessage,
  dateRangeErrorMessage,
  isLoading = false,
  data,
  pagination,
  onPreviousPage,
  onNextPage,
}: Props) {
  const rows = extractTransactions(mode, data);
  const patientRows = mode === "patient" ? extractPatientRows(data) : [];
  const stats = buildWorkspaceStats(mode, data, rows);
  const groupedRows =
    mode === "patient"
      ? []
      : buildGroupedRows(mode, data as FoDepartmentReportResponse["data"] | FoAgentReportResponse["data"]);
  const revenueBreakdownTable =
    rows.length > 0 ? buildRevenueBreakdownTable(rows) : groupedRows;
  const applyRange = (range: { start: string; end: string }) => {
    onStartDateChange(range.start);
    onEndDateChange(range.end);
  };

  return (
    <div className="min-h-screen w-full bg-canvas">
      <Header
        title={title}
        Subtitle={subtitle}
        actions={
          <div className="hidden items-center gap-2 md:flex">
            {onPrint ? (
              <button
                type="button"
                onClick={onPrint}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-line-subtle dark:bg-panel dark:text-slate-200 dark:hover:bg-panel-strong"
              >
                <FiPrinter />
                Print
              </button>
            ) : null}
            {onExport ? (
              <button
                type="button"
                onClick={onExport}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-line-subtle dark:bg-panel dark:text-slate-200 dark:hover:bg-panel-strong"
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

        {dateRangeErrorMessage ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
            {dateRangeErrorMessage}
          </div>
        ) : null}

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.05)] dark:border-line-subtle dark:bg-panel">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-[240px] flex-1 space-y-1">
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                {filterLabel}
              </p>
              {filterType === "select" ? (
                <select
                  value={filterValue}
                  onChange={(event) => onFilterChange(event.target.value)}
                  disabled={isFilterLoading}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-line-subtle dark:bg-canvas-alt dark:text-slate-100"
                >
                  <option value="All">All</option>
                  {filterOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              ) : filterType === "search-select" ? (
                <div className="relative">
                  <input
                    value={filterValue}
                    onChange={(event) => onFilterChange(event.target.value)}
                    placeholder={filterPlaceholder}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-line-subtle dark:bg-canvas-alt dark:text-slate-100"
                  />
                  {filterValue.trim() && !isFilterOptionSelected ? (
                    <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-line-subtle dark:bg-panel">
                      {isFilterSearchLoading ? (
                        <div className="p-3 text-sm text-gray-600 dark:text-slate-300">
                          Searching...
                        </div>
                      ) : filterSearchOptions.length === 0 ? (
                        <div className="p-3 text-sm text-gray-600 dark:text-slate-300">
                          {emptyFilterSearchMessage}
                        </div>
                      ) : (
                        <ul className="max-h-64 overflow-y-auto">
                          {filterSearchOptions.map((item) => (
                            <li key={item.id}>
                              <button
                                type="button"
                                onClick={() => onFilterOptionSelect?.(item)}
                                className="flex w-full flex-col gap-1 border-b border-gray-100 px-4 py-3 text-left text-sm hover:bg-gray-50 dark:border-line-subtle dark:hover:bg-panel-strong"
                              >
                                <span className="font-semibold text-gray-900 dark:text-slate-100">
                                  {item.name}
                                </span>
                                {item.description ? (
                                  <span className="text-xs text-gray-600 dark:text-slate-300">
                                    {item.description}
                                  </span>
                                ) : null}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : (
                <input
                  value={filterValue}
                  onChange={(event) => onFilterChange(event.target.value)}
                  placeholder={filterPlaceholder}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-line-subtle dark:bg-canvas-alt dark:text-slate-100"
                />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => applyRange(getTodayRange())}
                className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 dark:border-line-subtle dark:text-slate-300 dark:hover:border-brand-500/50 dark:hover:bg-panel-strong dark:hover:text-brand-200"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => applyRange(getLastSevenDaysRange())}
                className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 dark:border-line-subtle dark:text-slate-300 dark:hover:border-brand-500/50 dark:hover:bg-panel-strong dark:hover:text-brand-200"
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => applyRange(getThisMonthRange())}
                className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 dark:border-line-subtle dark:text-slate-300 dark:hover:border-brand-500/50 dark:hover:bg-panel-strong dark:hover:text-brand-200"
              >
                This Month
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="flex items-end xl:order-3">
              <div className="flex w-full flex-col gap-2 sm:flex-row">
                {onViewAllReports ? (
                  <button
                    type="button"
                    onClick={onViewAllReports}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-line-subtle dark:bg-panel dark:text-slate-200 dark:hover:bg-panel-strong"
                  >
                    See All
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
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-line-subtle dark:bg-canvas-alt dark:text-slate-100"
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
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-line-subtle dark:bg-canvas-alt dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        <FoReportsSummaryCards
          isLoading={isLoading}
          totalRevenue={stats.totalRevenue}
          totalTransactions={stats.totalTransactions}
        />

        <FoReportsRevenueBreakdownTable rows={revenueBreakdownTable} />

        {mode === "patient" && patientRows.length > 0 ? (
          <FoPatientReportTable rows={patientRows} />
        ) : null}

        {mode !== "patient" && rows.length > 0 ? (
          <FoReportsTransactionsTable
            rows={rows}
            toMethodLabel={toMethodLabel}
          />
        ) : null}

        {pagination && onPreviousPage && onNextPage ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-600 shadow-[0_18px_45px_rgba(15,23,42,0.05)] dark:border-line-subtle dark:bg-panel dark:text-slate-300">
              Showing {rows.length} transaction{rows.length === 1 ? "" : "s"} on
              this page. Total matching transactions:{" "}
              {pagination.total_transactions}.
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)] dark:border-line-subtle dark:bg-panel">
              <AdminPaginationFooter
                currentPage={pagination.current_page}
                totalPages={pagination.total_pages}
                hasPrevious={pagination.has_previous}
                hasNext={pagination.has_next}
                onPrevious={onPreviousPage}
                onNext={onNextPage}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default FoScopedReportWorkspace;
