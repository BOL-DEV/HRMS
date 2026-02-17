"use client";

import React, { useState } from "react";
import { formatUsd } from "@/libs/helper";
import { ReceiptRow } from "@/libs/type";
import TagPill from "@/components/TagPill";
import StatusPill from "@/components/StatusPill";
import {
  FiMoreVertical,
  FiEye,
  FiPrinter,
  FiDownload,
  FiLink,
  FiExternalLink,
} from "react-icons/fi";


const receipts: ReceiptRow[] = [
  {
    id: "r1",
    receiptId: "RCP-2024-001",
    invoiceNo: "INV-2024-001",
    patientName: "John Anderson",
    amount: 250,
    paymentMethod: "Cash",
    status: "Paid",
    dateIssued: "2024-02-15 10:30 AM",
  },
  {
    id: "r2",
    receiptId: "RCP-2024-002",
    invoiceNo: "INV-2024-002",
    patientName: "Sarah Mitchell",
    amount: 1500,
    paymentMethod: "Insurance",
    status: "Paid",
    dateIssued: "2024-02-15 09:15 AM",
  },
  {
    id: "r3",
    receiptId: "RCP-2024-003",
    invoiceNo: "INV-2024-003",
    patientName: "Robert Chen",
    amount: 350,
    paymentMethod: "POS",
    status: "Pending",
    dateIssued: "2024-02-14 02:45 PM",
  },
  {
    id: "r4",
    receiptId: "RCP-2024-004",
    invoiceNo: "INV-2024-004",
    patientName: "Emma Wilson",
    amount: 150,
    paymentMethod: "Transfer",
    status: "Paid",
    dateIssued: "2024-02-14 11:20 AM",
  },
  {
    id: "r5",
    receiptId: "RCP-2024-005",
    invoiceNo: "INV-2024-005",
    patientName: "Michael Brown",
    amount: 200,
    paymentMethod: "Cash",
    status: "Refunded",
    dateIssued: "2024-02-13 03:50 PM",
  },
  {
    id: "r6",
    receiptId: "RCP-2024-006",
    invoiceNo: "INV-2024-006",
    patientName: "Jennifer Lee",
    amount: 120,
    paymentMethod: "POS",
    status: "Paid",
    dateIssued: "2024-02-13 01:15 PM",
  },
  {
    id: "r7",
    receiptId: "RCP-2024-007",
    invoiceNo: "INV-2024-007",
    patientName: "Thomas Wilson",
    amount: 300,
    paymentMethod: "Insurance",
    status: "Paid",
    dateIssued: "2024-02-12 04:30 PM",
  },
  {
    id: "r8",
    receiptId: "RCP-2024-008",
    invoiceNo: "INV-2024-008",
    patientName: "Maria Garcia",
    amount: 75,
    paymentMethod: "Cash",
    status: "Paid",
    dateIssued: "2024-02-12 10:00 AM",
  },
];


function ReceiptLists() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold">All Receipts</h2>
          <p className="text-sm text-gray-600">
            Showing {receipts.length} receipts
          </p>
        </div>

        <div className="p-5 overflow-x-auto">
          <table className="min-w-195 w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 bg-gray-100">
                <th className="p-3 font-semibold">Receipt ID</th>
                <th className="p-3 font-semibold">Invoice No</th>
                <th className="p-3 font-semibold">Patient Name</th>
                <th className="p-3 font-semibold">Amount</th>
                <th className="p-3 font-semibold">Payment Method</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Date Issued</th>
                <th className="p-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {receipts.map((r) => (
                <tr key={r.id} className="border-b border-gray-100">
                  <td className="p-3 font-semibold text-gray-900">
                    {r.receiptId}
                  </td>
                  <td className="p-3 text-gray-700">{r.invoiceNo}</td>
                  <td className="p-3 font-semibold text-gray-900">
                    {r.patientName}
                  </td>
                  <td className="p-3 font-semibold text-blue-700">
                    {formatUsd(r.amount)}
                  </td>
                  <td className="p-3">
                    <TagPill label={r.paymentMethod} tone="info" />
                  </td>
                  <td className="p-3">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="p-3 text-gray-700">{r.dateIssued}</td>
                  <td className="p-3 text-right">
                    <div className="relative inline-block text-left">
                      <button
                        onClick={() =>
                          setOpenMenu((prev) => (prev === r.id ? null : r.id))
                        }
                        className="p-2 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200"
                        aria-haspopup="true"
                        aria-expanded={openMenu === r.id}
                      >
                        <FiMoreVertical className="text-gray-700" />
                      </button>

                      {openMenu === r.id ? (
                        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                          {[{ label: "View Receipt", icon: <FiEye className="text-gray-600" />, tone: "text-gray-800" },
                            { label: "Print Receipt", icon: <FiPrinter className="text-gray-600" />, tone: "text-gray-800" },
                            { label: "Download PDF", icon: <FiDownload className="text-gray-600" />, tone: "text-gray-800" },
                            { label: "Copy Receipt Link", icon: <FiLink className="text-gray-600" />, tone: "text-gray-800" },
                            { label: "View Transaction", icon: <FiExternalLink className="text-gray-600" />, tone: "text-gray-800" },
                          ].map((item) => (
                            <button
                              key={item.label}
                              onClick={() => setOpenMenu(null)}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50"
                              aria-label={item.label}
                            >
                              {item.icon}
                              <span className={item.tone}>{item.label}</span>
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
    );
}

export default ReceiptLists
