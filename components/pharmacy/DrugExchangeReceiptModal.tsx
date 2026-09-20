"use client";

import React, { useRef, useEffect } from "react";
import { FiX, FiPrinter, FiCheckCircle } from "react-icons/fi";
import { formatCurrency, formatDateTime } from "@/libs/helper";
import { useScrollLock } from "@/hooks/useScrollLock";
import {
  DrugExchangeRecord,
  RETURN_REASON_LABELS,
  DRUG_CONDITION_LABELS,
  SETTLEMENT_STATUS_LABELS,
} from "@/libs/pharmacy-exchange";

interface Props {
  exchange: DrugExchangeRecord | null;
  onClose: () => void;
}

export default function DrugExchangeReceiptModal({ exchange, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  useScrollLock(Boolean(exchange));

  useEffect(() => {
    if (!exchange) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [exchange, onClose]);

  if (!exchange) return null;

  const handlePrint = () => {
    window.print();
  };

  const returnedItems = exchange.returned_items ?? [];
  const replacementItems = exchange.replacement_items ?? [];
  const totalReturned = exchange.total_returned_value ?? exchange.total_returned_amount ?? 0;
  const totalReplacement = exchange.total_replacement_cost ?? exchange.total_replacement_amount ?? 0;
  const balanceDiff = exchange.balance_difference ?? exchange.net_amount ?? 0;

  const statusKey = exchange.settlement_status || (exchange as any).status || "completed";
  const statusConfig = SETTLEMENT_STATUS_LABELS[statusKey] || {
    label: String(statusKey),
    badgeClass: "bg-gray-100 text-gray-800",
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white shadow-2xl my-4 overflow-hidden dark:border-slate-800 dark:bg-slate-900 print:shadow-none print:border-none print:max-w-full"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
              <FiCheckCircle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                Drug Exchange Voucher
              </h3>
              <p className="text-[11px] text-gray-500">
                Dispensary audit slip
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 shadow-xs"
            >
              <FiPrinter className="text-xs" /> Print
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div ref={printRef} className="p-5 space-y-4 text-slate-900 dark:text-slate-100 print:p-0">
          {/* Slip Header */}
          <div className="text-center border-b border-gray-100 pb-3.5 dark:border-slate-800">
            <h2 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Hospital Pharmacy Dispensary
            </h2>
            <p className="text-xs font-semibold text-brand-700 dark:text-brand-400">
              DRUG RETURN & EXCHANGE VOUCHER
            </p>
            <div className="mt-2 inline-block rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-1 font-mono text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Ref: {exchange.exchange_code}
            </div>
          </div>

          {/* Transaction Metadata */}
          <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-gray-100 bg-gray-50/50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40 sm:grid-cols-4">
            <div>
              <p className="text-[10px] uppercase font-semibold text-gray-400">Patient Name</p>
              <p className="font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                {exchange.patient_name}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-gray-400">Patient ID / HN</p>
              <p className="font-mono font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                {exchange.patient_id || exchange.hospital_number || "Walk-In"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-gray-400">Original Bill</p>
              <p className="font-mono font-bold text-brand-700 dark:text-brand-400 truncate mt-0.5">
                {exchange.original_billing_code || "Direct Return"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-gray-400">Date & Time</p>
              <p className="font-medium text-slate-800 dark:text-slate-200 truncate mt-0.5">
                {formatDateTime(exchange.created_at)}
              </p>
            </div>
          </div>

          {/* Returned Items Section */}
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <span>●</span> Returned Medication(s)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 font-semibold border-b border-gray-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2 px-3">Item Description</th>
                    <th className="py-2 px-2 text-center">Qty</th>
                    <th className="py-2 px-3">Reason</th>
                    <th className="py-2 px-2 text-center">Condition</th>
                    <th className="py-2 px-3 text-right">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {returnedItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100">
                        {item.returned_drug_name || item.drug_name}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-rose-700 dark:text-rose-400">
                        -{item.returned_quantity ?? item.quantity ?? 1}
                      </td>
                      <td className="py-2 px-3 text-gray-600 dark:text-slate-300">
                        {RETURN_REASON_LABELS[item.return_reason || item.reason || ""] || item.return_reason || item.reason}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className={`inline-block rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${
                          DRUG_CONDITION_LABELS[item.drug_condition || item.condition || "sealed"]?.badgeColor || "bg-gray-50"
                        }`}>
                          {item.drug_condition || item.condition || "sealed"}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(item.return_subtotal ?? item.total_price ?? (item.unit_price || 0) * (item.quantity || 1))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Replacement Items Section */}
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <span>●</span> Replacement Medication Dispensed
            </h4>
            {replacementItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 py-3 px-4 text-center text-xs text-gray-500 dark:border-slate-800">
                No replacement medication dispensed (Return Only transaction).
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 font-semibold border-b border-gray-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2 px-3">Item Description</th>
                      <th className="py-2 px-2 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Unit Price</th>
                      <th className="py-2 px-3 text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {replacementItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100">
                          {item.replacement_drug_name || item.drug_name}
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-emerald-700 dark:text-emerald-400">
                          +{item.replacement_quantity ?? item.quantity ?? 1}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {formatCurrency(item.replacement_unit_price ?? item.unit_price ?? 0)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(item.replacement_subtotal ?? item.total_price ?? (item.unit_price || 0) * (item.quantity || 1))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Financial Calculation & Settlement Box */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600 dark:text-slate-300">
                <span>Total Return Credit:</span>
                <span className="font-semibold text-rose-700 dark:text-rose-400">
                  - {formatCurrency(totalReturned)}
                </span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-slate-300">
                <span>Total Replacement Cost:</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  + {formatCurrency(totalReplacement)}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 dark:border-slate-700 flex justify-between items-center text-xs font-bold">
                <span>Net Balance:</span>
                <span className={
                  balanceDiff > 0
                    ? "text-rose-700 dark:text-rose-400"
                    : balanceDiff < 0
                    ? "text-purple-700 dark:text-purple-400"
                    : "text-blue-700 dark:text-blue-400"
                }>
                  {balanceDiff > 0
                    ? `Additional Due: ${formatCurrency(balanceDiff)}`
                    : balanceDiff < 0
                    ? `Refund Due: ${formatCurrency(Math.abs(balanceDiff))}`
                    : "Even Exchange (₦0.00)"}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500">Status:</span>
                  <span className={`inline-block rounded-md border px-2 py-0.5 font-bold ${statusConfig.badgeClass}`}>
                    {statusConfig.label}
                  </span>
                </div>
                <span className="text-gray-400">
                  Pharmacist: <strong>{exchange.pharmacist_name || "Dispensary Staff"}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Remarks (if any) */}
          {exchange.remarks && (
            <div className="rounded-lg border border-gray-100 bg-white p-2.5 text-[11px] text-gray-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                Remarks:
              </span>
              {exchange.remarks}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-gray-100 bg-gray-50/50 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/30 print:hidden">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 shadow-xs"
          >
            <FiPrinter className="text-xs" /> Print Voucher Slip
          </button>
        </div>
      </div>
    </div>
  );
}
