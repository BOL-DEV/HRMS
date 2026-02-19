"use client";

import Header from "@/components/Header";
import StatusPill from "@/components/StatusPill";
import TagPill from "@/components/TagPill";
import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { FiDownload, FiTrendingUp } from "react-icons/fi";

type PaymentMethod = "Cash" | "Transfer" | "POS";
type TransactionStatus = "Paid" | "Pending" | "Refunded" | "Refund Requested";

type Transaction = {
  id: string;
  invoice: string;
  patient: string;
  amount: number;
  department: string;
  revenueHead: string;
  paymentMethod: PaymentMethod;
  agent: string;
  status: TransactionStatus;
  date: string; // YYYY-MM-DD
};

type RevenueBreakdown = {
  revenueHead: string;
  department: string;
  transactions: number;
  totalRevenue: number;
  paid: number;
  pending: number;
  refunds: number;
};

const formatNaira = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(value);

const revenueTrend = [
  { label: "Mon", value: 140000 },
  { label: "Tue", value: 120000 },
  { label: "Wed", value: 145000 },
  { label: "Thu", value: 148000 },
  { label: "Fri", value: 102000 },
  { label: "Sat", value: 132000 },
  { label: "Sun", value: 146000 },
];

const paymentMethodSummary = [
  { name: "Cash", value: 180000 },
  { name: "Transfer", value: 145000 },
  { name: "POS", value: 155000 },
];

const departmentRevenue = [
  { name: "Consultation", value: 185000 },
  { name: "Lab", value: 370000 },
  { name: "Scan", value: 490000 },
  { name: "Pharmacy", value: 290000 },
  { name: "Admission", value: 600000 },
];

const topAgents = [
  { name: "Oluwaseun", value: 820000 },
  { name: "Zainab", value: 610000 },
  { name: "Amara", value: 560000 },
  { name: "Chinedu", value: 230000 },
  { name: "Hauwa", value: 260000 },
];

const breakdownTable: RevenueBreakdown[] = [
  { revenueHead: "Consultation", department: "General Medicine", transactions: 12, totalRevenue: 185000, paid: 165000, pending: 20000, refunds: 0 },
  { revenueHead: "Lab Test", department: "Laboratory", transactions: 18, totalRevenue: 370000, paid: 355000, pending: 0, refunds: 15000 },
  { revenueHead: "Scan", department: "Radiology", transactions: 14, totalRevenue: 490000, paid: 490000, pending: 0, refunds: 0 },
  { revenueHead: "Pharmacy", department: "Pharmacy", transactions: 13, totalRevenue: 290000, paid: 290000, pending: 0, refunds: 0 },
  { revenueHead: "Admission", department: "Inpatient", transactions: 11, totalRevenue: 600000, paid: 580000, pending: 20000, refunds: 0 },
];

const transactionsData: Transaction[] = [
  {
    id: "tx1",
    invoice: "INV-2024-0053",
    patient: "Chioma Okonkwo",
    amount: 220000,
    department: "Admission",
    revenueHead: "Admission",
    paymentMethod: "Cash",
    agent: "Zainab Mohammed",
    status: "Paid",
    date: "2024-03-17",
  },
  {
    id: "tx2",
    invoice: "INV-2024-0054",
    patient: "Emeka Obi",
    amount: 200000,
    department: "Admission",
    revenueHead: "Admission",
    paymentMethod: "POS",
    agent: "Zainab Mohammed",
    status: "Paid",
    date: "2024-03-13",
  },
  {
    id: "tx3",
    invoice: "INV-2024-0055",
    patient: "Tunde Akinola",
    amount: 175000,
    department: "Scan",
    revenueHead: "Scan",
    paymentMethod: "Cash",
    agent: "Oluwaseun Adeyemi",
    status: "Paid",
    date: "2024-03-16",
  },
  {
    id: "tx4",
    invoice: "INV-2024-0056",
    patient: "Ngozi Eze",
    amount: 165000,
    department: "Scan",
    revenueHead: "Scan",
    paymentMethod: "Cash",
    agent: "Oluwaseun Adeyemi",
    status: "Pending",
    date: "2024-03-18",
  },
  {
    id: "tx5",
    invoice: "INV-2024-0057",
    patient: "Binta Ibrahim",
    amount: 150000,
    department: "Scan",
    revenueHead: "Scan",
    paymentMethod: "Transfer",
    agent: "Oluwaseun Adeyemi",
    status: "Refunded",
    date: "2024-03-14",
  },
];

type DateRange = "Last 7 Days" | "Last 30 Days" | "This Year" | "All Time";

function Page() {
  const [dateRange, setDateRange] = useState<DateRange>("Last 7 Days");
  const [department, setDepartment] = useState<string>("All");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "All">("All");
  const [agent, setAgent] = useState<string>("All");
  const [revenueHead, setRevenueHead] = useState<string>("All");

  const filteredTransactions = useMemo(() => {
    const now = new Date("2024-03-18"); // anchor to mock data timeframe

    const withinRange = (date: string) => {
      if (dateRange === "All Time") return true;
      const d = new Date(date + "T00:00:00");
      if (dateRange === "This Year") return d.getFullYear() === now.getFullYear();
      const diff = now.getTime() - d.getTime();
      const days = dateRange === "Last 7 Days" ? 7 : 30;
      return diff <= days * 24 * 60 * 60 * 1000;
    };

    return transactionsData.filter((t) =>
      withinRange(t.date) &&
      (department === "All" || t.department === department) &&
      (paymentMethod === "All" || t.paymentMethod === paymentMethod) &&
      (agent === "All" || t.agent === agent) &&
      (revenueHead === "All" || t.revenueHead === revenueHead)
    );
  }, [agent, dateRange, department, paymentMethod, revenueHead]);

  const stats = useMemo(() => {
    const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalTransactions = filteredTransactions.length;
    const patientsServed = new Set(filteredTransactions.map((t) => t.patient)).size;
    const avgTransaction = totalTransactions ? totalRevenue / totalTransactions : 0;
    const refundRequests = filteredTransactions.filter((t) => t.status === "Refund Requested").length;
    const pendingPayments = filteredTransactions
      .filter((t) => t.status === "Pending")
      .reduce((sum, t) => sum + t.amount, 0);

    return { totalRevenue, totalTransactions, patientsServed, avgTransaction, refundRequests, pendingPayments };
  }, [filteredTransactions]);

  return (
    <div className="w-full bg-white min-h-screen">
      <Header
        title="Reports"
        Subtitle="Analyze hospital revenue and transaction performance"
        actions={
          <button className="hidden md:inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 hover:bg-gray-50">
            <FiDownload />
            Export Report
          </button>
        }
      />

      <div className="p-6 space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">Date Range</p>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRange)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>This Year</option>
                <option>All Time</option>
              </select>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">Department</p>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option>All</option>
                <option>General Medicine</option>
                <option>Laboratory</option>
                <option>Radiology</option>
                <option>Pharmacy</option>
                <option>Inpatient</option>
              </select>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">Payment Method</p>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod | "All")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="All">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="Transfer">Transfer</option>
                <option value="POS">POS</option>
              </select>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">Agent</p>
              <select
                value={agent}
                onChange={(e) => setAgent(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option>All</option>
                <option>Oluwaseun Adeyemi</option>
                <option>Zainab Mohammed</option>
                <option>Amara Okoro</option>
                <option>Chinedu Nwankwo</option>
                <option>Hauwa Musa</option>
              </select>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">Revenue Head</p>
              <select
                value={revenueHead}
                onChange={(e) => setRevenueHead(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option>All</option>
                <option>Consultation</option>
                <option>Lab</option>
                <option>Scan</option>
                <option>Pharmacy</option>
                <option>Admission</option>
              </select>
            </div>
          </div>

          <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm">
            <FiTrendingUp />
            Generate Report
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[{
            label: "Total Revenue",
            value: formatNaira(stats.totalRevenue || 2000000),
          },
          {
            label: "Total Transactions",
            value: stats.totalTransactions || 16,
          },
          {
            label: "Patients Served",
            value: stats.patientsServed || 16,
          },
          {
            label: "Avg Transaction",
            value: stats.avgTransaction ? formatNaira(Math.round(stats.avgTransaction)) : "₦127K",
          },
          {
            label: "Refund Requests",
            value: stats.refundRequests || 1,
          },
          {
            label: "Pending Payments",
            value: formatNaira(stats.pendingPayments || 180000),
          }].map((card) => (
            <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-600 font-medium">{card.label}</p>
              <h2 className="text-2xl font-bold mt-2">{card.value}</h2>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-lg font-bold mb-2">Revenue Trend</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueTrend} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={(v) => formatNaira(Number(v)).replace("₦", "₦")} width={70} />
                  <Tooltip formatter={(v: number) => formatNaira(Number(v))} />
                  <Line type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-lg font-bold mb-2">Payment Method Breakdown</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentMethodSummary} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(v) => formatNaira(Number(v)).replace("₦", "₦")} width={70} />
                  <Tooltip formatter={(v: number) => formatNaira(Number(v))} />
                  <Bar dataKey="value" fill="#22C55E" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-lg font-bold mb-2">Department Revenue</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={departmentRevenue} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={2}>
                    {departmentRevenue.map((entry, idx) => (
                      <Cell key={entry.name} fill={["#F59E0B", "#22C55E", "#6366F1", "#F97316", "#8B5CF6"][idx % 5]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, n: string) => [formatNaira(Number(v)), n]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-lg font-bold mb-2">Top Agents by Revenue</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topAgents} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" interval={0} angle={-10} textAnchor="end" height={50} />
                  <YAxis tickFormatter={(v) => formatNaira(Number(v)).replace("₦", "₦")} width={70} />
                  <Tooltip formatter={(v: number) => formatNaira(Number(v))} />
                  <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-lg font-bold mb-4">Detailed Revenue Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 bg-gray-100">
                  <th className="p-3 font-semibold">Revenue Head</th>
                  <th className="p-3 font-semibold">Department</th>
                  <th className="p-3 font-semibold">Transactions</th>
                  <th className="p-3 font-semibold">Total Revenue</th>
                  <th className="p-3 font-semibold">Paid</th>
                  <th className="p-3 font-semibold">Pending</th>
                  <th className="p-3 font-semibold">Refunds</th>
                </tr>
              </thead>
              <tbody>
                {breakdownTable.map((row) => (
                  <tr key={row.revenueHead} className="border-b border-gray-100">
                    <td className="p-3 font-semibold text-gray-900">{row.revenueHead}</td>
                    <td className="p-3 text-gray-700">{row.department}</td>
                    <td className="p-3 text-gray-700">{row.transactions}</td>
                    <td className="p-3 font-semibold text-gray-900">{formatNaira(row.totalRevenue)}</td>
                    <td className="p-3 text-green-600 font-semibold">{formatNaira(row.paid)}</td>
                    <td className="p-3 text-amber-600 font-semibold">{formatNaira(row.pending)}</td>
                    <td className="p-3 text-red-600 font-semibold">{formatNaira(row.refunds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-lg font-bold mb-4">Top Transactions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 bg-gray-100">
                  <th className="p-3 font-semibold">Invoice No</th>
                  <th className="p-3 font-semibold">Patient</th>
                  <th className="p-3 font-semibold">Amount</th>
                  <th className="p-3 font-semibold">Department</th>
                  <th className="p-3 font-semibold">Payment Method</th>
                  <th className="p-3 font-semibold">Agent</th>
                  <th className="p-3 font-semibold">Date</th>
                  <th className="p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100">
                    <td className="p-3 font-semibold text-gray-900 whitespace-nowrap">{t.invoice}</td>
                    <td className="p-3 text-gray-900 font-semibold whitespace-nowrap">{t.patient}</td>
                    <td className="p-3 font-semibold text-gray-900">{formatNaira(t.amount)}</td>
                    <td className="p-3 text-gray-700 whitespace-nowrap">{t.department}</td>
                    <td className="p-3"><TagPill label={t.paymentMethod} /></td>
                    <td className="p-3 text-gray-700 whitespace-nowrap">{t.agent}</td>
                    <td className="p-3 text-gray-700 whitespace-nowrap">{t.date}</td>
                    <td className="p-3 whitespace-nowrap"><StatusPill status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Page;
