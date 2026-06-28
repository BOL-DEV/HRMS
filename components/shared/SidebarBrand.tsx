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
    : pathname.startsWith("/catalog")
      ? "catalog"
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
    section === "admin" || section === "fo" || section === "agent" || section === "catalog"
      ? PLATFORM_LOGO_SRC
      : hospitalImageQuery.data?.data.image_url ?? "";

  const displayTitle =
    section === "admin"
      ? "Platform"
      : section === "fo"
        ? "FO"
        : section === "catalog"
          ? "Hospital"
          : title;

  return (
    <div className="flex min-w-0 items-center">
      <div
        className={`relative shrink-0 overflow-hidden bg-transparent transition-all duration-150 ease-out ${
          isExpanded ? "h-16 w-full max-w-[220px]" : "h-12 w-12"
        }`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={displayTitle}
            className="h-full w-full scale-170 object-contain px-0 brightness-125 contrast-125 drop-shadow-[0_0_18px_rgba(45,212,191,0.24)]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-brand-700 to-brand-400 text-white">
            <FiActivity className="text-sm" />
          </div>
        )}
      </div>
    </div>
  );
}
