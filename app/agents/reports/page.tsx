"use client";

import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import StatusPill from "@/components/StatusPill";
import React from "react";
import {
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FiClock,
  FiDollarSign,
  FiFileText,
  FiPrinter,
  FiRefreshCcw,
  FiDownload,
} from "react-icons/fi";

const usd = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const filterOptions = {
  dateRange: ["Last 7 Days", "Last 30 Days", "This Quarter", "This Year"],
  status: ["All", "Paid", "Pending", "Refunded"],
  paymentMethod: [
    "All",
    "Credit Card",
    "Cash",
    "Bank Transfer",
    "POS",
    "Insurance",
  ],
  revenueHead: ["All", "Consultation", "Lab Work", "Pharmacy", "Surgery"],
};

const stats = [
  {
    title: "Total Revenue",
    value: usd(11800),
    delta: "+8.5% from previous period",
    deltaTone: "positive" as const,
    icon: <FiDollarSign className="text-xl" />,
  },
  {
    title: "Total Transactions",
    value: "8",
    delta: "+12% from previous period",
    deltaTone: "positive" as const,
    icon: <FiFileText className="text-xl" />,
  },
  {
    title: "Pending Amount",
    value: usd(550),
    delta: "Awaiting payment",
    deltaTone: "neutral" as const,
    icon: <FiClock className="text-xl" />,
  },
  {
    title: "Refund Requests",
    value: "1",
    delta: "-5% from last period",
    deltaTone: "negative" as const,
    icon: <FiRefreshCcw className="text-xl" />,
  },
];

const revenueTrendData = [
  { day: "Mon", value: 4300 },
  { day: "Tue", value: 3600 },
  { day: "Wed", value: 5000 },
  { day: "Thu", value: 4200 },
  { day: "Fri", value: 6000 },
  { day: "Sat", value: 3200 },
  { day: "Sun", value: 4700 },
];

const paymentMethodData = [
  { name: "Credit Card", value: 35, color: "#2C4BFF" },
  { name: "Bank Transfer", value: 28, color: "#F5A524" },
  { name: "Cash", value: 21, color: "#09A66D" },
  { name: "POS", value: 13, color: "#F7434C" },
  { name: "Insurance", value: 3, color: "#7A5CF5" },
];

const transactions = [
  {
    date: "2024-02-15",
    invoice: "INV-2024-001",
    patient: "John Anderson",
    revenueHead: "Consultation",
    amount: 250,
    paymentMethod: "Credit Card",
    status: "Paid" as const,
  },
  {
    date: "2024-02-15",
    invoice: "INV-2024-002",
    patient: "Sarah Mitchell",
    revenueHead: "Surgery",
    amount: 1500,
    paymentMethod: "Insurance",
    status: "Paid" as const,
  },
  {
    date: "2024-02-14",
    invoice: "INV-2024-003",
    patient: "Robert Chen",
    revenueHead: "Lab Test",
    amount: 350,
    paymentMethod: "Bank Transfer",
    status: "Pending" as const,
  },
  {
    date: "2024-02-14",
    invoice: "INV-2024-004",
    patient: "Emma Wilson",
    revenueHead: "Scan",
    amount: 450,
    paymentMethod: "Cash",
    status: "Paid" as const,
  },
  {
    date: "2024-02-13",
    invoice: "INV-2024-005",
    patient: "Michael Brown",
    revenueHead: "Admission",
    amount: 2000,
    paymentMethod: "Credit Card",
    status: "Refunded" as const,
  },
];

function Page() {
  return (
    <div className="h-screen w-full bg-gray-100 overflow-y-auto">
      <Header
        title="Reports"
        Subtitle="Generate revenue reports and transaction summaries"
      />

      <div className="p-6 space-y-6 w-full">
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold">Report Filters</h2>
              <p className="text-sm text-gray-600">
                Refine by date range, status, payment method, and revenue head
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Date Range</p>
              <select className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {filterOptions.dateRange.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Status</p>
              <select className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {filterOptions.status.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Payment Method
              </p>
              <select className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {filterOptions.paymentMethod.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Revenue Head</p>
              <select className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {filterOptions.revenueHead.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button className="w-full h-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-3 transition-colors">
                Generate Report
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {stats.map((s) => (
            <StatCard
              key={s.title}
              title={s.title}
              value={s.value}
              delta={s.delta}
              deltaTone={s.deltaTone}
              icon={s.icon}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-xl font-bold">Revenue Trend</h2>
              <p className="text-sm text-gray-600">Daily revenue performance</p>
            </div>

            <div className="p-5 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter data={revenueTrendData} fill="#111827" r={6} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-xl font-bold">Payment Method Breakdown</h2>
              <p className="text-sm text-gray-600">
                Share of payments by method
              </p>
            </div>

            <div className="p-5 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    label={(entry) => `${entry.name}`}
                  >
                    {paymentMethodData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number | undefined, name?: string) => [
                      `${value ?? 0}%`,
                      name ?? "",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                {paymentMethodData.map((method) => (
                  <div
                    key={method.name}
                    className="flex items-center gap-2 text-gray-700"
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: method.color }}
                    />
                    <span className="font-medium">{method.name}</span>
                    <span className="text-gray-500">{method.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="p-5 border-b border-gray-200 flex flex-col gap-1">
            <h2 className="text-xl font-bold">Transaction Details</h2>
            <p className="text-sm text-gray-600">
              Detailed transaction list for the selected filters
            </p>
          </div>

          <div className="p-5 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 bg-gray-100">
                  <th className="p-3 font-semibold">Date</th>
                  <th className="p-3 font-semibold">Invoice</th>
                  <th className="p-3 font-semibold">Patient</th>
                  <th className="p-3 font-semibold">Revenue Head</th>
                  <th className="p-3 font-semibold">Amount</th>
                  <th className="p-3 font-semibold">Payment Method</th>
                  <th className="p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.invoice} className="border-b border-gray-100">
                    <td className="p-3 text-gray-700 whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="p-3 font-semibold text-gray-900 whitespace-nowrap">
                      {tx.invoice}
                    </td>
                    <td className="p-3 text-gray-700 whitespace-nowrap">
                      {tx.patient}
                    </td>
                    <td className="p-3 text-gray-700 whitespace-nowrap">
                      {tx.revenueHead}
                    </td>
                    <td className="p-3 font-semibold text-gray-900 whitespace-nowrap">
                      {usd(tx.amount)}
                    </td>
                    <td className="p-3 text-gray-700 whitespace-nowrap">
                      {tx.paymentMethod}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <StatusPill status={tx.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-5 pb-5 flex items-center justify-between text-sm text-gray-600">
            <p>Page 1 of 2 • Showing 5 of 8 transactions</p>

            <div className="flex items-center gap-3">
              <button className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50">
                Previous
              </button>
              <button className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold">Export Report</h2>
              <p className="text-sm text-gray-600">
                Download or print the report for sharing and audit purposes
              </p>
            </div>
          </div>

          <div className="p-5 flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-800 hover:bg-gray-50">
              <FiDownload />
              Export CSV
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-800 hover:bg-gray-50">
              <FiDownload />
              Export PDF
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-800 hover:bg-gray-50">
              <FiPrinter />
              Print Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Page;
