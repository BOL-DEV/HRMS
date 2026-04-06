"use client";

import { ApiError } from "@/libs/api";
import { getAdminHospitalOverview } from "@/libs/admin-auth";
import { clearAuthTokens, getAccessToken } from "@/libs/auth";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { FiArrowLeft } from "react-icons/fi";
import StatusPill from "@/components/StatusPill";

const tabs = [
  { label: "Overview", href: (id: string) => `/admin/hospitals/${id}` },
  { label: "Agents", href: (id: string) => `/admin/hospitals/${id}/agents` },
  { label: "FOs", href: (id: string) => `/admin/hospitals/${id}/fos` },
  {
    label: "Departments",
    href: (id: string) => `/admin/hospitals/${id}/departments`,
  },
  {
    label: "Transactions",
    href: (id: string) => `/admin/hospitals/${id}/transactions`,
  },
  {
    label: "Receipts",
    href: (id: string) => `/admin/hospitals/${id}/receipts`,
  },
  {
    label: "Activity Logs",
    href: (id: string) => `/admin/hospitals/${id}/activity-logs`,
  },
];

function getStatusLabel(status?: string) {
  return status === "suspended" ? "Suspended" : "Active";
}

export default function HospitalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const accessToken = getAccessToken();
  const id = params?.id ?? "";

  const overviewQuery = useQuery({
    queryKey: ["admin-hospital-overview", id],
    queryFn: () => getAdminHospitalOverview(id),
    enabled: Boolean(accessToken && id),
  });

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    if (!(overviewQuery.error instanceof ApiError)) {
      return;
    }

    if (overviewQuery.error.status === 401) {
      clearAuthTokens();
      router.replace("/login");
      return;
    }

    if (overviewQuery.error.status === 404) {
      router.replace("/admin/hospitals");
    }
  }, [overviewQuery.error, router]);

  const hospital = overviewQuery.data?.data.hospital;

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-slate-950">
      <div className="border-b border-blue-100 bg-blue-50 dark:border-sky-500/10 dark:bg-sky-950/20">
        <div className="px-6 pb-6 pt-4">
          <Link
            href="/admin/hospitals"
            className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-sky-300"
          >
            <FiArrowLeft />
            <span>Back to Hospitals</span>
          </Link>

          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h1 className="truncate text-4xl font-bold text-gray-900 dark:text-slate-100">
                {hospital?.hospital_name ?? "Hospital"}
              </h1>
              <p className="mt-1 text-gray-600 dark:text-slate-400">
                {hospital?.hospital_code ?? id}
              </p>
              {hospital?.address ? (
                <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                  {hospital.address}
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              <StatusPill status={getStatusLabel(hospital?.status)} />
            </div>
          </div>
        </div>
      </div>

      <div className="px-6">
        <div className="mt-4 flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1 dark:bg-slate-900">
          {tabs.map((tab) => {
            const href = tab.href(id);
            const active = pathname === href;

            return (
              <Link
                key={tab.label}
                href={href}
                className={
                  active
                    ? "rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
                    : "rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100"
                }
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="p-6">{children}</div>
    </div>
  );
}
