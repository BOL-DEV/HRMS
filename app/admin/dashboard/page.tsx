"use client";

import ChartWatermark from "@/components/shared/ChartWatermark";
import AdminDashboardTopHospitalsTable from "@/components/admin/AdminDashboardTopHospitalsTable";
import DashboardKpiGrid from "@/components/dashboard/DashboardKpiGrid";
import DashboardSection from "@/components/dashboard/DashboardSection";
import Header from "@/components/shared/Header";
import StatCard from "@/components/shared/StatCard";
import { ApiError } from "@/libs/api";
import { getAdminDashboard } from "@/libs/admin-auth";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import { BRAND_PRIMARY_CHART_COLOR } from "@/libs/brand";
import { formatCompactNumber, formatNaira } from "@/libs/helper";
import type { AdminDashboardResponse } from "@/libs/type";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import {
  FiActivity,
  FiAlertCircle,
  FiBriefcase,
  FiCreditCard,
  FiFileText,
  FiTrendingUp,
  FiUserCheck,
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

type OverviewCard = {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
  accentClassName: string;
  iconClassName: string;
  iconBackgroundClassName: string;
  valueClassName: string;
};

type AttentionItem = {
  label: string;
  value: number;
  tone: "danger" | "warning" | "neutral";
};

function formatShortDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getStatusLabel(status: string) {
  if (status.toLowerCase() === "active") return "Active" as const;
  if (status.toLowerCase() === "suspended") return "Suspended" as const;
  return "Inactive" as const;
}

function Page() {
  const router = useRouter();
  const accessToken = getAccessToken();

  const dashboardQuery = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: getAdminDashboard,
    enabled: Boolean(accessToken),
  });

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    const error =
      dashboardQuery.error instanceof ApiError ? dashboardQuery.error : null;

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

  const overview = dashboardData?.overview;
  const attention = dashboardData?.attention;
  const chartPeriod = dashboardData?.chart_period;

  const overviewCards: OverviewCard[] = [
    {
      title: "Monthly Revenue",
      value: formatNaira(overview?.total_revenue ?? 0),
      subtitle: "Current-month total revenue",
      icon: <FiCreditCard className="text-xl" />,
      accentClassName:
        "border-brand-200 bg-gradient-to-br from-brand-50 via-white to-white dark:border-brand-500/30 dark:from-slate-900 dark:via-slate-900 dark:to-brand-950/30",
      iconClassName: "text-brand-700 dark:text-brand-300",
      iconBackgroundClassName: "bg-brand-100 dark:bg-brand-500/15",
      valueClassName: "text-brand-700 dark:text-brand-200",
    },
    {
      title: "Monthly Transactions",
      value: new Intl.NumberFormat("en-NG").format(overview?.total_transactions ?? 0),
      subtitle: "Current-month completed transactions",
      icon: <FiFileText className="text-xl" />,
      accentClassName:
        "border-brand-100 bg-gradient-to-br from-canvas-alt via-white to-white dark:border-brand-400/30 dark:from-slate-900 dark:via-slate-900 dark:to-brand-900/30",
      iconClassName: "text-brand-800 dark:text-brand-200",
      iconBackgroundClassName: "bg-brand-50 dark:bg-brand-500/15",
      valueClassName: "text-brand-800 dark:text-brand-200",
    },
    {
      title: "Hospitals",
      value: formatCompactNumber(overview?.total_hospitals ?? 0),
      subtitle: `${overview?.active_hospitals ?? 0} active, ${overview?.suspended_hospitals ?? 0} suspended`,
      icon: <FiActivity className="text-xl" />,
      accentClassName:
        "border-brand-200 bg-gradient-to-br from-brand-100 via-white to-white dark:border-brand-500/30 dark:from-slate-900 dark:via-slate-900 dark:to-brand-950/30",
      iconClassName: "text-brand-700 dark:text-brand-300",
      iconBackgroundClassName: "bg-brand-100 dark:bg-brand-500/15",
      valueClassName: "text-brand-700 dark:text-brand-200",
    },
    {
      title: "Workforce",
      value: `${formatCompactNumber(overview?.active_agents ?? 0)} agents`,
      subtitle: `${overview?.total_agents ?? 0} total agents, ${overview?.active_fos ?? 0}/${overview?.total_fos ?? 0} active FOs`,
      icon: <FiUsers className="text-xl" />,
      accentClassName:
        "border-slate-200 bg-gradient-to-br from-slate-50 via-white to-white dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800",
      iconClassName: "text-slate-700 dark:text-slate-300",
      iconBackgroundClassName: "bg-slate-100 dark:bg-slate-700/60",
      valueClassName: "text-slate-800 dark:text-slate-100",
    },
  ];

  const attentionItems: AttentionItem[] = [
    {
      label: "Pending receipt reprints",
      value: attention?.pending_receipt_reprints ?? 0,
      tone: (attention?.pending_receipt_reprints ?? 0) > 0 ? "warning" : "neutral",
    },
    {
      label: "Suspended hospitals",
      value: attention?.suspended_hospitals ?? 0,
      tone: (attention?.suspended_hospitals ?? 0) > 0 ? "danger" : "neutral",
    },
    {
      label: "Suspended agents",
      value: attention?.suspended_agents ?? 0,
      tone: (attention?.suspended_agents ?? 0) > 0 ? "danger" : "neutral",
    },
    {
      label: "Suspended FOs",
      value: attention?.suspended_fos ?? 0,
      tone: (attention?.suspended_fos ?? 0) > 0 ? "danger" : "neutral",
    },
    {
      label: "Failed system events (7 days)",
      value: attention?.failed_system_events_last_7_days ?? 0,
      tone:
        (attention?.failed_system_events_last_7_days ?? 0) > 0
          ? "warning"
          : "neutral",
    },
  ];

  const paymentMethodBreakdown = dashboardData?.paymentMethodBreakdown ?? [];
  const monthlyRevenueTrend = dashboardData?.monthlyRevenueTrend ?? [];

  const topHospitals = (dashboardData?.topHospitals ?? []).map((item) => ({
    id: item.hospital_id,
    name: item.hospital_name,
    code: item.hospital_code,
    revenueType: item.revenue_type,
    revenue: item.revenue,
    transactions: item.transaction_count,
    agents: item.agent_count,
    pendingReceiptReprints: item.pending_receipt_reprints,
    status: getStatusLabel(item.status),
  }));

  return (
    <div className="min-h-screen w-full bg-canvas">
      <Header
        title="Admin Dashboard"
        Subtitle="Compact global snapshot across all hospitals"
      />

      <div className="space-y-6 p-6">
        {dashboardQuery.error instanceof Error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {dashboardQuery.error.message}
          </div>
        ) : null}

        {dashboardQuery.isLoading ? (
          <DashboardKpiGrid className="xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-2xl border border-line-subtle bg-panel"
              />
            ))}
          </DashboardKpiGrid>
        ) : (
          <DashboardKpiGrid className="xl:grid-cols-4">
            {overviewCards.map((item) => (
              <StatCard
                key={item.title}
                title={item.title}
                value={item.value}
                delta={item.subtitle}
                icon={item.icon}
                variant="compact"
                accentClassName={item.accentClassName}
                iconClassName={item.iconClassName}
                iconBackgroundClassName={item.iconBackgroundClassName}
                valueClassName={item.valueClassName}
              />
            ))}
          </DashboardKpiGrid>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <DashboardSection
            title="Monthly Revenue Trend"
            subtitle={
              chartPeriod
                ? `${chartPeriod.label.replaceAll("_", " ")} · ${formatShortDate(chartPeriod.start_date)} to ${formatShortDate(chartPeriod.end_date)}`
                : "Last 6 months"
            }
            accent="admin"
            contentClassName="h-[24rem] p-5"
          >
            {dashboardQuery.isLoading ? (
              <div className="h-full animate-pulse rounded-2xl bg-panel-muted" />
            ) : monthlyRevenueTrend.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-line-subtle text-sm text-gray-500 dark:text-slate-400">
                Revenue trend data is not available.
              </div>
            ) : (
              <div className="relative h-full">
                <ChartWatermark />
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyRevenueTrend}
                    margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="currentColor"
                      strokeOpacity={0.15}
                    />
                    <XAxis
                      dataKey="month_label"
                      tick={{ fill: "currentColor", fontSize: 12 }}
                      axisLine={{ stroke: "currentColor" }}
                      tickLine={{ stroke: "currentColor" }}
                    />
                    <YAxis
                      tickFormatter={(value) => formatCompactNumber(Number(value))}
                      tick={{ fill: "currentColor", fontSize: 12 }}
                      axisLine={{ stroke: "currentColor" }}
                      tickLine={{ stroke: "currentColor" }}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "transaction_count"
                          ? new Intl.NumberFormat("en-NG").format(Number(value))
                          : formatNaira(Number(value)),
                        name === "transaction_count" ? "Transactions" : "Revenue",
                      ]}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke={BRAND_PRIMARY_CHART_COLOR}
                      strokeWidth={3}
                      dot={{ r: 4, fill: BRAND_PRIMARY_CHART_COLOR }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </DashboardSection>

          <DashboardSection
            title="Attention"
            subtitle="Current-month operational items that need follow-up"
            accent="admin"
            contentClassName="p-5"
          >
            {dashboardQuery.isLoading ? (
              <div className="grid gap-3">
                {Array.from({ length: 7 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-16 animate-pulse rounded-2xl bg-panel-muted"
                  />
                ))}
              </div>
            ) : (
              <div className="grid gap-3">
                {attentionItems.map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
                      item.tone === "danger"
                        ? "border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30"
                        : item.tone === "warning"
                          ? "border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/20"
                          : "border-line-subtle bg-panel-muted"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-full p-2 ${
                          item.tone === "danger"
                            ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
                            : item.tone === "warning"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                              : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        <FiAlertCircle className="text-sm" />
                      </div>
                      <p className="text-sm font-medium text-gray-700 dark:text-slate-200">
                        {item.label}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-slate-100">
                      {new Intl.NumberFormat("en-NG").format(item.value)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </DashboardSection>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <DashboardSection
            title="Payment Method Breakdown"
            subtitle="Current-month revenue and transaction mix"
            accent="admin"
            contentClassName="p-5"
          >
            {dashboardQuery.isLoading ? (
              <div className="grid gap-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-24 animate-pulse rounded-2xl bg-panel-muted"
                  />
                ))}
              </div>
            ) : paymentMethodBreakdown.length === 0 ? (
              <div className="flex h-full min-h-48 items-center justify-center rounded-2xl border border-dashed border-line-subtle text-sm text-gray-500 dark:text-slate-400">
                Payment method data is not available.
              </div>
            ) : (
              <div className="space-y-3">
                {paymentMethodBreakdown.map((item) => (
                  <div
                    key={item.payment_type}
                    className="rounded-2xl border border-line-subtle bg-panel-muted p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-brand-100 p-2 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                          <FiBriefcase className="text-sm" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-slate-400">
                            {item.payment_type}
                          </p>
                          <p className="text-lg font-bold text-gray-900 dark:text-slate-100">
                            {formatNaira(item.revenue)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.14em] text-gray-500 dark:text-slate-400">
                          Transactions
                        </p>
                        <p className="text-base font-semibold text-gray-900 dark:text-slate-100">
                          {new Intl.NumberFormat("en-NG").format(
                            item.transaction_count,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardSection>

          <DashboardSection
            title="Hospital Mix"
            subtitle="Revenue processing model across hospitals"
            accent="admin"
            contentClassName="p-5"
          >
            {dashboardQuery.isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-36 animate-pulse rounded-2xl bg-panel-muted"
                  />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-5 dark:border-brand-900/60 dark:from-brand-950/20 dark:to-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-brand-100 p-2 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                      <FiUserCheck className="text-sm" />
                    </div>
                    <p className="text-sm font-semibold text-brand-900 dark:text-brand-200">
                      Manual Revenue Hospitals
                    </p>
                  </div>
                  <p className="mt-4 text-4xl font-black tracking-tight text-brand-700 dark:text-brand-200">
                    {overview?.hospital_mix.manual_revenue_hospitals ?? 0}
                  </p>
                </div>

                <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-canvas-alt to-white p-5 dark:border-brand-900/60 dark:from-brand-950/18 dark:to-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-brand-50 p-2 text-brand-800 dark:bg-brand-500/15 dark:text-brand-200">
                      <FiTrendingUp className="text-sm" />
                    </div>
                    <p className="text-sm font-semibold text-brand-900 dark:text-brand-200">
                      Automatic Revenue Hospitals
                    </p>
                  </div>
                  <p className="mt-4 text-4xl font-black tracking-tight text-brand-800 dark:text-brand-200">
                    {overview?.hospital_mix.automatic_revenue_hospitals ?? 0}
                  </p>
                </div>
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
