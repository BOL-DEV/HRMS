"use client";

import React, { useEffect, useMemo, useState } from "react";
import Header from "@/components/shared/Header";
import {
  getPharmacyInventory,
  createPharmacyBill,
  DrugItem,
  PharmacyBillItem,
  PharmacyBill,
} from "@/libs/pharmacy-mock";
import { formatCurrency, formatDateTime } from "@/libs/helper";
import { FiPlus, FiTrash2, FiCheck, FiX, FiPrinter } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { getAgentAccessToken } from "@/libs/auth";
import { useRouter } from "next/navigation";

export default function PharmacyDispensePage() {
  const router = useRouter();
  const accessToken = typeof window !== "undefined" ? getAgentAccessToken() : null;

  // Inventory Stock
  const [inventory, setInventory] = useState<DrugItem[]>(() => {
    if (typeof window !== "undefined") {
      return getPharmacyInventory().filter((d) => d.stock > 0 && d.status !== "Expired");
    }
    return [];
  });

  // Form patient state
  const [patientId, setPatientId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [departmentName, setDepartmentName] = useState("");

  // Drug Select State
  const [selectedDrugId, setSelectedDrugId] = useState("");
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

  const departments = [
    { id: "dep-1", name: "General Medicine" },
    { id: "dep-2", name: "Pediatrics" },
    { id: "dep-3", name: "Cardiology" },
    { id: "dep-4", name: "Surgery" },
    { id: "dep-5", name: "Obstetrics & Gynecology" },
    { id: "dep-6", name: "Pharmacy Department" },
  ];

  const handleDepartmentChange = (deptId: string) => {
    setDepartmentId(deptId);
    const match = departments.find((d) => d.id === deptId);
    setDepartmentName(match ? match.name : "");
  };

  const selectedDrug = useMemo(() => {
    return inventory.find((d) => d.id === selectedDrugId) ?? null;
  }, [selectedDrugId, inventory]);

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
      unitPrice: selectedDrug.price,
      amount: selectedDrug.price * qty,
    };

    setBillItems((current) => [...current, newItem]);
    setSelectedDrugId("");
    setDispenseQty("1");
  };

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
    setDepartmentId("");
    setDepartmentName("");
    setBillItems([]);
    setSelectedDrugId("");
    setDispenseQty("1");
  };

  // Submit Prescription / Generate Code
  const handleGenerateBill = (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientId.trim() || !patientName.trim() || !patientPhone.trim() || !departmentId) {
      toast.error("Please fill in all patient and department details.");
      return;
    }

    if (billItems.length === 0) {
      toast.error("Add at least one formulation to dispense.");
      return;
    }

    const bill = createPharmacyBill({
      patientId: patientId.trim(),
      patientName: patientName.trim(),
      phoneNumber: patientPhone.trim(),
      departmentId,
      departmentName,
      items: billItems,
      totalAmount,
    });

    setGeneratedBill(bill);
    toast.success(`Bill generated successfully: ${bill.code}`);
    handleResetForm();
    // Refresh inventory in case stock values changed
    setInventory(getPharmacyInventory().filter((d) => d.stock > 0 && d.status !== "Expired"));
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
        <form onSubmit={handleGenerateBill} className="grid gap-6 lg:grid-cols-3">
          {/* Patient Form & Drug Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Patient Information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                    Patient ID
                  </span>
                  <input
                    type="text"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    placeholder="e.g. 100432"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-canvas dark:text-white"
                    required
                  />
                </label>

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

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                    Prescribing Department
                  </span>
                  <select
                    value={departmentId}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-canvas dark:text-white"
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

            {/* Formulation Add Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Add Formulations</h2>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <label className="flex-1 block">
                  <span className="mb-2 block text-xs font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                    Formulation / Drug
                  </span>
                  <select
                    value={selectedDrugId}
                    onChange={(e) => setSelectedDrugId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-canvas dark:text-white"
                  >
                    <option value="">Select Drug (Stock count shown)</option>
                    {inventory.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} (Qty: {d.stock}) - {formatCurrency(d.price)}
                      </option>
                    ))}
                  </select>
                </label>

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
                  Unit Price: {formatCurrency(selectedDrug.price)} | Stock available: {selectedDrug.stock} {selectedDrug.genericName ? `(${selectedDrug.genericName})` : ""}
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
                  disabled={billItems.length === 0}
                  className="w-full rounded-xl bg-brand-700 py-3.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
                >
                  <FiCheck />
                  Generate Code & Dispense
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
                Medication Dispensed
              </span>
              <h3 className="text-xl font-bold text-slate-950 dark:text-white">Prescription Receipt</h3>
              <p className="text-xs text-gray-500 mt-1">Please pay this code at the cashier&apos;s checkout terminal.</p>

              {/* Code Banner */}
              <div className="my-5 rounded-2xl bg-brand-50 p-5 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                  Cashier Clearing Code
                </p>
                <p className="text-3xl font-mono font-black text-brand-900 dark:text-brand-200 mt-1 tracking-wider">
                  {generatedBill.code}
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
                <p className="text-[10px] font-mono text-gray-400 mt-1">{generatedBill.code}</p>
              </div>

              {/* Bill Overview */}
              <div className="text-left space-y-2 text-xs border-t border-gray-100 pt-4 dark:border-slate-800">
                <div className="flex justify-between">
                  <span className="text-gray-500">Patient:</span>
                  <span className="font-semibold text-slate-950 dark:text-white">{generatedBill.patientName} (ID: {generatedBill.patientId})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Department:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{generatedBill.departmentName}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-slate-800">
                  <span className="text-gray-500">Date Generated:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{formatDateTime(generatedBill.createdAt)}</span>
                </div>

                <div className="pt-2">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Formulations list</p>
                  <div className="max-h-[120px] overflow-y-auto space-y-1">
                    {generatedBill.items.map((it) => (
                      <div key={it.drugId} className="flex justify-between text-slate-700 dark:text-slate-300">
                        <span>{it.name} (x{it.quantity})</span>
                        <span className="font-medium">{formatCurrency(it.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between border-t border-gray-100 pt-3 font-bold text-sm text-slate-950 dark:text-white dark:border-slate-800">
                  <span>Grand Total</span>
                  <span className="text-brand-700 dark:text-brand-400">{formatCurrency(generatedBill.totalAmount)}</span>
                </div>
              </div>

              {/* Print Receipt Button */}
              <div className="mt-6 flex gap-3">
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
      ) : null}
    </div>
  );
}
