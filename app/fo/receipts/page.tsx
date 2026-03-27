"use client";

import Header from "@/components/Header";
import StatusPill from "@/components/StatusPill";
import { ApiError } from "@/libs/api";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import {
  approveFoReceipt,
  getFoReceipts,
  rejectFoReceipt,
} from "@/libs/fo-auth";
import { formatDateTime } from "@/libs/helper";
import {
  FoReceiptFilter,
  FoReceiptItem,
  FoReceiptSummary,
} from "@/libs/type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  FiCheck,
  FiEye,
  FiMoreVertical,
  FiRefreshCcw,
  FiSearch,
  FiX,
} from "react-icons/fi";

const tabs: { key: FoReceiptFilter; label: string }[] = [
  { key: "pending", label: "Pending Requests" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

function Page() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = getAccessToken();
  const [activeTab, setActiveTab] = useState<FoReceiptFilter>("pending");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [viewing, setViewing] = useState<FoReceiptItem | null>(null);

  const receiptsQuery = useQuery({
    queryKey: ["fo-receipts", activeTab],
    queryFn: () => getFoReceipts(activeTab),
    enabled: Boolean(accessToken),
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
    }
  }, [receiptsQuery.error, router]);

  const approveMutation = useMutation({
    mutationFn: (requestId: string) => approveFoReceipt(requestId),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["fo-receipts"] });
      setViewing(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to approve request.",
      );
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) => rejectFoReceipt(requestId),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["fo-receipts"] });
      setViewing(null);
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

  const filteredReceipts = useMemo(() => {
    const text = query.trim().toLowerCase();

    if (!text) {
      return rows;
    }

    return rows.filter((receipt) =>
      [receipt.patient_name, receipt.receipt_id, receipt.reason].some((value) =>
        value.toLowerCase().includes(text),
      ),
    );
  }, [query, rows]);

  const metrics = useMemo(
    () => getMetricCards(summary),
    [summary],
  );

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-slate-950">
      <Header
        title="Receipts Approval"
        Subtitle="View and manage all hospital receipt reprint requests"
      />

      <div className="w-full space-y-6 p-6">
        {receiptsQuery.error instanceof Error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {receiptsQuery.error.message}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
            >
              <p className="text-sm text-gray-600 dark:text-slate-400">
                {metric.label}
              </p>
              <span
                className={`text-3xl font-bold ${
                  metric.tone ?? "text-slate-900 dark:text-slate-100"
                }`}
              >
                {receiptsQuery.isLoading ? "--" : metric.value}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-stretch gap-4 xl:flex-row">
          <div className="flex-1">
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <FiSearch className="text-gray-500 dark:text-slate-400" />
              <input
                className="w-full bg-transparent text-sm outline-none dark:text-slate-100"
                placeholder="Search by patient name, receipt ID, or reason"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["fo-receipts"] })
              }
              className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold shadow-sm hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <FiRefreshCcw className="text-lg" /> Refresh
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                  {[
                    "Requested At",
                    "Receipt ID",
                    "Patient",
                    "Reason",
                    "Status",
                    "Actions",
                  ].map((col) => (
                    <th key={col} className="px-4 py-3 font-semibold">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {receiptsQuery.isLoading ? (
                  <tr>
                    <td
                      className="px-4 py-4 text-gray-500 dark:text-slate-400"
                      colSpan={6}
                    >
                      Loading receipt requests...
                    </td>
                  </tr>
                ) : filteredReceipts.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-4 text-gray-500 dark:text-slate-400"
                      colSpan={6}
                    >
                      No receipt requests found for the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map((receipt) => (
                    <tr
                      key={receipt.receipt_id}
                      className="border-t border-gray-100 hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                    >
                      <td className="whitespace-nowrap px-4 py-4 text-gray-700 dark:text-slate-300">
                        {formatDateTime(receipt.requested_at)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-gray-900 dark:text-slate-100">
                        {receipt.receipt_id}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-gray-900 dark:text-slate-100">
                        {receipt.patient_name}
                      </td>
                      <td className="px-4 py-4 text-gray-700 dark:text-slate-300">
                        {receipt.reason}
                      </td>
                      <td className="px-4 py-4">
                        <StatusPill status={toReceiptStatus(receipt.status)} />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() =>
                              setOpenMenu((prev) =>
                                prev === receipt.receipt_id
                                  ? null
                                  : receipt.receipt_id,
                              )
                            }
                            className="rounded-lg border border-transparent p-2 hover:border-gray-200 hover:bg-gray-100 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                            aria-haspopup="true"
                            aria-expanded={openMenu === receipt.receipt_id}
                          >
                            <FiMoreVertical className="text-gray-700 dark:text-slate-200" />
                          </button>

                          {openMenu === receipt.receipt_id ? (
                            <div className="absolute right-0 z-10 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                              {[
                                {
                                  label: "View Request",
                                  icon: <FiEye className="text-gray-600 dark:text-slate-300" />,
                                  onClick: () => setViewing(receipt),
                                  show: true,
                                },
                                {
                                  label: "Approve",
                                  icon: <FiCheck className="text-gray-600 dark:text-slate-300" />,
                                  onClick: () =>
                                    approveMutation.mutate(receipt.receipt_id),
                                  show: receipt.status === "pending",
                                },
                                {
                                  label: "Reject",
                                  icon: <FiX className="text-gray-600 dark:text-slate-300" />,
                                  onClick: () =>
                                    rejectMutation.mutate(receipt.receipt_id),
                                  show: receipt.status === "pending",
                                },
                              ]
                                .filter((item) => item.show)
                                .map((item) => (
                                  <button
                                    key={item.label}
                                    onClick={() => {
                                      item.onClick();
                                      setOpenMenu(null);
                                    }}
                                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                    aria-label={item.label}
                                  >
                                    {item.icon}
                                    <span>{item.label}</span>
                                  </button>
                                ))}
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {viewing ? (
          <ReceiptRequestModal
            receipt={viewing}
            isMutating={
              approveMutation.isPending || rejectMutation.isPending
            }
            onApprove={() => approveMutation.mutate(viewing.receipt_id)}
            onReject={() => rejectMutation.mutate(viewing.receipt_id)}
            onClose={() => setViewing(null)}
          />
        ) : null}
      </div>
    </div>
  );
}

function getMetricCards(summary?: FoReceiptSummary) {
  return [
    {
      label: "Total Receipt Requests",
      value: String(summary?.total_receipt_count ?? 0),
    },
    {
      label: "Pending Requests",
      value: String(summary?.pending_request ?? 0),
      tone: "text-amber-600 dark:text-amber-300",
    },
    {
      label: "Approved",
      value: String(summary?.approved ?? 0),
      tone: "text-green-600 dark:text-green-300",
    },
    {
      label: "Rejected",
      value: String(summary?.rejected ?? 0),
      tone: "text-red-600 dark:text-red-300",
    },
  ];
}

function toReceiptStatus(status: FoReceiptItem["status"]) {
  if (status === "pending") return "Pending" as const;
  if (status === "approved") return "Approved" as const;
  return "Rejected" as const;
}

function ReceiptRequestModal({
  receipt,
  isMutating,
  onApprove,
  onReject,
  onClose,
}: {
  receipt: FoReceiptItem;
  isMutating: boolean;
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5 dark:border-slate-700">
          <div>
            <h3 className="text-lg font-bold dark:text-slate-100">
              Receipt Request
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Receipt ID: {receipt.receipt_id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-lg text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100"
            aria-label="Close"
            type="button"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 p-4 dark:border-slate-700">
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Requested At
              </p>
              <p className="mt-1 text-base font-semibold text-gray-900 dark:text-slate-100">
                {formatDateTime(receipt.requested_at)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4 dark:border-slate-700">
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Patient
              </p>
              <p className="mt-1 text-base font-semibold text-gray-900 dark:text-slate-100">
                {receipt.patient_name}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 p-4 dark:border-slate-700">
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Status
              </p>
              <div className="mt-2">
                <StatusPill status={toReceiptStatus(receipt.status)} />
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 p-4 dark:border-slate-700">
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Reason
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-slate-100">
                {receipt.reason}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 p-5 dark:border-slate-700">
          {receipt.status === "pending" ? (
            <>
              <button
                onClick={onReject}
                disabled={isMutating}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                type="button"
              >
                Reject
              </button>
              <button
                onClick={onApprove}
                disabled={isMutating}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
              >
                Approve
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              type="button"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Page;
