"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/shared/Header";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { formatCurrency, formatDateTime } from "@/libs/helper";
import { FiPlus, FiX, FiCheck, FiRefreshCw, FiSend, FiInbox, FiActivity } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { getAgentAccessToken, decodeJwt } from "@/libs/auth";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPharmacyProfile,
  getPharmacyStoreProfile,
  getPharmacyUnits,
  getPharmacyInventory,
  getPharmacyStoreInventory,
  createPharmacyTransfer,
  getPharmacyTransfers,
  getPharmacyStoreTransfers,
  dispatchPharmacyStoreTransfer,
  updatePharmacyStoreTransferStatus,
  updatePharmacyTransferStatus,
  BackendDrugItem,
  PharmacyTransferItem,
  GetPharmacyInventoryResponse,
  unwrapPharmacyData,
} from "@/libs/pharmacy-api";

export default function PharmacyTransfersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = typeof window !== "undefined" ? getAgentAccessToken() : null;

  // Tabs: all, pending, completed, rejected
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "completed" | "rejected">("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPointId, setSelectedPointId] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [dispatchQty, setDispatchQty] = useState("");
  const [remarks, setRemarks] = useState("");

  // Approval Modal State
  const [approvingTransfer, setApprovingTransfer] = useState<PharmacyTransferItem | null>(null);
  const [approvalQuantities, setApprovalQuantities] = useState<Record<string, number>>({});
  const [rejectingTransferId, setRejectingTransferId] = useState<string | null>(null);

  const decoded = React.useMemo(() => (accessToken ? decodeJwt(accessToken) : null), [accessToken]);
  const isStoreManager = decoded?.role === "PHARMACY_STORE";
  const isPlatformAdmin = decoded?.role === "PLATFORM_ADMIN";

  const { data: profileResponse, isLoading: isProfileLoading } = useQuery({
    queryKey: ["pharmacy-profile-transfers", decoded?.role],
    queryFn: async () => {
      if (decoded?.role === "PHARMACY_STORE") {
        return (await getPharmacyStoreProfile()) as any;
      }
      return (await getPharmacyProfile()) as any;
    },
    enabled: Boolean(accessToken),
  });

  const profile = profileResponse?.data;
  const isPoint = !isStoreManager;

  // Get active unit ID
  const activeUnitId = React.useMemo(() => {
    if (!accessToken) return "";
    const user = decoded?.user ?? decoded?.data ?? decoded ?? {};
    return (
      decoded?.pharmacy_unit_id ||
      decoded?.pharmacyUnitId ||
      user?.pharmacy_unit_id ||
      user?.pharmacyUnitId ||
      profile?.pharmacy_unit?.id ||
      ""
    );
  }, [accessToken, decoded, profile]);

  // Fetch Transfers
  const transfersQuery = useQuery({
    queryKey: ["pharmacy-transfers", activeTab, isStoreManager],
    queryFn: async (): Promise<any> => {
      if (isStoreManager) {
        return await getPharmacyStoreTransfers({
          status: activeTab === "all" ? undefined : activeTab,
        });
      }
      return await getPharmacyTransfers({
        status: activeTab === "all" ? undefined : activeTab,
        unit_id: isPlatformAdmin ? undefined : activeUnitId || undefined,
      });
    },
    enabled: Boolean(accessToken),
  });

  const transfers = React.useMemo<PharmacyTransferItem[]>(() => {
    const raw = transfersQuery.data;
    if (!raw) return [];

    if (Array.isArray(raw)) return raw;

    if (raw && typeof raw === "object") {
      const obj = raw as Record<string, unknown>;
      if (Array.isArray(obj.data)) {
        return obj.data as PharmacyTransferItem[];
      }
      if (obj.data && typeof obj.data === "object") {
        const subObj = obj.data as Record<string, unknown>;
        if (Array.isArray(subObj.data)) {
          return subObj.data as PharmacyTransferItem[];
        }
        if (Array.isArray(subObj.transfers)) {
          return subObj.transfers as PharmacyTransferItem[];
        }
      }
      if (Array.isArray(obj.transfers)) {
        return obj.transfers as PharmacyTransferItem[];
      }
    }

    return [];
  }, [transfersQuery.data]);

  // Fetch Units for dropdown
  const unitsQuery = useQuery({
    queryKey: ["pharmacy-units-dropdown"],
    queryFn: () => getPharmacyUnits(),
    enabled: Boolean(accessToken) && isModalOpen,
  });

  const units = React.useMemo(() => {
    const raw = unitsQuery.data?.data || [];
    if (isStoreManager) {
      // Store managers dispatch TO points
      return raw.filter((u) => u.type === "point" && u.is_active);
    } else {
      // Point managers request FROM stores
      return raw.filter((u) => u.type === "store" && u.is_active);
    }
  }, [unitsQuery.data, isStoreManager]);

  // Fetch inventory for dropdown (we fetch source warehouse inventory)
  const inventoryQuery = useQuery({
    queryKey: ["pharmacy-inventory-dropdown", isStoreManager],
    queryFn: async () => {
      if (isStoreManager) {
        return (await getPharmacyStoreInventory({ limit: 100 })) as any;
      }
      return (await getPharmacyInventory({ limit: 100 })) as any;
    },
    enabled: Boolean(accessToken) && isModalOpen,
  });

  const inventoryItems = React.useMemo<BackendDrugItem[]>(() => {
    return unwrapPharmacyData<GetPharmacyInventoryResponse>(inventoryQuery.data, {
      total_items: 0,
      page: 1,
      limit: 100,
      total_pages: 1,
      items: [],
    } as any).items;
  }, [inventoryQuery.data]);

  // Mutation: Create transfer
  const createTransferMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (isStoreManager) {
        return await dispatchPharmacyStoreTransfer({
          to_unit_id: payload.to_unit_id,
          remarks: payload.remarks,
          items: payload.items,
        });
      }
      return await createPharmacyTransfer(payload);
    },
    onSuccess: () => {
      toast.success(
        isStoreManager
          ? "Stock dispatched to point unit successfully."
          : "Restock request submitted to central store."
      );
      setIsModalOpen(false);
      setSelectedPointId("");
      setSelectedItemId("");
      setDispatchQty("");
      setRemarks("");
      queryClient.invalidateQueries({ queryKey: ["pharmacy-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["pharmacy-inventory"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to initiate transfer.");
    },
  });

  // Mutation: Action (approve/reject)
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload:
        | {
            action: "approve" | "reject";
            quantity?: number;
            items?: Array<{ id: string; quantity: number }>;
          }
        | "approve"
        | "reject";
    }): Promise<any> => {
      if (isStoreManager) {
        return await updatePharmacyStoreTransferStatus(id, payload);
      }
      const action = typeof payload === "string" ? payload : payload.action;
      return await updatePharmacyTransferStatus(id, action);
    },
    onSuccess: (_, variables) => {
      const isApprove = typeof variables.payload === "string" ? variables.payload === "approve" : variables.payload.action === "approve";
      toast.success(
        isApprove
          ? "Transfer request approved and stock dispatched."
          : "Transfer request rejected."
      );
      setApprovingTransfer(null);
      setApprovalQuantities({});
      setRejectingTransferId(null);
      queryClient.invalidateQueries({ queryKey: ["pharmacy-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["pharmacy-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["pharmacy-dashboard-stats"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update transfer status.");
    },
  });

  useEffect(() => {
    if (isModalOpen && units.length > 0 && !selectedPointId) {
      setSelectedPointId(units[0].id);
    }
  }, [units, isModalOpen, selectedPointId]);

  const handleOpenModal = () => {
    if (units.length > 0) {
      setSelectedPointId(units[0].id);
    }
    if (inventoryItems.length > 0) {
      setSelectedItemId(inventoryItems[0].id);
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(dispatchQty);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Please enter a valid quantity.");
      return;
    }
    if (!selectedPointId) {
      toast.error("Please select a target unit.");
      return;
    }
    if (!selectedItemId) {
      toast.error("Please select a formulation.");
      return;
    }

    const payload = {
      from_unit_id: isStoreManager ? activeUnitId : selectedPointId,
      to_unit_id: isStoreManager ? selectedPointId : activeUnitId,
      remarks: remarks.trim() || undefined,
      items: [
        {
          source_pharmacy_item_id: selectedItemId,
          quantity: qty,
        },
      ],
    };

    createTransferMutation.mutate(payload);
  };

  const handleOpenApproval = (trf: PharmacyTransferItem) => {
    const initialQty: Record<string, number> = {};
    if (trf.items && trf.items.length > 0) {
      trf.items.forEach((it: any) => {
        initialQty[it.id] = it.quantity ?? it.qty ?? 1;
      });
    }
    setApprovalQuantities(initialQty);
    setApprovingTransfer(trf);
  };

  const handleReject = (id: string) => {
    setRejectingTransferId(id);
  };

  const handleConfirmApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingTransfer) return;

    const itemsPayload = (approvingTransfer.items || []).map((it: any) => {
      const q = approvalQuantities[it.id] !== undefined ? approvalQuantities[it.id] : (it.quantity ?? it.qty ?? 1);
      return {
        id: it.id,
        quantity: Math.max(1, Number(q)),
      };
    });

    updateStatusMutation.mutate({
      id: approvingTransfer.id,
      payload: {
        action: "approve",
        items: itemsPayload.length > 0 ? itemsPayload : undefined,
      },
    });
  };

  if (!accessToken) return null;

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-canvas">
      <Header
        title="Stock Transfers"
        Subtitle="Manage branch stock replenishment and central store transfers"
      />

      <div className="space-y-6 p-6">
        {/* Header Block */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Transfers Ledger</h1>
            <p className="text-sm text-gray-500">Track and dispatch drug transfers across hospital pharmacy points.</p>
          </div>
          <div>
            <button
              onClick={handleOpenModal}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 shadow-sm"
            >
              <FiPlus />
              {isStoreManager ? "Dispatch Stock" : "Request Restock"}
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex border-b border-gray-200 dark:border-slate-800">
          {(["all", "pending", "completed", "rejected"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-5 py-3 text-sm font-semibold uppercase tracking-wider transition ${
                activeTab === tab
                  ? "border-brand-600 text-brand-700 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Transfers List */}
        {transfersQuery.isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-700 border-t-transparent"></div>
          </div>
        ) : transfersQuery.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
            Failed to load transfers: {transfersQuery.error instanceof Error ? transfersQuery.error.message : "Server error"}
          </div>
        ) : transfers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <FiInbox className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-slate-100">No transfers found</h3>
            <p className="mt-1 text-sm text-gray-500">There are no stock transfers matching the selected tab.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                    <th className="p-4 font-semibold">From (Source)</th>
                    <th className="p-4 font-semibold">To (Target)</th>
                    <th className="p-4 font-semibold">Remarks</th>
                    <th className="p-4 font-semibold">Transferred Drugs</th>
                    <th className="p-4 font-semibold text-center">Status</th>
                    <th className="p-4 font-semibold">Created At</th>
                    {(isStoreManager || isPlatformAdmin) && <th className="p-4 font-semibold text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {transfers.map((trf) => (
                    <tr key={trf.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-4 font-medium text-slate-900 dark:text-slate-100">
                        {trf.from_unit_name}
                      </td>
                      <td className="p-4 font-medium text-slate-900 dark:text-slate-100">
                        {trf.to_unit_name}
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-400 italic">
                        {trf.remarks || "--"}
                      </td>
                      <td className="p-4">
                        {trf.items && trf.items.length > 0 ? (
                          <div className="flex flex-col gap-1.5">
                            {trf.items.map((item: any, idx: number) => {
                              const name = item.item_name || item.drug_name || item.name || "Drug Item";
                              const qty = item.quantity ?? item.qty ?? item.quantity_transferred;
                              return (
                                <div key={item.id || idx} className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                                    {name}
                                  </span>
                                  {qty !== undefined && (
                                    <span className="inline-flex items-center rounded-md bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                                      Qty: {qty}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {trf.items_count || 0} item(s)
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                            trf.status === "completed"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                              : trf.status === "rejected"
                              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
                              : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400"
                          }`}
                        >
                          {trf.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-gray-500">
                        {formatDateTime(trf.created_at)}
                      </td>
                      {(isStoreManager || isPlatformAdmin) && (
                        <td className="p-4 text-right">
                          {trf.status === "pending" && (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleOpenApproval(trf)}
                                className="rounded-lg p-2 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                                title="Approve Request"
                                disabled={updateStatusMutation.isPending}
                              >
                                <FiCheck className="h-4.5 w-4.5" />
                              </button>
                              <button
                                onClick={() => handleReject(trf.id)}
                                className="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
                                title="Reject Request"
                                disabled={updateStatusMutation.isPending}
                              >
                                <FiX className="h-4.5 w-4.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-gray-150 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isStoreManager ? "Dispatch Stock to Point" : "Request Restock from Store"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
              {isStoreManager && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Destination Branch Point *
                  </label>
                  <select
                    required
                    value={selectedPointId}
                    onChange={(e) => setSelectedPointId(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-slate-950 focus:border-brand-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                  >
                    <option value="">Select unit...</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Formulation (Drug) *
                </label>
                <select
                  required
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-slate-950 focus:border-brand-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                >
                  <option value="">Select drug formulation...</option>
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} {item.generic_name ? `(${item.generic_name})` : ""} - Stock: {item.stock}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={dispatchQty}
                  onChange={(e) => setDispatchQty(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-slate-950 focus:border-brand-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Remarks / Notes
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add notes or remarks..."
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-slate-950 focus:border-brand-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTransferMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 shadow-sm disabled:opacity-50"
                >
                  {createTransferMutation.isPending ? "Initiating..." : isStoreManager ? "Dispatch" : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Approval Modal */}
      {approvingTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-gray-150 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Approve Restock Transfer
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Review and adjust quantities dispatched to the destination point.
                </p>
              </div>
              <button
                onClick={() => {
                  setApprovingTransfer(null);
                  setApprovalQuantities({});
                }}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmApproval} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60 text-xs">
                <div>
                  <span className="font-semibold text-gray-500 dark:text-slate-400">From (Source):</span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">{approvingTransfer.from_unit_name}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 dark:text-slate-400">To (Destination):</span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">{approvingTransfer.to_unit_name}</p>
                </div>
                {approvingTransfer.remarks && (
                  <div className="col-span-2 border-t border-slate-200/60 pt-2 dark:border-slate-700/60">
                    <span className="font-semibold text-gray-500 dark:text-slate-400">Remarks:</span>
                    <p className="text-slate-700 dark:text-slate-300 italic mt-0.5">{approvingTransfer.remarks}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Requested Formulations & Dispatch Quantities
                </label>
                {approvingTransfer.items && approvingTransfer.items.length > 0 ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {approvingTransfer.items.map((it: any) => {
                      const name = it.item_name || it.drug_name || it.name || "Drug Formulation";
                      const requestedQty = it.quantity ?? it.qty ?? 1;
                      const currentVal = approvalQuantities[it.id] !== undefined ? approvalQuantities[it.id] : requestedQty;
                      return (
                        <div
                          key={it.id}
                          className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">{name}</p>
                            {it.generic_name && (
                              <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{it.generic_name}</p>
                            )}
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
                              Requested: {requestedQty}
                            </p>
                          </div>
                          <div className="w-28 shrink-0">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                              Dispatch Qty
                            </label>
                            <input
                              type="number"
                              min="1"
                              required
                              value={currentVal}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setApprovalQuantities((prev) => ({
                                  ...prev,
                                  [it.id]: val,
                                }));
                              }}
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-950 focus:border-brand-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic p-3 border rounded-xl dark:border-slate-800">
                    No individual item details specified. Approving will transfer the full batch.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingTransferId(approvingTransfer.id);
                  }}
                  disabled={updateStatusMutation.isPending}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50 disabled:opacity-50"
                >
                  Reject Request
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setApprovingTransfer(null);
                      setApprovalQuantities({});
                    }}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateStatusMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 shadow-sm disabled:opacity-50"
                  >
                    {updateStatusMutation.isPending ? "Approving..." : "Approve & Dispatch"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(rejectingTransferId)}
        title="Reject Transfer Request"
        message="Are you sure you want to reject this transfer request? This action cannot be undone."
        confirmText="Reject Transfer"
        cancelText="Cancel"
        variant="danger"
        isLoading={updateStatusMutation.isPending}
        onConfirm={() => {
          if (rejectingTransferId) {
            updateStatusMutation.mutate({
              id: rejectingTransferId,
              payload: { action: "reject" },
            });
          }
        }}
        onClose={() => setRejectingTransferId(null)}
      />
    </div>
  );
}
