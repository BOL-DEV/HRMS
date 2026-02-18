"use client";

import React, { useMemo, useState } from "react";
import { FiX } from "react-icons/fi";

interface Props {
  open: boolean;
  onClose: () => void;
}

function NewTransactionModal({ open, onClose }: Props) {
  const patients = useMemo(
    () => [
      "John Anderson",
      "Sarah Mitchell",
      "Robert Chen",
      "Emma Wilson",
      "Michael Brown",
    ],
    [],
  );

  const revenueHeads = useMemo(
    () => ["Consultation", "Lab Test", "Admission", "Scan", "Drugs"],
    [],
  );

  const departments = useMemo(
    () => ["General Medicine", "Pathology", "Surgery", "Radiology", "Pharmacy"],
    [],
  );

  const paymentMethods = useMemo(() => ["Cash", "Transfer", "POS"], []);
  const statuses = useMemo(() => ["Pending", "Paid", "Refunded"], []);

  const [form, setForm] = useState({
    patient: "",
    revenueHead: "Consultation",
    department: "General Medicine",
    amount: "",
    paymentMethod: "Cash",
    status: "Pending",
    notes: "",
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="p-5 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold">Create New Transaction</h2>
              <p className="text-sm text-gray-600">
                Add a new patient transaction
              </p>
            </div>

            <button
              className="p-2 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200"
              onClick={onClose}
            >
              <FiX className="text-gray-700" />
            </button>
          </div>

          <div className="px-5 pb-5 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Select Patient
              </p>
              <select
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium"
                value={form.patient}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, patient: e.target.value }))
                }
              >
                <option value="">Choose a patient</option>
                {patients.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Revenue Head
              </p>
              <select
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium"
                value={form.revenueHead}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, revenueHead: e.target.value }))
                }
              >
                {revenueHeads.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Department
              </p>
              <select
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium"
                value={form.department}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, department: e.target.value }))
                }
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
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, amount: e.target.value }))
                }
              />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </p>
              <select
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium"
                value={form.paymentMethod}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    paymentMethod: e.target.value,
                  }))
                }
              >
                {paymentMethods.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Status</p>
              <select
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium"
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, status: e.target.value }))
                }
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
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
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                className="bg-white hover:bg-gray-50 text-gray-900 font-medium px-5 py-3 rounded-xl border border-gray-200"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="bg-blue-700 hover:bg-blue-800 text-white font-medium px-5 py-3 rounded-xl"
                onClick={onClose}
              >
                Create Transaction
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewTransactionModal;
