"use client";

import Header from "@/components/Header";
import React from "react";
import StatusPill from "@/components/StatusPill";
import TagPill from "@/components/TagPill";
import NewTransactionModal from "@/components/NewTransactionModal";
import {
  FiDownload,
  FiMoreVertical,
  FiPlus,
  FiEye,
  FiPrinter,
  FiRefreshCcw,
  FiFlag,
} from "react-icons/fi";

type TransactionStatus = "Paid" | "Pending" | "Refunded";
type PaymentMethod = "Cash" | "Transfer" | "POS";

interface TransactionRow {
  id: string;
  patient: string;
  phone: string;
  invoiceNo: string;
  revenueHead: string;
  department: string;
  amount: number;
  payment: PaymentMethod;
  status: TransactionStatus;
  dateTime: string;
}

function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function Page() {
  const [openNewTransaction, setOpenNewTransaction] = React.useState(false);

  const transactions: TransactionRow[] = [
    {
      id: "t1",
      patient: "John Anderson",
      phone: "+1234567890",
      invoiceNo: "INV-2024-001",
      revenueHead: "Consultation",
      department: "General Medicine",
      amount: 250,
      payment: "Cash",
      status: "Paid",
      dateTime: "2024-02-15 10:30 AM",
    },
    {
      id: "t2",
      patient: "Sarah Mitchell",
      phone: "+1234567891",
      invoiceNo: "INV-2024-002",
      revenueHead: "Lab Test",
      department: "Pathology",
      amount: 350,
      payment: "Transfer",
      status: "Paid",
      dateTime: "2024-02-15 09:15 AM",
    },
    {
      id: "t3",
      patient: "Robert Chen",
      phone: "+1234567892",
      invoiceNo: "INV-2024-003",
      revenueHead: "Admission",
      department: "Surgery",
      amount: 1500,
      payment: "POS",
      status: "Pending",
      dateTime: "2024-02-14 02:45 PM",
    },
    {
      id: "t4",
      patient: "Emma Wilson",
      phone: "+1234567893",
      invoiceNo: "INV-2024-004",
      revenueHead: "Scan",
      department: "Radiology",
      amount: 150,
      payment: "Cash",
      status: "Paid",
      dateTime: "2024-02-14 11:20 AM",
    },
    {
      id: "t5",
      patient: "Michael Brown",
      phone: "+1234567894",
      invoiceNo: "INV-2024-005",
      revenueHead: "Drugs",
      department: "Pharmacy",
      amount: 200,
      payment: "Transfer",
      status: "Pending",
      dateTime: "2024-02-13 03:50 PM",
    },
    {
      id: "t6",
      patient: "John Anderson",
      phone: "+1234567890",
      invoiceNo: "INV-2024-006",
      revenueHead: "Lab Test",
      department: "Pathology",
      amount: 500,
      payment: "Cash",
      status: "Refunded",
      dateTime: "2024-02-12 04:30 PM",
    },
  ];

  const [openMenu, setOpenMenu] = React.useState<string | null>(null);

  return (
    <div className="h-screen w-full bg-gray-100 overflow-y-auto">
      <Header
        title="Transactions"
        Subtitle="Create and manage patient payments"
      />

      <div className="p-6 space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Status</p>
              <select className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium">
                <option>All</option>
                <option>Paid</option>
                <option>Pending</option>
                <option>Refunded</option>
              </select>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </p>
              <select className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium">
                <option>All</option>
                <option>Cash</option>
                <option>Transfer</option>
                <option>POS</option>
              </select>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Date Range
              </p>
              <select className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium">
                <option>Today</option>
                <option>Yesterday</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>

            <div>
              <button
                className="w-full md:w-auto bg-blue-700 hover:bg-blue-800 text-white font-medium px-5 py-3 rounded-xl flex items-center justify-center gap-2"
                onClick={() => setOpenNewTransaction(true)}
              >
                <FiPlus className="text-lg" /> New Transaction
              </button>
            </div>

            <div>
              <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium px-5 py-3 rounded-xl flex items-center justify-center gap-2 border border-gray-200">
                <FiDownload className="text-lg" /> Export
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-xl font-bold">All Transactions</h2>
            <p className="text-sm text-gray-600">
              {transactions.length} transactions
            </p>
          </div>

          <div className="p-5 overflow-x-auto">
            <table className="min-w-195 w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 bg-gray-100">
                  <th className="p-3 font-semibold">Patient</th>
                  <th className="p-3 font-semibold">Phone</th>
                  <th className="p-3 font-semibold">Invoice No</th>
                  <th className="p-3 font-semibold">Revenue Head</th>
                  <th className="p-3 font-semibold">Department</th>
                  <th className="p-3 font-semibold">Amount</th>
                  <th className="p-3 font-semibold">Payment</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Date/Time</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100">
                    <td className="p-3 font-semibold text-gray-900">
                      {t.patient}
                    </td>
                    <td className="p-3 text-gray-700">{t.phone}</td>
                    <td className="p-3 text-gray-700">{t.invoiceNo}</td>
                    <td className="p-3 text-gray-700">{t.revenueHead}</td>
                    <td className="p-3 text-gray-700">{t.department}</td>
                    <td className="p-3 text-gray-900 font-semibold">
                      {formatUsd(t.amount)}
                    </td>
                    <td className="p-3">
                      <TagPill label={t.payment} />
                    </td>
                    <td className="p-3">
                      <StatusPill status={t.status} />
                    </td>
                    <td className="p-3 text-gray-700">{t.dateTime}</td>
                    <td className="p-3 text-right">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() =>
                            setOpenMenu((prev) => (prev === t.id ? null : t.id))
                          }
                          className="p-2 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200"
                          aria-haspopup="true"
                          aria-expanded={openMenu === t.id}
                        >
                          <FiMoreVertical className="text-gray-700" />
                        </button>

                        {openMenu === t.id ? (
                          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                            {[
                              {
                                label: "View Details",
                                icon: <FiEye className="text-gray-600" />,
                                tone: "text-gray-800",
                              },
                              {
                                label: "Print Receipt",
                                icon: <FiPrinter className="text-gray-600" />,
                                tone: "text-gray-800",
                              },
                              {
                                label: "Request Refund",
                                icon: <FiRefreshCcw className="text-red-500" />,
                                tone: "text-red-600",
                              },
                              {
                                label: "Flag Transaction",
                                icon: <FiFlag className="text-gray-600" />,
                                tone: "text-gray-800",
                              },
                            ].map((item, idx) => (
                              <button
                                key={item.label}
                                onClick={() => setOpenMenu(null)}
                                className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${
                                  item.tone
                                } ${idx === 2 ? "hover:bg-red-50" : "hover:bg-gray-50"}`}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <NewTransactionModal
        open={openNewTransaction}
        onClose={() => setOpenNewTransaction(false)}
      />
    </div>
  );
}

export default Page;
