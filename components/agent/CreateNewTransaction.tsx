"use client";

import {
  FiCheckCircle,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { formatCurrency } from "@/libs/helper";
import type {
  AgentBillItem,
  AgentIncomeHead,
  NewTransactionForm,
} from "@/libs/type";
import ExpressTransactionSection from "@/components/create-transaction/ExpressTransactionSection";
import TransactionModeToggle from "@/components/create-transaction/TransactionModeToggle";
import {
  sanitizeAmountInput,
  sanitizePhoneNumber,
  sanitizeQuantityInput,
} from "@/components/create-transaction/helpers";
import { useCreateTransactionState } from "@/components/create-transaction/useCreateTransactionState";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => unknown | Promise<unknown>;
}

function CreateNewTransaction({ open, onClose, onSuccess }: Props) {
  const {
    transactionMode,
    form,
    setForm,
    expressForm,
    setExpressForm,
    selectedBillItems,
    selectedManualItems,
    billSearch,
    setBillSearch,
    showBillItemList,
    setShowBillItemList,
    patientSearchInput,
    setPatientSearchInput,
    showPatientSuggestions,
    setShowPatientSuggestions,
    billItemFieldRef,
    patientFieldRef,
    paymentMode,
    isExpressMode,
    departments,
    incomeHeads,
    billItems,
    patientSuggestions,
    totalAmount,
    patientLookupMutation,
    paymentMutation,
    expressPaymentMutation,
    switchTransactionMode,
    handlePatientSuggestionSelect,
    handleDepartmentChange,
    handleIncomeHeadChange,
    handleBillItemChange,
    handleAddItem,
    removeAutomaticItem,
    removeManualItem,
    handleSubmit,
    closeModal,
    patientStepReady,
    paymentStepReady,
    expressStepReady,
    configError,
    departmentsError,
    incomeHeadsError,
    billItemsError,
    patientSearchError,
    paymentConfigQuery,
    departmentsQuery,
    incomeHeadsQuery,
    billItemsQuery,
    patientSearchQuery,
    pharmacyCode,
    setPharmacyCode,
    pharmacyBill,
    isSearchingPharmacyCode,
    handlePharmacyCodeLookup,
    isPharmacyMode,
    showPharmacyOption,
  } = useCreateTransactionState({ open, onClose, onSuccess });

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/55"
        onClick={closeModal}
        aria-hidden="true"
      />

      <div
        className="absolute inset-0 overflow-y-auto p-4 sm:p-6"
        onClick={closeModal}
      >
        <div
          className="mx-auto my-6 w-full max-w-5xl rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-line-subtle dark:bg-panel"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-6 dark:border-line-subtle">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Process Payment
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
                Add one or more bill items, confirm the total, and print both
                the customer and audit copies after payment.
              </p>
            </div>

            <button
              className="rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 dark:border-line-subtle dark:text-slate-300 dark:hover:bg-panel-strong"
              onClick={closeModal}
              type="button"
              aria-label="Close"
            >
              <FiX />
            </button>
          </div>

          <div className="px-6 pt-6">
            <TransactionModeToggle
              value={transactionMode}
              onChange={switchTransactionMode}
              showPharmacy={showPharmacyOption}
            />
          </div>

          {isPharmacyMode ? (
            <div className="p-6 space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
                  Pharmacy Request Payment
                </h3>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <label className="flex-1 block">
                    <span className="mb-2 block text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                      Billing Code
                    </span>
                    <input
                      type="text"
                      value={pharmacyCode}
                      onChange={(e) => setPharmacyCode(e.target.value)}
                      placeholder="Enter 8-char code (e.g. EL3DZ671)"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-canvas dark:text-white"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={isSearchingPharmacyCode}
                    onClick={() => handlePharmacyCodeLookup(pharmacyCode)}
                    className="rounded-xl bg-slate-900 dark:bg-slate-800 px-5 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isSearchingPharmacyCode ? "Searching..." : "Lookup by Billing Code"}
                  </button>
                </div>
              </div>

              {pharmacyBill ? (
                <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr] animate-fade-in-slide">
                  {/* Bill Details */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 space-y-4">
                    <h4 className="text-base font-bold text-slate-950 dark:text-white">
                      Prescription Details
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2 text-sm text-slate-600 dark:text-slate-300">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Patient Name</p>
                        <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{pharmacyBill.patientName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Patient ID</p>
                        <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{pharmacyBill.patientId}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Phone Number</p>
                        <p className="font-semibold text-slate-950 dark:text-white mt-0.5">{pharmacyBill.phoneNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Department</p>
                        <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{pharmacyBill.departmentName}</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4 dark:border-slate-800">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Requested Items</p>
                      <div className="space-y-2">
                        {pharmacyBill.items.length > 0 ? (
                          pharmacyBill.items.map((it) => (
                            <div key={it.drugId || it.name} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 dark:border-slate-800">
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white">{it.name}</p>
                                <p className="text-xs text-gray-500">{it.quantity} x {formatCurrency(it.unitPrice)}</p>
                              </div>
                              <span className="font-bold text-slate-950 dark:text-white">{formatCurrency(it.amount)}</span>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-xl border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400">
                            Item details were not included in this lookup. Confirm the total before clearing.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Clearing Selection */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 flex flex-col justify-between">
                    <div className="space-y-4">
                      <h4 className="text-base font-bold text-slate-950 dark:text-white">
                        Collect Payment
                      </h4>
                      <label className="space-y-2 block">
                        <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                          Payment Type
                        </span>
                        <select
                          value={form.paymentType}
                          onChange={(event) =>
                            setForm((current) => ({
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

                      <div className="border-t border-gray-100 pt-4 dark:border-slate-800">
                        <div className="flex justify-between items-center text-lg font-bold text-slate-950 dark:text-white">
                          <span>Total Amount</span>
                          <span className="text-brand-700 dark:text-brand-400">
                            {formatCurrency(pharmacyBill.totalAmount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-6">
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={paymentMutation.isPending}
                        className="w-full rounded-xl bg-brand-700 py-3.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
                      >
                        {paymentMutation.isPending ? "Clearing..." : "Clear Bill & Print Receipt"}
                      </button>
                      <button
                        type="button"
                        onClick={closeModal}
                        className="w-full rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : isExpressMode ? (
            <ExpressTransactionSection
              departments={departments}
              departmentsError={configError ?? departmentsError}
              expressForm={expressForm}
              setExpressForm={setExpressForm}
              expressStepReady={expressStepReady}
              isSubmitting={expressPaymentMutation.isPending}
              onSubmit={handleSubmit}
              onCancel={closeModal}
            />
          ) : (
          <div className="grid gap-6 p-6 xl:grid-cols-[1.4fr_0.9fr]">
            <div className="min-w-0 space-y-5">
              {configError ||
              departmentsError ||
              incomeHeadsError ||
              billItemsError ||
              patientSearchError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
                  {configError ??
                    departmentsError ??
                    incomeHeadsError ??
                    billItemsError ??
                    patientSearchError}
                </div>
              ) : null}

              <section className="rounded-2xl border border-gray-200 p-5 dark:border-line-subtle dark:bg-panel-muted/35">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                      Step 1
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Patient
                    </h3>
                  </div>

                  {patientStepReady ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                      <FiCheckCircle />
                      Ready
                    </span>
                  ) : null}
                </div>

                <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
                  If the patient is not found, enter name and phone manually.
                </p>

                <div className="mt-4" ref={patientFieldRef}>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                      Patient ID
                    </span>
                    <div className="relative">
                      <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <FiSearch />
                      </div>
                      <input
                        value={patientSearchInput}
                        onChange={(event) => {
                          const value = event.target.value;
                          const digitsOnly = value.replace(/\D/g, "");

                          setPatientSearchInput(value);
                          setShowPatientSuggestions(true);
                          setForm((current) => ({
                            ...current,
                            patientId: digitsOnly,
                            patientExists: false,
                            patientName: current.patientName,
                            phoneNumber: current.phoneNumber,
                          }));
                        }}
                        className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm dark:border-line-subtle dark:bg-canvas dark:text-slate-100"
                        placeholder="Enter patient ID"
                      />

                      {patientSearchInput.trim() && showPatientSuggestions ? (
                        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-line-subtle dark:bg-panel">
                          <div className="max-h-72 overflow-y-auto p-3">
                            {patientSearchQuery.isLoading ? (
                              <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-line-subtle dark:text-slate-400">
                                Searching patients...
                              </div>
                            ) : patientSuggestions.length === 0 ? (
                              <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-line-subtle dark:text-slate-400">
                                No patients matched this search.
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {patientSuggestions.map((patient) => {
                                  const isSelected =
                                    patient.patient_id === form.patientId &&
                                    form.patientExists;

                                  return (
                                    <button
                                      key={patient.id}
                                      type="button"
                                      onClick={() =>
                                        handlePatientSuggestionSelect(patient)
                                      }
                                      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                                        isSelected
                                          ? "border-brand-300 bg-brand-50 dark:border-brand-800 dark:bg-brand-950/20"
                                          : "border-gray-200 bg-white hover:border-slate-300 hover:bg-gray-50 dark:border-line-subtle dark:bg-panel dark:hover:border-line-strong dark:hover:bg-panel-strong"
                                      }`}
                                    >
                                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                                        {patient.display_value}
                                      </p>
                                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                        {patient.phone_number}
                                      </p>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </label>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    If no match appears, the details you entered will stay in
                    place.
                  </p>
                </div>

                {patientLookupMutation.isPending ? (
                  <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <FiRefreshCw className="animate-spin" />
                    Checking patient ID...
                  </div>
                ) : null}

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                      Patient Name
                    </span>
                    <input
                      value={form.patientName}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          patientName: event.target.value,
                        }))
                      }
                      disabled={form.patientExists}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-line-subtle dark:bg-canvas dark:text-slate-100 dark:disabled:bg-panel-strong"
                      placeholder="John Doe"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                      Phone Number
                    </span>
                    <input
                      value={form.phoneNumber}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          phoneNumber: sanitizePhoneNumber(event.target.value),
                        }))
                      }
                      maxLength={11}
                      disabled={form.patientExists}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-line-subtle dark:bg-canvas dark:text-slate-100 dark:disabled:bg-panel-strong"
                      placeholder="08012345678"
                      inputMode="tel"
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-200 p-5 dark:border-line-subtle dark:bg-panel-muted/35">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                      Step 2
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Payment Details
                    </h3>
                  </div>

                  {paymentStepReady ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                      <FiCheckCircle />
                      Ready
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                      Department
                    </span>
                    <select
                      value={form.departmentId}
                      onChange={(event) =>
                        handleDepartmentChange(event.target.value)
                      }
                      disabled={departmentsQuery.isLoading}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-line-subtle dark:bg-canvas dark:text-slate-100"
                    >
                      <option value="">
                        {departmentsQuery.isLoading
                          ? "Loading departments..."
                          : "Select department"}
                      </option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                      Payment Type
                    </span>
                    <select
                      value={form.paymentType}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          paymentType: event.target
                            .value as NewTransactionForm["paymentType"],
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-line-subtle dark:bg-canvas dark:text-slate-100"
                    >
                      <option value="cash">Cash</option>
                      <option value="transfer">Transfer</option>
                      <option value="pos">POS</option>
                    </select>
                  </label>
                </div>

                <div
                  className={`mt-4 grid gap-4 ${paymentMode === "manual" ? "md:grid-cols-2" : ""}`}
                >
                  {paymentMode === "manual" ? (
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                        Income Head
                      </span>
                      <select
                        value={form.incomeHeadId}
                        onChange={(event) =>
                          handleIncomeHeadChange(event.target.value)
                        }
                        disabled={
                          !form.departmentId || incomeHeadsQuery.isLoading
                        }
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-line-subtle dark:bg-canvas dark:text-slate-100"
                      >
                        <option value="">
                          {!form.departmentId
                            ? "Select department first"
                            : incomeHeadsQuery.isLoading
                              ? "Loading income heads..."
                              : "Select income head"}
                        </option>
                        {incomeHeads.map((incomeHead: AgentIncomeHead) => (
                          <option key={incomeHead.id} value={incomeHead.id}>
                            {incomeHead.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}

                  {paymentMode === "automatic" ? (
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                        Bill Item
                      </span>

                      <div className="relative" ref={billItemFieldRef}>
                        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <FiSearch />
                        </div>

                        <input
                          value={billSearch}
                          onChange={(event) => {
                            const value = event.target.value;
                            setBillSearch(value);
                            setShowBillItemList(true);

                            if (!value.trim()) {
                              setForm((current) => ({
                                ...current,
                                billItemId: "",
                                billItemName: "",
                                billItemQuantity: "1",
                                billItemUnitAmount: "",
                                billName: "",
                                amount: "",
                              }));
                            }
                          }}
                          onFocus={() => setShowBillItemList(true)}
                          disabled={!form.departmentId}
                          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm dark:border-line-subtle dark:bg-canvas dark:text-slate-100 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-panel-strong"
                          placeholder={
                            form.departmentId
                              ? "Search and select a bill item"
                              : "Select department first"
                          }
                        />

                        {form.departmentId && showBillItemList ? (
                          <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-line-subtle dark:bg-panel">
                            <div className="max-h-72 overflow-y-auto p-3">
                              {billItemsQuery.isLoading ? (
                                <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-line-subtle dark:text-slate-400">
                                  Loading bill items...
                                </div>
                              ) : billItems.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-line-subtle dark:text-slate-400">
                                  No bill items matched this search.
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {billItems.map((billItem: AgentBillItem) => {
                                    const isSelected =
                                      billItem.bill_item_id === form.billItemId;
                                    const isAdded = selectedBillItems.some(
                                      (item) =>
                                        item.billItemId ===
                                        billItem.bill_item_id,
                                    );

                                    return (
                                      <button
                                        key={billItem.bill_item_id}
                                        type="button"
                                        onClick={() =>
                                          handleBillItemChange(billItem)
                                        }
                                        className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                                          isSelected
                                            ? "border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-950/22"
                                            : "border-gray-200 bg-white hover:border-slate-300 hover:bg-gray-50 dark:border-line-subtle dark:bg-panel dark:hover:border-line-strong dark:hover:bg-panel-strong"
                                        }`}
                                      >
                                        <div className="flex items-start justify-between gap-4">
                                          <div>
                                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                                              {billItem.name}
                                            </p>
                                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                              {billItem.income_head_name}
                                            </p>
                                          </div>

                                          <div className="text-right">
                                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                                              {formatCurrency(billItem.amount)}
                                            </p>
                                            {isAdded ? (
                                              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                                                Added
                                              </p>
                                            ) : isSelected ? (
                                              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
                                                Selected
                                              </p>
                                            ) : null}
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </label>
                  ) : (
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                        Bill Name
                      </span>
                      <input
                        value={form.billName}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            billName: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-line-subtle dark:bg-canvas dark:text-slate-100"
                        placeholder="X-Ray payment"
                      />
                    </label>
                  )}
                </div>

                {paymentMode === "automatic" ? (
                  <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-line-subtle dark:bg-canvas/70">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Search across the selected department, then choose the
                      quantity before adding the bill item.
                    </p>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="block space-y-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                          Quantity
                        </span>
                        <input
                          value={form.billItemQuantity}
                          onChange={(event) => {
                            const quantityValue = sanitizeQuantityInput(
                              event.target.value,
                            );

                            setForm((current) => {
                              const parsedQuantity = Number(
                                quantityValue || "0",
                              );
                              const unitAmount = Number(
                                current.billItemUnitAmount || current.amount,
                              );

                              return {
                                ...current,
                                billItemQuantity: quantityValue,
                                amount:
                                  Number.isFinite(unitAmount) &&
                                  unitAmount > 0 &&
                                  Number.isInteger(parsedQuantity) &&
                                  parsedQuantity > 0
                                    ? String(unitAmount * parsedQuantity)
                                    : current.amount,
                              };
                            });
                          }}
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-line-subtle dark:bg-canvas dark:text-slate-100"
                          placeholder="1"
                          inputMode="numeric"
                        />
                      </label>

                      <label className="block space-y-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                          Amount
                        </span>
                        <input
                          value={form.amount}
                          readOnly
                          className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm dark:border-line-subtle dark:bg-panel-strong dark:text-slate-100"
                          placeholder="Auto-filled from selected bill item"
                        />
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddItem}
                      disabled={!form.billItemId || !form.billItemQuantity.trim()}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-700/60 dark:bg-brand-950/20 dark:text-brand-300"
                    >
                      <FiPlus />
                      Add Item
                    </button>
                  </div>
                ) : (
                  <div className="mt-4">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                        Amount
                      </span>
                      <input
                        value={form.amount}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            amount: sanitizeAmountInput(event.target.value),
                          }))
                        }
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-line-subtle dark:bg-canvas dark:text-slate-100"
                        placeholder="5000"
                        inputMode="decimal"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleAddItem}
                      disabled={
                        !form.incomeHeadId ||
                        !form.billName.trim() ||
                        !form.amount.trim()
                      }
                      className="mt-4 inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-700/60 dark:bg-brand-950/20 dark:text-brand-300"
                    >
                      <FiPlus />
                      Add Item
                    </button>
                  </div>
                )}

                <div className="mt-5 rounded-2xl border border-gray-200 bg-white/80 p-4 dark:border-line-subtle dark:bg-panel/70">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Added Items
                      </h4>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Review the bill list before processing payment.
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">
                      Total: {formatCurrency(totalAmount)}
                    </p>
                  </div>

                  <div className="mt-4 space-y-3">
                    {paymentMode === "automatic" ? (
                      selectedBillItems.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 dark:border-line-subtle dark:text-slate-400">
                          No bill items added yet.
                        </div>
                      ) : (
                        selectedBillItems.map((item) => (
                          <div
                            key={item.billItemId}
                            className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 px-4 py-3 dark:border-line-subtle animate-fade-in-slide"
                          >
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">
                                {item.billItemName}
                              </p>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                              {item.incomeHeadName}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              Qty {item.quantity} x {formatCurrency(item.unitAmount)}
                            </p>
                          </div>
                            <div className="flex items-center gap-3">
                              <p className="font-semibold text-slate-900 dark:text-slate-100">
                                {formatCurrency(item.amount)}
                              </p>
                              <button
                                type="button"
                                onClick={() =>
                                  removeAutomaticItem(item.billItemId)
                                }
                                className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-950/30"
                                aria-label={`Remove ${item.billItemName}`}
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </div>
                        ))
                      )
                    ) : selectedManualItems.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 dark:border-line-subtle dark:text-slate-400">
                        No manual items added yet.
                      </div>
                    ) : (
                      selectedManualItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 px-4 py-3 dark:border-line-subtle animate-fade-in-slide"
                        >
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {item.billName}
                            </p>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                              {item.incomeHeadName}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {formatCurrency(item.amount)}
                            </p>
                            <button
                              type="button"
                              onClick={() => removeManualItem(item.id)}
                              className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-950/30"
                              aria-label={`Remove ${item.billName}`}
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>
            </div>

            <aside className="self-start space-y-5 xl:sticky xl:top-6">
              <section className="rounded-2xl border border-gray-200 p-5 dark:border-line-subtle dark:bg-panel-muted/35">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Submission Preview
                </h3>

                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-gray-600 dark:text-slate-300">
                      Patient ID
                    </dt>
                    <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                      {form.patientId || "Not set"}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-gray-600 dark:text-slate-300">
                      Patient
                    </dt>
                    <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                      {form.patientName || "Not set"}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-gray-600 dark:text-slate-300">
                      Department
                    </dt>
                    <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                      {form.departmentName || "Not set"}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-gray-600 dark:text-slate-300">
                      Added Items
                    </dt>
                    <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                      {paymentMode === "automatic"
                        ? `${selectedBillItems.length} item${
                            selectedBillItems.length === 1 ? "" : "s"
                          }`
                        : `${selectedManualItems.length} item${
                            selectedManualItems.length === 1 ? "" : "s"
                          }`}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-gray-600 dark:text-slate-300">Draft</dt>
                    <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                      {paymentMode === "automatic"
                        ? form.billItemName || "Not set"
                        : form.billName || "Not set"}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-gray-600 dark:text-slate-300">Total</dt>
                    <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                      {formatCurrency(totalAmount)}
                    </dd>
                  </div>
                </dl>
              </section>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSubmit}
                  type="button"
                  disabled={
                    paymentMutation.isPending ||
                    paymentConfigQuery.isLoading ||
                    departmentsQuery.isLoading
                  }
                  className="rounded-2xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {paymentMutation.isPending
                    ? "Processing payment..."
                    : "Process Payment & Print"}
                </button>

                <button
                  onClick={closeModal}
                  type="button"
                  className="rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-gray-50 dark:border-line-subtle dark:text-slate-100 dark:hover:bg-panel-strong"
                >
                  Cancel
                </button>
              </div>
            </aside>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateNewTransaction;
