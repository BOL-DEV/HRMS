"use client";

import AdminHospitalPharmacistsListSection from "@/components/admin/AdminHospitalPharmacistsListSection";
import AdminHospitalPharmacistFormModal from "@/components/admin/AdminHospitalPharmacistFormModal";
import AdminPageError from "@/components/admin/AdminPageError";
import StatCard from "@/components/shared/StatCard";
import { ApiError } from "@/libs/api";
import {
  createAdminHospitalPharmacist,
  getAdminHospitalPharmacists,
  updateAdminHospitalPharmacist,
} from "@/libs/admin-auth";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import type {
  AdminHospitalPharmacistListItem,
  CreateAdminHospitalPharmacistPayload,
  UpdateAdminHospitalPharmacistPayload,
} from "@/libs/type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FiUsers } from "react-icons/fi";

export default function HospitalPharmacistsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = getAccessToken();
  const hospitalId = params?.id ?? "";
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPharmacist, setEditingPharmacist] = useState<AdminHospitalPharmacistListItem | null>(
    null,
  );

  const pharmacistsQuery = useQuery({
    queryKey: ["admin-hospital-pharmacists", hospitalId, search],
    queryFn: () => getAdminHospitalPharmacists(hospitalId, { search }),
    enabled: Boolean(accessToken && hospitalId),
  });

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    if (!(pharmacistsQuery.error instanceof ApiError)) {
      return;
    }

    if (pharmacistsQuery.error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
      return;
    }

    if (pharmacistsQuery.error.status === 404) {
      router.replace("/admin/hospitals");
    }
  }, [pharmacistsQuery.error, router]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateAdminHospitalPharmacistPayload) =>
      createAdminHospitalPharmacist(hospitalId, payload),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({
        queryKey: ["admin-hospital-pharmacists", hospitalId],
      });
      setIsCreateOpen(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to create pharmacist.",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      pharmacistId,
      payload,
    }: {
      pharmacistId: string;
      payload: UpdateAdminHospitalPharmacistPayload;
    }) => updateAdminHospitalPharmacist(hospitalId, pharmacistId, payload),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({
        queryKey: ["admin-hospital-pharmacists", hospitalId],
      });
      setEditingPharmacist(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to update pharmacist.",
      );
    },
  });

  const pharmacists = pharmacistsQuery.data?.data.pharmacists ?? [];
  const totalPharmacists = pharmacistsQuery.data?.data.total_pharmacists ?? 0;

  const handleUpdate = (payload: UpdateAdminHospitalPharmacistPayload) => {
    if (!editingPharmacist) {
      return;
    }

    if (Object.keys(payload).length === 0) {
      toast("No changes to save.");
      setEditingPharmacist(null);
      return;
    }

    updateMutation.mutate({
      pharmacistId: editingPharmacist.pharmacist_id,
      payload,
    });
  };

  return (
    <div className="space-y-6">
      {pharmacistsQuery.error instanceof Error ? (
        <AdminPageError message={pharmacistsQuery.error.message} />
      ) : null}

      <div className="max-w-sm">
        <StatCard
          title="Total Pharmacists"
          value={String(totalPharmacists)}
          icon={<FiUsers className="text-xl" />}
        />
      </div>

      <AdminHospitalPharmacistsListSection
        rows={pharmacists}
        search={search}
        isLoading={pharmacistsQuery.isLoading && !pharmacistsQuery.data}
        onSearchChange={setSearch}
        onOpenCreateModal={() => setIsCreateOpen(true)}
        onEdit={setEditingPharmacist}
        onToggleStatus={(pharmacist) =>
          updateMutation.mutate({
            pharmacistId: pharmacist.pharmacist_id,
            payload: {
              status: pharmacist.status === "suspended" ? "active" : "suspended",
            },
          })
        }
      />

      {isCreateOpen ? (
        <AdminHospitalPharmacistFormModal
          isSubmitting={createMutation.isPending}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={(payload) =>
            createMutation.mutate(payload as CreateAdminHospitalPharmacistPayload)
          }
        />
      ) : null}

      {editingPharmacist ? (
        <AdminHospitalPharmacistFormModal
          pharmacist={editingPharmacist}
          isSubmitting={updateMutation.isPending}
          onClose={() => setEditingPharmacist(null)}
          onSubmit={handleUpdate}
        />
      ) : null}
    </div>
  );
}
