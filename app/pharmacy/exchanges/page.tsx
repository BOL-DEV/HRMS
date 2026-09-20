"use client";

import React, { useState, useMemo, useEffect } from "react";
import Header from "@/components/shared/Header";
import StatCard from "@/components/shared/StatCard";
import { formatCurrency, formatDateTime, formatDate } from "@/libs/helper";
import {
  FiRepeat,
  FiPlus,
  FiSearch,
  FiPrinter,
  FiCalendar,
  FiFilter,
  FiRotateCcw,
  FiDollarSign,
  FiPackage,
  FiArrowUpRight,
  FiArrowDownRight,
  FiFileText,
  FiEye,
} from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import { getAgentAccessToken, decodeJwt } from "@/libs/auth";
import { useRouter } from "next/navigation";
import {
  DrugExchangeRecord,
  getDrugExchangesList,
  getDrugExchangeReports,
  RETURN_REASON_LABELS,
  DRUG_CONDITION_LABELS,
  SETTLEMENT_STATUS_LABELS,
} from "@/libs/pharmacy-exchange";
import { getPharmacyProfile } from "@/libs/pharmacy-api";
import DrugExchangeModal from "@/components/pharmacy/DrugExchangeModal";
import DrugExchangeReceiptModal from "@/components/pharmacy/DrugExchangeReceiptModal";

export default function DrugExchangesPage() {
  const router = useRouter();
  const accessToken = typeof window !== "undefined" ? getAgentAccessToken() : null;

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  // Profile
  const { data: profileResponse } = useQuery({
    queryKey: ["pharmacy-profile-exchanges"],
    queryFn: getPharmacyProfile,
    enabled: Boolean(accessToken),
  });
  const profile = profileResponse?.data;
  const pharmacistName = profile?.first_name ? `${profile.first_name} ${profile.last_name || ""}` : "Dispensing Pharmacist";
  const unitName = profile?.pharmacy_unit?.name || "Pharmacy Main";

  // Filters State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modals
  const [isNewExchangeOpen, setIsNewExchangeOpen] = useState(false);
  const [selectedReceiptExchange, setSelectedReceiptExchange] = useState<DrugExchangeRecord | null>(null);

  // Query Exchanges List
  const {
    data: exchangesData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["pharmacy-drug-exchanges", search, statusFilter, startDate, endDate],
    queryFn: () =>
      getDrugExchangesList({
        search,
        status: statusFilter,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      }),
    enabled: Boolean(accessToken),
  });

  // Query Exchange Reports KPI
  const { data: reportsData } = useQuery({
    queryKey: ["pharmacy-drug-exchange-reports", startDate, endDate],
    queryFn: () =>
      getDrugExchangeReports({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      }),
    enabled: Boolean(accessToken),
  });

  const rawRecords = exchangesData?.data?.items ?? [];
  const records = useMemo(() => {
    let list = rawRecords;
    if (statusFilter !== "all") {
      list = list.filter((rec) => {
        const s = String(rec.settlement_status || (rec as any).status || "").toLowerCase().replace(/-/g, "_");
        const target = statusFilter.toLowerCase().replace(/-/g, "_");
        return s === target;
      });
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((rec) => {
        return (
          rec.exchange_code?.toLowerCase().includes(q) ||
          rec.patient_name?.toLowerCase().includes(q) ||
          rec.patient_id?.toLowerCase().includes(q) ||
          rec.phone_number?.toLowerCase().includes(q) ||
          (rec.returned_items || []).some((it) => it.returned_drug_name?.toLowerCase().includes(q)) ||
          (rec.replacement_items || []).some((it) => it.replacement_drug_name?.toLowerCase().includes(q))
        );
      });
    }
    return list;
  }, [rawRecords, statusFilter, search]);

  const listSummary = exchangesData?.data?.summary;
  const reportsSummary = reportsData?.data?.summary;

  const summary = {
    total_exchanges: reportsSummary?.total_exchanges ?? listSummary?.total_exchanges ?? rawRecords.length,
    total_returned_value: reportsSummary?.total_returned_value ?? listSummary?.total_returned_value ?? 0,
    total_replacement_cost: reportsSummary?.total_replacement_value ?? listSummary?.total_replacement_cost ?? 0,
    net_additional_paid: reportsSummary?.total_additional_amount_due ?? listSummary?.net_additional_paid ?? 0,
    net_refunds_issued: reportsSummary?.total_refund_amount_due ?? listSummary?.net_refunds_issued ?? 0,
  };

  const hasActiveFilters = Boolean(search || statusFilter !== "all" || startDate || endDate);

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
  };

  const handleExchangeCreated = (newRecord: DrugExchangeRecord) => {
    refetch();
    setSelectedReceiptExchange(newRecord);
  };

  if (!accessToken) return null;

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-canvas">
      <Header
        title="Drug Return & Exchange"
        Subtitle="Process patient medication returns, exchange formulations, and manage financial balance settlements"
      />

      <div className="space-y-6 p-6">
        {/* Page Top Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FiRepeat className="text-brand-600" />
              Drug Return & Exchange
            </h1>
            <p className="text-sm text-gray-500">
              Audit trail of patient returns, replacement formulations, and cashier billing differences.
            </p>
          </div>
          <div>
            <button
              onClick={() => setIsNewExchangeOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 shadow-sm"
            >
              <FiPlus />
              New Return / Exchange
            </button>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Exchanges Processed"
            value={String(summary.total_exchanges)}
            delta="Completed return transactions"
            icon={<FiRepeat className="text-xl" />}
            accentClassName="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            iconClassName="text-slate-700 dark:text-slate-300"
            iconBackgroundClassName="bg-slate-100 dark:bg-slate-800"
            valueClassName="text-slate-900 dark:text-slate-100"
          />

          <StatCard
            title="Total Value Returned"
            value={formatCurrency(summary.total_returned_value)}
            delta="Formulations credit received"
            icon={<FiArrowDownRight className="text-xl" />}
            accentClassName="border-rose-200 bg-white dark:border-rose-900/30 dark:bg-slate-900"
            iconClassName="text-rose-700 dark:text-rose-300"
            iconBackgroundClassName="bg-rose-50 dark:bg-rose-950/40"
            valueClassName="text-rose-700 dark:text-rose-300"
          />

          <StatCard
            title="Replacement Drugs Cost"
            value={formatCurrency(summary.total_replacement_cost)}
            delta="Medications dispensed in swap"
            icon={<FiPackage className="text-xl" />}
            accentClassName="border-emerald-200 bg-white dark:border-emerald-900/30 dark:bg-slate-900"
            iconClassName="text-emerald-700 dark:text-emerald-300"
            iconBackgroundClassName="bg-emerald-50 dark:bg-emerald-950/40"
            valueClassName="text-emerald-700 dark:text-emerald-300"
          />

          <StatCard
            title="Net Additional Revenue"
            value={formatCurrency(summary.net_additional_paid)}
            delta={summary.net_refunds_issued > 0 ? `₦${summary.net_refunds_issued.toLocaleString()} refunds issued` : "Additional balance collected"}
            icon={<FiDollarSign className="text-xl" />}
            accentClassName="border-indigo-200 bg-white dark:border-indigo-900/30 dark:bg-slate-900"
            iconClassName="text-indigo-700 dark:text-indigo-300"
            iconBackgroundClassName="bg-indigo-50 dark:bg-indigo-950/40"
            valueClassName="text-indigo-700 dark:text-indigo-300"
          />
        </div>

        {/* Filter Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-3 dark:border-slate-800">
            <div className="flex flex-wrap gap-1">
              {[
                { id: "all", label: "All Exchanges" },
                { id: "pending_payment", label: "Pending Payment" },
                { id: "pending_refund", label: "Pending Refund" },
                { id: "completed", label: "Completed" },
                { id: "cancelled", label: "Cancelled" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
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
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Ref Code, Patient Name, PID, or Drug..."
                className="w-full rounded-xl border border-gray-200 bg-canvas-alt py-2 pl-10 pr-4 text-xs outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-canvas-alt px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-canvas-alt px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Exchanges Ledger Table */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-100 bg-gray-50/75 text-gray-500 font-semibold dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="p-4">Exchange Code</th>
                  <th className="p-4">Patient Info</th>
                  <th className="p-4">Returned Item(s)</th>
                  <th className="p-4">Replacement Item(s)</th>
                  <th className="p-4 text-right">Financial Settlement</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Staff & Unit</th>
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
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-gray-500">
                      <FiRepeat className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="font-semibold text-sm">No drug returns or exchanges found</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Click &quot;New Return / Exchange&quot; above to process a transaction.
                      </p>
                    </td>
                  </tr>
                ) : (
                  records.map((rec) => {
                    const statusKey = rec.settlement_status || "pending_payment";
                    const statusConfig = SETTLEMENT_STATUS_LABELS[statusKey] || {
                      label: rec.settlement_status || "Pending",
                      badgeClass: "bg-gray-100 text-gray-800",
                    };
                    const returnedItems = rec.returned_items || [];
                    const replacementItems = rec.replacement_items || [];
                    const balance = rec.balance_difference ?? rec.net_amount ?? 0;

                    return (
                      <tr
                        key={rec.id}
                        className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition"
                      >
                        {/* Ref Code & Date */}
                        <td className="p-4">
                          <p className="font-mono font-bold text-brand-700 dark:text-brand-400">
                            {rec.exchange_code}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {formatDateTime(rec.created_at)}
                          </p>
                        </td>

                        {/* Patient */}
                        <td className="p-4">
                          <p className="font-bold text-slate-900 dark:text-slate-100">
                            {rec.patient_name}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            PID: {rec.patient_id || "Walk-In"} • {rec.phone_number}
                          </p>
                        </td>

                        {/* Returned Item */}
                        <td className="p-4">
                          <div className="space-y-1">
                            {returnedItems.map((item, i) => {
                              const drugName = item.returned_drug_name || (item as any).drug_name || (item as any).item_name || (item as any).name || "Medication";
                              const qty = item.returned_quantity ?? (item as any).quantity ?? 1;
                              const reasonKey = item.return_reason || (item as any).reason || "";
                              const reasonLabel = (reasonKey && RETURN_REASON_LABELS[reasonKey]) || reasonKey || "Patient Return";

                              return (
                                <div key={i} className="text-xs">
                                  <span className="font-medium text-rose-700 dark:text-rose-400">
                                    -{qty}x {drugName}
                                  </span>
                                  <span className="text-[11px] text-gray-400 block">
                                    Reason: {reasonLabel}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </td>

                        {/* Replacement Item */}
                        <td className="p-4">
                          {replacementItems.length === 0 ? (
                            <span className="text-gray-400 italic">None (Return Only)</span>
                          ) : (
                            <div className="space-y-1">
                              {replacementItems.map((item, i) => {
                                const repDrugName = item.replacement_drug_name || (item as any).drug_name || (item as any).item_name || (item as any).name || "Medication";
                                const repQty = item.replacement_quantity ?? (item as any).quantity ?? 1;
                                const repPrice = item.replacement_unit_price ?? (item as any).unit_price ?? 0;

                                return (
                                  <div key={i} className="text-xs">
                                    <span className="font-medium text-emerald-700 dark:text-emerald-400">
                                      +{repQty}x {repDrugName}
                                    </span>
                                    <span className="text-[11px] text-gray-400 block">
                                      @ {formatCurrency(repPrice)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>

                        {/* Financial Settlement */}
                        <td className="p-4 text-right">
                          <div className="text-xs space-y-0.5">
                            <p className="text-gray-500 text-[11px]">
                              Ret: {formatCurrency(rec.total_returned_value ?? 0)} | Rep: {formatCurrency(rec.total_replacement_cost ?? 0)}
                            </p>
                            <p className={`font-bold ${
                              balance > 0
                                ? "text-amber-700 dark:text-amber-400"
                                : balance < 0
                                ? "text-purple-700 dark:text-purple-400"
                                : "text-blue-700 dark:text-blue-400"
                            }`}>
                              {balance > 0
                                ? `+ ${formatCurrency(balance)} (Paid)`
                                : balance < 0
                                ? `- ${formatCurrency(Math.abs(balance))} (Refund)`
                                : "₦0.00 (Even)"}
                            </p>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <span className={`inline-block rounded-md border px-2.5 py-0.5 text-[10px] font-bold ${statusConfig.badgeClass}`}>
                            {statusConfig.label}
                          </span>
                        </td>

                        {/* Staff & Unit */}
                        <td className="p-4">
                          <p className="font-medium text-slate-800 dark:text-slate-200">
                            {rec.pharmacist_name || "Pharmacist"}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {rec.pharmacy_unit_name || "Main Unit"}
                          </p>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedReceiptExchange(rec)}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                          >
                            <FiPrinter className="text-xs" />
                            Voucher
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Exchange Modal Wizard */}
      <DrugExchangeModal
        isOpen={isNewExchangeOpen}
        onClose={() => setIsNewExchangeOpen(false)}
        onSuccess={handleExchangeCreated}
        pharmacistName={pharmacistName}
        pharmacyUnitName={unitName}
      />

      {/* Printable Receipt Modal */}
      <DrugExchangeReceiptModal
        exchange={selectedReceiptExchange}
        onClose={() => setSelectedReceiptExchange(null)}
      />
    </div>
  );
}
