"use client";

import { useMemo } from "react";
import { FiX } from "react-icons/fi";

type Props = {
  title: string;
  payload: unknown;
  onClose: () => void;
};

function JsonModal({ title, payload, onClose }: Props) {
  const text = useMemo(() => JSON.stringify(payload, null, 2), [payload]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5 dark:border-slate-700">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Raw payload returned by the backend.
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

        <div className="max-h-[70vh] overflow-auto p-5">
          <pre className="whitespace-pre-wrap break-words rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
            {text}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default JsonModal;
