"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import Header from "@/components/shared/Header";
import StatusPill from "@/components/shared/StatusPill";
import { formatCurrency, formatDateTime } from "@/libs/helper";
import {
  FiSearch,
  FiEdit2,
  FiEye,
  FiX,
  FiCheck,
  FiPrinter,
  FiPlus,
  FiXCircle,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { decodeJwt, getAgentAccessToken } from "@/libs/auth";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPharmacyRequests,
  getPharmacyRequestById,
  updatePharmacyRequest,
  payPharmacyRequestSelf,
  getPharmacyInventory,
  cancelPharmacyRequest,
  lookupPatientForPharmacy,
  getPharmacyProfile,
  GetPharmacyInventoryResponse,
  GetPharmacyRequestsResponse,
  PharmacyBillingRequest,
  PharmacyRequestUpdatePayload,
  unwrapPharmacyData,
} from "@/libs/pharmacy-api";

interface LocalPharmacyBillItem {
  drugId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

type PrescriptionStatusFilter = "all" | "pending" | "dispensed" | "cancelled";

function readBooleanClaim(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return undefined;
}

function readObjectClaim(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
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

export default function PharmacyPrescriptionsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = typeof window !== "undefined" ? getAgentAccessToken() : null;
  const { data: profileQueryData } = useQuery({
    queryKey: ["pharmacy-profile-selfpay-check"],
    queryFn: getPharmacyProfile,
    enabled: Boolean(accessToken),
  });

  const allowPharmacySelfPay = useMemo(() => {
    // 1. Try checking token claims
    const tokenClaim = getAllowPharmacySelfPay(accessToken);
    if (tokenClaim) return true;

    // 2. Try checking fetched pharmacist profile hospital details
    const profile = profileQueryData?.data;
    if (profile) {
      const profileClaims = readObjectClaim(profile);
      const hospital = readObjectClaim(profileClaims.hospital);
      const selfPay =
        readBooleanClaim(profileClaims.allow_pharmacy_self_pay) ??
        readBooleanClaim(profileClaims.allowPharmacySelfPay) ??
        readBooleanClaim(hospital.allow_pharmacy_self_pay) ??
        readBooleanClaim(hospital.allowPharmacySelfPay) ??
        readBooleanClaim(hospital.allowSelfPay);
      if (selfPay !== undefined) {
        return selfPay;
      }
    }

    return false;
  }, [accessToken, profileQueryData]);

  // Active view states
  const [activeTab, setActiveTab] = useState<PrescriptionStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [viewingBill, setViewingBill] = useState<PharmacyBillingRequest | null>(null);
  const [paymentSelectionBillId, setPaymentSelectionBillId] = useState<string | null>(null);
  const [editingBill, setEditingBill] = useState<PharmacyBillingRequest | null>(null);

  // Edit form states
  const [editPatientId, setEditPatientId] = useState("");
  const [editPatientName, setEditPatientName] = useState("");
  const [editPatientPhone, setEditPatientPhone] = useState("");
  const [editItems, setEditItems] = useState<LocalPharmacyBillItem[]>([]);

  // Add Item inside Edit Modal state
  const [selectedDrugId, setSelectedDrugId] = useState("");
  const [dispenseQty, setDispenseQty] = useState("1");

  const [showEditSuggestions, setShowEditSuggestions] = useState(false);
  const editContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (editContainerRef.current && !editContainerRef.current.contains(e.target as Node)) {
        setShowEditSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const isEditDigits = useMemo(() => /^\d+$/.test(editPatientId.trim()), [editPatientId]);

  const editPatientLookupQuery = useQuery({
    queryKey: ["pharmacy-edit-patient-lookup", editPatientId],
    queryFn: () => lookupPatientForPharmacy(editPatientId.trim()),
    enabled: Boolean(accessToken && editPatientId.trim().length > 0 && isEditDigits && editingBill),
    retry: false,
  });

  const editPatientSuggestions = useMemo(() => {
    const res = editPatientLookupQuery.data;
    if (res && res.exists && res.patient) {
      return [
        {
          patient_id: res.patient.patient_id,
          patient_name: res.patient.patient_name,
          phone_number: res.patient.phone_number,
        },
      ];
    }
    return [];
  }, [editPatientLookupQuery.data]);

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  // Fetch Prescriptions List
  const { data: prescriptionsData, isLoading, error } = useQuery({
    queryKey: ["pharmacy-prescriptions", activeTab, startDate, endDate, currentPage],
    queryFn: () =>
      getPharmacyRequests({
        status: activeTab === "all" ? undefined : activeTab,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        page: currentPage,
        limit: 15,
      }),
    enabled: Boolean(accessToken),
  });

  // Fetch Inventory for formulation additions
  const { data: inventoryData } = useQuery({
    queryKey: ["pharmacy-inventory-edit-lookup"],
    queryFn: () => getPharmacyInventory({ limit: 100 }),
    enabled: Boolean(accessToken),
  });

  const inventory = useMemo(() => {
    return unwrapPharmacyData<GetPharmacyInventoryResponse | null>(inventoryData, null)?.items ?? [];
  }, [inventoryData]);

  // Mutations
  const updateRequestMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PharmacyRequestUpdatePayload }) =>
      updatePharmacyRequest(id, payload),
    onSuccess: () => {
      toast.success("Prescription updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["pharmacy-prescriptions"] });
      setEditingBill(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update prescription.");
    },
  });

  const selfPayMutation = useMutation({
    mutationFn: ({ id, paymentType }: { id: string; paymentType: "cash" | "transfer" | "pos" }) =>
      payPharmacyRequestSelf(id, paymentType),
    onSuccess: () => {
      toast.success("Prescription cleared and dispensed successfully (Self Pay).");
      queryClient.invalidateQueries({ queryKey: ["pharmacy-prescriptions"] });
      setViewingBill(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to clear request.");
    },
  });

  const cancelRequestMutation = useMutation({
    mutationFn: (requestId: string) => cancelPharmacyRequest(requestId),
    onSuccess: () => {
      toast.success("Prescription cancelled successfully.");
      queryClient.invalidateQueries({ queryKey: ["pharmacy-prescriptions"] });
      setViewingBill(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to cancel prescription.");
    },
  });

  const requestDetailMutation = useMutation({
    mutationFn: getPharmacyRequestById,
    onSuccess: (response) => {
      const request = unwrapPharmacyData<PharmacyBillingRequest>(response, response);
      setViewingBill(request);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to load prescription details.");
    },
  });

  const editDetailMutation = useMutation({
    mutationFn: getPharmacyRequestById,
    onSuccess: (response) => {
      const request = unwrapPharmacyData<PharmacyBillingRequest>(response, response);
      handleOpenEditModal(request);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to load prescription details.");
    },
  });

  // Helper stock limit lookup
  const getAvailableStockForEdit = (drugId: string) => {
    const drug = inventory.find((d) => d.id === drugId);
    if (!drug) return 0;

    const originalItem = editingBill?.items?.find(
      (it) => it.pharmacy_item_id === drugId || it.id === drugId
    );
    const originalQty = originalItem ? originalItem.quantity : 0;

    return drug.stock + originalQty;
  };

  const handleOpenEditModal = (bill: PharmacyBillingRequest) => {
    setEditingBill(bill);
    setEditPatientId(bill.patient_id);
    setEditPatientName(bill.patient_name);
    setEditPatientPhone(bill.phone_number);
    setEditItems(
      (bill.items || []).map((it) => ({
        drugId: it.pharmacy_item_id || it.id || "",
        name: it.name || "Medication",
        quantity: it.quantity,
        unitPrice: it.unit_price,
        amount: it.amount || it.unit_price * it.quantity,
      }))
    );
    setSelectedDrugId("");
    setDispenseQty("1");
  };

  const handleUpdateItemQty = (drugId: string, qtyStr: string) => {
    const qty = Number(qtyStr);
    if (isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
      return;
    }

    const maxStock = getAvailableStockForEdit(drugId);
    if (qty > maxStock) {
      toast.error(`Only ${maxStock} units of this formulation are available in stock.`);
      return;
    }

    setEditItems((prev) =>
      prev.map((item) =>
        item.drugId === drugId
          ? { ...item, quantity: qty, amount: item.unitPrice * qty }
          : item
      )
    );
  };

  const handleRemoveEditItem = (drugId: string) => {
    setEditItems((prev) => prev.filter((item) => item.drugId !== drugId));
  };

  const handleAddEditItem = () => {
    if (!selectedDrugId) {
      toast.error("Select a formulation first.");
      return;
    }

    const drug = inventory.find((d) => d.id === selectedDrugId);
    if (!drug) return;

    const qty = Number(dispenseQty);
    if (isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
      toast.error("Enter a valid integer quantity.");
      return;
    }

    const maxStock = getAvailableStockForEdit(selectedDrugId);
    if (qty > maxStock) {
      toast.error(`Insufficient stock. Only ${maxStock} units available.`);
      return;
    }

    if (editItems.some((item) => item.drugId === selectedDrugId)) {
      toast.error("This formulation is already added.");
      return;
    }

    const newItem: LocalPharmacyBillItem = {
      drugId: drug.id,
      name: drug.name,
      quantity: qty,
      unitPrice: drug.unit_price,
      amount: drug.unit_price * qty,
    };

    setEditItems((prev) => [...prev, newItem]);
    setSelectedDrugId("");
    setDispenseQty("1");
  };

  const handleSaveEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBill) return;

    if (!editPatientId.trim() || !editPatientName.trim() || !editPatientPhone.trim()) {
      toast.error("Please fill in all patient details.");
      return;
    }

    if (editItems.length === 0) {
      toast.error("The prescription list cannot be empty.");
      return;
    }

    updateRequestMutation.mutate({
      id: editingBill.id,
      payload: {
        patient_id: editPatientId.trim(),
        patient_name: editPatientName.trim(),
        phone_number: editPatientPhone.trim(),
        items: editItems.map((it) => ({
          pharmacy_item_id: it.drugId,
          quantity: it.quantity,
        })),
      },
    });
  };

  const editGrandTotal = useMemo(() => {
    return editItems.reduce((sum, item) => sum + item.amount, 0);
  }, [editItems]);

  const activeSelectedDrug = useMemo(() => {
    return inventory.find((d) => d.id === selectedDrugId) ?? null;
  }, [selectedDrugId, inventory]);

  const prescriptionsPayload = useMemo(() => {
    const dataObj = unwrapPharmacyData<unknown>(prescriptionsData, []);

    if (Array.isArray(dataObj)) {
      return {
        rows: dataObj as PharmacyBillingRequest[],
        totalPages: 1,
        totalItems: dataObj.length,
        usesServerPagination: false,
      };
    }

    if (dataObj && typeof dataObj === "object") {
      const response = dataObj as GetPharmacyRequestsResponse;
      const rows = response.requests ?? response.items ?? [];

      return {
        rows,
        totalPages: response.total_pages ?? 1,
        totalItems: response.total_items ?? rows.length,
        usesServerPagination: Boolean(response.total_pages),
      };
    }

    return {
      rows: [],
      totalPages: 1,
      totalItems: 0,
      usesServerPagination: false,
    };
  }, [prescriptionsData]);

  const rawList = prescriptionsPayload.rows;

  // Local Search & Filtering
  const filteredList = useMemo(() => {
    let result = rawList;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (b: PharmacyBillingRequest) =>
          b.billing_code.toLowerCase().includes(q) ||
          b.patient_name.toLowerCase().includes(q) ||
          b.patient_id.toLowerCase().includes(q) ||
          b.phone_number.toLowerCase().includes(q)
      );
    }
    return result;
  }, [rawList, searchQuery]);

  const itemsPerPage = 15;
  const totalPages = prescriptionsPayload.usesServerPagination
    ? prescriptionsPayload.totalPages
    : Math.ceil(filteredList.length / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    if (prescriptionsPayload.usesServerPagination) {
      return filteredList;
    }

    const start = (currentPage - 1) * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, currentPage, prescriptionsPayload.usesServerPagination]);

  if (!accessToken) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-canvas">
      <Header
        title="Manage Prescriptions"
        Subtitle="View pending/completed drug orders, edit unpaid bills, and retrieve cashier printouts"
      />

      <div className="p-6 space-y-6">
        {/* Page title and Tab controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Prescription Orders</h1>
            <p className="text-sm text-gray-500">
              Track all prescriptions, filter by date, and review payment status
            </p>
          </div>

          <div className="inline-flex rounded-xl bg-gray-200/80 p-1 dark:bg-slate-800">
            <button
              onClick={() => {
                setActiveTab("all");
                setCurrentPage(1);
              }}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                activeTab === "all"
                  ? "bg-white text-slate-950 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setActiveTab("pending");
                setCurrentPage(1);
              }}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                activeTab === "pending"
                  ? "bg-white text-slate-950 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => {
                setActiveTab("dispensed");
                setCurrentPage(1);
              }}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                activeTab === "dispensed"
                  ? "bg-white text-slate-950 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Paid
            </button>
            <button
              onClick={() => {
                setActiveTab("cancelled");
                setCurrentPage(1);
              }}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                activeTab === "cancelled"
                  ? "bg-white text-slate-950 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <FiSearch className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Patient Name, ID, Phone, or Bill Code..."
              className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-950 outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <label className="block">
            <span className="sr-only">Start date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-slate-950 outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white lg:w-44"
            />
          </label>

          <label className="block">
            <span className="sr-only">End date</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-slate-950 outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white lg:w-44"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setStartDate("");
              setEndDate("");
              setActiveTab("all");
              setCurrentPage(1);
            }}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Reset
          </button>
        </div>

        {/* Orders Table */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-700 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
            Error loading prescriptions: {error instanceof Error ? error.message : "Server error"}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                    <th className="p-4 font-semibold">Bill Code</th>
                    <th className="p-4 font-semibold">Patient Information</th>
                    <th className="p-4 font-semibold">Items Count</th>
                    <th className="p-4 font-semibold text-right">Total Amount</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Date Created</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {paginatedList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500">
                        No prescriptions found.
                      </td>
                    </tr>
                  ) : (
                    paginatedList.map((bill: PharmacyBillingRequest) => (
                      <tr key={bill.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-4 font-mono font-bold text-brand-700 dark:text-brand-400">
                          {bill.billing_code}
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {bill.patient_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              ID: {bill.patient_id} | {bill.phone_number}
                            </p>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">
                          {bill.items && bill.items.length > 0 ? (
                            <div className="flex flex-col gap-1 max-w-[250px]">
                              {bill.items.map((item, idx) => (
                                <span key={idx} className="text-xs font-medium truncate">
                                  • {item.name || "Unknown Drug"} (x{item.quantity})
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No drugs listed</span>
                          )}
                        </td>
                        <td className="p-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                          {formatCurrency(bill.total_amount)}
                        </td>
                        <td className="p-4">
                          <StatusPill status={bill.status === "dispensed" ? "Paid" : bill.status === "cancelled" ? "Cancelled" : "Pending"} />
                        </td>
                        <td className="p-4 text-xs text-gray-400">
                          {formatDateTime(bill.created_at)}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => requestDetailMutation.mutate(bill.id)}
                              disabled={requestDetailMutation.isPending}
                              className="rounded-lg p-2 text-slate-600 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-800"
                              title="View Receipt / Clearance Code"
                            >
                              <FiEye className="h-4 w-4" />
                            </button>
                             {bill.status === "pending" ? (
                              <>
                                {allowPharmacySelfPay && (
                                  <button
                                    onClick={() => setPaymentSelectionBillId(bill.id)}
                                    disabled={selfPayMutation.isPending}
                                    className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                                    title="Self Pay & Dispense"
                                  >
                                    <FiCheck className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => editDetailMutation.mutate(bill.id)}
                                  disabled={editDetailMutation.isPending}
                                  className="rounded-lg p-2 text-brand-700 hover:bg-brand-50 disabled:opacity-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
                                  title="Edit Drugs List"
                                >
                                  <FiEdit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Cancel prescription code ${bill.billing_code}?`)) {
                                      cancelRequestMutation.mutate(bill.id);
                                    }
                                  }}
                                  disabled={cancelRequestMutation.isPending}
                                  className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/20"
                                  title="Cancel Prescription"
                                >
                                  <FiXCircle className="h-4 w-4" />
                                </button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <div className="flex items-center justify-between border-t border-gray-100 p-4 dark:border-slate-800">
                <span className="text-xs text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-gray-200 p-2 text-slate-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300"
                  >
                    <FiChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-gray-200 p-2 text-slate-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300"
                  >
                    <FiChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* View Receipt Modal */}
      {viewingBill ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900 animate-fade-in-slide relative overflow-hidden">
            <div className="flex justify-end">
              <button
                onClick={() => setViewingBill(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="text-center px-4">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold mb-4 ${
                  viewingBill.status === "dispensed"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                }`}
              >
                {viewingBill.status === "dispensed" ? "Medication Dispensed (Paid)" : "Awaiting Checkout Payment"}
              </span>
              <h3 className="text-xl font-bold text-slate-950 dark:text-white">Prescription Receipt</h3>
              <p className="text-xs text-gray-500 mt-1">
                {viewingBill.status === "dispensed"
                  ? "Receipt verification code for clearing and dispensing"
                  : "Please scan or present this clearing code to cashier for checkout"}
              </p>

              {/* Code Banner */}
              <div className="my-5 rounded-2xl bg-brand-50 p-5 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                  Clearing Payment Code
                </p>
                <p className="text-3xl font-mono font-black text-brand-900 dark:text-brand-200 mt-1 tracking-wider">
                  {viewingBill.billing_code}
                </p>
              </div>

              {/* Barcode Mockup */}
              <div className="flex flex-col items-center justify-center my-4 bg-white p-3 rounded-xl border border-gray-100 dark:bg-canvas dark:border-slate-800">
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
                <p className="text-[10px] font-mono text-gray-400 mt-1">{viewingBill.billing_code}</p>
              </div>

              {/* Bill Details */}
              <div className="text-left space-y-2 text-xs border-t border-gray-100 pt-4 dark:border-slate-800">
                <div className="flex justify-between">
                  <span className="text-gray-500">Patient:</span>
                  <span className="font-semibold text-slate-950 dark:text-white">
                    {viewingBill.patient_name} (ID: {viewingBill.patient_id})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone Number:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {viewingBill.phone_number}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-slate-800">
                  <span className="text-gray-500">Date Generated:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {formatDateTime(viewingBill.created_at)}
                  </span>
                </div>

                <div className="pt-2">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Formulations list
                  </p>
                  <div className="max-h-[120px] overflow-y-auto space-y-1 pr-1">
                    {viewingBill.items?.map((it) => (
                      <div key={it.id} className="flex justify-between text-slate-700 dark:text-slate-300">
                        <span>
                          {it.name || "Medication"} (x{it.quantity})
                        </span>
                        <span className="font-medium">{formatCurrency(it.amount || it.unit_price * it.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between border-t border-gray-100 pt-3 font-bold text-sm text-slate-950 dark:text-white dark:border-slate-800">
                  <span>Grand Total</span>
                  <span className="text-brand-700 dark:text-brand-400">
                    {formatCurrency(viewingBill.total_amount)}
                  </span>
                </div>
              </div>

              {/* Printing / Dispense */}
              <div className="mt-6 flex flex-col gap-2">
                {viewingBill.status === "pending" && (
                  <div className="flex gap-2 mb-2 w-full">
                    {allowPharmacySelfPay && (
                      <button
                        onClick={() => setPaymentSelectionBillId(viewingBill.id)}
                        disabled={selfPayMutation.isPending}
                        className="flex-1 rounded-xl bg-emerald-700 py-3 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <FiCheck />
                        {selfPayMutation.isPending ? "Clearing..." : "Self Pay"}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`Cancel prescription code ${viewingBill.billing_code}?`)) {
                          cancelRequestMutation.mutate(viewingBill.id);
                        }
                      }}
                      disabled={cancelRequestMutation.isPending}
                      className="flex-1 rounded-xl border border-red-200 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/20 flex items-center justify-center gap-2"
                    >
                      <FiXCircle />
                      {cancelRequestMutation.isPending ? "Cancelling..." : "Cancel"}
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 flex items-center justify-center gap-2"
                  >
                    <FiPrinter />
                    Print Receipt
                  </button>
                  <button
                    onClick={() => setViewingBill(null)}
                    className="flex-1 rounded-xl bg-brand-700 py-3 text-sm font-semibold text-white hover:bg-brand-600 shadow-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Edit Modal */}
      {editingBill ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900 animate-fade-in-slide relative">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-950 dark:text-white">
                  Edit Prescription: {editingBill.billing_code}
                </h3>
                <p className="text-xs text-gray-500">
                  Modify patient details or change drug list quantities before checkout
                </p>
              </div>
              <button
                onClick={() => setEditingBill(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdits} className="space-y-6">
              {/* Patient details section */}
              <div ref={editContainerRef} className="grid gap-4 sm:grid-cols-2 bg-gray-50/50 p-4 rounded-2xl border border-gray-150 dark:bg-slate-800/40 dark:border-slate-800">
                <div className="relative">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                      Patient ID
                    </span>
                    <input
                      type="text"
                      value={editPatientId}
                      onChange={(e) => {
                        setEditPatientId(e.target.value);
                        setShowEditSuggestions(true);
                      }}
                      onFocus={() => setShowEditSuggestions(true)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-canvas dark:text-white"
                      required
                    />
                  </label>

                  {showEditSuggestions && editPatientSuggestions.length > 0 ? (
                    <div className="absolute left-0 right-0 z-30 mt-1 max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                      {editPatientSuggestions.map((pat) => (
                        <button
                          key={pat.patient_id}
                          type="button"
                          onClick={() => {
                            setEditPatientId(pat.patient_id);
                            setEditPatientName(pat.patient_name);
                            setEditPatientPhone(pat.phone_number);
                            setShowEditSuggestions(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-150 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-b border-gray-50 dark:border-slate-800 last:border-b-0 transition"
                        >
                          <p className="font-semibold">{pat.patient_name}</p>
                          <p className="text-xs text-gray-500">ID: {pat.patient_id} | Phone: {pat.phone_number}</p>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                      Patient Name
                    </span>
                    <input
                      type="text"
                      value={editPatientName}
                      onChange={(e) => setEditPatientName(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-canvas dark:text-white"
                      required
                    />
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                      Phone Number
                    </span>
                    <input
                      type="text"
                      value={editPatientPhone}
                      onChange={(e) => setEditPatientPhone(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-canvas dark:text-white"
                      required
                    />
                  </label>
                </div>
              </div>

              {/* Formulation Add Section inside edit */}
              <div className="border border-gray-200 rounded-2xl p-4 space-y-3 dark:border-slate-800">
                <p className="text-xs font-bold text-gray-600 uppercase dark:text-slate-300 tracking-wider">
                  Add New Formulation
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <label className="flex-1 block">
                    <select
                      value={selectedDrugId}
                      onChange={(e) => setSelectedDrugId(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-canvas dark:text-white"
                    >
                      <option value="">Select Drug formulation...</option>
                      {inventory
                        .filter(
                          (d) =>
                            d.stock > 0 &&
                            d.status.toLowerCase() !== "expired" &&
                            !editItems.some((it) => it.drugId === d.id)
                        )
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} (Stock: {getAvailableStockForEdit(d.id)}) -{" "}
                            {formatCurrency(d.unit_price)}
                          </option>
                        ))}
                    </select>
                  </label>

                  <label className="block sm:w-24">
                    <input
                      type="number"
                      value={dispenseQty}
                      onChange={(e) => setDispenseQty(e.target.value)}
                      min="1"
                      placeholder="Qty"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-canvas dark:text-white"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleAddEditItem}
                    className="rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center gap-1 shadow-sm shrink-0"
                  >
                    <FiPlus />
                    Add
                  </button>
                </div>
                {activeSelectedDrug ? (
                  <p className="text-[11px] text-brand-600 font-medium">
                    Available stock: {getAvailableStockForEdit(activeSelectedDrug.id)} | price:{" "}
                    {formatCurrency(activeSelectedDrug.unit_price)}
                  </p>
                ) : null}
              </div>

              {/* Formulation list inside edit */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-600 uppercase dark:text-slate-300 tracking-wider">
                  Prescription Drug Items
                </p>
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {editItems.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4 bg-gray-50 rounded-xl dark:bg-canvas">
                      No formulation items added.
                    </p>
                  ) : (
                    editItems.map((item) => {
                      const maxAvailable = getAvailableStockForEdit(item.drugId);
                      return (
                        <div
                          key={item.drugId}
                          className="flex items-center justify-between gap-4 rounded-xl border border-gray-150 p-3 bg-white text-sm dark:border-slate-800 dark:bg-slate-900"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Unit price: {formatCurrency(item.unitPrice)} | Total stock limit:{" "}
                              {maxAvailable}
                            </p>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-slate-400">Qty:</span>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleUpdateItemQty(item.drugId, e.target.value)
                                }
                                min="1"
                                max={maxAvailable}
                                className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-center text-xs font-semibold outline-none dark:border-slate-700 dark:bg-canvas dark:text-white"
                              />
                            </div>

                            <div className="text-right shrink-0">
                              <p className="font-bold text-slate-900 dark:text-white">
                                {formatCurrency(item.amount)}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveEditItem(item.drugId)}
                              className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Grand Total and Save button */}
              <div className="border-t border-gray-100 pt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                    Grand Total:
                  </span>
                  <span className="text-xl font-black text-brand-700 dark:text-brand-400">
                    {formatCurrency(editGrandTotal)}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingBill(null)}
                    className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateRequestMutation.isPending}
                    className="rounded-xl bg-brand-700 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600 shadow-sm flex items-center gap-1.5 disabled:opacity-65"
                  >
                    <FiCheck />
                    {updateRequestMutation.isPending ? "Saving..." : "Save Updates"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}


      {/* Payment Method Selection Modal */}
      {paymentSelectionBillId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900 animate-fade-in-slide">
            <h3 className="text-lg font-bold text-slate-950 dark:text-white text-center mb-4">
              Select Payment Method
            </h3>
            <p className="text-xs text-gray-500 text-center mb-6">
              Select the payment type to clear and dispense this prescription.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  selfPayMutation.mutate({ id: paymentSelectionBillId, paymentType: "cash" });
                  setPaymentSelectionBillId(null);
                }}
                className="w-full rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 py-3 text-sm font-semibold text-slate-950 dark:text-white transition flex items-center justify-center gap-2 cursor-pointer"
              >
                💵 Cash
              </button>
              <button
                onClick={() => {
                  selfPayMutation.mutate({ id: paymentSelectionBillId, paymentType: "pos" });
                  setPaymentSelectionBillId(null);
                }}
                className="w-full rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 py-3 text-sm font-semibold text-slate-950 dark:text-white transition flex items-center justify-center gap-2 cursor-pointer"
              >
                💳 POS Card
              </button>
              <button
                onClick={() => {
                  selfPayMutation.mutate({ id: paymentSelectionBillId, paymentType: "transfer" });
                  setPaymentSelectionBillId(null);
                }}
                className="w-full rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 py-3 text-sm font-semibold text-slate-950 dark:text-white transition flex items-center justify-center gap-2 cursor-pointer"
              >
                📲 Bank Transfer
              </button>
              <button
                onClick={() => setPaymentSelectionBillId(null)}
                className="w-full rounded-xl border border-gray-200 text-gray-700 dark:border-slate-700 dark:text-slate-300 py-3 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
