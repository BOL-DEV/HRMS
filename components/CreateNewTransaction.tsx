"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { FiCheckCircle, FiRefreshCw, FiSearch, FiX } from "react-icons/fi";
import { formatCurrency, openPrintWindowFromHtml } from "@/libs/helper";
import type {
  AgentBillItem,
  AgentIncomeHead,
  NewTransactionForm,
} from "@/libs/type";
import {
  getAgentBillItems,
  getAgentDepartments,
  getAgentIncomeHeads,
  getAgentPaymentConfig,
  lookupAgentPatient,
  processAgentPayment,
} from "@/libs/agent-auth";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => unknown | Promise<unknown>;
}

function getInitialForm(): NewTransactionForm {
  return {
    patientId: "",
    patientName: "",
    phoneNumber: "",
    patientExists: false,
    departmentId: "",
    departmentName: "",
    incomeHeadId: "",
    incomeHeadName: "",
    billItemId: "",
    billItemName: "",
    billName: "",
    amount: "",
    paymentType: "cash",
  };
}

function printReceipt(receiptHTML: string) {
  const didOpenWindow = openPrintWindowFromHtml(receiptHTML);

  if (!didOpenWindow) {
    toast.error("Popup blocked. Please allow popups to print the receipt.");
  }
}

function isDigitsOnly(value: string) {
  return /^\d+$/.test(value);
}

function isValidPhoneNumber(value: string) {
  return /^\d{10,15}$/.test(value);
}

function CreateNewTransaction({ open, onClose, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<NewTransactionForm>(getInitialForm);
  const [billSearch, setBillSearch] = useState("");
  const [showBillItemList, setShowBillItemList] = useState(true);
  const patientLookupTimeoutRef = useRef<number | null>(null);
  const billItemFieldRef = useRef<HTMLDivElement | null>(null);

  const paymentConfigQuery = useQuery({
    queryKey: ["agent-payment-config"],
    queryFn: getAgentPaymentConfig,
    enabled: open,
  });

  const paymentMode = paymentConfigQuery.data?.data.revenue_type ?? "";

  const departmentsQuery = useQuery({
    queryKey: ["agent-departments"],
    queryFn: getAgentDepartments,
    enabled: open,
  });

  const incomeHeadsQuery = useQuery({
    queryKey: ["agent-income-heads", form.departmentId],
    queryFn: () => getAgentIncomeHeads(form.departmentId),
    enabled: open && Boolean(form.departmentId),
  });

  const billItemsQuery = useQuery({
    queryKey: [
      "agent-bill-items",
      form.departmentId,
      form.incomeHeadId,
      billSearch,
    ],
    queryFn: () =>
      getAgentBillItems({
        departmentId: form.departmentId,
        incomeHeadId: form.incomeHeadId || undefined,
        billName: billSearch || undefined,
      }),
    enabled: open && paymentMode === "automatic" && Boolean(form.departmentId),
  });

  const departments = useMemo(
    () => departmentsQuery.data?.data ?? [],
    [departmentsQuery.data],
  );

  const incomeHeads = useMemo(
    () => incomeHeadsQuery.data?.data ?? [],
    [incomeHeadsQuery.data],
  );

  const billItems = useMemo(
    () => billItemsQuery.data?.data ?? [],
    [billItemsQuery.data],
  );

  const patientLookupMutation = useMutation({
    mutationFn: lookupAgentPatient,
    onSuccess: (response) => {
      const patient = response.data.patient;

      if (response.data.exists && patient) {
        toast.success("Patient found. Details loaded.");
        setForm((current) => ({
          ...current,
          patientExists: true,
          patientName: patient.patient_name,
          phoneNumber: patient.phone_number,
        }));
        return;
      }

      toast("Patient not found. Enter name and phone manually.");
      setForm((current) => ({
        ...current,
        patientExists: false,
        patientName: "",
        phoneNumber: "",
      }));
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to verify patient ID.",
      );
    },
  });

  const paymentMutation = useMutation({
    mutationFn: processAgentPayment,
    onSuccess: async (response) => {
      toast.success(response.message || "Payment processed successfully.");
      queryClient.invalidateQueries({
        queryKey: ["agent-dashboard"],
        refetchType: "inactive",
      });
      queryClient.invalidateQueries({
        queryKey: ["agent-transactions"],
        refetchType: "inactive",
      });
      queryClient.invalidateQueries({
        queryKey: ["agent-receipts"],
        refetchType: "inactive",
      });
      queryClient.invalidateQueries({
        queryKey: ["agent-profile"],
        refetchType: "inactive",
      });
      await onSuccess?.();
      printReceipt(response.data.receipt.receiptHTML);
      setForm(getInitialForm());
      setBillSearch("");
      setShowBillItemList(true);
      onClose();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to process payment.",
      );
    },
  });

  const canLookupPatient =
    form.patientId.trim().length > 0 && isDigitsOnly(form.patientId.trim());
  const patientStepReady =
    Boolean(form.patientId) &&
    (form.patientExists ||
      (Boolean(form.patientName.trim()) &&
        isValidPhoneNumber(form.phoneNumber)));
  const paymentStepReady =
    Boolean(form.departmentId) &&
    Boolean(form.paymentType) &&
    (paymentMode === "automatic"
      ? Boolean(form.incomeHeadId && form.billItemId)
      : Boolean(
          form.incomeHeadId && form.billName.trim() && form.amount.trim(),
        ));

  const triggerPatientLookup = useEffectEvent(() => {
    const patientId = form.patientId.trim();

    if (!patientId || !isDigitsOnly(patientId)) {
      return;
    }

    patientLookupMutation.mutate(patientId);
  });

  const handleDepartmentChange = (value: string) => {
    const selectedDepartment = departments.find(
      (department) => department.id === value,
    );

    setForm((current) => ({
      ...current,
      departmentId: value,
      departmentName: selectedDepartment?.name ?? "",
      incomeHeadId: "",
      incomeHeadName: "",
      billItemId: "",
      billItemName: "",
      billName: "",
      amount: "",
    }));
    setBillSearch("");
    setShowBillItemList(true);
  };

  const handleIncomeHeadChange = (value: string) => {
    const selectedIncomeHead =
      incomeHeads.find((incomeHead) => incomeHead.id === value) ?? null;

    setForm((current) => ({
      ...current,
      incomeHeadId: value,
      incomeHeadName: selectedIncomeHead?.name ?? "",
      billItemId: "",
      billItemName: "",
      billName: paymentMode === "manual" ? current.billName : "",
      amount: paymentMode === "manual" ? current.amount : "",
    }));
    setBillSearch("");
    setShowBillItemList(true);
  };

  const handleBillItemChange = (billItem: AgentBillItem) => {
    setForm((current) => ({
      ...current,
      billItemId: billItem.bill_item_id,
      billItemName: billItem.name,
      billName: billItem.name,
      amount: String(billItem.amount),
      incomeHeadId: billItem.income_head_id,
      incomeHeadName: billItem.income_head_name,
    }));
    setBillSearch(billItem.name);
    setShowBillItemList(false);
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    if (patientLookupTimeoutRef.current) {
      window.clearTimeout(patientLookupTimeoutRef.current);
      patientLookupTimeoutRef.current = null;
    }

    if (!canLookupPatient) {
      return;
    }

    patientLookupTimeoutRef.current = window.setTimeout(() => {
      triggerPatientLookup();
    }, 2000);

    return () => {
      if (patientLookupTimeoutRef.current) {
        window.clearTimeout(patientLookupTimeoutRef.current);
        patientLookupTimeoutRef.current = null;
      }
    };
  }, [open, form.patientId, canLookupPatient]);

  useEffect(() => {
    if (!open || !showBillItemList) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;

      if (
        billItemFieldRef.current &&
        target instanceof Node &&
        !billItemFieldRef.current.contains(target)
      ) {
        setShowBillItemList(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open, showBillItemList]);

  const handleSubmit = () => {
    const patientId = form.patientId.trim();
    const patientName = form.patientName.trim();
    const phoneNumber = form.phoneNumber.trim();

    if (!patientId) {
      toast.error("Patient ID is required.");
      return;
    }

    if (!isDigitsOnly(patientId)) {
      toast.error("Patient ID must contain only numbers.");
      return;
    }

    if (!form.departmentId) {
      toast.error("Select a department.");
      return;
    }

    if (!form.patientExists) {
      if (!patientName) {
        toast.error("Patient name is required for a new patient.");
        return;
      }

      if (!isValidPhoneNumber(phoneNumber)) {
        toast.error("Phone number must be 10 to 15 digits.");
        return;
      }
    }

    if (paymentMode === "automatic") {
      if (!form.billItemId) {
        toast.error("Select a bill item.");
        return;
      }

      paymentMutation.mutate({
        patient_id: patientId,
        department_id: form.departmentId,
        patient_name: form.patientExists ? undefined : patientName,
        phone_number: form.patientExists ? undefined : phoneNumber,
        bill_item_id: form.billItemId,
        payment_type: form.paymentType,
      });
      return;
    }

    if (!form.incomeHeadId || !form.billName.trim() || !form.amount.trim()) {
      toast.error("Income head, bill name, and amount are required.");
      return;
    }

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }

    paymentMutation.mutate({
      patient_id: patientId,
      department_id: form.departmentId,
      patient_name: form.patientExists ? undefined : patientName,
      phone_number: form.patientExists ? undefined : phoneNumber,
      income_head_id: form.incomeHeadId,
      bill_name: form.billName.trim(),
      amount,
      payment_type: form.paymentType,
    });
  };

  const closeModal = () => {
    if (paymentMutation.isPending) {
      return;
    }

    setForm(getInitialForm());
    setBillSearch("");
    setShowBillItemList(true);
    onClose();
  };

  const configError =
    paymentConfigQuery.error instanceof Error
      ? paymentConfigQuery.error.message
      : null;
  const departmentsError =
    departmentsQuery.error instanceof Error
      ? departmentsQuery.error.message
      : null;
  const incomeHeadsError =
    incomeHeadsQuery.error instanceof Error
      ? incomeHeadsQuery.error.message
      : null;
  const billItemsError =
    billItemsQuery.error instanceof Error ? billItemsQuery.error.message : null;

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
          className="mx-auto my-6 w-full max-w-4xl rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-6 dark:border-slate-800">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Process Payment
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
                Follow the steps, choose the correct bill item when needed, and
                print the receipt immediately after payment.
              </p>
            </div>

            <button
              className="rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={closeModal}
              type="button"
              aria-label="Close"
            >
              <FiX />
            </button>
          </div>

          <div className="grid gap-6 p-6 xl:grid-cols-[1.35fr_0.85fr]">
            <div className="min-w-0 space-y-5">
              {configError ||
              departmentsError ||
              incomeHeadsError ||
              billItemsError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
                  {configError ??
                    departmentsError ??
                    incomeHeadsError ??
                    billItemsError}
                </div>
              ) : null}

              <section className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800">
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
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                      <FiCheckCircle />
                      Ready
                    </span>
                  ) : null}
                </div>

                <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
                  If the patient is not found, enter name and phone manually.
                </p>

                <div className="mt-4">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                      Patient ID
                    </span>
                    <input
                      value={form.patientId}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          patientId: event.target.value.replace(/\D/g, ""),
                          patientExists: false,
                          patientName: "",
                          phoneNumber: "",
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                      placeholder="100245"
                      inputMode="numeric"
                    />
                  </label>
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
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:disabled:bg-slate-800"
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
                          phoneNumber: event.target.value.replace(/\D/g, ""),
                        }))
                      }
                      disabled={form.patientExists}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:disabled:bg-slate-800"
                      placeholder="08012345678"
                      inputMode="tel"
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800">
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
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
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
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
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
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                    >
                      <option value="cash">Cash</option>
                      <option value="transfer">Transfer</option>
                      <option value="pos">POS</option>
                    </select>
                  </label>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
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
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
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
                                billName: "",
                                amount: "",
                              }));
                            }
                          }}
                          onFocus={() => setShowBillItemList(true)}
                          disabled={!form.incomeHeadId}
                          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-slate-800"
                          placeholder={
                            form.incomeHeadId
                              ? "Search and select a bill item"
                              : "Select income head first"
                          }
                        />

                        {form.incomeHeadId && showBillItemList ? (
                          <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                            <div className="max-h-72 overflow-y-auto p-3">
                              {billItemsQuery.isLoading ? (
                                <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
                                  Loading bill items...
                                </div>
                              ) : billItems.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
                                  No bill items matched this search.
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {billItems.map((billItem: AgentBillItem) => {
                                    const isSelected =
                                      billItem.bill_item_id === form.billItemId;

                                    return (
                                      <button
                                        key={billItem.bill_item_id}
                                        type="button"
                                        onClick={() =>
                                          handleBillItemChange(billItem)
                                        }
                                        className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                                          isSelected
                                            ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20"
                                            : "border-gray-200 bg-white hover:border-slate-300 hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800"
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
                                            {isSelected ? (
                                              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
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
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                        placeholder="X-Ray payment"
                      />
                    </label>
                  )}
                </div>

                {paymentMode === "automatic" ? (
                  <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                    {!form.incomeHeadId ? (
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Select an income head first before searching for bill
                        items.
                      </p>
                    ) : null}

                    <label className="mt-4 block space-y-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                        Amount
                      </span>
                      <input
                        value={form.amount}
                        readOnly
                        className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100"
                        placeholder="Auto-filled from selected bill item"
                      />
                    </label>
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
                            amount: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                        placeholder="5000"
                        inputMode="decimal"
                      />
                    </label>
                  </div>
                )}
              </section>
            </div>

            <aside className="self-start space-y-5 xl:sticky xl:top-6">
              <section className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800">
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
                      Income Head
                    </dt>
                    <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                      {form.incomeHeadName || "Not set"}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-gray-600 dark:text-slate-300">Bill</dt>
                    <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                      {paymentMode === "automatic"
                        ? form.billItemName || "Not set"
                        : form.billName || "Not set"}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-gray-600 dark:text-slate-300">
                      Amount
                    </dt>
                    <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                      {form.amount
                        ? formatCurrency(Number(form.amount))
                        : "Not set"}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Quick Guide
                </h3>
                <ol className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  <li>1. Enter patient ID and wait for the auto lookup.</li>
                  <li>2. Choose department, payment type, and income head.</li>
                  <li>3. Search and select the correct bill item.</li>
                  <li>4. Review the preview, then process and print.</li>
                </ol>
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
                  className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {paymentMutation.isPending
                    ? "Processing payment..."
                    : "Process Payment & Print"}
                </button>

                <button
                  onClick={closeModal}
                  type="button"
                  className="rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateNewTransaction;
