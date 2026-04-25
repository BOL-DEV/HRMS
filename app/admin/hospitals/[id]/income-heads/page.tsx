"use client";

import AdminHospitalIncomeHeadFormModal from "@/components/AdminHospitalIncomeHeadFormModal";
import AdminHospitalIncomeHeadsSection from "@/components/AdminHospitalIncomeHeadsSection";
import AdminPageError from "@/components/AdminPageError";
import StatCard from "@/components/StatCard";
import { ApiError } from "@/libs/api";
import {
  createAdminHospitalIncomeHead,
  getAdminHospitalDepartments,
  getAdminHospitalIncomeHeads,
  updateAdminHospitalIncomeHead,
} from "@/libs/admin-auth";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import type { AdminHospitalIncomeHeadItem } from "@/libs/type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { FiLayers } from "react-icons/fi";

export default function HospitalIncomeHeadsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = getAccessToken();
  const hospitalId = params?.id ?? "";
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("All");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingIncomeHead, setEditingIncomeHead] =
    useState<AdminHospitalIncomeHeadItem | null>(null);

  const departmentsQuery = useQuery({
    queryKey: ["admin-hospital-income-heads-departments", hospitalId],
    queryFn: () => getAdminHospitalDepartments(hospitalId),
    enabled: Boolean(accessToken && hospitalId),
  });

  const incomeHeadsQuery = useQuery({
    queryKey: ["admin-hospital-income-heads", hospitalId, departmentId, search],
    queryFn: () =>
      getAdminHospitalIncomeHeads(hospitalId, {
        departmentId: departmentId === "All" ? undefined : departmentId,
        search: search.trim() || undefined,
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
      return;
    }

    if (error.status === 404) {
      router.replace("/admin/hospitals");
    }
  }, [departmentsQuery.error, incomeHeadsQuery.error, router]);

  const createMutation = useMutation({
    mutationFn: (payload: { departmentId: string; name: string }) =>
      createAdminHospitalIncomeHead(hospitalId, {
        department_id: payload.departmentId,
        name: payload.name,
      }),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({
        queryKey: ["admin-hospital-income-heads", hospitalId],
      });
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
      updateAdminHospitalIncomeHead(hospitalId, payload.incomeHeadId, {
        department_id: payload.departmentId,
        name: payload.name,
        status: payload.status,
      }),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({
        queryKey: ["admin-hospital-income-heads", hospitalId],
      });
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
    <div className="space-y-6">
      {currentError ? <AdminPageError message={currentError} /> : null}

      <div className="max-w-sm">
        <StatCard
          title="Total Income Heads"
          value={String(incomeHeadsQuery.data?.data.total_income_heads ?? 0)}
          icon={<FiLayers className="text-xl" />}
        />
      </div>

      <AdminHospitalIncomeHeadsSection
        rows={rows}
        search={search}
        departmentId={departmentId}
        departmentOptions={departmentOptions}
        isLoading={incomeHeadsQuery.isLoading && !incomeHeadsQuery.data}
        onSearchChange={setSearch}
        onDepartmentChange={setDepartmentId}
        onOpenCreateModal={() => setIsCreateOpen(true)}
        onEdit={setEditingIncomeHead}
      />

      {isCreateOpen ? (
        <AdminHospitalIncomeHeadFormModal
          key="create-income-head"
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
