"use client";

import React, { useEffect, useMemo, useState } from "react";
import Header from "@/components/shared/Header";
import StatusPill from "@/components/shared/StatusPill";
import {
  getPharmacyInventory,
  getPharmacyBills,
  updatePharmacyBill,
  DrugItem,
  PharmacyBillItem,
  PharmacyBill,
} from "@/libs/pharmacy-mock";
import { formatCurrency, formatDateTime } from "@/libs/helper";
import {
  FiSearch,
  FiEdit2,
  FiEye,
  FiTrash2,
  FiX,
  FiCheck,
  FiPrinter,
  FiPlus,
  FiFileText,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { getAgentAccessToken } from "@/libs/auth";
import { useRouter } from "next/navigation";

export default function PharmacyPrescriptionsPage() {
  const router = useRouter();
  const accessToken = typeof window !== "undefined" ? getAgentAccessToken() : null;

  // Active view states
  const [activeTab, setActiveTab] = useState<"pending" | "paid">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  // Live data states
  const [bills, setBills] = useState<PharmacyBill[]>([]);
  const [inventory, setInventory] = useState<DrugItem[]>([]);

  // Modals state
  const [viewingBill, setViewingBill] = useState<PharmacyBill | null>(null);
  const [editingBill, setEditingBill] = useState<PharmacyBill | null>(null);

  // Edit form states
  const [editPatientId, setEditPatientId] = useState("");
  const [editPatientName, setEditPatientName] = useState("");
  const [editPatientPhone, setEditPatientPhone] = useState("");
  const [editDeptId, setEditDeptId] = useState("");
  const [editDeptName, setEditDeptName] = useState("");
  const [editItems, setEditItems] = useState<PharmacyBillItem[]>([]);

  // Add Item inside Edit Modal state
  const [selectedDrugId, setSelectedDrugId] = useState("");
  const [dispenseQty, setDispenseQty] = useState("1");

  const departments = [
    { id: "dep-1", name: "General Medicine" },
    { id: "dep-2", name: "Pediatrics" },
    { id: "dep-3", name: "Cardiology" },
    { id: "dep-4", name: "Surgery" },
    { id: "dep-5", name: "Obstetrics & Gynecology" },
    { id: "dep-6", name: "Pharmacy Department" },
  ];

  const loadData = () => {
    if (typeof window !== "undefined") {
      setBills(getPharmacyBills());
      setInventory(getPharmacyInventory());
    }
  };

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    } else {
      loadData();
    }
  }, [accessToken, router]);

  // Compute available stock for a drug when editing a specific bill
  const getAvailableStockForEdit = (drugId: string) => {
    const drug = inventory.find((d) => d.id === drugId);
    if (!drug) return 0;

    // Add back the quantity that is currently in the bill we are editing
    const originalItem = editingBill?.items.find((it) => it.drugId === drugId);
    const originalQty = originalItem ? originalItem.quantity : 0;

    return drug.stock + originalQty;
  };

  // Filter bills
  const filteredBills = useMemo(() => {
    let list = bills.filter((b) => b.status === activeTab);

    // Apply search query
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (b) =>
          b.code.toLowerCase().includes(q) ||
          b.patientName.toLowerCase().includes(q) ||
          b.patientId.toLowerCase().includes(q) ||
          b.phoneNumber.toLowerCase().includes(q)
      );
    }

    // Apply department filter
    if (deptFilter) {
      list = list.filter((b) => b.departmentId === deptFilter);
    }

    // Sort by creation date descending
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [bills, activeTab, searchQuery, deptFilter]);

  // Handle department change in Edit Modal
  const handleEditDeptChange = (deptId: string) => {
    setEditDeptId(deptId);
    const match = departments.find((d) => d.id === deptId);
    setEditDeptName(match ? match.name : "");
  };

  // Open Edit Modal
  const handleOpenEditModal = (bill: PharmacyBill) => {
    setEditingBill(bill);
    setEditPatientId(bill.patientId);
    setEditPatientName(bill.patientName);
    setEditPatientPhone(bill.phoneNumber);
    setEditDeptId(bill.departmentId);
    setEditDeptName(bill.departmentName);
    setEditItems([...bill.items]);
    setSelectedDrugId("");
    setDispenseQty("1");
  };

  // Update item quantity in Edit Modal
  const handleUpdateItemQty = (drugId: string, qtyStr: string) => {
    const qty = Number(qtyStr);
    if (isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
      return;
    }

    const maxStock = getAvailableStockForEdit(drugId);
    if (qty > maxStock) {
      toast.error(`Only ${maxStock} units of this formulation are available in total.`);
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

  // Remove item from list in Edit Modal
  const handleRemoveEditItem = (drugId: string) => {
    setEditItems((prev) => prev.filter((item) => item.drugId !== drugId));
  };

  // Add formulation to Edit Modal items list
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

    // Check duplicate
    if (editItems.some((item) => item.drugId === selectedDrugId)) {
      toast.error("This formulation has already been added to the prescription.");
      return;
    }

    const newItem: PharmacyBillItem = {
      drugId: drug.id,
      name: drug.name,
      quantity: qty,
      unitPrice: drug.price,
      amount: drug.price * qty,
    };

    setEditItems((prev) => [...prev, newItem]);
    setSelectedDrugId("");
    setDispenseQty("1");
  };

  // Submit edits
  const handleSaveEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBill) return;

    if (!editPatientId.trim() || !editPatientName.trim() || !editPatientPhone.trim() || !editDeptId) {
      toast.error("Please fill in all patient and department details.");
      return;
    }

    if (editItems.length === 0) {
      toast.error("The prescription list cannot be empty. Add at least one drug formulation.");
      return;
    }

    const result = updatePharmacyBill(editingBill.code, {
      patientId: editPatientId.trim(),
      patientName: editPatientName.trim(),
      phoneNumber: editPatientPhone.trim(),
      departmentId: editDeptId,
      departmentName: editDeptName,
      items: editItems,
    });

    if (result.success) {
      toast.success(`Prescription bill ${editingBill.code} updated successfully.`);
      setEditingBill(null);
      loadData();
    } else {
      toast.error(result.error || "Failed to save updates.");
    }
  };

  // Calculated grand total of edited items
  const editGrandTotal = useMemo(() => {
    return editItems.reduce((sum, item) => sum + item.amount, 0);
  }, [editItems]);

  // Selected drug for display in Edit Modal dropdown preview
  const activeSelectedDrug = useMemo(() => {
    return inventory.find((d) => d.id === selectedDrugId) ?? null;
  }, [selectedDrugId, inventory]);

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
            <p className="text-sm text-gray-500">Track drug prescriptions and dispense statuses</p>
          </div>

          <div className="inline-flex rounded-xl bg-gray-200/80 p-1 dark:bg-slate-800">
            <button
              onClick={() => setActiveTab("pending")}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                activeTab === "pending"
                  ? "bg-white text-slate-950 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              To Dispense (Pending Pay)
            </button>
            <button
              onClick={() => setActiveTab("paid")}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                activeTab === "paid"
                  ? "bg-white text-slate-950 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Dispensed (Completed)
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <FiSearch className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Patient Name, ID, Phone, or Bill Code..."
              className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-950 outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-slate-950 outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                  <th className="p-4 font-semibold">Bill Code</th>
                  <th className="p-4 font-semibold">Patient Information</th>
                  <th className="p-4 font-semibold">Department</th>
                  <th className="p-4 font-semibold">Items Count</th>
                  <th className="p-4 font-semibold text-right">Total Amount</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Date Created</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      No prescriptions found matching details.
                    </td>
                  </tr>
                ) : (
                  filteredBills.map((bill) => (
                    <tr key={bill.code} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-4 font-mono font-bold text-brand-700 dark:text-brand-400">
                        {bill.code}
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {bill.patientName}
                          </p>
                          <p className="text-xs text-gray-500">
                            ID: {bill.patientId} | {bill.phoneNumber}
                          </p>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">
                        {bill.departmentName}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">
                        {bill.items.length} formulation(s)
                      </td>
                      <td className="p-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(bill.totalAmount)}
                      </td>
                      <td className="p-4">
                        <StatusPill status={bill.status === "paid" ? "Paid" : "Pending"} />
                      </td>
                      <td className="p-4 text-xs text-gray-400">
                        {formatDateTime(bill.createdAt)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setViewingBill(bill)}
                            className="rounded-lg p-2 text-slate-600 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-800"
                            title="View Receipt / Clearance Code"
                          >
                            <FiEye className="h-4 w-4" />
                          </button>
                          {bill.status === "pending" ? (
                            <button
                              onClick={() => handleOpenEditModal(bill)}
                              className="rounded-lg p-2 text-brand-700 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
                              title="Edit Drugs List"
                            >
                              <FiEdit2 className="h-4 w-4" />
                            </button>
                          ) : null}
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

            {/* Receipt Content */}
            <div className="text-center px-4">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold mb-4 ${
                  viewingBill.status === "paid"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                }`}
              >
                {viewingBill.status === "paid" ? "Medication Dispensed (Paid)" : "Awaiting Checkout Payment"}
              </span>
              <h3 className="text-xl font-bold text-slate-950 dark:text-white">Prescription Receipt</h3>
              <p className="text-xs text-gray-500 mt-1">
                {viewingBill.status === "paid"
                  ? "Receipt verification code for clearing and dispensing"
                  : "Please scan or present this clearing code to cashier for checkout"}
              </p>

              {/* Code Banner */}
              <div className="my-5 rounded-2xl bg-brand-50 p-5 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                  Clearing Payment Code
                </p>
                <p className="text-3xl font-mono font-black text-brand-900 dark:text-brand-200 mt-1 tracking-wider">
                  {viewingBill.code}
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
                <p className="text-[10px] font-mono text-gray-400 mt-1">{viewingBill.code}</p>
              </div>

              {/* Bill Details */}
              <div className="text-left space-y-2 text-xs border-t border-gray-100 pt-4 dark:border-slate-800">
                <div className="flex justify-between">
                  <span className="text-gray-500">Patient:</span>
                  <span className="font-semibold text-slate-950 dark:text-white">
                    {viewingBill.patientName} (ID: {viewingBill.patientId})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone Number:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {viewingBill.phoneNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Department:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {viewingBill.departmentName}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-slate-800">
                  <span className="text-gray-500">Date Generated:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {formatDateTime(viewingBill.createdAt)}
                  </span>
                </div>

                <div className="pt-2">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Formulations list
                  </p>
                  <div className="max-h-[120px] overflow-y-auto space-y-1 pr-1">
                    {viewingBill.items.map((it) => (
                      <div key={it.drugId} className="flex justify-between text-slate-700 dark:text-slate-300">
                        <span>
                          {it.name} (x{it.quantity})
                        </span>
                        <span className="font-medium">{formatCurrency(it.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between border-t border-gray-100 pt-3 font-bold text-sm text-slate-950 dark:text-white dark:border-slate-800">
                  <span>Grand Total</span>
                  <span className="text-brand-700 dark:text-brand-400">
                    {formatCurrency(viewingBill.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Printing */}
              <div className="mt-6 flex gap-3">
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
                  Close Receipt
                </button>
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
                  Edit Prescription: {editingBill.code}
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
              <div className="grid gap-4 sm:grid-cols-2 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 dark:bg-slate-800/40 dark:border-slate-800">
                <div>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                      Patient ID
                    </span>
                    <input
                      type="text"
                      value={editPatientId}
                      onChange={(e) => setEditPatientId(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-canvas dark:text-white"
                      required
                    />
                  </label>
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

                <div>
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

                <div>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                      Department
                    </span>
                    <select
                      value={editDeptId}
                      onChange={(e) => handleEditDeptChange(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-canvas dark:text-white"
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
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
                            d.status !== "Expired" &&
                            !editItems.some((it) => it.drugId === d.id)
                        )
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} (Stock: {getAvailableStockForEdit(d.id)}) -{" "}
                            {formatCurrency(d.price)}
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
                    {formatCurrency(activeSelectedDrug.price)}
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
                    className="rounded-xl bg-brand-700 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600 shadow-sm flex items-center gap-1.5"
                  >
                    <FiCheck />
                    Save Updates
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
