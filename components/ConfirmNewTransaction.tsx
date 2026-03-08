"use client";

import type { NewTransactionForm } from "@/libs/type";
import { FiX } from "react-icons/fi";

type Props = {
  form: NewTransactionForm;
  onEdit: () => void;
  onConfirm: () => void;
};

export default function ConfirmNewTransaction({
  form,
  onEdit,
  onConfirm,
}: Props) {
  return (
    <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div className="p-5 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold">Confirm Transaction</h3>
          <p className="text-sm text-gray-600">
            Please review the details before submitting.
          </p>
        </div>

        <button
          className="p-2 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200"
          onClick={onEdit}
          aria-label="Close"
          type="button"
        >
          <FiX className="text-gray-700" />
        </button>
      </div>

      <div className="px-5 pb-5">
        <div className="rounded-xl border border-gray-200 p-4 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600">Patient</span>
            <span className="font-medium text-gray-900 text-right">
              {form.patient}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600">Phone</span>
            <span className="font-medium text-gray-900 text-right">
              {form.phoneNo}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600">Department</span>
            <span className="font-medium text-gray-900 text-right">
              {form.department}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600">Amount</span>
            <span className="font-medium text-gray-900 text-right">
              {form.amount}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600">Payment Method</span>
            <span className="font-medium text-gray-900 text-right">
              {form.paymentMethod}
            </span>
          </div>
          {form.notes?.trim() ? (
            <div className="pt-2 border-t border-gray-200">
              <div className="text-gray-600 mb-1">Notes</div>
              <div className="font-medium text-gray-900 whitespace-pre-wrap">
                {form.notes}
              </div>
            </div>
          ) : null}
        </div>

        <div className="pt-4 flex items-center justify-end gap-3">
          <button
            className="bg-white hover:bg-gray-50 text-gray-900 font-medium px-5 py-3 rounded-xl border border-gray-200"
            onClick={onEdit}
            type="button"
          >
            Edit
          </button>
          <button
            className="bg-blue-700 hover:bg-blue-800 text-white font-medium px-5 py-3 rounded-xl"
            onClick={onConfirm}
            type="button"
          >
            Confirm & Submit
          </button>
        </div>
      </div>
    </div>
  );
}
