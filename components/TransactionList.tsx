"use client";

import { useState } from "react";
import {
  FiMoreVertical,
  FiEye,
  FiPrinter,
  FiRefreshCcw,
  FiFlag,
} from "react-icons/fi";
import StatusPill from "@/components/StatusPill";
import TagPill from "@/components/TagPill";
import { formatUsd } from "@/libs/helper";
import {transactions} from "@/libs/data"




function TransactionList() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);


    return (
      <div className="p-5 overflow-x-auto">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold">All Transactions</h2>
          <p className="text-sm text-gray-600">
            {transactions.length} transactions
          </p>
        </div>

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
                <td className="p-3 font-semibold text-gray-900">{t.patient}</td>
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
                            label: "Request Print Receipt",
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
    );
}

export default TransactionList
