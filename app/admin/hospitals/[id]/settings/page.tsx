"use client";

import AdminPageError from "@/components/admin/AdminPageError";
import Header from "@/components/shared/Header";
import StatCard from "@/components/shared/StatCard";
import { ApiError } from "@/libs/api";
import {
  createAdminHospitalBillItem,
  createAdminHospitalDepartment,
  createAdminHospitalIncomeHead,
  getAdminHospitalDepartments,
  getAdminHospitalIncomeHeads,
  getAdminHospitalOverview,
  updateAdminHospital,
} from "@/libs/admin-auth";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import type { AdminHospitalStatus, UpdateAdminHospitalPayload } from "@/libs/type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "react-hot-toast";
import { FiGrid, FiLayers, FiTag } from "react-icons/fi";

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

type DepartmentOption = {
  id: string;
  name: string;
};

function normalizeDepartment(
  item: string | { id?: string; department_id?: string; name: string },
): DepartmentOption {
  if (typeof item === "string") {
    return {
      id: item,
      name: item,
    };
  }

  return {
    id: item.department_id ?? item.id ?? item.name,
    name: item.name,
  };
}

function SetupCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-line-subtle bg-panel p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="flex items-start gap-4 border-b border-line-subtle pb-5">
        <div className="rounded-2xl bg-brand-100 p-3 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
            {title}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="pt-5">{children}</div>
    </section>
  );
}

export default function HospitalSettingsPage() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = getAccessToken();
  const hospitalId = params?.id ?? "";
  const isCatalogRoute = pathname.endsWith("/catalog");
  const [departmentName, setDepartmentName] = useState("");
  const [incomeHeadDepartmentId, setIncomeHeadDepartmentId] = useState("");
  const [incomeHeadName, setIncomeHeadName] = useState("");
  const [billItemDepartmentId, setBillItemDepartmentId] = useState("");
  const [billItemIncomeHeadId, setBillItemIncomeHeadId] = useState("");
  const [billItemName, setBillItemName] = useState("");
  const [billItemAmount, setBillItemAmount] = useState("");

  const overviewQuery = useQuery({
    queryKey: ["admin-hospital-overview", hospitalId],
    queryFn: () => getAdminHospitalOverview(hospitalId),
    enabled: Boolean(accessToken && hospitalId),
  });

  const catalogDepartmentsQuery = useQuery({
    queryKey: ["admin-hospital-settings-departments", hospitalId],
    queryFn: () => getAdminHospitalDepartments(hospitalId),
    enabled: Boolean(accessToken && hospitalId && isCatalogRoute),
  });

  const catalogIncomeHeadsQuery = useQuery({
    queryKey: ["admin-hospital-settings-income-heads", hospitalId],
    queryFn: () => getAdminHospitalIncomeHeads(hospitalId),
    enabled: Boolean(accessToken && hospitalId && isCatalogRoute),
  });

  const billItemIncomeHeadsQuery = useQuery({
    queryKey: [
      "admin-hospital-settings-bill-item-income-heads",
      hospitalId,
      billItemDepartmentId,
    ],
    queryFn: () =>
      getAdminHospitalIncomeHeads(hospitalId, {
        departmentId: billItemDepartmentId || undefined,
      }),
    enabled: Boolean(
      accessToken && hospitalId && isCatalogRoute && billItemDepartmentId,
    ),
  });

  const departmentOptions = useMemo(
    () =>
      (catalogDepartmentsQuery.data?.data.departments ?? [])
        .map(normalizeDepartment)
        .filter((item) => Boolean(item.id)),
    [catalogDepartmentsQuery.data?.data.departments],
  );

  const billItemIncomeHeadOptions = useMemo(
    () =>
      (billItemIncomeHeadsQuery.data?.data.income_heads ?? []).map((item) => ({
        id: item.income_head_id,
        name: item.name,
      })),
    [billItemIncomeHeadsQuery.data?.data.income_heads],
  );

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
  }, [
    billItemIncomeHeadsQuery.error,
    catalogDepartmentsQuery.error,
    catalogIncomeHeadsQuery.error,
    overviewQuery.error,
    router,
  ]);

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

  const createDepartmentMutation = useMutation({
    mutationFn: (name: string) =>
      createAdminHospitalDepartment(hospitalId, { name }),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({
        queryKey: ["admin-hospital-settings-departments", hospitalId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-hospital-settings-income-heads", hospitalId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-hospital-overview", hospitalId],
      });
      setDepartmentName("");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to create department.",
      );
    },
  });

  const createIncomeHeadMutation = useMutation({
    mutationFn: (payload: { departmentId: string; name: string }) =>
      createAdminHospitalIncomeHead(hospitalId, {
        department_id: payload.departmentId,
        name: payload.name,
      }),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({
        queryKey: ["admin-hospital-settings-departments", hospitalId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-hospital-settings-income-heads", hospitalId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-hospital-settings-bill-item-income-heads", hospitalId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-hospital-overview", hospitalId],
      });
      setIncomeHeadDepartmentId("");
      setIncomeHeadName("");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to create income head.",
      );
    },
  });

  const createBillItemMutation = useMutation({
    mutationFn: (payload: {
      departmentId: string;
      incomeHeadId: string;
      name: string;
      amount: string;
    }) =>
      createAdminHospitalBillItem(hospitalId, {
        department_id: payload.departmentId,
        income_head_id: payload.incomeHeadId,
        name: payload.name,
        amount: Number(payload.amount),
      }),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({
        queryKey: ["admin-hospital-overview", hospitalId],
      });
      setBillItemDepartmentId("");
      setBillItemIncomeHeadId("");
      setBillItemName("");
      setBillItemAmount("");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to create bill item.",
      );
    },
  });

  const currentError = isCatalogRoute
    ? catalogDepartmentsQuery.error instanceof Error
      ? catalogDepartmentsQuery.error.message
      : catalogIncomeHeadsQuery.error instanceof Error
        ? catalogIncomeHeadsQuery.error.message
        : billItemIncomeHeadsQuery.error instanceof Error
          ? billItemIncomeHeadsQuery.error.message
          : null
    : overviewQuery.error instanceof Error
      ? overviewQuery.error.message
      : null;

  const setupSummaryCards = [
    {
      title: "Departments",
      value: String(departmentOptions.length),
      icon: <FiGrid className="text-xl" />,
    },
    {
      title: "Income Heads",
      value: String(catalogIncomeHeadsQuery.data?.data.total_income_heads ?? 0),
      icon: <FiLayers className="text-xl" />,
    },
    {
      title: "Catalog",
      value: "Ready",
      icon: <FiTag className="text-xl" />,
    },
  ];

  return (
    <div className="min-h-screen w-full bg-canvas">
      <Header
        title={isCatalogRoute ? "Catalog Setup" : "Hospital Settings"}
        Subtitle={
          isCatalogRoute
            ? "Create departments, income heads, and bill items from one logged-in workspace."
            : "Update live hospital details using the admin hospital endpoints."
        }
      />

      <div className="space-y-6 p-6">
        {currentError ? <AdminPageError message={currentError} /> : null}

        {isCatalogRoute ? (
          <>
            <section className="rounded-[2rem] border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-canvas-alt p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)] dark:border-brand-900/60 dark:from-slate-950 dark:via-slate-900 dark:to-brand-950/30">
              <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr] md:items-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">
                    One login. Three catalog tools.
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-gray-900 dark:text-slate-100">
                    Set up billing structures without leaving this page.
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-slate-300">
                    Add or refine departments, income heads, and bill items after
                    signing in. The forms below stay tied to the current hospital
                    and reuse the existing admin session.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
                  {setupSummaryCards.map((item) => (
                    <StatCard
                      key={item.title}
                      title={item.title}
                      value={item.value}
                      icon={item.icon}
                      variant="compact"
                    />
                  ))}
                </div>
              </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-3">
              <SetupCard
                title="Create Department"
                subtitle="Add a new department that can later receive income heads and bill items."
                icon={<FiGrid className="text-xl" />}
              >
                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const value = departmentName.trim();

                    if (!value) {
                      toast.error("Enter a department name.");
                      return;
                    }

                    createDepartmentMutation.mutate(value);
                  }}
                >
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                      Department Name
                    </span>
                    <input
                      value={departmentName}
                      onChange={(event) => setDepartmentName(event.target.value)}
                      className="w-full rounded-xl border border-line-subtle bg-canvas-alt px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
                      placeholder="Radiology"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={createDepartmentMutation.isPending}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {createDepartmentMutation.isPending
                      ? "Creating..."
                      : "Create Department"}
                  </button>
                </form>
              </SetupCard>

              <SetupCard
                title="Create Income Head"
                subtitle="Attach an income head to a department so bill items can inherit the right bucket."
                icon={<FiLayers className="text-xl" />}
              >
                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const departmentId = incomeHeadDepartmentId.trim();
                    const value = incomeHeadName.trim();

                    if (!departmentId || !value) {
                      toast.error("Select a department and enter a name.");
                      return;
                    }

                    createIncomeHeadMutation.mutate({
                      departmentId,
                      name: value,
                    });
                  }}
                >
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                      Department
                    </span>
                    <select
                      value={incomeHeadDepartmentId}
                      onChange={(event) =>
                        setIncomeHeadDepartmentId(event.target.value)
                      }
                      className="w-full rounded-xl border border-line-subtle bg-canvas-alt px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
                    >
                      <option value="">Select department</option>
                      {departmentOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                      Income Head Name
                    </span>
                    <input
                      value={incomeHeadName}
                      onChange={(event) => setIncomeHeadName(event.target.value)}
                      className="w-full rounded-xl border border-line-subtle bg-canvas-alt px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
                      placeholder="Consultation"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={createIncomeHeadMutation.isPending}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {createIncomeHeadMutation.isPending
                      ? "Creating..."
                      : "Create Income Head"}
                  </button>
                </form>
              </SetupCard>

              <SetupCard
                title="Create Bill Item"
                subtitle="Pick a department, choose an income head, and define the billable item and amount."
                icon={<FiTag className="text-xl" />}
              >
                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const departmentId = billItemDepartmentId.trim();
                    const incomeHeadId = billItemIncomeHeadId.trim();
                    const value = billItemName.trim();
                    const amount = billItemAmount.trim();

                    if (!departmentId || !incomeHeadId || !value || !amount) {
                      toast.error("Complete the bill item form first.");
                      return;
                    }

                    const numericAmount = Number(amount);

                    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
                      toast.error("Enter a valid bill amount.");
                      return;
                    }

                    createBillItemMutation.mutate({
                      departmentId,
                      incomeHeadId,
                      name: value,
                      amount,
                    });
                  }}
                >
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                      Department
                    </span>
                    <select
                      value={billItemDepartmentId}
                      onChange={(event) => {
                        setBillItemDepartmentId(event.target.value);
                        setBillItemIncomeHeadId("");
                      }}
                      className="w-full rounded-xl border border-line-subtle bg-canvas-alt px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
                    >
                      <option value="">Select department</option>
                      {departmentOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                      Income Head
                    </span>
                    <select
                      value={billItemIncomeHeadId}
                      onChange={(event) =>
                        setBillItemIncomeHeadId(event.target.value)
                      }
                      disabled={!billItemDepartmentId}
                      className="w-full rounded-xl border border-line-subtle bg-canvas-alt px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-panel-muted dark:text-slate-100"
                    >
                      <option value="">
                        {billItemDepartmentId
                          ? "Select income head"
                          : "Select department first"}
                      </option>
                      {billItemIncomeHeadOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                        Bill Item Name
                      </span>
                      <input
                        value={billItemName}
                        onChange={(event) => setBillItemName(event.target.value)}
                        className="w-full rounded-xl border border-line-subtle bg-canvas-alt px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
                        placeholder="Chest X-Ray"
                      />
                    </label>

                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                        Amount
                      </span>
                      <input
                        value={billItemAmount}
                        onChange={(event) => setBillItemAmount(event.target.value)}
                        className="w-full rounded-xl border border-line-subtle bg-canvas-alt px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
                        placeholder="6500"
                        inputMode="decimal"
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={createBillItemMutation.isPending}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {createBillItemMutation.isPending
                      ? "Creating..."
                      : "Create Bill Item"}
                  </button>
                </form>
              </SetupCard>
            </div>
          </>
        ) : (
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
        )}
      </div>
    </div>
  );
}
