"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { FiActivity } from "react-icons/fi";
import { getAgentHospitalImageUrl, getAgentProfile } from "@/libs/agent-auth";
import { getAccessToken } from "@/libs/auth";
import { getFoHospitalImageUrl, getFoProfile } from "@/libs/fo-auth";

const PLATFORM_IMAGE_URL =
  "https://res.cloudinary.com/dk8kjrdkx/image/upload/v1777820385/WhatsApp_Image_2026-05-02_at_22.27.20_pjkemm.jpg";

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

export default function HeaderHospitalBrand() {
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
    queryKey: [section, "header-profile"],
    queryFn: async () =>
      section === "fo" ? getFoProfile() : getAgentProfile(),
    enabled: Boolean(accessToken && (section === "fo" || section === "agent")),
    staleTime: 1000 * 60 * 5,
  });

  const hospitalId = profileQuery.data?.data.hospital_id ?? "";

  const hospitalImageQuery = useQuery({
    queryKey: [section, "header-hospital-image", hospitalId],
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

  const brand = useMemo(() => {
    if (section === "admin") {
      return {
        label: "Platform",
        title: "SwiftRev HQ",
        subtitle: "Central operations dashboard",
        imageUrl: PLATFORM_IMAGE_URL,
      };
    }

    const profile = profileQuery.data?.data;
    const imageData = hospitalImageQuery.data?.data;

    if (!profile) {
      return {
        label: section === "fo" ? "FO" : "Agent",
        title: hospitalImageQuery.isLoading ? "Loading hospital..." : "Hospital",
        subtitle: "Connected workspace",
        imageUrl: "",
      };
    }

    return {
      label: section === "fo" ? "FO Workspace" : "Agent Workspace",
      title: imageData?.hospital_name || profile.hospital_name || "Hospital",
      subtitle: profile.hospital_code || "Connected workspace",
      imageUrl: imageData?.image_url ?? "",
    };
  }, [hospitalImageQuery.data, hospitalImageQuery.isLoading, profileQuery.data, section]);

  if (section === "default" || !hydrated || !accessToken) {
    return null;
  }

  return (
    <div className="hidden min-w-0 items-center gap-3 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-blue-50 px-3 py-2 shadow-sm lg:flex dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-white/70 bg-slate-200 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        {brand.imageUrl ? (
          <img
            src={brand.imageUrl}
            alt={brand.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
            <FiActivity className="text-lg" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent" />
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          {brand.label}
        </p>
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
          {brand.title}
        </p>
        <p className="truncate text-xs text-slate-600 dark:text-slate-400">
          {brand.subtitle}
        </p>
      </div>
    </div>
  );
}
