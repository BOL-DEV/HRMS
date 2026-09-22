"use client";

import React from "react";
import StatCard from "@/components/shared/StatCard";
import { formatCurrency } from "@/libs/helper";
import {
  FiUsers,
  FiCheckCircle,
  FiPackage,
  FiDollarSign,
  FiChevronLeft,
  FiChevronRight,
  FiInbox,
  FiCreditCard,
} from "react-icons/fi";
import { PharmacistPerformanceReportData } from "@/libs/pharmacy-reports";

interface Props {
  data?: PharmacistPerformanceReportData;
  isLoading: boolean;
  page: number;
  onPageChange: (newPage: number) => void;
  onResetFilters: () => void;
}

export default function PharmacistPerformanceReportTab({
  data,
  isLoading,
  page,
  onPageChange,
  onResetFilters,
}: Props) {
  const summary = data?.summary || {
    total_pharmacists: 0,
    total_requests_processed: 0,
    total_quantity_dispensed: 0,
    total_revenue: 0,
  };
  const pagination = data?.pagination || {
    total_items: 0,
    page: 1,
    limit: 20,
    total_pages: 1,
  };
  const pharmacists = data?.pharmacists || [];

  return (
    <div className="space-y-6">
      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Pharmacists"
          value={summary.total_pharmacists.toLocaleString()}
          delta="Staff on duty this shift/period"
          icon={<FiUsers className="text-xl" />}
          accentClassName="border-blue-200 bg-white dark:border-blue-900/30 dark:bg-slate-900"
          iconClassName="text-blue-700 dark:text-blue-300"
          iconBackgroundClassName="bg-blue-50 dark:bg-blue-950/40"
          valueClassName="text-slate-900 dark:text-slate-100"
        />

        <StatCard
          title="Prescriptions Handled"
          value={summary.total_requests_processed.toLocaleString()}
          delta="Completed dispense tickets"
          icon={<FiCheckCircle className="text-xl" />}
          accentClassName="border-indigo-200 bg-white dark:border-indigo-900/30 dark:bg-slate-900"
          iconClassName="text-indigo-700 dark:text-indigo-300"
          iconBackgroundClassName="bg-indigo-50 dark:bg-indigo-950/40"
          valueClassName="text-indigo-700 dark:text-indigo-300"
        />

        <StatCard
          title="Total Units Dispensed"
          value={summary.total_quantity_dispensed.toLocaleString()}
          delta="Cumulative medication items handed out"
          icon={<FiPackage className="text-xl" />}
          accentClassName="border-purple-200 bg-white dark:border-purple-900/30 dark:bg-slate-900"
          iconClassName="text-purple-700 dark:text-purple-300"
          iconBackgroundClassName="bg-purple-50 dark:bg-purple-950/40"
          valueClassName="text-purple-700 dark:text-purple-300"
        />

        <StatCard
          title="Shift Revenue Generated"
          value={formatCurrency(summary.total_revenue)}
          delta="Total cash, POS & transfer value"
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
              Pharmacist Shift & Performance Audit
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Prescription count, medication volume, and revenue breakdown by payment channel per pharmacist.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Showing {pharmacists.length} of {pagination.total_items} staff
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3.5">#</th>
                <th className="px-6 py-3.5">Pharmacist</th>
                <th className="px-6 py-3.5 text-right">Prescriptions</th>
                <th className="px-6 py-3.5 text-right">Units Dispensed</th>
                <th className="px-6 py-3.5 text-right">Cash</th>
                <th className="px-6 py-3.5 text-right">POS</th>
                <th className="px-6 py-3.5 text-right">Transfer</th>
                <th className="px-6 py-3.5 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                    <p className="mt-2 text-xs">Loading pharmacist performance records...</p>
                  </td>
                </tr>
              ) : pharmacists.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <FiInbox className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-base font-semibold text-slate-800 dark:text-slate-200">No performance records found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      No pharmacist activity was recorded for this date range.
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
                pharmacists.map((ph, index) => {
                  const rowNum = (pagination.page - 1) * pagination.limit + index + 1;
                  return (
                    <tr
                      key={ph.pharmacist_id || `${ph.pharmacist_name}-${index}`}
                      className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-6 py-3.5 text-xs text-slate-400 font-mono">{rowNum}</td>
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {ph.pharmacist_name}
                        </div>
                        {ph.email && (
                          <div className="text-xs text-slate-400">{ph.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold text-slate-900 dark:text-slate-100">
                        {ph.requests_count.toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 text-right font-medium text-slate-700 dark:text-slate-300">
                        {ph.total_quantity_dispensed.toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                        {formatCurrency(ph.cash_amount)}
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                        {formatCurrency(ph.pos_amount)}
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                        {formatCurrency(ph.transfer_amount)}
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatCurrency(ph.total_amount)}
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
              Page {pagination.page} of {pagination.total_pages} ({pagination.total_items} staff total)
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
