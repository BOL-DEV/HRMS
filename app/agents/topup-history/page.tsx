"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FiCircle, FiCreditCard, FiHash } from "react-icons/fi";

import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import AdminPaginationFooter from "@/components/AdminPaginationFooter";

import { ApiError } from "@/libs/api";
import { clearAgentTokens, getAgentAccessToken } from "@/libs/auth";
import { getAgentTopupHistory } from "@/libs/agent-auth";
import { formatDateTime, formatNaira } from "@/libs/helper";

const PAGE_LIMIT = 15;

export default function AgentTopupHistoryPage() {
  const router = useRouter();
  const accessToken = getAgentAccessToken();
  const [page, setPage] = useState(1);

  const topupsQuery = useQuery({
    queryKey: ["agent-topup-history", page],
    queryFn: () =>
      getAgentTopupHistory({
        page,
        limit: PAGE_LIMIT,
      }),
    enabled: Boolean(accessToken),
  });

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    if (!(topupsQuery.error instanceof ApiError)) {
      return;
    }

    if (topupsQuery.error.status === 401) {
      clearAgentTokens();
      router.replace("/login");
    }
  }, [router, topupsQuery.error]);

  const data = topupsQuery.data?.data;
  const pagination = data?.pagination;

  const stats = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      {
        title: "Current Balance",
        value: formatNaira(data.current_balance),
        icon: <FiCircle className="text-xl" />,
      },
      {
        title: "Last Wallet Top-Up",
        value: formatNaira(data.last_wallet_topup),
        icon: <FiCreditCard className="text-xl" />,
      },
      {
        title: "Total Number of Top-Ups",
        value: String(pagination?.total ?? data.topups.length),
        icon: <FiHash className="text-xl" />,
      },
    ];
  }, [data, pagination?.total]);

  const rows = useMemo(() => data?.topups ?? [], [data?.topups]);

  return (
    <div className="min-h-screen w-full bg-canvas">
      <Header
        title="Top-Up History"
        Subtitle="View your wallet top-up activity"
      />

      <div className="space-y-6 p-6">
        {topupsQuery.error instanceof Error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {topupsQuery.error.message}
          </div>
        ) : null}

        {stats.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stats.map((item) => (
              <StatCard
                key={item.title}
                title={item.title}
                value={item.value}
                icon={item.icon}
              />
            ))}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-line-subtle bg-panel">
          <div className="flex flex-col gap-3 border-b border-line-subtle p-5 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                Top-Up Records
              </h2>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Review when and how your wallet was funded.
              </p>
            </div>

            {data?.agent ? (
              <div className="min-w-0 text-sm text-gray-600 dark:text-slate-400">
                <p className="truncate font-semibold text-gray-900 dark:text-slate-100">
                  {data.agent.agent_name}
                </p>
                <p className="truncate">{data.agent.email}</p>
              </div>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-panel-muted text-left text-gray-600 dark:text-slate-300">
                  <th className="p-3 font-semibold">Date</th>
                  <th className="p-3 font-semibold">Top-Up Amount</th>
                  <th className="p-3 font-semibold">Initial Top-Up</th>
                  <th className="p-3 font-semibold">Balance After</th>
                  <th className="p-3 font-semibold">Topped Up By</th>
                  <th className="p-3 font-semibold">Role</th>
                </tr>
              </thead>
              <tbody>
                {topupsQuery.isLoading ? (
                  Array.from({ length: 8 }).map((_, index) => (
                    <tr key={index} className="border-b border-line-subtle">
                      <td colSpan={6} className="p-3">
                        <div className="h-10 animate-pulse rounded-lg bg-panel-muted" />
                      </td>
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-sm text-gray-500 dark:text-slate-400"
                    >
                      No top-up history yet
                    </td>
                  </tr>
                ) : (
                  rows.map((topup) => (
                    <tr key={topup.id} className="border-b border-line-subtle">
                      <td className="whitespace-nowrap p-3 text-gray-700 dark:text-slate-300">
                        {formatDateTime(topup.created_at)}
                      </td>
                      <td className="p-3 font-semibold text-brand-700 dark:text-brand-300">
                        {formatNaira(topup.top_up_amount)}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {formatNaira(topup.before_top_up_amount)}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {formatNaira(topup.balance_after_topup)}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        <p className="font-semibold text-gray-900 dark:text-slate-100">
                          {topup.topped_up_by_name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-slate-400">
                          {topup.topped_up_by_email}
                        </p>
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {topup.topped_up_by_role}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.total_pages > 1 ? (
            <AdminPaginationFooter
              currentPage={pagination.page}
              totalPages={pagination.total_pages}
              hasPrevious={pagination.page > 1}
              hasNext={pagination.page < pagination.total_pages}
              onPrevious={() => setPage((current) => Math.max(current - 1, 1))}
              onNext={() => setPage((current) => current + 1)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
