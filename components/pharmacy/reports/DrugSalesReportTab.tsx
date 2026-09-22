"use client";

import React from "react";
import StatCard from "@/components/shared/StatCard";
import { formatCurrency } from "@/libs/helper";
import { FiPackage, FiShoppingCart, FiDollarSign, FiChevronLeft, FiChevronRight, FiInbox } from "react-icons/fi";
import { DrugSalesReportData } from "@/libs/pharmacy-reports";

interface Props {
  data?: DrugSalesReportData;
  isLoading: boolean;
  page: number;
  onPageChange: (newPage: number) => void;
  onResetFilters: () => void;
}

export default function DrugSalesReportTab({
  data,
  isLoading,
  page,
  onPageChange,
  onResetFilters,
}: Props) {
  const summary = data?.summary || {
    total_unique_drugs: 0,
    total_quantity_sold: 0,
    total_sales_amount: 0,
  };
  const pagination = data?.pagination || {
    total_items: 0,
    page: 1,
    limit: 20,
    total_pages: 1,
  };
  const drugs = data?.drugs || [];

  return (
    <div className="space-y-6">
      {/* 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Unique Drugs Dispensed"
          value={summary.total_unique_drugs.toLocaleString()}
          delta="Distinct medication lines sold"
          icon={<FiPackage className="text-xl" />}
          accentClassName="border-blue-200 bg-white dark:border-blue-900/30 dark:bg-slate-900"
          iconClassName="text-blue-700 dark:text-blue-300"
          iconBackgroundClassName="bg-blue-50 dark:bg-blue-950/40"
          valueClassName="text-slate-900 dark:text-slate-100"
        />

        <StatCard
          title="Total Quantity Dispensed"
          value={summary.total_quantity_sold.toLocaleString()}
          delta="Packs / units sold across period"
          icon={<FiShoppingCart className="text-xl" />}
          accentClassName="border-purple-200 bg-white dark:border-purple-900/30 dark:bg-slate-900"
          iconClassName="text-purple-700 dark:text-purple-300"
          iconBackgroundClassName="bg-purple-50 dark:bg-purple-950/40"
          valueClassName="text-purple-700 dark:text-purple-300"
        />

        <StatCard
          title="Total Sales Revenue"
          value={formatCurrency(summary.total_sales_amount)}
          delta="Gross medication sales"
          icon={<FiDollarSign className="text-xl" />}
          accentClassName="border-emerald-200 bg-white dark:border-emerald-900/30 dark:bg-slate-900"
          iconClassName="text-emerald-700 dark:text-emerald-300"
          iconBackgroundClassName="bg-emerald-50 dark:bg-emerald-950/40"
          valueClassName="text-emerald-700 dark:text-emerald-300"
        />
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Drug Sales Summary Ledger
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aggregated quantities sold, unit prices, and revenue per pharmaceutical item.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Showing {drugs.length} of {pagination.total_items} items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3.5">#</th>
                <th className="px-6 py-3.5">Medication & Generic</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5 text-right">Current Stock</th>
                <th className="px-6 py-3.5 text-right">Unit Price</th>
                <th className="px-6 py-3.5 text-right">Qty Sold</th>
                <th className="px-6 py-3.5 text-right">Avg Price</th>
                <th className="px-6 py-3.5 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                    <p className="mt-2 text-xs">Loading drug sales records...</p>
                  </td>
                </tr>
              ) : drugs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <FiInbox className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-base font-semibold text-slate-800 dark:text-slate-200">No drug sales found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      No medication sales were recorded for the selected date range or search query.
                    </p>
                    <button
                      onClick={onResetFilters}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 transition"
                    >
                      Reset to Today
                    </button>
                  </td>
                </tr>
              ) : (
                drugs.map((drug, index) => {
                  const rowNum = (pagination.page - 1) * pagination.limit + index + 1;
                  return (
                    <tr
                      key={drug.drug_id || `${drug.drug_name}-${index}`}
                      className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-6 py-3.5 text-xs text-slate-400 font-mono">{rowNum}</td>
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {drug.drug_name}
                        </div>
                        {drug.generic_name && (
                          <div className="text-xs text-slate-400">{drug.generic_name}</div>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {drug.category_name || "General"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right font-medium">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                            drug.current_stock <= 0
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                              : drug.current_stock <= 10
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                              : "text-slate-800 dark:text-slate-200"
                          }`}
                        >
                          {drug.current_stock.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono text-slate-700 dark:text-slate-300">
                        {formatCurrency(drug.current_unit_price)}
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold text-slate-900 dark:text-slate-100">
                        {drug.quantity_sold.toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono text-xs text-slate-500 dark:text-slate-400">
                        {formatCurrency(drug.average_price)}
                      </td>
                      <td className="px-6 py-3.5 text-right font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatCurrency(drug.total_price)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.total_pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Page {pagination.page} of {pagination.total_pages} ({pagination.total_items} items total)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1 || isLoading}
                onClick={() => onPageChange(pagination.page - 1)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750"
              >
                <FiChevronLeft /> Previous
              </button>
              <button
                disabled={pagination.page >= pagination.total_pages || isLoading}
                onClick={() => onPageChange(pagination.page + 1)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750"
              >
                Next <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
