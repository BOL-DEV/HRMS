"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { FiChevronDown, FiSearch } from "react-icons/fi";
import StatusPill from "@/components/StatusPill";
import { formatUsd } from "@/libs/helper";
import { getHospitalById } from "@/libs/hospital";

export default function HospitalAgentsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const hospital = id ? getHospitalById(id) : undefined;

  const [query, setQuery] = useState("");

  const agents = useMemo(() => {
    const seed = hospital?.agentsList ?? [];
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return seed;
    return seed.filter(
      (a) =>
        a.name.toLowerCase().includes(normalizedQuery) ||
        a.email.toLowerCase().includes(normalizedQuery),
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
            placeholder="Search agents by name..."
            className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold">Hospital Agents</h2>
          <p className="text-sm text-gray-600">Manage and monitor agent performance</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-600">
              <tr className="border-b border-gray-200">
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold">Sales</th>
                <th className="p-4 font-semibold">Performance</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.length ? (
                agents.map((a) => (
                  <tr key={a.id} className="border-b border-gray-100 last:border-0">
                    <td className="p-4 font-medium text-gray-900">{a.name}</td>
                    <td className="p-4 text-gray-700">{a.email}</td>
                    <td className="p-4 text-gray-700">{a.role}</td>
                    <td className="p-4 font-medium text-gray-900">{formatUsd(a.sales)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-28 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${a.performance}%` }}
                          />
                        </div>
                        <span className="font-medium text-gray-900">{a.performance}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <StatusPill status={a.status} />
                    </td>
                    <td className="p-4">
                      <button className="inline-flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium bg-white">
                        Activate
                        <FiChevronDown className="text-gray-500" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    No agents found
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
