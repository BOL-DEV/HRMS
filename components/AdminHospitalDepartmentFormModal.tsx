"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { FiX } from "react-icons/fi";

type Props = {
  mode: "create" | "edit";
  initialName?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
};

function AdminHospitalDepartmentFormModal({
  mode,
  initialName = "",
  isSubmitting = false,
  onClose,
  onSubmit,
}: Props) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  const title = mode === "create" ? "Create Department" : "Rename Department";
  const submitLabel = useMemo(() => {
    if (isSubmitting) {
      return mode === "create" ? "Creating..." : "Saving...";
    }

    return mode === "create" ? "Create" : "Save Changes";
  }, [isSubmitting, mode]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(name.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-line-subtle bg-panel shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-line-subtle p-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              {mode === "create"
                ? "Add a new department to this hospital."
                : "Update the department name for this hospital."}
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

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Department Name
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border border-line-subtle bg-canvas-alt px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
              placeholder="e.g. Radiology"
              required
            />
          </label>

          <div className="flex items-center justify-end gap-3 border-t border-line-subtle pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-line-subtle bg-panel px-4 py-2 text-sm font-medium text-gray-800 hover:bg-panel-muted dark:text-slate-200 dark:hover:bg-panel-strong"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminHospitalDepartmentFormModal;
