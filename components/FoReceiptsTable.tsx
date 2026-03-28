"use client";

import StatusPill from "@/components/StatusPill";
import { formatNaira } from "@/libs/helper";
import type { FoReceiptItem } from "@/libs/type";
import { FiCheck, FiEye, FiMoreVertical, FiX } from "react-icons/fi";

function toReceiptStatus(status: FoReceiptItem["status"]) {
  if (status === "pending") return "Pending" as const;
  if (status === "approved") return "Approved" as const;
  return "Rejected" as const;
}

type Props = {
  rows: FoReceiptItem[];
  isLoading?: boolean;
  openMenu: string | null;
  onOpenMenu: (value: string | null) => void;
  onView: (receipt: FoReceiptItem) => void;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
};

function FoReceiptsTable({
  rows,
  isLoading = false,
  openMenu,
  onOpenMenu,
  onView,
  onApprove,
  onReject,
}: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-600 dark:bg-slate-800 dark:text-slate-300">
              {[
                "Receipt No",
                "Patient",
                "Amount",
                "Agent Email",
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
            {isLoading ? (
              <tr>
                <td
                  className="px-4 py-4 text-gray-500 dark:text-slate-400"
                  colSpan={6}
                >
                  Loading receipt requests...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-4 text-gray-500 dark:text-slate-400"
                  colSpan={6}
                >
                  No receipt requests found for the current filter.
                </td>
              </tr>
            ) : (
              rows.map((receipt) => (
                <tr
                  key={receipt.request_id}
                  className="border-t border-gray-100 hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                >
                  <td className="whitespace-nowrap px-4 py-4 font-semibold text-gray-900 dark:text-slate-100">
                    {receipt.receipt_no}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 font-semibold text-gray-900 dark:text-slate-100">
                    {receipt.patient_name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 font-semibold text-gray-900 dark:text-slate-100">
                    {formatNaira(receipt.amount)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-gray-700 dark:text-slate-300">
                    {receipt.agent_email}
                  </td>
                  <td className="px-4 py-4 text-gray-700 dark:text-slate-300">
                    {receipt.reason}
                  </td>
                  <td className="px-4 py-4">
                    <StatusPill status={toReceiptStatus(receipt.status)} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="relative inline-block text-left">
                      <button
                        onClick={() =>
                          onOpenMenu(
                            openMenu === receipt.request_id
                              ? null
                              : receipt.request_id,
                          )
                        }
                        className="rounded-lg border border-transparent p-2 hover:border-gray-200 hover:bg-gray-100 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                        aria-haspopup="true"
                        aria-expanded={openMenu === receipt.request_id}
                        type="button"
                      >
                        <FiMoreVertical className="text-gray-700 dark:text-slate-200" />
                      </button>

                      {openMenu === receipt.request_id ? (
                        <div className="absolute right-0 z-10 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                          {[
                            {
                              label: "View Request",
                              icon: (
                                <FiEye className="text-gray-600 dark:text-slate-300" />
                              ),
                              onClick: () => onView(receipt),
                              show: true,
                            },
                            {
                              label: "Approve",
                              icon: (
                                <FiCheck className="text-gray-600 dark:text-slate-300" />
                              ),
                              onClick: () => onApprove(receipt.request_id),
                              show: receipt.status === "pending",
                            },
                            {
                              label: "Reject",
                              icon: (
                                <FiX className="text-gray-600 dark:text-slate-300" />
                              ),
                              onClick: () => onReject(receipt.request_id),
                              show: receipt.status === "pending",
                            },
                          ]
                            .filter((item) => item.show)
                            .map((item) => (
                              <button
                                key={item.label}
                                onClick={() => {
                                  item.onClick();
                                  onOpenMenu(null);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                aria-label={item.label}
                                type="button"
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { toReceiptStatus };
export default FoReceiptsTable;
