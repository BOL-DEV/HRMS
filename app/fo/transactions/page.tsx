"use client";

import FoTransactionsFilterBar from "@/components/FoTransactionsFilterBar";
import FoTransactionsSummaryCards from "@/components/FoTransactionsSummaryCards";
import FoTransactionsTable from "@/components/FoTransactionsTable";
import Header from "@/components/Header";
import { ApiError } from "@/libs/api";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import { exportFoTransactionsCsv, getFoTransactions } from "@/libs/fo-auth";
import { FoReportPaymentType } from "@/libs/type";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

type MethodFilter = "All" | "Cash" | "Transfer" | "POS";
const TRANSACTIONS_PER_PAGE = 15;

function toMethodLabel(value: FoReportPaymentType): Exclude<MethodFilter, "All"> {
  if (value === "cash") return "Cash";
  if (value === "transfer") return "Transfer";
  return "POS";
}

function toMethodParam(
  value: MethodFilter,
): FoReportPaymentType | undefined {
  if (value === "Cash") return "cash";
  if (value === "Transfer") return "transfer";
  if (value === "POS") return "pos";
  return undefined;
}

function Page() {
  const router = useRouter();
  const accessToken = getAccessToken();
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState<MethodFilter>("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  const transactionsQuery = useQuery({
    queryKey: ["fo-transactions", search, method, startDate, endDate, page],
    queryFn: () =>
      getFoTransactions({
        startDate,
        endDate,
        search: search.trim() || undefined,
        paymentMethod: toMethodParam(method),
        page,
        limit: TRANSACTIONS_PER_PAGE,
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

  const transactions = useMemo(
    () => transactionsQuery.data?.data.transactions ?? [],
    [transactionsQuery.data?.data.transactions],
  );
  const summary = transactionsQuery.data?.data.summary;
  const pagination = transactionsQuery.data?.data.pagination;

  const handleExport = () => {
    exportFoTransactionsCsv({
      startDate,
      endDate,
      search: search.trim() || undefined,
      paymentMethod: toMethodParam(method),
      page,
      limit: TRANSACTIONS_PER_PAGE,
    }).catch((error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to export transactions.",
      );
    });
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-slate-950">
      <Header
        title="Transactions"
        Subtitle="Monitor and audit all hospital payment transactions"
        actions={
          <button
            type="button"
            onClick={handleExport}
            className="hidden rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white md:block"
          >
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
          totalRevenue={summary?.total_revenue ?? 0}
          totalTransactions={summary?.transaction_count ?? 0}
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
          rows={transactions}
          isLoading={transactionsQuery.isLoading}
          toMethodLabel={toMethodLabel}
        />

        {!transactionsQuery.isLoading &&
        transactions.length > 0 &&
        pagination ? (
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-gray-600 dark:text-slate-300">
              Page {pagination.current_page} of {pagination.total_pages}
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={!pagination.has_previous}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={!pagination.has_next}
                onClick={() =>
                  setPage((current) =>
                    Math.min(current + 1, pagination.total_pages),
                  )
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
