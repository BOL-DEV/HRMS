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
  getPharmacyRequests,
  lookupPatientForPharmacy,
  getPharmacyWalkInPatient,
  unwrapPharmacyData,
  BackendDrugItem,
} from "@/libs/pharmacy-api";
import {
  ReturnReason,
  DrugCondition,
  PaymentMethod,
  ExchangeReturnedItem,
  ExchangeReplacementItem,
  CreateDrugExchangePayload,
  RETURN_REASON_LABELS,
  DRUG_CONDITION_LABELS,
  generateExchangeCode,
  DrugExchangeRecord,
} from "@/libs/pharmacy-exchange";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (record: DrugExchangeRecord) => void;
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
  // Step State: 1 = Patient & Return Selection, 2 = Replacement & Calculation, 3 = Settlement & Review
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Patient Lookup State
  const [patientQuery, setPatientQuery] = useState("");
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{
    id: string;
    name: string;
    phone: string;
    hospital_number?: string;
  } | null>(null);

  // Dispense History State
  const [patientDispenses, setPatientDispenses] = useState<any[]>([]);
  const [isLoadingDispenses, setIsLoadingDispenses] = useState(false);
  const [selectedBillCode, setSelectedBillCode] = useState<string>("");

  // Returned Items State
  const [returnedItems, setReturnedItems] = useState<ExchangeReturnedItem[]>([]);
  const [manualReturnOpen, setManualReturnOpen] = useState(false);

  // Manual Form State for Return
  const [manualDrugName, setManualDrugName] = useState("");
  const [manualUnitPrice, setManualUnitPrice] = useState("");
  const [manualQty, setManualQty] = useState("1");
  const [manualReason, setManualReason] = useState<ReturnReason>("PHYSICIAN_CHANGE");
  const [manualCondition, setManualCondition] = useState<DrugCondition>("INTACT_RESELLABLE");
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

  // Financial Calculations (Hooks must be unconditional at top level)
  const totalReturnValue = useMemo(() => {
    return returnedItems.reduce((sum, item) => sum + item.return_subtotal, 0);
  }, [returnedItems]);

  const totalReplacementCost = useMemo(() => {
    if (exchangeType === "return_only") return 0;
    return replacementItems.reduce((sum, item) => sum + item.replacement_subtotal, 0);
  }, [replacementItems, exchangeType]);

  const balanceDifference = useMemo(() => {
    return totalReplacementCost - totalReturnValue;
  }, [totalReplacementCost, totalReturnValue]);

  // Reset modal state on close/open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setPatientQuery("");
      setSelectedPatient(null);
      setPatientDispenses([]);
      setSelectedBillCode("");
      setReturnedItems([]);
      setReplacementItems([]);
      setExchangeType("exchange");
      setGeneralRemarks("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Handle Patient Search (PID, Hospital Number, Name, Phone, or Billing Code)
  const handleSearchPatient = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = patientQuery.trim();
    if (!q) {
      toast.error("Please enter a Patient ID, Hospital Number, Phone, or Billing Code.");
      return;
    }

    setIsSearchingPatient(true);
    setIsLoadingDispenses(true);
    try {
      let matchedPatient: {
        id: string;
        name: string;
        phone: string;
        hospital_number?: string;
      } | null = null;

      // 1. First, try the existing Patient Lookup endpoint: GET /api/pharmacy/patients/:patient_id
      try {
        const lookupRes = await lookupPatientForPharmacy(q);
        const patientObj = (lookupRes as any)?.patient || (lookupRes as any)?.data?.patient || lookupRes;
        if (patientObj && patientObj.patient_name) {
          matchedPatient = {
            id: patientObj.patient_id || q,
            name: patientObj.patient_name,
            phone: patientObj.phone_number || "",
            hospital_number: (patientObj as any)?.hospital_number || (patientObj as any)?.patient_code || undefined,
          };
        }
      } catch {
        // Fallback to walk-in if numeric/phone
      }

      // 2. If not found by patient ID, try Walk-In endpoint: GET /api/pharmacy/walk-in/:phoneNumber
      if (!matchedPatient && /^\d{8,14}$/.test(q)) {
        try {
          const walkRes = await getPharmacyWalkInPatient(q);
          const walkData = (walkRes as any)?.data || walkRes;
          if (walkData?.patient_name) {
            matchedPatient = {
              id: "WALK_IN",
              name: walkData.patient_name,
              phone: q,
            };
          }
        } catch {
          // continue fallback
        }
      }

      // 3. Query Dispense requests to find matching patient history & billing requests
      let patientDispenseList: any[] = [];
      try {
        const requestsRes = await getPharmacyRequests({ status: "dispensed", limit: 30 });
        const list = unwrapPharmacyData<any>(requestsRes, []);
        const rawList = Array.isArray(list) ? list : list?.requests ?? list?.items ?? [];

        // Check if query matches a specific billing code directly
        const matchedByBillCode = rawList.filter(
          (r: any) => r.billing_code?.toLowerCase() === q.toLowerCase()
        );

        if (matchedByBillCode.length > 0) {
          patientDispenseList = matchedByBillCode;
          const targetBill = matchedByBillCode[0];
          if (!matchedPatient) {
            matchedPatient = {
              id: targetBill.patient_id || "WALK_IN",
              name: targetBill.patient_name || "Patient",
              phone: targetBill.phone_number || "",
            };
          }
          setSelectedBillCode(targetBill.billing_code);
        } else {
          // Filter by patient ID, phone, or name
          patientDispenseList = rawList.filter((r: any) => {
            if (!r) return false;
            const matchPid = matchedPatient?.id && r.patient_id?.toLowerCase() === matchedPatient.id.toLowerCase();
            const matchPhone = (matchedPatient?.phone || q) && r.phone_number?.includes(matchedPatient?.phone || q);
            const matchName = (matchedPatient?.name || q) && r.patient_name?.toLowerCase().includes((matchedPatient?.name || q).toLowerCase());
            return matchPid || matchPhone || matchName;
          });
        }

        // If patient not matched from API yet, but found in dispense history
        if (!matchedPatient && patientDispenseList.length > 0) {
          const first = patientDispenseList[0];
          matchedPatient = {
            id: first.patient_id || "PATIENT-RECORD",
            name: first.patient_name || `Patient (${q})`,
            phone: first.phone_number || (isDigitsOnly(q) ? q : ""),
          };
        }
      } catch {
        patientDispenseList = [];
      }

      // 4. Default fallback if patient is new or returning without digital history
      if (!matchedPatient) {
        matchedPatient = {
          id: /^[a-zA-Z0-9_-]{3,20}$/.test(q) ? q : "WALK_IN",
          name: isDigitsOnly(q) ? `Patient (${q})` : q,
          phone: isDigitsOnly(q) ? q : "",
        };
        toast("No registered patient record found. Enter return details manually.");
      } else {
        toast.success(`Patient loaded: ${matchedPatient.name}`);
      }

      setSelectedPatient(matchedPatient);
      setPatientDispenses(patientDispenseList);
    } catch {
      toast.error("Could not complete patient search.");
    } finally {
      setIsSearchingPatient(false);
      setIsLoadingDispenses(false);
    }
  };

  function isDigitsOnly(val: string) {
    return /^\d+$/.test(val);
  }

  // Add Item from Previous Dispense History
  const handleSelectDispensedDrugToReturn = (bill: any, item: any) => {
    const existing = returnedItems.find((it) => it.returned_drug_id === item.pharmacy_item_id);
    if (existing) {
      toast("This item is already added to the return list.");
      return;
    }

    const unitPrice = item.unit_price || 0;
    const qty = 1;
    const newItem: ExchangeReturnedItem = {
      returned_drug_id: item.pharmacy_item_id || item.id || `ret-${Date.now()}`,
      returned_drug_name: item.name || item.item_name || "Dispensed Formulation",
      returned_unit_price: unitPrice,
      returned_quantity: qty,
      return_subtotal: unitPrice * qty,
      return_reason: "PHYSICIAN_CHANGE",
      drug_condition: "INTACT_RESELLABLE",
      restock_to_inventory: true,
    };

    setReturnedItems((prev) => [...prev, newItem]);
    setSelectedBillCode(bill.billing_code || bill.id);
    toast.success(`Added "${newItem.returned_drug_name}" to return list.`);
  };

  // Add Manual Return Item
  const handleAddManualReturnItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDrugName.trim() || !manualUnitPrice || Number(manualUnitPrice) <= 0) {
      toast.error("Please enter a valid drug name and original purchase unit price.");
      return;
    }

    const price = Number(manualUnitPrice);
    const qty = Math.max(1, Number(manualQty) || 1);
    const newItem: ExchangeReturnedItem = {
      returned_drug_id: `manual-ret-${Date.now()}`,
      returned_drug_name: manualDrugName.trim(),
      returned_unit_price: price,
      returned_quantity: qty,
      return_subtotal: price * qty,
      return_reason: manualReason,
      reason_notes: manualNotes.trim() || undefined,
      drug_condition: manualCondition,
      restock_to_inventory: manualCondition === "INTACT_RESELLABLE",
    };

    setReturnedItems((prev) => [...prev, newItem]);
    setManualDrugName("");
    setManualUnitPrice("");
    setManualQty("1");
    setManualNotes("");
    setManualReturnOpen(false);
    toast.success(`Added manual return: "${newItem.returned_drug_name}"`);
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
        target.return_subtotal = target.returned_quantity * target.returned_unit_price;
      }
      if (field === "drug_condition") {
        target.restock_to_inventory = value === "INTACT_RESELLABLE";
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
  const handleFinalSubmit = () => {
    if (!selectedPatient) {
      toast.error("Patient information is missing.");
      return;
    }

    if (returnedItems.length === 0) {
      toast.error("Please add at least one returned medication.");
      return;
    }

    if (exchangeType === "exchange" && replacementItems.length === 0) {
      toast.error("Please select a replacement medication or switch to 'Return Only'.");
      return;
    }

    setIsSubmitting(true);

    const payload: CreateDrugExchangePayload = {
      original_billing_code: selectedBillCode || undefined,
      patient_id: selectedPatient.id,
      patient_name: selectedPatient.name,
      phone_number: selectedPatient.phone,
      hospital_number: selectedPatient.hospital_number,
      returned_items: returnedItems,
      replacement_items: exchangeType === "exchange" ? replacementItems : [],
      payment_method: balanceDifference > 0 ? paymentMethod : "NONE",
      remarks: generalRemarks.trim() || undefined,
      pharmacist_name: pharmacistName || "Dispensing Pharmacist",
      pharmacy_unit_name: pharmacyUnitName || "Pharmacy Main",
    };

    // Process record using module handler
    import("@/libs/pharmacy-exchange").then(async (mod) => {
      try {
        const res = await mod.processDrugExchange(payload);
        toast.success(res.message);
        onSuccess(res.data);
        onClose();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to process exchange.");
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl border border-gray-200 bg-white shadow-2xl my-8 overflow-hidden dark:border-slate-800 dark:bg-slate-900 flex flex-col max-h-[90vh]">
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
                Process patient returned medication, select replacements, and calculate balance settlement
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
            Patient & Returned Drugs
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
          {/* ================= STEP 1: PATIENT & RETURNED DRUGS ================= */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Patient Lookup Card */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FiUser className="text-brand-600" />
                  Step 1: Patient Search & Dispense History
                </h3>

                <form onSubmit={handleSearchPatient} className="flex gap-2">
                  <div className="relative flex-1">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={patientQuery}
                      onChange={(e) => setPatientQuery(e.target.value)}
                      placeholder="Search by Patient ID (PID), Hospital Number, Phone, or Name..."
                      className="w-full rounded-xl border border-gray-200 bg-canvas-alt py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:text-slate-100"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearchingPatient}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 shadow-xs disabled:opacity-50"
                  >
                    {isSearchingPatient ? "Searching..." : "Lookup Patient"}
                  </button>
                </form>

                {/* Patient Profile Card (If found/selected) */}
                {selectedPatient && (
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-brand-200 bg-brand-50/50 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white font-bold">
                        {selectedPatient.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {selectedPatient.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          PID / HN: <span className="font-mono font-semibold text-brand-700 dark:text-brand-300">{selectedPatient.id}</span>
                          {selectedPatient.phone && ` • Phone: ${selectedPatient.phone}`}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                      Patient Verified
                    </span>
                  </div>
                )}
              </div>

              {/* Previously Dispensed Bills & Medication Accordion */}
              {selectedPatient && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Previously Dispensed Medication for this Patient
                    </h4>
                    <button
                      type="button"
                      onClick={() => setManualReturnOpen(true)}
                      className="text-xs font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-400"
                    >
                      + Manual Return Entry
                    </button>
                  </div>

                  {isLoadingDispenses ? (
                    <div className="p-6 text-center text-xs text-gray-500">Loading dispense history...</div>
                  ) : patientDispenses.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-500 dark:border-slate-800">
                      No previous digital dispense records found. Click <strong>&quot;Manual Return Entry&quot;</strong> to record a walk-in return.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-48 overflow-y-auto">
                      {patientDispenses.map((bill: any) => (
                        <div
                          key={bill.id}
                          className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                        >
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2 dark:border-slate-800 text-xs">
                            <span className="font-mono font-bold text-brand-700 dark:text-brand-400">
                              Bill Code: {bill.billing_code || bill.id}
                            </span>
                            <span className="text-gray-400">
                              {formatDateTime(bill.created_at)}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {(bill.items || []).map((item: any) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between rounded-lg bg-gray-50 p-2 text-xs dark:bg-slate-800/60"
                              >
                                <div>
                                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                                    {item.name || item.item_name}
                                  </p>
                                  <p className="text-[11px] text-gray-500">
                                    Dispensed: {item.quantity} units @ {formatCurrency(item.unit_price)} each
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleSelectDispensedDrugToReturn(bill, item)}
                                  className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-300"
                                >
                                  Return Item &rarr;
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Manual Return Modal Form (Drawer / Subcard) */}
              {manualReturnOpen && (
                <div className="rounded-2xl border-2 border-brand-200 bg-brand-50/30 p-4 dark:border-brand-500/30 dark:bg-brand-500/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-brand-900 dark:text-brand-200">
                      Manual Return Formulation Entry
                    </h4>
                    <button
                      type="button"
                      onClick={() => setManualReturnOpen(false)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      <FiX />
                    </button>
                  </div>

                  <form onSubmit={handleAddManualReturnItem} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold mb-1">Drug / Formulation Name *</label>
                      <input
                        type="text"
                        value={manualDrugName}
                        onChange={(e) => setManualDrugName(e.target.value)}
                        placeholder="e.g. Paracetamol 500mg"
                        className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs outline-none dark:bg-slate-800 dark:border-slate-700"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Original Purchase Unit Price (₦) *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={manualUnitPrice}
                        onChange={(e) => setManualUnitPrice(e.target.value)}
                        placeholder="e.g. 1500"
                        className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs outline-none dark:bg-slate-800 dark:border-slate-700"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Quantity Returned *</label>
                      <input
                        type="number"
                        min="1"
                        value={manualQty}
                        onChange={(e) => setManualQty(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs outline-none dark:bg-slate-800 dark:border-slate-700"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Reason for Return *</label>
                      <select
                        value={manualReason}
                        onChange={(e) => setManualReason(e.target.value as ReturnReason)}
                        className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs outline-none dark:bg-slate-800 dark:border-slate-700"
                      >
                        {Object.entries(RETURN_REASON_LABELS).map(([k, label]) => (
                          <option key={k} value={k}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-semibold mb-1">Condition of Returned Drug *</label>
                      <select
                        value={manualCondition}
                        onChange={(e) => setManualCondition(e.target.value as DrugCondition)}
                        className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs outline-none dark:bg-slate-800 dark:border-slate-700"
                      >
                        <option value="INTACT_RESELLABLE">Intact / Sealed / Resellable (Restock to inventory)</option>
                        <option value="OPENED_DAMAGED">Opened / Damaged / Broken Seal (Quarantine for disposal)</option>
                        <option value="EXPIRED">Expired Formulation (Destroy audit log)</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setManualReturnOpen(false)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-brand-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 shadow-xs"
                      >
                        Add to Return List
                      </button>
                    </div>
                  </form>
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
                              {formatCurrency(item.returned_unit_price)}
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                min="1"
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
                              <select
                                value={item.drug_condition}
                                onChange={(e) =>
                                  handleUpdateReturnedItem(idx, "drug_condition", e.target.value)
                                }
                                className="rounded border border-gray-200 bg-white p-1 text-xs dark:bg-slate-800"
                              >
                                <option value="INTACT_RESELLABLE">Intact (Restock +Qty)</option>
                                <option value="OPENED_DAMAGED">Opened (Quarantine)</option>
                                <option value="EXPIRED">Expired (Destruction)</option>
                              </select>
                            </td>
                            <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100">
                              {formatCurrency(item.return_subtotal)}
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
                              <th className="p-3">Batch & Expiry</th>
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
                                  {formatCurrency(item.replacement_unit_price)}
                                </td>
                                <td className="p-3 text-center font-bold">
                                  {item.replacement_quantity}
                                </td>
                                <td className="p-3 text-gray-500">
                                  {item.batch_number || "—"} | {item.expiry_date || "—"}
                                </td>
                                <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100">
                                  {formatCurrency(item.replacement_subtotal)}
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveReplacementItem(idx)}
                                    className="text-red-500 hover:text-red-700 p-1"
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
