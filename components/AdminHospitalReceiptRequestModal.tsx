"use client";

import StatusPill from "@/components/StatusPill";
import { formatDateTime, formatNaira } from "@/libs/helper";
import type { AdminHospitalReceiptItem } from "@/libs/type";
import { FiX } from "react-icons/fi";

function toReceiptStatus(status: AdminHospitalReceiptItem["status"]) {
  if (status === "pending") return "Pending" as const;
  if (status === "approved") return "Approved" as const;
  return "Rejected" as const;
}

type Props = {
  receipt: AdminHospitalReceiptItem;
  isMutating?: boolean;
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
};

function AdminHospitalReceiptRequestModal({
  receipt,
  isMutating = false,
  onApprove,
  onReject,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5 dark:border-slate-700">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
              Receipt Request Details
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Review this hospital receipt reprint request
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-lg text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100"
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>

        <div className="space-y-6 p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-slate-400">Receipt No</p>
              <p className="font-semibold text-gray-900 dark:text-slate-100">
                {receipt.receipt_no}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-slate-400">Patient</p>
              <p className="font-semibold text-gray-900 dark:text-slate-100">
                {receipt.patient_name}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-slate-400">Status</p>
              <StatusPill status={toReceiptStatus(receipt.status)} />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-slate-400">Amount</p>
              <p className="font-semibold text-gray-900 dark:text-slate-100">
                {formatNaira(receipt.amount)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-slate-400">Agent</p>
              <p className="font-semibold text-gray-900 dark:text-slate-100">
                {receipt.agent_name}
              </p>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                {receipt.agent_email}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Requested At
              </p>
              <p className="font-semibold text-gray-900 dark:text-slate-100">
                {formatDateTime(receipt.requested_at)}
              </p>
            </div>
            <div className="space-y-1 md:col-span-3">
              <p className="text-sm text-gray-500 dark:text-slate-400">Reason</p>
              <p className="font-semibold text-gray-900 dark:text-slate-100">
                {receipt.reason}
              </p>
            </div>
            <div className="space-y-1 md:col-span-3">
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Action Metadata
              </p>
              <p className="text-sm text-gray-700 dark:text-slate-300">
                {receipt.action_at
                  ? `Processed ${formatDateTime(receipt.action_at)}`
                  : "Not yet processed"}
              </p>
              {receipt.action_by ? (
                <p className="text-sm text-gray-700 dark:text-slate-300">
                  {receipt.action_by.name} ({receipt.action_by.email})
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-5 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Close
            </button>
            {receipt.status === "pending" ? (
              <>
                <button
                  type="button"
                  onClick={onReject}
                  disabled={isMutating}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={onApprove}
                  disabled={isMutating}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Approve
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminHospitalReceiptRequestModal;
