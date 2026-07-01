"use client";

import { FiAlertTriangle, FiX } from "react-icons/fi";

type Props = {
  title: string;
  message: string;
  confirmLabel?: string;
  isConfirming?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function AdminConfirmDeleteModal({
  title,
  message,
  confirmLabel = "Delete",
  isConfirming = false,
  onClose,
  onConfirm,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-line-subtle bg-panel shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-line-subtle p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-red-100 p-2 text-red-600 dark:bg-red-500/10 dark:text-red-300">
              <FiAlertTriangle />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                {title}
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                {message}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-lg text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100"
            aria-label="Close confirmation"
          >
            <FiX />
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 p-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line-subtle bg-panel px-4 py-2 text-sm font-medium text-gray-800 hover:bg-panel-muted dark:text-slate-200 dark:hover:bg-panel-strong"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isConfirming ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminConfirmDeleteModal;
