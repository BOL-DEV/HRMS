"use client";

import type {
  AdminHospitalAgentListItem,
  AdminHospitalAgentStatus,
  CreateAdminHospitalAgentPayload,
  UpdateAdminHospitalAgentPayload,
} from "@/libs/type";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { FiEye, FiEyeOff, FiX } from "react-icons/fi";

type Props = {
  agent?: AdminHospitalAgentListItem | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (
    payload: CreateAdminHospitalAgentPayload | UpdateAdminHospitalAgentPayload,
  ) => void;
};

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  status: AdminHospitalAgentStatus;
  modules: string[];
};

function splitAgentName(name?: string) {
  if (!name) {
    return { first_name: "", last_name: "" };
  }

  const [firstName = "", ...rest] = name.trim().split(/\s+/);
  return {
    first_name: firstName,
    last_name: rest.join(" "),
  };
}

function buildInitialState(agent?: AdminHospitalAgentListItem | null): FormState {
  const name = splitAgentName(agent?.agent_name);

  return {
    first_name: name.first_name,
    last_name: name.last_name,
    email: agent?.email ?? "",
    phone: "",
    password: "",
    status: agent?.status ?? "active",
    modules: agent?.modules ?? ["dashboard", "transactions", "receipts", "reports", "topup-history"],
  };
}

function AdminHospitalAgentFormModal({
  agent,
  isSubmitting = false,
  onClose,
  onSubmit,
}: Props) {
  const isEditMode = Boolean(agent);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<FormState>(() => buildInitialState(agent));

  useEffect(() => {
    setForm(buildInitialState(agent));
  }, [agent]);

  const submitLabel = useMemo(() => {
    if (isSubmitting) {
      return isEditMode ? "Saving..." : "Creating...";
    }

    return isEditMode ? "Save Changes" : "Create Agent";
  }, [isEditMode, isSubmitting]);

  const updateField = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
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

    if (!isEditMode) {
      onSubmit({
        first_name,
        last_name,
        email,
        phone,
        password,
        modules: form.modules,
      });
      return;
    }

    const payload: UpdateAdminHospitalAgentPayload = {};
    const original = splitAgentName(agent?.agent_name);

    if (first_name && first_name !== original.first_name) {
      payload.first_name = first_name;
    }

    if (last_name !== original.last_name) {
      payload.last_name = last_name;
    }

    if (email && email !== agent?.email) {
      payload.email = email;
    }

    if (phone) {
      payload.phone = phone;
    }

    if (password) {
      payload.password = password;
    }

    if (form.status !== agent?.status) {
      payload.status = form.status;
    }

    const originalModules = agent?.modules ?? ["dashboard", "transactions", "receipts", "reports", "topup-history"];
    const modulesChanged =
      form.modules.length !== originalModules.length ||
      !form.modules.every((m) => originalModules.includes(m));
    if (modulesChanged) {
      payload.modules = form.modules;
    }

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-line-subtle bg-panel shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-line-subtle p-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
              {isEditMode ? "Edit Agent" : "Create Agent"}
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              {isEditMode
                ? "Update hospital agent information."
                : "Create a new agent under this hospital."}
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
                required={!isEditMode}
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

          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Module Access Permissions
            </span>
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-line-subtle bg-canvas-alt p-3.5 sm:grid-cols-3">
              {[
                { key: "dashboard", label: "Dashboard" },
                { key: "transactions", label: "Transactions" },
                { key: "receipts", label: "Receipts" },
                { key: "reports", label: "Reports" },
                { key: "topup-history", label: "Top-Up History" },
              ].map((mod) => (
                <label key={mod.key} className="flex items-center gap-2 text-sm text-gray-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.modules.includes(mod.key)}
                    onChange={() => handleModuleToggle(mod.key)}
                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span>{mod.label}</span>
                </label>
              ))}
            </div>
          </div>

          {isEditMode ? (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Status
              </span>
              <select
                value={form.status}
                onChange={(event) =>
                  updateField("status", event.target.value as AdminHospitalAgentStatus)
                }
                className="w-full rounded-lg border border-line-subtle bg-canvas-alt px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>
          ) : null}

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

export default AdminHospitalAgentFormModal;
