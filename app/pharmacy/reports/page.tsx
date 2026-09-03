"use client";

import React, { useState, useMemo } from "react";
import Header from "@/components/shared/Header";
import { formatCurrency, formatDateTime } from "@/libs/helper";
import { useQuery } from "@tanstack/react-query";
import { getAgentAccessToken, decodeJwt } from "@/libs/auth";
import {
  getPharmacyReportOverview,
  getPharmacyReportDispensed,
  getPharmacyReportStockAdditions,
  getPharmacyStoreReportOverview,
  getPharmacyStoreReportStockAdditions,
  getPharmacyStoreReportTransfers,
  unwrapPharmacyData,
  PharmacyReportOverviewResponse,
  PharmacyReportDispensedResponse,
  PharmacyReportStockAdditionsResponse,
  PharmacyStoreReportOverviewResponse,
  PharmacyStoreReportStockAdditionsResponse,
  PharmacyStoreReportTransfersResponse,
} from "@/libs/pharmacy-api";
import {
  FiTrendingUp,
  FiFileText,
  FiPlusCircle,
  FiPrinter,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiArrowRightCircle,
} from "react-icons/fi";

type TabType = "overview" | "dispensed" | "additions" | "transfers";

export default function PharmacyReportsPage() {
  const accessToken = typeof window !== "undefined" ? getAgentAccessToken() : null;
  const decoded = useMemo(() => (accessToken ? decodeJwt(accessToken) : null), [accessToken]);
  const isStoreManager = decoded?.role === "PHARMACY_STORE";

  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Filter dates (defaults: 30 days ago to today)
  const defaultStartDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  }, []);

  const defaultEndDate = useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);

  // Pagination states
  const [dispensedPage, setDispensedPage] = useState(1);
  const [additionsPage, setAdditionsPage] = useState(1);
  const [transfersPage, setTransfersPage] = useState(1);

  // Queries
  const pointOverviewQuery = useQuery({
    queryKey: ["pharmacy-report-overview", startDate, endDate],
    queryFn: () => getPharmacyReportOverview({ start_date: startDate, end_date: endDate }),
    enabled: Boolean(accessToken && !isStoreManager),
  });

  const storeOverviewQuery = useQuery({
    queryKey: ["pharmacy-store-report-overview", startDate, endDate],
    queryFn: () => getPharmacyStoreReportOverview({ start_date: startDate, end_date: endDate }),
    enabled: Boolean(accessToken && isStoreManager),
  });

  const dispensedQuery = useQuery({
    queryKey: ["pharmacy-report-dispensed", startDate, endDate, dispensedPage],
    queryFn: () =>
      getPharmacyReportDispensed({
        start_date: startDate,
        end_date: endDate,
        page: dispensedPage,
        limit: 10,
      }),
    enabled: Boolean(accessToken && !isStoreManager && activeTab === "dispensed"),
  });

  const additionsQuery = useQuery({
    queryKey: ["pharmacy-report-stock-additions", startDate, endDate, additionsPage, isStoreManager],
    queryFn: async (): Promise<any> => {
      if (isStoreManager) {
        return await getPharmacyStoreReportStockAdditions({
          start_date: startDate,
          end_date: endDate,
          page: additionsPage,
          limit: 10,
        });
      }
      return await getPharmacyReportStockAdditions({
        start_date: startDate,
        end_date: endDate,
        page: additionsPage,
        limit: 10,
      });
    },
    enabled: Boolean(accessToken && activeTab === "additions"),
  });

  const storeTransfersQuery = useQuery({
    queryKey: ["pharmacy-store-report-transfers", startDate, endDate, transfersPage],
    queryFn: async (): Promise<any> => {
      return await getPharmacyStoreReportTransfers({
        start_date: startDate,
        end_date: endDate,
        page: transfersPage,
        limit: 10,
      });
    },
    enabled: Boolean(accessToken && isStoreManager && activeTab === "transfers"),
  });

  // Safe data extraction
  const pointOverviewData = useMemo(() => {
    return unwrapPharmacyData<PharmacyReportOverviewResponse["data"] | null>(
      pointOverviewQuery.data,
      null
    );
  }, [pointOverviewQuery.data]);

  const storeOverviewData = useMemo(() => {
    return unwrapPharmacyData<PharmacyStoreReportOverviewResponse["data"] | null>(
      storeOverviewQuery.data,
      null
    );
  }, [storeOverviewQuery.data]);

  const dispensedData = useMemo(() => {
    return unwrapPharmacyData<PharmacyReportDispensedResponse["data"] | null>(
      dispensedQuery.data,
      null
    );
  }, [dispensedQuery.data]);

  const additionsData = useMemo(() => {
    return unwrapPharmacyData<
      PharmacyReportStockAdditionsResponse["data"] | PharmacyStoreReportStockAdditionsResponse["data"] | null
    >(additionsQuery.data, null);
  }, [additionsQuery.data]);

  const storeTransfersData = useMemo(() => {
    return unwrapPharmacyData<PharmacyStoreReportTransfersResponse["data"] | null>(
      storeTransfersQuery.data,
      null
    );
  }, [storeTransfersQuery.data]);

  // Point totals calculations
  const totalRev = pointOverviewData?.financial_summary?.total_revenue ?? pointOverviewData?.summary?.total_revenue ?? 0;
  const breakdown = useMemo(() => {
    if (pointOverviewData?.financial_summary?.payment_breakdown) {
      const pb = pointOverviewData.financial_summary.payment_breakdown;
      return {
        cash: pb.cash ?? 0,
        pos: pb.pos ?? 0,
        transfer: pb.transfer ?? 0,
      };
    }
    const arr = pointOverviewData?.sales_by_payment_type ?? [];
    const cashVal = arr.find((x) => x.payment_type === "cash")?.amount ?? 0;
    const posVal = arr.find((x) => x.payment_type === "pos")?.amount ?? 0;
    const transferVal = arr.find((x) => x.payment_type === "transfer")?.amount ?? 0;
    return { cash: cashVal, pos: posVal, transfer: transferVal };
  }, [pointOverviewData]);

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-canvas p-6 space-y-6">
      <Header
        title={isStoreManager ? "Central Store Warehouse Reports" : "Point Pharmacy Reports & Auditing"}
        Subtitle={
          isStoreManager
            ? "Inspect catalog valuation, stock movement history, and point dispatch distribution"
            : "Compile point sales summaries, dispensed records, and restock logs"
        }
      />

      {/* Filters and Date Pickers */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-semibold">
          <FiFilter className="text-brand-500" />
          <span>Report Filters</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">From:</span>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDispensedPage(1);
                  setAdditionsPage(1);
                  setTransfersPage(1);
                }}
                className="rounded-xl border border-gray-200 dark:border-slate-700 bg-canvas-alt px-3 py-2 text-sm outline-none focus:border-brand-500 text-slate-900 dark:text-white"
              />
            </div>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">To:</span>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDispensedPage(1);
                  setAdditionsPage(1);
                  setTransfersPage(1);
                }}
                className="rounded-xl border border-gray-200 dark:border-slate-700 bg-canvas-alt px-3 py-2 text-sm outline-none focus:border-brand-500 text-slate-900 dark:text-white"
              />
            </div>
          </label>
          <button
            type="button"
            onClick={handlePrintReport}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 px-4 py-2 text-sm font-semibold shadow-sm transition"
          >
            <FiPrinter />
            Print Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 border-b-2 px-6 py-3.5 text-sm font-semibold transition ${
            activeTab === "overview"
              ? "border-brand-500 text-brand-600 dark:text-brand-400"
              : "border-transparent text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <FiTrendingUp />
          Overview
        </button>

        {/* Point tabs */}
        {!isStoreManager && (
          <button
            onClick={() => setActiveTab("dispensed")}
            className={`flex items-center gap-2 border-b-2 px-6 py-3.5 text-sm font-semibold transition ${
              activeTab === "dispensed"
                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-transparent text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <FiFileText />
            Dispensed Prescriptions
          </button>
        )}

        {/* Store manager tabs */}
        {isStoreManager && (
          <>
            <button
              onClick={() => setActiveTab("additions")}
              className={`flex items-center gap-2 border-b-2 px-6 py-3.5 text-sm font-semibold transition ${
                activeTab === "additions"
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <FiPlusCircle />
              Stock Additions Log
            </button>

            <button
              onClick={() => setActiveTab("transfers")}
              className={`flex items-center gap-2 border-b-2 px-6 py-3.5 text-sm font-semibold transition ${
                activeTab === "transfers"
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <FiArrowRightCircle />
              Transfer Movement Log
            </button>
          </>
        )}
      </div>

      {/* Tab Panels */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {isStoreManager ? (
            /* Central Store Overview Metrics */
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Total Inventory Value
                  </p>
                  <p className="mt-3 text-3xl font-extrabold text-brand-600 dark:text-brand-400">
                    {formatCurrency(storeOverviewData?.store_summary?.store_inventory_valuation || 0)}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Supplier Restocks Logged
                  </p>
                  <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                    {storeOverviewData?.store_summary?.supplier_restocks_count || 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Total Stock Added
                  </p>
                  <p className="mt-3 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {storeOverviewData?.store_summary?.total_stock_qty_added || 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Transfers Dispatched
                  </p>
                  <p className="mt-3 text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                    {storeOverviewData?.store_summary?.transfers_completed || 0}
                  </p>
                </div>
              </div>

              {/* Status Alert Badges */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-rose-200 bg-rose-50/50 dark:border-rose-900/30 dark:bg-rose-950/20 p-4">
                  <p className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wide">
                    Out of Stock Formulations
                  </p>
                  <p className="mt-2 text-2xl font-bold text-rose-900 dark:text-rose-200">
                    {storeOverviewData?.store_summary?.out_of_stock_count || 0} items
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/20 p-4">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                    Low Stock Threshold Items
                  </p>
                  <p className="mt-2 text-2xl font-bold text-amber-900 dark:text-amber-200">
                    {storeOverviewData?.store_summary?.low_stock_count || 0} items
                  </p>
                </div>
                <div className="rounded-2xl border border-purple-200 bg-purple-50/50 dark:border-purple-900/30 dark:bg-purple-950/20 p-4">
                  <p className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
                    Expiring Formulations (90 Days)
                  </p>
                  <p className="mt-2 text-2xl font-bold text-purple-900 dark:text-purple-200">
                    {storeOverviewData?.store_summary?.expiring_items_count || 0} items
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Point Pharmacist Sales Overview */
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Total Revenue
                  </p>
                  <p className="mt-3 text-3xl font-extrabold text-brand-600 dark:text-brand-400">
                    {formatCurrency(totalRev)}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Cash Payments
                  </p>
                  <p className="mt-3 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(breakdown.cash)}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    POS Payments
                  </p>
                  <p className="mt-3 text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(breakdown.pos)}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Transfer Payments
                  </p>
                  <p className="mt-3 text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                    {formatCurrency(breakdown.transfer)}
                  </p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Top Dispensed Drugs */}
                <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
                    Top Dispensed Drugs
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-gray-150 dark:border-slate-800 text-gray-500 font-semibold uppercase tracking-wider text-xs">
                          <th className="pb-3">Drug Name</th>
                          <th className="pb-3">Generic Name</th>
                          <th className="pb-3 text-center">Qty</th>
                          <th className="pb-3 text-right">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        {pointOverviewQuery.isLoading ? (
                          Array.from({ length: 4 }).map((_, index) => (
                            <tr key={index}>
                              <td colSpan={4} className="py-4">
                                <div className="h-6 animate-pulse bg-gray-100 dark:bg-slate-800 rounded-lg" />
                              </td>
                            </tr>
                          ))
                        ) : (
                          (() => {
                            const topSelling =
                              pointOverviewData?.top_dispensed_drugs ??
                              pointOverviewData?.top_selling_items ??
                              [];
                            if (topSelling.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={4} className="py-8 text-center text-gray-500">
                                    No dispensed drug logs found for this range.
                                  </td>
                                </tr>
                              );
                            }
                            return topSelling.map((drug, index) => {
                              const name = drug.item_name;
                              const gen = drug.generic_name;
                              const qty =
                                "total_quantity" in drug
                                  ? drug.total_quantity
                                  : "quantity_sold" in drug
                                  ? drug.quantity_sold
                                  : 0;
                              const rev =
                                "total_revenue" in drug
                                  ? drug.total_revenue
                                  : "revenue_generated" in drug
                                  ? drug.revenue_generated
                                  : 0;
                              return (
                                <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                                  <td className="py-3 font-semibold text-slate-900 dark:text-white">
                                    {name}
                                  </td>
                                  <td className="py-3 text-xs italic">{gen}</td>
                                  <td className="py-3 text-center">{qty}</td>
                                  <td className="py-3 text-right font-semibold text-brand-600 dark:text-brand-400">
                                    {formatCurrency(rev)}
                                  </td>
                                </tr>
                              );
                            });
                          })()
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sales by Payment Method */}
                <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
                    Sales by Payment Method
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-gray-150 dark:border-slate-800 text-gray-500 font-semibold uppercase tracking-wider text-xs">
                          <th className="pb-3">Payment Type</th>
                          <th className="pb-3 text-center">Transactions Count</th>
                          <th className="pb-3 text-right">Revenue Generated</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        {pointOverviewQuery.isLoading ? (
                          Array.from({ length: 3 }).map((_, index) => (
                            <tr key={index}>
                              <td colSpan={3} className="py-4">
                                <div className="h-6 animate-pulse bg-gray-100 dark:bg-slate-800 rounded-lg" />
                              </td>
                            </tr>
                          ))
                        ) : (
                          (() => {
                            const paymentList = pointOverviewData?.sales_by_payment_type ?? (
                              pointOverviewData?.financial_summary?.payment_breakdown
                                ? [
                                    { payment_type: "cash", amount: pointOverviewData.financial_summary.payment_breakdown.cash, count: 0 },
                                    { payment_type: "pos", amount: pointOverviewData.financial_summary.payment_breakdown.pos, count: 0 },
                                    { payment_type: "transfer", amount: pointOverviewData.financial_summary.payment_breakdown.transfer, count: 0 },
                                  ]
                                : []
                            );
                            const hasPayments = paymentList.some((x) => x.amount > 0 || (x.count && x.count > 0));
                            if (paymentList.length === 0 || !hasPayments) {
                              return (
                                <tr>
                                  <td colSpan={3} className="py-8 text-center text-gray-500">
                                    No payment breakdown details found.
                                  </td>
                                </tr>
                              );
                            }
                            return paymentList.map((payment, index) => (
                              <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                                <td className="py-3 font-semibold text-slate-900 dark:text-white uppercase">
                                  {payment.payment_type}
                                </td>
                                <td className="py-3 text-center font-semibold">{payment.count || "-"}</td>
                                <td className="py-3 text-right font-semibold text-brand-600 dark:text-brand-400">
                                  {formatCurrency(payment.amount)}
                                </td>
                              </tr>
                            ));
                          })()
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Dispensed Prescriptions (Point only) */}
      {activeTab === "dispensed" && !isStoreManager && (
        <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Dispensed Prescriptions Log
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-150 dark:border-slate-800 text-gray-500 font-semibold uppercase tracking-wider text-xs">
                  <th className="pb-3 pr-4">Billing Code</th>
                  <th className="pb-3">Date & Time</th>
                  <th className="pb-3">Patient</th>
                  <th className="pb-3">Dispensed By</th>
                  <th className="pb-3">Payment</th>
                  <th className="pb-3">Prescription Items</th>
                  <th className="pb-3 text-right">Total Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {dispensedQuery.isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td colSpan={7} className="py-4">
                        <div className="h-7 animate-pulse bg-gray-100 dark:bg-slate-800 rounded-lg" />
                      </td>
                    </tr>
                  ))
                ) : (
                  (() => {
                    const dispensedLogs = dispensedData?.requests ?? dispensedData?.logs ?? [];
                    if (dispensedLogs.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-gray-500">
                            No dispensed billing records found for this range.
                          </td>
                        </tr>
                      );
                    }
                    return dispensedLogs.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                        <td className="py-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                          {req.billing_code}
                        </td>
                        <td className="py-4 text-xs whitespace-nowrap">
                          {formatDateTime(req.dispensed_at)}
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {req.patient_name}
                            </span>
                            <span className="text-xs text-gray-500">
                              ID: {req.patient_id || "Walk-In"}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 text-xs">{req.pharmacist_name}</td>
                        <td className="py-4 whitespace-nowrap">
                          <span className="inline-flex rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase">
                            {req.payment_type}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col gap-1 max-w-[240px]">
                            {(req.items ?? []).map((item, index) => (
                              <span key={index} className="text-xs">
                                • {item.item_name} (x{item.quantity})
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 text-right font-bold text-slate-900 dark:text-white">
                          {formatCurrency(req.total_amount)}
                        </td>
                      </tr>
                    ));
                  })()
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {dispensedData && dispensedData.total_pages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-4">
              <span className="text-xs text-gray-500">
                Page {dispensedPage} of {dispensedData.total_pages} ({dispensedData.total_items} entries)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDispensedPage((p) => Math.max(p - 1, 1))}
                  disabled={dispensedPage === 1}
                  className="p-2 rounded-lg border border-gray-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-950"
                >
                  <FiChevronLeft />
                </button>
                <button
                  onClick={() => setDispensedPage((p) => Math.min(p + 1, dispensedData.total_pages))}
                  disabled={dispensedPage === dispensedData.total_pages}
                  className="p-2 rounded-lg border border-gray-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stock Additions */}
      {activeTab === "additions" && (
        <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {isStoreManager ? "Central Store Supplier Stock Additions" : "Stock Additions & Restock History"}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-150 dark:border-slate-800 text-gray-500 font-semibold uppercase tracking-wider text-xs">
                  <th className="pb-3">Date & Time</th>
                  <th className="pb-3">Drug Details</th>
                  <th className="pb-3 text-center">Action</th>
                  <th className="pb-3 text-center">Qty Added</th>
                  <th className="pb-3 text-center">Stock Change</th>
                  <th className="pb-3">Batch & Expiry</th>
                  <th className="pb-3">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {additionsQuery.isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td colSpan={7} className="py-4">
                        <div className="h-7 animate-pulse bg-gray-100 dark:bg-slate-800 rounded-lg" />
                      </td>
                    </tr>
                  ))
                ) : (additionsData?.logs ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      No stock addition history records found.
                    </td>
                  </tr>
                ) : (
                  additionsData?.logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                      <td className="py-4 text-xs whitespace-nowrap">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {log.item_name}
                          </span>
                          <span className="text-xs text-gray-500 italic">
                            {log.generic_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        <span className="inline-flex rounded-full bg-indigo-100 dark:bg-indigo-950/40 px-2.5 py-0.5 text-xs font-semibold text-indigo-800 dark:text-indigo-300 uppercase">
                          {log.action_type || "RESTOCK"}
                        </span>
                      </td>
                      <td className="py-4 text-center font-bold text-brand-600 dark:text-brand-400">
                        +{log.quantity_changed}
                      </td>
                      <td className="py-4 text-center text-xs">
                        {log.old_stock} → {log.new_stock}
                      </td>
                      <td className="py-4 text-xs">
                        <div className="flex flex-col">
                          <span>Batch: {log.new_batch || log.batch_number || "N/A"}</span>
                          <span className="text-gray-500">
                            Exp: {log.new_expiry || log.expiry_date ? new Date(log.new_expiry || log.expiry_date).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-xs">{log.pharmacist_name || log.manager_name || "Manager"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {additionsData && additionsData.total_pages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-4">
              <span className="text-xs text-gray-500">
                Page {additionsPage} of {additionsData.total_pages} ({additionsData.total_items} entries)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAdditionsPage((p) => Math.max(p - 1, 1))}
                  disabled={additionsPage === 1}
                  className="p-2 rounded-lg border border-gray-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <FiChevronLeft />
                </button>
                <button
                  onClick={() => setAdditionsPage((p) => Math.min(p + 1, additionsData.total_pages))}
                  disabled={additionsPage === additionsData.total_pages}
                  className="p-2 rounded-lg border border-gray-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transfers Movement Log (Store Manager only) */}
      {activeTab === "transfers" && isStoreManager && (
        <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Stock Transfer & Point Movement Log
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-150 dark:border-slate-800 text-gray-500 font-semibold uppercase tracking-wider text-xs">
                  <th className="pb-3">Transfer Ref</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Destination Point</th>
                  <th className="pb-3">Items Transferred</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3">Handled By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {storeTransfersQuery.isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td colSpan={6} className="py-4">
                        <div className="h-7 animate-pulse bg-gray-100 dark:bg-slate-800 rounded-lg" />
                      </td>
                    </tr>
                  ))
                ) : (storeTransfersData?.transfers ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No stock transfer movement records found for this range.
                    </td>
                  </tr>
                ) : (
                  storeTransfersData?.transfers.map((trf: any) => (
                    <tr key={trf.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                      <td className="py-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                        {trf.reference_number || trf.transfer_number || trf.id.slice(0, 8)}
                      </td>
                      <td className="py-4 text-xs whitespace-nowrap">
                        {formatDateTime(trf.created_at || trf.transferred_at)}
                      </td>
                      <td className="py-4 font-semibold text-slate-900 dark:text-white">
                        {trf.to_unit?.name || trf.to_unit_name || "Point Unit"}
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col gap-1 max-w-[240px]">
                          {(trf.items ?? []).map((item: any, index: number) => (
                            <span key={index} className="text-xs">
                              • {item.item_name || item.name} (x{item.quantity})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                          trf.status === "completed" || trf.status === "approved"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : trf.status === "pending"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                            : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300"
                        }`}>
                          {trf.status}
                        </span>
                      </td>
                      <td className="py-4 text-xs">{trf.transferred_by_name || trf.created_by_name || "Manager"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {storeTransfersData && storeTransfersData.total_pages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-4">
              <span className="text-xs text-gray-500">
                Page {transfersPage} of {storeTransfersData.total_pages} ({storeTransfersData.total_items} entries)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTransfersPage((p) => Math.max(p - 1, 1))}
                  disabled={transfersPage === 1}
                  className="p-2 rounded-lg border border-gray-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <FiChevronLeft />
                </button>
                <button
                  onClick={() => setTransfersPage((p) => Math.min(p + 1, storeTransfersData.total_pages))}
                  disabled={transfersPage === storeTransfersData.total_pages}
                  className="p-2 rounded-lg border border-gray-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
