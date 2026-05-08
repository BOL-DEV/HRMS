"use client";

import { FormEvent, useMemo, useState } from "react";
import { FiX } from "react-icons/fi";

type Option = {
  id: string;
  name: string;
};

type Props = {
  mode: "create" | "edit";
  departmentOptions: Option[];
  incomeHeadOptions: Option[];
  initialValues?: {
    departmentId: string;
    incomeHeadId: string;
    name: string;
    amount: string;
    status: "active" | "inactive";
  };
  isSubmitting?: boolean;
  onClose: () => void;
  onDepartmentChange?: (departmentId: string) => void;
  onSubmit: (values: {
    departmentId: string;
    incomeHeadId: string;
    name: string;
    amount: string;
    status: "active" | "inactive";
  }) => void;
};

const defaultValues = {
  departmentId: "",
  incomeHeadId: "",
  name: "",
  amount: "",
  status: "active" as const,
};

function AdminHospitalBillItemFormModal({
  mode,
  departmentOptions,
  incomeHeadOptions,
  initialValues,
  isSubmitting = false,
  onClose,
  onDepartmentChange,
  onSubmit,
}: Props) {
  const [form, setForm] = useState(initialValues ?? defaultValues);

  const title = mode === "create" ? "Create Bill Item" : "Edit Bill Item";
  const submitLabel = useMemo(() => {
    if (isSubmitting) {
      return mode === "create" ? "Creating..." : "Saving...";
    }

    return mode === "create" ? "Create Bill Item" : "Save Changes";
  }, [isSubmitting, mode]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      departmentId: form.departmentId,
      incomeHeadId: form.incomeHeadId,
      name: form.name.trim(),
      amount: form.amount.trim(),
      status: form.status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-line-subtle bg-panel shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-line-subtle p-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Manage hospital bill items tied to departments and income heads.
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
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Department
              </span>
              <select
                value={form.departmentId}
                onChange={(event) => {
                  const departmentId = event.target.value;
                  setForm((current) => ({
                    ...current,
                    departmentId,
                    incomeHeadId: "",
                  }));
                  onDepartmentChange?.(departmentId);
                }}
                className="w-full rounded-lg border border-line-subtle bg-canvas-alt px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
                required
              >
                <option value="">Select department</option>
                {departmentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Income Head
              </span>
              <select
                value={form.incomeHeadId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    incomeHeadId: event.target.value,
                  }))
                }
                disabled={!form.departmentId}
                className="w-full rounded-lg border border-line-subtle bg-canvas-alt px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-panel-muted dark:text-slate-100"
                required
              >
                <option value="">
                  {form.departmentId
                    ? "Select income head"
                    : "Select department first"}
                </option>
                {incomeHeadOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Bill Item Name
              </span>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-line-subtle bg-canvas-alt px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
                placeholder="Chest X-Ray"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Amount
              </span>
              <input
                value={form.amount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-line-subtle bg-canvas-alt px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
                placeholder="6500"
                inputMode="decimal"
                required
              />
            </label>
          </div>

          {mode === "edit" ? (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Status
              </span>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as "active" | "inactive",
                  }))
                }
                className="w-full rounded-lg border border-line-subtle bg-canvas-alt px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          ) : null}

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

export default AdminHospitalBillItemFormModal;
