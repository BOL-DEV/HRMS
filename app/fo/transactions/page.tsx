"use client";

import FoTransactionsFilterBar from "@/components/FoTransactionsFilterBar";
import FoTransactionsSummaryCards from "@/components/FoTransactionsSummaryCards";
import FoTransactionsTable from "@/components/FoTransactionsTable";
import Header from "@/components/Header";
import { ApiError } from "@/libs/api";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import { getFoReports } from "@/libs/fo-auth";
import { formatDateTime } from "@/libs/helper";
import { FoReportPaymentType } from "@/libs/type";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type MethodFilter = "All" | "Cash" | "Transfer" | "POS";
const TRANSACTIONS_PER_PAGE = 15;

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getRelativeDate(daysFromToday: number) {
  const today = new Date();
  today.setDate(today.getDate() + daysFromToday);
  return formatDateOnly(today);
}

function toMethodLabel(value: FoReportPaymentType): Exclude<MethodFilter, "All"> {
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
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState<MethodFilter>("All");
  const [startDate, setStartDate] = useState(() => getRelativeDate(-6));
  const [endDate, setEndDate] = useState(() => getRelativeDate(0));
  const [page, setPage] = useState(1);

  const transactionsQuery = useQuery({
    queryKey: ["fo-transactions", startDate, endDate],
    queryFn: () =>
      getFoReports({
        startDate,
        endDate,
      }),
    enabled: Boolean(accessToken),
  });

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    if (!(transactionsQuery.error instanceof ApiError)) {
      return;
    }

    if (transactionsQuery.error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
    }
  }, [transactionsQuery.error, router]);

  const detailedReport = useMemo(
    () => transactionsQuery.data?.data.detailed_report ?? [],
    [transactionsQuery.data?.data.detailed_report],
  );
  const summary = transactionsQuery.data?.data.summary_report;

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();

    const bySearch = !text
      ? detailedReport
      : detailedReport.filter((item) =>
          [
            item.patient_name,
            item.phone_number,
            item.receipt_no,
            item.agent_name,
            item.department_name,
            item.bill_description,
          ].some((field) => field.toLowerCase().includes(text)),
        );

    const byMethod =
      method === "All"
        ? bySearch
        : bySearch.filter((item) => toMethodLabel(item.payment_type) === method);

    return [...byMethod].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [detailedReport, method, search]);

  const stats = useMemo(
    () => ({
      totalRevenue:
        method === "All" && !search.trim()
          ? summary?.total_revenue ?? 0
          : filtered.reduce((sum, item) => sum + item.amount, 0,
            ),
      totalTransactions:
        method === "All" && !search.trim()
          ? summary?.transaction_count ?? 0
          : filtered.length,
    }),
    [filtered, method, search, summary],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / TRANSACTIONS_PER_PAGE),
  );
  const currentPage = Math.min(page, totalPages);

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * TRANSACTIONS_PER_PAGE;
    return filtered.slice(startIndex, startIndex + TRANSACTIONS_PER_PAGE);
  }, [currentPage, filtered]);

  const handleExport = () => {
    const rows = [
      [
        "Date/Time",
        "Receipt No",
        "Patient",
        "Phone Number",
        "Department",
        "Bill Description",
        "Amount",
        "Method",
        "Agent",
      ],
      ...filtered.map((item) => [
        formatDateTime(item.created_at),
        item.receipt_no,
        item.patient_name,
        item.phone_number,
        item.department_name,
        item.bill_description,
        item.amount,
        toMethodLabel(item.payment_type),
        item.agent_name,
      ]),
    ];

    downloadCsv("fo-transactions.csv", rows);
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-slate-950">
      <Header
        title="Transactions"
        Subtitle="Monitor and audit all hospital payment transactions"
        actions={
          <button className="hidden rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white md:block">
            Export CSV
          </button>
        }
      />

      <div className="space-y-6 p-6">
        {transactionsQuery.error instanceof Error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {transactionsQuery.error.message}
          </div>
        ) : null}

        <FoTransactionsSummaryCards
          isLoading={transactionsQuery.isLoading}
          totalRevenue={stats.totalRevenue}
          totalTransactions={stats.totalTransactions}
        />

        <FoTransactionsFilterBar
          search={search}
          method={method}
          startDate={startDate}
          endDate={endDate}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onMethodChange={(value) => {
            setMethod(value);
            setPage(1);
          }}
          onStartDateChange={(value) => {
            setStartDate(value);
            setPage(1);
          }}
          onEndDateChange={(value) => {
            setEndDate(value);
            setPage(1);
          }}
          onExport={handleExport}
        />

        <FoTransactionsTable
          rows={paginatedRows}
          isLoading={transactionsQuery.isLoading}
          toMethodLabel={toMethodLabel}
        />

        {!transactionsQuery.isLoading && filtered.length > 0 ? (
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-gray-600 dark:text-slate-300">
              Page {currentPage} of {totalPages}
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setPage((current) => Math.min(current + 1, totalPages))
                }
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default Page;
