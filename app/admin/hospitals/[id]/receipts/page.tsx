"use client";

import AdminHospitalReceiptRequestModal from "@/components/AdminHospitalReceiptRequestModal";
import AdminHospitalReceiptsSection from "@/components/AdminHospitalReceiptsSection";
import AdminHospitalReceiptsSummaryCards from "@/components/AdminHospitalReceiptsSummaryCards";
import AdminPageError from "@/components/AdminPageError";
import { ApiError } from "@/libs/api";
import {
  approveAdminHospitalReceipt,
  getAdminHospitalReceipts,
  rejectAdminHospitalReceipt,
} from "@/libs/admin-auth";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import type {
  AdminHospitalReceiptItem,
  AdminReceiptFilter,
} from "@/libs/type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

export default function HospitalReceiptsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = getAccessToken();
  const hospitalId = params?.id ?? "";
  const [activeTab, setActiveTab] = useState<AdminReceiptFilter>("all");
  const [query, setQuery] = useState("");
  const [viewingReceipt, setViewingReceipt] =
    useState<AdminHospitalReceiptItem | null>(null);

  const receiptsQuery = useQuery({
    queryKey: ["admin-hospital-receipts", hospitalId, activeTab],
    queryFn: () => getAdminHospitalReceipts(hospitalId, activeTab),
    enabled: Boolean(accessToken && hospitalId),
  });

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    if (!(receiptsQuery.error instanceof ApiError)) {
      return;
    }

    if (receiptsQuery.error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
      return;
    }

    if (receiptsQuery.error.status === 404) {
      router.replace("/admin/hospitals");
    }
  }, [receiptsQuery.error, router]);

  const approveMutation = useMutation({
    mutationFn: (requestId: string) =>
      approveAdminHospitalReceipt(hospitalId, { request_id: requestId }),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({
        queryKey: ["admin-hospital-receipts", hospitalId],
      });
      setViewingReceipt(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to approve request.",
      );
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) =>
      rejectAdminHospitalReceipt(hospitalId, { request_id: requestId }),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({
        queryKey: ["admin-hospital-receipts", hospitalId],
      });
      setViewingReceipt(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to reject request.",
      );
    },
  });

  const rows = useMemo(
    () => receiptsQuery.data?.data.receipts ?? [],
    [receiptsQuery.data?.data.receipts],
  );
  const summary = receiptsQuery.data?.data.summary;

  const filteredRows = useMemo(() => {
    const text = query.trim().toLowerCase();

    if (!text) {
      return rows;
    }

    return rows.filter((receipt) =>
      [
        receipt.receipt_no,
        receipt.patient_name,
        receipt.agent_name,
        receipt.agent_email,
        receipt.reason,
      ].some((value) => value.toLowerCase().includes(text)),
    );
  }, [query, rows]);

  return (
    <div className="space-y-6">
      {receiptsQuery.error instanceof Error ? (
        <AdminPageError message={receiptsQuery.error.message} />
      ) : null}

      <AdminHospitalReceiptsSummaryCards
        total={summary?.total_receipt_count ?? 0}
        pending={summary?.pending_request ?? 0}
        approved={summary?.approved ?? 0}
        rejected={summary?.rejected ?? 0}
      />

      <AdminHospitalReceiptsSection
        rows={filteredRows}
        activeTab={activeTab}
        query={query}
        isLoading={receiptsQuery.isLoading && !receiptsQuery.data}
        onTabChange={setActiveTab}
        onQueryChange={setQuery}
        onView={setViewingReceipt}
        onApprove={(requestId) => approveMutation.mutate(requestId)}
        onReject={(requestId) => rejectMutation.mutate(requestId)}
      />

      {viewingReceipt ? (
        <AdminHospitalReceiptRequestModal
          receipt={viewingReceipt}
          isMutating={approveMutation.isPending || rejectMutation.isPending}
          onApprove={() => approveMutation.mutate(viewingReceipt.request_id)}
          onReject={() => rejectMutation.mutate(viewingReceipt.request_id)}
          onClose={() => setViewingReceipt(null)}
        />
      ) : null}
    </div>
  );
}
