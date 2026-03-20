"use client";

import { useEffect, useState } from "react";
import { formatUsd } from "@/libs/helper";
import { ReceiptRow } from "@/libs/type";
import TagPill from "@/components/TagPill";
import StatusPill from "@/components/StatusPill";
import PrintReceipt from "@/components/PrintReceipt";
import {
  FiMoreVertical,
  FiEye,
  FiExternalLink,
  FiPrinter,
  FiRefreshCcw,
  FiSend,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { seedReceipts } from "@/libs/data";

function ReceiptLists() {
  const [rows, setRows] = useState<ReceiptRow[]>(seedReceipts);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [viewing, setViewing] = useState<ReceiptRow | null>(null);
  const [printing, setPrinting] = useState<ReceiptRow | null>(null);
  const [requesting, setRequesting] = useState<{
    id: string;
    mode: "request" | "again";
  } | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!printing) return;
    const id = window.setTimeout(() => {
      window.print();
      setPrinting(null);
    }, 50);
    return () => window.clearTimeout(id);
  }, [printing]);

  const submitRequest = () => {
    const trimmed = reason.trim();
    if (!requesting) return;
    if (!trimmed) {
      toast.error("Please enter a reason.");
      return;
    }

    const now = new Date();
    const timestamp = now.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    setRows((prev) =>
      prev.map((r) =>
        r.id === requesting.id
          ? {
              ...r,
              status: "Pending",
              requestedAt: timestamp,
              lastRequestReason: trimmed,
            }
          : r,
      ),
    );

    toast.success("Receipt request submitted (local preview only). ");
    setRequesting(null);
    setReason("");
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="print:hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold">All Receipts</h2>
          <p className="text-sm text-gray-600">
            Showing {rows.length} receipts
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
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-100">
                  <td className="p-3 font-semibold text-gray-900">
                    {r.receiptId ?? "—"}
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
                  <td className="p-3 text-gray-700">{r.issuedAt ?? "—"}</td>
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
                          {(
                            [
                              ...(r.status === "Approved"
                                ? [
                                    {
                                      label: "View Receipt",
                                      icon: <FiEye className="text-gray-600" />,
                                      onClick: () => setViewing(r),
                                      disabled: false,
                                    },
                                    {
                                      label: "Print Receipt",
                                      icon: (
                                        <FiPrinter className="text-gray-600" />
                                      ),
                                      onClick: () => {
                                        setViewing(null);
                                        setPrinting(r);
                                      },
                                      disabled: false,
                                    },
                                    {
                                      label: "Request Receipt Again",
                                      icon: (
                                        <FiRefreshCcw className="text-gray-600" />
                                      ),
                                      onClick: () =>
                                        setRequesting({
                                          id: r.id,
                                          mode: "again",
                                        }),
                                      disabled: false,
                                    },
                                  ]
                                : r.status === "Not Requested"
                                  ? [
                                      {
                                        label: "Request Receipt",
                                        icon: (
                                          <FiSend className="text-gray-600" />
                                        ),
                                        onClick: () =>
                                          setRequesting({
                                            id: r.id,
                                            mode: "request",
                                          }),
                                        disabled: false,
                                      },
                                    ]
                                  : r.status === "Rejected"
                                    ? [
                                        {
                                          label: "Request Receipt Again",
                                          icon: (
                                            <FiRefreshCcw className="text-gray-600" />
                                          ),
                                          onClick: () =>
                                            setRequesting({
                                              id: r.id,
                                              mode: "again",
                                            }),
                                          disabled: false,
                                        },
                                      ]
                                    : [
                                        {
                                          label: "Receipt Requested",
                                          icon: (
                                            <FiSend className="text-gray-600" />
                                          ),
                                          onClick: () => {},
                                          disabled: true,
                                        },
                                      ]),
                              {
                                label: "View Transaction",
                                icon: (
                                  <FiExternalLink className="text-gray-600" />
                                ),
                                onClick: () => {},
                                disabled: false,
                              },
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

        {requesting ? (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-2xl">
              <div className="p-5 border-b border-gray-200">
                <h3 className="text-lg font-bold">
                  {requesting.mode === "again"
                    ? "Request Receipt Again"
                    : "Request Receipt"}
                </h3>
                <p className="text-sm text-gray-600">
                  Provide a short reason for this request.
                </p>
              </div>

              <div className="p-5 space-y-2">
                <label className="text-sm font-semibold text-gray-800">
                  Reason
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full min-h-28 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="E.g. Patient needs receipt for insurance claim"
                />
              </div>

              <div className="p-5 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setRequesting(null);
                    setReason("");
                  }}
                  className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRequest}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium"
                  type="button"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {viewing ? (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-2xl">
              <div className="p-5 border-b border-gray-200 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold">Receipt</h3>
                  <p className="text-sm text-gray-600">
                    {viewing.receiptId ?? "Receipt ID pending"}
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
                    <p className="text-sm text-gray-600">Issued At</p>
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      {viewing.issuedAt ?? "—"}
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

                <div className="border border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <div className="mt-2">
                    <TagPill label={viewing.paymentMethod} tone="info" />
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => setViewing(null)}
                  className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50"
                  type="button"
                >
                  Close
                </button>
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
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {printing ? <PrintReceipt receipt={printing} /> : null}
    </div>
  );
}

export default ReceiptLists
