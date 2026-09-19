"use client";

import type {
  AdminHospitalPharmacistListItem,
  AdminHospitalPharmacistStatus,
  CreateAdminHospitalPharmacistPayload,
  UpdateAdminHospitalPharmacistPayload,
} from "@/libs/type";
import { getPharmacyUnits } from "@/libs/pharmacy-api";
import { useQuery } from "@tanstack/react-query";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { FiEye, FiEyeOff, FiX, FiCheckSquare, FiSquare, FiLayers } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { isValidNigerianPhoneNumber } from "@/libs/helper";
import { useScrollLock } from "@/hooks/useScrollLock";

type Props = {
  hospitalId?: string;
  pharmacist?: AdminHospitalPharmacistListItem | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (
    payload: CreateAdminHospitalPharmacistPayload | UpdateAdminHospitalPharmacistPayload,
  ) => void;
};

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  status: AdminHospitalPharmacistStatus;
  role: "PHARMACY" | "PHARMACY_STORE";
  pharmacy_unit_id: string;
  modules: string[];
};

const POINT_ROLE_MODULES = [
  "dashboard",
  "dispense",
  "prescriptions",
  "inventory",
  "inventory-edit",
  "inventory-history",
  "reports",
  "transfers",
];

const STORE_ROLE_MODULES = [
  "dashboard",
  "inventory",
  "inventory-edit",
  "inventory-history",
  "reports",
  "transfers",
];

const POINT_MODULE_DEFINITIONS = [
  { key: "dashboard", label: "Dashboard", desc: "Overview & daily KPIs" },
  { key: "dispense", label: "Patient Dispensing", desc: "Dispense drugs & collect payment" },
  { key: "prescriptions", label: "Prescriptions", desc: "Manage billing requests" },
  { key: "inventory", label: "Drug Inventory", desc: "View catalog, stock levels & batches" },
  { key: "inventory-edit", label: "Edit Inventory", desc: "Add/edit items at unit level" },
  { key: "inventory-history", label: "Drug Timeline", desc: "Audit logs & movement history" },
  { key: "reports", label: "Financial Reports", desc: "Sales, dispense & addition logs" },
  { key: "transfers", label: "Restock Requests", desc: "Request stock transfers from Central Store" },
];

const STORE_MODULE_DEFINITIONS = [
  { key: "dashboard", label: "Warehouse Dashboard", desc: "Stock valuation & analytics" },
  { key: "inventory", label: "Store Inventory", desc: "Central catalog & supplier additions" },
  { key: "inventory-edit", label: "Edit Master Drugs", desc: "Create, edit or manage master catalog" },
  { key: "inventory-history", label: "Stock Movement History", desc: "Supplier restock & dispatch logs" },
  { key: "reports", label: "Warehouse Reports", desc: "Stock valuation & movement reports" },
  { key: "transfers", label: "Transfer Dispatch", desc: "Review, approve & dispatch stock" },
];

function getDefaultModulesForRole(role: "PHARMACY" | "PHARMACY_STORE") {
  return role === "PHARMACY_STORE" ? [...STORE_ROLE_MODULES] : [...POINT_ROLE_MODULES];
}

function splitPharmacistName(name?: string) {
  if (!name) {
    return { first_name: "", last_name: "" };
  }

  const [firstName = "", ...rest] = name.trim().split(/\s+/);
  return {
    first_name: firstName,
    last_name: rest.join(" "),
  };
}

function buildInitialState(pharmacist?: AdminHospitalPharmacistListItem | null): FormState {
  const name = splitPharmacistName(pharmacist?.pharmacist_name);
  const role = pharmacist?.role ?? "PHARMACY";
  const validAllowed = getDefaultModulesForRole(role);

  const rawModules = pharmacist?.modules?.length ? pharmacist.modules : validAllowed;
  const sanitizedModules = rawModules.filter((m) => validAllowed.includes(m));

  return {
    first_name: pharmacist?.first_name ?? name.first_name,
    last_name: pharmacist?.last_name ?? name.last_name,
    email: pharmacist?.email ?? "",
    phone: pharmacist?.phone ?? "",
    password: "",
    status: pharmacist?.status ?? "active",
    role,
    pharmacy_unit_id: pharmacist?.pharmacy_unit_id ?? "",
    modules: sanitizedModules.length > 0 ? sanitizedModules : validAllowed,
  };
}

function AdminHospitalPharmacistFormModal({
  hospitalId,
  pharmacist,
  isSubmitting = false,
  onClose,
  onSubmit,
}: Props) {
  const isEditMode = Boolean(pharmacist);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<FormState>(() => buildInitialState(pharmacist));

  // Fetch Pharmacy Units
  const { data: unitsResponse, isLoading: isLoadingUnits } = useQuery({
    queryKey: ["admin-hospital-pharmacy-units-dropdown", hospitalId],
    queryFn: () => getPharmacyUnits(hospitalId),
    enabled: Boolean(hospitalId),
  });

  const allUnits = unitsResponse?.data ?? [];

  const availableUnits = useMemo(() => {
    if (form.role === "PHARMACY_STORE") {
      return allUnits.filter((unit) => unit.type === "store");
    }
    return allUnits.filter((unit) => unit.type === "point");
  }, [allUnits, form.role]);

  // Sync initial pharmacy_unit_id if available and not set
  useEffect(() => {
    if (!form.pharmacy_unit_id && availableUnits.length > 0 && !isEditMode) {
      setForm((prev) => ({ ...prev, pharmacy_unit_id: availableUnits[0].id }));
    }
  }, [availableUnits, form.pharmacy_unit_id, isEditMode]);

  useEffect(() => {
    setForm(buildInitialState(pharmacist));
  }, [pharmacist]);

  const roleOptions = [
    { value: "PHARMACY", label: "Point Pharmacist (Dispensary)" },
    { value: "PHARMACY_STORE", label: "Central Store Manager" },
  ] as const;

  const activeModuleDefinitions = form.role === "PHARMACY_STORE" ? STORE_MODULE_DEFINITIONS : POINT_MODULE_DEFINITIONS;

  const submitLabel = useMemo(() => {
    if (isSubmitting) {
      return isEditMode ? "Saving..." : "Creating...";
    }

    return isEditMode ? "Save Changes" : `Create ${form.role === "PHARMACY_STORE" ? "Store" : "Point"} User`;
  }, [form.role, isEditMode, isSubmitting]);

  const updateField = (key: keyof FormState, value: any) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleRoleChange = (nextRole: "PHARMACY" | "PHARMACY_STORE") => {
    const matchingUnits = allUnits.filter((u) => u.type === (nextRole === "PHARMACY_STORE" ? "store" : "point"));
    setForm((current) => ({
      ...current,
      role: nextRole,
      modules: getDefaultModulesForRole(nextRole),
      pharmacy_unit_id: matchingUnits.length > 0 ? matchingUnits[0].id : "",
    }));
  };

  const handleModuleToggle = (moduleKey: string) => {
    setForm((current) => {
      const exists = current.modules.includes(moduleKey);
      const updated = exists
        ? current.modules.filter((m) => m !== moduleKey)
        : [...current.modules, moduleKey];
      return { ...current, modules: updated };
    });
  };

  const handleSelectAllModules = () => {
    setForm((current) => ({
      ...current,
      modules: getDefaultModulesForRole(current.role),
    }));
  };

  const handleDeselectAllModules = () => {
    setForm((current) => ({
      ...current,
      modules: [],
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const first_name = form.first_name.trim();
    const last_name = form.last_name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const password = form.password;
    const pharmacy_unit_id = form.pharmacy_unit_id.trim();

    if (phone && !isValidNigerianPhoneNumber(phone)) {
      toast.error("Please enter a valid phone number (e.g. 08012345678).");
      return;
    }

    const allowed = getDefaultModulesForRole(form.role);
    // Sanitize modules: store manager can never have dispense or prescriptions
    const cleanModules = form.modules.filter((m) => allowed.includes(m));

    if (!isEditMode) {
      onSubmit({
        first_name,
        last_name,
        email,
        phone,
        password,
        role: form.role,
        ...(pharmacy_unit_id ? { pharmacy_unit_id } : {}),
        modules: cleanModules,
      });
      return;
    }

    const payload: UpdateAdminHospitalPharmacistPayload = {};
    const original = splitPharmacistName(pharmacist?.pharmacist_name);
    const originalFirstName = pharmacist?.first_name ?? original.first_name;
    const originalLastName = pharmacist?.last_name ?? original.last_name;

    if (first_name && first_name !== originalFirstName) {
      payload.first_name = first_name;
    }

    if (last_name !== originalLastName) {
      payload.last_name = last_name;
    }

    if (email && email !== pharmacist?.email) {
      payload.email = email;
    }

    if (phone && phone !== pharmacist?.phone) {
      payload.phone = phone;
    }

    if (password) {
      payload.password = password;
    }

    if (pharmacy_unit_id && pharmacy_unit_id !== pharmacist?.pharmacy_unit_id) {
      payload.pharmacy_unit_id = pharmacy_unit_id;
    }

    if (form.status !== pharmacist?.status) {
      payload.status = form.status;
    }

    if (form.role !== pharmacist?.role) {
      payload.role = form.role;
    }

    // Always send sanitized modules selection
    payload.modules = cleanModules;

    onSubmit(payload);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl border border-line-subtle bg-panel shadow-2xl my-8 overflow-hidden"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line-subtle p-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
              {isEditMode ? "Edit Pharmacy User" : "Create Pharmacy User"}
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              {isEditMode
                ? "Update user profile, unit assignment, and module access permissions."
                : "Add a dispensing pharmacist or central store manager with tailored module permissions."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-lg text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100"
            aria-label="Close"
            type="button"
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5 max-h-[80vh] overflow-y-auto">
          {/* Role Selection */}
          <div className="space-y-2">
            <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">
              User Role & Workspace Type
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl border border-line-subtle bg-canvas-alt p-1.5">
              {roleOptions.map((option) => {
                const isActive = form.role === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleRoleChange(option.value)}
                    className={[
                      "flex items-center justify-center rounded-lg px-3 py-2.5 text-sm font-medium transition text-center",
                      isActive
                        ? "bg-brand-600 text-white shadow-sm font-semibold"
                        : "text-gray-700 hover:bg-panel-muted dark:text-slate-300 dark:hover:bg-panel-muted",
                    ].join(" ")}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pharmacy Unit Dropdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                <FiLayers className="text-brand-600" />
                Assigned Pharmacy Unit ({form.role === "PHARMACY_STORE" ? "Central Store" : "Dispensing Point"})
              </label>
              {isLoadingUnits && (
                <span className="text-xs text-gray-400">Loading units...</span>
              )}
            </div>
            <select
              value={form.pharmacy_unit_id}
              onChange={(e) => updateField("pharmacy_unit_id", e.target.value)}
              className="w-full rounded-lg border border-line-subtle bg-canvas-alt px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
            >
              <option value="">Select a {form.role === "PHARMACY_STORE" ? "Store Unit" : "Dispensing Point"}...</option>
              {availableUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} ({unit.type === "store" ? "Central Store" : "Pharmacy Point"})
                </option>
              ))}
            </select>
            {availableUnits.length === 0 && !isLoadingUnits && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                No active {form.role === "PHARMACY_STORE" ? "stores" : "dispensing points"} found. Please create one in Pharmacy {form.role === "PHARMACY_STORE" ? "Stores" : "Points"} settings.
              </p>
            )}
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                First Name
              </span>
              <input
                value={form.first_name}
                onChange={(event) => updateField("first_name", event.target.value)}
                className="w-full rounded-lg border border-line-subtle bg-canvas-alt px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
                required
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Last Name
              </span>
              <input
                value={form.last_name}
                onChange={(event) => updateField("last_name", event.target.value)}
                className="w-full rounded-lg border border-line-subtle bg-canvas-alt px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
                required
              />
            </label>
          </div>

          {/* Contact Fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Email Address
              </span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="w-full rounded-lg border border-line-subtle bg-canvas-alt px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
                required
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Phone Number
              </span>
              <input
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="e.g. 08012345678"
                className="w-full rounded-lg border border-line-subtle bg-canvas-alt px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
                required
              />
            </label>
          </div>

          {/* Password Field */}
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
              {isEditMode ? "New Password (Optional)" : "Password"}
            </span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                className="w-full rounded-lg border border-line-subtle bg-canvas-alt px-3 py-2 pr-11 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
                required={!isEditMode}
                placeholder={isEditMode ? "Leave blank to keep current password" : "Enter secure password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </label>

          {/* Dynamic Module Access Permissions */}
          <div className="space-y-2.5 rounded-xl border border-line-subtle bg-canvas-alt p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-sm font-bold text-gray-900 dark:text-slate-100 block">
                  Module Access Permissions ({form.modules.length}/{activeModuleDefinitions.length} selected)
                </span>
                <p className="text-xs text-gray-500">
                  {form.role === "PHARMACY_STORE"
                    ? "Store managers have warehouse management, master inventory & dispatch permissions."
                    : "Point pharmacists have patient dispensing, retail inventory & restock request permissions."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllModules}
                  className="inline-flex items-center gap-1 rounded-md border border-line-subtle bg-panel px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50 dark:border-slate-700 dark:text-brand-300 dark:hover:bg-slate-800"
                >
                  <FiCheckSquare className="text-xs" /> Select All
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllModules}
                  className="inline-flex items-center gap-1 rounded-md border border-line-subtle bg-panel px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <FiSquare className="text-xs" /> Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 pt-1">
              {activeModuleDefinitions.map((mod) => {
                const isChecked = form.modules.includes(mod.key);
                return (
                  <label
                    key={mod.key}
                    className={`flex items-start gap-3 rounded-lg border p-2.5 cursor-pointer transition ${
                      isChecked
                        ? "border-brand-300 bg-brand-50/50 dark:border-brand-500/40 dark:bg-brand-500/10"
                        : "border-line-subtle bg-panel opacity-80 hover:opacity-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleModuleToggle(mod.key)}
                      className="mt-0.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <div className="select-none">
                      <p className={`text-xs font-bold ${isChecked ? "text-brand-900 dark:text-brand-200" : "text-gray-800 dark:text-slate-200"}`}>
                        {mod.label}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400 line-clamp-1">
                        {mod.desc}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Status Field (Edit mode) */}
          {isEditMode ? (
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Account Status
              </span>
              <select
                value={form.status}
                onChange={(event) =>
                  updateField("status", event.target.value as AdminHospitalPharmacistStatus)
                }
                className="w-full rounded-lg border border-line-subtle bg-canvas-alt px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>
          ) : null}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-line-subtle pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-line-subtle bg-panel px-4 py-2 text-sm font-medium text-gray-700 hover:bg-panel-muted dark:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminHospitalPharmacistFormModal;
