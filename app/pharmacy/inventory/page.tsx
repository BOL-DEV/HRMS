"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/shared/Header";
import { formatCurrency } from "@/libs/helper";
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiX, FiChevronLeft, FiChevronRight, FiFolderPlus, FiActivity, FiSend } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { getAgentAccessToken, decodeJwt } from "@/libs/auth";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPharmacyCategories,
  createPharmacyCategory,
  updatePharmacyCategory,
  deletePharmacyCategory,
  getPharmacyInventory,
  addPharmacyDrug,
  updatePharmacyDrug,
  deletePharmacyDrug,
  restockPharmacyItem,
  getPharmacyProfile,
  getPharmacyDrugHistory,
  createPharmacyTransfer,
  getPharmacyUnits,
  BackendDrugItem,
  PharmacyCategory,
  PharmacyDrugPayload,
  GetPharmacyInventoryResponse,
  unwrapPharmacyData,
} from "@/libs/pharmacy-api";

export default function PharmacyInventoryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = typeof window !== "undefined" ? getAgentAccessToken() : null;

  const { data: profileResponse } = useQuery({
    queryKey: ["pharmacy-profile"],
    queryFn: getPharmacyProfile,
    enabled: Boolean(accessToken),
  });

  const decoded = React.useMemo(() => (accessToken ? decodeJwt(accessToken) : null), [accessToken]);
  const profile = profileResponse?.data;
  const isPlatformAdmin = decoded?.role === "PLATFORM_ADMIN" || (profile?.role as string) === "PLATFORM_ADMIN";
  const isStoreManager = decoded?.role === "PHARMACY_STORE" || (profile?.role as string) === "PHARMACY_STORE";
  const hasEditAccess = isPlatformAdmin || isStoreManager;
  const hasHistoryAccess = isPlatformAdmin || decoded?.modules?.includes("inventory-history") || profile?.modules?.includes("inventory-history");

  // Request Restock States (Point -> Store)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestItem, setRequestItem] = useState<BackendDrugItem | null>(null);
  const [requestQty, setRequestQty] = useState("");
  const [requestRemarks, setRequestRemarks] = useState("");

  const unitsQuery = useQuery({
    queryKey: ["pharmacy-units"],
    queryFn: () => getPharmacyUnits(),
    enabled: Boolean(accessToken),
  });

  const mainStoreUnit = React.useMemo(() => {
    const rawUnits = unitsQuery.data?.data || [];
    return rawUnits.find((u) => u.type === "store");
  }, [unitsQuery.data]);

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

  const requestRestockMutation = useMutation({
    mutationFn: createPharmacyTransfer,
    onSuccess: () => {
      toast.success("Restock request submitted to central store.");
      setIsRequestModalOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to submit restock request.");
    },
  });

  // Filters State
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedUnitFilter, setSelectedUnitFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const unitsList = React.useMemo(() => {
    return unitsQuery.data?.data || [];
  }, [unitsQuery.data]);

  const targetUnitId = React.useMemo(() => {
    if (isStoreManager) {
      return selectedUnitFilter || mainStoreUnit?.id || "";
    }
    return activeUnitId;
  }, [isStoreManager, selectedUnitFilter, mainStoreUnit, activeUnitId]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDrug, setEditingDrug] = useState<BackendDrugItem | null>(null);

  // History Drawer State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyItemId, setHistoryItemId] = useState("");
  const [historyItemName, setHistoryItemName] = useState("");

  const { data: historyQueryData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["pharmacy-drug-history", historyItemId],
    queryFn: () => getPharmacyDrugHistory(historyItemId),
    enabled: Boolean(accessToken) && isHistoryOpen && Boolean(historyItemId),
  });

  // Form Fields State
  const [formName, setFormName] = useState("");
  const [formGeneric, setFormGeneric] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formBatch, setFormBatch] = useState("");
  const [formExpiry, setFormExpiry] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formReorderLevel, setFormReorderLevel] = useState("50");
  const [formPrice, setFormPrice] = useState("");
  const [formStatus, setFormStatus] = useState("active");

  // Restock states
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockItem, setRestockItem] = useState<BackendDrugItem | null>(null);
  const [restockQty, setRestockQty] = useState("");
  const [restockBatch, setRestockBatch] = useState("");
  const [restockExpiry, setRestockExpiry] = useState("");

  const restockMutation = useMutation({
    mutationFn: restockPharmacyItem,
    onSuccess: () => {
      toast.success("Stock added/updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["pharmacy-inventory"] });
      setIsRestockModalOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to add stock.");
    },
  });

  const handleOpenRestockModal = (item: BackendDrugItem) => {
    setRestockItem(item);
    setRestockQty("");
    setRestockBatch(item.batch_number || "");
    setRestockExpiry(item.expiry_date ? item.expiry_date.substring(0, 7) : "");
    setIsRestockModalOpen(true);
  };

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem) return;
    const qty = Number(restockQty);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Please enter a valid positive quantity.");
      return;
    }
    const expiryRaw = restockExpiry.trim();
    const expiry_date = expiryRaw.length === 7 ? `${expiryRaw}-01` : expiryRaw;

    restockMutation.mutate({
      pharmacy_item_id: restockItem.id,
      quantity: qty,
      batch_number: restockBatch.trim() || undefined,
      expiry_date: expiry_date || undefined,
    });
  };

  const handleOpenRequestModal = (item: BackendDrugItem) => {
    setRequestItem(item);
    setRequestQty("");
    setRequestRemarks("");
    setIsRequestModalOpen(true);
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestItem) return;
    const qty = Number(requestQty);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Please enter a valid positive quantity.");
      return;
    }
    if (!mainStoreUnit) {
      toast.error("Central Store unit not found. Cannot request restock.");
      return;
    }
    if (!activeUnitId) {
      toast.error("Active pharmacy point not resolved. Please re-login.");
      return;
    }

    requestRestockMutation.mutate({
      from_unit_id: mainStoreUnit.id,
      to_unit_id: activeUnitId,
      remarks: requestRemarks.trim() || undefined,
      items: [
        {
          source_pharmacy_item_id: requestItem.id,
          quantity: qty,
        },
      ],
    });
  };

  // Category Creation Inline State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState("");
  const [editingCategoryName, setEditingCategoryName] = useState("");

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  // Queries
  const categoriesQuery = useQuery({
    queryKey: ["pharmacy-categories"],
    queryFn: getPharmacyCategories,
    enabled: Boolean(accessToken),
  });

  const categories = React.useMemo<PharmacyCategory[]>(() => {
    return unwrapPharmacyData<PharmacyCategory[]>(categoriesQuery.data, []);
  }, [categoriesQuery.data]);

  const { data: inventoryData, isLoading, error } = useQuery({
    queryKey: ["pharmacy-inventory", search, filterCategory, filterStatus, currentPage, targetUnitId],
    queryFn: () =>
      getPharmacyInventory({
        search: search || undefined,
        category_id: filterCategory || undefined,
        status: filterStatus || undefined,
        pharmacy_unit_id: targetUnitId || undefined,
        page: currentPage,
        limit: 15,
      }),
    enabled: Boolean(accessToken && (!isStoreManager || targetUnitId)),
  });

  // Mutations
  const createCategoryMutation = useMutation({
    mutationFn: createPharmacyCategory,
    onSuccess: (response) => {
      const newCat = unwrapPharmacyData<PharmacyCategory | null>(response, null);
      if (!newCat) {
        toast.success("Category created successfully.");
        queryClient.invalidateQueries({ queryKey: ["pharmacy-categories"] });
        setIsAddingCategory(false);
        setNewCategoryName("");
        return;
      }

      toast.success(`Category "${newCat.name}" created successfully.`);
      queryClient.invalidateQueries({ queryKey: ["pharmacy-categories"] });
      setFormCategory(newCat.id);
      setIsAddingCategory(false);
      setNewCategoryName("");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create category.");
    },
  });

  const addDrugMutation = useMutation({
    mutationFn: addPharmacyDrug,
    onSuccess: () => {
      toast.success("New formulation added to catalog.");
      queryClient.invalidateQueries({ queryKey: ["pharmacy-inventory"] });
      setIsModalOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to add drug.");
    },
  });

  const updateDrugMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PharmacyDrugPayload }) => updatePharmacyDrug(id, payload),
    onSuccess: () => {
      toast.success("Formulation updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["pharmacy-inventory"] });
      setIsModalOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update drug.");
    },
  });

  const deleteDrugMutation = useMutation({
    mutationFn: deletePharmacyDrug,
    onSuccess: () => {
      toast.success("Drug removed from catalog.");
      queryClient.invalidateQueries({ queryKey: ["pharmacy-inventory"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete drug.");
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({
      id,
      name,
      isActive,
    }: {
      id: string;
      name: string;
      isActive: boolean;
    }) => updatePharmacyCategory(id, name, isActive),
    onSuccess: () => {
      toast.success("Category updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["pharmacy-categories"] });
      queryClient.invalidateQueries({ queryKey: ["pharmacy-inventory"] });
      setEditingCategoryId("");
      setEditingCategoryName("");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update category.");
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deletePharmacyCategory,
    onSuccess: () => {
      toast.success("Category removed successfully.");
      queryClient.invalidateQueries({ queryKey: ["pharmacy-categories"] });
      queryClient.invalidateQueries({ queryKey: ["pharmacy-inventory"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to remove category.");
    },
  });

  // Actions
  const handleOpenAddModal = () => {
    setEditingDrug(null);
    setFormName("");
    setFormGeneric("");
    setFormCategory(categories[0]?.id || "");
    setFormBatch("");
    setFormExpiry("");
    setFormStock("");
    setFormReorderLevel("50");
    setFormPrice("");
    setFormStatus("active");
    setIsAddingCategory(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (drug: BackendDrugItem) => {
    setEditingDrug(drug);
    setFormName(drug.name);
    setFormGeneric(drug.generic_name || "");
    setFormCategory(drug.category_id);
    setFormBatch(drug.batch_number || "");
    // YYYY-MM-DD -> YYYY-MM
    setFormExpiry(drug.expiry_date ? drug.expiry_date.substring(0, 7) : "");
    setFormStock(String(drug.stock));
    setFormReorderLevel(String(drug.reorder_level || 50));
    setFormPrice(String(drug.unit_price));
    setFormStatus(drug.is_active ? "active" : "inactive");
    setIsAddingCategory(false);
    setIsModalOpen(true);
  };

  const handleOpenHistory = (item: BackendDrugItem) => {
    setHistoryItemId(item.id);
    setHistoryItemName(item.name);
    setIsHistoryOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const name = formName.trim();
    const generic_name = formGeneric.trim();
    const batch_number = formBatch.trim();
    const expiryRaw = formExpiry.trim();
    const stock = Number(formStock);
    const reorder_level = Number(formReorderLevel);
    const unit_price = Number(formPrice);

    if (!name || !formCategory || !expiryRaw || isNaN(stock) || isNaN(reorder_level) || isNaN(unit_price)) {
      toast.error("Please fill out all fields with valid data.");
      return;
    }

    // backend expects YYYY-MM-DD
    const expiry_date = expiryRaw.length === 7 ? `${expiryRaw}-01` : expiryRaw;

    const payload: PharmacyDrugPayload = {
      name,
      generic_name: generic_name || undefined,
      category_id: formCategory,
      batch_number: batch_number || undefined,
      expiry_date,
      stock,
      reorder_level,
      unit_price,
      status: formStatus,
    };

    if (editingDrug) {
      updateDrugMutation.mutate({ id: editingDrug.id, payload });
    } else {
      addDrugMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name} from inventory?`)) {
      deleteDrugMutation.mutate(id);
    }
  };

  const handleCreateCategory = () => {
    const catName = newCategoryName.trim();
    if (!catName) {
      toast.error("Enter a valid category name.");
      return;
    }
    createCategoryMutation.mutate(catName);
  };

  const handleStartEditCategory = (category: PharmacyCategory) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  };

  const handleSaveCategory = (category: PharmacyCategory) => {
    const name = editingCategoryName.trim();
    if (!name) {
      toast.error("Enter a valid category name.");
      return;
    }

    updateCategoryMutation.mutate({
      id: category.id,
      name,
      isActive: category.is_active,
    });
  };

  const getStatusStyle = (status: BackendDrugItem["status"] | string) => {
    const cleanStatus = String(status).toLowerCase();
    if (cleanStatus === "in stock") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20";
    } else if (cleanStatus === "low stock") {
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20";
    } else if (cleanStatus === "expired") {
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20";
    } else {
      return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400";
    }
  };

  if (!accessToken) {
    return null;
  }

  const inventory = unwrapPharmacyData<GetPharmacyInventoryResponse | null>(inventoryData, null);
  const items = inventory?.items ?? [];
  const totalPages = inventory?.total_pages ?? 1;
  const totalItems = inventory?.total_items ?? 0;

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-canvas">
      <Header
        title="Drug Inventory"
        Subtitle="View formulations, manage stocks, update batch codes, and monitor expiries"
      />

      <div className="space-y-6 p-6">
        {/* Table Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Inventory</h1>
            <p className="text-sm text-gray-500">{totalItems} items in catalog</p>
          </div>
          <div className="flex gap-2">
            {hasEditAccess && (
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 shadow-sm"
              >
                <FiPlus />
                Add Drug
              </button>
            )}
            {hasEditAccess && (
              <button
                onClick={() => setIsCategoryManagerOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <FiFolderPlus />
                Categories
              </button>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        <div className={`grid gap-4 bg-white p-4 rounded-2xl border border-gray-200 dark:bg-slate-900 dark:border-slate-800 ${
          isStoreManager ? "sm:grid-cols-5" : "sm:grid-cols-4"
        }`}>
          <div className="relative sm:col-span-2">
            <FiSearch className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, generic name, batch number..."
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-950 outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>
          {isStoreManager && (
            <div>
              <select
                value={selectedUnitFilter}
                onChange={(e) => {
                  setSelectedUnitFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="">Central Store Warehouse</option>
                {unitsList.filter((u: any) => u.type === "point" && u.is_active).map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name} (Point)
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="">All Categories</option>
              {categories.map((c: PharmacyCategory) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="In stock">In stock</option>
              <option value="Low stock">Low stock</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Inventory List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-700 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
            Error loading inventory: {error instanceof Error ? error.message : "Server error"}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                    <th className="p-4 font-semibold">Name</th>
                    <th className="p-4 font-semibold">Category</th>
                    <th className="p-4 font-semibold">Batch</th>
                    <th className="p-4 font-semibold">Expiry</th>
                    <th className="p-4 font-semibold text-center">Stock</th>
                    <th className="p-4 font-semibold text-center">Reorder Limit</th>
                    <th className="p-4 font-semibold text-right">Price</th>
                    <th className="p-4 font-semibold text-center">Status</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-gray-500">
                        No drug items match your search.
                      </td>
                    </tr>
                  ) : (
                    items.map((item: BackendDrugItem) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-4">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.generic_name}</p>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">{item.category_name}</td>
                        <td className="p-4 font-mono text-slate-500 dark:text-slate-400">{item.batch_number || "--"}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">{item.expiry_date}</td>
                        <td className="p-4 text-center font-semibold text-slate-900 dark:text-slate-100">{item.stock}</td>
                        <td className="p-4 text-center text-gray-500 dark:text-slate-400">{item.reorder_level}</td>
                        <td className="p-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusStyle(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            {hasHistoryAccess && (
                              <button
                                onClick={() => handleOpenHistory(item)}
                                className="rounded-lg p-2 text-blue-500 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/30"
                                title="Audit History"
                              >
                                <FiActivity className="h-4 w-4" />
                              </button>
                            )}
                             {hasEditAccess ? (
                              <>
                                <button
                                  onClick={() => handleOpenRestockModal(item)}
                                  className="rounded-lg p-2 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                                  title="Restock Item"
                                >
                                  <FiPlus className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleOpenEditModal(item)}
                                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-slate-400 dark:hover:bg-slate-800"
                                  title="Edit Drug"
                                >
                                  <FiEdit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id, item.name)}
                                  className="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
                                  title="Delete Drug"
                                >
                                  <FiTrash2 className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleOpenRequestModal(item)}
                                className="rounded-lg p-2 text-amber-500 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
                                title="Request Restock"
                              >
                                <FiSend className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 ? (
              <div className="flex items-center justify-between border-t border-gray-100 p-4 dark:border-slate-800">
                <span className="text-xs text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-gray-200 p-2 text-slate-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <FiChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-gray-200 p-2 text-slate-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <FiChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs overflow-y-auto">
          <div className="my-8 w-full max-w-xl rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900 animate-fade-in-slide">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                {editingDrug ? "Edit Formulation Details" : "Add New Formulation"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                    Drug Name
                  </span>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Paracetamol 500mg"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-canvas dark:text-white"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                    Generic Chemical Name
                  </span>
                  <input
                    type="text"
                    value={formGeneric}
                    onChange={(e) => setFormGeneric(e.target.value)}
                    placeholder="e.g. Acetaminophen"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-canvas dark:text-white"
                  />
                </label>

                <div className="block space-y-2">
                  <span className="block text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                    Category
                  </span>
                  {!isAddingCategory ? (
                    <div className="flex gap-2 items-stretch">
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-canvas dark:text-white"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map((c: PharmacyCategory) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setIsAddingCategory(true)}
                        className="flex items-center justify-center px-3.5 border border-gray-200 bg-white hover:bg-gray-50 text-slate-700 rounded-xl dark:bg-canvas dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition"
                        title="Add New Category"
                      >
                        <FiFolderPlus className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 items-stretch animate-fade-in-slide">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="New category..."
                        className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-canvas dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleCreateCategory}
                        disabled={createCategoryMutation.isPending}
                        className="bg-brand-700 hover:bg-brand-600 text-white rounded-xl px-4 text-xs font-semibold transition"
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingCategory(false)}
                        className="flex items-center justify-center px-3.5 border border-gray-200 bg-white hover:bg-gray-50 text-slate-700 rounded-xl dark:bg-canvas dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition"
                      >
                        <FiX className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                    Batch Number
                  </span>
                  <input
                    type="text"
                    value={formBatch}
                    onChange={(e) => setFormBatch(e.target.value)}
                    placeholder="e.g. PCM2025-001"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-canvas dark:text-white"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                    Expiry Month/Year
                  </span>
                  <input
                    type="month"
                    value={formExpiry}
                    onChange={(e) => setFormExpiry(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-canvas dark:text-white"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                    Stock Count
                  </span>
                  <input
                    type="number"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    placeholder="e.g. 500"
                    min="0"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-canvas dark:text-white"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                    Reorder Stock Threshold
                  </span>
                  <input
                    type="number"
                    value={formReorderLevel}
                    onChange={(e) => setFormReorderLevel(e.target.value)}
                    placeholder="e.g. 50"
                    min="1"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-canvas dark:text-white"
                    required
                  />
                </label>

                <label className={editingDrug ? "block" : "block sm:col-span-2"}>
                  <span className="mb-2 block text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                    Unit Price (₦)
                  </span>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="e.g. 150"
                    min="0"
                    step="any"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-canvas dark:text-white"
                    required
                  />
                </label>

                {editingDrug && (
                  <label className="block animate-fade-in">
                    <span className="mb-2 block text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                      Status
                    </span>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-canvas dark:text-white"
                      required
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 mt-6 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addDrugMutation.isPending || updateDrugMutation.isPending}
                  className="rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 shadow-sm disabled:opacity-60"
                >
                  {editingDrug ? "Save Formulation" : "Add Formulation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isRestockModalOpen && restockItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs overflow-y-auto">
          <div className="my-8 w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900 animate-fade-in-slide">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                Restock Formulation
              </h3>
              <button
                onClick={() => setIsRestockModalOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-150 dark:border-slate-800 animate-fade-in">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{restockItem.name}</p>
              <p className="text-xs text-gray-500 italic mt-0.5">{restockItem.generic_name || 'Generic not specified'}</p>
              <p className="text-xs text-gray-600 dark:text-slate-400 mt-2">Current stock count: <span className="font-bold text-slate-800 dark:text-white">{restockItem.stock}</span></p>
            </div>

            <form onSubmit={handleRestockSubmit} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                  Quantity to Add
                </span>
                <input
                  type="number"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  placeholder="e.g. 100"
                  min="1"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-canvas dark:text-white"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                  Batch Number (Optional)
                </span>
                <input
                  type="text"
                  value={restockBatch}
                  onChange={(e) => setRestockBatch(e.target.value)}
                  placeholder="e.g. B123-NEW"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-canvas dark:text-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                  Expiry Month/Year (Optional)
                </span>
                <input
                  type="month"
                  value={restockExpiry}
                  onChange={(e) => setRestockExpiry(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-canvas dark:text-white"
                />
              </label>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 mt-6 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={restockMutation.isPending}
                  className="rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 shadow-sm disabled:opacity-60"
                >
                  Add Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isCategoryManagerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">Drug Categories</h3>
                <p className="text-xs text-gray-500">Rename categories or suspend them from new use.</p>
              </div>
              <button
                onClick={() => setIsCategoryManagerOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {categories.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500 dark:border-slate-700">
                  No categories created yet.
                </div>
              ) : (
                categories.map((category) => {
                  const isEditing = editingCategoryId === category.id;

                  return (
                    <div
                      key={category.id}
                      className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <input
                            value={editingCategoryName}
                            onChange={(event) => setEditingCategoryName(event.target.value)}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-canvas dark:text-white"
                          />
                        ) : (
                          <>
                            <p className="font-semibold text-slate-900 dark:text-white">{category.name}</p>
                            <p className="text-xs text-gray-500">
                              {category.item_count} active item(s) | {category.is_active ? "Active" : "Suspended"}
                            </p>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSaveCategory(category)}
                              disabled={updateCategoryMutation.isPending}
                              className="rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCategoryId("");
                                setEditingCategoryName("");
                              }}
                              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStartEditCategory(category)}
                              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateCategoryMutation.mutate({
                                  id: category.id,
                                  name: category.name,
                                  isActive: !category.is_active,
                                })
                              }
                              disabled={updateCategoryMutation.isPending}
                              className="rounded-lg border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-60 dark:border-brand-500/40 dark:text-brand-300"
                            >
                              {category.is_active ? "Suspend" : "Reactivate"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Remove category "${category.name}"?`)) {
                                  deleteCategoryMutation.mutate(category.id);
                                }
                              }}
                              disabled={deleteCategoryMutation.isPending}
                              className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/30"
                            >
                              Remove
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Audit History Drawer */}
      {isHistoryOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-xs">
          <div className="w-full max-w-2xl h-screen bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800 shadow-2xl flex flex-col animate-fade-in-slide">
            {/* Drawer Header */}
            <div className="p-6 border-b border-gray-150 dark:border-slate-800 flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest">
                  Audit Logs
                </span>
                <h3 className="text-xl font-extrabold text-slate-950 dark:text-white mt-1">
                  {historyItemName}
                </h3>
                {historyQueryData?.data?.item && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {historyQueryData.data.item.generic_name || "No generic name"} | {historyQueryData.data.item.category_name}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setIsHistoryOpen(false);
                  setHistoryItemId("");
                  setHistoryItemName("");
                }}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {/* Current Item Overview Grid */}
            {historyQueryData?.data?.item && (
              <div className="px-6 py-4 bg-gray-50/50 dark:bg-slate-800/20 border-b border-gray-150 dark:border-slate-800 grid grid-cols-3 gap-4 text-center">
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Current Stock
                  </span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {historyQueryData.data.item.stock}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Unit Price
                  </span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(historyQueryData.data.item.unit_price)}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Batch
                  </span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {historyQueryData.data.item.batch_number || "--"}
                  </span>
                </div>
              </div>
            )}

            {/* Drawer Body / Timeline */}
            <div className="flex-1 overflow-y-auto p-6">
              {isHistoryLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-700 border-t-transparent"></div>
                </div>
              ) : !historyQueryData?.data?.history || historyQueryData.data.history.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center text-center">
                  <p className="text-sm text-gray-500">No activity history recorded for this formulation.</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Vertical Timeline Guide Line */}
                  <div className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-gray-250 dark:bg-slate-800" />

                  <div className="space-y-6">
                    {historyQueryData.data.history.map((event, index) => {
                      const eventDateStr = new Date(event.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <div key={index} className="relative flex gap-4 pl-10">
                          {/* Timeline Node Badge */}
                          <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center shadow-xs border border-white dark:border-slate-900 ${
                            event.type === "sale"
                              ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                              : event.type === "restock"
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"
                          }`}>
                            {event.type === "sale" ? (
                              <span className="text-sm font-bold">-</span>
                            ) : event.type === "restock" ? (
                              <span className="text-sm font-bold">+</span>
                            ) : (
                              <span className="text-xs font-bold">N</span>
                            )}
                          </div>

                          {/* Event Content Card */}
                          <div className="flex-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-xs hover:border-gray-300 dark:hover:border-slate-700 transition">
                            <div className="flex items-center justify-between gap-4">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                                event.type === "sale"
                                  ? "bg-amber-100/60 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
                                  : event.type === "restock"
                                  ? "bg-emerald-100/60 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                                  : "bg-indigo-100/60 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300"
                              }`}>
                                {event.type}
                              </span>
                              <span className="text-xs text-gray-500">{eventDateStr}</span>
                            </div>

                            <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                              {event.type === "sale" ? (
                                <>
                                  Dispensed <span className="text-amber-600 font-bold">{Math.abs(event.quantity_changed)}</span> unit(s)
                                </>
                              ) : event.type === "restock" ? (
                                <>
                                  Restocked <span className="text-emerald-600 font-bold">+{event.quantity_changed}</span> unit(s)
                                </>
                              ) : (
                                <>
                                  Initial Load of <span className="text-indigo-600 font-bold">+{event.quantity_changed}</span> unit(s)
                                </>
                              )}
                              <span className="text-xs text-gray-400 font-normal ml-2">
                                (Remaining: {event.remaining_stock} units)
                              </span>
                            </p>

                            {/* Details Summary Table */}
                            <div className="mt-3.5 pt-3.5 border-t border-gray-100 dark:border-slate-800/80 text-xs text-gray-500 dark:text-slate-400 space-y-2">
                              {event.type === "sale" && (
                                <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
                                  <div><span className="font-semibold text-gray-400">Billing Code:</span> <span className="font-mono text-slate-800 dark:text-slate-200">{event.details.billing_code}</span></div>
                                  <div><span className="font-semibold text-gray-400">Receipt No:</span> <span className="font-mono text-slate-800 dark:text-slate-200">{event.details.receipt_no || "--"}</span></div>
                                  <div><span className="font-semibold text-gray-400">Patient:</span> <span className="text-slate-800 dark:text-slate-200">{event.details.patient_name || "--"} ({event.details.patient_id || "--"})</span></div>
                                  <div><span className="font-semibold text-gray-400">Phone:</span> <span className="text-slate-800 dark:text-slate-200">{event.details.phone_number || "--"}</span></div>
                                  <div><span className="font-semibold text-gray-400">Price Sold:</span> <span className="text-slate-800 dark:text-slate-200">{formatCurrency(event.details.unit_price_sold ?? 0)}/unit</span></div>
                                  <div><span className="font-semibold text-gray-400">Total Price:</span> <span className="text-slate-800 dark:text-slate-200 font-bold">{formatCurrency(event.details.total_price_sold ?? 0)}</span></div>
                                  <div><span className="font-semibold text-gray-400">Pharmacist:</span> <span className="text-slate-800 dark:text-slate-200">{event.details.pharmacist_name || "--"}</span></div>
                                  <div><span className="font-semibold text-gray-400">Cleared By:</span> <span className="text-slate-800 dark:text-slate-200">{event.details.bill_clearer_name || "--"} ({event.details.payment_type || "--"})</span></div>
                                </div>
                              )}

                              {event.type === "restock" && (
                                <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
                                  <div><span className="font-semibold text-gray-400">Restocked By:</span> <span className="text-slate-800 dark:text-slate-200">{event.details.pharmacist_name || "--"}</span></div>
                                  <div><span className="font-semibold text-gray-400">Stock Shift:</span> <span className="text-slate-800 dark:text-slate-200">{event.details.old_stock} &rarr; {event.details.new_stock}</span></div>
                                  <div><span className="font-semibold text-gray-400">Batch Shift:</span> <span className="text-slate-800 dark:text-slate-200 font-mono">{event.details.old_batch || "--"} &rarr; {event.details.new_batch || "--"}</span></div>
                                  <div><span className="font-semibold text-gray-400">Expiry Shift:</span> <span className="text-slate-800 dark:text-slate-200">{event.details.old_expiry || "--"} &rarr; {event.details.new_expiry || "--"}</span></div>
                                </div>
                              )}

                              {event.type === "create" && (
                                <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
                                  <div><span className="font-semibold text-gray-400">Created By:</span> <span className="text-slate-800 dark:text-slate-200">{event.details.pharmacist_name || "--"}</span></div>
                                  <div><span className="font-semibold text-gray-400">Initial Stock:</span> <span className="text-slate-800 dark:text-slate-200">{event.details.initial_stock} units</span></div>
                                  <div><span className="font-semibold text-gray-400">Batch Code:</span> <span className="text-slate-800 dark:text-slate-200 font-mono">{event.details.batch_number || "--"}</span></div>
                                  <div><span className="font-semibold text-gray-400">Expiry Date:</span> <span className="text-slate-800 dark:text-slate-200">{event.details.expiry_date || "--"}</span></div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Request Restock Modal */}
      {isRequestModalOpen && requestItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-gray-150 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Request Restock from Store
              </h3>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Formulation
                </label>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{requestItem.name}</p>
                  <p className="text-xs text-gray-500">{requestItem.generic_name || "No generic name"}</p>
                  <p className="text-xs text-brand-600 mt-1">Current Stock: {requestItem.stock} units</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Quantity to Request *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={requestQty}
                  onChange={(e) => setRequestQty(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-slate-950 focus:border-brand-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Remarks / Notes
                </label>
                <textarea
                  value={requestRemarks}
                  onChange={(e) => setRequestRemarks(e.target.value)}
                  placeholder="Reason for restock request..."
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-slate-950 focus:border-brand-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestRestockMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 shadow-sm disabled:opacity-50"
                >
                  {requestRestockMutation.isPending ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
