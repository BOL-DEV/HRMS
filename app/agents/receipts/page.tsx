"use client";

import Header from "@/components/Header";
import ReceiptActionBar from "@/components/ReceiptActionBar";
import ReceiptLists from "@/components/ReceiptLists";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError } from "@/libs/api";
import { clearAgentTokens, getAgentAccessToken } from "@/libs/auth";
import { getAgentReceipts } from "@/libs/agent-auth";
import type {
  AgentReceiptSearchType,
  AgentTransactionsTimePeriod,
} from "@/libs/type";

function Page() {
  const router = useRouter();
  const [searchType, setSearchType] =
    useState<AgentReceiptSearchType>("receipt_no");
  const [searchValue, setSearchValue] = useState("");
  const [timePeriod, setTimePeriod] =
    useState<AgentTransactionsTimePeriod>("today");
  const [page, setPage] = useState(1);
  const accessToken = getAgentAccessToken();

  const receiptsQuery = useQuery({
    queryKey: ["agent-receipts", searchType, searchValue, timePeriod, page],
    queryFn: () =>
      getAgentReceipts({
        searchType,
        searchValue,
        timePeriod,
        page,
      }),
    enabled: Boolean(accessToken),
  });

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    if (!(receiptsQuery.error instanceof ApiError)) {
      return;
    }

    if (receiptsQuery.error.status === 401) {
      clearAgentTokens();
      router.replace("/login");
    }
  }, [receiptsQuery.error, router]);

  const pagination = receiptsQuery.data?.data.pagination;

  return (
    <div className="min-h-screen w-full bg-gray-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-y-auto">
      <Header title="Receipts" Subtitle="View and reprint patient receipts" />

      <div className="p-6 space-y-6">
        <ReceiptActionBar
          searchType={searchType}
          searchValue={searchValue}
          timePeriod={timePeriod}
          onSearchTypeChange={(value) => {
            setSearchType(value);
            setPage(1);
          }}
          onSearchValueChange={(value) => {
            setSearchValue(value);
            setPage(1);
          }}
          onTimePeriodChange={(value) => {
            setTimePeriod(value);
            setPage(1);
          }}
          onExport={() => window.print()}
        />

        {receiptsQuery.error instanceof Error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {receiptsQuery.error.message}
          </div>
        ) : null}

        <ReceiptLists
          rows={receiptsQuery.data?.data.receipts ?? []}
          totalCount={pagination?.total_receipts ?? 0}
          isLoading={receiptsQuery.isLoading}
        />

        {pagination ? (
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
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
                onClick={() => setPage((current) => current + 1)}
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
