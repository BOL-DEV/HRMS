"use client";

import AdminDashboardControls from "@/components/AdminDashboardControls";
import AdminDashboardTopHospitalsTable from "@/components/AdminDashboardTopHospitalsTable";
import DashboardFilterBar from "@/components/dashboard/DashboardFilterBar";
import DashboardHero from "@/components/dashboard/DashboardHero";
import DashboardKpiGrid from "@/components/dashboard/DashboardKpiGrid";
import DashboardSection from "@/components/dashboard/DashboardSection";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import { ApiError } from "@/libs/api";
import { getAdminDashboard } from "@/libs/admin-auth";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import { formatCompactNumber, formatNaira } from "@/libs/helper";
import type { AdminDashboardPeriod, AdminDashboardResponse, RevenueChartDatum } from "@/libs/type";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiDollarSign,
  FiFileText,
  FiUsers,
} from "react-icons/fi";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type HospitalRow = {
  id: string;
  name: string;
  revenue: number;
  transactions: number;
  agents: number;
  status: "Active" | "Inactive" | "Suspended";
};

function getStatusLabel(status: string) {
  if (status.toLowerCase() === "active") return "Active" as const;
  if (status.toLowerCase() === "suspended") return "Suspended" as const;
  return "Inactive" as const;
}

function Page() {
  const router = useRouter();
  const accessToken = getAccessToken();
  const [months, setMonths] = useState<AdminDashboardPeriod>("last_6_months");

  const dashboardQuery = useQuery({
    queryKey: ["admin-dashboard", months],
    queryFn: () => getAdminDashboard({ months }),
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
        : null;

    if (!error) {
      return;
    }

    if (error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
    }
  }, [dashboardQuery.error, router]);

  const dashboardData: AdminDashboardResponse["data"] | undefined =
    dashboardQuery.data?.data;

  const summary = useMemo(() => {
    return {
      totalHospitals: dashboardData?.summary.total_hospitals ?? 0,
      activeHospitals: dashboardData?.summary.active_hospitals ?? 0,
      totalRevenue: dashboardData?.summary.total_platform_revenue ?? 0,
      totalTransactions:
        dashboardData?.summary.total_transactions_made_by_agents ?? 0,
      totalAgents: dashboardData?.summary.total_agents_across_hospitals ?? 0,
    };
  }, [dashboardData]);

  const monthlyRevenue = useMemo<RevenueChartDatum[]>(() => {
    return (dashboardData?.revenueTrend ?? []).map((item, index) => ({
      name: item.month_label,
      value: item.revenue,
      color: ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd"][index % 4],
    }));
  }, [dashboardData]);

  const paymentMethods = useMemo<RevenueChartDatum[]>(() => {
    const palette = ["#2563eb", "#0ea5e9", "#10b981", "#f59e0b"];

    return (dashboardData?.transactionCountByPaymentMethod ?? []).map(
      (item, index) => ({
        name: item.payment_type.toUpperCase(),
        value: item.transaction_count,
        color: palette[index % palette.length],
      }),
    );
  }, [dashboardData]);

  const topHospitals = useMemo<HospitalRow[]>(() => {
    return (dashboardData?.highestPerformingHospitals ?? []).map((item) => ({
      id: item.hospital_id,
      name: item.hospital_name,
      revenue: item.revenue,
      transactions: item.transaction_count,
      agents: item.agent_count,
      status: getStatusLabel(item.status),
    }));
  }, [dashboardData]);

  const hospitalsByRevenue = useMemo<RevenueChartDatum[]>(() => {
    return (dashboardData?.hospitalsByRevenueGenerated ?? []).map((item) => ({
      name: item.hospital_name,
      value: item.revenue,
    }));
  }, [dashboardData]);

  const metricCards = [
    {
      title: "Platform Revenue",
      value: formatNaira(summary.totalRevenue),
      delta: `${formatCompactNumber(summary.totalHospitals)} hospitals tracked`,
      icon: <FiDollarSign className="text-xl" />,
      accentClassName:
        "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-white dark:border-blue-500/30 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30",
      iconClassName: "text-blue-700 dark:text-blue-300",
      iconBackgroundClassName: "bg-blue-100 dark:bg-blue-500/15",
      valueClassName: "text-blue-700 dark:text-blue-200",
    },
    {
      title: "Total Transactions",
      value: new Intl.NumberFormat("en-NG").format(summary.totalTransactions),
      delta: "Agent-generated transactions",
      icon: <FiFileText className="text-xl" />,
      accentClassName:
        "border-sky-200 bg-gradient-to-br from-sky-50 via-white to-white dark:border-sky-500/30 dark:from-slate-900 dark:via-slate-900 dark:to-sky-950/30",
      iconClassName: "text-sky-700 dark:text-sky-300",
      iconBackgroundClassName: "bg-sky-100 dark:bg-sky-500/15",
      valueClassName: "text-sky-700 dark:text-sky-200",
    },
    {
      title: "Active Hospitals",
      value: formatCompactNumber(summary.activeHospitals),
      delta: "Currently active on the platform",
      icon: <FiActivity className="text-xl" />,
      accentClassName:
        "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white dark:border-emerald-500/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/30",
      iconClassName: "text-emerald-700 dark:text-emerald-300",
      iconBackgroundClassName: "bg-emerald-100 dark:bg-emerald-500/15",
      valueClassName: "text-emerald-700 dark:text-emerald-200",
    },
    {
      title: "Total Agents",
      value: formatCompactNumber(summary.totalAgents),
      delta: "Active and inactive agents combined",
      icon: <FiUsers className="text-xl" />,
      accentClassName:
        "border-slate-200 bg-gradient-to-br from-slate-50 via-white to-white dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800",
      iconClassName: "text-slate-700 dark:text-slate-300",
      iconBackgroundClassName: "bg-slate-100 dark:bg-slate-700/60",
      valueClassName: "text-slate-800 dark:text-slate-100",
    },
  ];

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-slate-950">
      <Header
        title="Admin Dashboard"
        Subtitle="Platform revenue, hospital performance, and operating health"
      />

      <div className="space-y-6 p-6">
        <DashboardFilterBar
          eyebrow="Platform Overview"
          title="Revenue patterns across the network"
          description="Filter the time window, then compare platform growth against hospital performance."
          accent="admin"
          actions={
            <AdminDashboardControls
              months={months}
              onMonthsChange={setMonths}
            />
          }
        />

        <AdminDashboardControls
          mobile
          months={months}
          onMonthsChange={setMonths}
        />

        {dashboardQuery.error instanceof Error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {dashboardQuery.error.message}
          </div>
        ) : null}

        <DashboardHero
          side={
            dashboardQuery.isLoading ? (
              <DashboardKpiGrid className="xl:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-36 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                  />
                ))}
              </DashboardKpiGrid>
            ) : (
              <DashboardKpiGrid className="xl:grid-cols-2">
                {metricCards.map((item) => (
                  <StatCard
                    key={item.title}
                    title={item.title}
                    value={item.value}
                    delta={item.delta}
                    icon={item.icon}
                    accentClassName={item.accentClassName}
                    iconClassName={item.iconClassName}
                    iconBackgroundClassName={item.iconBackgroundClassName}
                    valueClassName={item.valueClassName}
                  />
                ))}
              </DashboardKpiGrid>
            )
          }
        >
          <DashboardSection
            title="Revenue Trend"
            subtitle="Monthly platform revenue across the network"
            accent="admin"
            className="h-full"
            contentClassName="h-[26rem] p-5"
          >
            {dashboardQuery.isLoading ? (
              <div className="h-full animate-pulse rounded-2xl bg-gray-50 dark:bg-slate-800" />
            ) : monthlyRevenue.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-gray-300 text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
                Revenue trend data is not available for the selected period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyRevenue}
                  margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    strokeOpacity={0.15}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "currentColor" }}
                    axisLine={{ stroke: "currentColor" }}
                    tickLine={{ stroke: "currentColor" }}
                  />
                  <YAxis
                    tickFormatter={(value) => value.toString()}
                    tick={{ fill: "currentColor" }}
                    axisLine={{ stroke: "currentColor" }}
                    tickLine={{ stroke: "currentColor" }}
                  />
                  <Tooltip
                    formatter={(value) => [formatNaira(Number(value)), "Revenue"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#2563eb" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </DashboardSection>
        </DashboardHero>

        <div className="grid gap-6 xl:grid-cols-2">
          <DashboardSection
            title="Platform Health"
            subtitle="Transaction distribution by payment method"
            accent="admin"
            contentClassName="p-5"
          >
            {dashboardQuery.isLoading ? (
              <div className="h-80 animate-pulse rounded-2xl bg-gray-50 dark:bg-slate-800" />
            ) : paymentMethods.length === 0 ? (
              <div className="flex h-80 items-center justify-center rounded-2xl border border-dashed border-gray-300 text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
                Payment method data is not available for the selected period.
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={paymentMethods}
                    margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="currentColor"
                      strokeOpacity={0.15}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "currentColor" }}
                      axisLine={{ stroke: "currentColor" }}
                      tickLine={{ stroke: "currentColor" }}
                    />
                    <YAxis
                      tickFormatter={(value) => value.toString()}
                      tick={{ fill: "currentColor" }}
                      axisLine={{ stroke: "currentColor" }}
                      tickLine={{ stroke: "currentColor" }}
                    />
                    <Tooltip
                      formatter={(value) => [
                        new Intl.NumberFormat("en-NG").format(Number(value)),
                        "Transactions",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#0ea5e9"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#0ea5e9" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </DashboardSection>

          <DashboardSection
            title="Hospital Ranking Snapshot"
            subtitle="Revenue comparison across hospitals on the platform"
            accent="admin"
            contentClassName="p-5"
          >
            {dashboardQuery.isLoading ? (
              <div className="h-80 animate-pulse rounded-2xl bg-gray-50 dark:bg-slate-800" />
            ) : hospitalsByRevenue.length === 0 ? (
              <div className="flex h-80 items-center justify-center rounded-2xl border border-dashed border-gray-300 text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
                Hospital revenue data is not available for the selected period.
              </div>
            ) : (
              <div className="space-y-3">
                {hospitalsByRevenue.slice(0, 5).map((hospital, index) => (
                  <div key={hospital.name}>
                    <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                          {index + 1}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-slate-100">
                          {hospital.name}
                        </span>
                      </div>
                      <span className="font-semibold text-gray-700 dark:text-slate-300">
                        {formatNaira(hospital.value)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-slate-800">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-sky-400"
                        style={{
                          width: `${Math.max(
                            10,
                            (hospital.value /
                              Math.max(...hospitalsByRevenue.map((item) => item.value), 1)) *
                              100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardSection>
        </div>

        <AdminDashboardTopHospitalsTable
          rows={topHospitals}
          isLoading={dashboardQuery.isLoading}
        />
      </div>
    </div>
  );
}

export default Page;
