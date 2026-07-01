"use client";

import {
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  FiCheckCircle,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { formatCurrency, openReceiptPrintWindowFromHtml } from "@/libs/helper";
import type {
  AgentBillItem,
  AgentIncomeHead,
  HospitalPatientSearchItem,
  NewTransactionForm,
} from "@/libs/type";
import {
  getAgentBillItems,
  getAgentDepartments,
  getAgentIncomeHeads,
  getAgentPaymentConfig,
  lookupAgentPatient,
  processAgentPayment,
  processAgentExpressPayment,
  searchAgentHospitalPatients,
} from "@/libs/agent-auth";
import ExpressTransactionSection from "@/components/create-transaction/ExpressTransactionSection";
import TransactionModeToggle from "@/components/create-transaction/TransactionModeToggle";
import {
  sanitizeAmountInput,
  sanitizePhoneNumber,
  sanitizeQuantityInput,
} from "@/components/create-transaction/helpers";
import type {
  ExpressPaymentForm,
  SelectedAutomaticItem,
  SelectedManualItem,
  TransactionMode,
} from "@/components/create-transaction/types";

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
    billItemQuantity: "1",
    billItemUnitAmount: "",
    billName: "",
    amount: "",
    paymentType: "cash",
  };
}

function getInitialExpressForm(): ExpressPaymentForm {
  return {
    departmentId: "",
    fullName: "",
    phoneNumber: "",
    service: "",
    amount: "",
    paymentType: "cash",
  };
}

function printReceiptHtml(receiptHTML: string) {
  const didOpenWindow = openReceiptPrintWindowFromHtml(receiptHTML);

  if (!didOpenWindow) {
    toast.error("Popup blocked. Please allow popups to print the receipt.");
  }
}

function isDigitsOnly(value: string) {
  return /^\d+$/.test(value);
}

function isValidPhoneNumber(value: string) {
  return /^\d{11}$/.test(value);
}

function CreateNewTransaction({ open, onClose, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const [transactionMode, setTransactionMode] =
    useState<TransactionMode>("patient");
  const [form, setForm] = useState<NewTransactionForm>(getInitialForm);
  const [expressForm, setExpressForm] =
    useState<ExpressPaymentForm>(getInitialExpressForm);
  const [selectedBillItems, setSelectedBillItems] = useState<
    SelectedAutomaticItem[]
  >([]);
  const [selectedManualItems, setSelectedManualItems] = useState<
    SelectedManualItem[]
  >([]);
  const [billSearch, setBillSearch] = useState("");
  const [showBillItemList, setShowBillItemList] = useState(true);
  const [patientSearchInput, setPatientSearchInput] = useState("");
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(true);
  const billItemFieldRef = useRef<HTMLDivElement | null>(null);
  const patientFieldRef = useRef<HTMLDivElement | null>(null);
  const deferredPatientSearchInput = useDeferredValue(patientSearchInput.trim());
  const lastAutoLookupPatientIdRef = useRef<string>("");
  const patientLookupToastId = "agent-patient-lookup";

  const paymentConfigQuery = useQuery({
    queryKey: ["agent-payment-config"],
    queryFn: getAgentPaymentConfig,
    enabled: open,
  });

  const paymentMode = paymentConfigQuery.data?.data.revenue_type ?? "";
  const hospitalId = paymentConfigQuery.data?.data.hospital_id ?? "";
  const isExpressMode = transactionMode === "express";

  const departmentsQuery = useQuery({
    queryKey: ["agent-departments"],
    queryFn: getAgentDepartments,
    enabled: open,
  });

  const incomeHeadsQuery = useQuery({
    queryKey: ["agent-income-heads", form.departmentId],
    queryFn: () => getAgentIncomeHeads(form.departmentId),
    enabled: open && paymentMode === "manual" && Boolean(form.departmentId),
  });

  const billItemsQuery = useQuery({
    queryKey: ["agent-bill-items", form.departmentId, billSearch],
    queryFn: () =>
      getAgentBillItems({
        departmentId: form.departmentId,
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

  const patientSearchQuery = useQuery({
    queryKey: ["agent-patient-search", hospitalId, deferredPatientSearchInput],
    queryFn: () =>
      searchAgentHospitalPatients(hospitalId, {
        query: deferredPatientSearchInput,
        limit: 10,
      }),
    enabled: open && Boolean(hospitalId && deferredPatientSearchInput),
  });

  const patientSuggestions = useMemo(
    () => patientSearchQuery.data?.data.patients ?? [],
    [patientSearchQuery.data],
  );

  const totalAmount = useMemo(() => {
    if (paymentMode === "automatic") {
      return selectedBillItems.reduce((sum, item) => sum + item.amount, 0);
    }

    return selectedManualItems.reduce((sum, item) => sum + item.amount, 0);
  }, [paymentMode, selectedBillItems, selectedManualItems]);

  const patientLookupMutation = useMutation({
    mutationFn: lookupAgentPatient,
    onSuccess: (response) => {
      const patient = response.data.patient;

      if (response.data.exists && patient) {
        toast.success("Patient found. Details loaded.", {
          id: patientLookupToastId,
        });
        setForm((current) => ({
          ...current,
          patientExists: true,
          patientName: patient.patient_name,
          phoneNumber: patient.phone_number,
        }));
        setShowPatientSuggestions(false);
        return;
      }

      toast("Patient not found. Enter name and phone manually.", {
        id: patientLookupToastId,
      });
      setForm((current) => ({
        ...current,
        patientExists: false,
        patientName: current.patientName,
        phoneNumber: current.phoneNumber,
      }));
      setShowPatientSuggestions(false);
    },
    onError: (error) => {
      setShowPatientSuggestions(false);
      toast.error(
        error instanceof Error ? error.message : "Unable to verify patient ID.",
        {
          id: patientLookupToastId,
        },
      );
    },
  });

  const handlePaymentSuccess = async (response: {
    message?: string;
    data: {
      receipt?: {
        receiptHTML?: string;
      };
    };
  }) => {
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
    if (response.data.receipt?.receiptHTML) {
      printReceiptHtml(response.data.receipt.receiptHTML);
    }
  };

  const paymentMutation = useMutation({
    mutationFn: processAgentPayment,
    onSuccess: async (response) => {
      toast.success(response.message || "Payment processed successfully.");
      await handlePaymentSuccess(response);
      setForm(getInitialForm());
      setSelectedBillItems([]);
      setSelectedManualItems([]);
      setBillSearch("");
      setPatientSearchInput("");
      setShowPatientSuggestions(true);
      setShowBillItemList(true);
      onClose();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to process payment.",
      );
    },
  });

  const expressPaymentMutation = useMutation({
    mutationFn: processAgentExpressPayment,
    onSuccess: async (response) => {
      toast.success(response.message || "Express payment processed successfully.");
      await handlePaymentSuccess(response);
      setExpressForm(getInitialExpressForm());
      setTransactionMode("patient");
      onClose();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to process payment.",
      );
    },
  });

  const switchTransactionMode = (mode: TransactionMode) => {
    if (mode === transactionMode) {
      return;
    }

    setTransactionMode(mode);
    setForm(getInitialForm());
    setExpressForm(getInitialExpressForm());
    setSelectedBillItems([]);
    setSelectedManualItems([]);
    setBillSearch("");
    setPatientSearchInput("");
    setShowPatientSuggestions(true);
    setShowBillItemList(true);
  };

  const handleExpressSubmit = () => {
    const departmentId = expressForm.departmentId.trim();
    const fullName = expressForm.fullName.trim();
    const phoneNumber = expressForm.phoneNumber.trim();
    const service = expressForm.service.trim();
    const amount = Number(expressForm.amount);

    if (!departmentId) {
      toast.error("Select a department.");
      return;
    }

    if (!fullName) {
      toast.error("Customer name is required.");
      return;
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      toast.error("Phone number must be 11 digits.");
      return;
    }

    if (!service) {
      toast.error("Service is required.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }

    expressPaymentMutation.mutate({
      department_id: departmentId,
      patient_name: fullName,
      phone_number: phoneNumber,
      service_name: service,
      bill_name: service,
      amount,
      payment_type: expressForm.paymentType,
    });
  };

  const patientStepReady =
    Boolean(form.patientId) &&
    (form.patientExists ||
      (Boolean(form.patientName.trim()) &&
        isValidPhoneNumber(form.phoneNumber)));
  const paymentStepReady =
    Boolean(form.departmentId) &&
    Boolean(form.paymentType) &&
    (paymentMode === "automatic"
      ? selectedBillItems.length > 0
      : selectedManualItems.length > 0);

  const expressStepReady =
    Boolean(expressForm.departmentId) &&
    Boolean(expressForm.fullName.trim()) &&
    Boolean(expressForm.service.trim()) &&
    isValidPhoneNumber(expressForm.phoneNumber) &&
    Number.isFinite(Number(expressForm.amount)) &&
    Number(expressForm.amount) > 0;

  const triggerPatientLookup = useEffectEvent(() => {
    const patientId = form.patientId.trim();

    if (!patientId || !isDigitsOnly(patientId)) {
      return;
    }

    patientLookupMutation.mutate(patientId);
  });

  useEffect(() => {
    if (!form.patientId.trim()) {
      lastAutoLookupPatientIdRef.current = "";
    }
  }, [form.patientId]);

  const handlePatientSuggestionSelect = (patient: HospitalPatientSearchItem) => {
    setPatientSearchInput(patient.display_value);
    setShowPatientSuggestions(false);
    setForm((current) => ({
      ...current,
      patientId: patient.patient_id,
      patientExists: true,
      patientName: patient.patient_name,
      phoneNumber: patient.phone_number,
    }));
  };

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
      billItemQuantity: "1",
      billItemUnitAmount: "",
      billName: "",
      amount: "",
    }));
    setSelectedBillItems([]);
    setSelectedManualItems([]);
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
      billItemId: paymentMode === "automatic" ? current.billItemId : "",
      billItemName: paymentMode === "automatic" ? current.billItemName : "",
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
      billItemQuantity: "1",
      billItemUnitAmount: String(billItem.amount),
      billName: billItem.name,
      amount: String(billItem.amount),
      incomeHeadId: billItem.income_head_id,
      incomeHeadName: billItem.income_head_name,
    }));
    setBillSearch(billItem.name);
    setShowBillItemList(false);
  };

  const handleAddItem = () => {
    if (paymentMode === "automatic") {
      if (!form.billItemId || !form.billItemName || !form.amount) {
        toast.error("Select a bill item to add.");
        return;
      }

      const amount = Number(form.amount);
      const unitAmount = Number(form.billItemUnitAmount || form.amount);
      const quantity = Number(form.billItemQuantity || "1");

      if (!Number.isFinite(amount) || amount <= 0) {
        toast.error("Select a valid bill item amount.");
        return;
      }

      if (!Number.isInteger(quantity) || quantity <= 0) {
        toast.error("Enter a valid quantity.");
        return;
      }

      if (
        selectedBillItems.some((item) => item.billItemId === form.billItemId)
      ) {
        toast.error("This bill item has already been added.");
        return;
      }

      setSelectedBillItems((current) => [
        ...current,
        {
          billItemId: form.billItemId,
          billItemName: form.billItemName,
          incomeHeadId: form.incomeHeadId,
          incomeHeadName: form.incomeHeadName,
          unitAmount,
          quantity,
          amount: unitAmount * quantity,
        },
      ]);
      setForm((current) => ({
        ...current,
        billItemId: "",
        billItemName: "",
        billItemQuantity: "1",
        billItemUnitAmount: "",
        billName: "",
        amount: "",
      }));
      setBillSearch("");
      setShowBillItemList(true);
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

    setSelectedManualItems((current) => [
      ...current,
      {
        id: `${form.incomeHeadId}-${form.billName.trim()}-${Date.now()}`,
        incomeHeadId: form.incomeHeadId,
        incomeHeadName: form.incomeHeadName,
        billName: form.billName.trim(),
        amount,
      },
    ]);
    setForm((current) => ({
      ...current,
      billName: "",
      amount: "",
    }));
  };

  const removeAutomaticItem = (billItemId: string) => {
    setSelectedBillItems((current) =>
      current.filter((item) => item.billItemId !== billItemId),
    );
  };

  const removeManualItem = (id: string) => {
    setSelectedManualItems((current) =>
      current.filter((item) => item.id !== id),
    );
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    if (form.patientExists) {
      return;
    }

    if (patientLookupMutation.isPending) {
      return;
    }

    const patientId = form.patientId.trim();

    if (!patientId || !isDigitsOnly(patientId)) {
      return;
    }

    if (lastAutoLookupPatientIdRef.current === patientId) {
      return;
    }

    if (patientSuggestions.some((patient) => patient.patient_id === patientId)) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      lastAutoLookupPatientIdRef.current = patientId;
      triggerPatientLookup();
    }, 450);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    form.patientExists,
    form.patientId,
    open,
    patientLookupMutation.isPending,
    patientSuggestions,
  ]);

  useEffect(() => {
    if (
      !open ||
      (!showBillItemList && (!showPatientSuggestions || !patientSearchInput.trim()))
    ) {
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

      if (
        patientFieldRef.current &&
        target instanceof Node &&
        !patientFieldRef.current.contains(target)
      ) {
        setShowPatientSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open, patientSearchInput, showBillItemList, showPatientSuggestions]);

  const handleSubmit = () => {
    if (isExpressMode) {
      handleExpressSubmit();
      return;
    }

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
      if (selectedBillItems.length === 0) {
        toast.error("Add at least one bill item.");
        return;
      }

      const billItemIds = selectedBillItems.flatMap((item) =>
        Array.from({ length: item.quantity }, () => item.billItemId),
      );

      paymentMutation.mutate({
        patient_id: patientId,
        department_id: form.departmentId,
        patient_name: form.patientExists ? undefined : patientName,
        phone_number: form.patientExists ? undefined : phoneNumber,
        bill_item_ids: billItemIds,
        bill_items: selectedBillItems.map((item) => ({
          bill_item_id: item.billItemId,
          quantity: item.quantity,
        })),
        payment_type: form.paymentType,
      });
      return;
    }

    if (selectedManualItems.length === 0) {
      toast.error("Add at least one manual bill item.");
      return;
    }

    paymentMutation.mutate({
      patient_id: patientId,
      department_id: form.departmentId,
      patient_name: form.patientExists ? undefined : patientName,
      phone_number: form.patientExists ? undefined : phoneNumber,
      manual_items: selectedManualItems.map((item) => ({
        income_head_id: item.incomeHeadId,
        bill_name: item.billName,
        amount: item.amount,
      })),
      payment_type: form.paymentType,
    });
  };

  const closeModal = () => {
    if (paymentMutation.isPending || expressPaymentMutation.isPending) {
      return;
    }

    setTransactionMode("patient");
    setForm(getInitialForm());
    setExpressForm(getInitialExpressForm());
    setSelectedBillItems([]);
    setSelectedManualItems([]);
    setBillSearch("");
    setPatientSearchInput("");
    setShowPatientSuggestions(true);
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
  const patientSearchError =
    patientSearchQuery.error instanceof Error
      ? patientSearchQuery.error.message
      : null;

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
            />
          </div>

          {isExpressMode ? (
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
                            className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 px-4 py-3 dark:border-line-subtle"
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
                          className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 px-4 py-3 dark:border-line-subtle"
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
