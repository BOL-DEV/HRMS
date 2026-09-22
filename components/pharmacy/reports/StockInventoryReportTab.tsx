"use client";

import React from "react";
import StatCard from "@/components/shared/StatCard";
import { formatCurrency, formatDate } from "@/libs/helper";
import {
  FiPackage,
  FiDollarSign,
  FiAlertTriangle,
  FiXCircle,
  FiChevronLeft,
  FiChevronRight,
  FiInbox,
} from "react-icons/fi";
import { StockInventoryReportData } from "@/libs/pharmacy-reports";

interface Props {
  data?: StockInventoryReportData;
  isLoading: boolean;
  page: number;
  stockStatus: string;
  onStockStatusChange: (status: string) => void;
  onPageChange: (newPage: number) => void;
  onResetFilters: () => void;
}

export default function StockInventoryReportTab({
  data,
  isLoading,
  page,
  stockStatus,
  onStockStatusChange,
  onPageChange,
  onResetFilters,
}: Props) {
  const summary = data?.summary || {
    total_drugs: 0,
    total_units_in_stock: 0,
    total_inventory_valuation: 0,
    out_of_stock_count: 0,
    low_stock_count: 0,
  };
  const pagination = data?.pagination || {
    total_items: 0,
    page: 1,
    limit: 20,
    total_pages: 1,
  };
  const items = data?.items || [];

  return (
    <div className="space-y-6">
      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Catalog Drugs"
          value={summary.total_drugs.toLocaleString()}
          delta={`${summary.total_units_in_stock.toLocaleString()} units on shelves`}
          icon={<FiPackage className="text-xl" />}
          accentClassName="border-blue-200 bg-white dark:border-blue-900/30 dark:bg-slate-900"
          iconClassName="text-blue-700 dark:text-blue-300"
          iconBackgroundClassName="bg-blue-50 dark:bg-blue-950/40"
          valueClassName="text-slate-900 dark:text-slate-100"
        />

        <StatCard
          title="Total Stock Valuation"
          value={formatCurrency(summary.total_inventory_valuation)}
          delta="Total inventory worth (Cost/Retail)"
          icon={<FiDollarSign className="text-xl" />}
          accentClassName="border-emerald-200 bg-white dark:border-emerald-900/30 dark:bg-slate-900"
          iconClassName="text-emerald-700 dark:text-emerald-300"
          iconBackgroundClassName="bg-emerald-50 dark:bg-emerald-950/40"
          valueClassName="text-emerald-700 dark:text-emerald-300"
        />

        <StatCard
          title="Low Stock Warning"
          value={summary.low_stock_count.toLocaleString()}
          delta="Items at or below reorder level"
          icon={<FiAlertTriangle className="text-xl" />}
          accentClassName="border-amber-200 bg-white dark:border-amber-900/30 dark:bg-slate-900"
          iconClassName="text-amber-700 dark:text-amber-300"
          iconBackgroundClassName="bg-amber-50 dark:bg-amber-950/40"
          valueClassName="text-amber-700 dark:text-amber-300"
        />

        <StatCard
          title="Out of Stock Items"
          value={summary.out_of_stock_count.toLocaleString()}
          delta="Critical zero inventory count"
          icon={<FiXCircle className="text-xl" />}
          accentClassName="border-rose-200 bg-white dark:border-rose-900/30 dark:bg-slate-900"
          iconClassName="text-rose-700 dark:text-rose-300"
          iconBackgroundClassName="bg-rose-50 dark:bg-rose-950/40"
          valueClassName="text-rose-700 dark:text-rose-300"
        />
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Stock & Inventory Valuation Ledger
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Shelf balance, reorder thresholds, batch, expiration dates, and financial valuation.
            </p>
          </div>

          {/* Quick Stock Filter Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Stock Status:</span>
            <select
              value={stockStatus}
              onChange={(e) => onStockStatusChange(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200"
            >
              <option value="all">All Inventory</option>
              <option value="in_stock">In Stock Only</option>
              <option value="low_stock">Low Stock Alerts</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3.5">#</th>
                <th className="px-6 py-3.5">Medication & Generic</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Batch & Expiry</th>
                <th className="px-6 py-3.5 text-right">Stock / Reorder</th>
                <th className="px-6 py-3.5 text-right">Unit Price</th>
                <th className="px-6 py-3.5 text-right">Valuation</th>
                <th className="px-6 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                    <p className="mt-2 text-xs">Loading stock valuation records...</p>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <FiInbox className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-base font-semibold text-slate-800 dark:text-slate-200">No stock items found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      No medications match the active stock status or search query.
                    </p>
                    <button
                      onClick={onResetFilters}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 transition"
                    >
                      Reset Filters
                    </button>
                  </td>
                </tr>
              ) : (
                items.map((it, index) => {
                  const rowNum = (pagination.page - 1) * pagination.limit + index + 1;
                  const isOut = it.stock <= 0 || it.stock_status?.toUpperCase().includes("OUT");
                  const isLow = it.stock > 0 && (it.stock <= it.reorder_level || it.stock_status?.toUpperCase().includes("LOW"));

                  return (
                    <tr
                      key={it.id || `${it.item_name}-${index}`}
                      className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-6 py-3.5 text-xs text-slate-400 font-mono">{rowNum}</td>
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {it.item_name}
                        </div>
                        {it.generic_name && (
                          <div className="text-xs text-slate-400">{it.generic_name}</div>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {it.category_name || "General"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs">
                        <div className="font-mono text-slate-700 dark:text-slate-300">
                          {it.batch_number || "Default Batch"}
                        </div>
                        {it.expiry_date && (
                          <div className="text-[11px] text-slate-400">
                            Exp: {formatDate(it.expiry_date)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {it.stock.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">
                          / {it.reorder_level.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                        {formatCurrency(it.unit_price)}
                      </td>
                      <td className="px-6 py-3.5 text-right font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatCurrency(it.stock_valuation)}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isOut
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                              : isLow
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                          }`}
                        >
                          {isOut ? "OUT OF STOCK" : isLow ? "LOW STOCK" : "IN STOCK"}
                        </span>
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
