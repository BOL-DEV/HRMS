"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import Header from "@/components/shared/Header";
import { formatCurrency, formatDateTime } from "@/libs/helper";
import { FiPlus, FiTrash2, FiCheck, FiX, FiPrinter } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { decodeJwt, getAgentAccessToken } from "@/libs/auth";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPharmacyInventory,
  createPharmacyRequest,
  lookupPatientForPharmacy,
  BackendDrugItem,
  PatientMatchItem,
  GetPharmacyInventoryResponse,
  PharmacyBillingRequest,
  unwrapPharmacyData,
  payPharmacyRequestSelf,
  getPharmacyProfile,
  searchPharmacyHospitalPatients,
} from "@/libs/pharmacy-api";

interface PharmacyBillItem {
  drugId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface PharmacyBill {
  id: string;
  billing_code: string;
  patient_id: string;
  patient_name: string;
  phone_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  departmentName?: string;
  items: {
    id: string;
    pharmacy_item_id: string;
    name: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }[];
}


function getAllowPharmacySelfPay(accessToken: string | null) {
  if (!accessToken) return false;

  const decoded = decodeJwt(accessToken);
  const user = decoded?.user ?? decoded?.data ?? decoded ?? {};
  const hospital =
    user.hospital ??
    user.hospital_settings ??
    user.settings ??
    decoded?.hospital ??
    decoded?.hospital_settings ??
    decoded?.settings ??
    {};

  return (
    readBooleanClaim(decoded?.allow_pharmacy_self_pay) ??
    readBooleanClaim(decoded?.allowPharmacySelfPay) ??
    readBooleanClaim(user.allow_pharmacy_self_pay) ??
    readBooleanClaim(user.allowPharmacySelfPay) ??
    readBooleanClaim(hospital.allow_pharmacy_self_pay) ??
    readBooleanClaim(hospital.allowPharmacySelfPay) ??
    readBooleanClaim(decoded?.identity?.allow_pharmacy_self_pay) ??
    readBooleanClaim(decoded?.identity?.allowPharmacySelfPay) ??
    readBooleanClaim(decoded?.identity?.hospital?.allow_pharmacy_self_pay) ??
    readBooleanClaim(decoded?.identity?.hospital?.allowPharmacySelfPay) ??
    readBooleanClaim(decoded?.identity?.hospital_settings?.allow_pharmacy_self_pay) ??
    readBooleanClaim(decoded?.identity?.hospital_settings?.allowPharmacySelfPay) ??
    false
  );
}

function readBooleanClaim(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return undefined;
}

function getAllowPharmacyWalkIn(accessToken: string | null) {
  if (!accessToken) return false;

  const decoded = decodeJwt(accessToken);
  const user = decoded?.user ?? decoded?.data ?? decoded ?? {};
  const hospital =
    user.hospital ??
    user.hospital_settings ??
    user.settings ??
    decoded?.hospital ??
    decoded?.hospital_settings ??
    decoded?.settings ??
    {};

  return (
    readBooleanClaim(user.allow_pharmacy_walk_in) ??
    readBooleanClaim(user.allowPharmacyWalkIn) ??
    readBooleanClaim(hospital.allow_pharmacy_walk_in) ??
    readBooleanClaim(hospital.allowPharmacyWalkIn) ??
    false
  );
}

export default function PharmacyDispensePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = typeof window !== "undefined" ? getAgentAccessToken() : null;

  const allowPharmacyWalkIn = useMemo(
    () => getAllowPharmacyWalkIn(accessToken),
    [accessToken],
  );

  const { data: profileQueryData } = useQuery({
    queryKey: ["pharmacy-profile-selfpay-check"],
    queryFn: getPharmacyProfile,
    enabled: Boolean(accessToken),
  });

  const allowPharmacySelfPay = useMemo(() => {
    const tokenClaim = getAllowPharmacySelfPay(accessToken);
    if (tokenClaim) return true;

    const profile = profileQueryData?.data;
    if (profile) {
      const hospital = (profile as any).hospital ?? {};
      const selfPay =
        readBooleanClaim((profile as any).allow_pharmacy_self_pay) ??
        readBooleanClaim((profile as any).allowPharmacySelfPay) ??
        readBooleanClaim(hospital.allow_pharmacy_self_pay) ??
        readBooleanClaim(hospital.allowPharmacySelfPay) ??
        readBooleanClaim(hospital.allowSelfPay);
      if (selfPay !== undefined) {
        return selfPay;
      }
    }

    return true;
  }, [accessToken, profileQueryData]);

  const selfPayMutation = useMutation({
    mutationFn: (requestId: string) => payPharmacyRequestSelf(requestId, "cash"),
    onSuccess: () => {
      toast.success("Prescription cleared and dispensed successfully (Self Pay).");
      setGeneratedBill(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to clear request.");
    },
  });
  const [isWalkIn, setIsWalkIn] = useState(false);

  const handleWalkInChange = (checked: boolean) => {
    setIsWalkIn(checked);
    if (checked) {
      setPatientId("WALK_IN");
      setPatientName("");
      setPatientPhone("");
      setPatientSearch("");
    } else {
      setPatientId("");
      setPatientName("");
      setPatientPhone("");
    }
  };

  // Form patient state
  const [patientId, setPatientId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");

  // Patient Autocomplete State
  const [patientSearch, setPatientSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const drugPickerRef = useRef<HTMLDivElement>(null);

  // Drug Select State
  const [selectedDrugId, setSelectedDrugId] = useState("");
  const [drugSearch, setDrugSearch] = useState("");
  const [showDrugSuggestions, setShowDrugSuggestions] = useState(false);
  const [dispenseQty, setDispenseQty] = useState("1");

  // Selected Items List
  const [billItems, setBillItems] = useState<PharmacyBillItem[]>([]);

  // Generated bill modal
  const [generatedBill, setGeneratedBill] = useState<PharmacyBill | null>(null);

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  // Click away listener for autocomplete
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (drugPickerRef.current && !drugPickerRef.current.contains(e.target as Node)) {
        setShowDrugSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Fetch Inventory for selection (active, in stock, unexpired)
  const { data: inventoryData } = useQuery({
    queryKey: ["pharmacy-inventory-all"],
    queryFn: () => getPharmacyInventory({ limit: 100 }),
    enabled: Boolean(accessToken),
  });

  const inventory = useMemo<BackendDrugItem[]>(() => {
    const rawData = unwrapPharmacyData<GetPharmacyInventoryResponse | null>(inventoryData, null);
    return (rawData?.items ?? []).filter(
      (d: BackendDrugItem) => d.stock > 0 && d.status.toLowerCase() !== "expired"
    );
  }, [inventoryData]);

  const hospitalId = profileQueryData?.data?.hospital_id ?? "";

  // Patient Search query for autocomplete matching names/IDs/phone numbers
  const patientSearchQuery = useQuery({
    queryKey: ["pharmacy-patient-search", hospitalId, patientSearch],
    queryFn: () =>
      searchPharmacyHospitalPatients(hospitalId, {
        query: patientSearch,
        limit: 10,
      }),
    enabled: Boolean(accessToken && hospitalId && patientSearch.trim().length > 0),
  });

  const patientSuggestions = useMemo(() => {
    return patientSearchQuery.data?.data?.patients ?? [];
  }, [patientSearchQuery.data]);

  // Create Request Mutation
  const createRequestMutation = useMutation({
    mutationFn: createPharmacyRequest,
    onSuccess: (response) => {
      const newRequest = unwrapPharmacyData<PharmacyBillingRequest>(response, response as PharmacyBillingRequest);
      // Map to local PharmacyBill preview format
      const previewBill: PharmacyBill = {
        id: newRequest.id,
        billing_code: newRequest.billing_code,
        patient_id: newRequest.patient_id,
        patient_name: newRequest.patient_name,
        phone_number: newRequest.phone_number,
        total_amount: newRequest.total_amount,
        status: newRequest.status,
        created_at: newRequest.created_at,
        departmentName: "Pharmacy",
        items: billItems.map((item) => ({
          id: item.drugId,
          pharmacy_item_id: item.drugId,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          amount: item.amount,
        })),
      };

      setGeneratedBill(previewBill);
      toast.success(`Bill generated successfully: ${newRequest.billing_code}`);
      handleResetForm();
      queryClient.invalidateQueries({ queryKey: ["pharmacy-inventory-all"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to generate pharmacy request.");
    },
  });

  const selectedDrug = useMemo(() => {
    return inventory.find((d: BackendDrugItem) => d.id === selectedDrugId) ?? null;
  }, [selectedDrugId, inventory]);

  const filteredInventory = useMemo(() => {
    const query = drugSearch.trim().toLowerCase();
    if (!query) {
      return inventory;
    }

    return inventory.filter((drug) => {
      const haystack = [
        drug.name,
        drug.generic_name,
        drug.category_name,
        drug.batch_number,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [drugSearch, inventory]);

  // Add Item to Bill
  const handleAddItem = () => {
    if (!selectedDrugId || !selectedDrug) {
      toast.error("Please select a formulation/drug.");
      return;
    }

    const qty = Number(dispenseQty);
    if (isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
      toast.error("Enter a valid integer quantity.");
      return;
    }

    if (qty > selectedDrug.stock) {
      toast.error(`Insufficient stock. Only ${selectedDrug.stock} units available.`);
      return;
    }

    // Check duplicate
    if (billItems.some((item) => item.drugId === selectedDrugId)) {
      toast.error("This formulation has already been added. Remove it first to change quantity.");
      return;
    }

    const newItem: PharmacyBillItem = {
      drugId: selectedDrug.id,
      name: selectedDrug.name,
      quantity: qty,
      unitPrice: selectedDrug.unit_price,
      amount: selectedDrug.unit_price * qty,
    };

    setBillItems((current) => [...current, newItem]);
    setSelectedDrugId("");
    setDrugSearch("");
    setShowDrugSuggestions(false);
    setDispenseQty("1");
  setIsWalkIn(false);
  }

  // Remove Item
  const handleRemoveItem = (drugId: string) => {
    setBillItems((current) => current.filter((item) => item.drugId !== drugId));
  };

  // Calculate Total
  const totalAmount = useMemo(() => {
    return billItems.reduce((sum, item) => sum + item.amount, 0);
  }, [billItems]);

  // Reset form
  const handleResetForm = () => {
    setPatientId("");
    setPatientName("");
    setPatientPhone("");
    setPatientSearch("");
    setBillItems([]);
    setSelectedDrugId("");
    setDrugSearch("");
    setShowDrugSuggestions(false);
    setDispenseQty("1");
  };

  // Submit Prescription / Generate Code
  const handleGenerateBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientId.trim() || !patientName.trim() || !patientPhone.trim()) {
      toast.error("Please fill in all patient details.");
      return;
    }

    if (billItems.length === 0) {
      toast.error("Add at least one formulation to dispense.");
      return;
    }

    createRequestMutation.mutate({
      patient_id: patientId.trim(),
      patient_name: patientName.trim(),
      phone_number: patientPhone.trim(),
      items: billItems.map((item) => ({
        pharmacy_item_id: item.drugId,
        quantity: item.quantity,
      })),
    });
  };

  if (!accessToken) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-canvas">
      <Header
        title="Dispense Medications"
        Subtitle="Initiate prescriptions, build itemised drug bills, and generate cashier payment codes"
      />

      <div className="p-6">
        <form onSubmit={handleGenerateBillSubmit} className="grid gap-6 lg:grid-cols-3">
          {/* Patient Form & Drug Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Patient Information</h2>
                {allowPharmacyWalkIn && (
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isWalkIn}
                      onChange={(e) => handleWalkInChange(e.target.checked)}
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-200">Walk-In Customer</span>
                  </label>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2" ref={containerRef}>
                <div className="relative block">
                  <span className="mb-2 block text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                    Patient ID / Card Number
                  </span>
                  <input
                    type="text"
                    value={isWalkIn ? "WALK_IN" : patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      if (!e.target.value.trim()) {
                        setPatientId("");
                        setPatientName("");
                        setPatientPhone("");
                      }
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Search by ID, name, or phone..."
                    disabled={isWalkIn}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-canvas dark:text-white disabled:opacity-60 disabled:bg-gray-50 dark:disabled:bg-slate-950"
                    required
                  />

                  {showSuggestions && patientSuggestions.length > 0 ? (
                    <div className="absolute left-0 right-0 z-30 mt-1 max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                      {patientSuggestions.map((pat: any) => (
                        <button
                          key={pat.patient_id}
                          type="button"
                          onClick={() => {
                            setPatientId(pat.patient_id);
                            setPatientName(pat.patient_name);
                            setPatientPhone(pat.phone_number);
                            setPatientSearch(pat.display_value || pat.patient_name);
                            setShowSuggestions(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-150 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-b border-gray-50 dark:border-slate-800 last:border-b-0 transition"
                        >
                          <p className="font-semibold">{pat.display_value || pat.patient_name}</p>
                          <p className="text-xs text-gray-500">ID: {pat.patient_id} | Phone: {pat.phone_number}</p>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                    Patient Full Name
                  </span>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-canvas dark:text-white"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                    Phone Number
                  </span>
                  <input
                    type="tel"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="e.g. 08012345678"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-canvas dark:text-white"
                    required
                  />
                </label>

                <div className="rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3 text-sm text-gray-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Billing Department
                  </span>
                  Pharmacy
                </div>
              </div>
            </div>

            {/* Formulation Add Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Add Formulations</h2>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="relative flex-1" ref={drugPickerRef}>
                  <span className="mb-2 block text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                    Formulation / Drug
                  </span>
                  <input
                    type="text"
                    value={drugSearch}
                    onFocus={() => setShowDrugSuggestions(true)}
                    onChange={(e) => {
                      setDrugSearch(e.target.value);
                      setSelectedDrugId("");
                      setShowDrugSuggestions(true);
                    }}
                    placeholder="Search drug name, generic name, category, or batch..."
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-canvas dark:text-white"
                  />

                  {showDrugSuggestions ? (
                    <div className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                      {filteredInventory.length === 0 ? (
                        <div className="px-4 py-5 text-center text-sm text-gray-500">
                          No matching drugs in stock.
                        </div>
                      ) : (
                        filteredInventory.map((drug) => (
                          <button
                            key={drug.id}
                            type="button"
                            onClick={() => {
                              setSelectedDrugId(drug.id);
                              setDrugSearch(drug.name);
                              setShowDrugSuggestions(false);
                            }}
                            className="w-full border-b border-gray-50 px-4 py-3 text-left text-sm transition last:border-b-0 hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-800"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white">{drug.name}</p>
                                <p className="text-xs text-gray-500">
                                  {drug.generic_name || drug.category_name} | Stock: {drug.stock}
                                </p>
                              </div>
                              <span className="shrink-0 font-semibold text-brand-700 dark:text-brand-300">
                                {formatCurrency(drug.unit_price)}
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>

                <label className="block sm:w-32">
                  <span className="mb-2 block text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                    Quantity
                  </span>
                  <input
                    type="number"
                    value={dispenseQty}
                    onChange={(e) => setDispenseQty(e.target.value)}
                    min="1"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-canvas dark:text-white"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="rounded-xl bg-slate-900 dark:bg-slate-800 px-5 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 dark:hover:bg-slate-700 flex items-center gap-2 justify-center shadow-sm"
                >
                  <FiPlus />
                  Add
                </button>
              </div>

              {selectedDrug ? (
                <p className="mt-3 text-xs text-brand-700 dark:text-brand-400 font-semibold">
                  Unit Price: {formatCurrency(selectedDrug.unit_price)} | Stock available: {selectedDrug.stock} {selectedDrug.generic_name ? `(${selectedDrug.generic_name})` : ""}
                </p>
              ) : null}
            </div>
          </div>

          {/* Checkout & Bill Preview */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sticky top-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Prescription List</h2>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {billItems.length === 0 ? (
                  <p className="text-sm text-gray-500 py-6 text-center">No formulations added yet.</p>
                ) : (
                  billItems.map((item) => (
                    <div
                      key={item.drugId}
                      className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 p-3 text-sm dark:border-slate-800 animate-fade-in-slide"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-950 dark:text-white truncate">{item.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.quantity} x {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <p className="font-bold text-slate-950 dark:text-white">
                          {formatCurrency(item.amount)}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.drugId)}
                          className="rounded-lg p-1 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                          title="Remove item"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Total Calculation */}
              <div className="border-t border-gray-100 mt-5 pt-4 space-y-4 dark:border-slate-800">
                <div className="flex items-center justify-between font-bold text-slate-950 dark:text-white text-base">
                  <span>Grand Total</span>
                  <span className="text-brand-700 dark:text-brand-400">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={billItems.length === 0 || createRequestMutation.isPending}
                  className="w-full rounded-xl bg-brand-700 py-3.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
                >
                  {createRequestMutation.isPending ? "Generating..." : (
                    <>
                      <FiCheck />
                      Generate Payment Code
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Code Receipt Modal */}
      {generatedBill ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900 animate-fade-in-slide relative overflow-hidden">
            <div className="flex justify-end">
              <button
                onClick={() => setGeneratedBill(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {/* Receipt Content */}
            <div className="text-center px-4">
              <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 mb-4">
                Prescription Generated
              </span>
              <h3 className="text-xl font-bold text-slate-950 dark:text-white">Prescription Receipt</h3>
              <p className="text-xs text-gray-500 mt-1">Please pay this code at the cashier&apos;s checkout terminal.</p>

              {/* Code Banner */}
              <div className="my-5 rounded-2xl bg-brand-50 p-5 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                  Cashier Clearing Code
                </p>
                <p className="text-3xl font-mono font-black text-brand-900 dark:text-brand-200 mt-1 tracking-wider">
                  {generatedBill.billing_code}
                </p>
              </div>

              {/* Barcode Mockup */}
              <div className="flex flex-col items-center justify-center my-4 bg-white p-3 rounded-xl border border-gray-100 dark:bg-canvas dark:border-slate-800">
                {/* Simulated vertical stripes for barcode */}
                <div className="h-10 w-full flex items-center justify-between px-2 gap-px select-none">
                  {Array.from({ length: 48 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950 dark:bg-slate-200 h-8"
                      style={{
                        width: idx % 7 === 0 ? "3px" : idx % 5 === 0 ? "2px" : "1px",
                        opacity: idx % 11 === 0 ? 0.3 : 1,
                      }}
                    />
                  ))}
                </div>
                <p className="text-[10px] font-mono text-gray-400 mt-1">{generatedBill.billing_code}</p>
              </div>

              {/* Bill Overview */}
              <div className="text-left space-y-2 text-xs border-t border-gray-100 pt-4 dark:border-slate-800">
                <div className="flex justify-between">
                  <span className="text-gray-500">Patient:</span>
                  <span className="font-semibold text-slate-950 dark:text-white">{generatedBill.patient_name} (ID: {generatedBill.patient_id})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Department:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{generatedBill.departmentName}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-slate-800">
                  <span className="text-gray-500">Date Generated:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{formatDateTime(generatedBill.created_at)}</span>
                </div>

                <div className="pt-2">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Formulations list</p>
                  <div className="max-h-[120px] overflow-y-auto space-y-1">
                    {generatedBill.items?.map((it) => (
                      <div key={it.id} className="flex justify-between text-slate-700 dark:text-slate-300">
                        <span>{it.name} (x{it.quantity})</span>
                        <span className="font-medium">{formatCurrency(it.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between border-t border-gray-100 pt-3 font-bold text-sm text-slate-950 dark:text-white dark:border-slate-800">
                  <span>Grand Total</span>
                  <span className="text-brand-700 dark:text-brand-400">{formatCurrency(generatedBill.total_amount)}</span>
                </div>
              </div>

              {/* Print Receipt Button */}
              <div className="mt-6 flex flex-col gap-2">
                {allowPharmacySelfPay && (
                  <button
                    onClick={() => selfPayMutation.mutate(generatedBill.id)}
                    disabled={selfPayMutation.isPending}
                    className="w-full rounded-xl bg-emerald-700 py-3.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <FiCheck />
                    {selfPayMutation.isPending ? "Clearing..." : "Self Pay & Dispense"}
                  </button>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 flex items-center justify-center gap-2"
                  >
                    <FiPrinter />
                    Print Code
                  </button>
                  <button
                    onClick={() => setGeneratedBill(null)}
                    className="flex-1 rounded-xl bg-brand-700 py-3 text-sm font-semibold text-white hover:bg-brand-600 shadow-sm"
                  >
                    Close Receipt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
