"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { FiActivity } from "react-icons/fi";
import { getAgentHospitalImageUrl, getAgentProfile } from "@/libs/agent-auth";
import { getAccessToken } from "@/libs/auth";
import { getFoHospitalImageUrl, getFoProfile } from "@/libs/fo-auth";
import { PLATFORM_LOGO_SRC } from "@/libs/brand";

function useHydrated() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const id = window.setTimeout(onStoreChange, 0);
      return () => window.clearTimeout(id);
    },
    () => true,
    () => false,
  );
}

type Props = {
  title: string;
  isExpanded: boolean;
};

export default function SidebarBrand({ title, isExpanded }: Props) {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const accessToken = useMemo(
    () => (hydrated ? getAccessToken() : null),
    [hydrated],
  );

  const section = pathname.startsWith("/fo")
    ? "fo"
    : pathname.startsWith("/admin")
      ? "admin"
    : pathname.startsWith("/agents")
      ? "agent"
      : "default";

  const profileQuery = useQuery({
    queryKey: [section, "sidebar-profile"],
    queryFn: async () =>
      section === "fo" ? getFoProfile() : getAgentProfile(),
    enabled: Boolean(accessToken && (section === "fo" || section === "agent")),
    staleTime: 1000 * 60 * 5,
  });

  const hospitalId = profileQuery.data?.data.hospital_id ?? "";

  const hospitalImageQuery = useQuery({
    queryKey: [section, "sidebar-hospital-image", hospitalId],
    queryFn: async () =>
      section === "fo"
        ? getFoHospitalImageUrl(hospitalId)
        : getAgentHospitalImageUrl(hospitalId),
    enabled: Boolean(
      accessToken &&
        hospitalId &&
        (section === "fo" || section === "agent"),
    ),
    staleTime: 1000 * 60 * 10,
  });

  const imageUrl =
    section === "admin" || section === "fo" || section === "agent"
      ? PLATFORM_LOGO_SRC
      : hospitalImageQuery.data?.data.image_url ?? "";

  const displayTitle =
    section === "admin" ? "Platform" : section === "fo" ? "FO" : title;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-white/60 bg-slate-200 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={displayTitle}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-brand-700 to-brand-400 text-white">
            <FiActivity className="text-sm" />
          </div>
        )}
      </div>

      <div className="relative min-w-0 flex-1 overflow-hidden">
        <h1
          className={`whitespace-nowrap text-xl font-bold text-gray-900 transition-all duration-150 ease-out dark:text-slate-100 ${
            isExpanded
              ? "translate-x-0 opacity-100"
              : "md:-translate-x-2 md:opacity-0"
          }`}
        >
          {displayTitle}
        </h1>
        <div
          className={`pointer-events-none absolute text-xl font-bold text-gray-900 transition-all duration-150 ease-out dark:text-slate-100 ${
            isExpanded
              ? "md:-translate-x-2 md:opacity-0"
              : "hidden md:block md:translate-x-0 md:opacity-100"
          }`}
        >
          {displayTitle.charAt(0)}
        </div>
      </div>
    </div>
  );
}
