"use client";

import { type ChangeEvent, type FormEvent } from "react";
import { FiX } from "react-icons/fi";
import type { NewTransactionForm } from "@/libs/type";

export type NewTransactionModalProps = {
  open?: boolean;
  onClose: () => void;
  form: NewTransactionForm;
  departments: string[];
  paymentMethods: Array<NewTransactionForm["paymentMethod"]>;
  onChange: (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    name: keyof NewTransactionForm,
  ) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

function NewTransactionModal({
  open,
  onClose,
  form,
  departments,
  paymentMethods,
  onChange,
  onSubmit,
}: NewTransactionModalProps) {
  if (open === false) return null;

  return (
    <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div className="p-5 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold">Create New Transaction</h2>
          <p className="text-sm text-gray-600">Add a new patient transaction</p>
        </div>

        <button
          className="p-2 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200"
          onClick={onClose}
          aria-label="Close"
          type="button"
        >
          <FiX className="text-gray-700" />
        </button>
      </div>

      <form className="px-5 pb-5 space-y-4" onSubmit={onSubmit}>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Enter Patient Name
          </p>
          <input
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium"
            placeholder="Name"
            value={form.patient}
            type="text"
            required
            onChange={(e) => onChange(e, "patient")}
          />
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Enter Patient Phone NO
          </p>
          <input
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium"
            placeholder="Phone Number"
            value={form.phoneNo}
            type="tel"
            required
            onChange={(e) => onChange(e, "phoneNo")}
          />
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Department</p>
          <select
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium"
            value={form.department}
            onChange={(e) => onChange(e, "department")}
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Amount</p>
          <input
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium"
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
          <p className="text-sm font-medium text-gray-700 mb-2">
            Payment Method
          </p>
          <select
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium"
            value={form.paymentMethod}
            onChange={(e) => onChange(e, "paymentMethod")}
          >
            {paymentMethods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </p>
          <textarea
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium min-h-24"
            placeholder="Add any additional notes..."
            value={form.notes}
            onChange={(e) => onChange(e, "notes")}
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            className="bg-white hover:bg-gray-50 text-gray-900 font-medium px-5 py-3 rounded-xl border border-gray-200"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="bg-blue-700 hover:bg-blue-800 text-white font-medium px-5 py-3 rounded-xl"
            type="submit"
          >
            Create Transaction
          </button>
        </div>
      </form>
    </div>
  );
}

export default NewTransactionModal;
