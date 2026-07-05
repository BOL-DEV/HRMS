"use client";

import React, { useEffect, useMemo, useState } from "react";
import Header from "@/components/shared/Header";
import {
  getPharmacyInventory,
  addDrug,
  updateDrug,
  deleteDrug,
  DrugItem,
} from "@/libs/pharmacy-mock";
import { formatCurrency } from "@/libs/helper";
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiX } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { getAgentAccessToken } from "@/libs/auth";
import { useRouter } from "next/navigation";

export default function PharmacyInventoryPage() {
  const router = useRouter();
  const accessToken = typeof window !== "undefined" ? getAgentAccessToken() : null;

  // React State
  const [inventory, setInventory] = useState<DrugItem[]>(() => {
    if (typeof window !== "undefined") {
      return getPharmacyInventory();
    }
    return [];
  });
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDrug, setEditingDrug] = useState<DrugItem | null>(null);

  // Form Fields State
  const [formName, setFormName] = useState("");
  const [formGeneric, setFormGeneric] = useState("");
  const [formCategory, setFormCategory] = useState("Tablet");
  const [formBatch, setFormBatch] = useState("");
  const [formExpiry, setFormExpiry] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formPrice, setFormPrice] = useState("");

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  const categories = ["Tablet", "Liquid", "Capsule", "Injection", "Supply", "Inhaler"];

  // Open modal for adding
  const handleOpenAddModal = () => {
    setEditingDrug(null);
    setFormName("");
    setFormGeneric("");
    setFormCategory("Tablet");
    setFormBatch("");
    setFormExpiry("");
    setFormStock("");
    setFormPrice("");
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (drug: DrugItem) => {
    setEditingDrug(drug);
    setFormName(drug.name);
    setFormGeneric(drug.genericName);
    setFormCategory(drug.category);
    setFormBatch(drug.batchNumber);
    setFormExpiry(drug.expiryDate);
    setFormStock(String(drug.stock));
    setFormPrice(String(drug.price));
    setIsModalOpen(true);
  };

  // Form Submit (Save / Add)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const name = formName.trim();
    const genericName = formGeneric.trim();
    const batchNumber = formBatch.trim();
    const expiryDate = formExpiry.trim();
    const stock = Number(formStock);
    const price = Number(formPrice);

    if (!name || !genericName || !batchNumber || !expiryDate || isNaN(stock) || isNaN(price)) {
      toast.error("Please fill out all fields with valid data.");
      return;
    }

    if (editingDrug) {
      const updated = updateDrug(editingDrug.id, {
        name,
        genericName,
        category: formCategory,
        batchNumber,
        expiryDate,
        stock,
        price,
      });
      if (updated) {
        toast.success("Drug details updated successfully.");
      } else {
        toast.error("Unable to update drug.");
      }
    } else {
      addDrug({
        name,
        genericName,
        category: formCategory,
        batchNumber,
        expiryDate,
        stock,
        price,
      });
      toast.success("New drug added to inventory.");
    }

    // Refresh stock list & close
    setInventory(getPharmacyInventory());
    setIsModalOpen(false);
  };

  // Delete Drug
  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name} from inventory?`)) {
      const ok = deleteDrug(id);
      if (ok) {
        toast.success("Drug removed from catalog.");
        setInventory(getPharmacyInventory());
      } else {
        toast.error("Error removing drug.");
      }
    }
  };

  // Filter List
  const filteredInventory = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return inventory;
    return inventory.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.genericName.toLowerCase().includes(q) ||
        item.batchNumber.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [inventory, search]);

  const getStatusStyle = (status: DrugItem["status"]) => {
    switch (status) {
      case "In Stock":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20";
      case "Low Stock":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20";
      case "Expired":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20";
      case "Out of Stock":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-200 dark:border-red-500/30";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  if (!accessToken) {
    return null;
  }

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
            <p className="text-sm text-gray-500">{inventory.length} items in catalog</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 shadow-sm"
          >
            <FiPlus />
            Add Drug
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <FiSearch className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, generic name, batch number, or barcode..."
            className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-950 outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-brand-400"
          />
        </div>

        {/* Inventory List */}
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
                  <th className="p-4 font-semibold text-right">Price</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      No drug items match your search.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-4">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.genericName}</p>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">{item.category}</td>
                      <td className="p-4 font-mono text-slate-500 dark:text-slate-400">{item.batchNumber}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">{item.expiryDate}</td>
                      <td className="p-4 text-center font-semibold text-slate-900 dark:text-slate-100">{item.stock}</td>
                      <td className="p-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusStyle(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
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
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900 animate-fade-in-slide">
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
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                    Category
                  </span>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-canvas dark:text-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>

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
                    required
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
                  className="rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 shadow-sm"
                >
                  Save Formulation
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
