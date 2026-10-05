"use client";

import Header from "@/components/shared/Header";
import ReceiptActionBar from "@/components/agent/ReceiptActionBar";
import ReceiptLists from "@/components/agent/ReceiptLists";
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
    <div className="min-h-screen w-full overflow-y-auto bg-canvas text-slate-900 dark:text-slate-100">
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
          pagination={pagination}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}

export default Page;
