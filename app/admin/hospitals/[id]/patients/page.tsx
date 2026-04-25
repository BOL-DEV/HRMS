"use client";

import AdminPageError from "@/components/AdminPageError";
import { ApiError } from "@/libs/api";
import { getAdminHospitalPatientSearch } from "@/libs/admin-auth";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import { formatDateTime } from "@/libs/helper";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";

export default function HospitalPatientsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const accessToken = getAccessToken();
  const hospitalId = params?.id ?? "";
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());

  const queryIsNumeric = useMemo(
    () => (deferredQuery ? /^\d+$/.test(deferredQuery) : false),
    [deferredQuery],
  );

  const searchQuery = useQuery({
    queryKey: ["admin-hospital-patient-search-page", hospitalId, deferredQuery],
    queryFn: () =>
      getAdminHospitalPatientSearch(hospitalId, {
        query: deferredQuery,
        limit: 20,
      }),
    enabled: Boolean(accessToken && hospitalId && deferredQuery && queryIsNumeric),
  });

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    if (!(searchQuery.error instanceof ApiError)) {
      return;
    }

    if (searchQuery.error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
      return;
    }

    if (searchQuery.error.status === 404) {
      router.replace("/admin/hospitals");
    }
  }, [router, searchQuery.error]);

  const rows = searchQuery.data?.data.patients ?? [];

  return (
    <div className="space-y-6">
      {searchQuery.error instanceof Error ? (
        <AdminPageError message={searchQuery.error.message} />
      ) : null}

      <div className="max-w-md">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type patient ID digits (numbers only)"
            inputMode="numeric"
            className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        {query.trim() && !/^\d+$/.test(query.trim()) ? (
          <p className="mt-2 text-xs text-red-600 dark:text-red-300">
            Patient search supports numbers only.
          </p>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-gray-200 p-5 dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
            Patient Search
          </h2>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Use this to find a patient ID, then filter transactions with the exact value.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-600 dark:text-slate-300">
              <tr className="border-b border-gray-200 dark:border-slate-800">
                <th className="p-4 font-semibold">Patient</th>
                <th className="p-4 font-semibold">Patient ID</th>
                <th className="p-4 font-semibold">Phone</th>
                <th className="p-4 font-semibold">Updated</th>
              </tr>
            </thead>
            <tbody>
              {searchQuery.isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-slate-400">
                    Searching...
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((patient) => (
                  <tr
                    key={patient.id}
                    className="border-b border-gray-100 last:border-0 dark:border-slate-800"
                  >
                    <td className="p-4 font-medium text-gray-900 dark:text-slate-100">
                      {patient.patient_name}
                    </td>
                    <td className="p-4 font-semibold text-gray-900 dark:text-slate-100">
                      {patient.patient_id}
                    </td>
                    <td className="p-4 text-gray-700 dark:text-slate-300">
                      {patient.phone_number}
                    </td>
                    <td className="p-4 text-gray-700 dark:text-slate-300">
                      {formatDateTime(patient.updated_at)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-slate-400">
                    {query.trim() ? "No patients found." : "Start typing a patient ID to search."}
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
