"use client";

import Header from "@/components/Header";
import TagPill from "@/components/TagPill";
import { ApiError } from "@/libs/api";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import { getFoAgents, getFoReports } from "@/libs/fo-auth";
import { formatDateTime, formatNaira } from "@/libs/helper";
import { FoDetailedReportItem, FoReportPaymentType } from "@/libs/type";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { FiDownload, FiTrendingUp } from "react-icons/fi";

type DateRange = "Last 7 Days" | "Last 30 Days" | "This Year" | "All Time";
type PaymentMethod = "Cash" | "Transfer" | "POS";

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildDateRange(range: DateRange) {
  const today = new Date();

  if (range === "All Time") {
    return {};
  }

  const endDate = formatDateOnly(today);
  const start = new Date(today);

  if (range === "This Year") {
    start.setMonth(0, 1);
  } else {
    start.setDate(today.getDate() - (range === "Last 7 Days" ? 6 : 29));
  }

  return {
    startDate: formatDateOnly(start),
    endDate,
  };
}

function toMethodLabel(value: FoReportPaymentType): PaymentMethod {
  if (value === "cash") return "Cash";
  if (value === "transfer") return "Transfer";
  return "POS";
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function Page() {
  const router = useRouter();
  const accessToken = getAccessToken();

  const [dateRange, setDateRange] = useState<DateRange>("Last 7 Days");
  const [department, setDepartment] = useState("All");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "All">(
    "All",
  );
  const [agent, setAgent] = useState("All");
  const [billDescription, setBillDescription] = useState("All");
  const [appliedFilters, setAppliedFilters] = useState({
    dateRange: "Last 7 Days" as DateRange,
    department: "All",
    agent: "All",
  });

  const agentsQuery = useQuery({
    queryKey: ["fo-agents-options"],
    queryFn: () => getFoAgents(),
    enabled: Boolean(accessToken),
  });

  const reportsQuery = useQuery({
    queryKey: ["fo-reports", appliedFilters],
    queryFn: () =>
      getFoReports({
        ...buildDateRange(appliedFilters.dateRange),
        departments:
          appliedFilters.department === "All"
            ? undefined
            : [appliedFilters.department],
        agents:
          appliedFilters.agent === "All" ? undefined : [appliedFilters.agent],
      }),
    enabled: Boolean(accessToken),
  });

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    const error =
      reportsQuery.error instanceof ApiError
        ? reportsQuery.error
        : agentsQuery.error instanceof ApiError
          ? agentsQuery.error
          : null;

    if (!error) {
      return;
    }

    if (error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
    }
  }, [agentsQuery.error, reportsQuery.error, router]);

  const detailedReport = useMemo(
    () => reportsQuery.data?.data.detailed_report ?? [],
    [reportsQuery.data?.data.detailed_report],
  );

  const filteredTransactions = useMemo(() => {
    return detailedReport.filter((item) => {
      const matchesPayment =
        paymentMethod === "All"
          ? true
          : toMethodLabel(item.payment_type) === paymentMethod;
      const matchesBill =
        billDescription === "All" ? true : item.bill_description === billDescription;

      return matchesPayment && matchesBill;
    });
  }, [billDescription, detailedReport, paymentMethod]);

  const stats = useMemo(() => {
    const totalRevenue = filteredTransactions.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
    const totalTransactions = filteredTransactions.length;
    const avgTransaction = totalTransactions
      ? totalRevenue / totalTransactions
      : 0;

    return {
      totalRevenue,
      totalTransactions,
      avgTransaction,
    };
  }, [filteredTransactions]);

  const revenueTrendData = useMemo(() => {
    const grouped = new Map<string, number>();

    filteredTransactions.forEach((item) => {
      const day = item.created_at.slice(0, 10);
      grouped.set(day, (grouped.get(day) ?? 0) + item.amount);
    });

    return [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, value]) => ({ label, value }));
  }, [filteredTransactions]);

  const paymentMethodSummary = useMemo(() => {
    const grouped = new Map<PaymentMethod, number>();

    filteredTransactions.forEach((item) => {
      const label = toMethodLabel(item.payment_type);
      grouped.set(label, (grouped.get(label) ?? 0) + item.amount);
    });

    return [...grouped.entries()].map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  const departmentRevenue = useMemo(() => {
    const grouped = new Map<string, number>();

    filteredTransactions.forEach((item) => {
      grouped.set(
        item.department_name,
        (grouped.get(item.department_name) ?? 0) + item.amount,
      );
    });

    return [...grouped.entries()].map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  const topAgents = useMemo(() => {
    const grouped = new Map<string, number>();

    filteredTransactions.forEach((item) => {
      grouped.set(item.agent_name, (grouped.get(item.agent_name) ?? 0) + item.amount);
    });

    return [...grouped.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const breakdownTable = useMemo(() => {
    const grouped = new Map<
      string,
      { revenueHead: string; department: string; transactions: number; totalRevenue: number }
    >();

    filteredTransactions.forEach((item) => {
      const key = `${item.bill_description}::${item.department_name}`;
      const current = grouped.get(key);

      if (current) {
        current.transactions += 1;
        current.totalRevenue += item.amount;
        return;
      }

      grouped.set(key, {
        revenueHead: item.bill_description,
        department: item.department_name,
        transactions: 1,
        totalRevenue: item.amount,
      });
    });

    return [...grouped.values()].sort(
      (a, b) => b.totalRevenue - a.totalRevenue,
    );
  }, [filteredTransactions]);

  const departmentOptions = useMemo(() => {
    const fromBreakdowns = reportsQuery.data?.data.breakdowns.by_department ?? [];

    return fromBreakdowns.map((item) => ({
      id: item.department_id,
      name: item.department_name,
    }));
  }, [reportsQuery.data?.data.breakdowns.by_department]);

  const agentOptions = useMemo(() => {
    const agents = agentsQuery.data?.data.agents ?? [];

    return agents.map((item) => ({
      id: item.agent_id,
      name: item.agent_name,
    }));
  }, [agentsQuery.data?.data.agents]);

  const billDescriptionOptions = useMemo(
    () =>
      Array.from(
        new Set(detailedReport.map((item) => item.bill_description)),
      ).sort((a, b) => a.localeCompare(b)),
    [detailedReport],
  );

  const handleGenerateReport = () => {
    setAppliedFilters({
      dateRange,
      department,
      agent,
    });
  };

  const handleExportCsv = () => {
    const rows = [
      [
        "Receipt No",
        "Patient",
        "Phone Number",
        "Amount",
        "Department",
        "Bill Description",
        "Payment Method",
        "Agent",
        "Created At",
      ],
      ...filteredTransactions.map((item) => [
        item.receipt_no,
        item.patient_name,
        item.phone_number,
        item.amount,
        item.department_name,
        item.bill_description,
        toMethodLabel(item.payment_type),
        item.agent_name,
        formatDateTime(item.created_at),
      ]),
    ];

    downloadCsv("fo-report.csv", rows);
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-slate-950">
      <Header
        title="Reports"
        Subtitle="Analyze hospital revenue and transaction performance"
        actions={
          <button
            onClick={handleExportCsv}
            className="hidden md:inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FiDownload />
            Export Report
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {reportsQuery.error instanceof Error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {reportsQuery.error.message}
          </div>
        ) : null}

        {agentsQuery.error instanceof Error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {agentsQuery.error.message}
          </div>
        ) : null}

        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 dark:border-slate-700 dark:bg-slate-900">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Date Range
              </p>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRange)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>This Year</option>
                <option>All Time</option>
              </select>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Department
              </p>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="All">All</option>
                {departmentOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Payment Method
              </p>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as PaymentMethod | "All")
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="All">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="Transfer">Transfer</option>
                <option value="POS">POS</option>
              </select>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Agent
              </p>
              <select
                value={agent}
                onChange={(e) => setAgent(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="All">All</option>
                {agentOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Bill Description
              </p>
              <select
                value={billDescription}
                onChange={(e) => setBillDescription(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="All">All</option>
                {billDescriptionOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerateReport}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <FiTrendingUp />
            Generate Report
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              label: "Total Revenue",
              value: formatNaira(stats.totalRevenue),
            },
            {
              label: "Total Transactions",
              value: stats.totalTransactions,
            },
            {
              label: "Avg Transaction",
              value: formatNaira(Math.round(stats.avgTransaction)),
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
            >
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
                {card.label}
              </p>
              <h2 className="mt-2 text-2xl font-bold dark:text-slate-100">
                {reportsQuery.isLoading ? "--" : card.value}
              </h2>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-2 text-lg font-bold dark:text-slate-100">
              Revenue Trend
            </h2>
            <div className="h-64">
              {revenueTrendData.length === 0 ? (
                <EmptyState message="No report trend data available for the current filters." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={revenueTrendData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="currentColor"
                      strokeOpacity={0.15}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "currentColor" }}
                      axisLine={{ stroke: "currentColor" }}
                      tickLine={{ stroke: "currentColor" }}
                    />
                    <YAxis
                      tickFormatter={(v) => formatNaira(Number(v))}
                      width={90}
                      tick={{ fill: "currentColor" }}
                      axisLine={{ stroke: "currentColor" }}
                      tickLine={{ stroke: "currentColor" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#2563EB"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-2 text-lg font-bold dark:text-slate-100">
              Payment Method Breakdown
            </h2>
            <div className="h-64">
              {paymentMethodSummary.length === 0 ? (
                <EmptyState message="No payment method data available for the current filters." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={paymentMethodSummary}
                    margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="currentColor"
                      strokeOpacity={0.15}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "currentColor" }}
                      axisLine={{ stroke: "currentColor" }}
                      tickLine={{ stroke: "currentColor" }}
                    />
                    <YAxis
                      tickFormatter={(v) => formatNaira(Number(v))}
                      width={90}
                      tick={{ fill: "currentColor" }}
                      axisLine={{ stroke: "currentColor" }}
                      tickLine={{ stroke: "currentColor" }}
                    />
                    <Bar dataKey="value" fill="#22C55E" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-2 text-lg font-bold dark:text-slate-100">
              Department Revenue
            </h2>
            <div className="h-72">
              {departmentRevenue.length === 0 ? (
                <EmptyState message="No department revenue data available for the current filters." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departmentRevenue}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={2}
                    >
                      {departmentRevenue.map((entry, idx) => (
                        <Cell
                          key={entry.name}
                          fill={
                            ["#F59E0B", "#22C55E", "#6366F1", "#F97316", "#3B82F6"][
                              idx % 5
                            ]
                          }
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-2 text-lg font-bold dark:text-slate-100">
              Top Agents by Revenue
            </h2>
            <div className="h-72">
              {topAgents.length === 0 ? (
                <EmptyState message="No agent revenue data available for the current filters." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topAgents}
                    margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="currentColor"
                      strokeOpacity={0.15}
                    />
                    <XAxis
                      dataKey="name"
                      interval={0}
                      angle={-10}
                      textAnchor="end"
                      height={50}
                      tick={{ fill: "currentColor" }}
                      axisLine={{ stroke: "currentColor" }}
                      tickLine={{ stroke: "currentColor" }}
                    />
                    <YAxis
                      tickFormatter={(v) => formatNaira(Number(v))}
                      width={90}
                      tick={{ fill: "currentColor" }}
                      axisLine={{ stroke: "currentColor" }}
                      tickLine={{ stroke: "currentColor" }}
                    />
                    <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-bold dark:text-slate-100">
            Detailed Revenue Breakdown
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                  <th className="p-3 font-semibold">Revenue Head</th>
                  <th className="p-3 font-semibold">Department</th>
                  <th className="p-3 font-semibold">Transactions</th>
                  <th className="p-3 font-semibold">Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {breakdownTable.length === 0 ? (
                  <tr>
                    <td
                      className="p-4 text-gray-500 dark:text-slate-400"
                      colSpan={4}
                    >
                      No revenue breakdown available for the current filters.
                    </td>
                  </tr>
                ) : (
                  breakdownTable.map((row) => (
                    <tr
                      key={`${row.revenueHead}-${row.department}`}
                      className="border-b border-gray-100 dark:border-slate-800"
                    >
                      <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                        {row.revenueHead}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {row.department}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {row.transactions}
                      </td>
                      <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                        {formatNaira(row.totalRevenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-bold dark:text-slate-100">
            Top Transactions
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                  <th className="p-3 font-semibold">Receipt No</th>
                  <th className="p-3 font-semibold">Patient</th>
                  <th className="p-3 font-semibold">Amount</th>
                  <th className="p-3 font-semibold">Department</th>
                  <th className="p-3 font-semibold">Payment Method</th>
                  <th className="p-3 font-semibold">Agent</th>
                  <th className="p-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td
                      className="p-4 text-gray-500 dark:text-slate-400"
                      colSpan={7}
                    >
                      No transactions available for the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((item) => (
                    <ReportTransactionRow
                      key={item.transaction_id}
                      item={item}
                    />
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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-300 px-6 text-center text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
      {message}
    </div>
  );
}

function ReportTransactionRow({ item }: { item: FoDetailedReportItem }) {
  return (
    <tr className="border-b border-gray-100 dark:border-slate-800">
      <td className="p-3 font-semibold text-gray-900 whitespace-nowrap dark:text-slate-100">
        {item.receipt_no}
      </td>
      <td className="p-3 text-gray-900 font-semibold whitespace-nowrap dark:text-slate-100">
        {item.patient_name}
      </td>
      <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
        {formatNaira(item.amount)}
      </td>
      <td className="p-3 text-gray-700 whitespace-nowrap dark:text-slate-300">
        {item.department_name}
      </td>
      <td className="p-3">
        <TagPill label={toMethodLabel(item.payment_type)} />
      </td>
      <td className="p-3 text-gray-700 whitespace-nowrap dark:text-slate-300">
        {item.agent_name}
      </td>
      <td className="p-3 text-gray-700 whitespace-nowrap dark:text-slate-300">
        {formatDateTime(item.created_at)}
      </td>
    </tr>
  );
}

export default Page;
