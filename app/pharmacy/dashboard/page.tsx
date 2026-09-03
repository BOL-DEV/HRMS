"use client";

import React, { useEffect } from "react";
import Header from "@/components/shared/Header";
import StatCard from "@/components/shared/StatCard";
import StatusPill from "@/components/shared/StatusPill";
import { formatCurrency, formatDateTime } from "@/libs/helper";
import {
  FiPackage,
  FiAlertTriangle,
  FiDollarSign,
  FiPlusCircle,
  FiFileText,
  FiArrowRight,
  FiRefreshCw,
  FiLayers,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAgentAccessToken, decodeJwt } from "@/libs/auth";
import { useQuery } from "@tanstack/react-query";
import {
  getPharmacyDashboardStats,
  getPharmacyProfile,
  getPharmacyRequests,
  getPharmacyStoreDashboard,
  getPharmacyStoreProfile,
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

  // Point pharmacist queries
  const {
    data: pointStatsData,
    isLoading: isPointLoading,
    error: pointError,
  } = useQuery({
    queryKey: ["pharmacy-point-dashboard"],
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

  const { data: pointProfileData } = useQuery({
    queryKey: ["pharmacy-point-profile"],
    queryFn: getPharmacyProfile,
    enabled: Boolean(accessToken && !isStoreManager),
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Store manager queries
  const {
    data: storeStatsData,
    isLoading: isStoreLoading,
    error: storeError,
  } = useQuery({
    queryKey: ["pharmacy-store-dashboard"],
    queryFn: getPharmacyStoreDashboard,
    enabled: Boolean(accessToken && isStoreManager),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: storeProfileData } = useQuery({
    queryKey: ["pharmacy-store-profile"],
    queryFn: getPharmacyStoreProfile,
    enabled: Boolean(accessToken && isStoreManager),
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
    return list;
  }, [requestsData]);

  if (!accessToken) {
    return null;
  }

  // --- STORE MANAGER VIEW ---
  if (isStoreManager) {
    const storeRaw = unwrapPharmacyData<any>(storeStatsData, {});
    const valuation = storeRaw?.inventory_valuation ?? {};
    const alerts = storeRaw?.alerts ?? {};
    const transfersSummary = storeRaw?.transfers_summary ?? {};
    const pointUnits = storeRaw?.point_units_overview ?? [];
    const recentStockAdditions = storeRaw?.recent_stock_additions ?? [];
    const storeUnit = storeRaw?.store_unit;

    return (
      <div className="min-h-screen w-full bg-gray-50 dark:bg-canvas">
        <Header
          title="Central Store Dashboard"
          Subtitle="Manage central warehouse inventory, supplier stock additions, and point dispatches"
        />

        <div className="space-y-6 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Central Store Overview
                </h1>
                {storeUnit?.name && (
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                    {storeUnit.name}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Real-time central warehouse valuation, alerts, and stock movements.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/pharmacy/transfers"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 shadow-sm"
              >
                <FiRefreshCw />
                Transfer Operations
              </Link>
              <Link
                href="/pharmacy/inventory"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <FiPackage />
                Store Inventory
              </Link>
            </div>
          </div>

          {isStoreLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-700 border-t-transparent"></div>
            </div>
          ) : storeError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
              Failed to load store dashboard metrics: {storeError instanceof Error ? storeError.message : "Server error"}
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Total Inventory Valuation"
                  value={formatCurrency(valuation.total_valuation ?? 0)}
                  delta={`${valuation.total_items_count ?? 0} Catalog Items`}
                  icon={<span className="text-xl font-bold">₦</span>}
                  accentClassName="border-brand-200 bg-white dark:border-brand-500/30 dark:bg-slate-900"
                  iconClassName="text-brand-700 dark:text-brand-300"
                  iconBackgroundClassName="bg-brand-50 dark:bg-brand-500/10"
                  valueClassName="text-brand-700 dark:text-brand-300"
                />
                <StatCard
                  title="Low / Out of Stock"
                  value={String((alerts.out_of_stock_count ?? 0) + (alerts.low_stock_count ?? 0))}
                  delta={`${alerts.out_of_stock_count ?? 0} Out / ${alerts.low_stock_count ?? 0} Low`}
                  deltaTone={(alerts.out_of_stock_count ?? 0) > 0 ? "negative" : "neutral"}
                  icon={<FiAlertTriangle className="text-xl" />}
                  accentClassName="border-amber-200 bg-white dark:border-amber-500/30 dark:bg-slate-900"
                  iconClassName="text-amber-700 dark:text-amber-300"
                  iconBackgroundClassName="bg-amber-50 dark:bg-amber-500/10"
                  valueClassName="text-amber-700 dark:text-amber-300"
                />
                <StatCard
                  title="Pending Transfers"
                  value={String(transfersSummary.pending_transfers_count ?? 0)}
                  delta={`${transfersSummary.completed_transfers_count ?? 0} completed`}
                  deltaTone={(transfersSummary.pending_transfers_count ?? 0) > 0 ? "negative" : "neutral"}
                  icon={<FiClock className="text-xl" />}
                  accentClassName="border-blue-200 bg-white dark:border-blue-500/30 dark:bg-slate-900"
                  iconClassName="text-blue-700 dark:text-blue-300"
                  iconBackgroundClassName="bg-blue-50 dark:bg-blue-500/10"
                  valueClassName="text-blue-700 dark:text-blue-300"
                />
                <StatCard
                  title="Items Dispatched"
                  value={String(transfersSummary.total_items_dispatched ?? 0)}
                  delta="Total units to branches"
                  icon={<FiCheckCircle className="text-xl" />}
                  accentClassName="border-emerald-200 bg-white dark:border-emerald-500/30 dark:bg-slate-900"
                  iconClassName="text-emerald-700 dark:text-emerald-300"
                  iconBackgroundClassName="bg-emerald-50 dark:bg-emerald-500/10"
                  valueClassName="text-emerald-700 dark:text-emerald-300"
                />
              </div>

              {/* Point Units Stock Overview & Recent Stock Additions Grid */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Point Units Overview */}
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center justify-between border-b border-gray-200 p-5 dark:border-slate-700">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <FiLayers className="text-brand-600" />
                        Pharmacy Point Units Overview
                      </h2>
                      <p className="text-xs text-gray-500">Live stock posture across all dispensing branch points.</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                          <th className="p-4 font-semibold">Point Unit</th>
                          <th className="p-4 font-semibold text-right">Total Stock Count</th>
                          <th className="p-4 font-semibold text-right">Out of Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {pointUnits.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="p-6 text-center text-gray-500 text-sm">
                              No active dispensing point units found.
                            </td>
                          </tr>
                        ) : (
                          pointUnits.map((pu: any) => (
                            <tr key={pu.unit_id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                              <td className="p-4 font-medium text-slate-900 dark:text-slate-100">
                                {pu.unit_name}
                              </td>
                              <td className="p-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                                {pu.total_stock_count ?? 0}
                              </td>
                              <td className="p-4 text-right">
                                {(pu.out_of_stock_items ?? 0) > 0 ? (
                                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-400">
                                    {pu.out_of_stock_items} items out
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                                    Adequate
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Supplier Stock Additions */}
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center justify-between border-b border-gray-200 p-5 dark:border-slate-700">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <FiPackage className="text-emerald-600" />
                        Recent Supplier Stock Additions
                      </h2>
                      <p className="text-xs text-gray-500">Warehouse intake shipments received from vendors.</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                          <th className="p-4 font-semibold">Drug Item</th>
                          <th className="p-4 font-semibold text-right">Qty Added</th>
                          <th className="p-4 font-semibold text-right">New Stock</th>
                          <th className="p-4 font-semibold">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {recentStockAdditions.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-gray-500 text-sm">
                              No recent stock additions logged.
                            </td>
                          </tr>
                        ) : (
                          recentStockAdditions.slice(0, 5).map((log: any) => (
                            <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                              <td className="p-4 font-medium text-slate-900 dark:text-slate-100">
                                {log.item_name}
                              </td>
                              <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                +{log.quantity_changed}
                              </td>
                              <td className="p-4 text-right font-medium text-slate-700 dark:text-slate-300">
                                {log.new_stock}
                              </td>
                              <td className="p-4 text-xs text-gray-400">
                                {formatDateTime(log.created_at)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // --- POINT PHARMACIST VIEW ---
  const pointRaw = unwrapPharmacyData<any>(pointStatsData, {});
  const salesSummary = pointRaw?.sales_summary ?? pointRaw?.sales ?? {};
  const alerts = pointRaw?.alerts ?? {};
  const topDrugs = pointRaw?.top_dispensed_drugs ?? [];
  const profileRaw = unwrapPharmacyData<any>(pointProfileData, {});
  const assignedUnit = profileRaw?.pharmacy_unit;

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-canvas">
      <Header
        title="Pharmacy Point Dashboard"
        Subtitle="Monitor point sales revenue, dispense prescriptions, and manage restock requests"
      />

      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Pharmacy Overview
              </h1>
              {assignedUnit?.name && (
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                  {assignedUnit.name}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Real-time sales, dispensing volume, and inventory status for this dispensing point.
            </p>
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
              href="/pharmacy/transfers"
              className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/5 dark:text-brand-300 dark:hover:bg-brand-500/10"
            >
              <FiRefreshCw />
              Request Restock
            </Link>
            <Link
              href="/pharmacy/inventory"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <FiPackage />
              Point Inventory
            </Link>
          </div>
        </div>

        {isPointLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-700 border-t-transparent"></div>
          </div>
        ) : pointError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
            Failed to load dashboard metrics: {pointError instanceof Error ? pointError.message : "Server error"}
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Sales Revenue"
                value={formatCurrency(salesSummary.total_revenue ?? 0)}
                delta="Dispensed collections"
                icon={<span className="text-xl font-bold">₦</span>}
                accentClassName="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                iconClassName="text-slate-700 dark:text-slate-300"
                iconBackgroundClassName="bg-slate-100 dark:bg-slate-800"
                valueClassName="text-slate-800 dark:text-slate-100"
              />
              <StatCard
                title="Dispensed Requests"
                value={String(salesSummary.total_dispensed_requests ?? salesSummary.today_dispensed_count ?? 0)}
                delta="Patient prescriptions"
                icon={<FiFileText className="text-xl" />}
                accentClassName="border-emerald-200 bg-white dark:border-emerald-500/30 dark:bg-slate-900"
                iconClassName="text-emerald-700 dark:text-emerald-300"
                iconBackgroundClassName="bg-emerald-50 dark:bg-emerald-500/10"
                valueClassName="text-emerald-700 dark:text-emerald-300"
              />
              <StatCard
                title="Low Stock Items"
                value={String(alerts.low_stock_count ?? 0)}
                delta="Requires restock"
                deltaTone={(alerts.low_stock_count ?? 0) > 0 ? "negative" : "neutral"}
                icon={<FiAlertTriangle className="text-xl" />}
                accentClassName="border-amber-200 bg-white dark:border-amber-500/30 dark:bg-slate-900"
                iconClassName="text-amber-700 dark:text-amber-300"
                iconBackgroundClassName="bg-amber-50 dark:bg-amber-500/10"
                valueClassName="text-amber-700 dark:text-amber-300"
              />
              <StatCard
                title="Out of Stock Items"
                value={String(alerts.out_of_stock_count ?? 0)}
                delta="Urgent attention needed"
                deltaTone={(alerts.out_of_stock_count ?? 0) > 0 ? "negative" : "neutral"}
                icon={<FiAlertTriangle className="text-xl" />}
                accentClassName="border-red-200 bg-white dark:border-red-500/30 dark:bg-slate-900"
                iconClassName="text-red-700 dark:text-red-300"
                iconBackgroundClassName="bg-red-50 dark:bg-red-500/10"
                valueClassName="text-red-700 dark:text-red-300"
              />
            </div>

            {/* Payment Collections Breakdown & Top Dispensed Drugs */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Payment Methods Breakdown */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Revenue Breakdown by Channel
                </h2>
                <p className="text-xs text-gray-500 mb-4">Distribution of patient dispensing payments.</p>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-gray-100 bg-slate-50/50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/30">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cash</p>
                    <p className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {formatCurrency(salesSummary.cash_revenue ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-slate-50/50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/30">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">POS</p>
                    <p className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {formatCurrency(salesSummary.pos_revenue ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-slate-50/50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/30">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Transfer</p>
                    <p className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {formatCurrency(salesSummary.transfer_revenue ?? 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Top Selling Drugs */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-gray-200 p-5 dark:border-slate-700">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Top Dispensed Drugs</h2>
                    <p className="text-xs text-gray-500">Highest volume medication dispensed at this point.</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                        <th className="p-4 font-semibold">Drug Name</th>
                        <th className="p-4 font-semibold text-right">Qty Dispensed</th>
                        <th className="p-4 font-semibold text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                      {topDrugs.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-6 text-center text-gray-500 text-sm">
                            No dispensed drugs recorded yet.
                          </td>
                        </tr>
                      ) : (
                        topDrugs.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-4 font-medium text-slate-900 dark:text-slate-100">
                              {item.item_name}
                            </td>
                            <td className="p-4 text-right font-bold text-slate-700 dark:text-slate-300">
                              {item.total_quantity}
                            </td>
                            <td className="p-4 text-right font-semibold text-brand-700 dark:text-brand-400">
                              {formatCurrency(item.total_revenue ?? 0)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Pending Billing Requests Queue */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-gray-200 p-5 dark:border-slate-700">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Pending Billing Requests</h2>
                  <p className="text-xs text-gray-500">Track pending prescriptions ready for cashier checkout or self-pay.</p>
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
          </>
        )}
      </div>
    </div>
  );
}

