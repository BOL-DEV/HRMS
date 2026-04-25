"use client";

import AdminHospitalIncomeHeadFormModal from "@/components/AdminHospitalIncomeHeadFormModal";
import AdminSearchField from "@/components/AdminSearchField";
import Header from "@/components/Header";
import { ApiError } from "@/libs/api";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import {
  createFoIncomeHead,
  getFoDepartments,
  getFoIncomeHeads,
  updateFoIncomeHead,
} from "@/libs/fo-auth";
import { formatDateTime } from "@/libs/helper";
import type { FoIncomeHeadItem } from "@/libs/type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

export default function FoIncomeHeadsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = getAccessToken();
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("All");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingIncomeHead, setEditingIncomeHead] =
    useState<FoIncomeHeadItem | null>(null);

  const departmentsQuery = useQuery({
    queryKey: ["fo-income-heads-departments-page"],
    queryFn: () => getFoDepartments(),
    enabled: Boolean(accessToken),
  });

  const incomeHeadsQuery = useQuery({
    queryKey: ["fo-income-heads-page", departmentId, search],
    queryFn: () =>
      getFoIncomeHeads({
        departmentId: departmentId === "All" ? undefined : departmentId,
        search: search.trim() || undefined,
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
      incomeHeadsQuery.error instanceof ApiError
        ? incomeHeadsQuery.error
        : departmentsQuery.error instanceof ApiError
          ? departmentsQuery.error
          : null;

    if (!error) {
      return;
    }

    if (error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
    }
  }, [departmentsQuery.error, incomeHeadsQuery.error, router]);

  const createMutation = useMutation({
    mutationFn: (payload: { departmentId: string; name: string }) =>
      createFoIncomeHead({
        department_id: payload.departmentId,
        name: payload.name,
      }),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["fo-income-heads-page"] });
      setIsCreateOpen(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to create income head.",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: {
      incomeHeadId: string;
      departmentId: string;
      name: string;
      status: "active" | "suspended";
    }) =>
      updateFoIncomeHead(payload.incomeHeadId, {
        department_id: payload.departmentId,
        name: payload.name,
        status: payload.status,
      }),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["fo-income-heads-page"] });
      setEditingIncomeHead(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to update income head.",
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

  const rows = useMemo(
    () => incomeHeadsQuery.data?.data.income_heads ?? [],
    [incomeHeadsQuery.data?.data.income_heads],
  );

  const currentError =
    incomeHeadsQuery.error instanceof Error
      ? incomeHeadsQuery.error.message
      : departmentsQuery.error instanceof Error
        ? departmentsQuery.error.message
        : null;

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-slate-950">
      <Header
        title="Income Heads"
        Subtitle="Browse and manage income heads in the FO hospital workspace"
        actions={
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add Income Head
          </button>
        }
      />

      <div className="space-y-6 p-6">
        {currentError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {currentError}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
              Search Income Heads
            </p>
            <div className="mt-3">
              <AdminSearchField
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search income heads"
                className="w-full"
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
              Department Filter
            </p>
            <select
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
              className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="All">All Departments</option>
              {departmentOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
              Total Income Heads
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-slate-100">
              {incomeHeadsQuery.isLoading
                ? "--"
                : incomeHeadsQuery.data?.data.total_income_heads ?? 0}
            </h2>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-gray-200 p-5 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
              Income Head Directory
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Income head list for the current FO hospital workspace.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                  <th className="p-3 font-semibold">Income Head</th>
                  <th className="p-3 font-semibold">Department</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Updated</th>
                  <th className="p-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {incomeHeadsQuery.isLoading ? (
                  <tr>
                    <td
                      className="p-4 text-gray-500 dark:text-slate-400"
                      colSpan={5}
                    >
                      Loading income heads...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      className="p-4 text-gray-500 dark:text-slate-400"
                      colSpan={5}
                    >
                      No income heads found for the current filters.
                    </td>
                  </tr>
                ) : (
                  rows.map((item) => (
                    <tr
                      key={item.income_head_id}
                      className="border-b border-gray-100 dark:border-slate-800"
                    >
                      <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                        {item.name}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {item.department_name}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {item.is_active ? "Active" : "Suspended"}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {formatDateTime(item.updated_at)}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => setEditingIncomeHead(item)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isCreateOpen ? (
        <AdminHospitalIncomeHeadFormModal
          key="create-fo-income-head"
          mode="create"
          departmentOptions={departmentOptions}
          isSubmitting={createMutation.isPending}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={(values) => {
            if (!values.departmentId || !values.name) {
              toast.error("Select a department and enter a name.");
              return;
            }

            createMutation.mutate({
              departmentId: values.departmentId,
              name: values.name,
            });
          }}
        />
      ) : null}

      {editingIncomeHead ? (
        <AdminHospitalIncomeHeadFormModal
          key={editingIncomeHead.income_head_id}
          mode="edit"
          departmentOptions={departmentOptions}
          initialValues={{
            departmentId: editingIncomeHead.department_id,
            name: editingIncomeHead.name,
            status: editingIncomeHead.is_active ? "active" : "suspended",
          }}
          isSubmitting={updateMutation.isPending}
          onClose={() => setEditingIncomeHead(null)}
          onSubmit={(values) => {
            if (!values.departmentId || !values.name) {
              toast.error("Select a department and enter a name.");
              return;
            }

            updateMutation.mutate({
              incomeHeadId: editingIncomeHead.income_head_id,
              departmentId: values.departmentId,
              name: values.name,
              status: values.status,
            });
          }}
        />
      ) : null}
    </div>
  );
}
