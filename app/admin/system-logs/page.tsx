"use client";

import Header from "@/components/Header";
import AdminDateRangeFilterBar from "@/components/AdminDateRangeFilterBar";
import AdminPageError from "@/components/AdminPageError";
import AdminPaginationFooter from "@/components/AdminPaginationFooter";
import { ApiError } from "@/libs/api";
import { getAdminSystemLogs } from "@/libs/admin-auth";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import { formatDateTime } from "@/libs/helper";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const PAGE_LIMIT = 20;

function formatEvent(event: string) {
  return event
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatMetadata(metadata: Record<string, unknown>) {
  const entries = Object.entries(metadata);

  if (!entries.length) {
    return "No extra metadata";
  }

  return entries
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" | ");
}

function getStatusTone(status: string) {
  return status.toLowerCase() === "success"
    ? "text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-500/15"
    : "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-500/15";
}

export default function Page() {
  const router = useRouter();
  const accessToken = getAccessToken();
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");
  const [page, setPage] = useState(1);

  const logsQuery = useQuery({
    queryKey: ["admin-system-logs", appliedStartDate, appliedEndDate, page],
    queryFn: () =>
      getAdminSystemLogs({
        startDate: appliedStartDate || undefined,
        endDate: appliedEndDate || undefined,
        page,
        limit: PAGE_LIMIT,
      }),
    enabled: Boolean(accessToken),
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
    setPage(1);
  };

  const clearFilters = () => {
    setStartDateInput("");
    setEndDateInput("");
    setAppliedStartDate("");
    setAppliedEndDate("");
    setPage(1);
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-slate-950">
      <Header
        title="System Logs"
        Subtitle="Platform-wide audit logs for admin, FO, and agent activity"
      />

      <div className="space-y-6 p-6">
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
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-gray-200 p-5 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
              Platform Activity
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Login, logout, and related platform-wide events
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
          />

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                  <th className="p-3 font-semibold">Date/Time</th>
                  <th className="p-3 font-semibold">Event</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">User</th>
                  <th className="p-3 font-semibold">Metadata</th>
                </tr>
              </thead>
              <tbody>
                {logsQuery.isLoading && !logsQuery.data
                  ? Array.from({ length: 6 }).map((_, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-100 dark:border-slate-800"
                      >
                        <td colSpan={5} className="p-3">
                          <div className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800" />
                        </td>
                      </tr>
                    ))
                  : rows.length === 0
                    ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="p-8 text-center text-sm text-gray-500 dark:text-slate-400"
                          >
                            No system logs found for the current filters.
                          </td>
                        </tr>
                      )
                    : rows.map((log) => (
                        <tr
                          key={log.log_id}
                          className="border-b border-gray-100 dark:border-slate-800"
                        >
                          <td className="whitespace-nowrap p-3 text-gray-700 dark:text-slate-300">
                            {formatDateTime(log.created_at)}
                          </td>
                          <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                            {formatEvent(log.event)}
                          </td>
                          <td className="p-3">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(log.status)}`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="p-3 text-gray-700 dark:text-slate-300">
                            <p className="font-semibold text-gray-900 dark:text-slate-100">
                              {log.user.name}
                            </p>
                            <p>{log.user.email}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                              {log.user.role}
                            </p>
                          </td>
                          <td className="p-3 text-gray-600 dark:text-slate-400">
                            {formatMetadata(log.metadata)}
                          </td>
                        </tr>
                      ))}
              </tbody>
            </table>
          </div>

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
    </div>
  );
}
