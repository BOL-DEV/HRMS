"use client";

import AdminHospitalDepartmentFormModal from "@/components/admin/AdminHospitalDepartmentFormModal";
import AdminHospitalIncomeHeadFormModal from "@/components/admin/AdminHospitalIncomeHeadFormModal";
import AdminSearchField from "@/components/admin/AdminSearchField";
import FoBillItemFormModal from "@/components/fo/FoBillItemFormModal";
import FoBillItemsTable from "@/components/fo/FoBillItemsTable";
import Header from "@/components/shared/Header";
import { ApiError } from "@/libs/api";
import {
  clearAuthTokens,
  getAccessToken,
  getCatalogDemoSession,
} from "@/libs/auth";
import {
  createAdminHospitalBillItem,
  createAdminHospitalDepartment,
  createAdminHospitalIncomeHead,
  getAdminHospitals,
  getAdminHospitalDepartments,
  getAdminHospitalIncomeHeads,
  getAdminHospitalBillItems,
  updateAdminHospitalBillItem,
  updateAdminHospitalDepartment,
  updateAdminHospitalIncomeHead,
} from "@/libs/admin-auth";
import { formatDateTime, formatNaira } from "@/libs/helper";
import type {
  AdminHospitalBillItem,
  AdminHospitalDepartmentItem,
  AdminHospitalIncomeHeadItem,
  FoBillItem,
} from "@/libs/type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "react-hot-toast";
import { FiGrid, FiLayers, FiTag } from "react-icons/fi";

type DepartmentRow = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type IncomeHeadRow = {
  id: string;
  departmentId: string;
  departmentName: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

function normalizeDepartment(item: AdminHospitalDepartmentItem): DepartmentRow {
  if (typeof item === "string") {
    return {
      id: item,
      name: item,
      isActive: true,
      createdAt: "",
      updatedAt: "",
    };
  }

  return {
    id: item.department_id ?? item.id ?? item.name,
    name: item.name,
    isActive: item.is_active !== false,
    createdAt: item.created_at ?? "",
    updatedAt: item.updated_at ?? "",
  };
}

function normalizeIncomeHead(item: AdminHospitalIncomeHeadItem): IncomeHeadRow {
  return {
    id: item.income_head_id,
    departmentId: item.department_id,
    departmentName: item.department_name,
    name: item.name,
    isActive: item.is_active,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function normalizeBillItem(item: AdminHospitalBillItem): FoBillItem {
  return {
    bill_item_id: item.bill_item_id,
    hospital_id: item.hospital_id,
    department_id: item.department_id,
    department_name: item.department_name,
    income_head_id: item.income_head_id,
    income_head_name: item.income_head_name,
    name: item.name,
    amount: item.amount,
    status: item.is_active ? "active" : "inactive",
    is_active: item.is_active,
    is_deleted: item.is_deleted,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "";
}

function SectionFrame({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)] dark:border-line-subtle dark:bg-panel">
      <div className="flex flex-col gap-4 border-b border-gray-200 p-5 dark:border-line-subtle lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
            {title}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
            {subtitle}
          </p>
        </div>

        {action ? <div>{action}</div> : null}
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] dark:border-line-subtle dark:bg-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
            {label}
          </p>
          <h3 className="mt-2 text-2xl font-bold text-gray-900 dark:text-slate-100">
            {value}
          </h3>
        </div>
        <div className="rounded-xl bg-brand-50 p-2.5 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
          {icon}
        </div>
      </div>
    </div>
  );
}

function AdminCatalogWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const accessToken = getAccessToken();
  const isDemoSession = getCatalogDemoSession();
  const isAuthenticated = Boolean(accessToken || isDemoSession);
  const initialHospitalId = searchParams.get("hospitalId") ?? "";

  const [hospitalSearch, setHospitalSearch] = useState("");
  const [selectedHospitalId, setSelectedHospitalId] = useState(initialHospitalId);
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [incomeHeadSearch, setIncomeHeadSearch] = useState("");
  const [incomeHeadDepartmentFilterId, setIncomeHeadDepartmentFilterId] =
    useState("All");
  const [billItemSearch, setBillItemSearch] = useState("");
  const [billItemDepartmentFilterId, setBillItemDepartmentFilterId] =
    useState("All");
  const [billItemIncomeHeadFilterId, setBillItemIncomeHeadFilterId] =
    useState("All");
  const [billItemPage, setBillItemPage] = useState(1);
  const [billItemModalDepartmentId, setBillItemModalDepartmentId] =
    useState("");
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [isIncomeHeadModalOpen, setIsIncomeHeadModalOpen] = useState(false);
  const [isBillItemModalOpen, setIsBillItemModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] =
    useState<DepartmentRow | null>(null);
  const [editingIncomeHead, setEditingIncomeHead] =
    useState<IncomeHeadRow | null>(null);
  const [editingBillItem, setEditingBillItem] = useState<FoBillItem | null>(
    null,
  );
  const [demoDepartments, setDemoDepartments] = useState<DepartmentRow[]>([
    {
      id: "demo-general",
      name: "General",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "demo-radiology",
      name: "Radiology",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);
  const [demoIncomeHeads, setDemoIncomeHeads] = useState<IncomeHeadRow[]>([
    {
      id: "demo-consultation",
      departmentId: "demo-general",
      departmentName: "General",
      name: "Consultation",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);
  const [demoBillItems, setDemoBillItems] = useState<FoBillItem[]>([
    {
      bill_item_id: "demo-bill-1",
      hospital_id: "demo-hospital",
      department_id: "demo-general",
      department_name: "General",
      income_head_id: "demo-consultation",
      income_head_name: "Consultation",
      name: "Registration Fee",
      amount: 5000,
      status: "active",
      is_active: true,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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

  const departmentsQuery = useQuery({
    queryKey: ["admin-catalog-departments", selectedHospitalId, departmentSearch],
    queryFn: () =>
      getAdminHospitalDepartments(selectedHospitalId, {
        search: departmentSearch.trim() || undefined,
      }),
    enabled: Boolean(accessToken && !isDemoSession && selectedHospitalId),
  });

  const incomeHeadsQuery = useQuery({
    queryKey: [
      "admin-catalog-income-heads",
      selectedHospitalId,
      incomeHeadDepartmentFilterId,
      incomeHeadSearch,
    ],
    queryFn: () =>
      getAdminHospitalIncomeHeads(selectedHospitalId, {
        departmentId:
          incomeHeadDepartmentFilterId === "All"
            ? undefined
            : incomeHeadDepartmentFilterId,
        search: incomeHeadSearch.trim() || undefined,
      }),
    enabled: Boolean(accessToken && !isDemoSession && selectedHospitalId),
  });

  const billItemsQuery = useQuery({
    queryKey: [
      "admin-catalog-bill-items",
      selectedHospitalId,
      billItemDepartmentFilterId,
      billItemIncomeHeadFilterId,
      billItemSearch,
      billItemPage,
    ],
    queryFn: () =>
      getAdminHospitalBillItems(selectedHospitalId, {
        departmentId:
          billItemDepartmentFilterId === "All"
            ? undefined
            : billItemDepartmentFilterId,
        incomeHeadId:
          billItemIncomeHeadFilterId === "All"
            ? undefined
            : billItemIncomeHeadFilterId,
        search: billItemSearch.trim() || undefined,
        page: billItemPage,
        limit: 20,
      }),
    enabled: Boolean(accessToken && !isDemoSession && selectedHospitalId),
  });

  useEffect(() => {
    if (isDemoSession) {
      return;
    }

    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, isDemoSession, router]);

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
    const error =
      departmentsQuery.error instanceof ApiError
        ? departmentsQuery.error
        : incomeHeadsQuery.error instanceof ApiError
          ? incomeHeadsQuery.error
          : billItemsQuery.error instanceof ApiError
            ? billItemsQuery.error
            : null;

    if (!error || isDemoSession) {
      return;
    }

    if (error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
    }
  }, [
    billItemsQuery.error,
    departmentsQuery.error,
    incomeHeadsQuery.error,
    isDemoSession,
    router,
  ]);

  useEffect(() => {
    if (selectedHospitalId) {
      setBillItemPage(1);
    }
  }, [selectedHospitalId]);

  useEffect(() => {
    if (isDemoSession || selectedHospitalId) {
      return;
    }

    if (initialHospitalId) {
      setSelectedHospitalId(initialHospitalId);
      return;
    }

    const hospitals = hospitalsQuery.data?.data.hospitals ?? [];

    if (hospitals.length > 0) {
      setSelectedHospitalId(hospitals[0].hospital_id);
    }
  }, [hospitalsQuery.data, initialHospitalId, isDemoSession, selectedHospitalId]);

  useEffect(() => {
    if (!selectedHospitalId || isDemoSession) {
      return;
    }

    const hospitals = hospitalsQuery.data?.data.hospitals ?? [];

    if (hospitals.some((hospital) => hospital.hospital_id === selectedHospitalId)) {
      return;
    }

    if (hospitals.length > 0) {
      setSelectedHospitalId(hospitals[0].hospital_id);
    }
  }, [hospitalsQuery.data, isDemoSession, selectedHospitalId]);

  const hospitalRows = useMemo(
    () => hospitalsQuery.data?.data.hospitals ?? [],
    [hospitalsQuery.data?.data.hospitals],
  );

  const selectedHospital = useMemo(
    () =>
      hospitalRows.find((hospital) => hospital.hospital_id === selectedHospitalId) ??
      null,
    [hospitalRows, selectedHospitalId],
  );

  const departmentRows = useMemo(() => {
    if (isDemoSession) {
      return demoDepartments.filter((department) =>
        department.name.toLowerCase().includes(departmentSearch.trim().toLowerCase()),
      );
    }

    return (
      departmentsQuery.data?.data.departments ?? []
    ).map(normalizeDepartment);
  }, [departmentSearch, departmentsQuery.data, demoDepartments, isDemoSession]);

  const incomeHeadRows = useMemo(() => {
    if (isDemoSession) {
      return demoIncomeHeads.filter((incomeHead) => {
        const matchesDepartment =
          incomeHeadDepartmentFilterId === "All"
            ? true
            : incomeHead.departmentId === incomeHeadDepartmentFilterId;
        const matchesSearch = incomeHead.name
          .toLowerCase()
          .includes(incomeHeadSearch.trim().toLowerCase());

        return matchesDepartment && matchesSearch;
      });
    }

    return (
      incomeHeadsQuery.data?.data.income_heads ?? []
    ).map(normalizeIncomeHead);
  }, [
    demoIncomeHeads,
    incomeHeadDepartmentFilterId,
    incomeHeadSearch,
    incomeHeadsQuery.data,
    isDemoSession,
  ]);

  const billItemRows = useMemo(() => {
    if (isDemoSession) {
      return demoBillItems.filter((billItem) => {
        const matchesDepartment =
          billItemDepartmentFilterId === "All"
            ? true
            : billItem.department_id === billItemDepartmentFilterId;
        const matchesIncomeHead =
          billItemIncomeHeadFilterId === "All"
            ? true
            : billItem.income_head_id === billItemIncomeHeadFilterId;
        const matchesSearch = billItem.name
          .toLowerCase()
          .includes(billItemSearch.trim().toLowerCase());

        return matchesDepartment && matchesIncomeHead && matchesSearch;
      });
    }

    return (
      billItemsQuery.data?.data.bill_items ?? []
    ).map(normalizeBillItem);
  }, [
    billItemDepartmentFilterId,
    billItemIncomeHeadFilterId,
    billItemSearch,
    billItemsQuery.data,
    demoBillItems,
    isDemoSession,
  ]);

  const departmentOptions = useMemo(
    () => departmentRows.map((department) => ({
      id: department.id,
      name: department.name,
    })),
    [departmentRows],
  );

  const incomeHeadOptions = useMemo(
    () =>
      incomeHeadRows.map((incomeHead) => ({
        id: incomeHead.id,
        name: incomeHead.name,
      })),
    [incomeHeadRows],
  );

  const modalIncomeHeadOptions = useMemo(() => {
    const source = isDemoSession
      ? demoIncomeHeads
      : (incomeHeadsQuery.data?.data.income_heads ?? []).map(normalizeIncomeHead);

    return source
      .filter((incomeHead) =>
        billItemModalDepartmentId
          ? incomeHead.departmentId === billItemModalDepartmentId
          : true,
      )
      .map((incomeHead) => ({
        id: incomeHead.id,
        name: incomeHead.name,
      }));
  }, [
    billItemModalDepartmentId,
    demoIncomeHeads,
    incomeHeadsQuery.data,
    isDemoSession,
  ]);

  const totalDepartmentCount = isDemoSession
    ? departmentRows.length
    : departmentsQuery.data?.data.total_departments ?? departmentRows.length;
  const totalIncomeHeadCount = isDemoSession
    ? incomeHeadRows.length
    : incomeHeadsQuery.data?.data.total_income_heads ?? incomeHeadRows.length;
  const totalBillItemCount = isDemoSession
    ? billItemRows.length
    : billItemsQuery.data?.data.pagination.total_bill_items ?? billItemRows.length;
  const totalBillItemValue = billItemRows.reduce(
    (sum, billItem) => sum + billItem.amount,
    0,
  );

  const currentError = isDemoSession
    ? ""
    : getErrorMessage(hospitalsQuery.error) ||
      getErrorMessage(departmentsQuery.error) ||
      getErrorMessage(incomeHeadsQuery.error) ||
      getErrorMessage(billItemsQuery.error);

  const departmentCreateMutation = useMutation({
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
      setIsDepartmentModalOpen(false);
    },
  });

  const departmentUpdateMutation = useMutation({
    mutationFn: (payload: { departmentId: string; name: string }) =>
      updateAdminHospitalDepartment(selectedHospitalId, payload.departmentId, {
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
      setEditingDepartment(null);
    },
  });

  const incomeHeadCreateMutation = useMutation({
    mutationFn: (payload: { departmentId: string; name: string }) =>
      createAdminHospitalIncomeHead(selectedHospitalId, {
        department_id: payload.departmentId,
        name: payload.name,
      }),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({
        queryKey: ["admin-catalog-income-heads", selectedHospitalId],
      });
      setIsIncomeHeadModalOpen(false);
    },
  });

  const incomeHeadUpdateMutation = useMutation({
    mutationFn: (payload: {
      incomeHeadId: string;
      departmentId: string;
      name: string;
      status: "active" | "suspended";
    }) =>
      updateAdminHospitalIncomeHead(selectedHospitalId, payload.incomeHeadId, {
        department_id: payload.departmentId,
        name: payload.name,
        status: payload.status,
      }),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({
        queryKey: ["admin-catalog-income-heads", selectedHospitalId],
      });
      setEditingIncomeHead(null);
    },
  });

  const billItemCreateMutation = useMutation({
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
        queryKey: ["admin-catalog-bill-items", selectedHospitalId],
      });
      setIsBillItemModalOpen(false);
      setBillItemModalDepartmentId("");
    },
  });

  const billItemUpdateMutation = useMutation({
    mutationFn: (payload: {
      billItemId: string;
      departmentId: string;
      incomeHeadId: string;
      name: string;
      amount: string;
      status: "active" | "inactive" | "suspended";
    }) =>
      updateAdminHospitalBillItem(selectedHospitalId, payload.billItemId, {
        department_id: payload.departmentId,
        income_head_id: payload.incomeHeadId,
        name: payload.name,
        amount: Number(payload.amount),
        status: payload.status === "active" ? "active" : "inactive",
      }),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({
        queryKey: ["admin-catalog-bill-items", selectedHospitalId],
      });
      setEditingBillItem(null);
      setBillItemModalDepartmentId("");
    },
  });

  const handleCreateDepartment = (name: string) => {
    if (!name) {
      toast.error("Enter a department name.");
      return;
    }

    if (isDemoSession) {
      const now = new Date().toISOString();

      setDemoDepartments((current) => [
        ...current,
        {
          id: `demo-dept-${Date.now()}`,
          name,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      ]);
      toast.success("Department saved in demo mode.");
      setIsDepartmentModalOpen(false);
      return;
    }

    departmentCreateMutation.mutate(name);
  };

  const handleUpdateDepartment = (name: string) => {
    if (!editingDepartment) {
      return;
    }

    if (!name) {
      toast.error("Enter a department name.");
      return;
    }

    if (isDemoSession) {
      setDemoDepartments((current) =>
        current.map((department) =>
          department.id === editingDepartment.id
            ? {
                ...department,
                name,
                updatedAt: new Date().toISOString(),
              }
            : department,
        ),
      );
      toast.success("Department updated in demo mode.");
      setEditingDepartment(null);
      return;
    }

    departmentUpdateMutation.mutate({
      departmentId: editingDepartment.id,
      name,
    });
  };

  const handleCreateIncomeHead = (values: {
    departmentId: string;
    name: string;
    status: "active" | "suspended";
  }) => {
    if (!values.departmentId || !values.name) {
      toast.error("Select a department and enter a name.");
      return;
    }

    if (isDemoSession) {
      const departmentName =
        departmentRows.find((department) => department.id === values.departmentId)
          ?.name ?? "";
      const now = new Date().toISOString();

      setDemoIncomeHeads((current) => [
        ...current,
        {
          id: `demo-head-${Date.now()}`,
          departmentId: values.departmentId,
          departmentName,
          name: values.name,
          isActive: values.status === "active",
          createdAt: now,
          updatedAt: now,
        },
      ]);
      toast.success("Income head saved in demo mode.");
      setIsIncomeHeadModalOpen(false);
      return;
    }

    incomeHeadCreateMutation.mutate({
      departmentId: values.departmentId,
      name: values.name,
    });
  };

  const handleUpdateIncomeHead = (values: {
    departmentId: string;
    name: string;
    status: "active" | "suspended";
  }) => {
    if (!editingIncomeHead) {
      return;
    }

    if (!values.departmentId || !values.name) {
      toast.error("Select a department and enter a name.");
      return;
    }

    if (isDemoSession) {
      const departmentName =
        departmentRows.find((department) => department.id === values.departmentId)
          ?.name ?? "";
      const now = new Date().toISOString();

      setDemoIncomeHeads((current) =>
        current.map((incomeHead) =>
          incomeHead.id === editingIncomeHead.id
            ? {
                ...incomeHead,
                departmentId: values.departmentId,
                departmentName,
                name: values.name,
                isActive: values.status === "active",
                updatedAt: now,
              }
            : incomeHead,
        ),
      );
      toast.success("Income head updated in demo mode.");
      setEditingIncomeHead(null);
      return;
    }

    incomeHeadUpdateMutation.mutate({
      incomeHeadId: editingIncomeHead.id,
      departmentId: values.departmentId,
      name: values.name,
      status: values.status,
    });
  };

  const handleCreateBillItem = (values: {
    departmentId: string;
    incomeHeadId: string;
    name: string;
    amount: string;
    status: "active" | "inactive" | "suspended";
  }) => {
    if (!values.departmentId || !values.incomeHeadId || !values.name || !values.amount) {
      toast.error("Complete the bill item form first.");
      return;
    }

    if (isDemoSession) {
      const departmentName =
        departmentRows.find((department) => department.id === values.departmentId)
          ?.name ?? "";
      const incomeHeadName =
        incomeHeadRows.find((incomeHead) => incomeHead.id === values.incomeHeadId)
          ?.name ?? "";
      const now = new Date().toISOString();
      const amount = Number(values.amount);

      if (!Number.isFinite(amount) || amount <= 0) {
        toast.error("Enter a valid bill amount.");
        return;
      }

      setDemoBillItems((current) => [
        ...current,
        {
          bill_item_id: `demo-item-${Date.now()}`,
          hospital_id: "demo-hospital",
          department_id: values.departmentId,
          department_name: departmentName,
          income_head_id: values.incomeHeadId,
          income_head_name: incomeHeadName,
          name: values.name,
          amount,
          status: values.status === "inactive" ? "inactive" : "active",
          is_active: values.status !== "inactive",
          is_deleted: false,
          created_at: now,
          updated_at: now,
        },
      ]);
      toast.success("Bill item saved in demo mode.");
      setIsBillItemModalOpen(false);
      setBillItemModalDepartmentId("");
      return;
    }

    billItemCreateMutation.mutate({
      departmentId: values.departmentId,
      incomeHeadId: values.incomeHeadId,
      name: values.name,
      amount: values.amount,
    });
  };

  const handleUpdateBillItem = (values: {
    departmentId: string;
    incomeHeadId: string;
    name: string;
    amount: string;
    status: "active" | "inactive" | "suspended";
  }) => {
    if (!editingBillItem) {
      return;
    }

    if (!values.departmentId || !values.incomeHeadId || !values.name || !values.amount) {
      toast.error("Complete the bill item form first.");
      return;
    }

    const amount = Number(values.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid bill amount.");
      return;
    }

    if (isDemoSession) {
      const departmentName =
        departmentRows.find((department) => department.id === values.departmentId)
          ?.name ?? "";
      const incomeHeadName =
        incomeHeadRows.find((incomeHead) => incomeHead.id === values.incomeHeadId)
          ?.name ?? "";
      const now = new Date().toISOString();

      setDemoBillItems((current) =>
        current.map((billItem) =>
          billItem.bill_item_id === editingBillItem.bill_item_id
            ? {
                ...billItem,
                department_id: values.departmentId,
                department_name: departmentName,
                income_head_id: values.incomeHeadId,
                income_head_name: incomeHeadName,
                name: values.name,
                amount,
                status: values.status === "inactive" ? "inactive" : "active",
                is_active: values.status !== "inactive",
                updated_at: now,
              }
            : billItem,
        ),
      );
      toast.success("Bill item updated in demo mode.");
      setEditingBillItem(null);
      setBillItemModalDepartmentId("");
      return;
    }

    billItemUpdateMutation.mutate({
      billItemId: editingBillItem.bill_item_id,
      departmentId: values.departmentId,
      incomeHeadId: values.incomeHeadId,
      name: values.name,
      amount: values.amount,
      status: values.status,
    });
  };

  return (
    <div className="min-h-screen w-full bg-canvas">
      <Header
        title="Catalog"
        Subtitle="Manage departments, income heads, and bill items in the same FO-style workspace"
      />

      <div className="space-y-6 p-6">
        {currentError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {currentError}
          </div>
        ) : null}

        <section className="rounded-[2rem] border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-canvas-alt p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)] dark:border-brand-900/60 dark:from-slate-950 dark:via-slate-900 dark:to-brand-950/30">
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">
                Catalog workspace
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-gray-900 dark:text-slate-100">
                FO-style catalog management.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-slate-300">
                Keep the catalog feeling familiar. Departments, income heads,
                and bill items now follow the same simple structure used in the
                FO area.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
              <StatCard
                label="Departments"
                value={String(totalDepartmentCount)}
                icon={<FiGrid className="text-xl" />}
              />
              <StatCard
                label="Income Heads"
                value={String(totalIncomeHeadCount)}
                icon={<FiLayers className="text-xl" />}
              />
              <StatCard
                label="Bill Items"
                value={String(totalBillItemCount)}
                icon={<FiTag className="text-xl" />}
              />
            </div>
          </div>
        </section>

        {!isDemoSession ? (
          <section className="rounded-[1.75rem] border border-line-subtle bg-panel p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr] md:items-end">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  Search Hospitals
                </span>
                <AdminSearchField
                  value={hospitalSearch}
                  onChange={(event) => setHospitalSearch(event.target.value)}
                  placeholder="Search by hospital name or code"
                  className="w-full"
                />
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
                  {hospitalRows.map((hospital) => (
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
        ) : (
          <section className="rounded-[1.75rem] border border-line-subtle bg-panel p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
              Demo catalog session
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
              This demo keeps the same FO-style layout, but changes are stored
              locally.
            </p>
          </section>
        )}

        <section className="grid gap-6 xl:grid-cols-2">
          <SectionFrame
            title="Departments"
            subtitle="Browse and manage departments in a familiar FO-style table."
            action={
              <button
                type="button"
                onClick={() => {
                  setEditingDepartment(null);
                  setIsDepartmentModalOpen(true);
                }}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Add Department
              </button>
            }
          >
            <div className="mb-4">
              <AdminSearchField
                value={departmentSearch}
                onChange={(event) => setDepartmentSearch(event.target.value)}
                placeholder="Search departments"
                className="w-full max-w-md"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left text-gray-600 dark:bg-panel-strong dark:text-slate-300">
                    <th className="p-3 font-semibold">Department</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold">Created</th>
                    <th className="p-3 font-semibold">Updated</th>
                    <th className="p-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isDemoSession ? null : departmentsQuery.isLoading ? (
                    <tr>
                      <td
                        className="p-4 text-gray-500 dark:text-slate-400"
                        colSpan={5}
                      >
                        Loading departments...
                      </td>
                    </tr>
                  ) : departmentRows.length === 0 ? (
                    <tr>
                      <td
                        className="p-4 text-gray-500 dark:text-slate-400"
                        colSpan={5}
                      >
                        No departments found for the current search.
                      </td>
                    </tr>
                  ) : (
                    departmentRows.map((department) => (
                      <tr
                        key={department.id}
                        className="border-b border-gray-100 dark:border-line-subtle"
                      >
                        <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                          {department.name}
                        </td>
                        <td className="p-3 text-gray-700 dark:text-slate-300">
                          {department.isActive ? "Active" : "Inactive"}
                        </td>
                        <td className="p-3 text-gray-700 dark:text-slate-300">
                          {department.createdAt
                            ? formatDateTime(department.createdAt)
                            : "--"}
                        </td>
                        <td className="p-3 text-gray-700 dark:text-slate-300">
                          {department.updatedAt
                            ? formatDateTime(department.updatedAt)
                            : "--"}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => setEditingDepartment(department)}
                            className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-line-subtle dark:text-slate-200 dark:hover:bg-panel-strong"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                  {isDemoSession && departmentRows.length === 0 ? (
                    <tr>
                      <td
                        className="p-4 text-gray-500 dark:text-slate-400"
                        colSpan={5}
                      >
                        No departments found for the current search.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </SectionFrame>

          <SectionFrame
            title="Income Heads"
            subtitle="Keep income heads grouped by department, just like the FO workspace."
            action={
              <button
                type="button"
                onClick={() => {
                  setEditingIncomeHead(null);
                  setIsIncomeHeadModalOpen(true);
                }}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Add Income Head
              </button>
            }
          >
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px]">
              <AdminSearchField
                value={incomeHeadSearch}
                onChange={(event) => setIncomeHeadSearch(event.target.value)}
                placeholder="Search income heads"
                className="w-full"
              />

              <select
                value={incomeHeadDepartmentFilterId}
                onChange={(event) => setIncomeHeadDepartmentFilterId(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-line-subtle dark:bg-canvas-alt dark:text-slate-100"
              >
                <option value="All">All Departments</option>
                {departmentRows.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left text-gray-600 dark:bg-panel-strong dark:text-slate-300">
                    <th className="p-3 font-semibold">Income Head</th>
                    <th className="p-3 font-semibold">Department</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold">Updated</th>
                    <th className="p-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isDemoSession ? null : incomeHeadsQuery.isLoading ? (
                    <tr>
                      <td
                        className="p-4 text-gray-500 dark:text-slate-400"
                        colSpan={5}
                      >
                        Loading income heads...
                      </td>
                    </tr>
                  ) : incomeHeadRows.length === 0 ? (
                    <tr>
                      <td
                        className="p-4 text-gray-500 dark:text-slate-400"
                        colSpan={5}
                      >
                        No income heads found for the current filters.
                      </td>
                    </tr>
                  ) : (
                    incomeHeadRows.map((incomeHead) => (
                      <tr
                        key={incomeHead.id}
                        className="border-b border-gray-100 dark:border-line-subtle"
                      >
                        <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                          {incomeHead.name}
                        </td>
                        <td className="p-3 text-gray-700 dark:text-slate-300">
                          {incomeHead.departmentName}
                        </td>
                        <td className="p-3 text-gray-700 dark:text-slate-300">
                          {incomeHead.isActive ? "Active" : "Inactive"}
                        </td>
                        <td className="p-3 text-gray-700 dark:text-slate-300">
                          {incomeHead.updatedAt
                            ? formatDateTime(incomeHead.updatedAt)
                            : "--"}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => setEditingIncomeHead(incomeHead)}
                            className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-line-subtle dark:text-slate-200 dark:hover:bg-panel-strong"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                  {isDemoSession && incomeHeadRows.length === 0 ? (
                    <tr>
                      <td
                        className="p-4 text-gray-500 dark:text-slate-400"
                        colSpan={5}
                      >
                        No income heads found for the current filters.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </SectionFrame>
        </section>

        <SectionFrame
          title="Bill Items"
          subtitle="Bill items stay in the same FO-style table, only with catalog permissions."
          action={
            <button
              type="button"
              onClick={() => {
                setEditingBillItem(null);
                setBillItemModalDepartmentId("");
                setIsBillItemModalOpen(true);
              }}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Add Bill Item
            </button>
          }
        >
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
            <AdminSearchField
              value={billItemSearch}
              onChange={(event) => {
                setBillItemSearch(event.target.value);
                setBillItemPage(1);
              }}
              placeholder="Search bill items"
              className="w-full"
            />

            <select
              value={billItemDepartmentFilterId}
              onChange={(event) => {
                setBillItemDepartmentFilterId(event.target.value);
                setBillItemIncomeHeadFilterId("All");
                setBillItemPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-line-subtle dark:bg-canvas-alt dark:text-slate-100"
            >
              <option value="All">All Departments</option>
              {departmentRows.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>

            <select
              value={billItemIncomeHeadFilterId}
              onChange={(event) => {
                setBillItemIncomeHeadFilterId(event.target.value);
                setBillItemPage(1);
              }}
              disabled={billItemDepartmentFilterId === "All"}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-line-subtle dark:bg-canvas-alt dark:text-slate-100 dark:disabled:bg-panel-strong"
            >
              <option value="All">
                {billItemDepartmentFilterId === "All"
                  ? "Select department first"
                  : "All Income Heads"}
              </option>
              {incomeHeadRows
                .filter((incomeHead) =>
                  billItemDepartmentFilterId === "All"
                    ? true
                    : incomeHead.departmentId === billItemDepartmentFilterId,
                )
                .map((incomeHead) => (
                  <option key={incomeHead.id} value={incomeHead.id}>
                    {incomeHead.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-line-subtle dark:bg-canvas/70">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Listed Value"
                value={formatNaira(totalBillItemValue)}
                icon={<FiTag className="text-xl" />}
              />
              <StatCard
                label="Current Page"
                value={isDemoSession ? "Demo" : String(billItemPage)}
                icon={<FiGrid className="text-xl" />}
              />
              <StatCard
                label="Filtered Items"
                value={String(billItemRows.length)}
                icon={<FiLayers className="text-xl" />}
              />
            </div>
          </div>

          <div className="mt-4">
            <FoBillItemsTable
              rows={billItemRows}
              isLoading={!isDemoSession && billItemsQuery.isLoading}
              onEdit={(item) => {
                setEditingBillItem(item);
                setBillItemModalDepartmentId(item.department_id);
              }}
            />
          </div>

          {!isDemoSession && billItemsQuery.data?.data.pagination ? (
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.05)] dark:border-line-subtle dark:bg-panel">
              <p className="text-sm text-gray-600 dark:text-slate-300">
                Page {billItemsQuery.data.data.pagination.page} of{" "}
                {billItemsQuery.data.data.pagination.total_pages}
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={!billItemsQuery.data.data.pagination.has_previous_page}
                  onClick={() =>
                    setBillItemPage((current) => Math.max(current - 1, 1))
                  }
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-line-subtle dark:text-slate-200 dark:hover:bg-panel-strong"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={!billItemsQuery.data.data.pagination.has_next_page}
                  onClick={() => setBillItemPage((current) => current + 1)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-line-subtle dark:text-slate-200 dark:hover:bg-panel-strong"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </SectionFrame>
      </div>

      {isDepartmentModalOpen ? (
        <AdminHospitalDepartmentFormModal
          mode="create"
          isSubmitting={departmentCreateMutation.isPending}
          onClose={() => setIsDepartmentModalOpen(false)}
          onSubmit={handleCreateDepartment}
        />
      ) : null}

      {editingDepartment ? (
        <AdminHospitalDepartmentFormModal
          mode="edit"
          initialName={editingDepartment.name}
          isSubmitting={departmentUpdateMutation.isPending}
          onClose={() => setEditingDepartment(null)}
          onSubmit={handleUpdateDepartment}
        />
      ) : null}

      {isIncomeHeadModalOpen ? (
        <AdminHospitalIncomeHeadFormModal
          mode="create"
          departmentOptions={departmentOptions}
          isSubmitting={incomeHeadCreateMutation.isPending}
          onClose={() => setIsIncomeHeadModalOpen(false)}
          onSubmit={handleCreateIncomeHead}
        />
      ) : null}

      {editingIncomeHead ? (
        <AdminHospitalIncomeHeadFormModal
          mode="edit"
          departmentOptions={departmentOptions}
          initialValues={{
            departmentId: editingIncomeHead.departmentId,
            name: editingIncomeHead.name,
            status: editingIncomeHead.isActive ? "active" : "suspended",
          }}
          isSubmitting={incomeHeadUpdateMutation.isPending}
          onClose={() => setEditingIncomeHead(null)}
          onSubmit={handleUpdateIncomeHead}
        />
      ) : null}

      {isBillItemModalOpen ? (
        <FoBillItemFormModal
          key={`create-${billItemModalDepartmentId}`}
          mode="create"
          departmentOptions={departmentOptions}
          incomeHeadOptions={modalIncomeHeadOptions}
          isSubmitting={billItemCreateMutation.isPending}
          onClose={() => setIsBillItemModalOpen(false)}
          onDepartmentChange={setBillItemModalDepartmentId}
          onSubmit={handleCreateBillItem}
        />
      ) : null}

      {editingBillItem ? (
        <FoBillItemFormModal
          key={editingBillItem.bill_item_id}
          mode="edit"
          departmentOptions={departmentOptions}
          incomeHeadOptions={modalIncomeHeadOptions}
          initialValues={{
            departmentId: editingBillItem.department_id,
            incomeHeadId: editingBillItem.income_head_id,
            name: editingBillItem.name,
            amount: String(editingBillItem.amount),
            status: editingBillItem.status ?? "active",
          }}
          isSubmitting={billItemUpdateMutation.isPending}
          onClose={() => setEditingBillItem(null)}
          onDepartmentChange={setBillItemModalDepartmentId}
          onSubmit={handleUpdateBillItem}
        />
      ) : null}
    </div>
  );
}

export default AdminCatalogWorkspace;
