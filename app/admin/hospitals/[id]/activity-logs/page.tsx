"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { FiClock } from "react-icons/fi";
import { getHospitalById } from "@/libs/hospital";

export default function HospitalActivityLogsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const hospital = id ? getHospitalById(id) : undefined;

  const rows = useMemo(() => hospital?.activityLogsList ?? [], [hospital]);

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
          <h2 className="text-xl font-bold">Activity Timeline</h2>
          <p className="text-sm text-gray-600">Audit log of all hospital actions and changes</p>
        </div>

        <div className="p-5">
          <div className="divide-y divide-blue-100">
            {rows.length ? (
              rows.map((r) => (
                <div key={r.id} className="py-5 flex gap-4">
                  <div className="pt-1">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                      <FiClock />
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">{r.title}</p>
                        <p className="text-sm text-gray-600 mt-1">By: {r.by}</p>
                        <p className="text-sm text-gray-600 mt-2">{r.message}</p>
                      </div>

                      <div className="shrink-0 text-sm text-gray-500">{r.timestamp}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-gray-500">No activity logs</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
