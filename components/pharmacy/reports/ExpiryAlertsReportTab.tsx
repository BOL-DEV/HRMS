"use client";

import React from "react";
import StatCard from "@/components/shared/StatCard";
import { formatCurrency, formatDate } from "@/libs/helper";
import {
  FiClock,
  FiAlertTriangle,
  FiAlertCircle,
  FiXCircle,
  FiChevronLeft,
  FiChevronRight,
  FiInbox,
} from "react-icons/fi";
import { ExpiryReportData, ExpiryReportItem } from "@/libs/pharmacy-reports";

interface Props {
  data?: ExpiryReportData;
  isLoading: boolean;
  page: number;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  onPageChange: (newPage: number) => void;
  onResetFilters: () => void;
}

export default function ExpiryAlertsReportTab({
  data,
  isLoading,
  page,
  timeframe,
  onTimeframeChange,
  onPageChange,
  onResetFilters,
}: Props) {
  const items = React.useMemo<ExpiryReportItem[]>(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data as ExpiryReportItem[];
    const rawObj = data as any;
    if (Array.isArray(rawObj.items)) return rawObj.items;
    if (Array.isArray(rawObj.drugs)) return rawObj.drugs;
    if (Array.isArray(rawObj.records)) return rawObj.records;
    if (Array.isArray(rawObj.data)) return rawObj.data;
    if (rawObj.data && typeof rawObj.data === "object") {
      if (Array.isArray(rawObj.data.items)) return rawObj.data.items;
      if (Array.isArray(rawObj.data.drugs)) return rawObj.data.drugs;
      if (Array.isArray(rawObj.data.records)) return rawObj.data.records;
      if (Array.isArray(rawObj.data.data)) return rawObj.data.data;
    }
    return [];
  }, [data]);

  const summary = React.useMemo(() => {
    const rawObj = (data as any) || {};
    const s = rawObj.summary || rawObj.data?.summary || {};
    const expired_count = s.expired_count ?? items.filter((it: any) => it.risk_level === "expired" || Number(it.days_to_expiry ?? 0) <= 0).length;
    const expired_valuation = s.expired_valuation ?? 0;
    const expiring_30d_count = s.expiring_30d_count ?? items.filter((it: any) => it.risk_level === "critical" || (Number(it.days_to_expiry) > 0 && Number(it.days_to_expiry) <= 30)).length;
    const expiring_30d_valuation = s.expiring_30d_valuation ?? 0;
    const expiring_60d_count = s.expiring_60d_count ?? items.filter((it: any) => it.risk_level === "moderate" || (Number(it.days_to_expiry) > 30 && Number(it.days_to_expiry) <= 60)).length;
    const expiring_60d_valuation = s.expiring_60d_valuation ?? 0;
    const expiring_90d_count = s.expiring_90d_count ?? items.filter((it: any) => it.risk_level === "low_risk" || (Number(it.days_to_expiry) > 60 && Number(it.days_to_expiry) <= 90)).length;
    const expiring_90d_valuation = s.expiring_90d_valuation ?? 0;
    const total_at_risk_count = s.total_at_risk_count ?? (items.length > 0 ? items.length : 0);
    const total_at_risk_valuation =
      s.total_at_risk_valuation ??
      items.reduce(
        (acc: number, it: any) =>
          acc + Number(it.at_risk_valuation || (it.current_stock || 0) * (it.unit_price || 0) || 0),
        0
      );

    return {
      expired_count,
      expired_valuation,
      expiring_30d_count,
      expiring_30d_valuation,
      expiring_60d_count,
      expiring_60d_valuation,
      expiring_90d_count,
      expiring_90d_valuation,
      total_at_risk_count,
      total_at_risk_valuation,
    };
  }, [data, items]);

  const pagination = React.useMemo(() => {
    const rawObj = (data as any) || {};
    const p = rawObj.pagination || rawObj.data?.pagination;
    return (
      p || {
        total_items: items.length,
        page: 1,
        limit: 20,
        total_pages: Math.ceil(items.length / 20) || 1,
      }
    );
  }, [data, items]);

  const pageSize = pagination.limit || 20;
  const isClientPaginated = items.length > pageSize;
  const displayItems = React.useMemo(() => {
    if (!isClientPaginated) return items;
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize, isClientPaginated]);

  const totalPages = isClientPaginated
    ? Math.max(1, Math.ceil(items.length / pageSize))
    : pagination.total_pages || 1;
  const totalItems = isClientPaginated ? items.length : pagination.total_items;

  return (
    <div className="space-y-6">
      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Expired Formulations"
          value={summary.expired_count.toLocaleString()}
          delta={`${formatCurrency(summary.expired_valuation)} loss value`}
          icon={<FiXCircle className="text-xl" />}
          accentClassName="border-rose-200 bg-white dark:border-rose-900/30 dark:bg-slate-900"
          iconClassName="text-rose-700 dark:text-rose-300"
          iconBackgroundClassName="bg-rose-50 dark:bg-rose-950/40"
          valueClassName="text-rose-700 dark:text-rose-300"
        />

        <StatCard
          title="Expiring in ≤ 30 Days"
          value={summary.expiring_30d_count.toLocaleString()}
          delta={`${formatCurrency(summary.expiring_30d_valuation)} critical value`}
          icon={<FiAlertCircle className="text-xl" />}
          accentClassName="border-amber-200 bg-white dark:border-amber-900/30 dark:bg-slate-900"
          iconClassName="text-amber-700 dark:text-amber-300"
          iconBackgroundClassName="bg-amber-50 dark:bg-amber-950/40"
          valueClassName="text-amber-700 dark:text-amber-300"
        />

        <StatCard
          title="Expiring in 31 - 60 Days"
          value={summary.expiring_60d_count.toLocaleString()}
          delta={`${formatCurrency(summary.expiring_60d_valuation)} at risk`}
          icon={<FiAlertTriangle className="text-xl" />}
          accentClassName="border-yellow-200 bg-white dark:border-yellow-900/30 dark:bg-slate-900"
          iconClassName="text-yellow-700 dark:text-yellow-300"
          iconBackgroundClassName="bg-yellow-50 dark:bg-yellow-950/40"
          valueClassName="text-slate-900 dark:text-slate-100"
        />

        <StatCard
          title="Total Risk Valuation (≤90d)"
          value={formatCurrency(summary.total_at_risk_valuation)}
          delta={`${summary.total_at_risk_count} total batches flagged`}
          icon={<FiClock className="text-xl" />}
          accentClassName="border-purple-200 bg-white dark:border-purple-900/30 dark:bg-slate-900"
          iconClassName="text-purple-700 dark:text-purple-300"
          iconBackgroundClassName="bg-purple-50 dark:bg-purple-950/40"
          valueClassName="text-purple-700 dark:text-purple-300"
        />
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Expiry & Near-Expiry Risk Ledger
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Batches nearing expiration dates, days remaining, units on shelf, and monetary value at risk.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Showing {displayItems.length} of {totalItems} batches (Page {page} of {totalPages})
            </span>

            {/* Timeframe Filter Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Risk Horizon:</span>
              <select
                value={timeframe}
                onChange={(e) => onTimeframeChange(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200"
              >
                <option value="all">All At-Risk (≤90 Days + Expired)</option>
                <option value="expired">Expired Only</option>
                <option value="30_days">Expiring ≤ 30 Days</option>
                <option value="60_days">Expiring 31 - 60 Days</option>
                <option value="90_days">Expiring 61 - 90 Days</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3.5">#</th>
                <th className="px-6 py-3.5">Medication & Generic</th>
                <th className="px-6 py-3.5">Batch Number</th>
                <th className="px-6 py-3.5">Expiry Date</th>
                <th className="px-6 py-3.5 text-center">Days Remaining</th>
                <th className="px-6 py-3.5 text-right">Units on Shelf</th>
                <th className="px-6 py-3.5 text-right">Unit Price</th>
                <th className="px-6 py-3.5 text-right">Value at Risk</th>
                <th className="px-6 py-3.5 text-center">Risk Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                    <p className="mt-2 text-xs">Loading expiry alert records...</p>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <FiInbox className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-base font-semibold text-slate-800 dark:text-slate-200">No near-expiry medications found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Great news! No stock items are expired or nearing expiration for this timeframe.
                    </p>
                    <button
                      onClick={onResetFilters}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 transition"
                    >
                      Reset Filters
                    </button>
                  </td>
                </tr>
              ) : displayItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <FiInbox className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-base font-semibold text-slate-800 dark:text-slate-200">No expiring items found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      No medications fall within the selected expiry risk threshold.
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
                displayItems.map((it, index) => {
                  const rowNum = (page - 1) * pageSize + index + 1;
                  const isExpired = it.days_remaining <= 0;
                  const isCritical = it.days_remaining > 0 && it.days_remaining <= 30;
                  const isWarning = it.days_remaining > 30 && it.days_remaining <= 60;

                  return (
                    <tr
                      key={it.id || `${it.drug_name}-${it.batch_number}-${index}`}
                      className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-6 py-3.5 text-xs text-slate-400 font-mono">{rowNum}</td>
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {it.drug_name}
                        </div>
                        {it.generic_name && (
                          <div className="text-xs text-slate-400">{it.generic_name}</div>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-xs font-mono text-slate-700 dark:text-slate-300">
                        {it.batch_number}
                      </td>
                      <td className="px-6 py-3.5 text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {formatDate(it.expiry_date)}
                      </td>
                      <td className="px-6 py-3.5 text-center font-bold">
                        <span
                          className={`inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-xs font-mono ${
                            isExpired
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                              : isCritical
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                              : isWarning
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                          }`}
                        >
                          {it.risk_status || (isExpired ? "EXPIRED" : isCritical ? "CRITICAL (≤30d)" : "WATCH (≤90d)")}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold text-slate-900 dark:text-slate-100">
                        {it.stock.toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                        {formatCurrency(it.unit_price)}
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold text-rose-600 dark:text-rose-400 font-mono">
                        {formatCurrency(it.value_at_risk)}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isExpired
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                              : isCritical
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                              : isWarning
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                          }`}
                        >
                          {it.risk_status || (isExpired ? "EXPIRED" : isCritical ? "CRITICAL (≤30d)" : "WATCH (≤90d)")}
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
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Page {page} of {totalPages} ({totalItems} batches total)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1 || isLoading}
                onClick={() => onPageChange(page - 1)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750"
              >
                <FiChevronLeft /> Previous
              </button>
              <button
                disabled={page >= totalPages || isLoading}
                onClick={() => onPageChange(page + 1)}
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
