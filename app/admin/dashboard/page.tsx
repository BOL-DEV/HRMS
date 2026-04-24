"use client";

import AdminDashboardCharts from "@/components/AdminDashboardCharts";
import AdminDashboardControls from "@/components/AdminDashboardControls";
import AdminDashboardSummaryCards from "@/components/AdminDashboardSummaryCards";
import AdminDashboardTopHospitalsTable from "@/components/AdminDashboardTopHospitalsTable";
import Header from "@/components/Header";
import { ApiError } from "@/libs/api";
import { getAdminDashboard, getAdminReportsOptions } from "@/libs/admin-auth";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import type { AdminDashboardPeriod, AdminDashboardResponse } from "@/libs/type";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type HospitalRow = {
  id: string;
  name: string;
  revenue: number;
  transactions: number;
  agents: number;
  status: "Active" | "Inactive" | "Suspended";
};

type RevenuePoint = {
  month: string;
  revenue: number;
};

type PaymentMethodPoint = {
  name: string;
  transactions: number;
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
  const [selectedHospitalIds, setSelectedHospitalIds] = useState<string[]>([]);

  const optionsQuery = useQuery({
    queryKey: ["admin-dashboard-options"],
    queryFn: getAdminReportsOptions,
    enabled: Boolean(accessToken),
  });

  const dashboardQuery = useQuery({
    queryKey: ["admin-dashboard", months, selectedHospitalIds],
    queryFn: () =>
      getAdminDashboard({
        months,
        hospitals: selectedHospitalIds.length ? selectedHospitalIds : undefined,
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
      dashboardQuery.error instanceof ApiError
        ? dashboardQuery.error
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
  }, [dashboardQuery.error, optionsQuery.error, router]);

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

  const monthlyRevenue = useMemo<RevenuePoint[]>(() => {
    return (dashboardData?.revenueTrend ?? []).map((item) => ({
      month: item.month_label,
      revenue: item.revenue,
    }));
  }, [dashboardData]);

  const paymentMethods = useMemo<PaymentMethodPoint[]>(() => {
    return (dashboardData?.transactionCountByPaymentMethod ?? []).map(
      (item) => ({
        name: item.payment_type.toUpperCase(),
        transactions: item.transaction_count,
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

  const hospitalsByRevenue = useMemo<HospitalRow[]>(() => {
    return (dashboardData?.hospitalsByRevenueGenerated ?? []).map((item) => ({
      id: item.hospital_id,
      name: item.hospital_name,
      revenue: item.revenue,
      transactions: item.transaction_count,
      agents: 0,
      status: "Active",
    }));
  }, [dashboardData]);

  const hospitalOptions = useMemo(
    () => optionsQuery.data?.data.hospitals ?? [],
    [optionsQuery.data?.data.hospitals],
  );

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-slate-950">
      <Header
        title="Admin Dashboard"
        Subtitle="Platform revenue, hospitals, agents, and transactions"
        actions={
          <AdminDashboardControls
            months={months}
            selectedHospitalIds={selectedHospitalIds}
            hospitalOptions={hospitalOptions}
            onMonthsChange={setMonths}
            onHospitalSelectionChange={setSelectedHospitalIds}
          />
        }
      />

      <div className="p-6 space-y-6">
        {dashboardQuery.error instanceof Error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {dashboardQuery.error.message}
          </div>
        ) : null}

        <AdminDashboardControls
          mobile
          months={months}
          selectedHospitalIds={selectedHospitalIds}
          hospitalOptions={hospitalOptions}
          onMonthsChange={setMonths}
          onHospitalSelectionChange={setSelectedHospitalIds}
        />

        <AdminDashboardSummaryCards
          isLoading={dashboardQuery.isLoading}
          summary={summary}
        />

        <AdminDashboardCharts
          monthlyRevenue={monthlyRevenue}
          paymentMethods={paymentMethods}
          hospitalsByRevenue={hospitalsByRevenue.map((hospital) => ({
            name: hospital.name,
            revenue: hospital.revenue,
          }))}
        />

        <AdminDashboardTopHospitalsTable rows={topHospitals} />
      </div>
    </div>
  );
}

export default Page;
