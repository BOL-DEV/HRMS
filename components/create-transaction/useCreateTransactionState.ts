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
import type {
  AgentBillItem,
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
import { openReceiptPrintWindowFromHtml } from "@/libs/helper";
import type {
  ExpressPaymentForm,
  SelectedAutomaticItem,
  SelectedManualItem,
  TransactionMode,
} from "@/components/create-transaction/types";

interface UseCreateTransactionStateProps {
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
  return /^\d{10,15}$/.test(value); // Standard phone check
}

export function useCreateTransactionState({
  open,
  onClose,
  onSuccess,
}: UseCreateTransactionStateProps) {
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
      toast.error("Phone number must be 10 to 15 digits.");
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

  return {
    transactionMode,
    setTransactionMode,
    form,
    setForm,
    expressForm,
    setExpressForm,
    selectedBillItems,
    setSelectedBillItems,
    selectedManualItems,
    setSelectedManualItems,
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
    hospitalId,
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
    handleExpressSubmit,
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
  };
}
