"use client";

import React, { useState, useMemo, useEffect } from "react";
import Header from "@/components/shared/Header";
import StatCard from "@/components/shared/StatCard";
import { formatCurrency, formatDateTime } from "@/libs/helper";
import {
  FiDollarSign,
  FiSearch,
  FiPrinter,
  FiRotateCcw,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiUser,
  FiCheck,
  FiX,
  FiFilter,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAgentAccessToken } from "@/libs/auth";
import { useRouter } from "next/navigation";
import {
  DrugExchangeRecord,
  getPharmacyStoreRefunds,
  approvePharmacyStoreRefund,
  SETTLEMENT_STATUS_LABELS,
  RETURN_REASON_LABELS,
} from "@/libs/pharmacy-exchange";
import { getPharmacyStoreProfile, getPharmacyProfile } from "@/libs/pharmacy-api";
import DrugExchangeReceiptModal from "@/components/pharmacy/DrugExchangeReceiptModal";

export default function PharmacyStoreRefundsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = typeof window !== "undefined" ? getAgentAccessToken() : null;

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  // Filters State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "all">("pending");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Approval Modal State
  const [approvingExchange, setApprovingExchange] = useState<DrugExchangeRecord | null>(null);
  const [approvalRemarks, setApprovalRemarks] = useState("");

  // Voucher Receipt Modal State
  const [viewingReceipt, setViewingReceipt] = useState<DrugExchangeRecord | null>(null);

  // Query Profile
  const { data: storeProfileData } = useQuery({
    queryKey: ["pharmacy-store-profile-refunds"],
    queryFn: async () => {
      try {
        return await getPharmacyStoreProfile();
      } catch {
        return await getPharmacyProfile();
      }
    },
    enabled: Boolean(accessToken),
  });

  // Query Refunds List
  const {
    data: refundsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["pharmacy-store-refunds", statusFilter, search, startDate, endDate, currentPage],
    queryFn: () =>
      getPharmacyStoreRefunds({
        status: statusFilter,
        search: search.trim() || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        page: currentPage,
        limit: 20,
      }),
    enabled: Boolean(accessToken),
  });

  // Approve Refund Mutation
  const approveMutation = useMutation({
    mutationFn: (payload: { exchange_code: string; remarks?: string }) =>
      approvePharmacyStoreRefund(payload),
    onSuccess: (res) => {
      toast.success(res?.message || "Refund approved and patient balance cleared successfully.");
      queryClient.invalidateQueries({ queryKey: ["pharmacy-store-refunds"] });
      queryClient.invalidateQueries({ queryKey: ["pharmacy-drug-exchanges"] });
      setApprovingExchange(null);
      setApprovalRemarks("");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to approve refund.");
    },
  });

  const handleOpenApproveModal = (exchange: DrugExchangeRecord) => {
    setApprovingExchange(exchange);
    setApprovalRemarks("Settled offline with patient from administrative petty cash.");
  };

  const handleConfirmApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingExchange) return;
    approveMutation.mutate({
      exchange_code: approvingExchange.exchange_code,
      remarks: approvalRemarks.trim() || undefined,
    });
  };

  const summary = refundsData?.data?.summary || {
    total_pending_refund_count: 0,
    total_pending_refund_amount: 0,
    total_approved_refund_count: 0,
    total_approved_refund_amount: 0,
  };

  const refundsList = refundsData?.data?.refunds ?? [];
  const totalPages = refundsData?.data?.total_pages ?? 1;

  const hasActiveFilters = Boolean(search || statusFilter !== "pending" || startDate || endDate);

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("pending");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  if (!accessToken) return null;

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-canvas">
      <Header
        title="Drug Return Refunds"
        Subtitle="Review patient return claims, approve offline cash settlements, and balance store bookkeeping"
      />

      <div className="space-y-6 p-6">
        {/* Page Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FiDollarSign className="text-brand-600" />
              Pharmacy Store Refunds
            </h1>
            <p className="text-sm text-gray-500">
              Offline refund approvals for return & exchange claims. Approving strikes patient balance to ₦0 without debiting wallets.
            </p>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Awaiting Settlement"
            value={String(summary.total_pending_refund_count)}
            delta="Pending store approval"
            icon={<FiClock className="text-xl" />}
            accentClassName="border-purple-200 bg-white dark:border-purple-900/30 dark:bg-slate-900"
            iconClassName="text-purple-700 dark:text-purple-300"
            iconBackgroundClassName="bg-purple-50 dark:bg-purple-950/40"
            valueClassName="text-purple-700 dark:text-purple-300"
          />

          <StatCard
            title="Pending Refund Amount"
            value={formatCurrency(summary.total_pending_refund_amount)}
            delta="Total claims due to patients"
            icon={<FiDollarSign className="text-xl" />}
            accentClassName="border-rose-200 bg-white dark:border-rose-900/30 dark:bg-slate-900"
            iconClassName="text-rose-700 dark:text-rose-300"
            iconBackgroundClassName="bg-rose-50 dark:bg-rose-950/40"
            valueClassName="text-rose-700 dark:text-rose-300"
          />

          <StatCard
            title="Approved Settlements"
            value={String(summary.total_approved_refund_count)}
            delta="Cleared refund claims"
            icon={<FiCheckCircle className="text-xl" />}
            accentClassName="border-emerald-200 bg-white dark:border-emerald-900/30 dark:bg-slate-900"
            iconClassName="text-emerald-700 dark:text-emerald-300"
            iconBackgroundClassName="bg-emerald-50 dark:bg-emerald-950/40"
            valueClassName="text-emerald-700 dark:text-emerald-300"
          />

          <StatCard
            title="Total Settled Value"
            value={formatCurrency(summary.total_approved_refund_amount)}
            delta="Bookkeeping cleared to ₦0"
            icon={<FiCheck className="text-xl" />}
            accentClassName="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            iconClassName="text-slate-700 dark:text-slate-300"
            iconBackgroundClassName="bg-slate-100 dark:bg-slate-800"
            valueClassName="text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Filter Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-3 dark:border-slate-800">
            <div className="flex flex-wrap gap-1">
              {[
                { id: "pending", label: "Awaiting Refund" },
                { id: "approved", label: "Approved / Settled" },
                { id: "all", label: "All Records" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStatusFilter(tab.id as any);
                    setCurrentPage(1);
                  }}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                    statusFilter === tab.id
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300 font-bold"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-400"
              >
                <FiRotateCcw className="h-3.5 w-3.5" />
                Reset Filters
              </button>
            )}
          </div>

          {/* Search and Date Inputs */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by 8-char code, patient name, PID, or phone..."
                className="w-full rounded-xl border border-gray-200 bg-canvas-alt py-2 pl-10 pr-4 text-xs outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-gray-200 bg-canvas-alt px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-gray-200 bg-canvas-alt px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Refunds Table */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-100 bg-gray-50/75 text-gray-500 font-semibold dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="p-4">Exchange Code</th>
                  <th className="p-4">Patient Information</th>
                  <th className="p-4">Returned Item(s)</th>
                  <th className="p-4">Replacement Item(s)</th>
                  <th className="p-4 text-right">Refund Balance Due</th>
                  <th className="p-4">Dispensary Unit & Staff</th>
                  <th className="p-4">Status & Approval</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-700 border-t-transparent mx-auto"></div>
                    </td>
                  </tr>
                ) : refundsList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-gray-500">
                      <FiCheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                      <p className="font-semibold text-sm">No drug return refunds found</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {statusFilter === "pending"
                          ? "All drug return refund balances are settled and clear."
                          : "No records matching your search filters."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  refundsList.map((rec) => {
                    const statusKey = rec.settlement_status || "pending_refund";
                    const isPending = (rec.refund_balance || 0) > 0 || statusKey === "pending_refund";
                    const statusConfig = SETTLEMENT_STATUS_LABELS[statusKey] || {
                      label: rec.settlement_status || "Pending",
                      badgeClass: "bg-gray-100 text-gray-800",
                    };
                    const returnedItems = rec.returned_items || [];
                    const replacementItems = rec.replacement_items || [];
                    const refundDue = rec.refund_balance ?? rec.refund_amount ?? Math.abs(rec.net_amount || 0);

                    return (
                      <tr
                        key={rec.id}
                        className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition"
                      >
                        {/* 8-character Code */}
                        <td className="p-4">
                          <span className="font-mono font-black text-brand-700 dark:text-brand-400 tracking-wider block text-sm">
                            {rec.exchange_code}
                          </span>
                          <span className="text-[11px] text-gray-400 mt-0.5 block">
                            {formatDateTime(rec.created_at)}
                          </span>
                        </td>

                        {/* Patient */}
                        <td className="p-4">
                          <p className="font-bold text-slate-900 dark:text-slate-100">
                            {rec.patient_name}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            PID: {rec.patient_id || "Walk-In"} {rec.phone_number && `• ${rec.phone_number}`}
                          </p>
                        </td>

                        {/* Returned items */}
                        <td className="p-4">
                          <div className="space-y-1 max-w-[200px]">
                            {returnedItems.map((it, i) => (
                              <div key={i} className="text-xs">
                                <span className="font-medium text-rose-700 dark:text-rose-400">
                                  -{it.returned_quantity ?? it.quantity ?? 1}x {it.returned_drug_name || it.drug_name}
                                </span>
                                <span className="text-[10px] text-gray-400 block">
                                  {RETURN_REASON_LABELS[it.return_reason || it.reason || ""] || it.return_reason || it.reason}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Replacement items */}
                        <td className="p-4">
                          {replacementItems.length === 0 ? (
                            <span className="text-gray-400 italic">None (Return Only)</span>
                          ) : (
                            <div className="space-y-1 max-w-[200px]">
                              {replacementItems.map((it, i) => (
                                <div key={i} className="text-xs">
                                  <span className="font-medium text-emerald-700 dark:text-emerald-400">
                                    +{it.replacement_quantity ?? it.quantity ?? 1}x {it.replacement_drug_name || it.drug_name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Refund Balance Due */}
                        <td className="p-4 text-right">
                          <p className={`font-black text-sm ${
                            isPending
                              ? "text-purple-700 dark:text-purple-400"
                              : "text-emerald-700 dark:text-emerald-400"
                          }`}>
                            {formatCurrency(refundDue)}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {isPending ? "Awaiting Store Approval" : "Cleared to ₦0.00"}
                          </p>
                        </td>

                        {/* Dispensary Unit & Staff */}
                        <td className="p-4">
                          <p className="font-medium text-slate-800 dark:text-slate-200">
                            {rec.pharmacist_name || "Pharmacist"}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {rec.pharmacy_unit_name || "Main Dispensary"}
                          </p>
                        </td>

                        {/* Status & Approval */}
                        <td className="p-4">
                          <div className="space-y-1">
                            <span className={`inline-block rounded-md border px-2.5 py-0.5 text-[10px] font-bold ${statusConfig.badgeClass}`}>
                              {isPending ? "Pending Refund" : "Approved / Settled"}
                            </span>
                            {rec.refund_approved_at && (
                              <p className="text-[10px] text-gray-400">
                                Approved: {formatDateTime(rec.refund_approved_at)}
                              </p>
                            )}
                            {rec.refund_approval_remarks && (
                              <p className="text-[10px] text-gray-500 italic max-w-[150px] truncate" title={rec.refund_approval_remarks}>
                                &quot;{rec.refund_approval_remarks}&quot;
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isPending ? (
                              <button
                                type="button"
                                onClick={() => handleOpenApproveModal(rec)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-purple-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-600 shadow-xs"
                              >
                                <FiCheck className="text-xs" />
                                Approve Refund
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => setViewingReceipt(rec)}
                              className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                              title="View Voucher Slip"
                            >
                              <FiPrinter className="text-xs" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 p-4 dark:border-slate-800">
              <span className="text-xs text-gray-500">
                Page {currentPage} of {totalPages} ({refundsData?.data?.total_items ?? refundsList.length} total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isLoading}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(refundsData?.data?.total_pages ?? 1, p + 1))}
                  disabled={currentPage >= (refundsData?.data?.total_pages ?? 1) || isLoading}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Approve Refund Confirmation Modal */}
      {approvingExchange && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !approveMutation.isPending) setApprovingExchange(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                <FiDollarSign className="h-5 w-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Approve Offline Refund
                </h3>
              </div>
              <button
                onClick={() => setApprovingExchange(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-4 dark:border-purple-900/30 dark:bg-purple-950/20 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-slate-300">Exchange Code:</span>
                <span className="font-mono font-bold text-purple-900 dark:text-purple-200">{approvingExchange.exchange_code}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-slate-300">Patient:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{approvingExchange.patient_name}</span>
              </div>
              <div className="flex justify-between text-xs border-t border-purple-200/60 pt-2 dark:border-purple-900/40">
                <span className="font-bold text-slate-900 dark:text-slate-100">Refund Balance to Clear:</span>
                <span className="font-black text-sm text-purple-800 dark:text-purple-200">
                  {formatCurrency(approvingExchange.refund_balance ?? approvingExchange.refund_amount ?? Math.abs(approvingExchange.net_amount || 0))}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              <strong>Bookkeeping Notice:</strong> Approving this refund will clear the patient&apos;s refund balance to <strong>₦0.00</strong>. This does not alter transactions or wallet balances.
            </p>

            <form onSubmit={handleConfirmApproval} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  Settlement Remarks / Administrative Note:
                </label>
                <textarea
                  rows={2}
                  value={approvalRemarks}
                  onChange={(e) => setApprovalRemarks(e.target.value)}
                  placeholder="e.g. Paid cash from administrative petty cash voucher #123"
                  className="w-full rounded-xl border border-gray-200 bg-canvas-alt p-3 text-xs outline-none focus:ring-2 focus:ring-purple-500 dark:border-slate-700 dark:text-slate-100"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApprovingExchange(null)}
                  disabled={approveMutation.isPending}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={approveMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-5 py-2 text-xs font-bold text-white hover:bg-purple-600 shadow-xs disabled:opacity-50"
                >
                  <FiCheck />
                  {approveMutation.isPending ? "Approving..." : "Confirm & Clear Refund"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Voucher Slip Modal */}
      <DrugExchangeReceiptModal
        exchange={viewingReceipt}
        onClose={() => setViewingReceipt(null)}
      />
    </div>
  );
}
