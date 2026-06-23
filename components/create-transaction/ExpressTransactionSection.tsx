"use client";

import { formatCurrency } from "@/libs/helper";
import { sanitizeAmountInput, sanitizePhoneNumber } from "@/components/create-transaction/helpers";
import TransactionSectionCard from "@/components/create-transaction/TransactionSectionCard";
import type { NewTransactionForm } from "@/libs/type";
import type { ExpressTransactionSectionProps } from "@/components/create-transaction/types";

function ExpressTransactionSection({
  departments,
  departmentsError,
  expressForm,
  setExpressForm,
  expressStepReady,
  isSubmitting,
  onSubmit,
  onCancel,
}: ExpressTransactionSectionProps) {
  const selectedDepartment = departments.find(
    (department) => department.id === expressForm.departmentId,
  );

  return (
    <div className="grid gap-6 p-6 xl:grid-cols-[1.05fr_0.75fr]">
      <div className="min-w-0 space-y-5">
        {departmentsError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
            {departmentsError}
          </div>
        ) : null}

        <TransactionSectionCard
          eyebrow="Express"
          title="Walk-in Payment"
          subtitle="No patient lookup needed. Add the customer details, department, service, amount, and payment type."
          ready={expressStepReady}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                Department
              </span>
              <select
                value={expressForm.departmentId}
                onChange={(event) =>
                  setExpressForm((current) => ({
                    ...current,
                    departmentId: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-line-subtle dark:bg-canvas dark:text-slate-100"
              >
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                Customer Name
              </span>
              <input
                value={expressForm.fullName}
                onChange={(event) =>
                  setExpressForm((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-line-subtle dark:bg-canvas dark:text-slate-100"
                placeholder="John Doe"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                Phone Number
              </span>
              <input
                value={expressForm.phoneNumber}
                onChange={(event) =>
                  setExpressForm((current) => ({
                    ...current,
                    phoneNumber: sanitizePhoneNumber(event.target.value),
                  }))
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-line-subtle dark:bg-canvas dark:text-slate-100"
                placeholder="08012345678"
                inputMode="tel"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                Payment Type
              </span>
              <select
                value={expressForm.paymentType}
                onChange={(event) =>
                  setExpressForm((current) => ({
                    ...current,
                    paymentType: event.target.value as NewTransactionForm["paymentType"],
                  }))
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-line-subtle dark:bg-canvas dark:text-slate-100"
              >
                <option value="cash">Cash</option>
                <option value="transfer">Transfer</option>
                <option value="pos">POS</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                Service
              </span>
              <input
                value={expressForm.service}
                onChange={(event) =>
                  setExpressForm((current) => ({
                    ...current,
                    service: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-line-subtle dark:bg-canvas dark:text-slate-100"
                placeholder="Consultation fee"
              />
            </label>
          </div>

          <div className="mt-4">
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                Amount
              </span>
              <input
                value={expressForm.amount}
                onChange={(event) =>
                  setExpressForm((current) => ({
                    ...current,
                    amount: sanitizeAmountInput(event.target.value),
                  }))
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-line-subtle dark:bg-canvas dark:text-slate-100"
                placeholder="5000"
                inputMode="decimal"
              />
            </label>
          </div>

          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            The backend now generates the receipt HTML, so printing uses the
            server response directly.
          </p>
        </TransactionSectionCard>
      </div>

      <aside className="self-start space-y-5 xl:sticky xl:top-6">
        <TransactionSectionCard title="Express Preview" ready={expressStepReady}>
          <dl className="space-y-3 text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-gray-600 dark:text-slate-300">Department</dt>
              <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                {selectedDepartment?.name || "Not set"}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-gray-600 dark:text-slate-300">Customer</dt>
              <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                {expressForm.fullName || "Not set"}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-gray-600 dark:text-slate-300">Phone</dt>
              <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                {expressForm.phoneNumber || "Not set"}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-gray-600 dark:text-slate-300">Service</dt>
              <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                {expressForm.service || "Not set"}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-gray-600 dark:text-slate-300">Payment Type</dt>
              <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                {expressForm.paymentType.toUpperCase()}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-gray-600 dark:text-slate-300">Total</dt>
              <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                {formatCurrency(Number(expressForm.amount || 0))}
              </dd>
            </div>
          </dl>
        </TransactionSectionCard>

        <div className="flex flex-col gap-3">
          <button
            onClick={onSubmit}
            type="button"
            disabled={!expressStepReady || isSubmitting}
            className="rounded-2xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Processing payment..." : "Process Payment & Print"}
          </button>

          <button
            onClick={onCancel}
            type="button"
            className="rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-gray-50 dark:border-line-subtle dark:text-slate-100 dark:hover:bg-panel-strong"
          >
            Cancel
          </button>
        </div>
      </aside>
    </div>
  );
}

export default ExpressTransactionSection;
