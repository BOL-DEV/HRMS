"use client";

import type {
  AdminHospitalPharmacistListItem,
  AdminHospitalPharmacistStatus,
  CreateAdminHospitalPharmacistPayload,
  UpdateAdminHospitalPharmacistPayload,
} from "@/libs/type";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { FiEye, FiEyeOff, FiX } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { isValidNigerianPhoneNumber } from "@/libs/helper";

type Props = {
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
  modules: string[];
};

type FormStateKeys = keyof FormState;

const STORE_ROLE_MODULES = [
  "dashboard",
  "inventory",
  "reports",
  "transfers",
];

const POINT_ROLE_MODULES = [
  "dashboard",
  "dispense",
  "prescriptions",
  "inventory",
  "reports",
  "transfers",
];

const MODULE_OPTIONS: Array<{
  key: string;
  label: string;
  roles: readonly ("PHARMACY" | "PHARMACY_STORE")[];
}> = [
  { key: "dashboard", label: "Dashboard", roles: ["PHARMACY", "PHARMACY_STORE"] },
  { key: "dispense", label: "Dispense Control", roles: ["PHARMACY"] },
  { key: "prescriptions", label: "Prescriptions", roles: ["PHARMACY"] },
  { key: "inventory", label: "Inventory", roles: ["PHARMACY", "PHARMACY_STORE"] },
  { key: "reports", label: "Reports Logs", roles: ["PHARMACY", "PHARMACY_STORE"] },
  { key: "transfers", label: "Request Restock", roles: ["PHARMACY", "PHARMACY_STORE"] },
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
    modules: sanitizedModules.length > 0 ? sanitizedModules : validAllowed,
  };
}

function AdminHospitalPharmacistFormModal({
  pharmacist,
  isSubmitting = false,
  onClose,
  onSubmit,
}: Props) {
  const isEditMode = Boolean(pharmacist);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<FormState>(() => buildInitialState(pharmacist));

  useEffect(() => {
    setForm(buildInitialState(pharmacist));
  }, [pharmacist]);

  const roleOptions = [
    { value: "PHARMACY_STORE", label: "Store User" },
    { value: "PHARMACY", label: "Point User" },
  ] as const;

  const submitLabel = useMemo(() => {
    if (isSubmitting) {
      return isEditMode ? "Saving..." : "Creating...";
    }

    return isEditMode ? "Save Changes" : `Create ${form.role === "PHARMACY_STORE" ? "Store" : "Point"} User`;
  }, [form.role, isEditMode, isSubmitting]);

  const updateField = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleRoleChange = (nextRole: "PHARMACY" | "PHARMACY_STORE") => {
    setForm((current) => ({
      ...current,
      role: nextRole,
      modules: getDefaultModulesForRole(nextRole),
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const first_name = form.first_name.trim();
    const last_name = form.last_name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const password = form.password;

    if (phone && !isValidNigerianPhoneNumber(phone)) {
      toast.error("Please enter a valid phone number (e.g. 08012345678).");
      return;
    }

    const allowed = getDefaultModulesForRole(form.role);
    const cleanModules = form.modules.filter((m) => allowed.includes(m));

    if (!isEditMode) {
      onSubmit({
        first_name,
        last_name,
        email,
        phone,
        password,
        role: form.role,
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

    if (form.status !== pharmacist?.status) {
      payload.status = form.status;
    }

    if (form.role !== pharmacist?.role) {
      payload.role = form.role;
    }

    // Always send sanitized modules selection so disallowed modules like transfer-history are never sent
    payload.modules = cleanModules;

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-line-subtle bg-panel shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-line-subtle p-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
              {isEditMode ? "Edit Pharmacist" : "Create Pharmacist"}
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              {isEditMode
                ? "Update pharmacist account details."
                : "Create a new pharmacist user under this hospital."}
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

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-2">
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

            <label className="space-y-2">
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Email
              </span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="w-full rounded-lg border border-line-subtle bg-canvas-alt px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Phone
              </span>
              <input
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className="w-full rounded-lg border border-line-subtle bg-canvas-alt px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
                required
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
              {isEditMode ? "New Password" : "Password"}
            </span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                className="w-full rounded-lg border border-line-subtle bg-canvas-alt px-3 py-2 pr-11 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
                required={!isEditMode}
                placeholder={isEditMode ? "Leave blank to keep current password" : ""}
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

          {!isEditMode ? (
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                User Type
              </span>
              <div className="flex rounded-lg border border-line-subtle bg-canvas-alt p-1">
                {roleOptions.map((option) => {
                  const isActive = form.role === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleRoleChange(option.value)}
                      className={[
                        "flex-1 rounded-md px-3 py-2 text-sm font-medium transition",
                        isActive
                          ? "bg-brand-600 text-white shadow-sm"
                          : "text-gray-700 hover:bg-panel-muted dark:text-slate-300 dark:hover:bg-panel-muted",
                      ].join(" ")}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Module Access Permissions
            </span>
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-line-subtle bg-canvas-alt p-3.5 sm:grid-cols-3">
              {MODULE_OPTIONS.filter((mod) => mod.roles.includes(form.role)).map((mod) => (
                <label key={mod.key} className="flex items-center gap-2 text-sm text-gray-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.modules.includes(mod.key)}
                    onChange={() => handleModuleToggle(mod.key)}
                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span>
                    {form.role === "PHARMACY" && mod.key === "transfers"
                      ? "Request Restock"
                      : form.role === "PHARMACY_STORE" && mod.key === "transfers"
                      ? "Transfers"
                      : mod.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {isEditMode ? (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  Workspace Role
                </span>
                <select
                  value={form.role}
                  onChange={(event) =>
                    updateField("role", event.target.value as "PHARMACY" | "PHARMACY_STORE")
                  }
                  className="w-full rounded-lg border border-line-subtle bg-canvas-alt px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
                >
                  <option value="PHARMACY">Point Pharmacist (Bills patients, requests stock)</option>
                  <option value="PHARMACY_STORE">Store Manager (Manages central inventory, dispatches stock)</option>
                </select>
              </label>
            ) : null}

            {isEditMode ? (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  Status
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
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-line-subtle pt-5">
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
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
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
