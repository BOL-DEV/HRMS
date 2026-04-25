"use client";

import DashboardFilterBar from "@/components/dashboard/DashboardFilterBar";
import DashboardHero from "@/components/dashboard/DashboardHero";
import DashboardSection from "@/components/dashboard/DashboardSection";
import DashboardSegmentedControl from "@/components/dashboard/DashboardSegmentedControl";
import Header from "@/components/Header";
import PaymentMethodBreakdown from "@/components/PaymentMethodBreakdown";
import RecentTransactions from "@/components/RecentTransactions";
import RevenueBarChart from "@/components/RevenueBarChart";
import StatCard from "@/components/StatCard";
import { ApiError } from "@/libs/api";
import { getAgentDashboard } from "@/libs/agent-auth";
import { clearAgentTokens, getAgentAccessToken } from "@/libs/auth";
import { formatChartLabel, formatCompactNumber, formatCurrency, formatDateTime } from "@/libs/helper";
import type { AgentDashboardPeriod } from "@/libs/type";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
} from "react-icons/fi";

const periodOptions: Array<{
  label: string;
  value: AgentDashboardPeriod;
}> = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "This Week", value: "current_week" },
];

const periodLabels: Record<AgentDashboardPeriod, string> = {
  today: "Today",
  yesterday: "Yesterday",
  current_week: "This Week",
};

function Page() {
  const router = useRouter();
  const [timePeriod, setTimePeriod] = useState<AgentDashboardPeriod>("today");
  const accessToken = getAgentAccessToken();

  const dashboardQuery = useQuery({
    queryKey: ["agent-dashboard", timePeriod],
    queryFn: () => getAgentDashboard(timePeriod),
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
      clearAgentTokens();
      router.replace("/login");
    }
  }, [dashboardQuery.error, router]);

  const stats = dashboardQuery.data?.data.stats;

  const recentTransactions = useMemo(
    () =>
      (dashboardQuery.data?.data.recent_transactions ?? []).map((item) => ({
        patientName: item.patient_name,
        patientId: item.patient_id,
        billName: item.bill_name,
        departmentName: item.department,
        amount: Number(item.amount),
        status: item.status,
        createdAt: formatDateTime(item.date_time),
      })),
    [dashboardQuery.data],
  );

  const revenueTrend = useMemo(() => {
    const grouped = new Map<string, number>();

    for (const item of dashboardQuery.data?.data.recent_transactions ?? []) {
      const label = formatChartLabel(item.date_time);
      grouped.set(label, (grouped.get(label) ?? 0) + Number(item.amount));
    }

    return Array.from(grouped.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [dashboardQuery.data]);

  const paymentMethodBreakdown = useMemo(() => {
    const totals = dashboardQuery.data?.data.stats.payment_method_totals;

    if (!totals) {
      return [];
    }

    return [
      { name: "Cash", value: totals.cash, color: "#0f766e" },
      { name: "POS", value: totals.pos, color: "#f59e0b" },
      { name: "Transfer", value: totals.transfer, color: "#2563eb" },
    ];
  }, [dashboardQuery.data]);

  const statusMessage =
    dashboardQuery.error instanceof Error
      ? dashboardQuery.error.message
      : "Unable to load dashboard data.";

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-slate-950">
      <Header
        title="Agent Dashboard"
        Subtitle="Track your wallet, performance, and recent transactions"
      />

      <div className="space-y-6 p-6">
        <DashboardFilterBar
          eyebrow="Agent Workspace"
          title="Daily performance at a glance"
          description="Keep your balance, collections, and transaction pace in one place."
          accent="agent"
          actions={
            <DashboardSegmentedControl
              value={timePeriod}
              options={periodOptions}
              onChange={setTimePeriod}
              accent="agent"
            />
          }
        />

        {dashboardQuery.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {statusMessage}
          </div>
        ) : null}

        <DashboardHero
          side={
            dashboardQuery.isLoading || !stats ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-36 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                />
              ))
            ) : (
              <>
                <StatCard
                  title={`Revenue (${periodLabels[timePeriod]})`}
                  value={formatCurrency(stats.revenue_made)}
                  delta={`Period: ${periodLabels[stats.time_period]}`}
                  deltaTone="positive"
                  icon={<FiActivity className="text-xl" />}
                  accentClassName="border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white dark:border-amber-500/30 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/30"
                  iconClassName="text-amber-700 dark:text-amber-300"
                  iconBackgroundClassName="bg-amber-100 dark:bg-amber-500/15"
                  valueClassName="text-amber-700 dark:text-amber-200"
                />
                <StatCard
                  title={`Transactions (${periodLabels[timePeriod]})`}
                  value={formatCompactNumber(stats.transaction_count)}
                  delta="Completed transactions"
                  icon={<FiFileText className="text-xl" />}
                  accentClassName="border-blue-200 bg-gradient-to-br from-blue-50 via-white to-white dark:border-blue-500/30 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30"
                  iconClassName="text-blue-700 dark:text-blue-300"
                  iconBackgroundClassName="bg-blue-100 dark:bg-blue-500/15"
                  valueClassName="text-blue-700 dark:text-blue-200"
                />
                <StatCard
                  title="Last Wallet Topup"
                  value={formatCurrency(stats.last_wallet_topup)}
                  delta="Most recent topup"
                  icon={<FiCreditCard className="text-xl" />}
                  accentClassName="border-slate-200 bg-gradient-to-br from-slate-50 via-white to-white dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800"
                  iconClassName="text-slate-700 dark:text-slate-300"
                  iconBackgroundClassName="bg-slate-100 dark:bg-slate-700/60"
                  valueClassName="text-slate-800 dark:text-slate-100"
                />
              </>
            )
          }
        >
          <DashboardSection
            title="Wallet Balance"
            subtitle="Your available operating balance and live period snapshot"
            accent="agent"
            contentClassName="p-6"
            className="h-full"
          >
            {dashboardQuery.isLoading || !stats ? (
              <div className="space-y-5">
                <div className="h-5 w-40 animate-pulse rounded-full bg-gray-100 dark:bg-slate-800" />
                <div className="h-14 w-72 animate-pulse rounded-full bg-gray-100 dark:bg-slate-800" />
                <div className="grid gap-3 sm:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-24 animate-pulse rounded-2xl bg-gray-50 dark:bg-slate-800"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-3xl bg-gradient-to-br from-amber-500 via-amber-400 to-blue-500 p-[1px]">
                  <div className="rounded-[calc(1.5rem-1px)] bg-white px-6 py-6 dark:bg-slate-950">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
                          Available balance
                        </p>
                        <p className="mt-3 text-4xl font-semibold tracking-tight text-gray-950 dark:text-white sm:text-5xl">
                          {formatCurrency(stats.balance)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-amber-100 p-3 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                        <FiDollarSign className="text-2xl" />
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-amber-50 px-4 py-4 dark:bg-amber-500/10">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
                          Revenue
                        </p>
                        <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-slate-100">
                          {formatCurrency(stats.revenue_made)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-blue-50 px-4 py-4 dark:bg-blue-500/10">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
                          Transactions
                        </p>
                        <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-slate-100">
                          {formatCompactNumber(stats.transaction_count)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-4 dark:bg-slate-800">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
                          Active Period
                        </p>
                        <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-slate-100">
                          {periodLabels[stats.time_period]}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DashboardSection>
        </DashboardHero>

        <div className="grid gap-6 xl:grid-cols-2">
          <RevenueBarChart
            title="Recent Revenue Pattern"
            subtitle="Revenue grouped from your latest dashboard transactions"
            data={revenueTrend}
          />

          <PaymentMethodBreakdown
            title="Payment Mix"
            subtitle="Collected value by payment type for the selected period"
            data={paymentMethodBreakdown}
          />
        </div>

        <RecentTransactions
          rows={recentTransactions}
          isLoading={dashboardQuery.isLoading}
          subtitle="Latest 5 transactions in your dashboard feed"
          emptyMessage="No recent transactions are available for this period."
        />
      </div>
    </div>
  );
}

export default Page;
