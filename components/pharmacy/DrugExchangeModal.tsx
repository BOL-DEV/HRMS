"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FiX,
  FiSearch,
  FiUser,
  FiPhone,
  FiFileText,
  FiRefreshCw,
  FiPlus,
  FiTrash2,
  FiCheckCircle,
  FiAlertTriangle,
  FiDollarSign,
  FiArrowRight,
  FiLayers,
  FiCornerDownLeft,
} from "react-icons/fi";
import { formatCurrency, formatDateTime } from "@/libs/helper";
import { toast } from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import {
  getPharmacyInventory,
  lookupPatientForPharmacy,
  getPharmacyWalkInPatient,
  searchPharmacyHospitalPatients,
  getPharmacyProfile,
  getPharmacyRequests,
  getPharmacyRequestById,
  unwrapPharmacyData,
  BackendDrugItem,
} from "@/libs/pharmacy-api";
import { useScrollLock } from "@/hooks/useScrollLock";
import {
  ReturnReason,
  DrugCondition,
  PaymentMethod,
  ExchangeReturnedItem,
  ExchangeReplacementItem,
  CreateDrugExchangePayload,
  DrugExchangePayload,
  submitDrugExchange,
  searchDrugExchangePatients,
  getPatientDispensedDrugs,
  getDrugExchangeDispensedByReceipt,
  DrugExchangePatient,
  PatientDispensedDrugItem,
  RETURN_REASON_LABELS,
  DRUG_CONDITION_LABELS,
  DrugExchangeRecord,
} from "@/libs/pharmacy-exchange";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (record: DrugExchangeRecord) => void;
  pharmacistName?: string;
  pharmacyUnitName?: string;
}

export default function DrugExchangeModal({
  isOpen,
  onClose,
  onSuccess,
  pharmacistName,
  pharmacyUnitName,
}: Props) {
  useScrollLock(isOpen);

  // Pharmacy Profile to retrieve hospital_id
  const { data: profileResponse } = useQuery({
    queryKey: ["pharmacy-profile-exchange-modal"],
    queryFn: getPharmacyProfile,
    enabled: isOpen,
  });
  const hospitalId = profileResponse?.data?.hospital_id;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Step State: 1 = Patient & Return Selection, 2 = Replacement & Calculation, 3 = Settlement & Review
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Receipt & Patient Lookup State (Anti-theft receipt verification)
  const [receiptQuery, setReceiptQuery] = useState("");
  const [isSearchingReceipt, setIsSearchingReceipt] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{
    id: string;
    name: string;
    phone: string;
    hospital_number?: string;
    billing_code?: string;
    receipt_no?: string;
    paid_at?: string;
    dispensed_at?: string;
    is_within_24_hours?: boolean;
    hours_since_payment?: number;
  } | null>(null);

  // Dispensed Drugs State
  const [dispensedDrugs, setDispensedDrugs] = useState<PatientDispensedDrugItem[]>([]);
  const [isLoadingDispenses, setIsLoadingDispenses] = useState(false);
  const [selectedBillCode, setSelectedBillCode] = useState<string>("");

  // Returned Items State
  const [returnedItems, setReturnedItems] = useState<ExchangeReturnedItem[]>([]);
  const [manualReturnOpen, setManualReturnOpen] = useState(false);

  // Manual Form State for Return
  const [manualDrugName, setManualDrugName] = useState("");
  const [manualUnitPrice, setManualUnitPrice] = useState("");
  const [manualQty, setManualQty] = useState("1");
  const [manualReason, setManualReason] = useState<ReturnReason>("ADVERSE_REACTION");
  const [manualCondition, setManualCondition] = useState<DrugCondition>("sealed");
  const [manualNotes, setManualNotes] = useState("");

  // Exchange Type: "exchange" (Swap for replacement) or "return_only" (Refund / Credit)
  const [exchangeType, setExchangeType] = useState<"exchange" | "return_only">("exchange");

  // Replacement Items State
  const [replacementItems, setReplacementItems] = useState<ExchangeReplacementItem[]>([]);

  // Replacement Search Combobox State
  const [replacementSearch, setReplacementSearch] = useState("");
  const [selectedReplacementDrug, setSelectedReplacementDrug] = useState<BackendDrugItem | null>(null);
  const [replacementQty, setReplacementQty] = useState("1");

  // Settlement & Remarks
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [generalRemarks, setGeneralRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Query Live Inventory for Replacement Combobox
  const { data: inventoryData, isLoading: isLoadingInventory } = useQuery({
    queryKey: ["pharmacy-exchange-inventory-search", replacementSearch],
    queryFn: () => getPharmacyInventory({ search: replacementSearch, limit: 12 }),
    enabled: Boolean(isOpen && replacementSearch.trim().length > 1),
  });

  const availableInventoryDrugs = useMemo(() => {
    const unwrapped = unwrapPharmacyData<any>(inventoryData, null);
    return unwrapped?.items ?? [];
  }, [inventoryData]);

  // Financial Calculations
  const totalReturnValue = useMemo(() => {
    return returnedItems.reduce((sum, item) => sum + (item.return_subtotal || 0), 0);
  }, [returnedItems]);

  const totalReplacementCost = useMemo(() => {
    if (exchangeType === "return_only") return 0;
    return replacementItems.reduce((sum, item) => sum + (item.replacement_subtotal || 0), 0);
  }, [replacementItems, exchangeType]);

  const balanceDifference = useMemo(() => {
    return totalReplacementCost - totalReturnValue;
  }, [totalReplacementCost, totalReturnValue]);

  // Reset modal state on close/open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setReceiptQuery("");
      setSelectedPatient(null);
      setDispensedDrugs([]);
      setSelectedBillCode("");
      setReturnedItems([]);
      setReplacementItems([]);
      setExchangeType("exchange");
      setGeneralRemarks("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Strict Anti-Theft Receipt Lookup (GET /api/pharmacy/drug-exchange/receipt/:receiptNo)
  const handleLookupReceipt = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = receiptQuery.trim();
    if (!q) {
      toast.error("Please enter the Payment Receipt Number (e.g. REC-20261004-001).");
      return;
    }

    setIsSearchingReceipt(true);
    try {
      const res = await getDrugExchangeDispensedByReceipt(q);
      if (res.status === "error" || !res.data || res.data.items.length === 0) {
        toast.error(
          res.message || `No dispensed medication records found for "${q}". Ensure the prescription is in "dispensed" status.`
        );
        setDispensedDrugs([]);
        setSelectedPatient(null);
        return;
      }

      const data = res.data;
      const items = data.items;
      const pt = data.patient;

      setSelectedPatient({
        id: pt.patient_id || q,
        name: pt.patient_name || "Verified Patient",
        phone: pt.phone_number || "",
        billing_code: pt.billing_code || data.receipt_no || q,
        receipt_no: data.receipt_no || q,
        paid_at: pt.paid_at,
        dispensed_at: pt.dispensed_at,
        is_within_24_hours: pt.is_within_24_hours !== false,
        hours_since_payment: pt.hours_since_payment,
      });
      setDispensedDrugs(items);
      setSelectedBillCode(data.receipt_no || pt.billing_code || q);
      toast.success(`Verified: Found ${items.length} dispensed line item(s) for ${data.receipt_no || q}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to lookup payment receipt.");
    } finally {
      setIsSearchingReceipt(false);
    }
  };

  // Add Item from Previous Dispense History
  const handleSelectDispensedDrugToReturn = (item: PatientDispensedDrugItem) => {
    const reqItemId =
      item.pharmacy_request_item_id ||
      (item as any).request_item_id ||
      (item as any).prescription_item_id ||
      (item as any).id;
    const drugItemId =
      item.pharmacy_item_id ||
      (item as any).item_id ||
      (item as any).drug_id ||
      "";

    const existing = returnedItems.find(
      (it) =>
        (reqItemId && it.pharmacy_request_item_id === reqItemId) ||
        it.pharmacy_item_id === drugItemId
    );
    if (existing) {
      toast("This medication is already added to the return list.");
      return;
    }

    const available = item.available_to_return ?? item.quantity_dispensed ?? 1;
    if (available <= 0) {
      toast.error("This medication has already been fully returned.");
      return;
    }

    const itemReceipt = (item as any).receipt_no || item.billing_code || selectedBillCode;

    // Check if user already added items from a different receipt
    if (returnedItems.length > 0) {
      const existingReceipt = (returnedItems[0] as any).receipt_no || (returnedItems[0] as any).billing_code;
      if (existingReceipt && itemReceipt && existingReceipt !== itemReceipt) {
        toast.error(
          `Cannot mix items from different receipts in one return. Current items are from receipt "${existingReceipt}", but "${item.drug_name}" is from receipt "${itemReceipt}". Please process separate returns.`
        );
        return;
      }
    }

    const unitPrice = Number(item.unit_price) || 0;
    const qty = 1;
    const newItem: ExchangeReturnedItem = {
      pharmacy_request_item_id: reqItemId,
      pharmacy_item_id: drugItemId,
      returned_drug_id: drugItemId,
      returned_drug_name: item.drug_name,
      returned_unit_price: unitPrice,
      returned_quantity: qty,
      available_to_return: available,
      return_subtotal: unitPrice * qty,
      return_reason: "Patient returned drug",
      drug_condition: "good",
      restock_to_inventory: true,
      restock_inventory: true,
      receipt_no: itemReceipt,
      billing_code: item.billing_code || itemReceipt,
    };

    setReturnedItems((prev) => [...prev, newItem]);
    if (itemReceipt) {
      setSelectedBillCode(itemReceipt);
      setSelectedPatient((prev) => (prev ? { ...prev, receipt_no: itemReceipt, billing_code: itemReceipt } : prev));
    }
    toast.success(`Added "${newItem.returned_drug_name}" to return list.`);
  };

  const handleUpdateReturnedItem = (
    index: number,
    field: keyof ExchangeReturnedItem,
    value: any
  ) => {
    setReturnedItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };

      if (field === "returned_quantity" || field === "returned_unit_price") {
        target.return_subtotal = (target.returned_quantity || 1) * (target.returned_unit_price || 0);
      }
      if (field === "drug_condition") {
        const isRestockable = value === "sealed" || value === "good" || value === "INTACT_RESELLABLE";
        target.restock_to_inventory = isRestockable;
        target.restock_inventory = isRestockable;
      }

      updated[index] = target;
      return updated;
    });
  };

  const handleRemoveReturnedItem = (index: number) => {
    setReturnedItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Add Replacement Item
  const handleAddReplacementDrug = () => {
    if (!selectedReplacementDrug) {
      toast.error("Please search and select a replacement drug from the catalog.");
      return;
    }

    const qty = Math.max(1, Number(replacementQty) || 1);
    if (qty > selectedReplacementDrug.stock) {
      toast.error(
        `Quantity (${qty}) exceeds available stock (${selectedReplacementDrug.stock}).`
      );
      return;
    }

    const price = selectedReplacementDrug.unit_price ?? 0;
    const newItem: ExchangeReplacementItem = {
      pharmacy_item_id: selectedReplacementDrug.id,
      replacement_drug_id: selectedReplacementDrug.id,
      replacement_drug_name: selectedReplacementDrug.name,
      replacement_unit_price: price,
      replacement_quantity: qty,
      replacement_subtotal: price * qty,
      batch_number: selectedReplacementDrug.batch_number,
      expiry_date: selectedReplacementDrug.expiry_date,
    };

    setReplacementItems((prev) => [...prev, newItem]);
    setSelectedReplacementDrug(null);
    setReplacementSearch("");
    setReplacementQty("1");
    toast.success(`Added replacement: "${newItem.replacement_drug_name}"`);
  };

  const handleRemoveReplacementItem = (index: number) => {
    setReplacementItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Final Submit
  const handleFinalSubmit = async () => {
    if (!selectedPatient) {
      toast.error("Patient information is missing.");
      return;
    }

    if (returnedItems.length === 0) {
      toast.error("Please add at least one returned medication from the dispensed history.");
      return;
    }

    if (exchangeType === "exchange" && replacementItems.length === 0) {
      toast.error("Please select a replacement medication or switch to 'Return Only'.");
      return;
    }

    setIsSubmitting(true);

    const firstReturned = returnedItems[0] as any;
    const resolvedReceipt =
      firstReturned?.receipt_no ||
      firstReturned?.billing_code ||
      selectedPatient.receipt_no ||
      selectedBillCode ||
      receiptQuery.trim() ||
      undefined;

    const payload: CreateDrugExchangePayload = {
      receipt_no: resolvedReceipt,
      patient_id: selectedPatient.id,
      patient_name: selectedPatient.name,
      phone_number: selectedPatient.phone,
      hospital_number: selectedPatient.hospital_number,
      original_billing_code: resolvedReceipt,
      remarks: generalRemarks.trim() || undefined,
      returned_items: returnedItems.map((it: any) => {
        const reqItemId =
          it.pharmacy_request_item_id ||
          it.request_item_id ||
          it.prescription_item_id ||
          it.id ||
          it.pharmacy_item_id ||
          it.returned_drug_id;
        const drugId = it.pharmacy_item_id || it.returned_drug_id || reqItemId;
        return {
          pharmacy_request_item_id: reqItemId,
          pharmacy_item_id: drugId,
          quantity: Number(it.returned_quantity || 1),
          reason: it.return_reason || it.reason_notes || "Patient returned drug",
          condition: "good",
          unit_price: it.returned_unit_price != null ? Number(it.returned_unit_price) : undefined,
          restock_inventory: true,
          drug_name: it.returned_drug_name,
          receipt_no: it.receipt_no || it.billing_code || resolvedReceipt,
          billing_code: it.billing_code || it.receipt_no || resolvedReceipt,
        };
      }),
      replacement_items: exchangeType === "exchange" ? replacementItems.map((it) => ({
        pharmacy_item_id: it.pharmacy_item_id || it.replacement_drug_id || "",
        quantity: Number(it.replacement_quantity || 1),
        unit_price: it.replacement_unit_price != null ? Number(it.replacement_unit_price) : undefined,
        drug_name: it.replacement_drug_name,
      })) : [],
      payment_method: balanceDifference > 0 ? paymentMethod : "NONE",
      pharmacist_name: pharmacistName || "Dispensing Pharmacist",
      pharmacy_unit_name: pharmacyUnitName || "Pharmacy Main",
    };

    try {
      const res = await submitDrugExchange(payload);
      toast.success(res.message || "Drug exchange submitted successfully.");
      onSuccess?.(res.data);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to process exchange.");
    } finally {
      setIsSubmitting(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl rounded-2xl border border-gray-200 bg-white shadow-2xl my-8 overflow-hidden dark:border-slate-800 dark:bg-slate-900 flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
              <FiCornerDownLeft className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Drug Return & Exchange
              </h2>
              <p className="text-xs text-gray-500">
                Verify physical payment receipt, select returned line items with partial quantity, and calculate balance settlement
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Multi-Step Indicator */}
        <div className="flex border-b border-gray-100 bg-gray-50/60 px-6 py-2.5 dark:border-slate-800 dark:bg-slate-800/40 text-xs font-semibold text-gray-500">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center gap-1.5 py-1 ${
              step === 1 ? "text-brand-700 font-bold dark:text-brand-300" : ""
            }`}
          >
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
              step === 1 ? "bg-brand-700 text-white" : "bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-200"
            }`}>1</span>
            Receipt Verification & Returned Drugs
          </button>

          <span className="mx-3 text-gray-300">/</span>

          <button
            type="button"
            disabled={returnedItems.length === 0}
            onClick={() => setStep(2)}
            className={`flex items-center gap-1.5 py-1 disabled:opacity-40 ${
              step === 2 ? "text-brand-700 font-bold dark:text-brand-300" : ""
            }`}
          >
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
              step === 2 ? "bg-brand-700 text-white" : "bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-200"
            }`}>2</span>
            Replacement Drug Selection
          </button>

          <span className="mx-3 text-gray-300">/</span>

          <button
            type="button"
            disabled={returnedItems.length === 0}
            onClick={() => setStep(3)}
            className={`flex items-center gap-1.5 py-1 disabled:opacity-40 ${
              step === 3 ? "text-brand-700 font-bold dark:text-brand-300" : ""
            }`}
          >
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
              step === 3 ? "bg-brand-700 text-white" : "bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-200"
            }`}>3</span>
            Settlement & Confirmation
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ================= STEP 1: RECEIPT & RETURNED DRUGS ================= */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Receipt Verification Lookup Card */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FiFileText className="text-brand-600" />
                    Step 1: Strict Anti-Theft Receipt Verification
                  </h3>
                  <span className="text-[11px] text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full font-semibold border border-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:border-brand-500/30">
                    Hospital Policy: Receipt Required
                  </span>
                </div>

                <form onSubmit={handleLookupReceipt} className="flex gap-2">
                  <div className="relative flex-1">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={receiptQuery}
                      onChange={(e) => setReceiptQuery(e.target.value)}
                      placeholder="Enter Payment Receipt Number (e.g. REC-20261004-001)..."
                      className="w-full rounded-xl border border-gray-200 bg-canvas-alt py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:text-slate-100 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearchingReceipt}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 shadow-xs disabled:opacity-50"
                  >
                    {isSearchingReceipt ? "Verifying..." : "Verify Receipt"}
                  </button>
                </form>

                {/* Patient Profile Card (If found/verified) */}
                {selectedPatient && (
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white font-bold">
                        {selectedPatient.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {selectedPatient.name}
                          </p>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                            Receipt Verified
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Receipt: <span className="font-mono font-bold text-brand-700 dark:text-brand-300">{selectedPatient.receipt_no || selectedBillCode}</span>
                          {selectedPatient.id && ` • PID: ${selectedPatient.id}`}
                          {selectedPatient.phone && ` • Phone: ${selectedPatient.phone}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedPatient.is_within_24_hours !== false ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                          Within 24-Hour Return Window
                        </span>
                      ) : (
                        <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                          Exceeds 24 Hours
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPatient(null);
                          setDispensedDrugs([]);
                          setReturnedItems([]);
                          setReceiptQuery("");
                        }}
                        className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        Lookup Another Receipt
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Previously Dispensed Medication for this Patient */}
              {selectedPatient && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Previously Dispensed Medication for this Patient ({dispensedDrugs.length})
                    </h4>
                    <span className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full font-medium dark:bg-amber-950/30 dark:text-amber-300">
                      24-Hour Return Window Policy
                    </span>
                  </div>

                  {isLoadingDispenses ? (
                    <div className="p-6 text-center text-xs text-gray-500">Loading dispense history...</div>
                  ) : dispensedDrugs.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-500 dark:border-slate-800 space-y-1">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">No eligible paid prescription records found within 24 hours.</p>
                      <p className="text-gray-400">Under hospital policy, drug returns and exchanges are only permitted for medications originating from a paid prescription dispensed within the last 24 hours.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs max-h-64 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 font-semibold border-b border-gray-200 dark:border-slate-700 sticky top-0">
                          <tr>
                            <th className="p-3">Drug Name</th>
                            <th className="p-3">Bill & Paid Date</th>
                            <th className="p-3 text-center">Dispensed</th>
                            <th className="p-3 text-center">Available Return</th>
                            <th className="p-3 text-right">Unit Price</th>
                            <th className="p-3 text-center">24h Eligibility</th>
                            <th className="p-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                          {dispensedDrugs.map((item) => {
                            const isAdded = returnedItems.some(
                              (it) =>
                                (it.pharmacy_request_item_id && it.pharmacy_request_item_id === item.pharmacy_request_item_id) ||
                                it.pharmacy_item_id === item.pharmacy_item_id
                            );
                            const available = item.available_to_return ?? item.quantity_dispensed ?? 0;
                            const isEligible = item.is_eligible_for_exchange !== false && item.is_within_24_hours !== false && available > 0 && !isAdded;

                            return (
                              <tr key={item.pharmacy_request_item_id || item.pharmacy_item_id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                                <td className="p-3">
                                  <p className="font-semibold text-slate-900 dark:text-slate-100">{item.drug_name}</p>
                                  {item.batch_number && (
                                    <p className="text-[11px] text-gray-500">
                                      Batch: {item.batch_number} {item.expiry_date && `| Exp: ${item.expiry_date}`}
                                    </p>
                                  )}
                                </td>
                                <td className="p-3 text-gray-600 dark:text-slate-300">
                                  <span className="font-mono font-medium text-brand-700 dark:text-brand-400 block">
                                    {item.billing_code || "Dispensed"}
                                  </span>
                                  <span className="text-[11px] text-gray-400">
                                    {item.dispensed_at ? formatDateTime(item.dispensed_at) : "—"}
                                  </span>
                                </td>
                                <td className="p-3 text-center font-medium">
                                  {item.quantity_dispensed}
                                </td>
                                <td className="p-3 text-center font-bold">
                                  <span
                                    className={`inline-block rounded-full px-2 py-0.5 text-[11px] ${
                                      available > 0
                                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                        : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400"
                                    }`}
                                  >
                                    {available} units
                                  </span>
                                </td>
                                <td className="p-3 text-right font-medium">
                                  {formatCurrency(item.unit_price)}
                                </td>
                                <td className="p-3 text-center">
                                  {item.is_within_24_hours === false || item.is_eligible_for_exchange === false ? (
                                    <span
                                      className="inline-block rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 cursor-help"
                                      title={item.exchange_ineligible_reason || "Payment was made more than 24 hours ago"}
                                    >
                                      &gt;24h (Ineligible)
                                    </span>
                                  ) : (
                                    <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                      Eligible (≤24h)
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-center">
                                  {isAdded ? (
                                    <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500 dark:bg-slate-800 dark:text-slate-400">
                                      Added
                                    </span>
                                  ) : available <= 0 ? (
                                    <span className="text-gray-400 italic text-[11px]">
                                      Fully Returned
                                    </span>
                                  ) : !isEligible ? (
                                    <span
                                      className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500"
                                      title={item.exchange_ineligible_reason || "Drug not eligible for exchange"}
                                    >
                                      Ineligible
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleSelectDispensedDrugToReturn(item)}
                                      className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-300"
                                    >
                                      + Return Drug
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Selected Returned Items Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center justify-between">
                  <span>Returned Items List ({returnedItems.length})</span>
                  {returnedItems.length > 0 && (
                    <span className="font-bold text-sm">
                      Total Credit Value: {formatCurrency(totalReturnValue)}
                    </span>
                  )}
                </h4>

                {returnedItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-xs text-gray-500 dark:border-slate-800">
                    No drugs added to the return list yet. Select an item from the dispense history or use manual entry above.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 font-semibold border-b border-gray-200 dark:border-slate-700">
                        <tr>
                          <th className="p-3">Drug Formulation</th>
                          <th className="p-3 text-center">Unit Price (₦)</th>
                          <th className="p-3 text-center">Qty</th>
                          <th className="p-3">Reason</th>
                          <th className="p-3">Condition & Restock</th>
                          <th className="p-3 text-right">Subtotal</th>
                          <th className="p-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {returnedItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                              {item.returned_drug_name}
                            </td>
                            <td className="p-3 text-center">
                              {formatCurrency(item.returned_unit_price ?? 0)}
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                min="1"
                                max={item.available_to_return || undefined}
                                value={item.returned_quantity}
                                onChange={(e) =>
                                  handleUpdateReturnedItem(
                                    idx,
                                    "returned_quantity",
                                    Math.max(1, Number(e.target.value) || 1)
                                  )
                                }
                                className="w-14 text-center rounded border border-gray-300 p-1 text-xs dark:bg-slate-800"
                              />
                            </td>
                            <td className="p-3">
                              <select
                                value={item.return_reason}
                                onChange={(e) =>
                                  handleUpdateReturnedItem(idx, "return_reason", e.target.value)
                                }
                                className="rounded border border-gray-200 bg-white p-1 text-xs dark:bg-slate-800"
                              >
                                {Object.entries(RETURN_REASON_LABELS).map(([k, label]) => (
                                  <option key={k} value={k}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3">
                              <span className="inline-block rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                                Good (Auto-Restocked)
                              </span>
                            </td>
                            <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100">
                              {formatCurrency(item.return_subtotal ?? 0)}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveReturnedItem(idx)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Remove"
                              >
                                <FiTrash2 />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= STEP 2: REPLACEMENT DRUG SELECTION ================= */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Return vs Exchange Toggle */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Step 2: Choose Transaction Type
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExchangeType("exchange")}
                    className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                      exchangeType === "exchange"
                        ? "border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/20 dark:border-brand-500/50 dark:bg-brand-500/10"
                        : "border-gray-200 bg-gray-50/50 hover:bg-gray-100 dark:border-slate-800 dark:bg-slate-800/40"
                    }`}
                  >
                    <FiRefreshCw className={`h-5 w-5 mt-0.5 ${exchangeType === "exchange" ? "text-brand-700" : "text-gray-400"}`} />
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Exchange for Replacement Medication
                      </p>
                      <p className="text-xs text-gray-500">
                        Swap returned item for a different medication from inventory. Calculate price difference.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExchangeType("return_only")}
                    className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                      exchangeType === "return_only"
                        ? "border-purple-500 bg-purple-50/60 ring-2 ring-purple-500/20 dark:border-purple-500/50 dark:bg-purple-500/10"
                        : "border-gray-200 bg-gray-50/50 hover:bg-gray-100 dark:border-slate-800 dark:bg-slate-800/40"
                    }`}
                  >
                    <FiDollarSign className={`h-5 w-5 mt-0.5 ${exchangeType === "return_only" ? "text-purple-700" : "text-gray-400"}`} />
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Return Only (Refund / Store Credit)
                      </p>
                      <p className="text-xs text-gray-500">
                        No replacement drug dispensed. Full credit refund of {formatCurrency(totalReturnValue)} to patient.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Replacement Drug Search & Selector (Only for Exchange) */}
              {exchangeType === "exchange" && (
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FiLayers className="text-brand-600" />
                    Select Replacement Medication from Dispensary Catalog
                  </h4>

                  <div className="flex gap-2 relative">
                    <div className="relative flex-1">
                      <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={replacementSearch}
                        onChange={(e) => setReplacementSearch(e.target.value)}
                        placeholder="Search replacement drug by name, generic name, or batch..."
                        className="w-full rounded-xl border border-gray-200 bg-canvas-alt py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  {/* Search Dropdown Results */}
                  {replacementSearch.trim().length > 1 && (
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800">
                      {isLoadingInventory ? (
                        <div className="p-4 text-center text-xs text-gray-400">Searching inventory...</div>
                      ) : availableInventoryDrugs.length === 0 ? (
                        <div className="p-4 text-center text-xs text-gray-500">No matching formulations found in dispensary.</div>
                      ) : (
                        availableInventoryDrugs.map((drug: BackendDrugItem) => (
                          <div
                            key={drug.id}
                            onClick={() => {
                              setSelectedReplacementDrug(drug);
                              setReplacementSearch(drug.name);
                            }}
                            className="flex items-center justify-between p-3 text-xs hover:bg-brand-50/50 cursor-pointer dark:hover:bg-slate-800/60"
                          >
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{drug.name}</p>
                              <p className="text-[11px] text-gray-500">
                                Stock: <strong>{drug.stock}</strong> | Batch: {drug.batch_number || "—"} | Exp: {drug.expiry_date || "—"}
                              </p>
                            </div>
                            <span className="font-bold text-brand-700 dark:text-brand-300">
                              {formatCurrency(drug.unit_price ?? 0)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Selected Replacement Drug Card */}
                  {selectedReplacementDrug && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50/30 p-3.5 dark:border-brand-500/30 dark:bg-brand-500/5">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {selectedReplacementDrug.name}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          Selling Price: {formatCurrency(selectedReplacementDrug.unit_price ?? 0)} • Avail: {selectedReplacementDrug.stock} units
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold">Qty:</label>
                        <input
                          type="number"
                          min="1"
                          max={selectedReplacementDrug.stock}
                          value={replacementQty}
                          onChange={(e) => setReplacementQty(e.target.value)}
                          className="w-16 rounded border border-gray-300 p-1 text-center text-xs dark:bg-slate-800"
                        />
                        <button
                          type="button"
                          onClick={handleAddReplacementDrug}
                          className="rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 shadow-xs"
                        >
                          + Add Item
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Replacement Items List Table */}
                  <div className="space-y-2 pt-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex justify-between">
                      <span>Replacement Items List ({replacementItems.length})</span>
                      <span>Total Replacement Cost: {formatCurrency(totalReplacementCost)}</span>
                    </h5>

                    {replacementItems.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-500 dark:border-slate-800">
                        No replacement drugs added yet. Search and select a drug above.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 font-semibold border-b border-gray-200 dark:border-slate-700">
                            <tr>
                              <th className="p-3">Drug Formulation</th>
                              <th className="p-3 text-center">Unit Price</th>
                              <th className="p-3 text-center">Qty</th>
                              <th className="p-3 text-right">Subtotal</th>
                              <th className="p-3 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {replacementItems.map((item, idx) => (
                              <tr key={idx}>
                                <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                                  {item.replacement_drug_name}
                                </td>
                                <td className="p-3 text-center">
                                  {formatCurrency(item.replacement_unit_price ?? 0)}
                                </td>
                                <td className="p-3 text-center font-bold">
                                  {item.replacement_quantity}
                                </td>
                                <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100">
                                  {formatCurrency(item.replacement_subtotal ?? 0)}
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveReplacementItem(idx)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                    title="Remove"
                                  >
                                    <FiTrash2 />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 3: FINANCIAL SETTLEMENT & REVIEW ================= */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Financial Calculation Breakdown Card */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Step 3: Financial Settlement & Summary
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/30 dark:bg-rose-950/20">
                    <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                      Total Returned Value (Credit)
                    </p>
                    <p className="text-xl font-black text-rose-800 dark:text-rose-200 mt-1">
                      {formatCurrency(totalReturnValue)}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {returnedItems.length} item(s) returned
                    </p>
                  </div>

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      Replacement Medication Cost
                    </p>
                    <p className="text-xl font-black text-emerald-800 dark:text-emerald-200 mt-1">
                      {formatCurrency(totalReplacementCost)}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {replacementItems.length} replacement item(s)
                    </p>
                  </div>

                  <div className={`rounded-xl border p-4 ${
                    balanceDifference > 0
                      ? "border-amber-300 bg-amber-50/60 dark:border-amber-900/30 dark:bg-amber-950/20"
                      : balanceDifference < 0
                      ? "border-purple-300 bg-purple-50/60 dark:border-purple-900/30 dark:bg-purple-950/20"
                      : "border-blue-300 bg-blue-50/60 dark:border-blue-900/30 dark:bg-blue-950/20"
                  }`}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-300">
                      Net Settlement Result
                    </p>
                    <p className={`text-xl font-black mt-1 ${
                      balanceDifference > 0
                        ? "text-amber-800 dark:text-amber-300"
                        : balanceDifference < 0
                        ? "text-purple-800 dark:text-purple-300"
                        : "text-blue-800 dark:text-blue-300"
                    }`}>
                      {balanceDifference > 0
                        ? `+ ${formatCurrency(balanceDifference)} Due`
                        : balanceDifference < 0
                        ? `- ${formatCurrency(Math.abs(balanceDifference))} Refund`
                        : "Even Swap (₦0)"}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {balanceDifference > 0
                        ? "Patient pays additional balance"
                        : balanceDifference < 0
                        ? "Refund/Credit due to patient"
                        : "Zero balance exchange"}
                    </p>
                  </div>
                </div>

                {/* Additional Payment Options (If balance > 0) */}
                {balanceDifference > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-2 dark:border-amber-900/30 dark:bg-amber-950/20">
                    <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      Payment Method for Additional Balance ({formatCurrency(balanceDifference)}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(["CASH", "POS", "TRANSFER"] as PaymentMethod[]).map((pm) => (
                        <button
                          key={pm}
                          type="button"
                          onClick={() => setPaymentMethod(pm)}
                          className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                            paymentMethod === pm
                              ? "bg-brand-700 text-white shadow-xs"
                              : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-200"
                          }`}
                        >
                          {pm} Payment
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Refund Notice (If balance < 0) */}
                {balanceDifference < 0 && (
                  <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 text-xs text-purple-900 dark:border-purple-900/30 dark:bg-purple-950/20">
                    <p className="font-bold">Refund Settlement Notice:</p>
                    <p className="text-purple-700 dark:text-purple-300 mt-0.5">
                      A cash refund / wallet reversal voucher of <strong>{formatCurrency(Math.abs(balanceDifference))}</strong> will be generated upon transaction confirmation.
                    </p>
                  </div>
                )}

                {/* Remarks & Notes */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                    Clinical / Operational Remarks (Optional):
                  </label>
                  <textarea
                    rows={2}
                    value={generalRemarks}
                    onChange={(e) => setGeneralRemarks(e.target.value)}
                    placeholder="e.g. Approved exchange per Dr. Okon's revised prescription..."
                    className="w-full rounded-xl border border-gray-200 bg-canvas-alt p-3 text-xs outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                &larr; Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Cancel
            </button>

            {step < 3 ? (
              <button
                type="button"
                disabled={returnedItems.length === 0}
                onClick={() => setStep((s) => (s + 1) as any)}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-5 py-2 text-xs font-semibold text-white hover:bg-brand-600 shadow-xs disabled:opacity-50"
              >
                Continue &rarr;
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting || returnedItems.length === 0}
                onClick={handleFinalSubmit}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-600 shadow-sm disabled:opacity-50"
              >
                <FiCheckCircle />
                {isSubmitting ? "Processing..." : "Process & Finalize Exchange"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
