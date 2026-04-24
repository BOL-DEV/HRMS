"use client";

import type {
  AdminHospitalListItem,
  AdminHospitalStatus,
  CreateAdminHospitalPayload,
  UpdateAdminHospitalPayload,
} from "@/libs/type";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { FiX } from "react-icons/fi";

type CreateProps = {
  mode: "create";
  hospital?: null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateAdminHospitalPayload) => void;
};

type EditProps = {
  mode: "edit";
  hospital: AdminHospitalListItem;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: UpdateAdminHospitalPayload) => void;
};

type Props = CreateProps | EditProps;

type FormState = {
  name: string;
  logo_url: string;
  address: string;
  contact_email: string;
  contact_phone: string;
  revenue_type: "manual" | "automatic";
  status: AdminHospitalStatus;
};

function buildInitialForm(hospital?: AdminHospitalListItem | null): FormState {
  return {
    name: hospital?.hospital_name ?? "",
    logo_url: "",
    address: "",
    contact_email: hospital?.hospital_email ?? "",
    contact_phone: hospital?.phone ?? "",
    revenue_type: hospital?.revenue_type ?? "automatic",
    status: hospital?.status ?? "active",
  };
}

function AdminHospitalModal({
  mode,
  hospital,
  isSubmitting = false,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<FormState>(() => buildInitialForm(hospital));
  const isEditMode = mode === "edit";

  useEffect(() => {
    setForm(buildInitialForm(hospital));
  }, [hospital]);

  const submitLabel = useMemo(() => {
    if (isSubmitting) {
      return isEditMode ? "Saving..." : "Creating...";
    }

    return isEditMode ? "Save Changes" : "Create Hospital";
  }, [isEditMode, isSubmitting]);

  const updateField = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = form.name.trim();
    const trimmedLogoUrl = form.logo_url.trim();
    const trimmedAddress = form.address.trim();
    const trimmedEmail = form.contact_email.trim();
    const trimmedPhone = form.contact_phone.trim();

    if (!isEditMode) {
      onSubmit({
        name: trimmedName,
        logo_url: trimmedLogoUrl,
        address: trimmedAddress,
        contact_email: trimmedEmail,
        contact_phone: trimmedPhone,
        revenue_type: form.revenue_type,
      });
      return;
    }

    const payload: UpdateAdminHospitalPayload = {};

    if (trimmedName && trimmedName !== hospital?.hospital_name) {
      payload.name = trimmedName;
    }

    if (trimmedLogoUrl) {
      payload.logo_url = trimmedLogoUrl;
    }

    if (trimmedAddress) {
      payload.address = trimmedAddress;
    }

    if (trimmedEmail && trimmedEmail !== hospital?.hospital_email) {
      payload.contact_email = trimmedEmail;
    }

    if (trimmedPhone && trimmedPhone !== hospital?.phone) {
      payload.contact_phone = trimmedPhone;
    }

    if (form.revenue_type !== hospital?.revenue_type) {
      payload.revenue_type = form.revenue_type;
    }

    if (form.status !== hospital?.status) {
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
              {isEditMode ? "Edit Hospital" : "Create Hospital"}
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              {isEditMode
                ? "Update hospital information for the platform."
                : "Register a new hospital on the platform."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-lg text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100"
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Hospital Name
              </span>
              <input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Contact Email
              </span>
              <input
                type="email"
                value={form.contact_email}
                onChange={(event) =>
                  updateField("contact_email", event.target.value)
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Revenue Type
              </span>
              <select
                value={form.revenue_type}
                onChange={(event) =>
                  updateField(
                    "revenue_type",
                    event.target.value as "manual" | "automatic",
                  )
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Contact Phone
              </span>
              <input
                value={form.contact_phone}
                onChange={(event) =>
                  updateField("contact_phone", event.target.value)
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                required
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Address
              </span>
              <textarea
                value={form.address}
                onChange={(event) => updateField("address", event.target.value)}
                className="min-h-24 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                required={!isEditMode}
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Logo URL
              </span>
              <input
                value={form.logo_url}
                onChange={(event) =>
                  updateField("logo_url", event.target.value)
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                placeholder="https://..."
              />
            </label>

            {isEditMode ? (
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  Status
                </span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    updateField("status", event.target.value as AdminHospitalStatus)
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </label>
            ) : null}

            {!isEditMode ? (
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Hospital code and activation metadata come back from the backend
                after creation.
              </p>
            ) : null}
          </div>

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

export default AdminHospitalModal;
