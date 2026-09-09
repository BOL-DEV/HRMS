"use client";

import React, { useEffect } from "react";
import Header from "@/components/shared/Header";
import StatCard from "@/components/shared/StatCard";
import StatusPill from "@/components/shared/StatusPill";
import { formatCurrency, formatDateTime, formatDate } from "@/libs/helper";
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
    const storeUnit = storeRaw?.store_unit;
    const totalItems = storeRaw?.total_store_items ?? storeRaw?.inventory_valuation?.total_items_count ?? 0;
    const outOfStockCount = storeRaw?.out_of_stock_count ?? storeRaw?.alerts?.out_of_stock_count ?? 0;
    const lowStockCount = storeRaw?.low_stock_count ?? storeRaw?.alerts?.low_stock_count ?? 0;
    const expiringSoonCount = storeRaw?.expiring_soon_count ?? storeRaw?.alerts?.expiring_soon_count ?? 0;
    const expiredCount = storeRaw?.expired_count ?? storeRaw?.alerts?.expired_count ?? 0;
    const pendingTransfers = storeRaw?.pending_transfers_count ?? storeRaw?.transfers_summary?.pending_transfers_count ?? 0;
    const completedTransfers = storeRaw?.completed_transfers_today ?? storeRaw?.transfers_summary?.completed_transfers_count ?? 0;
    const unitsOverview = storeRaw?.units_overview;
    const pointUnits = storeRaw?.point_units_overview ?? [];
    const lowStockItems = storeRaw?.store_low_stock_items ?? [];
    const expiringItems = storeRaw?.store_expiring_items ?? [];
    const recentStockAdditions = storeRaw?.recent_stock_additions ?? [];

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
                Real-time central warehouse inventory alerts, expiring items, and stock movements.
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
                  title="Total Formulations"
                  value={String(totalItems)}
                  delta="Central warehouse catalog"
                  icon={<FiPackage className="text-xl" />}
                  accentClassName="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                  iconClassName="text-slate-700 dark:text-slate-300"
                  iconBackgroundClassName="bg-slate-100 dark:bg-slate-800"
                  valueClassName="text-slate-900 dark:text-slate-100"
                />
                <StatCard
                  title="Out of Stock Items"
                  value={String(outOfStockCount)}
                  delta="Zero stock in warehouse"
                  deltaTone={outOfStockCount > 0 ? "negative" : "neutral"}
                  icon={<FiAlertTriangle className="text-xl" />}
                  accentClassName="border-red-200 bg-white dark:border-red-500/30 dark:bg-slate-900"
                  iconClassName="text-red-700 dark:text-red-300"
                  iconBackgroundClassName="bg-red-50 dark:bg-red-500/10"
                  valueClassName="text-red-700 dark:text-red-300"
                />
                <StatCard
                  title="Low Stock Items"
                  value={String(lowStockCount)}
                  delta="Below reorder threshold"
                  deltaTone={lowStockCount > 0 ? "negative" : "neutral"}
                  icon={<FiAlertTriangle className="text-xl" />}
                  accentClassName="border-amber-200 bg-white dark:border-amber-500/30 dark:bg-slate-900"
                  iconClassName="text-amber-700 dark:text-amber-300"
                  iconBackgroundClassName="bg-amber-50 dark:bg-amber-500/10"
                  valueClassName="text-amber-700 dark:text-amber-300"
                />
                <StatCard
                  title="Expiring / Expired"
                  value={`${expiringSoonCount} / ${expiredCount}`}
                  delta={`${expiringSoonCount} soon, ${expiredCount} expired`}
                  deltaTone={(expiringSoonCount + expiredCount) > 0 ? "negative" : "neutral"}
                  icon={<FiClock className="text-xl" />}
                  accentClassName="border-purple-200 bg-white dark:border-purple-500/30 dark:bg-slate-900"
                  iconClassName="text-purple-700 dark:text-purple-300"
                  iconBackgroundClassName="bg-purple-50 dark:bg-purple-500/10"
                  valueClassName="text-purple-700 dark:text-purple-300"
                />
              </div>

              {/* Row 1: Low / Out of Stock Formulations & Expiring Drugs */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Low & Out of Stock Items */}
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center justify-between border-b border-gray-200 p-5 dark:border-slate-700">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <FiAlertTriangle className="text-amber-600" />
                        Warehouse Stock Depletion Alerts
                      </h2>
                      <p className="text-xs text-gray-500">Items requiring supplier restocking or replenishment.</p>
                    </div>
                    <Link
                      href="/pharmacy/inventory"
                      className="text-xs font-semibold text-brand-700 hover:text-brand-600 dark:text-brand-400"
                    >
                      View Catalog &rarr;
                    </Link>
                  </div>
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400 sticky top-0 z-10 backdrop-blur-xs">
                          <th className="p-4 font-semibold">Formulation</th>
                          <th className="p-4 font-semibold text-center">Stock</th>
                          <th className="p-4 font-semibold text-center">Reorder Limit</th>
                          <th className="p-4 font-semibold text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {lowStockItems.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-gray-500 text-sm">
                              No stock depletion alerts logged.
                            </td>
                          </tr>
                        ) : (
                          lowStockItems.slice(0, 10).map((item: any) => (
                            <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                              <td className="p-4">
                                <p className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                                <p className="text-xs text-gray-500">{item.category_name || "General"}</p>
                              </td>
                              <td className="p-4 text-center font-bold text-red-600 dark:text-red-400">
                                {item.stock}
                              </td>
                              <td className="p-4 text-center text-gray-500 font-medium">
                                {item.reorder_level}
                              </td>
                              <td className="p-4 text-center">
                                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                                  item.stock === 0
                                    ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
                                    : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400"
                                }`}>
                                  {item.stock === 0 ? "Out of stock" : (item.status || "Low stock")}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Expiring & Expired Items */}
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center justify-between border-b border-gray-200 p-5 dark:border-slate-700">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <FiClock className="text-purple-600" />
                        Expiring & Expired Batches
                      </h2>
                      <p className="text-xs text-gray-500">Monitor batch shelf-life and overdue formulations.</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400 sticky top-0 z-10 backdrop-blur-xs">
                          <th className="p-4 font-semibold">Formulation</th>
                          <th className="p-4 font-semibold">Expiry Date</th>
                          <th className="p-4 font-semibold text-center">Shelf Life</th>
                          <th className="p-4 font-semibold text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {expiringItems.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-gray-500 text-sm">
                              No expiring or expired formulations found.
                            </td>
                          </tr>
                        ) : (
                          expiringItems.slice(0, 10).map((item: any) => {
                            const days = item.days_until_expiry;
                            const isExpired = days !== undefined ? days <= 0 : item.status?.toLowerCase().includes("expired");
                            return (
                              <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                                <td className="p-4">
                                  <p className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                                  <p className="text-xs text-gray-500">{item.category_name || "General"}</p>
                                </td>
                                <td className="p-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                                  {formatDate(item.expiry_date)}
                                </td>
                                <td className="p-4 text-center">
                                  {days !== undefined ? (
                                    <span className={`text-xs font-bold ${
                                      days <= 0 ? "text-rose-600 dark:text-rose-400" : "text-purple-600 dark:text-purple-400"
                                    }`}>
                                      {days < 0 ? `${Math.abs(days)}d ago` : days === 0 ? "Today" : `In ${days}d`}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-xs">—</span>
                                  )}
                                </td>
                                <td className="p-4 text-center">
                                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                                    isExpired
                                      ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400"
                                      : "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400"
                                  }`}>
                                    {item.status || (isExpired ? "Expired" : "Expiring soon")}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Row 2: Recent Supplier Stock Additions & Hospital Unit Network */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400 sticky top-0 z-10 backdrop-blur-xs">
                          <th className="p-4 font-semibold">Drug Item</th>
                          <th className="p-4 font-semibold text-right">Qty Added</th>
                          <th className="p-4 font-semibold text-right">New Stock</th>
                          <th className="p-4 font-semibold">Pharmacist</th>
                          <th className="p-4 font-semibold">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {recentStockAdditions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-gray-500 text-sm">
                              No recent stock additions logged.
                            </td>
                          </tr>
                        ) : (
                          recentStockAdditions.slice(0, 10).map((log: any) => (
                            <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                              <td className="p-4 font-medium text-slate-900 dark:text-slate-100">
                                {log.drug_name || log.item_name || log.name || log.pharmacy_item?.name || log.item?.name || "—"}
                              </td>
                              <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                +{log.quantity_changed}
                              </td>
                              <td className="p-4 text-right font-medium text-slate-700 dark:text-slate-300">
                                {log.new_stock}
                              </td>
                              <td className="p-4 text-xs text-slate-500 dark:text-slate-400">
                                {log.pharmacist_name || "—"}
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

                {/* Hospital Pharmacy Network Overview */}
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-slate-700">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <FiLayers className="text-brand-600" />
                        Hospital Pharmacy Network Posture
                      </h2>
                      <p className="text-xs text-gray-500">Overview of active pharmacy store and dispensing point units.</p>
                    </div>
                  </div>

                  {/* Units summary cards */}
                  <div className="grid grid-cols-3 gap-3 my-5">
                    <div className="rounded-xl border border-gray-100 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/40">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Units</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {unitsOverview?.total_units ?? (pointUnits.length + 1)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-center dark:border-emerald-900/30 dark:bg-emerald-950/20">
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Active Points</p>
                      <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                        {unitsOverview?.active_points_count ?? pointUnits.length}
                      </p>
                    </div>
                    <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 text-center dark:border-brand-900/30 dark:bg-brand-950/20">
                      <p className="text-xs font-semibold text-brand-700 dark:text-brand-400 uppercase tracking-wider">Central Stores</p>
                      <p className="text-xl font-bold text-brand-700 dark:text-brand-400 mt-1">
                        {unitsOverview?.active_stores_count ?? 1}
                      </p>
                    </div>
                  </div>

                  {/* Point Units list if available */}
                  {pointUnits.length > 0 ? (
                    <div className="overflow-x-auto max-h-48 border border-gray-100 rounded-xl dark:border-slate-800">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                            <th className="p-3 font-semibold">Point Unit</th>
                            <th className="p-3 font-semibold text-right">Total Stock</th>
                            <th className="p-3 font-semibold text-right">Out of Stock</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                          {pointUnits.map((pu: any) => (
                            <tr key={pu.unit_id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                              <td className="p-3 font-medium text-slate-900 dark:text-slate-100">
                                {pu.unit_name}
                              </td>
                              <td className="p-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                                {pu.total_stock_count ?? 0}
                              </td>
                              <td className="p-3 text-right">
                                {(pu.out_of_stock_items ?? 0) > 0 ? (
                                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-400">
                                    {pu.out_of_stock_items} out
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                                    Adequate
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-500 dark:border-slate-800">
                      Dispatches from Central Store automatically route stock to these active branch units.
                    </div>
                  )}
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
  const salesSummary = pointRaw?.sales_summary ?? pointRaw?.sales ?? pointRaw?.revenue_summary ?? pointRaw?.summary ?? pointRaw ?? {};
  const alerts = pointRaw?.alerts ?? pointRaw?.inventory_alerts ?? pointRaw?.stock_alerts ?? pointRaw?.inventory_summary ?? pointRaw ?? {};
  const topDrugs = pointRaw?.top_dispensed_drugs ?? pointRaw?.top_drugs ?? pointRaw?.top_selling_drugs ?? [];
  const profileRaw = unwrapPharmacyData<any>(pointProfileData, {});
  const assignedUnit = profileRaw?.pharmacy_unit ?? profileRaw?.unit ?? pointRaw?.pharmacy_unit ?? pointRaw?.unit;

  const totalSalesRevenue = pointRaw?.revenue_today ?? salesSummary.total_revenue ?? salesSummary.total_sales ?? salesSummary.total_amount ?? pointRaw?.total_sales_revenue ?? 0;
  const dispensedRequests = pointRaw?.total_count_dispensed ?? salesSummary.total_dispensed_requests ?? salesSummary.today_dispensed_count ?? salesSummary.dispensed_requests ?? salesSummary.total_requests ?? pointRaw?.total_dispensed_requests ?? 0;
  const pendingRequestsCount = pointRaw?.pending_requests_count ?? (Array.isArray(pointRaw?.pending_requests) ? pointRaw.pending_requests.length : 0);
  const lowStockCount = pointRaw?.low_stock_count ?? alerts.low_stock_count ?? alerts.low_stock_items ?? alerts.low_stock ?? 0;
  const totalInventoryValue = pointRaw?.total_inventory_value ?? 0;

  const lowStockItems: any[] = Array.isArray(pointRaw?.low_stock_items)
    ? pointRaw.low_stock_items
    : Array.isArray(pointRaw?.stock_alerts)
    ? pointRaw.stock_alerts
    : [];

  const pointPendingRequests: any[] = Array.isArray(pointRaw?.pending_requests) && pointRaw.pending_requests.length > 0
    ? pointRaw.pending_requests
    : pendingRequests;

  const cashRevenue = salesSummary.cash_revenue ?? salesSummary.cash ?? 0;
  const posRevenue = salesSummary.pos_revenue ?? salesSummary.pos ?? 0;
  const transferRevenue = salesSummary.transfer_revenue ?? salesSummary.transfer ?? 0;
  const hasChannelBreakdown = cashRevenue > 0 || posRevenue > 0 || transferRevenue > 0;

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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <StatCard
                title="Today's Revenue"
                value={formatCurrency(totalSalesRevenue)}
                delta="Dispensed collections today"
                icon={<span className="text-xl font-bold">₦</span>}
                accentClassName="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                iconClassName="text-slate-700 dark:text-slate-300"
                iconBackgroundClassName="bg-slate-100 dark:bg-slate-800"
                valueClassName="text-slate-800 dark:text-slate-100"
              />
              <StatCard
                title="Dispensed Today"
                value={String(dispensedRequests)}
                delta="Patient prescriptions"
                icon={<FiFileText className="text-xl" />}
                accentClassName="border-emerald-200 bg-white dark:border-emerald-500/30 dark:bg-slate-900"
                iconClassName="text-emerald-700 dark:text-emerald-300"
                iconBackgroundClassName="bg-emerald-50 dark:bg-emerald-500/10"
                valueClassName="text-emerald-700 dark:text-emerald-300"
              />
              <StatCard
                title="Pending Requests"
                value={String(pendingRequestsCount)}
                delta="Awaiting dispensing / checkout"
                deltaTone={pendingRequestsCount > 0 ? "negative" : "neutral"}
                icon={<FiClock className="text-xl" />}
                accentClassName="border-amber-200 bg-white dark:border-amber-500/30 dark:bg-slate-900"
                iconClassName="text-amber-700 dark:text-amber-300"
                iconBackgroundClassName="bg-amber-50 dark:bg-amber-500/10"
                valueClassName="text-amber-700 dark:text-amber-300"
              />
              <StatCard
                title="Low / Out of Stock"
                value={String(lowStockCount)}
                delta="Items at or below threshold"
                deltaTone={lowStockCount > 0 ? "negative" : "neutral"}
                icon={<FiAlertTriangle className="text-xl" />}
                accentClassName="border-red-200 bg-white dark:border-red-500/30 dark:bg-slate-900"
                iconClassName="text-red-700 dark:text-red-300"
                iconBackgroundClassName="bg-red-50 dark:bg-red-500/10"
                valueClassName="text-red-700 dark:text-red-300"
              />
              <StatCard
                title="Inventory Valuation"
                value={formatCurrency(totalInventoryValue)}
                delta="Total retail stock value"
                icon={<FiPackage className="text-xl" />}
                accentClassName="border-indigo-200 bg-white dark:border-indigo-500/30 dark:bg-slate-900"
                iconClassName="text-indigo-700 dark:text-indigo-300"
                iconBackgroundClassName="bg-indigo-50 dark:bg-indigo-500/10"
                valueClassName="text-indigo-700 dark:text-indigo-300"
              />
            </div>

            {/* Row 1: Low Stock Depletion Alerts & Top Dispensed / Payment Breakdown */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Low Stock Depletion Alerts */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-gray-200 p-5 dark:border-slate-700">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <FiAlertTriangle className="text-amber-600" />
                      Point Stock Depletion Alerts
                    </h2>
                    <p className="text-xs text-gray-500">Formulations running low or out of stock at this unit.</p>
                  </div>
                  <Link
                    href="/pharmacy/inventory"
                    className="text-xs font-semibold text-brand-700 hover:text-brand-600 dark:text-brand-400"
                  >
                    View All &rarr;
                  </Link>
                </div>
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                        <th className="p-4 font-semibold">Formulation</th>
                        <th className="p-4 font-semibold">Category</th>
                        <th className="p-4 font-semibold text-center">Stock</th>
                        <th className="p-4 font-semibold text-center">Limit</th>
                        <th className="p-4 font-semibold text-right">Unit Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                      {lowStockItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-gray-500 text-sm">
                            All point formulation stocks are currently adequate.
                          </td>
                        </tr>
                      ) : (
                        lowStockItems.slice(0, 10).map((item: any) => {
                          const isZero = Number(item.stock) === 0;
                          return (
                            <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                              <td className="p-4">
                                <p className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                                {item.generic_name && (
                                  <p className="text-xs text-gray-500">{item.generic_name}</p>
                                )}
                              </td>
                              <td className="p-4 text-xs text-slate-600 dark:text-slate-300">
                                {item.category_name || "—"}
                              </td>
                              <td className="p-4 text-center">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                  isZero
                                    ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                                }`}>
                                  {isZero ? "0 Out of stock" : `${item.stock} Low stock`}
                                </span>
                              </td>
                              <td className="p-4 text-center text-xs text-gray-500 dark:text-slate-400">
                                {item.reorder_level ?? 50}
                              </td>
                              <td className="p-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                                {item.unit_price != null ? formatCurrency(item.unit_price) : "—"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Channel Breakdown / Top Selling Drugs */}
              {hasChannelBreakdown ? (
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                    Revenue Breakdown by Channel
                  </h2>
                  <p className="text-xs text-gray-500 mb-4">Distribution of patient dispensing payments.</p>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-gray-100 bg-slate-50/50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/30">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cash</p>
                      <p className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {formatCurrency(cashRevenue)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-slate-50/50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/30">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">POS</p>
                      <p className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {formatCurrency(posRevenue)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-slate-50/50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/30">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Transfer</p>
                      <p className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {formatCurrency(transferRevenue)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
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
                              No dispensed drugs recorded yet today.
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
              )}
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
                    {isRequestsLoading && pointPendingRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-700 border-t-transparent mx-auto"></div>
                        </td>
                      </tr>
                    ) : pointPendingRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500">
                          No pending prescriptions generated yet. Go to Dispense to generate one.
                        </td>
                      </tr>
                    ) : (
                      pointPendingRequests.map((bill: any) => (
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

