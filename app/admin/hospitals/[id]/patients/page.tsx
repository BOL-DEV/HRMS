"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { FiSearch } from "react-icons/fi";
import StatusPill from "@/components/StatusPill";
import { formatUsd } from "@/libs/helper";
import { getHospitalById } from "@/libs/hospital";

export default function HospitalPatientsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const hospital = id ? getHospitalById(id) : undefined;

  const [query, setQuery] = useState("");

  const patients = useMemo(() => {
    const seed = hospital?.patientsList ?? [];
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return seed;

    return seed.filter(
      (p) =>
        p.name.toLowerCase().includes(normalizedQuery) ||
        p.email.toLowerCase().includes(normalizedQuery),
    );
  }, [hospital, query]);

  return (
    <div className="space-y-6">
      <div className="max-w-md">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients by name..."
            className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold">Hospital Patients</h2>
          <p className="text-sm text-gray-600">View patient financial summaries and activity</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-600">
              <tr className="border-b border-gray-200">
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Phone</th>
                <th className="p-4 font-semibold">Total Spent</th>
                <th className="p-4 font-semibold">Transactions</th>
                <th className="p-4 font-semibold">Last Transaction</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {patients.length ? (
                patients.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 last:border-0">
                    <td className="p-4 font-medium text-gray-900">{p.name}</td>
                    <td className="p-4 text-gray-700">{p.email}</td>
                    <td className="p-4 text-gray-700">{p.phone}</td>
                    <td className="p-4 font-medium text-gray-900">{formatUsd(p.totalSpent)}</td>
                    <td className="p-4 text-gray-700">{p.transactions}</td>
                    <td className="p-4 text-gray-700">{p.lastTransaction}</td>
                    <td className="p-4">
                      <StatusPill status={p.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    No patients found
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
