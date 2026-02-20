"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { formatUsd } from "@/libs/helper";
import { getHospitalById, type HospitalTransactionStatus } from "@/libs/hospital";

type StatusFilter = "all" | HospitalTransactionStatus;

function StatusTag({ status }: { status: HospitalTransactionStatus }) {
  const className =
    status === "completed"
      ? "bg-green-100 text-green-700"
      : status === "pending"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${className}`}>
      {status}
    </span>
  );
}

export default function HospitalTransactionsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const hospital = id ? getHospitalById(id) : undefined;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const rows = useMemo(() => {
    const seed = hospital?.transactionsList ?? [];
    if (statusFilter === "all") return seed;
    return seed.filter((t) => t.status === statusFilter);
  }, [hospital, statusFilter]);

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
      <div className="w-full max-w-xs">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium w-full"
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold">Transactions</h2>
          <p className="text-sm text-gray-600">Manage and view all hospital transactions</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-600">
              <tr className="border-b border-gray-200">
                <th className="p-4 font-semibold">Transaction ID</th>
                <th className="p-4 font-semibold">Patient</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Method</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 last:border-0">
                    <td className="p-4 font-medium text-gray-900">{t.id}</td>
                    <td className="p-4 text-gray-700">{t.patient}</td>
                    <td className="p-4 font-medium text-gray-900">{formatUsd(t.amount)}</td>
                    <td className="p-4 text-gray-700">{t.paymentMethod}</td>
                    <td className="p-4">
                      <StatusTag status={t.status} />
                    </td>
                    <td className="p-4 text-gray-700">{t.date}</td>
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
                    No transactions found
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
