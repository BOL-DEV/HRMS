"use client";

import FoReceiptRequestModal from "@/components/FoReceiptRequestModal";
import FoReceiptsFilterBar from "@/components/FoReceiptsFilterBar";
import FoReceiptsSummaryCards from "@/components/FoReceiptsSummaryCards";
import FoReceiptsTable from "@/components/FoReceiptsTable";
import Header from "@/components/Header";
import { ApiError } from "@/libs/api";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import {
  approveFoReceipt,
  getFoReceipts,
  rejectFoReceipt,
} from "@/libs/fo-auth";
import { FoReceiptFilter, FoReceiptItem } from "@/libs/type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

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

        <FoReceiptsSummaryCards
          summary={summary}
          isLoading={receiptsQuery.isLoading}
        />

        <FoReceiptsFilterBar
          activeTab={activeTab}
          query={query}
          onTabChange={setActiveTab}
          onQueryChange={setQuery}
          onRefresh={() =>
            queryClient.invalidateQueries({ queryKey: ["fo-receipts"] })
          }
        />

        <FoReceiptsTable
          rows={filteredReceipts}
          isLoading={receiptsQuery.isLoading}
          openMenu={openMenu}
          onOpenMenu={setOpenMenu}
          onView={setViewing}
          onApprove={(requestId) => approveMutation.mutate(requestId)}
          onReject={(requestId) => rejectMutation.mutate(requestId)}
        />

        {viewing ? (
          <FoReceiptRequestModal
            receipt={viewing}
            isMutating={approveMutation.isPending || rejectMutation.isPending}
            onApprove={() => approveMutation.mutate(viewing.receipt_id)}
            onReject={() => rejectMutation.mutate(viewing.receipt_id)}
            onClose={() => setViewing(null)}
          />
        ) : null}
      </div>
    </div>
  );
}

export default Page;
