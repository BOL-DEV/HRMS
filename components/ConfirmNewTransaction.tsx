"use client";

import type { NewTransactionForm } from "@/libs/type";
import { FiX } from "react-icons/fi";

type Props = {
  form: NewTransactionForm;
  isSubmitting?: boolean;
  onEdit: () => void;
  onConfirm: () => void;
};

export default function ConfirmNewTransaction({
  form,
  isSubmitting = false,
  onEdit,
  onConfirm,
}: Props) {
  return (
    <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
      <div className="p-5 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Confirm Transaction
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Please review the details before submitting and printing the receipt.
          </p>
        </div>

        <button
          className="p-2 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200 dark:hover:bg-slate-800 dark:hover:border-slate-700"
          onClick={onEdit}
          aria-label="Close"
          type="button"
        >
          <FiX className="text-gray-700 dark:text-slate-200" />
        </button>
      </div>

      <div className="px-5 pb-5">
        <div className="rounded-xl border border-gray-200 p-4 space-y-3 text-sm dark:border-slate-800">
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600 dark:text-slate-300">Patient</span>
            <span className="font-medium text-gray-900 dark:text-slate-100 text-right">
              {form.patientName}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600 dark:text-slate-300">Phone</span>
            <span className="font-medium text-gray-900 dark:text-slate-100 text-right">
              {form.phoneNumber}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600 dark:text-slate-300">
              Department
            </span>
            <span className="font-medium text-gray-900 dark:text-slate-100 text-right">
              {form.departmentName}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600 dark:text-slate-300">
              Bill Description
            </span>
            <span className="font-medium text-gray-900 dark:text-slate-100 text-right">
              {form.billDescription}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600 dark:text-slate-300">Amount</span>
            <span className="font-medium text-gray-900 dark:text-slate-100 text-right">
              {form.amount}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600 dark:text-slate-300">
              Payment Method
            </span>
            <span className="font-medium text-gray-900 dark:text-slate-100 text-right">
              {form.paymentType.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-end gap-3">
          <button
            className="bg-white hover:bg-gray-50 text-gray-900 font-medium px-5 py-3 rounded-xl border border-gray-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
            onClick={onEdit}
            type="button"
          >
            Edit
          </button>
          <button
            className="bg-blue-700 hover:bg-blue-800 text-white font-medium px-5 py-3 rounded-xl disabled:opacity-70"
            onClick={onConfirm}
            type="button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : "Confirm & Print Receipt"}
          </button>
        </div>
      </div>
    </div>
  );
}
