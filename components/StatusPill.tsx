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
    | "Rejected";
}

function StatusPill({ status }: Props) {
  const tone =
    status === "Paid" || status === "Active"
      ? "bg-green-100 text-green-700"
      : status === "Pending"
        ? "bg-yellow-100 text-yellow-700"
      : status === "Approved"
        ? "bg-green-100 text-green-700"
        : status === "Rejected"
          ? "bg-red-100 text-red-700"
          : status === "Suspended"
            ? "bg-red-100 text-red-700"
        : status === "Refunded"
          ? "bg-red-100 text-red-700"
          : status === "Refund"
            ? "bg-blue-100 text-blue-700"
            : status === "Refund Requested"
              ? "bg-orange-100 text-orange-700"
          : status === "Inactive"
            ? "bg-gray-100 text-gray-700"
          : "bg-red-100 text-red-700";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tone}`}>{status}</span>
  );
}

export default StatusPill;
