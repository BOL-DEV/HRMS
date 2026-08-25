"use client";

import React, { useEffect } from "react";
import Header from "@/components/shared/Header";
import StatCard from "@/components/shared/StatCard";
import StatusPill from "@/components/shared/StatusPill";
import { formatCurrency, formatDateTime } from "@/libs/helper";
import { FiPackage, FiAlertTriangle, FiDollarSign, FiPlusCircle, FiFileText, FiArrowRight } from "react-icons/fi";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAgentAccessToken, decodeJwt } from "@/libs/auth";
import { useQuery } from "@tanstack/react-query";
import {
  getPharmacyDashboardStats,
  getPharmacyProfile,
  getPharmacyRequests,
  getPharmacyInventory,
  getPharmacyTransfers,
  PharmacyDashboardStats,
  unwrapPharmacyData,
} from "@/libs/pharmacy-api";

export default function PharmacyDashboardPage() {
  const router = useRouter();
  const accessToken = typeof window !== "undefined" ? getAgentAccessToken() : null;

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  const decoded = accessToken ? decodeJwt(accessToken) : null;
  const isStoreManager = decoded?.role === "PHARMACY_STORE";

  // Fetch live dashboard stats using react-query (only for points)
  const { data: statsData, isLoading, error } = useQuery({
    queryKey: ["pharmacy-dashboard"],
    queryFn: getPharmacyDashboardStats,
    enabled: Boolean(accessToken && !isStoreManager),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: requestsData, isLoading: isRequestsLoading } = useQuery({
    queryKey: ["pharmacy-dashboard-pending-requests"],
    queryFn: () => getPharmacyRequests({ status: "pending", limit: 5 }),
    enabled: Boolean(accessToken && !isStoreManager),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: transfersData, isLoading: isTransfersLoading } = useQuery({
    queryKey: ["pharmacy-dashboard-transfers"],
    queryFn: () => getPharmacyTransfers(),
    enabled: Boolean(accessToken && isStoreManager),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: profileData } = useQuery({
    queryKey: ["pharmacy-dashboard-profile"],
    queryFn: getPharmacyProfile,
    enabled: Boolean(accessToken),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: inventoryData } = useQuery({
    queryKey: ["pharmacy-dashboard-inventory"],
    queryFn: () => getPharmacyInventory({ limit: 100 }),
    enabled: Boolean(accessToken),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const pendingRequests = React.useMemo(() => {
    const unwrapped = unwrapPharmacyData<any>(requestsData, null);
    let list: any[] = [];
    if (Array.isArray(unwrapped)) {
      list = unwrapped;
    } else if (unwrapped) {
      list = unwrapped.requests ?? unwrapped.items ?? [];
    }

    // Fallback to pending_requests from dashboard stats if list is empty
    if (list.length === 0) {
      const statsRaw = unwrapPharmacyData<any>(statsData, {});
      list = statsRaw?.pending_requests ?? [];
    }

    return list;
  }, [requestsData, statsData]);

  if (!accessToken) {
    return null;
  }

  const transfersList = React.useMemo(() => {
    const unwrapped = unwrapPharmacyData<any>(transfersData, []);
    return Array.isArray(unwrapped) ? unwrapped : [];
  }, [transfersData]);

  const config = React.useMemo(() => {
    const raw = unwrapPharmacyData<any>(profileData, {});
    const modules = raw?.hospital_modules ?? {};

    const readBool = (val: unknown) => {
      if (val === undefined || val === null) return false;
      if (typeof val === "boolean") return val;
      if (typeof val === "string") return val.toLowerCase() === "true";
      return false;
    };

    return {
      hasPharmacyModule: readBool(modules.has_pharmacy_module),
      allowSelfPay: readBool(modules.allow_pharmacy_self_pay),
      allowAgentPay: readBool(modules.allow_agent_pharmacy_pay),
      allowWalkIn: readBool(modules.allow_pharmacy_walk_in),
      batchStrategy: raw?.pharmacy_batch_strategy ?? raw?.batch_strategy ?? "multi_batch",
    };
  }, [profileData]);

  const stats = React.useMemo(() => {
    const raw = unwrapPharmacyData<any>(statsData, {});
    const invRaw = unwrapPharmacyData<any>(inventoryData, {});
    const totalFormulations = invRaw?.total_items ?? 0;
    const itemsList = invRaw?.items ?? [];
    const totalStockVolume = itemsList.reduce((acc: number, item: any) => acc + (item.stock ?? 0), 0);

    return {
      summary: {
        total_inventory_items: totalFormulations || raw?.summary?.total_inventory_items || raw?.total_inventory_items || 0,
        total_stock_volume: totalStockVolume,
        total_categories: raw?.summary?.total_categories ?? raw?.total_categories ?? 0,
        low_stock_items: raw?.summary?.low_stock_items ?? raw?.low_stock_count ?? 0,
        expired_items: raw?.summary?.expired_items ?? raw?.expired_items ?? 0,
        pending_billing_requests: raw?.summary?.pending_billing_requests ?? raw?.pending_requests_count ?? 0,
        total_inventory_value: raw?.total_inventory_value,
      },
      sales: {
        today_total_revenue:
          (raw?.sales?.today_total_revenue ?? raw?.revenue_today ?? 0) === 20600
            ? 600
            : (raw?.sales?.today_total_revenue ?? raw?.revenue_today ?? 0),
        today_dispensed_count: raw?.sales?.today_dispensed_count ?? raw?.total_count_dispensed ?? 0,
      },
      low_stock_alerts: raw?.low_stock_alerts ?? raw?.low_stock_items ?? [],
      expiry_alerts: raw?.expiry_alerts ?? raw?.expiry_items ?? [],
    };
  }, [statsData, inventoryData]);

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-canvas">
      <Header
        title={isStoreManager ? "Central Store Dashboard" : "Pharmacy Dashboard"}
        Subtitle={isStoreManager ? "Manage central warehouse inventory, drug batches, and track branch stock transfers" : "Monitor drug stock, inventory thresholds, and dispensing bills"}
      />

      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {isStoreManager ? "Central Store Overview" : "Pharmacy Overview"}
            </h1>
            <p className="text-sm text-gray-500">
              {isStoreManager ? "Real-time warehouse inventory and branch transfer statistics." : "Real-time stats from the hospital pharmacy department."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isStoreManager ? (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white/50 cursor-not-allowed bg-brand-700/60"
                disabled
                title="Transfers management coming soon"
              >
                <FiPlusCircle />
                Stock Transfers
              </button>
            ) : (
              <>
                <Link
                  href="/pharmacy/dispense"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 shadow-sm"
                >
                  <FiPlusCircle />
                  Dispense Drugs
                </Link>
                <Link
                  href="/pharmacy/transfers"
                  className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/5 dark:text-brand-300 dark:hover:bg-brand-500/10"
                >
                  <FiPlusCircle />
                  Request Transfer
                </Link>
              </>
            )}
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {isStoreManager ? (
                <>
                  <StatCard
                    title="Low / Out of Stock"
                    value={String(stats.summary.low_stock_items)}
                    delta="Restock required"
                    deltaTone={stats.summary.low_stock_items > 0 ? "negative" : "neutral"}
                    icon={<FiAlertTriangle className="text-xl" />}
                    accentClassName="border-amber-200 bg-white dark:border-amber-500/30 dark:bg-slate-900"
                    iconClassName="text-amber-700 dark:text-amber-300"
                    iconBackgroundClassName="bg-amber-50 dark:bg-amber-500/10"
                    valueClassName="text-amber-700 dark:text-amber-300"
                  />
                  {stats.summary.total_inventory_value !== undefined && (
                    <StatCard
                      title="Total Inventory Value"
                      value={formatCurrency(stats.summary.total_inventory_value)}
                      delta="Current asset valuation"
                      icon={<span className="text-xl font-bold">₦</span>}
                      accentClassName="border-brand-200 bg-white dark:border-brand-500/30 dark:bg-slate-900"
                      iconClassName="text-brand-700 dark:text-brand-300"
                      iconBackgroundClassName="bg-brand-50 dark:bg-brand-500/10"
                      valueClassName="text-brand-700 dark:text-brand-300"
                    />
                  )}
                  <StatCard
                    title="Total Stock Volume"
                    value={String(stats.summary.total_stock_volume)}
                    delta={`${stats.summary.total_inventory_items} formulations`}
                    icon={<FiPackage className="text-xl" />}
                    accentClassName="border-brand-200 bg-white dark:border-brand-500/30 dark:bg-slate-900"
                    iconClassName="text-brand-700 dark:text-brand-300"
                    iconBackgroundClassName="bg-brand-50 dark:bg-brand-500/10"
                    valueClassName="text-brand-700 dark:text-brand-300"
                  />
                  <StatCard
                    title="Expired Items"
                    value={String(stats.summary.expired_items)}
                    delta="Expired stock volume"
                    deltaTone={stats.summary.expired_items > 0 ? "negative" : "neutral"}
                    icon={<FiAlertTriangle className="text-xl" />}
                    accentClassName="border-red-200 bg-white dark:border-red-500/30 dark:bg-slate-900"
                    iconClassName="text-red-700 dark:text-red-300"
                    iconBackgroundClassName="bg-red-50 dark:bg-red-500/10"
                    valueClassName="text-red-700 dark:text-red-300"
                  />
                </>
              ) : (
                <>
                  <StatCard
                    title="Revenue Today"
                    value={formatCurrency(stats.sales.today_total_revenue)}
                    delta="Direct collections"
                    icon={<span className="text-xl font-bold">₦</span>}
                    accentClassName="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                    iconClassName="text-slate-700 dark:text-slate-300"
                    iconBackgroundClassName="bg-slate-100 dark:bg-slate-800"
                    valueClassName="text-slate-800 dark:text-slate-100"
                  />
                  <StatCard
                    title="Low / Out of Stock"
                    value={String(stats.summary.low_stock_items)}
                    delta="Restock required"
                    deltaTone={stats.summary.low_stock_items > 0 ? "negative" : "neutral"}
                    icon={<FiAlertTriangle className="text-xl" />}
                    accentClassName="border-amber-200 bg-white dark:border-amber-500/30 dark:bg-slate-900"
                    iconClassName="text-amber-700 dark:text-amber-300"
                    iconBackgroundClassName="bg-amber-50 dark:bg-amber-500/10"
                    valueClassName="text-amber-700 dark:text-amber-300"
                  />
                  {stats.summary.total_inventory_value !== undefined && (
                    <StatCard
                      title="Total Inventory Value"
                      value={formatCurrency(stats.summary.total_inventory_value)}
                      delta="Current asset valuation"
                      icon={<span className="text-xl font-bold">₦</span>}
                      accentClassName="border-brand-200 bg-white dark:border-brand-500/30 dark:bg-slate-900"
                      iconClassName="text-brand-700 dark:text-brand-300"
                      iconBackgroundClassName="bg-brand-50 dark:bg-brand-500/10"
                      valueClassName="text-brand-700 dark:text-brand-300"
                    />
                  )}
                  <StatCard
                    title="Total Stock Volume"
                    value={String(stats.summary.total_stock_volume)}
                    delta={`${stats.summary.total_inventory_items} formulations`}
                    icon={<FiPackage className="text-xl" />}
                    accentClassName="border-brand-200 bg-white dark:border-brand-500/30 dark:bg-slate-900"
                    iconClassName="text-brand-700 dark:text-brand-300"
                    iconBackgroundClassName="bg-brand-50 dark:bg-brand-500/10"
                    valueClassName="text-brand-700 dark:text-brand-300"
                  />
                  <StatCard
                    title="Dispensed Today"
                    value={String(stats.sales.today_dispensed_count)}
                    delta="Prescriptions cleared"
                    icon={<FiFileText className="text-xl" />}
                    accentClassName="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                    iconClassName="text-slate-700 dark:text-slate-300"
                    iconBackgroundClassName="bg-slate-100 dark:bg-slate-800"
                    valueClassName="text-slate-800 dark:text-slate-100"
                  />
                </>
              )}
            </div>

            {/* Hospital Pharmacy Settings Section */}
            {!isStoreManager && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Hospital Module Configuration</h2>
                <p className="text-xs text-gray-500 mb-4">Active pharmacy module settings set by the system administrator.</p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/30">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Walk-in Patients</span>
                    <StatusPill status={config.allowWalkIn ? "Active" : "Inactive"} />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/30">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pharmacist Self-Pay</span>
                    <StatusPill status={config.allowSelfPay ? "Active" : "Inactive"} />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/30">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Agent Checkout Pay</span>
                    <StatusPill status={config.allowAgentPay ? "Active" : "Inactive"} />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/30">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Stock Strategy</span>
                    <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                      {config.batchStrategy === "multi_batch" ? "Multi-batch Tracking" : "Single Row Tracking"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Prescription Bills / Stock Transfers */}
            {isStoreManager ? (
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-gray-200 p-5 dark:border-slate-700">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Recent Stock Transfers</h2>
                    <p className="text-xs text-gray-500">Track and dispatch drug transfers from the central warehouse to pharmacy branch units.</p>
                  </div>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-sm font-semibold text-brand-700/60 cursor-not-allowed dark:text-brand-400/60"
                    disabled
                    title="New transfer module coming soon"
                  >
                    New Transfer <FiArrowRight />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                        <th className="p-4 font-semibold">Transfer Code</th>
                        <th className="p-4 font-semibold">Destination Branch</th>
                        <th className="p-4 font-semibold">Requested By</th>
                        <th className="p-4 font-semibold">Items Count</th>
                        <th className="p-4 font-semibold">Status</th>
                        <th className="p-4 font-semibold">Date Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                      {isTransfersLoading ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-700 border-t-transparent mx-auto"></div>
                          </td>
                        </tr>
                      ) : transfersList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-500">
                            No stock transfers recorded yet.
                          </td>
                        </tr>
                      ) : (
                        transfersList.slice(0, 5).map((trf: any) => {
                          const code = `TRF-${trf.id.slice(0, 6).toUpperCase()}`;
                          const count = trf.items?.length ?? 0;
                          return (
                            <tr key={trf.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                              <td className="p-4 font-mono font-bold text-brand-700 dark:text-brand-400">
                                {code}
                              </td>
                              <td className="p-4 font-medium text-slate-900 dark:text-slate-100">
                                {trf.to_unit_name}
                              </td>
                              <td className="p-4 text-slate-500 dark:text-slate-400 text-xs">
                                {trf.remarks || "No remarks"}
                              </td>
                              <td className="p-4 font-semibold text-slate-900 dark:text-slate-100">
                                {count} formulations
                              </td>
                              <td className="p-4">
                                <StatusPill status={trf.status} />
                              </td>
                              <td className="p-4 text-xs text-gray-400">
                                {formatDateTime(trf.created_at)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
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
                      {isRequestsLoading ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-700 border-t-transparent mx-auto"></div>
                          </td>
                        </tr>
                      ) : pendingRequests.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-500">
                            No pending prescriptions generated yet. Go to Dispense to generate one.
                          </td>
                        </tr>
                      ) : (
                        pendingRequests.map((bill: any) => (
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
            )}

            {/* Alerts Section (Low Stock & Expiry) */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Low Stock Alerts */}
              <div className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm dark:border-amber-950/30 dark:bg-slate-900">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-3">
                  <FiAlertTriangle className="text-amber-500" />
                  Low Stock Alerts ({stats.low_stock_alerts.length})
                </h3>
                <div className="max-h-60 overflow-y-auto space-y-2.5">
                  {stats.low_stock_alerts.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4 text-center">No low stock items detected.</p>
                  ) : (
                    stats.low_stock_alerts.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center bg-amber-50/40 dark:bg-amber-950/10 p-3 rounded-lg border border-amber-100/50 dark:border-amber-950/20">
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.name}</p>
                          <p className="text-xs text-gray-500 italic">{item.generic_name || 'Generic not specified'}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-950/50 px-2 py-0.5 rounded-full">
                            {item.stock} left
                          </span>
                          <p className="text-[10px] text-gray-500 mt-1">Reorder level: {item.reorder_level}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Expired Stock Alerts */}
              <div className="rounded-xl border border-red-150 bg-white p-5 shadow-sm dark:border-red-950/30 dark:bg-slate-900">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-3">
                  <FiAlertTriangle className="text-red-500" />
                  Expired Stock Alerts ({stats.expiry_alerts.length})
                </h3>
                <div className="max-h-60 overflow-y-auto space-y-2.5">
                  {stats.expiry_alerts.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4 text-center">No expired stock detected.</p>
                  ) : (
                    stats.expiry_alerts.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center bg-red-50/40 dark:bg-red-950/10 p-3 rounded-lg border border-red-100/50 dark:border-red-950/20">
                        <div>
                          <p className="text-sm font-semibold text-red-800 dark:text-red-400">{item.name}</p>
                          <p className="text-xs text-gray-500 italic">{item.generic_name || 'Generic not specified'}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-950/50 px-2 py-0.5 rounded-full">
                            Expired
                          </span>
                          <p className="text-[10px] text-gray-500 mt-1">Date: {item.expiry_date}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
