"use client";

import React, { useRef, useEffect } from "react";
import { FiX, FiPrinter, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
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

  const statusConfig = SETTLEMENT_STATUS_LABELS[exchange.settlement_status] || {
    label: exchange.settlement_status,
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
        className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl my-8 overflow-hidden dark:border-slate-800 dark:bg-slate-900 print:shadow-none print:border-none print:max-w-full"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
              <FiCheckCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Drug Exchange Voucher
              </h3>
              <p className="text-xs text-gray-500">
                Official transaction record and dispensary audit slip
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 shadow-xs"
            >
              <FiPrinter /> Print Voucher
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div ref={printRef} className="p-6 space-y-6 text-slate-900 dark:text-slate-100 print:p-0">
          {/* Slip Header */}
          <div className="text-center border-b border-gray-100 pb-5 dark:border-slate-800">
            <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Hospital Pharmacy Dispensary
            </h2>
            <p className="text-xs font-semibold text-brand-700 dark:text-brand-400">
              DRUG RETURN & EXCHANGE VOUCHER
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Unit: {exchange.pharmacy_unit_name || "Dispensary Unit"}
            </p>
            <div className="mt-3 inline-block rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-1.5 font-mono text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Ref: {exchange.exchange_code}
            </div>
          </div>

          {/* Transaction Metadata */}
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-xs dark:border-slate-800 dark:bg-slate-800/40 sm:grid-cols-4">
            <div>
              <p className="text-gray-400 font-medium">Patient Name</p>
              <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {exchange.patient_name}
              </p>
            </div>
            <div>
              <p className="text-gray-400 font-medium">Patient ID / HN</p>
              <p className="font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {exchange.patient_id || exchange.hospital_number || "Walk-In"}
              </p>
            </div>
            <div>
              <p className="text-gray-400 font-medium">Original Bill Code</p>
              <p className="font-mono font-bold text-brand-700 dark:text-brand-400 mt-0.5">
                {exchange.original_billing_code || "Direct Return"}
              </p>
            </div>
            <div>
              <p className="text-gray-400 font-medium">Date & Time</p>
              <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                {formatDateTime(exchange.created_at)}
              </p>
            </div>
          </div>

          {/* Returned Items Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <span>●</span> Returned Medication(s)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 font-semibold border-b border-gray-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">Item Description</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3">Reason for Return</th>
                    <th className="p-3">Condition</th>
                    <th className="p-3 text-right">Value Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {exchange.returned_items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                        {item.returned_drug_name}
                      </td>
                      <td className="p-3 text-center font-bold text-rose-700 dark:text-rose-400">
                        -{item.returned_quantity}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-slate-300">
                        {RETURN_REASON_LABELS[item.return_reason] || item.return_reason}
                        {item.reason_notes && (
                          <span className="block text-[11px] text-gray-400 italic">
                            &quot;{item.reason_notes}&quot;
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                          DRUG_CONDITION_LABELS[item.drug_condition]?.badgeColor || "bg-gray-50"
                        }`}>
                          {item.drug_condition === "INTACT_RESELLABLE"
                            ? "Intact (Restocked)"
                            : item.drug_condition === "OPENED_DAMAGED"
                            ? "Damaged (Quarantined)"
                            : "Expired"}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(item.return_subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Replacement Items Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <span>●</span> Replacement Medication Dispensed
            </h4>
            {exchange.replacement_items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-500 dark:border-slate-800">
                No replacement medication dispensed (Return Only transaction).
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 font-semibold border-b border-gray-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">Item Description</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3">Batch & Expiry</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {exchange.replacement_items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                          {item.replacement_drug_name}
                        </td>
                        <td className="p-3 text-center font-bold text-emerald-700 dark:text-emerald-400">
                          +{item.replacement_quantity}
                        </td>
                        <td className="p-3 text-gray-500">
                          {item.batch_number || "—"} | Exp: {item.expiry_date || "—"}
                        </td>
                        <td className="p-3 text-right">
                          {formatCurrency(item.replacement_unit_price)}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(item.replacement_subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Financial Calculation & Settlement Box */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600 dark:text-slate-300">
                <span>Total Value of Returned Items (Credit):</span>
                <span className="font-semibold text-rose-700 dark:text-rose-400">
                  - {formatCurrency(exchange.total_returned_value)}
                </span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-slate-300">
                <span>Total Cost of Replacement Items:</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  + {formatCurrency(exchange.total_replacement_cost)}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 dark:border-slate-700 flex justify-between items-center text-sm font-bold">
                <span>Net Settlement Balance:</span>
                <span className={
                  exchange.balance_difference > 0
                    ? "text-rose-700 dark:text-rose-400"
                    : exchange.balance_difference < 0
                    ? "text-purple-700 dark:text-purple-400"
                    : "text-blue-700 dark:text-blue-400"
                }>
                  {exchange.balance_difference > 0
                    ? `Additional Due: ${formatCurrency(exchange.balance_difference)}`
                    : exchange.balance_difference < 0
                    ? `Refund Due: ${formatCurrency(Math.abs(exchange.balance_difference))}`
                    : "Even Exchange (₦0.00)"}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-medium">Status:</span>
                  <span className={`inline-block rounded-md border px-2.5 py-0.5 font-bold ${statusConfig.badgeClass}`}>
                    {statusConfig.label}
                  </span>
                </div>
                {exchange.payment_method && exchange.payment_method !== "NONE" && (
                  <span className="text-gray-500 text-[11px]">
                    Method: <strong>{exchange.payment_method}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Remarks */}
          {exchange.remarks && (
            <div className="rounded-xl border border-gray-100 bg-white p-3 text-xs text-gray-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                Pharmacist Remarks:
              </span>
              {exchange.remarks}
            </div>
          )}

          {/* Signatures Footer */}
          <div className="grid grid-cols-2 gap-8 border-t border-gray-200 pt-6 text-center text-xs dark:border-slate-800">
            <div>
              <div className="h-10 border-b border-dashed border-gray-300 dark:border-slate-700 mb-1"></div>
              <p className="font-bold text-slate-900 dark:text-slate-100">
                {exchange.pharmacist_name || "Dispensing Pharmacist"}
              </p>
              <p className="text-[11px] text-gray-400">Authorized Pharmacist Signature</p>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-gray-300 dark:border-slate-700 mb-1"></div>
              <p className="font-bold text-slate-900 dark:text-slate-100">
                {exchange.patient_name}
              </p>
              <p className="text-[11px] text-gray-400">Patient / Receiver Signature</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30 print:hidden">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 shadow-xs"
          >
            <FiPrinter /> Print Voucher Slip
          </button>
        </div>
      </div>
    </div>
  );
}
