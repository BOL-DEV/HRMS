"use client";

import AdminPageError from "@/components/AdminPageError";
import AdminPaginationFooter from "@/components/AdminPaginationFooter";
import AdminHospitalTransactionsSection from "@/components/AdminHospitalTransactionsSection";
import AdminHospitalTransactionsSummaryCards from "@/components/AdminHospitalTransactionsSummaryCards";
import { ApiError } from "@/libs/api";
import { getAdminHospitalTransactions } from "@/libs/admin-auth";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const PAGE_LIMIT = 15;

export default function HospitalTransactionsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const accessToken = getAccessToken();
  const hospitalId = params?.id ?? "";

  const [searchInput, setSearchInput] = useState("");
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");
  const [page, setPage] = useState(1);

  const transactionsQuery = useQuery({
    queryKey: [
      "admin-hospital-transactions",
      hospitalId,
      appliedSearch,
      appliedStartDate,
      appliedEndDate,
      page,
    ],
    queryFn: () =>
      getAdminHospitalTransactions(hospitalId, {
        search: appliedSearch,
        startDate: appliedStartDate || undefined,
        endDate: appliedEndDate || undefined,
        page,
        limit: PAGE_LIMIT,
      }),
    enabled: Boolean(accessToken && hospitalId),
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
      return;
    }

    if (transactionsQuery.error.status === 404) {
      router.replace("/admin/hospitals");
    }
  }, [transactionsQuery.error, router]);

  const transactionsData = transactionsQuery.data?.data;
  const pagination = transactionsData?.pagination;
  const rows = transactionsData?.transactions ?? [];

  const applyFilters = () => {
    const hasAnyDate = Boolean(startDateInput || endDateInput);

    if (hasAnyDate && (!startDateInput || !endDateInput)) {
      return;
    }

    setAppliedSearch(searchInput.trim());
    setAppliedStartDate(startDateInput);
    setAppliedEndDate(endDateInput);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setStartDateInput("");
    setEndDateInput("");
    setAppliedSearch("");
    setAppliedStartDate("");
    setAppliedEndDate("");
    setPage(1);
  };

  const dateRangeIsInvalid =
    Boolean(startDateInput || endDateInput) &&
    (!startDateInput || !endDateInput);

  return (
    <div className="space-y-6">
      {transactionsQuery.error instanceof Error ? (
        <AdminPageError message={transactionsQuery.error.message} />
      ) : null}

      <AdminHospitalTransactionsSummaryCards
        totalRevenue={transactionsData?.summary.total_revenue ?? 0}
        transactionCount={transactionsData?.summary.transaction_count ?? 0}
      />

      <div className="space-y-0 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <AdminHospitalTransactionsSection
          rows={rows}
          search={searchInput}
          startDate={startDateInput}
          endDate={endDateInput}
          isLoading={transactionsQuery.isLoading && !transactionsQuery.data}
          isDateRangeInvalid={dateRangeIsInvalid}
          onSearchChange={setSearchInput}
          onStartDateChange={setStartDateInput}
          onEndDateChange={setEndDateInput}
          onApply={applyFilters}
          onClear={clearFilters}
        />

        <AdminPaginationFooter
          currentPage={pagination?.current_page ?? 1}
          totalPages={pagination?.total_pages ?? 1}
          hasPrevious={Boolean(pagination?.has_previous)}
          hasNext={Boolean(pagination?.has_next)}
          onPrevious={() => setPage((current) => Math.max(current - 1, 1))}
          onNext={() => setPage((current) => current + 1)}
        />
      </div>
    </div>
  );
}
