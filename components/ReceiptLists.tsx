"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  FiExternalLink,
  FiEye,
  FiMoreVertical,
  FiPrinter,
  FiRefreshCcw,
  FiSend,
} from "react-icons/fi";
import TagPill from "@/components/TagPill";
import {
  formatCurrency,
  formatDateTime,
  openPrintWindowFromHtml,
} from "@/libs/helper";
import {
  printApprovedAgentReceipt,
  requestAgentReceiptReprint,
} from "@/libs/agent-auth";
import type { AgentReceiptItem } from "@/libs/type";

type Props = {
  rows: AgentReceiptItem[];
  totalCount: number;
  isLoading?: boolean;
  emptyMessage?: string;
};

function printReceiptHtml(receiptHTML: string) {
  const didOpenWindow = openPrintWindowFromHtml(receiptHTML);

  if (!didOpenWindow) {
    toast.error("Popup blocked. Please allow popups to print the receipt.");
  }
}

function getReprintTone(status: AgentReceiptItem["reprint_status"]) {
  if (status === "approved")
    return "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300";
  if (status === "pending")
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300";
  if (status === "rejected")
    return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300";
  return "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-200";
}

function getReprintLabel(status: AgentReceiptItem["reprint_status"]) {
  if (status === "approved") return "Approved";
  if (status === "pending") return "Pending";
  if (status === "rejected") return "Rejected";
  return "No Request";
}

function ReceiptLists({
  rows,
  totalCount,
  isLoading = false,
  emptyMessage = "No receipts found for the selected filters.",
}: Props) {
  const queryClient = useQueryClient();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [viewing, setViewing] = useState<AgentReceiptItem | null>(null);
  const [requesting, setRequesting] = useState<AgentReceiptItem | null>(null);
  const [reason, setReason] = useState("");

  const requestMutation = useMutation({
    mutationFn: requestAgentReceiptReprint,
    onSuccess: (response) => {
      toast.success(response.message || "Reprint request submitted.");
      queryClient.invalidateQueries({ queryKey: ["agent-receipts"] });
      setRequesting(null);
      setReason("");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to request reprint.",
      );
    },
  });

  const printMutation = useMutation({
    mutationFn: printApprovedAgentReceipt,
    onSuccess: (response) => {
      toast.success(response.message || "Receipt ready for printing.");
      printReceiptHtml(response.data.receipt.receiptHTML);
      queryClient.invalidateQueries({ queryKey: ["agent-receipts"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to print receipt.",
      );
    },
  });

  const menuItems = useMemo(
    () => (receipt: AgentReceiptItem) => {
      const items = [];

      items.push({
        label: "View Receipt",
        icon: <FiEye className="text-gray-600 dark:text-slate-300" />,
        onClick: () => setViewing(receipt),
        disabled: false,
      });

      if (receipt.reprint_status === "approved" && receipt.reprint === "yes") {
        items.push({
          label: "Print Receipt",
          icon: <FiPrinter className="text-gray-600 dark:text-slate-300" />,
          onClick: () => printMutation.mutate({ transaction_id: receipt.id }),
          disabled: printMutation.isPending,
        });
      } else if (receipt.reprint_status === "no_request") {
        items.push({
          label: "Request Reprint",
          icon: <FiSend className="text-gray-600 dark:text-slate-300" />,
          onClick: () => setRequesting(receipt),
          disabled: false,
        });
      } else if (receipt.reprint_status === "rejected") {
        items.push({
          label: "Request Again",
          icon: <FiRefreshCcw className="text-gray-600 dark:text-slate-300" />,
          onClick: () => setRequesting(receipt),
          disabled: false,
        });
      } else if (receipt.reprint_status === "pending") {
        items.push({
          label: "Pending Approval",
          icon: <FiSend className="text-gray-600 dark:text-slate-300" />,
          onClick: () => {},
          disabled: true,
        });
      }

      items.push({
        label: "View Transaction Ref",
        icon: <FiExternalLink className="text-gray-600 dark:text-slate-300" />,
        onClick: () => setViewing(receipt),
        disabled: false,
      });

      return items;
    },
    [printMutation],
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)] dark:border-line-subtle dark:bg-panel">
      <div className="border-b border-gray-200 p-6 dark:border-line-subtle">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">All Receipts</h2>
        <p className="text-sm text-gray-600 dark:text-slate-300">
          Showing {totalCount} receipts
        </p>
      </div>

      <div className="p-5 overflow-x-auto">
        <table className="min-w-195 w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left text-gray-600 dark:bg-panel-strong dark:text-slate-300">
              <th className="p-3 font-semibold">Receipt No</th>
              <th className="p-3 font-semibold">Patient</th>
              <th className="p-3 font-semibold">Patient ID</th>
              <th className="p-3 font-semibold">Phone</th>
              <th className="p-3 font-semibold">Department</th>
              <th className="p-3 font-semibold">Income Head</th>
              <th className="p-3 font-semibold">Bill Name</th>
              <th className="p-3 font-semibold">Amount</th>
              <th className="p-3 font-semibold">Payment</th>
              <th className="p-3 font-semibold">Reprint Status</th>
              <th className="p-3 font-semibold">Date Issued</th>
              <th className="p-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td className="p-4 text-gray-500 dark:text-slate-400" colSpan={12}>
                  Loading receipts...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="p-4 text-gray-500 dark:text-slate-400" colSpan={12}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((receipt) => (
                <tr key={receipt.id} className="border-b border-gray-100 dark:border-line-subtle">
                  <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                    {receipt.receipt_no}
                  </td>
                  <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                    {receipt.patient_name}
                  </td>
                  <td className="p-3 text-gray-700 dark:text-slate-200">{receipt.patient_id}</td>
                  <td className="p-3 text-gray-700 dark:text-slate-200">{receipt.phone_number}</td>
                  <td className="p-3 text-gray-700 dark:text-slate-200">{receipt.department}</td>
                  <td className="p-3 text-gray-700 dark:text-slate-200">{receipt.income_head}</td>
                  <td className="p-3 text-gray-700 dark:text-slate-200">{receipt.bill_name}</td>
                  <td className="p-3 font-semibold text-brand-700 dark:text-brand-300">
                    {formatCurrency(Number(receipt.amount))}
                  </td>
                  <td className="p-3">
                    <TagPill
                      label={receipt.payment_type.toUpperCase()}
                      tone="info"
                    />
                  </td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getReprintTone(
                        receipt.reprint_status,
                      )}`}
                    >
                      {getReprintLabel(receipt.reprint_status)}
                    </span>
                  </td>
                  <td className="p-3 text-gray-700 dark:text-slate-200">
                    {formatDateTime(receipt.date_time)}
                  </td>
                  <td className="p-3 text-right">
                    <div className="relative inline-block text-left">
                      <button
                        onClick={() =>
                          setOpenMenu((prev) =>
                            prev === receipt.id ? null : receipt.id,
                          )
                        }
                        className="rounded-xl border border-transparent p-2 hover:border-gray-200 hover:bg-gray-100 dark:hover:border-line-subtle dark:hover:bg-panel-strong"
                        aria-haspopup="true"
                        aria-expanded={openMenu === receipt.id}
                        type="button"
                      >
                        <FiMoreVertical className="text-gray-700 dark:text-slate-200" />
                      </button>

                      {openMenu === receipt.id ? (
                        <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-line-subtle dark:bg-panel">
                          {menuItems(receipt).map((item) => (
                            <button
                              key={item.label}
                              onClick={() => {
                                if (item.disabled) return;
                                item.onClick();
                                setOpenMenu(null);
                              }}
                              className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-panel-strong ${
                                item.disabled
                                  ? "opacity-60 cursor-not-allowed"
                                  : ""
                              }`}
                              aria-label={item.label}
                              aria-disabled={item.disabled}
                              type="button"
                            >
                              {item.icon}
                              <span className="text-gray-800 dark:text-slate-100">
                                {item.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {requesting ? (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-line-subtle dark:bg-panel">
            <div className="border-b border-gray-200 p-5 dark:border-line-subtle">
              <h3 className="text-lg font-bold">
                {requesting.reprint_status === "rejected"
                  ? "Request Receipt Again"
                  : "Request Receipt Reprint"}
              </h3>
              <p className="text-sm text-gray-600 dark:text-slate-300">
                Provide a short reason for this request.
              </p>
            </div>

            <div className="p-5 space-y-2">
              <label className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                Reason
              </label>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="w-full min-h-28 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-100 dark:border-line-subtle dark:bg-canvas-alt dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-brand-500/20"
                placeholder="E.g. Customer misplaced the receipt"
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 p-5 dark:border-line-subtle">
              <button
                onClick={() => {
                  setRequesting(null);
                  setReason("");
                }}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:border-line-subtle dark:bg-panel dark:text-slate-100 dark:hover:bg-panel-strong"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!reason.trim()) {
                    toast.error("Please enter a reason.");
                    return;
                  }

                  requestMutation.mutate({
                    transaction_id: requesting.id,
                    reason: reason.trim(),
                  });
                }}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-70"
                type="button"
                disabled={requestMutation.isPending}
              >
                {requestMutation.isPending ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {viewing ? (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-line-subtle dark:bg-panel">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5 dark:border-line-subtle">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Receipt Details</h3>
                <p className="text-sm text-gray-600 dark:text-slate-300">{viewing.receipt_no}</p>
              </div>
              <button
                onClick={() => setViewing(null)}
                className="text-gray-600 hover:text-gray-900 text-lg dark:text-slate-300 dark:hover:text-slate-100"
                aria-label="Close"
                type="button"
              >
                x
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-200 p-4 dark:border-line-subtle dark:bg-panel-muted">
                  <p className="text-sm text-gray-600 dark:text-slate-300">Patient</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-slate-100 mt-1">
                    {viewing.patient_name}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 dark:border-line-subtle dark:bg-panel-muted">
                  <p className="text-sm text-gray-600 dark:text-slate-300">Patient ID</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-slate-100 mt-1">
                    {viewing.patient_id}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 dark:border-line-subtle dark:bg-panel-muted">
                  <p className="text-sm text-gray-600 dark:text-slate-300">Phone</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-slate-100 mt-1">
                    {viewing.phone_number}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 dark:border-line-subtle dark:bg-panel-muted">
                  <p className="text-sm text-gray-600 dark:text-slate-300">Department</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-slate-100 mt-1">
                    {viewing.department}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 dark:border-line-subtle dark:bg-panel-muted">
                  <p className="text-sm text-gray-600 dark:text-slate-300">Amount</p>
                  <p className="mt-1 text-base font-semibold text-brand-700 dark:text-brand-300">
                    {formatCurrency(Number(viewing.amount))}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4 dark:border-line-subtle dark:bg-panel-muted">
                <p className="text-sm text-gray-600 dark:text-slate-300">Income Head</p>
                <p className="text-base font-semibold text-gray-900 dark:text-slate-100 mt-1">
                  {viewing.income_head}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4 dark:border-line-subtle dark:bg-panel-muted">
                <p className="text-sm text-gray-600 dark:text-slate-300">Bill Name</p>
                <p className="text-base font-semibold text-gray-900 dark:text-slate-100 mt-1">
                  {viewing.bill_name}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4 dark:border-line-subtle dark:bg-panel-muted">
                <p className="text-sm text-gray-600 dark:text-slate-300">Reprint Status</p>
                <p className="mt-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getReprintTone(
                      viewing.reprint_status,
                    )}`}
                  >
                    {getReprintLabel(viewing.reprint_status)}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 p-5 dark:border-line-subtle">
              <button
                onClick={() => setViewing(null)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:border-line-subtle dark:bg-panel dark:text-slate-100 dark:hover:bg-panel-strong"
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ReceiptLists;
