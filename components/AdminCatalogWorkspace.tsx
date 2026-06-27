"use client";

import AdminPageError from "@/components/AdminPageError";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import { ApiError } from "@/libs/api";
import {
  createAdminHospitalBillItem,
  createAdminHospitalDepartment,
  createAdminHospitalIncomeHead,
  getAdminHospitalDepartments,
  getAdminHospitalIncomeHeads,
  getAdminHospitals,
} from "@/libs/admin-auth";
import { clearAuthTokens, getAccessToken, getCatalogDemoSession } from "@/libs/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "react-hot-toast";
import { FiGrid, FiLayers, FiSearch, FiTag } from "react-icons/fi";

type DepartmentOption = {
  id: string;
  name: string;
};

type DemoIncomeHead = {
  id: string;
  departmentId: string;
  name: string;
};

type DemoBillItem = {
  id: string;
  departmentId: string;
  incomeHeadId: string;
  name: string;
  amount: number;
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

export default function AdminCatalogWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const accessToken = getAccessToken();
  const isDemoSession = getCatalogDemoSession();
  const isAuthenticated = Boolean(accessToken || isDemoSession);
  const initialHospitalId = searchParams.get("hospitalId") ?? "";

  const [hospitalSearch, setHospitalSearch] = useState("");
  const [selectedHospitalId, setSelectedHospitalId] = useState(initialHospitalId);
  const [departmentName, setDepartmentName] = useState("");
  const [incomeHeadDepartmentId, setIncomeHeadDepartmentId] = useState("");
  const [incomeHeadName, setIncomeHeadName] = useState("");
  const [billItemDepartmentId, setBillItemDepartmentId] = useState("");
  const [billItemIncomeHeadId, setBillItemIncomeHeadId] = useState("");
  const [billItemName, setBillItemName] = useState("");
  const [billItemAmount, setBillItemAmount] = useState("");
  const [demoDepartments, setDemoDepartments] = useState<DepartmentOption[]>([
    { id: "demo-general", name: "General" },
    { id: "demo-radiology", name: "Radiology" },
  ]);
  const [demoIncomeHeads, setDemoIncomeHeads] = useState<DemoIncomeHead[]>([
    {
      id: "demo-consultation",
      departmentId: "demo-general",
      name: "Consultation",
    },
  ]);
  const [demoBillItems, setDemoBillItems] = useState<DemoBillItem[]>([
    {
      id: "demo-bill-1",
      departmentId: "demo-general",
      incomeHeadId: "demo-consultation",
      name: "Registration Fee",
      amount: 5000,
    },
  ]);

  const hospitalsQuery = useQuery({
    queryKey: ["admin-catalog-hospitals", hospitalSearch],
    queryFn: () =>
      getAdminHospitals({
        search: hospitalSearch.trim() || undefined,
        sort: "newest",
      }),
    enabled: Boolean(accessToken && !isDemoSession),
  });

  const hospitals = useMemo(
    () => hospitalsQuery.data?.data.hospitals ?? [],
    [hospitalsQuery.data?.data.hospitals],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!(hospitalsQuery.error instanceof ApiError)) {
      return;
    }

    if (hospitalsQuery.error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
    }
  }, [hospitalsQuery.error, router]);

  useEffect(() => {
    if (selectedHospitalId) {
      return;
    }

    if (initialHospitalId) {
      setSelectedHospitalId(initialHospitalId);
      return;
    }

    if (hospitals.length > 0) {
      setSelectedHospitalId(hospitals[0].hospital_id);
    }
  }, [hospitals, initialHospitalId, selectedHospitalId]);

  useEffect(() => {
    if (!selectedHospitalId) {
      return;
    }

    if (
      selectedHospitalId &&
      hospitals.some((hospital) => hospital.hospital_id === selectedHospitalId)
    ) {
      return;
    }

    if (hospitals.length > 0) {
      setSelectedHospitalId(hospitals[0].hospital_id);
    }
  }, [hospitals, selectedHospitalId]);

  const selectedHospital = useMemo(
    () =>
      hospitals.find((hospital) => hospital.hospital_id === selectedHospitalId) ??
      null,
    [hospitals, selectedHospitalId],
  );

  const departmentsQuery = useQuery({
    queryKey: ["admin-catalog-departments", selectedHospitalId],
    queryFn: () => getAdminHospitalDepartments(selectedHospitalId),
    enabled: Boolean(accessToken && !isDemoSession && selectedHospitalId),
  });

  const incomeHeadsQuery = useQuery({
    queryKey: ["admin-catalog-income-heads", selectedHospitalId],
    queryFn: () => getAdminHospitalIncomeHeads(selectedHospitalId),
    enabled: Boolean(accessToken && !isDemoSession && selectedHospitalId),
  });

  const billItemIncomeHeadsQuery = useQuery({
    queryKey: [
      "admin-catalog-bill-item-income-heads",
      selectedHospitalId,
      billItemDepartmentId,
    ],
    queryFn: () =>
      getAdminHospitalIncomeHeads(selectedHospitalId, {
        departmentId: billItemDepartmentId || undefined,
      }),
    enabled: Boolean(
      accessToken && !isDemoSession && selectedHospitalId && billItemDepartmentId,
    ),
  });

  const departmentOptions = useMemo(
    () =>
      (departmentsQuery.data?.data.departments ?? [])
        .map(normalizeDepartment)
        .filter((item) => Boolean(item.id)),
    [departmentsQuery.data?.data.departments],
  );

  const billItemIncomeHeadOptions = useMemo(
    () =>
      (billItemIncomeHeadsQuery.data?.data.income_heads ?? []).map((item) => ({
        id: item.income_head_id,
        name: item.name,
      })),
    [billItemIncomeHeadsQuery.data?.data.income_heads],
  );

  useEffect(() => {
    const error =
      departmentsQuery.error instanceof ApiError
        ? departmentsQuery.error
        : incomeHeadsQuery.error instanceof ApiError
          ? incomeHeadsQuery.error
          : billItemIncomeHeadsQuery.error instanceof ApiError
            ? billItemIncomeHeadsQuery.error
            : null;

    if (!error || isDemoSession) {
      return;
    }

    if (error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
    }
  }, [
    billItemIncomeHeadsQuery.error,
    departmentsQuery.error,
    incomeHeadsQuery.error,
    isDemoSession,
    router,
  ]);

  const createDepartmentMutation = useMutation({
    mutationFn: (name: string) =>
      createAdminHospitalDepartment(selectedHospitalId, { name }),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({
        queryKey: ["admin-catalog-departments", selectedHospitalId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-catalog-income-heads", selectedHospitalId],
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
      createAdminHospitalIncomeHead(selectedHospitalId, {
        department_id: payload.departmentId,
        name: payload.name,
      }),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({
        queryKey: ["admin-catalog-departments", selectedHospitalId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-catalog-income-heads", selectedHospitalId],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "admin-catalog-bill-item-income-heads",
          selectedHospitalId,
          billItemDepartmentId,
        ],
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
      createAdminHospitalBillItem(selectedHospitalId, {
        department_id: payload.departmentId,
        income_head_id: payload.incomeHeadId,
        name: payload.name,
        amount: Number(payload.amount),
      }),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({
        queryKey: ["admin-catalog-departments", selectedHospitalId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-catalog-income-heads", selectedHospitalId],
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

  const currentError =
    hospitalsQuery.error instanceof Error
      ? hospitalsQuery.error.message
      : departmentsQuery.error instanceof Error
        ? departmentsQuery.error.message
        : incomeHeadsQuery.error instanceof Error
          ? incomeHeadsQuery.error.message
          : billItemIncomeHeadsQuery.error instanceof Error
            ? billItemIncomeHeadsQuery.error.message
            : null;

  const summaryCards = [
    {
      title: "Departments",
      value: String(isDemoSession ? demoDepartments.length : departmentOptions.length),
      icon: <FiGrid className="text-xl" />,
    },
    {
      title: "Income Heads",
      value: String(
        isDemoSession
          ? demoIncomeHeads.length
          : incomeHeadsQuery.data?.data.total_income_heads ?? 0,
      ),
      icon: <FiLayers className="text-xl" />,
    },
    {
      title: "Bill Items",
      value: String(isDemoSession ? demoBillItems.length : "Create"),
      icon: <FiTag className="text-xl" />,
    },
  ];

  return (
    <div className="min-h-screen w-full bg-canvas">
      <Header
        title="Catalog Dashboard"
        Subtitle="Pick a hospital and manage departments, income heads, and bill items from one place."
      />

      <div className="space-y-6 p-6">
        {currentError ? <AdminPageError message={currentError} /> : null}

        <section className="rounded-[2rem] border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-canvas-alt p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)] dark:border-brand-900/60 dark:from-slate-950 dark:via-slate-900 dark:to-brand-950/30">
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">
                Login-access dashboard
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-gray-900 dark:text-slate-100">
                Catalog setup in its own workspace.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-slate-300">
                Choose a hospital, then create departments, income heads, and
                bill items without opening the hospital settings screen.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
              {summaryCards.map((item) => (
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

        <section className="rounded-[1.75rem] border border-line-subtle bg-panel p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr] md:items-end">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Search Hospitals
              </span>
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={hospitalSearch}
                  onChange={(event) => setHospitalSearch(event.target.value)}
                  className="w-full rounded-xl border border-line-subtle bg-canvas-alt py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
                  placeholder="Search by hospital name or code"
                />
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Selected Hospital
              </span>
              <select
                value={selectedHospitalId}
                onChange={(event) => setSelectedHospitalId(event.target.value)}
                className="w-full rounded-xl border border-line-subtle bg-canvas-alt px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
              >
                <option value="">Select hospital</option>
                {hospitals.map((hospital) => (
                  <option key={hospital.hospital_id} value={hospital.hospital_id}>
                    {hospital.hospital_name} ({hospital.hospital_code})
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedHospital ? (
            <div className="mt-5 grid gap-3 rounded-2xl border border-line-subtle bg-canvas-alt p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400">
                  Hospital
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-slate-100">
                  {selectedHospital.hospital_name}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400">
                  Code
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-slate-100">
                  {selectedHospital.hospital_code}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400">
                  Revenue Type
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-slate-100">
                  {selectedHospital.revenue_type}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400">
                  Status
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-slate-100">
                  {selectedHospital.status}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-line-subtle bg-canvas-alt p-6 text-sm text-gray-500 dark:text-slate-400">
              Choose a hospital to unlock the catalog tools.
            </div>
          )}
        </section>

        {isDemoSession ? (
          <div className="grid gap-6 xl:grid-cols-3">
            <SetupCard
              title="Create Department"
              subtitle="Demo mode stores departments locally until the backend role is ready."
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

                  setDemoDepartments((current) => [
                    ...current,
                    {
                      id: `demo-dept-${Date.now()}`,
                      name: value,
                    },
                  ]);
                  setDepartmentName("");
                  toast.success("Department saved in demo mode.");
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
                  className="inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  Save Department
                </button>
              </form>
            </SetupCard>

            <SetupCard
              title="Create Income Head"
              subtitle="Demo mode attaches heads to local departments only."
              icon={<FiLayers className="text-xl" />}
            >
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  const departmentId = incomeHeadDepartmentId.trim() || demoDepartments[0]?.id || "";
                  const value = incomeHeadName.trim();

                  if (!departmentId || !value) {
                    toast.error("Select a department and enter a name.");
                    return;
                  }

                  setDemoIncomeHeads((current) => [
                    ...current,
                    {
                      id: `demo-head-${Date.now()}`,
                      departmentId,
                      name: value,
                    },
                  ]);
                  setIncomeHeadDepartmentId("");
                  setIncomeHeadName("");
                  toast.success("Income head saved in demo mode.");
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
                    {demoDepartments.map((option) => (
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
                  className="inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  Save Income Head
                </button>
              </form>
            </SetupCard>

            <SetupCard
              title="Create Bill Item"
              subtitle="Demo mode stores bill items locally with a sample amount."
              icon={<FiTag className="text-xl" />}
            >
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  const departmentId = billItemDepartmentId.trim() || demoDepartments[0]?.id || "";
                  const incomeHeadId = billItemIncomeHeadId.trim() || demoIncomeHeads[0]?.id || "";
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

                  setDemoBillItems((current) => [
                    ...current,
                    {
                      id: `demo-item-${Date.now()}`,
                      departmentId,
                      incomeHeadId,
                      name: value,
                      amount: numericAmount,
                    },
                  ]);
                  setBillItemDepartmentId("");
                  setBillItemIncomeHeadId("");
                  setBillItemName("");
                  setBillItemAmount("");
                  toast.success("Bill item saved in demo mode.");
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
                    {demoDepartments.map((option) => (
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
                    className="w-full rounded-xl border border-line-subtle bg-canvas-alt px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-100"
                  >
                    <option value="">Select income head</option>
                    {demoIncomeHeads
                      .filter((item) =>
                        billItemDepartmentId
                          ? item.departmentId === billItemDepartmentId
                          : true,
                      )
                      .map((option) => (
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
                  className="inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  Save Bill Item
                </button>
              </form>
            </SetupCard>
          </div>
        ) : selectedHospitalId ? (
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
        ) : null}
      </div>
    </div>
  );
}
