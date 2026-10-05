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
import { DetailedDispenseReportData, DetailedDispenseRecord } from "@/libs/pharmacy-reports";

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
  const records = React.useMemo<DetailedDispenseRecord[]>(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data as DetailedDispenseRecord[];
    const rawObj = data as any;
    if (Array.isArray(rawObj.records)) return rawObj.records;
    if (Array.isArray(rawObj.items)) return rawObj.items;
    if (Array.isArray(rawObj.drugs)) return rawObj.drugs;
    if (Array.isArray(rawObj.data)) return rawObj.data;
    if (rawObj.data && typeof rawObj.data === "object") {
      if (Array.isArray(rawObj.data.records)) return rawObj.data.records;
      if (Array.isArray(rawObj.data.items)) return rawObj.data.items;
      if (Array.isArray(rawObj.data.drugs)) return rawObj.data.drugs;
      if (Array.isArray(rawObj.data.data)) return rawObj.data.data;
    }
    return [];
  }, [data]);

  const summary = React.useMemo(() => {
    const rawObj = (data as any) || {};
    const s = rawObj.summary || rawObj.data?.summary || {};
    const total_dispense_records =
      s.total_dispense_records ?? s.total_records ?? (records.length > 0 ? records.length : 0);
    const total_quantity =
      s.total_quantity ??
      records.reduce((acc: number, r: any) => acc + Number(r.quantity || r.qty || 0), 0);
    const total_amount =
      s.total_amount ??
      s.total_sales_amount ??
      s.total_revenue ??
      records.reduce((acc: number, r: any) => acc + Number(r.amount_paid || r.total_price || r.amount || 0), 0);

    return {
      total_dispense_records,
      total_quantity,
      total_amount,
    };
  }, [data, records]);

  const pagination = React.useMemo(() => {
    const rawObj = (data as any) || {};
    const p = rawObj.pagination || rawObj.data?.pagination;
    return (
      p || {
        total_items: records.length,
        page: 1,
        limit: 20,
        total_pages: Math.ceil(records.length / 20) || 1,
      }
    );
  }, [data, records]);

  const pageSize = pagination.limit || 20;
  const isClientPaginated = records.length > pageSize;
  const displayRecords = React.useMemo(() => {
    if (!isClientPaginated) return records;
    const start = (page - 1) * pageSize;
    return records.slice(start, start + pageSize);
  }, [records, page, pageSize, isClientPaginated]);

  const totalPages = isClientPaginated
    ? Math.max(1, Math.ceil(records.length / pageSize))
    : pagination.total_pages || 1;
  const totalItems = isClientPaginated ? records.length : pagination.total_items;

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
            Showing {displayRecords.length} of {totalItems} records (Page {page} of {totalPages})
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
              ) : displayRecords.length === 0 ? (
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
                displayRecords.map((rec, index) => (
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
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Page {page} of {totalPages} ({totalItems} records total)
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
