"use client";

import AdminHospitalReceiptRequestModal from "@/components/AdminHospitalReceiptRequestModal";
import AdminPageError from "@/components/AdminPageError";
import AdminSearchField from "@/components/AdminSearchField";
import StatusPill from "@/components/StatusPill";
import { ApiError } from "@/libs/api";
import {
  approveAdminHospitalReceipt,
  getAdminHospitalReceipts,
  rejectAdminHospitalReceipt,
} from "@/libs/admin-auth";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import { formatDateTime, formatNaira } from "@/libs/helper";
import type {
  AdminHospitalReceiptItem,
  AdminReceiptFilter,
} from "@/libs/type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

function toReceiptStatus(status: AdminHospitalReceiptItem["status"]) {
  if (status === "pending") return "Pending" as const;
  if (status === "approved") return "Approved" as const;
  return "Rejected" as const;
}

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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
            Total Requests
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-slate-100">
            {summary?.total_receipt_count ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
            Pending
          </p>
          <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-300">
            {summary?.pending_request ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
            Approved
          </p>
          <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-300">
            {summary?.approved ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
            Rejected
          </p>
          <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-300">
            {summary?.rejected ?? 0}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-gray-200 p-5 dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
            Receipt Reprint Requests
          </h2>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Review, approve, or reject hospital receipt reprint requests
          </p>
        </div>

        <div className="flex flex-col gap-4 border-b border-gray-200 p-5 dark:border-slate-700 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["all", "pending", "approved", "rejected"] as AdminReceiptFilter[]).map(
              (tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={
                    activeTab === tab
                      ? "rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                      : "rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  }
                >
                  {tab === "all"
                    ? "All"
                    : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ),
            )}
          </div>

          <AdminSearchField
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search receipts"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-left text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                <th className="p-3 font-semibold">Receipt No</th>
                <th className="p-3 font-semibold">Patient</th>
                <th className="p-3 font-semibold">Amount</th>
                <th className="p-3 font-semibold">Agent</th>
                <th className="p-3 font-semibold">Requested At</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {receiptsQuery.isLoading && !receiptsQuery.data
                ? Array.from({ length: 6 }).map((_, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 dark:border-slate-800"
                    >
                      <td colSpan={7} className="p-3">
                        <div className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800" />
                      </td>
                    </tr>
                  ))
                : filteredRows.length === 0
                  ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-8 text-center text-sm text-gray-500 dark:text-slate-400"
                        >
                          No receipt requests found for the current filter.
                        </td>
                      </tr>
                    )
                  : filteredRows.map((receipt) => (
                      <tr
                        key={receipt.request_id}
                        className="border-b border-gray-100 dark:border-slate-800"
                      >
                        <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                          {receipt.receipt_no}
                        </td>
                        <td className="p-3 text-gray-700 dark:text-slate-300">
                          {receipt.patient_name}
                        </td>
                        <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                          {formatNaira(receipt.amount)}
                        </td>
                        <td className="p-3 text-gray-700 dark:text-slate-300">
                          <p>{receipt.agent_name}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">
                            {receipt.agent_email}
                          </p>
                        </td>
                        <td className="p-3 text-gray-700 dark:text-slate-300">
                          {formatDateTime(receipt.requested_at)}
                        </td>
                        <td className="p-3">
                          <StatusPill status={toReceiptStatus(receipt.status)} />
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setViewingReceipt(receipt)}
                              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              View
                            </button>
                            {receipt.status === "pending" ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    rejectMutation.mutate(receipt.request_id)
                                  }
                                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                                >
                                  Reject
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    approveMutation.mutate(receipt.request_id)
                                  }
                                  className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 dark:border-sky-500/40 dark:text-sky-300 dark:hover:bg-sky-500/10"
                                >
                                  Approve
                                </button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
            </tbody>
          </table>
        </div>
      </div>

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
