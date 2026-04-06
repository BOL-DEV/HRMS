"use client";

import AdminHospitalFoListSection from "@/components/AdminHospitalFoListSection";
import AdminHospitalFoFormModal from "@/components/AdminHospitalFoFormModal";
import AdminPageError from "@/components/AdminPageError";
import StatCard from "@/components/StatCard";
import { ApiError } from "@/libs/api";
import {
  createAdminHospitalFo,
  getAdminHospitalFos,
  updateAdminHospitalFo,
} from "@/libs/admin-auth";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import type {
  AdminHospitalFoListItem,
  CreateAdminHospitalFoPayload,
  UpdateAdminHospitalFoPayload,
} from "@/libs/type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FiUsers } from "react-icons/fi";

export default function HospitalFosPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = getAccessToken();
  const hospitalId = params?.id ?? "";
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingFo, setEditingFo] = useState<AdminHospitalFoListItem | null>(
    null,
  );

  const fosQuery = useQuery({
    queryKey: ["admin-hospital-fos", hospitalId, search],
    queryFn: () => getAdminHospitalFos(hospitalId, { search }),
    enabled: Boolean(accessToken && hospitalId),
  });

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    if (!(fosQuery.error instanceof ApiError)) {
      return;
    }

    if (fosQuery.error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
      return;
    }

    if (fosQuery.error.status === 404) {
      router.replace("/admin/hospitals");
    }
  }, [fosQuery.error, router]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateAdminHospitalFoPayload) =>
      createAdminHospitalFo(hospitalId, payload),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({
        queryKey: ["admin-hospital-fos", hospitalId],
      });
      setIsCreateOpen(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to create FO.",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      foId,
      payload,
    }: {
      foId: string;
      payload: UpdateAdminHospitalFoPayload;
    }) => updateAdminHospitalFo(hospitalId, foId, payload),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({
        queryKey: ["admin-hospital-fos", hospitalId],
      });
      setEditingFo(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to update FO.",
      );
    },
  });

  const fos = fosQuery.data?.data.fos ?? [];
  const totalFos = fosQuery.data?.data.total_fos ?? 0;

  const handleUpdate = (payload: UpdateAdminHospitalFoPayload) => {
    if (!editingFo) {
      return;
    }

    if (Object.keys(payload).length === 0) {
      toast("No changes to save.");
      setEditingFo(null);
      return;
    }

    updateMutation.mutate({
      foId: editingFo.fo_id,
      payload,
    });
  };

  return (
    <div className="space-y-6">
      {fosQuery.error instanceof Error ? (
        <AdminPageError message={fosQuery.error.message} />
      ) : null}

      <div className="max-w-sm">
        <StatCard
          title="Total FOs"
          value={String(totalFos)}
          icon={<FiUsers className="text-xl" />}
        />
      </div>

      <AdminHospitalFoListSection
        rows={fos}
        search={search}
        isLoading={fosQuery.isLoading && !fosQuery.data}
        onSearchChange={setSearch}
        onOpenCreateModal={() => setIsCreateOpen(true)}
        onEdit={setEditingFo}
        onToggleStatus={(fo) =>
          updateMutation.mutate({
            foId: fo.fo_id,
            payload: {
              status: fo.status === "suspended" ? "active" : "suspended",
            },
          })}
      />

      {isCreateOpen ? (
        <AdminHospitalFoFormModal
          isSubmitting={createMutation.isPending}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={(payload) =>
            createMutation.mutate(payload as CreateAdminHospitalFoPayload)
          }
        />
      ) : null}

      {editingFo ? (
        <AdminHospitalFoFormModal
          fo={editingFo}
          isSubmitting={updateMutation.isPending}
          onClose={() => setEditingFo(null)}
          onSubmit={handleUpdate}
        />
      ) : null}
    </div>
  );
}
