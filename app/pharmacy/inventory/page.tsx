"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/shared/Header";
import { formatCurrency } from "@/libs/helper";
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiX, FiChevronLeft, FiChevronRight, FiFolderPlus } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { getAgentAccessToken } from "@/libs/auth";
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

  // Filters State
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDrug, setEditingDrug] = useState<BackendDrugItem | null>(null);

  // Form Fields State
  const [formName, setFormName] = useState("");
  const [formGeneric, setFormGeneric] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formBatch, setFormBatch] = useState("");
  const [formExpiry, setFormExpiry] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formReorderLevel, setFormReorderLevel] = useState("50");
  const [formPrice, setFormPrice] = useState("");

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
    queryKey: ["pharmacy-inventory", search, filterCategory, filterStatus, currentPage],
    queryFn: () =>
      getPharmacyInventory({
        search: search || undefined,
        category_id: filterCategory || undefined,
        status: filterStatus || undefined,
        page: currentPage,
        limit: 15,
      }),
    enabled: Boolean(accessToken),
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
    setIsAddingCategory(false);
    setIsModalOpen(true);
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
    };

    if (editingDrug) {
      const { stock: _, ...updatePayload } = payload;
      updateDrugMutation.mutate({ id: editingDrug.id, payload: updatePayload as any });
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
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 shadow-sm"
          >
            <FiPlus />
            Add Drug
          </button>
          <button
            onClick={() => setIsCategoryManagerOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FiFolderPlus />
            Categories
          </button>
        </div>

        {/* Search & Filters */}
        <div className="grid gap-4 sm:grid-cols-4 bg-white p-4 rounded-2xl border border-gray-200 dark:bg-slate-900 dark:border-slate-800">
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
                    <div className="flex gap-2">
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
                        className="p-3 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-xl dark:bg-slate-800 dark:text-slate-200 transition"
                        title="Add New Category"
                      >
                        <FiFolderPlus className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 animate-fade-in-slide">
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
                        className="bg-brand-700 hover:bg-brand-600 text-white rounded-xl px-3 py-2 text-xs font-semibold transition"
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingCategory(false)}
                        className="bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-xl p-3 dark:bg-slate-800 dark:text-slate-200 transition"
                      >
                        <FiX />
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

                {!editingDrug && (
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
                )}

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

                <label className="block sm:col-span-2">
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
    </div>
  );
}
