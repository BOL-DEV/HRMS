"use client";

import Header from "@/components/Header";
import PaymentMethodBreakdown from "@/components/PaymentMethodBreakdown";
import RecentTransactions from "@/components/RecentTransactions";
import RevenueByDepartment from "@/components/RevenueByDepartment";
import RevenueTrend from "@/components/RevenueTrend";
import AgentPerformance from "@/components/AgentPerformance";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FiCalendar } from "react-icons/fi";
import { ApiError } from "@/libs/api";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import { getFoDashboard, getFoStats } from "@/libs/fo-auth";
import { formatCompactNumber, formatNaira } from "@/libs/helper";
import {
  FoStatsTimePeriod,
  RecentTransactionDisplayRow,
  RevenueChartDatum,
} from "@/libs/type";

function StatsPeriodCard({
  accentClassName,
  revenueLabel,
  transCountLabel,
  revenue,
  transCount,
}: {
  accentClassName: string;
  revenueLabel: string;
  transCountLabel: string;
  revenue: number;
  transCount: number;
}) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl p-5 flex items-start justify-between border-l-4 dark:border-slate-700 dark:bg-slate-900 ${accentClassName}`}
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-gray-500 dark:text-slate-400">
            {revenueLabel}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1 dark:text-slate-100">
            {formatNaira(revenue)}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-wide text-gray-500 dark:text-slate-400">
            {transCountLabel}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1 dark:text-slate-100">
            {formatCompactNumber(transCount)}
          </p>
        </div>
      </div>

      <div className="text-gray-200 mt-2 dark:text-slate-700">
        <FiCalendar className="text-4xl" />
      </div>
    </div>
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

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    if (!(dashboardQuery.error instanceof ApiError)) {
      return;
    }

    if (dashboardQuery.error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
    }
  }, [dashboardQuery.error, router]);

  useEffect(() => {
    if (!(statsQuery.error instanceof ApiError)) {
      return;
    }

    if (statsQuery.error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
    }
  }, [router, statsQuery.error]);

  const periods = dashboardQuery.data?.data.periods;
  const statsData = statsQuery.data?.data;

  const revenueTrendData = useMemo<RevenueChartDatum[]>(
    () =>
      periods
        ? [
            { name: "Today", value: periods.today.total_revenue },
            { name: "This Month", value: periods.this_month.total_revenue },
            { name: "Last Month", value: periods.last_month.total_revenue },
            { name: "This Year", value: periods.this_year.total_revenue },
          ]
        : [],
    [periods],
  );

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
    const totalValue = methods.reduce((sum, item) => sum + item.total_value, 0);
    const colors = ["#2563EB", "#10B981", "#F59E0B", "#EF4444"];

    return methods.map((item, index) => ({
      name:
        item.payment_type === "cash"
          ? "Cash"
          : item.payment_type === "transfer"
            ? "Transfer"
            : "POS",
      value:
        totalValue === 0
          ? 0
          : Number(((item.total_value / totalValue) * 100).toFixed(1)),
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
    () => [],
    [],
  );

  return (
    <div className="w-full bg-gray-50 min-h-screen dark:bg-slate-950">
      <Header
        title="Financial Office Dashboard"
        Subtitle="Monitor hospital revenue, agent performance, and transactions"
        actions={
          <select
            value={statsPeriod}
            onChange={(event) =>
              setStatsPeriod(event.target.value as FoStatsTimePeriod)
            }
            className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium md:block hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="this_year">This Year</option>
          </select>
        }
      />

      <div className="p-6 space-y-6">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {dashboardQuery.isLoading || !periods ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900"
              />
            ))
          ) : (
            <>
              <StatsPeriodCard
                accentClassName="border-red-600"
                revenueLabel="REVENUE (TODAY)"
                transCountLabel="TRANSACTIONS (TODAY)"
                revenue={periods.today.total_revenue}
                transCount={periods.today.transaction_count}
              />
              <StatsPeriodCard
                accentClassName="border-green-600"
                revenueLabel="REVENUE (THIS MONTH)"
                transCountLabel="TRANSACTIONS (THIS MONTH)"
                revenue={periods.this_month.total_revenue}
                transCount={periods.this_month.transaction_count}
              />
              <StatsPeriodCard
                accentClassName="border-pink-900"
                revenueLabel="REVENUE (LAST MONTH)"
                transCountLabel="TRANSACTIONS (LAST MONTH)"
                revenue={periods.last_month.total_revenue}
                transCount={periods.last_month.transaction_count}
              />
              <StatsPeriodCard
                accentClassName="border-yellow-600"
                revenueLabel="REVENUE (THIS YEAR)"
                transCountLabel="TRANSACTIONS (THIS YEAR)"
                revenue={periods.this_year.total_revenue}
                transCount={periods.this_year.transaction_count}
              />
            </>
          )}
        </div>

        <div className="flex flex-col mb-10 gap-6">
          <RevenueTrend data={revenueTrendData} />
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <RevenueByDepartment data={revenueByDepartmentData} />

            <div className="bg-white border border-gray-200 rounded-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="p-5 flex items-start justify-between border-b border-gray-200 dark:border-slate-700">
                <div>
                  <h2 className="text-xl font-bold">Agents Leader Board</h2>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Top agents by revenue
                  </p>
                </div>
                <FiCalendar className="text-2xl text-gray-300 dark:text-slate-600" />
              </div>

              <div className="p-5 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 bg-gray-100 dark:bg-slate-800 dark:text-slate-300">
                      <th className="p-3 font-semibold">#</th>
                      <th className="p-3 font-semibold">Name</th>
                      <th className="p-3 font-semibold text-right">Count</th>
                      <th className="p-3 font-semibold text-right">Amount ₦</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statsQuery.isLoading ? (
                      <tr className="border-b border-gray-100 dark:border-slate-800">
                        <td
                          className="p-4 text-gray-500 dark:text-slate-400"
                          colSpan={4}
                        >
                          Loading leaderboard...
                        </td>
                      </tr>
                    ) : leaderboardRows.length === 0 ? (
                      <tr className="border-b border-gray-100 dark:border-slate-800">
                        <td
                          className="p-4 text-gray-500 dark:text-slate-400"
                          colSpan={4}
                        >
                          Agent leaderboard data is not available for this
                          period.
                        </td>
                      </tr>
                    ) : (
                      leaderboardRows.map((row) => (
                        <tr
                          key={row.rank}
                          className="border-b border-gray-100 dark:border-slate-800"
                        >
                          <td className="p-3 text-gray-700 dark:text-slate-300">
                            {row.rank}
                          </td>
                          <td className="p-3 font-semibold text-blue-600 whitespace-nowrap dark:text-blue-300">
                            {row.name}
                          </td>
                          <td className="p-3 text-gray-700 dark:text-slate-300 text-right whitespace-nowrap">
                            {formatCompactNumber(row.count)}
                          </td>
                          <td className="p-3 font-semibold text-gray-900 dark:text-slate-100 text-right whitespace-nowrap">
                            {formatNaira(row.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* <div className="grid grid-cols-1 gap-6"> */}
        <PaymentMethodBreakdown data={paymentMethodData} />
        {/* </div> */}

        <AgentPerformance
          rows={[]}
          subtitle="Current month statistics"
          emptyMessage="Agent performance data is not available from the current FO dashboard endpoint."
        />

        <RecentTransactions
          rows={recentTransactions}
          subtitle="Latest FO transactions"
          emptyMessage="Recent transactions are not available from the current FO dashboard endpoint."
        />
      </div>
    </div>
  );
}

export default Page;
