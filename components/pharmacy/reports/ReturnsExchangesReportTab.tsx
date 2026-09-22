"use client";

import React from "react";
import StatCard from "@/components/shared/StatCard";
import { formatCurrency, formatDateTime } from "@/libs/helper";
import {
  FiRepeat,
  FiArrowDownRight,
  FiArrowUpRight,
  FiDollarSign,
  FiChevronLeft,
  FiChevronRight,
  FiInbox,
  FiUser,
} from "react-icons/fi";
import { ReturnsExchangesReportData } from "@/libs/pharmacy-reports";
import { SETTLEMENT_STATUS_LABELS } from "@/libs/pharmacy-exchange";

interface Props {
  data?: ReturnsExchangesReportData;
  isLoading: boolean;
  page: number;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onPageChange: (newPage: number) => void;
  onResetFilters: () => void;
}

export default function ReturnsExchangesReportTab({
  data,
  isLoading,
  page,
  statusFilter,
  onStatusFilterChange,
  onPageChange,
  onResetFilters,
}: Props) {
  const summary = data?.summary || {
    total_exchanges: 0,
    total_returned_amount: 0,
    total_replacement_amount: 0,
    total_additional_paid: 0,
    total_refund_amount: 0,
  };
  const pagination = data?.pagination || {
    total_items: 0,
    page: 1,
    limit: 20,
    total_pages: 1,
  };
  const exchanges = data?.exchanges || [];

  return (
    <div className="space-y-6">
      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Return & Exchanges"
          value={summary.total_exchanges.toLocaleString()}
          delta="Completed & logged return events"
          icon={<FiRepeat className="text-xl" />}
          accentClassName="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          iconClassName="text-slate-700 dark:text-slate-300"
          iconBackgroundClassName="bg-slate-100 dark:bg-slate-800"
          valueClassName="text-slate-900 dark:text-slate-100"
        />

        <StatCard
          title="Total Returned Value"
          value={formatCurrency(summary.total_returned_amount)}
          delta="Credited medication formulations"
          icon={<FiArrowDownRight className="text-xl" />}
          accentClassName="border-rose-200 bg-white dark:border-rose-900/30 dark:bg-slate-900"
          iconClassName="text-rose-700 dark:text-rose-300"
          iconBackgroundClassName="bg-rose-50 dark:bg-rose-950/40"
          valueClassName="text-rose-700 dark:text-rose-300"
        />

        <StatCard
          title="Replacement Cost"
          value={formatCurrency(summary.total_replacement_amount)}
          delta="Substituted medications issued"
          icon={<FiArrowUpRight className="text-xl" />}
          accentClassName="border-emerald-200 bg-white dark:border-emerald-900/30 dark:bg-slate-900"
          iconClassName="text-emerald-700 dark:text-emerald-300"
          iconBackgroundClassName="bg-emerald-50 dark:bg-emerald-950/40"
          valueClassName="text-emerald-700 dark:text-emerald-300"
        />

        <StatCard
          title="Net Additional Collected"
          value={formatCurrency(summary.total_additional_paid)}
          delta={
            summary.total_refund_amount > 0
              ? `${formatCurrency(summary.total_refund_amount)} refunds issued`
              : "Balance collected at cashier"
          }
          icon={<FiDollarSign className="text-xl" />}
          accentClassName="border-indigo-200 bg-white dark:border-indigo-900/30 dark:bg-slate-900"
          iconClassName="text-indigo-700 dark:text-indigo-300"
          iconBackgroundClassName="bg-indigo-50 dark:bg-indigo-950/40"
          valueClassName="text-indigo-700 dark:text-indigo-300"
        />
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Drug Returns & Exchanges Audit Ledger
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Complete transaction log with patient info, credit value, replacement value, net differences, and status.
            </p>
          </div>

          {/* Status Filter Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending_payment">Pending Payment</option>
              <option value="pending_refund">Pending Refund</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3.5">Exchange Code & Date</th>
                <th className="px-6 py-3.5">Patient Details</th>
                <th className="px-6 py-3.5 text-right">Returned Value</th>
                <th className="px-6 py-3.5 text-right">Replacement Cost</th>
                <th className="px-6 py-3.5 text-right">Net Balance</th>
                <th className="px-6 py-3.5 text-center">Settlement Status</th>
                <th className="px-6 py-3.5">Pharmacist</th>
                <th className="px-6 py-3.5">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                    <p className="mt-2 text-xs">Loading return & exchange records...</p>
                  </td>
                </tr>
              ) : exchanges.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <FiInbox className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-base font-semibold text-slate-800 dark:text-slate-200">No returns or exchanges found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      No drug return or exchange transactions match the active criteria.
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
                exchanges.map((ex, index) => {
                  const statusConfig = SETTLEMENT_STATUS_LABELS[ex.status] || {
                    label: ex.status,
                    badgeClass: "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300",
                  };

                  return (
                    <tr
                      key={ex.id || `${ex.exchange_code}-${index}`}
                      className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-6 py-3.5 text-xs">
                        <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {ex.exchange_code}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {formatDateTime(ex.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <FiUser className="text-xs text-slate-400" />
                          {ex.patient_name || "Walk-in Patient"}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          {ex.patient_id && <span className="font-mono">{ex.patient_id}</span>}
                          {ex.phone_number && <span>• {ex.phone_number}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono text-xs text-rose-600 dark:text-rose-400">
                        {formatCurrency(ex.total_returned_amount)}
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono text-xs text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(ex.total_replacement_amount)}
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                        {ex.net_amount > 0 ? (
                          <span className="text-amber-600 dark:text-amber-400">+{formatCurrency(ex.net_amount)}</span>
                        ) : ex.net_amount < 0 ? (
                          <span className="text-purple-600 dark:text-purple-400">-{formatCurrency(Math.abs(ex.net_amount))}</span>
                        ) : (
                          <span className="text-slate-500">₦0.00</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusConfig.badgeClass}`}
                        >
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-700 dark:text-slate-300">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                          {ex.pharmacist_name || "Pharmacist"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-500 dark:text-slate-400 max-w-[180px] truncate" title={ex.remarks}>
                        {ex.remarks || "—"}
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
              Page {pagination.page} of {pagination.total_pages} ({pagination.total_items} exchanges total)
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
