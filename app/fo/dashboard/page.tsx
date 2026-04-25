"use client";

import DashboardFilterBar from "@/components/dashboard/DashboardFilterBar";
import DashboardSection from "@/components/dashboard/DashboardSection";
import DashboardSegmentedControl from "@/components/dashboard/DashboardSegmentedControl";
import Header from "@/components/Header";
import PaymentMethodBreakdown from "@/components/PaymentMethodBreakdown";
import RecentTransactions from "@/components/RecentTransactions";
import RevenueByDepartment from "@/components/RevenueByDepartment";
import RevenueTrend from "@/components/RevenueTrend";
import { ApiError } from "@/libs/api";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import { getFoDashboard, getFoStats, getFoTransactions } from "@/libs/fo-auth";
import { formatCompactNumber, formatDateTime, formatNaira } from "@/libs/helper";
import {
  type FoStatsTimePeriod,
  type RecentTransactionDisplayRow,
  type RevenueChartDatum,
} from "@/libs/type";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FiCalendar } from "react-icons/fi";

const periodOptions: Array<{
  label: string;
  value: FoStatsTimePeriod;
}> = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "this_week" },
  { label: "This Month", value: "this_month" },
  { label: "This Year", value: "this_year" },
];

const summaryAccents = [
  {
    surface: "bg-red-50 dark:bg-red-500/10",
    text: "text-red-700 dark:text-red-300",
  },
  {
    surface: "bg-emerald-50 dark:bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  {
    surface: "bg-pink-50 dark:bg-pink-500/10",
    text: "text-pink-700 dark:text-pink-300",
  },
  {
    surface: "bg-amber-50 dark:bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-300",
  },
];

function getDashboardPeriodValue(
  periods:
    | {
        today: { total_revenue: number; transaction_count: number };
        last_month: { total_revenue: number; transaction_count: number };
        this_month: { total_revenue: number; transaction_count: number };
        this_year: { total_revenue: number; transaction_count: number };
      }
    | undefined,
  key: "today" | "last_month" | "this_month" | "this_year",
) {
  if (!periods) {
    return {
      total_revenue: 0,
      transaction_count: 0,
    };
  }

  return (
    periods[key] ?? {
      total_revenue: 0,
      transaction_count: 0,
    }
  );
}

function Page() {
  const router = useRouter();
  const accessToken = getAccessToken();
  const [statsPeriod, setStatsPeriod] = useState<FoStatsTimePeriod>("today");

  const dashboardQuery = useQuery({
    queryKey: ["fo-dashboard"],
    queryFn: getFoDashboard,
    enabled: Boolean(accessToken),
  });

  const statsQuery = useQuery({
    queryKey: ["fo-stats", statsPeriod],
    queryFn: () => getFoStats(statsPeriod),
    enabled: Boolean(accessToken),
  });

  const recentTransactionsQuery = useQuery({
    queryKey: ["fo-dashboard-recent-transactions"],
    queryFn: () => getFoTransactions({ page: 1, limit: 5 }),
    enabled: Boolean(accessToken),
  });

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    const error =
      dashboardQuery.error instanceof ApiError
        ? dashboardQuery.error
        : statsQuery.error instanceof ApiError
          ? statsQuery.error
          : recentTransactionsQuery.error instanceof ApiError
            ? recentTransactionsQuery.error
            : null;

    if (!error) {
      return;
    }

    if (error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
    }
  }, [dashboardQuery.error, recentTransactionsQuery.error, router, statsQuery.error]);

  const periods = dashboardQuery.data?.data.periods;
  const statsData = statsQuery.data?.data;

  const todayPeriod = getDashboardPeriodValue(periods, "today");
  const lastMonthPeriod = getDashboardPeriodValue(periods, "last_month");
  const monthPeriod = getDashboardPeriodValue(periods, "this_month");
  const yearPeriod = getDashboardPeriodValue(periods, "this_year");

  const summaryMetrics = [
    {
      label: "Today",
      revenue: todayPeriod.total_revenue,
      transactions: todayPeriod.transaction_count,
      ...summaryAccents[0],
    },
    {
      label: "Last Month",
      revenue: lastMonthPeriod.total_revenue,
      transactions: lastMonthPeriod.transaction_count,
      ...summaryAccents[1],
    },
    {
      label: "This Month",
      revenue: monthPeriod.total_revenue,
      transactions: monthPeriod.transaction_count,
      ...summaryAccents[2],
    },
    {
      label: "This Year",
      revenue: yearPeriod.total_revenue,
      transactions: yearPeriod.transaction_count,
      ...summaryAccents[3],
    },
  ];

  const revenueTrendData: RevenueChartDatum[] = periods
    ? [
        { name: "Today", value: todayPeriod.total_revenue, color: "#dc2626" },
        { name: "Last Month", value: lastMonthPeriod.total_revenue, color: "#10b981" },
        { name: "This Month", value: monthPeriod.total_revenue, color: "#ec4899" },
        { name: "This Year", value: yearPeriod.total_revenue, color: "#f59e0b" },
      ]
    : [];

  const revenueByDepartmentData = useMemo<RevenueChartDatum[]>(
    () =>
      (statsData?.revenue_by_departments ?? []).map((item) => ({
        name: item.department_name,
        value: item.revenue,
      })),
    [statsData?.revenue_by_departments],
  );

  const paymentMethodData = useMemo(() => {
    const methods = statsData?.payment_methods ?? [];
    const colors = ["#2563EB", "#10B981", "#F59E0B", "#EF4444"];

    return methods.map((item, index) => ({
      name:
        item.payment_type === "cash"
          ? "Cash"
          : item.payment_type === "transfer"
            ? "Transfer"
            : "POS",
      value: item.total_value,
      color: colors[index % colors.length],
    }));
  }, [statsData?.payment_methods]);

  const leaderboardRows = useMemo(
    () =>
      (statsData?.leaderboard ?? []).map((item, index) => ({
        rank: index + 1,
        name: item.agent_name,
        count: item.trxn_count,
        amount: item.revenue,
      })),
    [statsData?.leaderboard],
  );

  const recentTransactions = useMemo<RecentTransactionDisplayRow[]>(
    () =>
      (recentTransactionsQuery.data?.data.transactions ?? []).map((item) => ({
        patientName: item.patient_name,
        patientId: item.patient_id,
        billName: item.bill_name,
        departmentName: item.department,
        amount: item.amount,
        status: item.payment_method.toUpperCase(),
        createdAt: formatDateTime(item.date_time),
      })),
    [recentTransactionsQuery.data?.data.transactions],
  );

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-slate-950">
      <Header
        title="Financial Office Dashboard"
        Subtitle="Monitor hospital revenue, people, and transactions"
      />

      <div className="space-y-6 p-6">
        <DashboardFilterBar
          eyebrow="Financial Office"
          title="Performance first, detail second"
          description="Track period revenue, department output, and agent contribution without opening a full report."
          accent="fo"
          actions={
            <DashboardSegmentedControl
              value={statsPeriod}
              options={periodOptions}
              onChange={setStatsPeriod}
              accent="fo"
            />
          }
        />

        {dashboardQuery.error instanceof Error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {dashboardQuery.error.message}
          </div>
        ) : null}

        {statsQuery.error instanceof Error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {statsQuery.error.message}
          </div>
        ) : null}

        <DashboardSection
          title="Performance Summary"
          subtitle="A quick read across the four operating periods"
          accent="fo"
          contentClassName="p-4"
        >
          {dashboardQuery.isLoading || !periods ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-2xl bg-gray-50 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {summaryMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className={`rounded-2xl px-4 py-4 ${metric.surface}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${metric.text}`}>
                        {metric.label}
                      </p>
                      <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-slate-100">
                        {formatNaira(metric.revenue)}
                      </p>
                    </div>
                    <div className={`rounded-xl bg-white/70 p-2.5 ${metric.text} dark:bg-slate-900/40`}>
                      <FiCalendar className="text-lg" />
                    </div>
                  </div>
                  <div className="mt-4 border-t border-white/70 pt-4 dark:border-slate-700/60">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500 dark:text-slate-400">
                      Transactions
                    </p>
                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-slate-100">
                      {formatCompactNumber(metric.transactions)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardSection>

        <div className="grid gap-6 xl:grid-cols-2">
          {revenueByDepartmentData.length > 0 ? (
            <RevenueByDepartment data={revenueByDepartmentData} />
          ) : (
            <DashboardSection
              title="Revenue by Department"
              subtitle="Top performing departments"
              accent="fo"
            >
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Department revenue data is not available for this period.
              </p>
            </DashboardSection>
          )}

          <DashboardSection
            title="Agents Leaderboard"
            subtitle="Top agents by revenue in the selected period"
            accent="fo"
            contentClassName="overflow-x-auto p-0"
          >
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs uppercase tracking-[0.14em] text-gray-500 dark:bg-slate-800/70 dark:text-slate-400">
                  <th className="px-5 py-3 font-semibold">Rank</th>
                  <th className="px-5 py-3 font-semibold">Agent</th>
                  <th className="px-5 py-3 font-semibold text-right">Count</th>
                  <th className="px-5 py-3 font-semibold text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {statsQuery.isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr
                      key={index}
                      className="border-t border-gray-100 dark:border-slate-800"
                    >
                      <td className="px-5 py-4" colSpan={4}>
                        <div className="h-4 w-full animate-pulse rounded-full bg-gray-100 dark:bg-slate-800" />
                      </td>
                    </tr>
                  ))
                ) : leaderboardRows.length === 0 ? (
                  <tr>
                    <td
                      className="px-5 py-10 text-center text-sm text-gray-500 dark:text-slate-400"
                      colSpan={4}
                    >
                      Agent leaderboard data is not available for this period.
                    </td>
                  </tr>
                ) : (
                  leaderboardRows.map((row) => (
                    <tr
                      key={row.rank}
                      className="border-t border-gray-100 dark:border-slate-800"
                    >
                      <td className="px-5 py-3.5 font-medium text-gray-700 dark:text-slate-300">
                        {row.rank}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-emerald-700 dark:text-emerald-300">
                        {row.name}
                      </td>
                      <td className="px-5 py-3.5 text-right text-gray-600 dark:text-slate-300">
                        {formatCompactNumber(row.count)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-gray-900 dark:text-slate-100">
                        {formatNaira(row.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </DashboardSection>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <RevenueTrend data={revenueTrendData} />

          {paymentMethodData.length > 0 ? (
            <PaymentMethodBreakdown
              title="Payment Breakdown"
              subtitle="Collected value by payment method"
              data={paymentMethodData}
            />
          ) : (
            <DashboardSection
              title="Payment Breakdown"
              subtitle="Collected value by payment method"
              accent="fo"
            >
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Payment method totals are not available for the selected period.
              </p>
            </DashboardSection>
          )}
        </div>

        <RecentTransactions
          rows={recentTransactions}
          isLoading={recentTransactionsQuery.isLoading}
          subtitle="Latest 5 FO transactions from the current dashboard feed"
          emptyMessage="No recent transactions are available right now."
        />
      </div>
    </div>
  );
}

export default Page;
