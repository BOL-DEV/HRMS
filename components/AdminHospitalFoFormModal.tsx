"use client";

import type {
  AdminHospitalFoListItem,
  AdminHospitalFoStatus,
  CreateAdminHospitalFoPayload,
  UpdateAdminHospitalFoPayload,
} from "@/libs/type";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { FiEye, FiEyeOff, FiX } from "react-icons/fi";

type Props = {
  fo?: AdminHospitalFoListItem | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (
    payload: CreateAdminHospitalFoPayload | UpdateAdminHospitalFoPayload,
  ) => void;
};

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  status: AdminHospitalFoStatus;
};

function splitFoName(name?: string) {
  if (!name) {
    return { first_name: "", last_name: "" };
  }

  const [firstName = "", ...rest] = name.trim().split(/\s+/);
  return {
    first_name: firstName,
    last_name: rest.join(" "),
  };
}

function buildInitialState(fo?: AdminHospitalFoListItem | null): FormState {
  const name = splitFoName(fo?.fo_name);

  return {
    first_name: name.first_name,
    last_name: name.last_name,
    email: fo?.email ?? "",
    phone: fo?.phone ?? "",
    password: "",
    status: fo?.status ?? "active",
  };
}

function AdminHospitalFoFormModal({
  fo,
  isSubmitting = false,
  onClose,
  onSubmit,
}: Props) {
  const isEditMode = Boolean(fo);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<FormState>(() => buildInitialState(fo));

  useEffect(() => {
    setForm(buildInitialState(fo));
  }, [fo]);

  const submitLabel = useMemo(() => {
    if (isSubmitting) {
      return isEditMode ? "Saving..." : "Creating...";
    }

    return isEditMode ? "Save Changes" : "Create FO";
  }, [isEditMode, isSubmitting]);

  const updateField = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
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
      });
      return;
    }

    const payload: UpdateAdminHospitalFoPayload = {};
    const original = splitFoName(fo?.fo_name);

    if (first_name && first_name !== original.first_name) {
      payload.first_name = first_name;
    }

    if (last_name !== original.last_name) {
      payload.last_name = last_name;
    }

    if (email && email !== fo?.email) {
      payload.email = email;
    }

    if (phone && phone !== fo?.phone) {
      payload.phone = phone;
    }

    if (password) {
      payload.password = password;
    }

    if (form.status !== fo?.status) {
      payload.status = form.status;
    }

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5 dark:border-slate-700">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
              {isEditMode ? "Edit FO" : "Create FO"}
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              {isEditMode
                ? "Update financial office information."
                : "Create a new FO under this hospital."}
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
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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
                className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-11 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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

          {isEditMode ? (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Status
              </span>
              <select
                value={form.status}
                onChange={(event) =>
                  updateField("status", event.target.value as AdminHospitalFoStatus)
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>
          ) : null}

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-5 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminHospitalFoFormModal;
