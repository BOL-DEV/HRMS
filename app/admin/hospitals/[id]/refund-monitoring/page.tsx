"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { formatUsd } from "@/libs/helper";
import { getHospitalById, type HospitalRefundStatus } from "@/libs/hospital";

function RefundStatusTag({ status }: { status: HospitalRefundStatus }) {
  const className =
    status === "pending"
      ? "bg-yellow-100 text-yellow-700"
      : status === "approved"
        ? "bg-blue-100 text-blue-700"
        : "bg-red-100 text-red-700";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${className}`}>
      {status}
    </span>
  );
}

export default function HospitalRefundMonitoringPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const hospital = id ? getHospitalById(id) : undefined;

  const rows = useMemo(() => hospital?.refundRequestsList ?? [], [hospital]);

  if (!hospital) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-xl font-bold">Hospital not found</h2>
        <p className="text-sm text-gray-600">Check the hospital id in the URL.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold">Refund Requests</h2>
          <p className="text-sm text-gray-600">Monitor and manage refund requests</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-600">
              <tr className="border-b border-gray-200">
                <th className="p-4 font-semibold">Refund ID</th>
                <th className="p-4 font-semibold">Patient</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Reason</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Requested</th>
                <th className="p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 last:border-0">
                    <td className="p-4 font-medium text-gray-900">{r.id}</td>
                    <td className="p-4 text-gray-700">{r.patient}</td>
                    <td className="p-4 font-medium text-gray-900">{formatUsd(r.amount)}</td>
                    <td className="p-4 text-gray-700">{r.reason}</td>
                    <td className="p-4">
                      <RefundStatusTag status={r.status} />
                    </td>
                    <td className="p-4 text-gray-700">{r.requested}</td>
                    <td className="p-4">
                      <button className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium shadow-sm">
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    No refund requests
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
