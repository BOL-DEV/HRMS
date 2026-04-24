"use client";

import FoBillItemFormModal from "@/components/FoBillItemFormModal";
import FoBillItemsTable from "@/components/FoBillItemsTable";
import Header from "@/components/Header";
import AdminSearchField from "@/components/AdminSearchField";
import { ApiError } from "@/libs/api";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import {
  createFoBillItem,
  getFoBillItems,
  getFoDepartments,
  getFoIncomeHeads,
  updateFoBillItem,
} from "@/libs/fo-auth";
import { formatNaira } from "@/libs/helper";
import type { FoBillItem } from "@/libs/type";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

const PAGE_SIZE = 30;

function getStatusValue(item: FoBillItem): "active" | "inactive" | "suspended" {
  if (item.status === "suspended") {
    return "suspended";
  }

  if (item.status === "inactive" || item.is_active === false) {
    return "inactive";
  }

  return "active";
}

function Page() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = getAccessToken();
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("All");
  const [incomeHeadId, setIncomeHeadId] = useState("All");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoBillItem | null>(null);
  const [modalDepartmentId, setModalDepartmentId] = useState("");

  const departmentsQuery = useQuery({
    queryKey: ["fo-bill-items-departments"],
    queryFn: () => getFoDepartments(),
    enabled: Boolean(accessToken),
  });

  const incomeHeadsQuery = useQuery({
    queryKey: ["fo-bill-items-income-heads", departmentId],
    queryFn: () =>
      getFoIncomeHeads({
        departmentId: departmentId === "All" ? undefined : departmentId,
      }),
    enabled: Boolean(accessToken),
  });

  const modalIncomeHeadsQuery = useQuery({
    queryKey: ["fo-bill-items-modal-income-heads", modalDepartmentId],
    queryFn: () =>
      getFoIncomeHeads({
        departmentId: modalDepartmentId || undefined,
      }),
    enabled: Boolean(accessToken) && Boolean(modalDepartmentId),
  });

  const billItemsQuery = useQuery({
    queryKey: ["fo-bill-items", departmentId, incomeHeadId, search, page],
    queryFn: () =>
      getFoBillItems({
        departmentId: departmentId === "All" ? undefined : departmentId,
        incomeHeadId: incomeHeadId === "All" ? undefined : incomeHeadId,
        search: search.trim() || undefined,
        page,
        limit: PAGE_SIZE,
      }),
    enabled: Boolean(accessToken),
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
      createFoBillItem({
        department_id: payload.departmentId,
        income_head_id: payload.incomeHeadId,
        name: payload.name,
        amount: Number(payload.amount),
      }),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["fo-bill-items"] });
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
      status: "active" | "inactive" | "suspended";
    }) =>
      updateFoBillItem(payload.billItemId, {
        department_id: payload.departmentId,
        income_head_id: payload.incomeHeadId,
        name: payload.name,
        amount: Number(payload.amount),
        status: payload.status,
      }),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["fo-bill-items"] });
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
      (departmentsQuery.data?.data.departments ?? []).map((item) => ({
        id: item.department_id,
        name: item.name,
      })),
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

  const stats = useMemo(() => {
    const activeCount = rows.filter((item) => getStatusValue(item) === "active").length;
    const totalAmount = rows.reduce((sum, item) => sum + item.amount, 0);

    return {
      total: pagination?.total_bill_items ?? rows.length,
      active: activeCount,
      value: totalAmount,
    };
  }, [pagination?.total_bill_items, rows]);

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
    <div className="min-h-screen w-full bg-gray-50 dark:bg-slate-950">
      <Header
        title="Bill Items"
        Subtitle="Create and maintain FO bill items for automatic revenue hospitals"
        actions={
          <button
            type="button"
            onClick={() => {
              setModalDepartmentId("");
              setIsCreateOpen(true);
            }}
            className="hidden rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 md:block"
          >
            Add Bill Item
          </button>
        }
      />

      <div className="space-y-6 p-6">
        {currentError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {currentError}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
              Total Bill Items
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-slate-100">
              {billItemsQuery.isLoading ? "--" : stats.total}
            </h2>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
              Active On This View
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-slate-100">
              {billItemsQuery.isLoading ? "--" : stats.active}
            </h2>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
              Total Listed Value
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-slate-100">
              {billItemsQuery.isLoading ? "--" : formatNaira(stats.value)}
            </h2>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <AdminSearchField
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search bill items"
            />

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={departmentId}
                onChange={(event) => {
                  const nextDepartmentId = event.target.value;
                  setDepartmentId(nextDepartmentId);
                  setIncomeHeadId("All");
                  setPage(1);
                }}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="All">All Departments</option>
                {departmentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>

              <select
                value={incomeHeadId}
                onChange={(event) => {
                  setIncomeHeadId(event.target.value);
                  setPage(1);
                }}
                disabled={departmentId === "All"}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:disabled:bg-slate-800"
              >
                <option value="All">
                  {departmentId === "All"
                    ? "Select department first"
                    : "All Income Heads"}
                </option>
                {incomeHeadOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setModalDepartmentId("");
                  setIsCreateOpen(true);
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 md:hidden"
              >
                Add Bill Item
              </button>
            </div>
          </div>
        </div>

        <FoBillItemsTable
          rows={rows}
          isLoading={billItemsQuery.isLoading}
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
      </div>

      {isCreateOpen ? (
        <FoBillItemFormModal
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
            createMutation.mutate(values);
          }}
        />
      ) : null}

      {editingItem ? (
        <FoBillItemFormModal
          key={editingItem.bill_item_id}
          mode="edit"
          departmentOptions={departmentOptions}
          incomeHeadOptions={modalIncomeHeadOptions}
          initialValues={{
            departmentId: editingItem.department_id,
            incomeHeadId: editingItem.income_head_id,
            name: editingItem.name,
            amount: String(editingItem.amount),
            status: getStatusValue(editingItem),
          }}
          isSubmitting={updateMutation.isPending}
          onClose={() => {
            setEditingItem(null);
            setModalDepartmentId("");
          }}
          onDepartmentChange={setModalDepartmentId}
          onSubmit={(values) => {
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

export default Page;
