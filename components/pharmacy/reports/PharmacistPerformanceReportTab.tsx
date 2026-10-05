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
import { PharmacistPerformanceReportData, PharmacistPerformanceItem } from "@/libs/pharmacy-reports";

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
  const pharmacists = React.useMemo<PharmacistPerformanceItem[]>(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data as PharmacistPerformanceItem[];
    const rawObj = data as any;
    if (Array.isArray(rawObj.pharmacists)) return rawObj.pharmacists;
    if (Array.isArray(rawObj.items)) return rawObj.items;
    if (Array.isArray(rawObj.records)) return rawObj.records;
    if (Array.isArray(rawObj.data)) return rawObj.data;
    if (rawObj.data && typeof rawObj.data === "object") {
      if (Array.isArray(rawObj.data.pharmacists)) return rawObj.data.pharmacists;
      if (Array.isArray(rawObj.data.items)) return rawObj.data.items;
      if (Array.isArray(rawObj.data.records)) return rawObj.data.records;
      if (Array.isArray(rawObj.data.data)) return rawObj.data.data;
    }
    return [];
  }, [data]);

  const summary = React.useMemo(() => {
    const rawObj = (data as any) || {};
    const s = rawObj.summary || rawObj.data?.summary || {};
    const total_pharmacists = s.total_pharmacists ?? (pharmacists.length > 0 ? pharmacists.length : 0);
    const total_requests_processed =
      s.total_requests_processed ??
      pharmacists.reduce((acc: number, p: any) => acc + Number(p.requests_count || p.total_requests || 0), 0);
    const total_quantity_dispensed =
      s.total_quantity_dispensed ??
      pharmacists.reduce(
        (acc: number, p: any) => acc + Number(p.total_quantity_dispensed || p.quantity_dispensed || 0),
        0
      );
    const total_revenue =
      s.total_revenue ??
      pharmacists.reduce(
        (acc: number, p: any) => acc + Number(p.total_amount || p.total_revenue || p.amount || 0),
        0
      );

    return {
      total_pharmacists,
      total_requests_processed,
      total_quantity_dispensed,
      total_revenue,
    };
  }, [data, pharmacists]);

  const pagination = React.useMemo(() => {
    const rawObj = (data as any) || {};
    const p = rawObj.pagination || rawObj.data?.pagination;
    return (
      p || {
        total_items: pharmacists.length,
        page: 1,
        limit: 20,
        total_pages: Math.ceil(pharmacists.length / 20) || 1,
      }
    );
  }, [data, pharmacists]);

  const pageSize = pagination.limit || 20;
  const isClientPaginated = pharmacists.length > pageSize;
  const displayPharmacists = React.useMemo(() => {
    if (!isClientPaginated) return pharmacists;
    const start = (page - 1) * pageSize;
    return pharmacists.slice(start, start + pageSize);
  }, [pharmacists, page, pageSize, isClientPaginated]);

  const totalPages = isClientPaginated
    ? Math.max(1, Math.ceil(pharmacists.length / pageSize))
    : pagination.total_pages || 1;
  const totalItems = isClientPaginated ? pharmacists.length : pagination.total_items;

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
            Showing {displayPharmacists.length} of {totalItems} staff (Page {page} of {totalPages})
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
              ) : displayPharmacists.length === 0 ? (
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
                displayPharmacists.map((ph, index) => {
                  const rowNum = (page - 1) * pageSize + index + 1;
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
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Page {page} of {totalPages} ({totalItems} staff total)
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
