"use client";

import AdminSearchField from "@/components/AdminSearchField";
import Header from "@/components/Header";
import { ApiError } from "@/libs/api";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import { getFoDepartments } from "@/libs/fo-auth";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function FoDepartmentsPage() {
  const router = useRouter();
  const accessToken = getAccessToken();
  const [search, setSearch] = useState("");

  const departmentsQuery = useQuery({
    queryKey: ["fo-departments-page", search],
    queryFn: () => getFoDepartments(search.trim() || undefined),
    enabled: Boolean(accessToken),
  });

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    if (!(departmentsQuery.error instanceof ApiError)) {
      return;
    }

    if (departmentsQuery.error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
    }
  }, [departmentsQuery.error, router]);

  const rows = useMemo(
    () => departmentsQuery.data?.data.departments ?? [],
    [departmentsQuery.data?.data.departments],
  );

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-slate-950">
      <Header
        title="Departments"
        Subtitle="Browse hospital departments available to the FO workspace"
      />

      <div className="space-y-6 p-6">
        {departmentsQuery.error instanceof Error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {departmentsQuery.error.message}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
              Total Departments
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-slate-100">
              {departmentsQuery.isLoading
                ? "--"
                : departmentsQuery.data?.data.total_departments ?? 0}
            </h2>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
              Search Departments
            </p>
            <div className="mt-3">
              <AdminSearchField
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search departments"
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-gray-200 p-5 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
              Department Directory
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Read-only department list from the FO department endpoint.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                  <th className="p-3 font-semibold">Department</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Created</th>
                  <th className="p-3 font-semibold">Updated</th>
                </tr>
              </thead>
              <tbody>
                {departmentsQuery.isLoading ? (
                  <tr>
                    <td
                      className="p-4 text-gray-500 dark:text-slate-400"
                      colSpan={4}
                    >
                      Loading departments...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      className="p-4 text-gray-500 dark:text-slate-400"
                      colSpan={4}
                    >
                      No departments found for the current search.
                    </td>
                  </tr>
                ) : (
                  rows.map((department) => (
                    <tr
                      key={department.department_id}
                      className="border-b border-gray-100 dark:border-slate-800"
                    >
                      <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                        {department.name}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {department.is_active ? "Active" : "Inactive"}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {department.created_at}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-slate-300">
                        {department.updated_at}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
