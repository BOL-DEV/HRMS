"use client";

import React, { useEffect } from "react";
import Header from "@/components/shared/Header";
import StatCard from "@/components/shared/StatCard";
import StatusPill from "@/components/shared/StatusPill";
import { formatCurrency, formatDateTime } from "@/libs/helper";
import { FiPackage, FiAlertTriangle, FiDollarSign, FiPlusCircle, FiFileText, FiArrowRight } from "react-icons/fi";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAgentAccessToken } from "@/libs/auth";
import { useQuery } from "@tanstack/react-query";
import { getPharmacyDashboardStats, PharmacyDashboardStats } from "@/libs/pharmacy-api";

export default function PharmacyDashboardPage() {
  const router = useRouter();
  const accessToken = typeof window !== "undefined" ? getAgentAccessToken() : null;

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  // Fetch live dashboard stats using react-query
  const { data: statsData, isLoading, error } = useQuery({
    queryKey: ["pharmacy-dashboard"],
    queryFn: getPharmacyDashboardStats,
    enabled: Boolean(accessToken),
    refetchInterval: 10000, // auto refresh every 10 seconds for real-time dashboard feeling
  });

  if (!accessToken) {
    return null;
  }

  const stats: PharmacyDashboardStats = (statsData as any)?.data || statsData || {
    revenue_today: 0,
    total_count_dispensed: 0,
    pending_requests_count: 0,
    low_stock_count: 0,
    total_inventory_value: 0,
    pending_requests: [],
    low_stock_items: [],
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-canvas">
      <Header
        title="Pharmacy Dashboard"
        Subtitle="Monitor drug stock, inventory thresholds, and dispensing bills"
      />

      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Pharmacy Overview</h1>
            <p className="text-sm text-gray-500">Real-time stats from the hospital pharmacy department.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/pharmacy/dispense"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 shadow-sm"
            >
              <FiPlusCircle />
              Dispense Drugs
            </Link>
            <Link
              href="/pharmacy/inventory"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              View Inventory
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-700 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
            Failed to load dashboard metrics: {error instanceof Error ? error.message : "Server error"}
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Revenue Today"
                value={formatCurrency(stats.revenue_today)}
                delta="Direct collections"
                icon={<FiDollarSign className="text-xl" />}
                accentClassName="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                iconClassName="text-slate-700 dark:text-slate-300"
                iconBackgroundClassName="bg-slate-100 dark:bg-slate-800"
                valueClassName="text-slate-800 dark:text-slate-100"
              />
              <StatCard
                title="Low / Out of Stock"
                value={String(stats.low_stock_count)}
                delta="Restock required"
                deltaTone={stats.low_stock_count > 0 ? "negative" : "neutral"}
                icon={<FiAlertTriangle className="text-xl" />}
                accentClassName="border-amber-200 bg-white dark:border-amber-500/30 dark:bg-slate-900"
                iconClassName="text-amber-700 dark:text-amber-300"
                iconBackgroundClassName="bg-amber-50 dark:bg-amber-500/10"
                valueClassName="text-amber-700 dark:text-amber-300"
              />
              <StatCard
                title="Inventory Valuation"
                value={formatCurrency(stats.total_inventory_value)}
                delta="Total stock assets"
                icon={<FiPackage className="text-xl" />}
                accentClassName="border-brand-200 bg-white dark:border-brand-500/30 dark:bg-slate-900"
                iconClassName="text-brand-700 dark:text-brand-300"
                iconBackgroundClassName="bg-brand-50 dark:bg-brand-500/10"
                valueClassName="text-brand-700 dark:text-brand-300"
              />
              <StatCard
                title="Dispensed Today"
                value={String(stats.total_count_dispensed)}
                delta="Prescriptions cleared"
                icon={<FiFileText className="text-xl" />}
                accentClassName="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                iconClassName="text-slate-700 dark:text-slate-300"
                iconBackgroundClassName="bg-slate-100 dark:bg-slate-800"
                valueClassName="text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Recent Prescription Bills */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-gray-200 p-5 dark:border-slate-700">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Pending Billing Requests</h2>
                  <p className="text-xs text-gray-500">Track and copy codes to verify payments at the cashier&apos;s checkout terminal.</p>
                </div>
                <Link
                  href="/pharmacy/dispense"
                  className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  New Prescription <FiArrowRight />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                      <th className="p-4 font-semibold">Bill Code</th>
                      <th className="p-4 font-semibold">Patient Name</th>
                      <th className="p-4 font-semibold">Phone Number</th>
                      <th className="p-4 font-semibold">Amount</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold">Date Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {stats.pending_requests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500">
                          No pending prescriptions generated yet. Go to Dispense to generate one.
                        </td>
                      </tr>
                    ) : (
                      stats.pending_requests.map((bill) => (
                        <tr key={bill.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-4 font-mono font-bold text-brand-700 dark:text-brand-400">
                            {bill.billing_code}
                          </td>
                          <td className="p-4 font-medium text-slate-900 dark:text-slate-100">
                            {bill.patient_name}
                          </td>
                          <td className="p-4 text-slate-500 dark:text-slate-400">
                            {bill.phone_number}
                          </td>
                          <td className="p-4 font-semibold text-slate-900 dark:text-slate-100">
                            {formatCurrency(bill.total_amount)}
                          </td>
                          <td className="p-4">
                            <StatusPill status="Pending" />
                          </td>
                          <td className="p-4 text-xs text-gray-400">
                            {formatDateTime(bill.created_at)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
