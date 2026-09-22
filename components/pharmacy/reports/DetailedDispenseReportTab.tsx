"use client";

import React from "react";
import StatCard from "@/components/shared/StatCard";
import { formatCurrency, formatDateTime } from "@/libs/helper";
import {
  FiFileText,
  FiPackage,
  FiDollarSign,
  FiChevronLeft,
  FiChevronRight,
  FiInbox,
  FiUser,
} from "react-icons/fi";
import { DetailedDispenseReportData } from "@/libs/pharmacy-reports";

interface Props {
  data?: DetailedDispenseReportData;
  isLoading: boolean;
  page: number;
  onPageChange: (newPage: number) => void;
  onResetFilters: () => void;
}

export default function DetailedDispenseReportTab({
  data,
  isLoading,
  page,
  onPageChange,
  onResetFilters,
}: Props) {
  const summary = data?.summary || {
    total_dispense_records: 0,
    total_quantity: 0,
    total_amount: 0,
  };
  const pagination = data?.pagination || {
    total_items: 0,
    page: 1,
    limit: 20,
    total_pages: 1,
  };
  const records = data?.records || [];

  return (
    <div className="space-y-6">
      {/* 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Dispense Records"
          value={summary.total_dispense_records.toLocaleString()}
          delta="Individual dispense lines executed"
          icon={<FiFileText className="text-xl" />}
          accentClassName="border-indigo-200 bg-white dark:border-indigo-900/30 dark:bg-slate-900"
          iconClassName="text-indigo-700 dark:text-indigo-300"
          iconBackgroundClassName="bg-indigo-50 dark:bg-indigo-950/40"
          valueClassName="text-slate-900 dark:text-slate-100"
        />

        <StatCard
          title="Total Units Dispensed"
          value={summary.total_quantity.toLocaleString()}
          delta="Cumulative medication items handed out"
          icon={<FiPackage className="text-xl" />}
          accentClassName="border-cyan-200 bg-white dark:border-cyan-900/30 dark:bg-slate-900"
          iconClassName="text-cyan-700 dark:text-cyan-300"
          iconBackgroundClassName="bg-cyan-50 dark:bg-cyan-950/40"
          valueClassName="text-cyan-700 dark:text-cyan-300"
        />

        <StatCard
          title="Total Amount Dispensed"
          value={formatCurrency(summary.total_amount)}
          delta="Aggregate dispensed value"
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
              Detailed Dispense Audit Ledger
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Complete transaction log with patient info, dispensing pharmacist, billing code, and payment method.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Showing {records.length} of {pagination.total_items} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3.5">Dispensed At</th>
                <th className="px-6 py-3.5">Patient Details</th>
                <th className="px-6 py-3.5">Medication Dispensed</th>
                <th className="px-6 py-3.5 text-right">Qty</th>
                <th className="px-6 py-3.5 text-right">Unit Price</th>
                <th className="px-6 py-3.5 text-right">Amount Paid</th>
                <th className="px-6 py-3.5">Pharmacist</th>
                <th className="px-6 py-3.5">Ref / Billing Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                    <p className="mt-2 text-xs">Loading detailed dispense records...</p>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <FiInbox className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-base font-semibold text-slate-800 dark:text-slate-200">No dispense records found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      No prescriptions or items were dispensed matching the active filter criteria.
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
                records.map((rec, index) => (
                  <tr
                    key={rec.item_id || `${rec.request_id}-${index}`}
                    className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-3.5 text-xs font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDateTime(rec.dispensed_at)}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <FiUser className="text-xs text-slate-400" />
                        {rec.patient_name || "Walk-in Patient"}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        {rec.patient_id && <span className="font-mono">{rec.patient_id}</span>}
                        {rec.phone_number && <span>• {rec.phone_number}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {rec.drug_name}
                      </div>
                      {rec.generic_name && (
                        <div className="text-xs text-slate-400">{rec.generic_name}</div>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right font-bold text-slate-900 dark:text-slate-100">
                      {rec.quantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono text-xs text-slate-500 dark:text-slate-400">
                      {formatCurrency(rec.unit_price)}
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatCurrency(rec.amount_paid)}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-700 dark:text-slate-300">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                        {rec.pharmacist_name || "Pharmacist"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs">
                      <div className="font-mono font-medium text-slate-700 dark:text-slate-300">
                        {rec.billing_code || rec.receipt_no || "N/A"}
                      </div>
                      {rec.payment_method && (
                        <span className="mt-0.5 inline-block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                          {rec.payment_method}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.total_pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Page {pagination.page} of {pagination.total_pages} ({pagination.total_items} records total)
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
