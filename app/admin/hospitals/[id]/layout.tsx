"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import StatusPill from "@/components/StatusPill";
import { getHospitalById } from "@/libs/hospital";

const tabs = [
  { label: "Overview", href: (id: string) => `/admin/hospitals/${id}` },
  { label: "Agents", href: (id: string) => `/admin/hospitals/${id}/agents` },
  { label: "Patients", href: (id: string) => `/admin/hospitals/${id}/patients` },
  { label: "Transactions", href: (id: string) => `/admin/hospitals/${id}/transactions` },
  {
    label: "Refund Monitoring",
    href: (id: string) => `/admin/hospitals/${id}/refund-monitoring`,
  },
  { label: "Activity Logs", href: (id: string) => `/admin/hospitals/${id}/activity-logs` },
  { label: "Settings", href: (id: string) => `/admin/hospitals/${id}/settings` },
];

export default function HospitalLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const id = params?.id ?? "";

  const hospital = id ? getHospitalById(id) : undefined;

  const name = hospital?.name ?? "Hospital";
  const hospitalId = hospital?.hospitalId ?? id;
  const status = hospital?.status ?? "Active";

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="bg-blue-50 border-b border-blue-100">
        <div className="px-6 pt-4 pb-6">
          <Link href="/admin/hospitals" className="inline-flex items-center gap-2 text-sm text-blue-600">
            <FiArrowLeft />
            <span>Back to Hospitals</span>
          </Link>

          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h1 className="text-4xl font-bold text-gray-900 truncate">{name}</h1>
              <p className="text-gray-600 mt-1">{hospitalId}</p>
            </div>

            <div className="flex items-center gap-3">
              <StatusPill status={status} />
              <button className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-sm font-medium">
                Suspend Hospital
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6">
        <div className="mt-4 rounded-xl bg-gray-100 p-1 flex flex-wrap gap-1">
          {tabs.map((t) => {
            const href = t.href(id);
            const active = pathname === href;
            return (
              <Link
                key={t.label}
                href={href}
                className={
                  active
                    ? "bg-white text-gray-900 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm"
                    : "text-gray-700 hover:text-gray-900 rounded-lg px-4 py-2 text-sm font-semibold"
                }
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="p-6">{children}</div>
    </div>
  );
}
