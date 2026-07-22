"use client";

import React, { useState, useMemo } from "react";
import Header from "@/components/shared/Header";
import { formatCurrency, formatDateTime } from "@/libs/helper";
import { useQuery } from "@tanstack/react-query";
import {
  getPharmacyReportOverview,
  getPharmacyReportDispensed,
  getPharmacyReportStockAdditions,
  unwrapPharmacyData,
  PharmacyReportOverviewResponse,
  PharmacyReportDispensedResponse,
  PharmacyReportStockAdditionsResponse,
} from "@/libs/pharmacy-api";
import {
  FiTrendingUp,
  FiFileText,
  FiPlusCircle,
  FiCalendar,
  FiPrinter,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
} from "react-icons/fi";

type TabType = "overview" | "dispensed" | "additions";

export default function PharmacyReportsPage() {
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

  // Queries
  const overviewQuery = useQuery({
    queryKey: ["pharmacy-report-overview", startDate, endDate],
    queryFn: () => getPharmacyReportOverview({ start_date: startDate, end_date: endDate }),
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
  });

  const additionsQuery = useQuery({
    queryKey: ["pharmacy-report-stock-additions", startDate, endDate, additionsPage],
    queryFn: () =>
      getPharmacyReportStockAdditions({
        start_date: startDate,
        end_date: endDate,
        page: additionsPage,
        limit: 10,
      }),
  });

  // Safe data extraction
  const overviewData = useMemo(() => {
    return unwrapPharmacyData<PharmacyReportOverviewResponse["data"] | null>(
      overviewQuery.data,
      null,
    );
  }, [overviewQuery.data]);

  const dispensedData = useMemo(() => {
    return unwrapPharmacyData<PharmacyReportDispensedResponse["data"] | null>(
      dispensedQuery.data,
      null,
    );
  }, [dispensedQuery.data]);

  const additionsData = useMemo(() => {
    return unwrapPharmacyData<PharmacyReportStockAdditionsResponse["data"] | null>(
      additionsQuery.data,
      null,
    );
  }, [additionsQuery.data]);

  // Totals calculations
  const totalRev = overviewData?.summary?.total_revenue ?? 0;
  const breakdown = useMemo(() => {
    const arr = overviewData?.sales_by_payment_type ?? [];
    const cashVal = arr.find((x) => x.payment_type === "cash")?.amount ?? 0;
    const posVal = arr.find((x) => x.payment_type === "pos")?.amount ?? 0;
    const transferVal = arr.find((x) => x.payment_type === "transfer")?.amount ?? 0;
    return { cash: cashVal, pos: posVal, transfer: transferVal };
  }, [overviewData]);

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-canvas p-6 space-y-6">
      <Header
        title="Pharmacy Reports & Auditing"
        Subtitle="Compile sales summaries and stock auditing reports"
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
        <button
          onClick={() => setActiveTab("dispensed")}
          className={`flex items-center gap-2 border-b-2 px-6 py-3.5 text-sm font-semibold transition ${
            activeTab === "dispensed"
              ? "border-brand-500 text-brand-600 dark:text-brand-400"
              : "border-transparent text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <FiFileText />
          Dispensed Log
        </button>
        <button
          onClick={() => setActiveTab("additions")}
          className={`flex items-center gap-2 border-b-2 px-6 py-3.5 text-sm font-semibold transition ${
            activeTab === "additions"
              ? "border-brand-500 text-brand-600 dark:text-brand-400"
              : "border-transparent text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <FiPlusCircle />
          Stock Additions
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Revenue Stat Cards */}
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
                    {overviewQuery.isLoading ? (
                      Array.from({ length: 4 }).map((_, index) => (
                        <tr key={index}>
                          <td colSpan={4} className="py-4">
                            <div className="h-6 animate-pulse bg-gray-100 dark:bg-slate-800 rounded-lg" />
                          </td>
                        </tr>
                      ))
                    ) : (overviewData?.top_selling_items ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-500">
                          No dispensed drug logs found for this range.
                        </td>
                      </tr>
                    ) : (
                      overviewData?.top_selling_items.map((drug, index) => (
                        <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          <td className="py-3 font-semibold text-slate-900 dark:text-white">
                            {drug.item_name}
                          </td>
                          <td className="py-3 text-xs italic">{drug.generic_name}</td>
                          <td className="py-3 text-center">{drug.quantity_sold}</td>
                          <td className="py-3 text-right font-semibold text-brand-600 dark:text-brand-400">
                            {formatCurrency(drug.revenue_generated)}
                          </td>
                        </tr>
                      ))
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
                    {overviewQuery.isLoading ? (
                      Array.from({ length: 3 }).map((_, index) => (
                        <tr key={index}>
                          <td colSpan={3} className="py-4">
                            <div className="h-6 animate-pulse bg-gray-100 dark:bg-slate-800 rounded-lg" />
                          </td>
                        </tr>
                      ))
                    ) : (overviewData?.sales_by_payment_type ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-gray-500">
                          No payment breakdown details found.
                        </td>
                      </tr>
                    ) : (
                      overviewData?.sales_by_payment_type.map((payment, index) => (
                        <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          <td className="py-3 font-semibold text-slate-900 dark:text-white uppercase">
                            {payment.payment_type}
                          </td>
                          <td className="py-3 text-center font-semibold">{payment.count}</td>
                          <td className="py-3 text-right font-semibold text-brand-600 dark:text-brand-400">
                            {formatCurrency(payment.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "dispensed" && (
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
                ) : (dispensedData?.logs ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      No dispensed billing records found for this range.
                    </td>
                  </tr>
                ) : (
                  dispensedData?.logs.map((req) => (
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
                  ))
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

      {activeTab === "additions" && (
        <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Stock Additions & Restock History
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
                  <th className="pb-3">Restocked By</th>
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
                  additionsData?.logs.map((log) => (
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
                          {log.action_type}
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
                          <span>Batch: {log.new_batch || "N/A"}</span>
                          <span className="text-gray-500">
                            Exp: {log.new_expiry ? new Date(log.new_expiry).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-xs">{log.pharmacist_name}</td>
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
    </div>
  );
}
