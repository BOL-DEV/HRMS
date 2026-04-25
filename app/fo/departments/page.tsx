"use client";

import AdminHospitalDepartmentFormModal from "@/components/AdminHospitalDepartmentFormModal";
import AdminSearchField from "@/components/AdminSearchField";
import Header from "@/components/Header";
import { ApiError } from "@/libs/api";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import {
  createFoDepartment,
  getFoDepartments,
  updateFoDepartment,
} from "@/libs/fo-auth";
import { formatDateTime } from "@/libs/helper";
import type { FoDepartmentItem } from "@/libs/type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

export default function FoDepartmentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = getAccessToken();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] =
    useState<FoDepartmentItem | null>(null);

  const departmentsQuery = useQuery({
    queryKey: ["fo-departments-page", search],
    queryFn: () => getFoDepartments(search.trim() || undefined),
    enabled: Boolean(accessToken),
  });

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    if (!(departmentsQuery.error instanceof ApiError)) {
      return;
    }

    if (departmentsQuery.error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
    }
  }, [departmentsQuery.error, router]);

  const createMutation = useMutation({
    mutationFn: (name: string) => createFoDepartment({ name }),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["fo-departments-page"] });
      setIsCreateOpen(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to create department.",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      departmentId,
      name,
    }: {
      departmentId: string;
      name: string;
    }) => updateFoDepartment(departmentId, { name }),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["fo-departments-page"] });
      setEditingDepartment(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to update department.",
      );
    },
  });

  const rows = useMemo(
    () => departmentsQuery.data?.data.departments ?? [],
    [departmentsQuery.data?.data.departments],
  );

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-slate-950">
      <Header
        title="Departments"
        Subtitle="Browse and manage hospital departments in the FO workspace"
        actions={
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add Department
          </button>
        }
      />

      <div className="space-y-6 p-6">
        {departmentsQuery.error instanceof Error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {departmentsQuery.error.message}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
              Total Departments
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-slate-100">
              {departmentsQuery.isLoading
                ? "--"
                : departmentsQuery.data?.data.total_departments ?? 0}
            </h2>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
              Search Departments
            </p>
            <div className="mt-3">
              <AdminSearchField
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search departments"
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-gray-200 p-5 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
              Department Directory
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Department list for the current FO hospital workspace.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                  <th className="p-3 font-semibold">Department</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Created</th>
                  <th className="p-3 font-semibold">Updated</th>
                  <th className="p-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {departmentsQuery.isLoading ? (
                  <tr>
                    <td
                      className="p-4 text-gray-500 dark:text-slate-400"
                      colSpan={5}
                    >
                      Loading departments...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      className="p-4 text-gray-500 dark:text-slate-400"
                      colSpan={5}
                    >
                      No departments found for the current search.
                    </td>
                  </tr>
                ) : (
                  rows.map((department) => (
                    <tr
                      key={department.department_id}
                      className="border-b border-gray-100 dark:border-slate-800"
                    >
                      <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                        {department.name}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {department.is_active ? "Active" : "Inactive"}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {formatDateTime(department.created_at)}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {formatDateTime(department.updated_at)}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => setEditingDepartment(department)}
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
        <AdminHospitalDepartmentFormModal
          mode="create"
          isSubmitting={createMutation.isPending}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={(name) => {
            if (!name) {
              toast.error("Enter a department name.");
              return;
            }

            createMutation.mutate(name);
          }}
        />
      ) : null}

      {editingDepartment ? (
        <AdminHospitalDepartmentFormModal
          mode="edit"
          initialName={editingDepartment.name}
          isSubmitting={updateMutation.isPending}
          onClose={() => setEditingDepartment(null)}
          onSubmit={(name) => {
            if (!name) {
              toast.error("Enter a department name.");
              return;
            }

            if (name === editingDepartment.name) {
              toast("No changes to save.");
              setEditingDepartment(null);
              return;
            }

            updateMutation.mutate({
              departmentId: editingDepartment.department_id,
              name,
            });
          }}
        />
      ) : null}
    </div>
  );
}
