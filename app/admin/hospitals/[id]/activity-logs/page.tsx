"use client";

import AdminDateRangeFilterBar from "@/components/AdminDateRangeFilterBar";
import AdminHospitalActivityTimeline from "@/components/AdminHospitalActivityTimeline";
import AdminPageError from "@/components/AdminPageError";
import AdminPaginationFooter from "@/components/AdminPaginationFooter";
import { ApiError } from "@/libs/api";
import { getAdminHospitalActivityLogs } from "@/libs/admin-auth";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const PAGE_LIMIT = 20;
const ACTION_OPTIONS = [
  { value: "all", label: "All Activity" },
  { value: "hospital", label: "Hospital" },
  { value: "agent", label: "Agents" },
  { value: "fo", label: "FO" },
  { value: "department", label: "Departments" },
  { value: "income_head", label: "Income Heads" },
  { value: "bill_item", label: "Bill Items" },
  { value: "receipt_reprint", label: "Receipt Reprints" },
  { value: "agent.balance_topped_up", label: "Agent Top-ups" },
] as const;

export default function HospitalActivityLogsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const accessToken = getAccessToken();
  const hospitalId = params?.id ?? "";

  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");
  const [actionInput, setActionInput] = useState<(typeof ACTION_OPTIONS)[number]["value"]>("all");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");
  const [appliedAction, setAppliedAction] = useState<(typeof ACTION_OPTIONS)[number]["value"]>("all");
  const [page, setPage] = useState(1);

  const logsQuery = useQuery({
    queryKey: [
      "admin-hospital-activity-logs",
      hospitalId,
      appliedStartDate,
      appliedEndDate,
      appliedAction,
      page,
    ],
    queryFn: () =>
      getAdminHospitalActivityLogs(hospitalId, {
        startDate: appliedStartDate || undefined,
        endDate: appliedEndDate || undefined,
        action: appliedAction,
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
    if (!(logsQuery.error instanceof ApiError)) {
      return;
    }

    if (logsQuery.error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
      return;
    }

    if (logsQuery.error.status === 404) {
      router.replace("/admin/hospitals");
    }
  }, [logsQuery.error, router]);

  const logsData = logsQuery.data?.data;
  const pagination = logsData?.pagination;
  const rows = logsData?.logs ?? [];

  const dateRangeIsInvalid =
    Boolean(startDateInput || endDateInput) &&
    (!startDateInput || !endDateInput);

  const applyFilters = () => {
    if (dateRangeIsInvalid) {
      return;
    }

    setAppliedStartDate(startDateInput);
    setAppliedEndDate(endDateInput);
    setAppliedAction(actionInput);
    setPage(1);
  };

  const clearFilters = () => {
    setStartDateInput("");
    setEndDateInput("");
    setActionInput("all");
    setAppliedStartDate("");
    setAppliedEndDate("");
    setAppliedAction("all");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {logsQuery.error instanceof Error ? (
        <AdminPageError message={logsQuery.error.message} />
      ) : null}

      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
          Total Logs
        </p>
        <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-slate-100">
          {pagination?.total_logs ?? 0}
        </p>
        <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
          Showing {ACTION_OPTIONS.find((option) => option.value === appliedAction)?.label ?? "All Activity"}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-gray-200 p-5 dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
            Activity Timeline
          </h2>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Audit log of hospital, staff, and configuration activity
          </p>
        </div>

        <AdminDateRangeFilterBar
          startDate={startDateInput}
          endDate={endDateInput}
          onStartDateChange={setStartDateInput}
          onEndDateChange={setEndDateInput}
          onApply={applyFilters}
          onClear={clearFilters}
          isInvalid={dateRangeIsInvalid}
          leadSlot={
            <div className="space-y-1">
              <label
                htmlFor="activity-action-filter"
                className="text-sm font-medium text-gray-700 dark:text-slate-300"
              >
                Action Group
              </label>
              <select
                id="activity-action-filter"
                value={actionInput}
                onChange={(event) =>
                  setActionInput(
                    event.target.value as (typeof ACTION_OPTIONS)[number]["value"],
                  )
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {ACTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          }
        />

        <AdminHospitalActivityTimeline
          rows={rows}
          isLoading={logsQuery.isLoading && !logsQuery.data}
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
