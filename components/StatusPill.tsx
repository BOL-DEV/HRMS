import React from "react";

interface Props {
  status:
    | "Paid"
    | "Pending"
    | "Refund"
    | "Refunded"
    | "Refund Requested"
    | "Failed"
    | "Active"
    | "Inactive"
    | "Suspended"
    | "Approved"
    | "Rejected"
    | "Not Requested";
}

function StatusPill({ status }: Props) {
  const tone =
    status === "Paid" || status === "Active"
      ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300"
      : status === "Pending"
        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300"
        : status === "Not Requested"
          ? "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-200"
          : status === "Approved"
            ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300"
            : status === "Rejected"
              ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
              : status === "Suspended"
                ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
                : status === "Refunded"
                  ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
                  : status === "Refund"
                    ? "bg-blue-100 text-blue-700 dark:bg-sky-500/15 dark:text-sky-300"
                    : status === "Refund Requested"
                      ? "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300"
                      : status === "Inactive"
                        ? "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-200"
                        : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tone}`}>
      {status}
    </span>
  );
}

export default StatusPill;
