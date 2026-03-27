"use client";

import Header from "@/components/Header";
import TagPill from "@/components/TagPill";
import { ApiError } from "@/libs/api";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import { getFoReports } from "@/libs/fo-auth";
import { formatDateTime, formatNaira } from "@/libs/helper";
import { FoDetailedReportItem, FoReportPaymentType } from "@/libs/type";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FiDownload, FiMoreVertical, FiSearch } from "react-icons/fi";

type MethodFilter = "All" | "Cash" | "Transfer" | "POS";
type DateFilter = "All" | "Today";

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function toMethodLabel(value: FoReportPaymentType): Exclude<MethodFilter, "All"> {
  if (value === "cash") return "Cash";
  if (value === "transfer") return "Transfer";
  return "POS";
}

function Page() {
  const router = useRouter();
  const accessToken = getAccessToken();
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState<MethodFilter>("All");
  const [dateFilter, setDateFilter] = useState<DateFilter>("All");

  const today = useMemo(() => getTodayString(), []);

  const transactionsQuery = useQuery({
    queryKey: ["fo-transactions", dateFilter, today],
    queryFn: () =>
      getFoReports(
        dateFilter === "Today"
          ? { startDate: today, endDate: today }
          : undefined,
      ),
    enabled: Boolean(accessToken),
  });

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    if (!(transactionsQuery.error instanceof ApiError)) {
      return;
    }

    if (transactionsQuery.error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
    }
  }, [transactionsQuery.error, router]);

  const detailedReport = useMemo(
    () => transactionsQuery.data?.data.detailed_report ?? [],
    [transactionsQuery.data?.data.detailed_report],
  );
  const summary = transactionsQuery.data?.data.summary_report;

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();

    const bySearch = !text
      ? detailedReport
      : detailedReport.filter((item) =>
          [
            item.patient_name,
            item.phone_number,
            item.receipt_no,
            item.agent_name,
            item.department_name,
            item.bill_description,
          ].some((field) => field.toLowerCase().includes(text)),
        );

    const byMethod =
      method === "All"
        ? bySearch
        : bySearch.filter((item) => toMethodLabel(item.payment_type) === method);

    return [...byMethod].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [detailedReport, method, search]);

  const stats = useMemo(
    () => ({
      totalRevenue:
        method === "All" && !search.trim()
          ? summary?.total_revenue ?? 0
          : filtered.reduce((sum, item) => sum + item.amount, 0,
            ),
      totalTransactions:
        method === "All" && !search.trim()
          ? summary?.transaction_count ?? 0
          : filtered.length,
    }),
    [filtered, method, search, summary],
  );

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-slate-950">
      <Header
        title="Transactions"
        Subtitle="Monitor and audit all hospital payment transactions"
        actions={
          <button className="hidden rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white md:block">
            Export CSV
          </button>
        }
      />

      <div className="space-y-6 p-6">
        {transactionsQuery.error instanceof Error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {transactionsQuery.error.message}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[
            {
              label: "Total Revenue",
              value: formatNaira(stats.totalRevenue),
            },
            {
              label: "Total Transactions",
              value: stats.totalTransactions,
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
            >
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
                {card.label}
              </p>
              <h2 className="mt-2 text-2xl font-bold dark:text-slate-100">
                {transactionsQuery.isLoading ? "--" : card.value}
              </h2>
            </div>
          ))}
        </div>

        <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex w-full items-center gap-3">
            <div className="relative w-full">
              <FiSearch className="absolute left-3 top-3 text-gray-400 dark:text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by patient name, phone, receipt, or agent..."
                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as MethodFilter)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="All">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="Transfer">Transfer</option>
                <option value="POS">POS</option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="All">All Dates</option>
                <option value="Today">Today</option>
              </select>
            </div>

            <button className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 md:self-auto">
              <FiDownload />
              Export
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-bold dark:text-slate-100">
            Transaction History
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                  <th className="p-3 font-semibold">Date/Time</th>
                  <th className="p-3 font-semibold">Receipt No</th>
                  <th className="p-3 font-semibold">Patient</th>
                  <th className="p-3 font-semibold">Department</th>
                  <th className="p-3 font-semibold">Bill Description</th>
                  <th className="p-3 font-semibold">Amount</th>
                  <th className="p-3 font-semibold">Method</th>
                  <th className="p-3 font-semibold">Agent</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactionsQuery.isLoading ? (
                  <tr>
                    <td
                      className="p-4 text-gray-500 dark:text-slate-400"
                      colSpan={9}
                    >
                      Loading transactions...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      className="p-4 text-gray-500 dark:text-slate-400"
                      colSpan={9}
                    >
                      No transactions found for the current filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <TransactionRow key={item.transaction_id} item={item} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransactionRow({ item }: { item: FoDetailedReportItem }) {
  return (
    <tr className="border-b border-gray-100 dark:border-slate-800">
      <td className="whitespace-nowrap p-3 text-gray-700 dark:text-slate-300">
        {formatDateTime(item.created_at)}
      </td>
      <td className="whitespace-nowrap p-3 font-semibold text-gray-900 dark:text-slate-100">
        {item.receipt_no}
      </td>
      <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
        {item.patient_name}
        <p className="text-xs font-normal text-gray-500 dark:text-slate-400">
          {item.phone_number}
        </p>
      </td>
      <td className="whitespace-nowrap p-3 text-gray-700 dark:text-slate-300">
        {item.department_name}
      </td>
      <td className="whitespace-nowrap p-3 text-gray-700 dark:text-slate-300">
        {item.bill_description}
      </td>
      <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
        {formatNaira(item.amount)}
      </td>
      <td className="p-3">
        <TagPill label={toMethodLabel(item.payment_type)} />
      </td>
      <td className="whitespace-nowrap p-3 text-gray-700 dark:text-slate-300">
        {item.agent_name}
      </td>
      <td className="p-3 text-right">
        <button className="rounded-lg border border-transparent p-2 hover:border-gray-200 hover:bg-gray-100 dark:hover:border-slate-700 dark:hover:bg-slate-800">
          <FiMoreVertical className="text-gray-700 dark:text-slate-200" />
        </button>
      </td>
    </tr>
  );
}

export default Page;
