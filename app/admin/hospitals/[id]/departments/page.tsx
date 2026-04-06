"use client";

import AdminHospitalDepartmentFormModal from "@/components/AdminHospitalDepartmentFormModal";
import AdminPageError from "@/components/AdminPageError";
import AdminSearchField from "@/components/AdminSearchField";
import { ApiError } from "@/libs/api";
import {
  createAdminHospitalDepartment,
  deleteAdminHospitalDepartment,
  getAdminHospitalDepartments,
  updateAdminHospitalDepartment,
} from "@/libs/admin-auth";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import type { AdminHospitalDepartmentItem } from "@/libs/type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { FiPlus, FiTrash2 } from "react-icons/fi";

type DepartmentRow = {
  id: string | null;
  name: string;
};

function normalizeDepartment(item: AdminHospitalDepartmentItem): DepartmentRow {
  if (typeof item === "string") {
    return {
      id: null,
      name: item,
    };
  }

  return {
    id: item.id ?? item.department_id ?? null,
    name: item.name,
  };
}

export default function HospitalDepartmentsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = getAccessToken();
  const hospitalId = params?.id ?? "";
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] =
    useState<DepartmentRow | null>(null);

  const departmentsQuery = useQuery({
    queryKey: ["admin-hospital-departments", hospitalId, search],
    queryFn: () => getAdminHospitalDepartments(hospitalId, { search }),
    enabled: Boolean(accessToken && hospitalId),
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
      return;
    }

    if (departmentsQuery.error.status === 404) {
      router.replace("/admin/hospitals");
    }
  }, [departmentsQuery.error, router]);

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      createAdminHospitalDepartment(hospitalId, { name }),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({
        queryKey: ["admin-hospital-departments", hospitalId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-hospital-overview", hospitalId],
      });
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
    }) => updateAdminHospitalDepartment(hospitalId, departmentId, { name }),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({
        queryKey: ["admin-hospital-departments", hospitalId],
      });
      setEditingDepartment(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to update department.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (departmentId: string) =>
      deleteAdminHospitalDepartment(hospitalId, departmentId),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({
        queryKey: ["admin-hospital-departments", hospitalId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-hospital-overview", hospitalId],
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete department.",
      );
    },
  });

  const departments = useMemo(
    () =>
      (departmentsQuery.data?.data.departments ?? [])
        .map(normalizeDepartment)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [departmentsQuery.data?.data.departments],
  );


  return (
    <div className="space-y-6">
      {departmentsQuery.error instanceof Error ? (
        <AdminPageError message={departmentsQuery.error.message} />
      ) : null}

      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
          Total Departments
        </p>
        <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-slate-100">
          {departmentsQuery.data?.data.total_departments ?? 0}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-gray-200 p-5 dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
            Departments
          </h2>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Create, rename, and remove departments for this hospital
          </p>
        </div>

        <div className="flex flex-col gap-4 border-b border-gray-200 p-5 dark:border-slate-700 lg:flex-row lg:items-center lg:justify-between">
          <AdminSearchField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search departments"
          />

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <FiPlus />
            Add Department
          </button>
        </div>

        <div className="p-5">
          {departmentsQuery.isLoading && !departmentsQuery.data ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : departments.length ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {departments.map((department) => (
                <div
                  key={department.id ?? department.name}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-gray-900 dark:text-slate-100">
                      {department.name}
                    </p>

                    {department.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingDepartment(department)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate(department.id!)}
                          disabled={deleteMutation.isPending}
                          className="rounded-lg border border-red-200 px-2.5 py-1.5 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                          aria-label={`Delete ${department.name}`}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 px-6 py-10 text-center text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
              No departments found for this hospital.
            </div>
          )}
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
            if (!editingDepartment.id) {
              toast.error("Department ID is missing.");
              return;
            }

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
              departmentId: editingDepartment.id,
              name,
            });
          }}
        />
      ) : null}
    </div>
  );
}
