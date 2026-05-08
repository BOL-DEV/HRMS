"use client";

import AdminPageError from "@/components/AdminPageError";
import { ApiError } from "@/libs/api";
import { getAdminHospitalOverview, updateAdminHospital } from "@/libs/admin-auth";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import type { AdminHospitalStatus, UpdateAdminHospitalPayload } from "@/libs/type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

type FormState = {
  name: string;
  email: string;
  phone: string;
  address: string;
  revenueType: "manual" | "automatic";
  status: AdminHospitalStatus;
};

function buildInitialState(data?: ReturnType<typeof getHospitalFormDefaults>): FormState {
  return {
    name: data?.name ?? "",
    email: data?.email ?? "",
    phone: data?.phone ?? "",
    address: data?.address ?? "",
    revenueType: data?.revenueType ?? "automatic",
    status: data?.status ?? "active",
  };
}

function getHospitalFormDefaults(
  hospital?: {
    hospital_name: string;
    hospital_email: string;
    hospital_phone: string;
    address: string;
    revenue_type: "manual" | "automatic";
    status: AdminHospitalStatus;
  },
) {
  if (!hospital) {
    return undefined;
  }

  return {
    name: hospital.hospital_name,
    email: hospital.hospital_email,
    phone: hospital.hospital_phone,
    address: hospital.address,
    revenueType: hospital.revenue_type,
    status: hospital.status,
  };
}

function HospitalSettingsForm({
  defaults,
  hospitalCode,
  isLoading,
  isSaving,
  onSubmit,
}: {
  defaults: NonNullable<ReturnType<typeof getHospitalFormDefaults>>;
  hospitalCode?: string;
  isLoading: boolean;
  isSaving: boolean;
  onSubmit: (payload: UpdateAdminHospitalPayload) => void;
}) {
  const [form, setForm] = useState<FormState>(() => buildInitialState(defaults));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: UpdateAdminHospitalPayload = {};
    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();
    const trimmedPhone = form.phone.trim();
    const trimmedAddress = form.address.trim();

    if (trimmedName && trimmedName !== defaults.name) {
      payload.name = trimmedName;
    }

    if (trimmedEmail && trimmedEmail !== defaults.email) {
      payload.contact_email = trimmedEmail;
    }

    if (trimmedPhone && trimmedPhone !== defaults.phone) {
      payload.contact_phone = trimmedPhone;
    }

    if (trimmedAddress && trimmedAddress !== defaults.address) {
      payload.address = trimmedAddress;
    }

    if (form.revenueType !== defaults.revenueType) {
      payload.revenue_type = form.revenueType;
    }

    if (form.status !== defaults.status) {
      payload.status = form.status;
    }

    if (!Object.keys(payload).length) {
      toast("No changes to save.");
      return;
    }

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Hospital Name
          </span>
          <input
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            className="w-full rounded-lg border border-line-subtle bg-canvas-alt px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
            required
          />
        </label>

        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Hospital Code
          </span>
          <div className="rounded-lg border border-line-subtle bg-panel-muted px-4 py-3 text-sm text-gray-600 dark:text-slate-300">
            {hospitalCode ?? "--"}
          </div>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Contact Email
          </span>
          <input
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
            className="w-full rounded-lg border border-line-subtle bg-canvas-alt px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
            required
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Contact Phone
          </span>
          <input
            value={form.phone}
            onChange={(event) =>
              setForm((current) => ({ ...current, phone: event.target.value }))
            }
            className="w-full rounded-lg border border-line-subtle bg-canvas-alt px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
            required
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Revenue Type
          </span>
          <select
            value={form.revenueType}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                revenueType: event.target.value as "manual" | "automatic",
              }))
            }
            className="w-full rounded-lg border border-line-subtle bg-canvas-alt px-4 py-3 text-sm dark:text-slate-100"
          >
            <option value="automatic">Automatic</option>
            <option value="manual">Manual</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Status
          </span>
          <select
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                status: event.target.value as AdminHospitalStatus,
              }))
            }
            className="w-full rounded-lg border border-line-subtle bg-canvas-alt px-4 py-3 text-sm dark:text-slate-100"
          >
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Address
          </span>
          <textarea
            value={form.address}
            onChange={(event) =>
              setForm((current) => ({ ...current, address: event.target.value }))
            }
            className="min-h-28 w-full rounded-lg border border-line-subtle bg-canvas-alt px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
            required
          />
        </label>
      </div>

      <div className="flex justify-end border-t border-line-subtle pt-5">
        <button
          type="submit"
          disabled={isSaving || isLoading}
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

export default function HospitalSettingsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = getAccessToken();
  const hospitalId = params?.id ?? "";

  const overviewQuery = useQuery({
    queryKey: ["admin-hospital-overview", hospitalId],
    queryFn: () => getAdminHospitalOverview(hospitalId),
    enabled: Boolean(accessToken && hospitalId),
  });

  const defaults = useMemo(
    () => getHospitalFormDefaults(overviewQuery.data?.data.hospital),
    [overviewQuery.data?.data.hospital],
  );

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    if (!(overviewQuery.error instanceof ApiError)) {
      return;
    }

    if (overviewQuery.error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
      return;
    }

    if (overviewQuery.error.status === 404) {
      router.replace("/admin/hospitals");
    }
  }, [overviewQuery.error, router]);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateAdminHospitalPayload) =>
      updateAdminHospital(hospitalId, payload),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({
        queryKey: ["admin-hospital-overview", hospitalId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-hospitals"],
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to update hospital.",
      );
    },
  });

  return (
    <div className="space-y-6">
      {overviewQuery.error instanceof Error ? (
        <AdminPageError message={overviewQuery.error.message} />
      ) : null}

      <div className="overflow-hidden rounded-xl border border-line-subtle bg-panel">
        <div className="border-b border-line-subtle p-5">
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
            Hospital Settings
          </h2>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Update live hospital details using the admin hospital endpoints.
          </p>
        </div>

        {defaults ? (
          <HospitalSettingsForm
            key={JSON.stringify(defaults)}
            defaults={defaults}
            hospitalCode={overviewQuery.data?.data.hospital.hospital_code}
            isLoading={overviewQuery.isLoading}
            isSaving={updateMutation.isPending}
            onSubmit={(payload) => updateMutation.mutate(payload)}
          />
        ) : (
          <div className="p-6 text-sm text-gray-500 dark:text-slate-400">
            Hospital settings are loading.
          </div>
        )}
      </div>
    </div>
  );
}
