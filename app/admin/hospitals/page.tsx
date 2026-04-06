"use client";

import AdminHospitalModal from "@/components/AdminHospitalModal";
import AdminHospitalsFilters from "@/components/AdminHospitalsFilters";
import AdminHospitalsSummaryCards from "@/components/AdminHospitalsSummaryCards";
import AdminHospitalsTable from "@/components/AdminHospitalsTable";
import Header from "@/components/Header";
import { ApiError } from "@/libs/api";
import {
  createAdminHospital,
  getAdminHospitals,
  updateAdminHospital,
} from "@/libs/admin-auth";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import type {
  AdminHospitalListItem,
  AdminHospitalStatus,
  CreateAdminHospitalPayload,
  UpdateAdminHospitalPayload,
} from "@/libs/type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

function Page() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = getAccessToken();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AdminHospitalStatus | "all">("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingHospital, setEditingHospital] =
    useState<AdminHospitalListItem | null>(null);

  const hospitalsQuery = useQuery({
    queryKey: ["admin-hospitals", search, status, sort],
    queryFn: () => getAdminHospitals({ search, status, sort }),
    enabled: Boolean(accessToken),
  });

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    if (!(hospitalsQuery.error instanceof ApiError)) {
      return;
    }

    if (hospitalsQuery.error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
    }
  }, [hospitalsQuery.error, router]);

  const createHospitalMutation = useMutation({
    mutationFn: (payload: CreateAdminHospitalPayload) =>
      createAdminHospital(payload),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["admin-hospitals"] });
      setIsCreateModalOpen(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to create hospital.",
      );
    },
  });

  const updateHospitalMutation = useMutation({
    mutationFn: ({
      hospitalId,
      payload,
    }: {
      hospitalId: string;
      payload: UpdateAdminHospitalPayload;
    }) => updateAdminHospital(hospitalId, payload),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["admin-hospitals"] });
      setEditingHospital(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to update hospital.",
      );
    },
  });

  const hospitalsData = hospitalsQuery.data?.data;

  const summary = useMemo(
    () => ({
      totalHospitals: hospitalsData?.summary.total_hospitals ?? 0,
      suspendedHospitals: hospitalsData?.summary.suspended_hospitals ?? 0,
      totalRevenue: hospitalsData?.summary.total_platform_revenue ?? 0,
    }),
    [hospitalsData],
  );

  const rows = hospitalsData?.hospitals ?? [];

  const handleCreate = (payload: CreateAdminHospitalPayload) => {
    createHospitalMutation.mutate(payload);
  };

  const handleUpdate = (payload: UpdateAdminHospitalPayload) => {
    if (!editingHospital) {
      return;
    }

    if (Object.keys(payload).length === 0) {
      toast("No changes to save.");
      setEditingHospital(null);
      return;
    }

    updateHospitalMutation.mutate({
      hospitalId: editingHospital.hospital_id,
      payload,
    });
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-slate-950">
      <Header
        title="Hospitals"
        Subtitle="Manage registered hospitals across the platform"
        actions={
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add Hospital
          </button>
        }
      />

      <div className="space-y-6 p-6">
        {hospitalsQuery.error instanceof Error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {hospitalsQuery.error.message}
          </div>
        ) : null}

        <AdminHospitalsSummaryCards
          summary={summary}
          isLoading={hospitalsQuery.isLoading && !hospitalsData}
        />

        <AdminHospitalsFilters
          search={search}
          status={status}
          sort={sort}
          onSearchChange={setSearch}
          onStatusChange={setStatus}
          onSortChange={setSort}
        />

        <AdminHospitalsTable
          rows={rows}
          isLoading={hospitalsQuery.isLoading && !hospitalsData}
          onEdit={setEditingHospital}
        />
      </div>

      {isCreateModalOpen ? (
        <AdminHospitalModal
          mode="create"
          isSubmitting={createHospitalMutation.isPending}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreate}
        />
      ) : null}

      {editingHospital ? (
        <AdminHospitalModal
          mode="edit"
          hospital={editingHospital}
          isSubmitting={updateHospitalMutation.isPending}
          onClose={() => setEditingHospital(null)}
          onSubmit={handleUpdate}
        />
      ) : null}
    </div>
  );
}

export default Page;
