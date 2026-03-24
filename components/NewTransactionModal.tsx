"use client";

import { type ChangeEvent, type FormEvent } from "react";
import { FiX } from "react-icons/fi";
import type { NewTransactionForm } from "@/libs/type";

export type NewTransactionModalProps = {
  open?: boolean;
  onClose: () => void;
  form: NewTransactionForm;
  departments: Array<{ id: string; name: string }>;
  paymentMethods: Array<NewTransactionForm["paymentType"]>;
  onChange: (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    name: keyof NewTransactionForm,
  ) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoadingDepartments?: boolean;
  isSubmitting?: boolean;
};

function NewTransactionModal({
  open,
  onClose,
  form,
  departments,
  paymentMethods,
  onChange,
  onSubmit,
  isLoadingDepartments = false,
  isSubmitting = false,
}: NewTransactionModalProps) {
  if (open === false) return null;

  return (
    <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
      <div className="p-5 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Create New Transaction
          </h2>
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Add a new patient transaction
          </p>
        </div>

        <button
          className="p-2 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200 dark:hover:bg-slate-800 dark:hover:border-slate-700"
          onClick={onClose}
          aria-label="Close"
          type="button"
        >
          <FiX className="text-gray-700 dark:text-slate-200" />
        </button>
      </div>

      <form className="px-5 pb-5 space-y-4" onSubmit={onSubmit}>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2 dark:text-slate-200">
            Enter Patient Name
          </p>
          <input
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            placeholder="Name"
            value={form.patientName}
            type="text"
            required
            onChange={(e) => onChange(e, "patientName")}
          />
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2 dark:text-slate-200">
            Enter Patient Phone NO
          </p>
          <input
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            placeholder="Phone Number"
            value={form.phoneNumber}
            type="tel"
            pattern="[0-9]{10,15}"
            required
            onChange={(e) => onChange(e, "phoneNumber")}
          />
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2 dark:text-slate-200">
            Department
          </p>
          <select
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
            value={form.departmentId}
            onChange={(e) => onChange(e, "departmentId")}
            disabled={isLoadingDepartments}
            required
          >
            <option value="">
              {isLoadingDepartments
                ? "Loading departments..."
                : "Select department"}
            </option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2 dark:text-slate-200">
            Bill Description
          </p>
          <input
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            placeholder="What is the patient paying for?"
            value={form.billDescription}
            type="text"
            required
            onChange={(e) => onChange(e, "billDescription")}
          />
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2 dark:text-slate-200">
            Amount
          </p>
          <input
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            placeholder="0.00"
            value={form.amount}
            type="number"
            min={0.01}
            step={0.01}
            required
            onChange={(e) => onChange(e, "amount")}
            inputMode="decimal"
          />
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2 dark:text-slate-200">
            Payment Method
          </p>
          <select
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
            value={form.paymentType}
            onChange={(e) => onChange(e, "paymentType")}
          >
            {paymentMethods.map((m) => (
              <option key={m} value={m}>
                {m.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            className="bg-white hover:bg-gray-50 text-gray-900 font-medium px-5 py-3 rounded-xl border border-gray-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="bg-blue-700 hover:bg-blue-800 text-white font-medium px-5 py-3 rounded-xl disabled:opacity-70"
            type="submit"
            disabled={isSubmitting || isLoadingDepartments}
          >
            {isSubmitting ? "Processing..." : "Create Transaction"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default NewTransactionModal;
