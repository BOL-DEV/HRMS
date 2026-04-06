"use client";

import { ApiError } from "@/libs/api";
import { getAdminHospitalOverview } from "@/libs/admin-auth";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import { formatCompactNumber, formatNaira } from "@/libs/helper";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type OverviewCard = {
  title: string;
  value: string;
  tone?: "default" | "danger";
};

function HospitalOverviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const accessToken = getAccessToken();
  const id = params?.id ?? "";

  const overviewQuery = useQuery({
    queryKey: ["admin-hospital-overview", id],
    queryFn: () => getAdminHospitalOverview(id),
    enabled: Boolean(accessToken && id),
  });

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    if (!(overviewQuery.error instanceof ApiError)) {
      return;
    }

    if (overviewQuery.error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
      return;
    }

    if (overviewQuery.error.status === 404) {
      router.replace("/admin/hospitals");
    }
  }, [overviewQuery.error, router]);

  const overviewData = overviewQuery.data?.data;

  const stats = useMemo<OverviewCard[]>(() => {
    const summary = overviewData?.overview;

    return [
      {
        title: "Total Revenue",
        value: formatNaira(summary?.total_revenue ?? 0),
      },
      {
        title: "Total Transactions",
        value: formatCompactNumber(summary?.total_transactions ?? 0),
      },
      {
        title: "Total Agents",
        value: formatCompactNumber(summary?.total_agents ?? 0),
      },
      {
        title: "Total Departments",
        value: formatCompactNumber(summary?.total_departments ?? 0),
      },
      {
        title: "Pending Receipt Reprints",
        value: formatCompactNumber(summary?.pending_receipt_reprint ?? 0),
        tone: "danger",
      },
    ];
  }, [overviewData?.overview]);

  const revenueTrend = overviewData?.revenue_trend ?? [];

  return (
    <div className="space-y-6">
      {overviewQuery.error instanceof Error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {overviewQuery.error.message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {overviewQuery.isLoading && !overviewData
          ? Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900"
              />
            ))
          : stats.map((stat) => (
              <div
                key={stat.title}
                className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
              >
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
                  {stat.title}
                </p>
                <p
                  className={
                    stat.tone === "danger"
                      ? "mt-3 text-3xl font-bold text-red-600 dark:text-red-300"
                      : "mt-3 text-3xl font-bold text-gray-900 dark:text-slate-100"
                  }
                >
                  {stat.value}
                </p>
              </div>
            ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-gray-200 p-5 dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
            Revenue Trend
          </h2>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Revenue trend returned by the hospital overview endpoint
          </p>
        </div>

        <div className="h-96 p-6">
          {revenueTrend.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={revenueTrend}
                margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => String(value)} />
                <Tooltip
                  formatter={(value) => [formatNaira(Number(value)), "Revenue"]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
              No revenue trend data available for this hospital yet.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
          Hospital Details
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-500">
              Email
            </p>
            <p className="mt-1 text-sm text-gray-800 dark:text-slate-200">
              {overviewData?.hospital.hospital_email ?? "N/A"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-500">
              Phone
            </p>
            <p className="mt-1 text-sm text-gray-800 dark:text-slate-200">
              {overviewData?.hospital.hospital_phone ?? "N/A"}
            </p>
          </div>

          <div className="sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-500">
              Address
            </p>
            <p className="mt-1 text-sm text-gray-800 dark:text-slate-200">
              {overviewData?.hospital.address ?? "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HospitalOverviewPage;
