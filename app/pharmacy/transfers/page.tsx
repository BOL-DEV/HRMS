"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/shared/Header";
import { formatCurrency } from "@/libs/helper";
import { FiPlus, FiX, FiCheck, FiRefreshCw, FiSend, FiInbox, FiActivity } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { getAgentAccessToken, decodeJwt } from "@/libs/auth";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPharmacyProfile,
  getPharmacyUnits,
  getPharmacyInventory,
  createPharmacyTransfer,
  getPharmacyTransfers,
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

  const { data: profileResponse, isLoading: isProfileLoading } = useQuery({
    queryKey: ["pharmacy-profile-transfers"],
    queryFn: getPharmacyProfile,
    enabled: Boolean(accessToken),
  });

  const decoded = React.useMemo(() => (accessToken ? decodeJwt(accessToken) : null), [accessToken]);
  const profile = profileResponse?.data;
  const isPlatformAdmin = decoded?.role === "PLATFORM_ADMIN" || (profile?.role as string) === "PLATFORM_ADMIN";
  const isStoreManager = decoded?.role === "PHARMACY_STORE" || (profile?.role as string) === "PHARMACY_STORE";
  const isPoint = decoded?.role === "PHARMACY" || (profile?.role as string) === "PHARMACY";

  // Get active unit ID
  const activeUnitId = React.useMemo(() => {
    if (!accessToken) return "";
    const decoded = decodeJwt(accessToken);
    const user = decoded?.user ?? decoded?.data ?? decoded ?? {};
    return (
      decoded?.pharmacy_unit_id ||
      decoded?.pharmacyUnitId ||
      user?.pharmacy_unit_id ||
      user?.pharmacyUnitId ||
      ""
    );
  }, [accessToken]);

  // Fetch Transfers
  const transfersQuery = useQuery({
    queryKey: ["pharmacy-transfers", activeTab],
    queryFn: () =>
      getPharmacyTransfers({
        status: activeTab === "all" ? undefined : activeTab,
        unit_id: isPlatformAdmin ? undefined : activeUnitId || undefined,
      }),
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
    queryKey: ["pharmacy-inventory-dropdown"],
    queryFn: () =>
      getPharmacyInventory({
        limit: 100,
      }),
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
    mutationFn: createPharmacyTransfer,
    onSuccess: () => {
      toast.success(
        isStoreManager
          ? "Stock dispatched successfully."
          : "Restock request submitted successfully."
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
    mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" }) =>
      updatePharmacyTransferStatus(id, action),
    onSuccess: (_, variables) => {
      toast.success(
        variables.action === "approve"
          ? "Transfer request approved and stock transferred."
          : "Transfer request rejected."
      );
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

  const handleAction = (id: string, action: "approve" | "reject") => {
    if (confirm(`Are you sure you want to ${action} this transfer request?`)) {
      updateStatusMutation.mutate({ id, action });
    }
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
                    <th className="p-4 font-semibold text-center">Items Count</th>
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
                      <td className="p-4 text-center font-semibold text-slate-800 dark:text-slate-200">
                        {trf.items_count} Formulation(s)
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
                        {new Date(trf.created_at).toLocaleString()}
                      </td>
                      {(isStoreManager || isPlatformAdmin) && (
                        <td className="p-4 text-right">
                          {trf.status === "pending" && (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleAction(trf.id, "approve")}
                                className="rounded-lg p-2 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                                title="Approve Request"
                                disabled={updateStatusMutation.isPending}
                              >
                                <FiCheck className="h-4.5 w-4.5" />
                              </button>
                              <button
                                onClick={() => handleAction(trf.id, "reject")}
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
    </div>
  );
}
