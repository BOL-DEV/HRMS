"use client";

import AdminHospitalBillItemFormModal from "@/components/AdminHospitalBillItemFormModal";
import AdminHospitalBillItemsSection from "@/components/AdminHospitalBillItemsSection";
import AdminPageError from "@/components/AdminPageError";
import StatCard from "@/components/StatCard";
import { ApiError } from "@/libs/api";
import {
  createAdminHospitalBillItem,
  getAdminHospitalBillItems,
  getAdminHospitalDepartments,
  getAdminHospitalIncomeHeads,
  updateAdminHospitalBillItem,
} from "@/libs/admin-auth";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import { formatNaira } from "@/libs/helper";
import type { AdminHospitalBillItem } from "@/libs/type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { FiTag } from "react-icons/fi";

const PAGE_SIZE = 30;

export default function HospitalBillItemsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = getAccessToken();
  const hospitalId = params?.id ?? "";
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("All");
  const [incomeHeadId, setIncomeHeadId] = useState("All");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminHospitalBillItem | null>(null);
  const [modalDepartmentId, setModalDepartmentId] = useState("");

  const departmentsQuery = useQuery({
    queryKey: ["admin-hospital-bill-items-departments", hospitalId],
    queryFn: () => getAdminHospitalDepartments(hospitalId),
    enabled: Boolean(accessToken && hospitalId),
  });

  const incomeHeadsQuery = useQuery({
    queryKey: ["admin-hospital-bill-items-income-heads", hospitalId, departmentId],
    queryFn: () =>
      getAdminHospitalIncomeHeads(hospitalId, {
        departmentId: departmentId === "All" ? undefined : departmentId,
      }),
    enabled: Boolean(accessToken && hospitalId),
  });

  const modalIncomeHeadsQuery = useQuery({
    queryKey: ["admin-hospital-bill-items-modal-income-heads", hospitalId, modalDepartmentId],
    queryFn: () =>
      getAdminHospitalIncomeHeads(hospitalId, {
        departmentId: modalDepartmentId || undefined,
      }),
    enabled: Boolean(accessToken && hospitalId && modalDepartmentId),
  });

  const billItemsQuery = useQuery({
    queryKey: [
      "admin-hospital-bill-items",
      hospitalId,
      departmentId,
      incomeHeadId,
      search,
      page,
    ],
    queryFn: () =>
      getAdminHospitalBillItems(hospitalId, {
        departmentId: departmentId === "All" ? undefined : departmentId,
        incomeHeadId: incomeHeadId === "All" ? undefined : incomeHeadId,
        search: search.trim() || undefined,
        page,
        limit: PAGE_SIZE,
      }),
    enabled: Boolean(accessToken && hospitalId),
  });

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    const error =
      billItemsQuery.error instanceof ApiError
        ? billItemsQuery.error
        : departmentsQuery.error instanceof ApiError
          ? departmentsQuery.error
          : incomeHeadsQuery.error instanceof ApiError
            ? incomeHeadsQuery.error
            : modalIncomeHeadsQuery.error instanceof ApiError
              ? modalIncomeHeadsQuery.error
              : null;

    if (!error) {
      return;
    }

    if (error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
      return;
    }

    if (error.status === 404) {
      router.replace("/admin/hospitals");
    }
  }, [
    billItemsQuery.error,
    departmentsQuery.error,
    incomeHeadsQuery.error,
    modalIncomeHeadsQuery.error,
    router,
  ]);

  const createMutation = useMutation({
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
        queryKey: ["admin-hospital-bill-items", hospitalId],
      });
      setIsCreateOpen(false);
      setModalDepartmentId("");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to create bill item.",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: {
      billItemId: string;
      departmentId: string;
      incomeHeadId: string;
      name: string;
      amount: string;
      status: "active" | "inactive";
    }) =>
      updateAdminHospitalBillItem(hospitalId, payload.billItemId, {
        department_id: payload.departmentId,
        income_head_id: payload.incomeHeadId,
        name: payload.name,
        amount: Number(payload.amount),
        status: payload.status,
      }),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({
        queryKey: ["admin-hospital-bill-items", hospitalId],
      });
      setEditingItem(null);
      setModalDepartmentId("");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to update bill item.",
      );
    },
  });

  const departmentOptions = useMemo(
    () =>
      (departmentsQuery.data?.data.departments ?? []).map((item) =>
        typeof item === "string"
          ? { id: item, name: item }
          : {
              id: item.department_id ?? item.id ?? item.name,
              name: item.name,
            },
      ),
    [departmentsQuery.data?.data.departments],
  );

  const incomeHeadOptions = useMemo(
    () =>
      (incomeHeadsQuery.data?.data.income_heads ?? []).map((item) => ({
        id: item.income_head_id,
        name: item.name,
      })),
    [incomeHeadsQuery.data?.data.income_heads],
  );

  const modalIncomeHeadOptions = useMemo(
    () =>
      (modalIncomeHeadsQuery.data?.data.income_heads ?? []).map((item) => ({
        id: item.income_head_id,
        name: item.name,
      })),
    [modalIncomeHeadsQuery.data?.data.income_heads],
  );

  const rows = useMemo(
    () => billItemsQuery.data?.data.bill_items ?? [],
    [billItemsQuery.data?.data.bill_items],
  );

  const pagination = billItemsQuery.data?.data.pagination;
  const totalListedValue = rows.reduce((sum, item) => sum + item.amount, 0);

  const currentError =
    billItemsQuery.error instanceof Error
      ? billItemsQuery.error.message
      : departmentsQuery.error instanceof Error
        ? departmentsQuery.error.message
        : incomeHeadsQuery.error instanceof Error
          ? incomeHeadsQuery.error.message
          : modalIncomeHeadsQuery.error instanceof Error
            ? modalIncomeHeadsQuery.error.message
            : null;

  return (
    <div className="space-y-6">
      {currentError ? <AdminPageError message={currentError} /> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StatCard
          title="Total Bill Items"
          value={String(pagination?.total_bill_items ?? rows.length)}
          icon={<FiTag className="text-xl" />}
        />
        <StatCard
          title="Total Listed Value"
          value={formatNaira(totalListedValue)}
          icon={<FiTag className="text-xl" />}
        />
      </div>

      <AdminHospitalBillItemsSection
        rows={rows}
        search={search}
        departmentId={departmentId}
        incomeHeadId={incomeHeadId}
        departmentOptions={departmentOptions}
        incomeHeadOptions={incomeHeadOptions}
        isLoading={billItemsQuery.isLoading && !billItemsQuery.data}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        onDepartmentChange={(value) => {
          setDepartmentId(value);
          setIncomeHeadId("All");
          setPage(1);
        }}
        onIncomeHeadChange={(value) => {
          setIncomeHeadId(value);
          setPage(1);
        }}
        onOpenCreateModal={() => {
          setModalDepartmentId("");
          setIsCreateOpen(true);
        }}
        onEdit={(item) => {
          setEditingItem(item);
          setModalDepartmentId(item.department_id);
        }}
      />

      {pagination ? (
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Page {pagination.page} of {pagination.total_pages}
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!pagination.has_previous_page}
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!pagination.has_next_page}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      {isCreateOpen ? (
        <AdminHospitalBillItemFormModal
          key="create-bill-item"
          mode="create"
          departmentOptions={departmentOptions}
          incomeHeadOptions={modalIncomeHeadOptions}
          isSubmitting={createMutation.isPending}
          onClose={() => {
            setIsCreateOpen(false);
            setModalDepartmentId("");
          }}
          onDepartmentChange={setModalDepartmentId}
          onSubmit={(values) => {
            if (
              !values.departmentId ||
              !values.incomeHeadId ||
              !values.name ||
              !values.amount
            ) {
              toast.error("Complete the bill item form first.");
              return;
            }

            createMutation.mutate(values);
          }}
        />
      ) : null}

      {editingItem ? (
        <AdminHospitalBillItemFormModal
          key={editingItem.bill_item_id}
          mode="edit"
          departmentOptions={departmentOptions}
          incomeHeadOptions={modalIncomeHeadOptions}
          initialValues={{
            departmentId: editingItem.department_id,
            incomeHeadId: editingItem.income_head_id,
            name: editingItem.name,
            amount: String(editingItem.amount),
            status: editingItem.is_active ? "active" : "inactive",
          }}
          isSubmitting={updateMutation.isPending}
          onClose={() => {
            setEditingItem(null);
            setModalDepartmentId("");
          }}
          onDepartmentChange={setModalDepartmentId}
          onSubmit={(values) => {
            if (
              !values.departmentId ||
              !values.incomeHeadId ||
              !values.name ||
              !values.amount
            ) {
              toast.error("Complete the bill item form first.");
              return;
            }

            updateMutation.mutate({
              billItemId: editingItem.bill_item_id,
              ...values,
            });
          }}
        />
      ) : null}
    </div>
  );
}
