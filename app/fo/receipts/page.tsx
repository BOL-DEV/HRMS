"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import TagPill from "@/components/TagPill";
import StatusPill from "@/components/StatusPill";
import PrintReceipt from "@/components/PrintReceipt";
import { formatUsd } from "@/libs/helper";
import { seedReceipts } from "@/libs/data";
import { ReceiptRow } from "@/libs/type";
import { toast } from "react-hot-toast";
import {
  FiSearch,
  FiMoreVertical,
  FiRefreshCcw,
  FiEye,
  FiPrinter,
  FiCheck,
  FiX,
} from "react-icons/fi";

type ReceiptStatus = "Pending" | "Approved" | "Rejected";

const tabs: { key: ReceiptStatus | "All"; label: string }[] = [
  { key: "Pending", label: "Pending Requests" },
  { key: "Approved", label: "Approved" },
  { key: "Rejected", label: "Rejected" },
  { key: "All", label: "All" },
];

function nowTimestamp() {
  const now = new Date();
  return now.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function nextReceiptId() {
  const year = new Date().getFullYear();
  const suffix = String(Date.now()).slice(-3);
  return `RCP-${year}-${suffix}`;
}

function isReprintRequest(r: ReceiptRow) {
  return Boolean(
    r.issuedAt &&
    r.receiptId &&
    (r.status === "Pending" || r.status === "Rejected"),
  );
}

function Page() {
  const [activeTab, setActiveTab] = useState<ReceiptStatus | "All">("Pending");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [rows, setRows] = useState<ReceiptRow[]>(
    seedReceipts.filter((r) => r.status !== "Not Requested"),
  );
  const [viewing, setViewing] = useState<ReceiptRow | null>(null);
  const [printing, setPrinting] = useState<ReceiptRow | null>(null);

  useEffect(() => {
    if (!printing) return;
    const id = window.setTimeout(() => {
      window.print();
      setPrinting(null);
    }, 50);
    return () => window.clearTimeout(id);
  }, [printing]);

  const filteredReceipts = useMemo(() => {
    const text = query.trim().toLowerCase();
    const base =
      activeTab === "All" ? rows : rows.filter((r) => r.status === activeTab);
    if (!text) return base;
    return base.filter((r) =>
      [r.patientName, r.invoiceNo, r.receiptId ?? ""].some((v) =>
        v.toLowerCase().includes(text),
      ),
    );
  }, [activeTab, query, rows]);

  const metrics = useMemo(() => {
    const pending = rows.filter((r) => r.status === "Pending").length;
    const approved = rows.filter((r) => r.status === "Approved").length;
    const rejected = rows.filter((r) => r.status === "Rejected").length;
    const totalValue = rows.reduce((sum, r) => sum + (r.amount || 0), 0);
    return [
      { label: "Total Receipt Requests", value: String(rows.length) },
      {
        label: "Pending Requests",
        value: String(pending),
        tone: "text-amber-600",
      },
      { label: "Approved", value: String(approved), tone: "text-green-600" },
      { label: "Rejected", value: String(rejected), tone: "text-red-600" },
      {
        label: "Total Request Value",
        value: formatUsd(totalValue),
        tone: "text-blue-700",
      },
    ];
  }, [rows]);

  const approveRequest = (r: ReceiptRow) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === r.id
          ? {
              ...row,
              status: "Approved",
              receiptId: row.receiptId ?? nextReceiptId(),
              issuedAt: row.issuedAt ?? nowTimestamp(),
            }
          : row,
      ),
    );
    toast.success("Receipt request approved (local preview only). ");
  };

  const rejectRequest = (r: ReceiptRow) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === r.id ? { ...row, status: "Rejected" } : row,
      ),
    );
    toast.success("Receipt request rejected (local preview only). ");
  };

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <Header
        title="Receipts Approval"
        Subtitle="View and manage all hospital receipts and invoices"
      />

      <div className="p-6 space-y-6 w-full print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-2"
            >
              <p className="text-sm text-gray-600">{metric.label}</p>
              <span
                className={`text-3xl font-bold ${metric.tone ?? "text-slate-900"}`}
              >
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
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button className="bg-white border border-gray-200 rounded-xl px-5 py-3 text-sm font-semibold flex items-center justify-center gap-2 shadow-sm hover:bg-gray-50">
              <FiRefreshCcw className="text-lg" /> Refresh
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-300 w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 bg-gray-50">
                  {[
                    "Requested At",
                    "Receipt ID",
                    "Invoice No",
                    "Patient",
                    "Amount",
                    "Payment Method",
                    "Reason",
                    "Status",
                    "Actions",
                  ].map((col) => (
                    <th key={col} className="px-4 py-3 font-semibold">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredReceipts.map((receipt) => (
                  <tr
                    key={receipt.id}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-4 text-gray-700 whitespace-nowrap">
                      {receipt.requestedAt ?? "—"}
                    </td>
                    <td className="px-4 py-4 font-semibold text-gray-900 whitespace-nowrap">
                      {receipt.receiptId ?? "—"}
                    </td>
                    <td className="px-4 py-4 text-gray-700 whitespace-nowrap">
                      {receipt.invoiceNo}
                    </td>
                    <td className="px-4 py-4 font-semibold text-gray-900 whitespace-nowrap">
                      {receipt.patientName}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-900 whitespace-nowrap">
                      {formatUsd(receipt.amount)}
                    </td>
                    <td className="px-4 py-4">
                      <TagPill label={receipt.paymentMethod} tone="default" />
                    </td>
                    <td className="px-4 py-4 text-gray-700">
                      <div className="max-w-105">
                        {isReprintRequest(receipt) ? (
                          <span className="font-semibold text-gray-900">
                            Reprint:
                          </span>
                        ) : (
                          <span className="font-semibold text-gray-900">
                            Issue:
                          </span>
                        )}{" "}
                        {receipt.lastRequestReason ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusPill status={receipt.status} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() =>
                            setOpenMenu((prev) =>
                              prev === receipt.id ? null : receipt.id,
                            )
                          }
                          className="p-2 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200"
                          aria-haspopup="true"
                          aria-expanded={openMenu === receipt.id}
                        >
                          <FiMoreVertical className="text-gray-700" />
                        </button>

                        {openMenu === receipt.id ? (
                          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                            {(
                              [
                                {
                                  label:
                                    receipt.status === "Approved"
                                      ? "View Receipt"
                                      : "View Request",
                                  icon: <FiEye className="text-gray-600" />,
                                  onClick: () => setViewing(receipt),
                                  disabled: false,
                                },
                                ...(receipt.status === "Approved"
                                  ? [
                                      {
                                        label: "Print Receipt",
                                        icon: (
                                          <FiPrinter className="text-gray-600" />
                                        ),
                                        onClick: () => setPrinting(receipt),
                                        disabled: false,
                                      },
                                    ]
                                  : []),
                                ...(receipt.status === "Pending"
                                  ? [
                                      {
                                        label: "Approve",
                                        icon: (
                                          <FiCheck className="text-gray-600" />
                                        ),
                                        onClick: () => approveRequest(receipt),
                                        disabled: false,
                                      },
                                      {
                                        label: "Reject",
                                        icon: <FiX className="text-gray-600" />,
                                        onClick: () => rejectRequest(receipt),
                                        disabled: false,
                                      },
                                    ]
                                  : []),
                              ] as const
                            ).map((item) => (
                              <button
                                key={item.label}
                                onClick={() => {
                                  if (item.disabled) return;
                                  item.onClick();
                                  setOpenMenu(null);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 ${
                                  item.disabled
                                    ? "opacity-60 cursor-not-allowed"
                                    : ""
                                }`}
                                aria-label={item.label}
                                aria-disabled={item.disabled}
                              >
                                {item.icon}
                                <span className="text-gray-800">
                                  {item.label}
                                </span>
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

        {viewing ? (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-2xl">
              <div className="p-5 border-b border-gray-200 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold">
                    {viewing.status === "Approved"
                      ? "Receipt"
                      : "Receipt Request"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {viewing.receiptId
                      ? `Receipt ID: ${viewing.receiptId}`
                      : "Receipt ID: —"}
                  </p>
                </div>
                <button
                  onClick={() => setViewing(null)}
                  className="text-gray-600 hover:text-gray-900 text-lg"
                  aria-label="Close"
                  type="button"
                >
                  ×
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-xl p-4">
                    <p className="text-sm text-gray-600">Invoice No</p>
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      {viewing.invoiceNo}
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-4">
                    <p className="text-sm text-gray-600">Requested At</p>
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      {viewing.requestedAt ?? "—"}
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-4">
                    <p className="text-sm text-gray-600">Patient</p>
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      {viewing.patientName}
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-4">
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="text-base font-semibold text-blue-700 mt-1">
                      {formatUsd(viewing.amount)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-xl p-4">
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <div className="mt-2">
                      <TagPill label={viewing.paymentMethod} tone="info" />
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-4">
                    <p className="text-sm text-gray-600">Status</p>
                    <div className="mt-2">
                      <StatusPill status={viewing.status} />
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-600">Reason</p>
                  <p className="text-sm font-semibold text-gray-900 mt-2">
                    {isReprintRequest(viewing) ? "Reprint" : "Issue"}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    {viewing.lastRequestReason ?? "—"}
                  </p>
                </div>

                {viewing.status === "Approved" ? (
                  <div className="border border-gray-200 rounded-xl p-4">
                    <p className="text-sm text-gray-600">Issued At</p>
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      {viewing.issuedAt ?? "—"}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="p-5 border-t border-gray-200 flex items-center justify-end gap-3">
                {viewing.status === "Pending" ? (
                  <>
                    <button
                      onClick={() => {
                        rejectRequest(viewing);
                        setViewing(null);
                      }}
                      className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50"
                      type="button"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        approveRequest(viewing);
                        setViewing(null);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium"
                      type="button"
                    >
                      Approve
                    </button>
                  </>
                ) : viewing.status === "Approved" ? (
                  <button
                    onClick={() => {
                      setViewing(null);
                      setPrinting(viewing);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium inline-flex items-center gap-2"
                    type="button"
                  >
                    <FiPrinter /> Print
                  </button>
                ) : (
                  <button
                    onClick={() => setViewing(null)}
                    className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50"
                    type="button"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {printing ? <PrintReceipt receipt={printing} /> : null}
    </div>
  );
}

export default Page;
