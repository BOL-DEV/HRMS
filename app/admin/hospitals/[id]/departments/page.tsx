"use client";

import AdminHospitalDepartmentFormModal from "@/components/AdminHospitalDepartmentFormModal";
import AdminHospitalDepartmentsSection from "@/components/AdminHospitalDepartmentsSection";
import AdminHospitalDepartmentsSummaryCard from "@/components/AdminHospitalDepartmentsSummaryCard";
import AdminPageError from "@/components/AdminPageError";
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
  const hasDepartmentIds = departments.some((department) => Boolean(department.id));

  return (
    <div className="space-y-6">
      {departmentsQuery.error instanceof Error ? (
        <AdminPageError message={departmentsQuery.error.message} />
      ) : null}

      <AdminHospitalDepartmentsSummaryCard
        totalDepartments={departmentsQuery.data?.data.total_departments ?? 0}
      />

      <AdminHospitalDepartmentsSection
        rows={departments}
        search={search}
        isLoading={departmentsQuery.isLoading && !departmentsQuery.data}
        isDeleting={deleteMutation.isPending}
        onSearchChange={setSearch}
        onOpenCreateModal={() => setIsCreateOpen(true)}
        onRename={setEditingDepartment}
        onDelete={(departmentId) => deleteMutation.mutate(departmentId)}
        footer={
          !hasDepartmentIds && departments.length ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              The backend is still returning some department entries without IDs, so
              rename and delete actions are only shown for rows that include a real
              department ID.
            </div>
          ) : null
        }
      />

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
