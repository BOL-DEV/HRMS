"use client";

import { useMemo, useState } from "react";
import Header from "@/components/Header";
import TagPill from "@/components/TagPill";
import StatusPill from "@/components/StatusPill";
import { formatCurrency } from "@/libs/helper";
import {
  FiSearch,
  FiDownload,
  FiClock,
  FiCheckCircle,
  FiTrendingUp,
  FiMoreVertical,
} from "react-icons/fi";

type RefundStatus = "Pending" | "Approved" | "Rejected";

type PaymentMethod = "Cash" | "Transfer" | "POS" | "Insurance";

interface RefundRow {
  id: string;
  dateRequested: string;
  refundId: string;
  invoiceNo: string;
  patient: string;
  phone: string;
  amount: number;
  paymentMethod: PaymentMethod;
  agent: string;
  status: RefundStatus;
}

const refunds: RefundRow[] = [
  {
    id: "ref-1",
    dateRequested: "2024-03-18",
    refundId: "REF-2024-001",
    invoiceNo: "INV-2024-0001",
    patient: "Chioma Okonkwo",
    phone: "+234 803 445 6789",
    amount: 45000,
    paymentMethod: "Cash",
    agent: "Oluwaseun Adeyemi",
    status: "Pending",
  },
  {
    id: "ref-2",
    dateRequested: "2024-03-17",
    refundId: "REF-2024-002",
    invoiceNo: "INV-2024-0002",
    patient: "Emeka Obi",
    phone: "+234 805 234 5678",
    amount: 28000,
    paymentMethod: "Transfer",
    agent: "Amara Okoro",
    status: "Pending",
  },
  {
    id: "ref-3",
    dateRequested: "2024-03-16",
    refundId: "REF-2024-003",
    invoiceNo: "INV-2024-0003",
    patient: "Tunde Akinola",
    phone: "+234 812 987 6543",
    amount: 62000,
    paymentMethod: "POS",
    agent: "Zainab Mohammed",
    status: "Approved",
  },
  {
    id: "ref-4",
    dateRequested: "2024-03-15",
    refundId: "REF-2024-004",
    invoiceNo: "INV-2024-0004",
    patient: "Ngozi Eze",
    phone: "+234 816 543 2109",
    amount: 35000,
    paymentMethod: "Cash",
    agent: "Chinedu Nwankwo",
    status: "Rejected",
  },
  {
    id: "ref-5",
    dateRequested: "2024-03-14",
    refundId: "REF-2024-005",
    invoiceNo: "INV-2024-0005",
    patient: "Binta Ibrahim",
    phone: "+234 809 876 5432",
    amount: 55000,
    paymentMethod: "Transfer",
    agent: "Hauwa Abubakar",
    status: "Pending",
  },
];

const metricCards = [
  {
    label: "Total Refund Requests",
    value: "5",
    icon: <FiTrendingUp className="text-2xl text-blue-600" />,
  },
  {
    label: "Pending Requests",
    value: "3",
    icon: <FiClock className="text-2xl text-amber-500" />,
  },
  {
    label: "Approved Refunds",
    value: "1",
    icon: <FiCheckCircle className="text-2xl text-green-500" />,
  },
  {
    label: "Total Amount Requested",
    value: formatCurrency(225000),
    icon: <FiDownload className="text-2xl text-gray-700" />,
  },
];

const statusOptions: (RefundStatus | "All")[] = ["All", "Pending", "Approved", "Rejected"];
const methodOptions: (PaymentMethod | "All")[] = ["All", "Cash", "Transfer", "POS", "Insurance"];
const agentOptions: (string | "All")[] = [
  "All",
  "Oluwaseun Adeyemi",
  "Amara Okoro",
  "Zainab Mohammed",
  "Chinedu Nwankwo",
  "Hauwa Abubakar",
];
const timeOptions = ["All Time", "Today", "Last 7 Days", "Last 30 Days"] as const;

function Page() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<RefundStatus | "All">("All");
  const [method, setMethod] = useState<PaymentMethod | "All">("All");
  const [agent, setAgent] = useState<string | "All">("All");
  const [timeRange, setTimeRange] = useState<(typeof timeOptions)[number]>("All Time");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const now = new Date();
    const text = search.toLowerCase();

    return refunds.filter((item) => {
      const matchesText = [item.patient, item.phone, item.invoiceNo, item.refundId]
        .some((field) => field.toLowerCase().includes(text));

      const matchesStatus = status === "All" ? true : item.status === status;
      const matchesMethod = method === "All" ? true : item.paymentMethod === method;
      const matchesAgent = agent === "All" ? true : item.agent === agent;

      const date = new Date(item.dateRequested);
      const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      const matchesTime =
        timeRange === "All Time"
          ? true
          : timeRange === "Today"
            ? diffDays < 1
            : timeRange === "Last 7 Days"
              ? diffDays <= 7
              : diffDays <= 30;

      return matchesText && matchesStatus && matchesMethod && matchesAgent && matchesTime;
    });
  }, [agent, method, search, status, timeRange]);

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <Header
        title="Refunds Approval"
        Subtitle="Review and approve refund requests submitted by agents"
      />

      <div className="p-6 space-y-6 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {metricCards.map((card) => (
            <div
              key={card.label}
              className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between"
            >
              <div>
                <p className="text-sm text-gray-600">{card.label}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{card.value}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">{card.icon}</div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <FiSearch className="text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full outline-none text-sm bg-transparent"
              placeholder="Search by patient name, phone, invoice, or refund ID..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as RefundStatus | "All")}
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "All" ? "All Status" : option}
                </option>
              ))}
            </select>

            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod | "All")}
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium"
            >
              {methodOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "All" ? "All Methods" : option}
                </option>
              ))}
            </select>

            <select
              value={agent}
              onChange={(e) => setAgent(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium"
            >
              {agentOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "All" ? "All Agents" : option}
                </option>
              ))}
            </select>

            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as (typeof timeOptions)[number])}
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium"
            >
              {timeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-xl font-bold">Refund Requests</h2>
            <p className="text-sm text-gray-600">{filtered.length} requests</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 bg-gray-50">
                  {["Date Requested", "Refund ID", "Invoice No", "Patient", "Amount", "Payment Method", "Agent", "Status", "Actions"].map((col) => (
                    <th key={col} className="px-4 py-3 font-semibold">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-4 text-gray-700">{item.dateRequested}</td>
                    <td className="px-4 py-4 font-semibold text-gray-900">{item.refundId}</td>
                    <td className="px-4 py-4 text-gray-700">{item.invoiceNo}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-900">{item.patient}</p>
                      <p className="text-xs text-gray-500">{item.phone}</p>
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-900">{formatCurrency(item.amount)}</td>
                    <td className="px-4 py-4"><TagPill label={item.paymentMethod} tone="info" /></td>
                    <td className="px-4 py-4 text-gray-700">{item.agent}</td>
                    <td className="px-4 py-4"><StatusPill status={item.status} /></td>
                    <td className="px-4 py-4 text-right">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => setOpenMenu((prev) => (prev === item.id ? null : item.id))}
                          className="p-2 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200"
                          aria-haspopup="true"
                          aria-expanded={openMenu === item.id}
                        >
                          <FiMoreVertical className="text-gray-700" />
                        </button>

                        {openMenu === item.id ? (
                          <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                            {["View Request", "View Invoice", "Contact Agent"].map((label) => (
                              <button
                                key={label}
                                onClick={() => setOpenMenu(null)}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </td>
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
