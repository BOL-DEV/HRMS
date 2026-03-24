"use client";

import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import RecentTransactions from "@/components/RecentTransactions";
import RevenueBarChart from "@/components/RevenueBarChart";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
} from "react-icons/fi";
import { formatCurrency, formatCompactNumber } from "@/libs/helper";
import { getAgentDashboard } from "@/libs/agent-auth";
import { ApiError } from "@/libs/api";
import { clearAgentTokens, getAgentAccessToken } from "@/libs/auth";
import { formatDateTime, formatChartLabel } from "@/libs/helper";
import type { AgentDashboardPeriod } from "@/libs/type";

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

  const stats = useMemo(() => {
    const dashboardStats = dashboardQuery.data?.data.stats;

    if (!dashboardStats) {
      return [];
    }

    const labels: Record<AgentDashboardPeriod, string> = {
      today: "Today",
      yesterday: "Yesterday",
      current_week: "This Week",
    };

    return [
      {
        title: "Current Balance",
        value: formatCurrency(dashboardStats.balance),
        delta: "Available wallet balance",
        deltaTone: "neutral" as const,
        icon: <FiDollarSign className="text-xl" />,
      },
      {
        title: `Revenue (${labels[timePeriod]})`,
        value: formatCurrency(dashboardStats.revenue_made),
        delta: `Period: ${labels[dashboardStats.time_period]}`,
        deltaTone: "positive" as const,
        icon: <FiActivity className="text-xl" />,
      },
      {
        title: `Transactions (${labels[timePeriod]})`,
        value: formatCompactNumber(dashboardStats.transaction_count),
        delta: "Completed transactions",
        deltaTone: "neutral" as const,
        icon: <FiFileText className="text-xl" />,
      },
      {
        title: "Last Wallet Topup",
        value: formatCurrency(dashboardStats.last_wallet_topup),
        delta: "Most recent topup",
        deltaTone: "neutral" as const,
        icon: <FiCreditCard className="text-xl" />,
      },
    ];
  }, [dashboardQuery.data, timePeriod]);

  const recentTransactions = useMemo(
    () =>
      (dashboardQuery.data?.data.recent_transactions ?? []).map((item) => ({
        id: item.id,
        patientName: item.patient_name,
        phoneNumber: item.phone_number,
        billDescription: item.bill_description,
        departmentName: item.department_name,
        amount: Number(item.amount),
        status: item.status,
        createdAt: formatDateTime(item.created_at),
      })),
    [dashboardQuery.data],
  );

  const revenueTrend = useMemo(() => {
    const grouped = new Map<string, number>();

    for (const item of dashboardQuery.data?.data.recent_transactions ?? []) {
      const label = formatChartLabel(item.created_at);
      grouped.set(label, (grouped.get(label) ?? 0) + Number(item.amount));
    }

    return Array.from(grouped.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [dashboardQuery.data]);

  const statusMessage =
    dashboardQuery.error instanceof Error
      ? dashboardQuery.error.message
      : "Unable to load dashboard data.";

  return (
    <div className="min-h-screen w-full bg-gray-100 dark:bg-slate-950">
      <Header
        title="Agent Dashboard"
        Subtitle="Track your wallet, revenue, and recent transactions"
        actions={
          <select
            value={timePeriod}
            onChange={(event) =>
              setTimePeriod(event.target.value as AgentDashboardPeriod)
            }
            className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium md:block hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="current_week">This Week</option>
          </select>
        }
      />

      <div className="p-6 space-y-6">
        <select
          value={timePeriod}
          onChange={(event) =>
            setTimePeriod(event.target.value as AgentDashboardPeriod)
          }
          className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium md:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="current_week">This Week</option>
        </select>

        {dashboardQuery.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {statusMessage}
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {dashboardQuery.isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-36 animate-pulse rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                />
              ))
            : stats.map((s) => (
                <StatCard
                  key={s.title}
                  title={s.title}
                  value={s.value}
                  delta={s.delta}
                  deltaTone={s.deltaTone}
                  icon={s.icon}
                />
              ))}
        </div>

        <RecentTransactions
          rows={recentTransactions}
          isLoading={dashboardQuery.isLoading}
        />

        <RevenueBarChart
          title="Revenue Trend"
          subtitle="Revenue grouped from the most recent transactions returned by the API"
          data={revenueTrend}
        />
      </div>
    </div>
  );
}

export default Page;
