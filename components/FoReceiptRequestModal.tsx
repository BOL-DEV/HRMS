"use client";

import StatusPill from "@/components/StatusPill";
import { formatNaira } from "@/libs/helper";
import type { FoReceiptItem } from "@/libs/type";
import { toReceiptStatus } from "@/components/FoReceiptsTable";

type Props = {
  receipt: FoReceiptItem;
  isMutating?: boolean;
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
};

function FoReceiptRequestModal({
  receipt,
  isMutating = false,
  onApprove,
  onReject,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-line-subtle dark:bg-panel">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5 dark:border-line-subtle">
          <div>
            <h3 className="text-lg font-bold dark:text-slate-100">
              Receipt Request
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Receipt No: {receipt.receipt_no}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-lg text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100"
            aria-label="Close"
            type="button"
          >
            x
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 p-4 dark:border-line-subtle dark:bg-panel-muted">
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Patient
              </p>
              <p className="mt-1 text-base font-semibold text-gray-900 dark:text-slate-100">
                {receipt.patient_name}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4 dark:border-line-subtle dark:bg-panel-muted">
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Amount
              </p>
              <p className="mt-1 text-base font-semibold text-gray-900 dark:text-slate-100">
                {formatNaira(receipt.amount)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 p-4 dark:border-line-subtle dark:bg-panel-muted">
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Agent Email
              </p>
              <p className="mt-1 text-base font-semibold text-gray-900 dark:text-slate-100">
                {receipt.agent_email}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4 dark:border-line-subtle dark:bg-panel-muted">
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Status
              </p>
              <div className="mt-2">
                <StatusPill status={toReceiptStatus(receipt.status)} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4 dark:border-line-subtle dark:bg-panel-muted">
            <p className="text-sm text-gray-600 dark:text-slate-400">Reason</p>
            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-slate-100">
              {receipt.reason}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 p-5 dark:border-line-subtle">
          {receipt.status === "pending" ? (
            <>
              <button
                onClick={onReject}
                disabled={isMutating}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-line-subtle dark:bg-panel dark:text-slate-200 dark:hover:bg-panel-strong"
                type="button"
              >
                Reject
              </button>
              <button
                onClick={onApprove}
                disabled={isMutating}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
              >
                Approve
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:border-line-subtle dark:bg-panel dark:text-slate-200 dark:hover:bg-panel-strong"
              type="button"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default FoReceiptRequestModal;
