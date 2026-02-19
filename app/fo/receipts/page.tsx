"use client";

import { useMemo, useState } from "react";
import Header from "@/components/Header";
import TagPill from "@/components/TagPill";
import StatusPill from "@/components/StatusPill";
import { formatCurrency } from "@/libs/helper";
import { FiSearch, FiChevronDown, FiMoreVertical, FiRefreshCcw } from "react-icons/fi";

type ReceiptStatus = "Pending" | "Approved" | "Rejected";

interface ReceiptItem {
  id: string;
  requestDate: string;
  receiptId: string;
  invoiceNo: string;
  patient: string;
  amount: number;
  paymentMethod: "Cash" | "Transfer" | "POS" | "Insurance";
  requestedBy: string;
  status: ReceiptStatus;
}

const metrics = [
  { label: "Total Receipts Generated", value: "5" },
  { label: "Pending Receipt Requests", value: "2", tone: "text-amber-600" },
  { label: "Approved Receipts", value: "2", tone: "text-green-600" },
  { label: "Rejected Receipt Requests", value: "1", tone: "text-red-600" },
  { label: "Total Receipt Value", value: formatCurrency(690000), tone: "text-blue-700" },
];

const receipts: ReceiptItem[] = [
  {
    id: "rec-1",
    requestDate: "2024-02-18",
    receiptId: "REC-2024-001",
    invoiceNo: "INV-202401001",
    patient: "Chioma Okafor",
    amount: 150000,
    paymentMethod: "Transfer",
    requestedBy: "Adekunle Adeyemi",
    status: "Pending",
  },
  {
    id: "rec-2",
    requestDate: "2024-02-14",
    receiptId: "REC-2024-005",
    invoiceNo: "INV-202401005",
    patient: "Blessing Osei",
    amount: 95000,
    paymentMethod: "Cash",
    requestedBy: "Adekunle Adeyemi",
    status: "Pending",
  },
  {
    id: "rec-3",
    requestDate: "2024-02-12",
    receiptId: "REC-2024-009",
    invoiceNo: "INV-202400992",
    patient: "Ibrahim Musa",
    amount: 122000,
    paymentMethod: "POS",
    requestedBy: "Kemi Adesina",
    status: "Approved",
  },
  {
    id: "rec-4",
    requestDate: "2024-02-10",
    receiptId: "REC-2024-010",
    invoiceNo: "INV-202400910",
    patient: "Chidera Nwosu",
    amount: 80000,
    paymentMethod: "Insurance",
    requestedBy: "Adekunle Adeyemi",
    status: "Rejected",
  },
];

const tabs: { key: ReceiptStatus | "All"; label: string }[] = [
  { key: "Pending", label: "Pending Requests" },
  { key: "Approved", label: "Approved Receipts" },
  { key: "Rejected", label: "Rejected Receipts" },
  { key: "All", label: "All" },
];

function Page() {
  const [activeTab, setActiveTab] = useState<ReceiptStatus | "All">("Pending");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const filteredReceipts = useMemo(() => {
    if (activeTab === "All") return receipts;
    return receipts.filter((r) => r.status === activeTab);
  }, [activeTab]);

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <Header
        title="Receipts Approval"
        Subtitle="View and manage all hospital receipts and invoices"
      />

      <div className="p-6 space-y-6 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-2"
            >
              <p className="text-sm text-gray-600">{metric.label}</p>
              <span className={`text-3xl font-bold ${metric.tone ?? "text-slate-900"}`}>
                {metric.value}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                activeTab === tab.key
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col xl:flex-row gap-4 items-stretch">
          <div className="flex-1">
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
              <FiSearch className="text-gray-500" />
              <input
                className="w-full outline-none text-sm bg-transparent"
                placeholder="Search by patient name, invoice, or receipt"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <select className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium min-w-36 shadow-sm">
              <option>All Status</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>

            <select className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium min-w-44 shadow-sm">
              <option>All Payment Methods</option>
              <option>Cash</option>
              <option>Transfer</option>
              <option>POS</option>
              <option>Insurance</option>
            </select>

            <select className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium min-w-32 shadow-sm">
              <option>All Agents</option>
              <option>Adekunle Adeyemi</option>
              <option>Kemi Adesina</option>
            </select>

            <button className="bg-white border border-gray-200 rounded-xl px-5 py-3 text-sm font-semibold flex items-center justify-center gap-2 shadow-sm hover:bg-gray-50">
              <FiRefreshCcw className="text-lg" /> Refresh
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 bg-gray-50">
                  {["Request Date", "Receipt ID", "Invoice No", "Patient", "Amount", "Payment Method", "Requested By", "Status", "Actions"].map((col) => (
                    <th key={col} className="px-4 py-3 font-semibold">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredReceipts.map((receipt) => (
                  <tr key={receipt.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-4 text-gray-700">{receipt.requestDate}</td>
                    <td className="px-4 py-4 font-semibold text-gray-900">{receipt.receiptId}</td>
                    <td className="px-4 py-4 text-gray-700">{receipt.invoiceNo}</td>
                    <td className="px-4 py-4 font-semibold text-gray-900">{receipt.patient}</td>
                    <td className="px-4 py-4 font-semibold text-slate-900">{formatCurrency(receipt.amount)}</td>
                    <td className="px-4 py-4"><TagPill label={receipt.paymentMethod} tone="default" /></td>
                    <td className="px-4 py-4 text-gray-700">{receipt.requestedBy}</td>
                    <td className="px-4 py-4"><StatusPill status={receipt.status} /></td>
                    <td className="px-4 py-4 text-right">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() =>
                            setOpenMenu((prev) => (prev === receipt.id ? null : receipt.id))
                          }
                          className="p-2 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200"
                          aria-haspopup="true"
                          aria-expanded={openMenu === receipt.id}
                        >
                          <FiMoreVertical className="text-gray-700" />
                        </button>

                        {openMenu === receipt.id ? (
                          <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                            {["View Receipt", "View Invoice", "View Transaction"].map((label) => (
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
