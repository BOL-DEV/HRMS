"use client";

import Header from "@/components/Header";
import AdminDateRangeFilterBar from "@/components/AdminDateRangeFilterBar";
import AdminPageError from "@/components/AdminPageError";
import AdminPaginationFooter from "@/components/AdminPaginationFooter";
import { ApiError } from "@/libs/api";
import { getAdminReportsOptions, getAdminSystemLogs } from "@/libs/admin-auth";
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
  const [hospitalIdInput, setHospitalIdInput] = useState("all");
  const [roleInput, setRoleInput] = useState<"all" | "PLATFORM_ADMIN" | "FO" | "AGENT">("all");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");
  const [appliedHospitalId, setAppliedHospitalId] = useState("all");
  const [appliedRole, setAppliedRole] =
    useState<"all" | "PLATFORM_ADMIN" | "FO" | "AGENT">("all");
  const [page, setPage] = useState(1);

  const optionsQuery = useQuery({
    queryKey: ["admin-system-log-options"],
    queryFn: getAdminReportsOptions,
    enabled: Boolean(accessToken),
  });

  const logsQuery = useQuery({
    queryKey: [
      "admin-system-logs",
      appliedStartDate,
      appliedEndDate,
      appliedHospitalId,
      appliedRole,
      page,
    ],
    queryFn: () =>
      getAdminSystemLogs({
        startDate: appliedStartDate || undefined,
        endDate: appliedEndDate || undefined,
        hospitalId: appliedHospitalId === "all" ? undefined : appliedHospitalId,
        role: appliedRole,
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
    const error =
      logsQuery.error instanceof ApiError
        ? logsQuery.error
        : optionsQuery.error instanceof ApiError
          ? optionsQuery.error
          : null;

    if (!error) {
      return;
    }

    if (error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
    }
  }, [logsQuery.error, optionsQuery.error, router]);

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
    setAppliedHospitalId(hospitalIdInput);
    setAppliedRole(roleInput);
    setPage(1);
  };

  const clearFilters = () => {
    setStartDateInput("");
    setEndDateInput("");
    setHospitalIdInput("all");
    setRoleInput("all");
    setAppliedStartDate("");
    setAppliedEndDate("");
    setAppliedHospitalId("all");
    setAppliedRole("all");
    setPage(1);
  };

  const hospitals = optionsQuery.data?.data.hospitals ?? [];

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

          <div className="flex flex-col gap-4 border-b border-gray-200 p-5 dark:border-slate-700 md:flex-row md:items-center">
            <select
              value={hospitalIdInput}
              onChange={(event) => setHospitalIdInput(event.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="all">All Hospitals</option>
              {hospitals.map((hospital) => (
                <option key={hospital.hospital_id} value={hospital.hospital_id}>
                  {hospital.hospital_name}
                </option>
              ))}
            </select>

            <select
              value={roleInput}
              onChange={(event) =>
                setRoleInput(
                  event.target.value as
                    | "all"
                    | "PLATFORM_ADMIN"
                    | "FO"
                    | "AGENT",
                )
              }
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="all">All Roles</option>
              <option value="PLATFORM_ADMIN">Platform Admin</option>
              <option value="FO">FO</option>
              <option value="AGENT">Agent</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                  <th className="p-3 font-semibold">Hospital</th>
                  <th className="p-3 font-semibold">Username</th>
                  <th className="p-3 font-semibold">Email</th>
                  <th className="p-3 font-semibold">Role</th>
                  <th className="p-3 font-semibold">Event</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Date/Time</th>
                  <th className="p-3 font-semibold">Failure</th>
                </tr>
              </thead>
              <tbody>
                {logsQuery.isLoading && !logsQuery.data ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 dark:border-slate-800"
                    >
                      <td colSpan={8} className="p-3">
                        <div className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800" />
                      </td>
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-8 text-center text-sm text-gray-500 dark:text-slate-400"
                    >
                      No system logs found for the current filters.
                    </td>
                  </tr>
                ) : (
                  rows.map((log) => (
                    <tr
                      key={log.log_id}
                      className="border-b border-gray-100 dark:border-slate-800"
                    >
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {log.hospital?.hospital_name ?? "Platform"}
                      </td>
                      <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                        {log.username ?? log.user.name}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {log.email ?? log.user.email}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {log.role ?? log.user.role}
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
                      <td className="whitespace-nowrap p-3 text-gray-700 dark:text-slate-300">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {log.status === "failed"
                          ? (log.failed_reason ?? "Unknown")
                          : "-"}
                      </td>
                    </tr>
                  ))
                )}
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
