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
import { formatCurrency, formatDateTime } from "@/libs/helper";
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
  const printWindow = window.open("", "_blank", "noopener,noreferrer");

  if (!printWindow) {
    toast.error("Popup blocked. Please allow popups to print the receipt.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(receiptHTML);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
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
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden dark:bg-slate-900 dark:border-slate-800">
      <div className="p-6 border-b border-gray-200 dark:border-slate-800">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">All Receipts</h2>
        <p className="text-sm text-gray-600 dark:text-slate-300">
          Showing {totalCount} receipts
        </p>
      </div>

      <div className="p-5 overflow-x-auto">
        <table className="min-w-195 w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 bg-gray-100 dark:text-slate-300 dark:bg-slate-950">
              <th className="p-3 font-semibold">Receipt No</th>
              <th className="p-3 font-semibold">Patient</th>
              <th className="p-3 font-semibold">Phone</th>
              <th className="p-3 font-semibold">Revenue Head</th>
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
                <td className="p-4 text-gray-500 dark:text-slate-400" colSpan={9}>
                  Loading receipts...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="p-4 text-gray-500 dark:text-slate-400" colSpan={9}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((receipt) => (
                <tr key={receipt.id} className="border-b border-gray-100 dark:border-slate-800/60">
                  <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                    {receipt.receipt_no}
                  </td>
                  <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                    {receipt.patient_name}
                  </td>
                  <td className="p-3 text-gray-700 dark:text-slate-200">{receipt.phone_number}</td>
                  <td className="p-3 text-gray-700 dark:text-slate-200">{receipt.revenue_head}</td>
                  <td className="p-3 font-semibold text-blue-700 dark:text-sky-300">
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
                  <td className="p-3 text-gray-700">
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
                        className="p-2 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200 dark:hover:bg-slate-800 dark:hover:border-slate-700"
                        aria-haspopup="true"
                        aria-expanded={openMenu === receipt.id}
                        type="button"
                      >
                        <FiMoreVertical className="text-gray-700 dark:text-slate-200" />
                      </button>

                      {openMenu === receipt.id ? (
                        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 dark:bg-slate-900 dark:border-slate-700">
                          {menuItems(receipt).map((item) => (
                            <button
                              key={item.label}
                              onClick={() => {
                                if (item.disabled) return;
                                item.onClick();
                                setOpenMenu(null);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-800 ${
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
          <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-2xl dark:bg-slate-900 dark:border-slate-800">
            <div className="p-5 border-b border-gray-200 dark:border-slate-800">
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
                className="w-full min-h-28 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-sky-500/20"
                placeholder="E.g. Customer misplaced the receipt"
              />
            </div>

            <div className="p-5 border-t border-gray-200 flex items-center justify-end gap-3 dark:border-slate-800">
              <button
                onClick={() => {
                  setRequesting(null);
                  setReason("");
                }}
                className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
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
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-70"
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
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-2xl dark:bg-slate-900 dark:border-slate-800">
            <div className="p-5 border-b border-gray-200 flex items-start justify-between gap-4 dark:border-slate-800">
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
                <div className="border border-gray-200 rounded-xl p-4 dark:border-slate-800">
                  <p className="text-sm text-gray-600 dark:text-slate-300">Patient</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-slate-100 mt-1">
                    {viewing.patient_name}
                  </p>
                </div>
                <div className="border border-gray-200 rounded-xl p-4 dark:border-slate-800">
                  <p className="text-sm text-gray-600 dark:text-slate-300">Phone</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-slate-100 mt-1">
                    {viewing.phone_number}
                  </p>
                </div>
                <div className="border border-gray-200 rounded-xl p-4 dark:border-slate-800">
                  <p className="text-sm text-gray-600 dark:text-slate-300">Revenue Head</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-slate-100 mt-1">
                    {viewing.revenue_head}
                  </p>
                </div>
                <div className="border border-gray-200 rounded-xl p-4 dark:border-slate-800">
                  <p className="text-sm text-gray-600 dark:text-slate-300">Amount</p>
                  <p className="text-base font-semibold text-blue-700 dark:text-sky-300 mt-1">
                    {formatCurrency(Number(viewing.amount))}
                  </p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-4 dark:border-slate-800">
                <p className="text-sm text-gray-600 dark:text-slate-300">Bill Description</p>
                <p className="text-base font-semibold text-gray-900 dark:text-slate-100 mt-1">
                  {viewing.bill_description}
                </p>
              </div>

              <div className="border border-gray-200 rounded-xl p-4 dark:border-slate-800">
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

            <div className="p-5 border-t border-gray-200 flex items-center justify-end gap-3 dark:border-slate-800">
              <button
                onClick={() => setViewing(null)}
                className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
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
